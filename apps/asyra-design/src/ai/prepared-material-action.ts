import lodash from 'lodash'
import { requireMutationReceipt } from './basic-api-results'
import { subscribeToFileLoadComplete } from '@asyra/core'
import { PropertyTypes, type FillGradientData } from '@asyra/utils'
import {
  AiToolContractError,
  runAiMutation,
  type AiActionDefinition
} from '@asyra/ai-agent-runtime'
import core from '../contexts'
import { fillApis } from '../common-apis/fills'
import { AiActionNames } from '../constants'
import { isDesignGradient, designInlineFillSchema } from './design-fill'
import {
  actionToolSemantics,
  toolResultCount,
  toolResultObject,
  toolResultStatus,
  toolResultIds
} from './tool-contract'

interface MaterialProvenance {
  geometry: unknown
  binding: unknown
}
export interface PreparedMaterialInput {
  rootId: string
  updates: { elementId: string; gradient: FillGradientData; color: string }[]
}
const placementFields = [
  'x',
  'y',
  'rotation',
  'scaleX',
  'scaleY',
  'skewX',
  'skewY'
] as const

/** Explain one dependency difference without returning an entire geometry snapshot. */
const describeDifference = (
  expected: unknown,
  current: unknown,
  path: string
): string => {
  if (typeof expected === 'number' && typeof current === 'number') {
    return `${path}: expected ${expected}, current ${current}, delta ${current - expected}`
  }
  if (
    expected &&
    current &&
    typeof expected === 'object' &&
    typeof current === 'object'
  ) {
    const before = expected as Record<string, unknown>
    const after = current as Record<string, unknown>
    for (const key of new Set([
      ...Object.keys(before),
      ...Object.keys(after)
    ])) {
      if (!lodash.isEqual(before[key], after[key])) {
        return describeDifference(
          before[key],
          after[key],
          `${path}.${key.slice(0, 128)}`
        )
      }
    }
  }
  return `${path} differs`
}

/** Group normalization changes local translations, not canonical world geometry. */
const sameNormalizedGeometry = (before: unknown, after: unknown): boolean => {
  if (lodash.isEqual(before, after)) {
    return true
  }
  const record = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value)
  if (
    !record(before) ||
    !record(after) ||
    !record(before.computed) ||
    !record(after.computed) ||
    !Array.isArray(before.placements) ||
    !Array.isArray(after.placements) ||
    !before.placements.length ||
    before.placements.length !== after.placements.length
  ) {
    return false
  }
  const original = [before.computed, before.placements[0]]
  const current = [after.computed, after.placements[0]]
  if (
    [...original, ...current].some(
      (value) =>
        !record(value) ||
        !Number.isFinite(value.x) ||
        !Number.isFinite(value.y) ||
        ['skewX', 'skewY'].some(
          (key) => value[key] !== undefined && value[key] !== 0
        ) ||
        ['scaleX', 'scaleY'].some(
          (key) => value[key] !== undefined && value[key] !== 1
        )
    )
  ) {
    return false
  }
  if (
    (original[1].rotation ?? 0) !== 0 ||
    (current[1].rotation ?? 0) !== 0 ||
    (original[0].rotation ?? 0) !== (current[0].rotation ?? 0)
  ) {
    return false
  }
  for (const axis of ['x', 'y']) {
    const a = original.reduce((sum, value) => sum + Number(value[axis]), 0)
    const b = current.reduce((sum, value) => sum + Number(value[axis]), 0)
    if (
      Math.abs(a - b) >
      64 * Number.EPSILON * Math.max(1, Math.abs(a), Math.abs(b))
    ) {
      return false
    }
  }
  const normalized = original.map((value, i) => ({
    ...value,
    x: current[i].x,
    y: current[i].y
  }))
  return lodash.isEqual(
    {
      ...before,
      computed: normalized[0],
      placements: [normalized[1], ...before.placements.slice(1)]
    },
    after
  )
}

const readProvenance = (elementId: string): MaterialProvenance | null => {
  const element = core.getElementMetadata(elementId)
  const workspace = core.getCurrentWorkspaceId()
  if (!element || element.lock || !workspace) {
    return null
  }
  const parents: string[] = []
  let id = element.parentId
  while (id !== workspace) {
    if (!id || parents.includes(id)) {
      return null
    }
    parents.push(id)
    const parent = core.getElementMetadata(id)
    if (!parent || parent.lock) {
      return null
    }
    id = parent.parentId
  }
  const computed = core.getElementComputedData(elementId, [
    ...placementFields,
    'width',
    'height',
    'points',
    'segments',
    'networks',
    'closed',
    'fillRule',
    'pointCoordinateSpace'
  ])
  if (!computed) {
    return null
  }
  // The document's local placements and ancestry determine its world placement.
  // Never use viewport-dependent render round trips as a validity authority.
  const placements = parents.map((parentId) =>
    core.getElementComputedData(parentId, placementFields)
  )
  if (placements.some((placement) => !placement)) {
    return null
  }
  const [root] = core.readElementPropertyTargets([
    { elementId, propertyName: PropertyTypes.FILLS, path: [] }
  ])
  const child = root.children[0]
  if (!child) {
    return null
  }
  const [row] = core.readElementPropertyTargets([
    {
      elementId,
      propertyName: PropertyTypes.FILLS,
      path: [{ key: child.key, childId: child.childId }]
    }
  ])
  return {
    geometry: {
      workspace,
      type: element.type,
      parentId: element.parentId,
      parents,
      computed,
      placements
    },
    binding: {
      root: root.propertyId,
      rootSource: root.sourceId,
      child: child.childId,
      property: row.propertyId,
      source: row.sourceId
    }
  }
}

/** Original creation provenance only; canonical values and transaction ownership stay with Core. */
export const createPreparedMaterialApplication = (
  apis: {
    read: (id: string) => MaterialProvenance | null
    update: typeof fillApis.updateFillsAtIndex
  } = { read: readProvenance, update: fillApis.updateFillsAtIndex }
) => {
  const sources = new Map<
    string,
    { signal: AbortSignal; members: Map<string, MaterialProvenance> }
  >()
  let stop: (() => void) | undefined
  const releaseFor = (signal: AbortSignal) => {
    for (const [id, source] of sources) {
      if (source.signal === signal) {
        sources.delete(id)
      }
    }
  }
  const action: AiActionDefinition<PreparedMaterialInput> = {
    ...actionToolSemantics(
      AiActionNames.APPLY_PREPARED_MATERIAL,
      toolResultObject({
        status: toolResultStatus,
        changed: { type: 'boolean' },
        acceptedIds: toolResultIds,
        unavailableIds: toolResultIds,
        appliedCount: {
          ...toolResultCount,
          description:
            'Accepted target count, including legal no-op targets; changed reports aggregate document mutation.'
        },
        appliedElementIds: toolResultIds,
        materialProvenance: toolResultObject({
          status: { enum: ['available', 'unavailable'] },
          unavailableElementIds: toolResultIds
        })
      })
    ),
    revision: 3,
    name: AiActionNames.APPLY_PREPARED_MATERIAL,
    description:
      'Apply compiled world-material values only to their original creation members after canonical document geometry and binding checks, independent of viewport zoom or pan. Reports the changed dependency on rejection; numerical diagnostics do not authorize stale-source application. Preserves geometry and unrelated owners through local Fill overrides; does not approve visual quality. Uses request-local preparation provenance; reload requires fresh explicit source preparation.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['rootId', 'updates'],
      properties: {
        rootId: { type: 'string', minLength: 1 },
        updates: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['elementId', 'gradient', 'color'],
            properties: {
              elementId: { type: 'string', minLength: 1 },
              gradient: designInlineFillSchema.anyOf[1],
              color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' }
            }
          }
        }
      }
    },
    execute: async ({ rootId, updates }, context) => {
      context.signal.throwIfAborted()
      return runAiMutation(context, () => {
        context.signal.throwIfAborted()
        const source = (() => {
          try {
            const source = sources.get(rootId)
            if (!source || source.signal !== context.signal) {
              throw new Error(
                'Original material provenance is unavailable in this request.'
              )
            }
            if (
              !updates.length ||
              new Set(updates.map((item) => item.elementId)).size !==
                updates.length
            ) {
              throw new Error('Material targets must be nonempty and unique.')
            }
            for (const item of updates) {
              const expected = source.members.get(item.elementId)
              if (!expected) {
                throw new Error(
                  `Material member ${item.elementId} has no retained creation provenance; do not replay creation.`
                )
              }
              const current = apis.read(item.elementId)
              if (!current) {
                throw new Error(
                  `Material member ${item.elementId} is unavailable or no longer editable; inspect current membership and permissions before continuing.`
                )
              }
              for (const dependency of ['geometry', 'binding'] as const) {
                if (
                  !lodash.isEqual(expected[dependency], current[dependency])
                ) {
                  throw new Error(
                    `Material member ${item.elementId} changed ${dependency}: ${describeDifference(expected[dependency], current[dependency], dependency)}. Inspect current source before choosing a correction; preparing the retained recipe again does not refresh provenance. Do not replay completed edits.`
                  )
                }
              }
              if (
                !isDesignGradient(item.gradient) ||
                !/^#[0-9a-fA-F]{6}$/.test(item.color)
              ) {
                throw new Error('Invalid prepared material value.')
              }
            }
            return source
          } catch (error) {
            throw new AiToolContractError(
              'input',
              error instanceof Error ? error.message : String(error)
            )
          }
        })()
        const ids = updates.map((item) => item.elementId)
        const mutation = requireMutationReceipt(
          apis.update(
            ids,
            0,
            updates.map(({ gradient, color }) => ({
              kind: 'gradient',
              gradient,
              color
            })),
            { undoable: true, sharedDelivery: 'immediate' }
          ),
          ids
        )
        // A canonical local override may allocate a new binding. Retain only that
        // accepted relation change; never silently bless an unexpected geometry change.
        const unavailableElementIds: string[] = []
        for (const id of mutation.acceptedIds) {
          try {
            const current = apis.read(id)
            if (
              current &&
              lodash.isEqual(current.geometry, source.members.get(id)?.geometry)
            ) {
              source.members.set(id, structuredClone(current))
              continue
            }
          } catch {
            // The mutation already committed. Retire only the unusable provenance;
            // a read failure must not report the write as failed or invite replay.
          }
          source.members.delete(id)
          unavailableElementIds.push(id)
        }
        return {
          ...mutation,
          appliedCount: mutation.acceptedIds.length,
          appliedElementIds: mutation.acceptedIds,
          materialProvenance: {
            status: unavailableElementIds.length ? 'unavailable' : 'available',
            unavailableElementIds
          }
        }
      })
    }
  }
  return {
    action,
    capture(
      rootId: string,
      ids: readonly string[],
      signal: AbortSignal,
      continuation = false
    ) {
      signal.throwIfAborted()
      if (!ids.length && (!continuation || !sources.has(rootId))) {
        return
      }
      const members = new Map<string, MaterialProvenance>()
      const earlier = sources.get(rootId)
      if (continuation && earlier) {
        if (earlier.signal !== signal || earlier.signal.aborted) {
          throw new Error('Material continuation belongs to another request.')
        }
        for (const [id, expected] of earlier.members) {
          const current = apis.read(id)
          if (
            !current ||
            !lodash.isEqual(current.binding, expected.binding) ||
            !sameNormalizedGeometry(expected.geometry, current.geometry)
          ) {
            throw new Error(
              'Earlier material geometry or binding changed during continuation.'
            )
          }
          members.set(id, structuredClone(current))
        }
      }
      for (const id of ids) {
        const value = apis.read(id)
        if (!value) {
          throw new Error('Material creation provenance is unavailable.')
        }
        members.set(id, structuredClone(value))
      }
      sources.set(rootId, { signal, members })
      if (!stop) {
        const subscription = subscribeToFileLoadComplete(() => sources.clear())
        stop = () => subscription.unsubscribe()
      }
    },
    releaseFor,
    dispose() {
      stop?.()
      stop = undefined
      sources.clear()
    }
  }
}

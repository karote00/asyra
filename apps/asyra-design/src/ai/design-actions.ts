import {
  toolResultCount,
  toolResultIds,
  toolResultObject,
  toolResultStatus,
  toolResultString,
  actionToolSemantics
} from './tool-contract'
import {
  subscribeToBrowserDragPhases,
  subscribeToDiagnosticCounters
} from '@asyra/utils'
import {
  AiActionExecutionError,
  AiTransactionSettlementError,
  runAiMutation,
  type AiActionDefinition
} from '@asyra/ai-agent-runtime'
import { yieldToCooperativeHost } from '@asyra/core'
import {
  elementApis,
  hierarchyApis,
  selectionApis,
  type PreparedElementDescriptor
} from '../common-apis'
import { AiActionNames } from '../constants'
import core from '../contexts'
import { admitPreparedDesign } from './prepared-design-admission'
import {
  preparedAttachmentEvidenceSchema,
  type PreparedAttachmentEvidence
} from './inspection-evidence'
import type { PreparedDesign } from './prepared-design'
import type { createPreparedMaterialApplication } from './prepared-material-action'
import {
  PREPARED_DRAWING_SLICE_ELEMENT_BUDGET,
  PREPARED_DRAWING_SLICE_POINT_BUDGET
} from './prepared-drawing-artifact'

export interface PreparedDesignApis {
  getWorkspaceId(): string | null
  getElementType(id: string): string | undefined
  getElementMetadata(
    id: string
  ): { type: string; parentId?: string } | undefined
  getPlacement?(id: string): Readonly<Record<string, unknown>> | undefined
  isContainerType(type: string): boolean
  isLocked(id: string): boolean
  create(
    descriptors: readonly PreparedElementDescriptor[],
    parentId: string
  ): readonly string[] | null
  select(ids: string[]): void
}
const mutationOptions = Object.freeze({
  sharedDelivery: 'immediate',
  undoable: true
} as const)
const defaultApis: PreparedDesignApis = {
  getWorkspaceId: hierarchyApis.getWorkspaceId,
  getElementType: (id) => core.getElementMetadata(id)?.type,
  getElementMetadata: (id) => core.getElementMetadata(id),
  getPlacement: (id) =>
    core.getElementComputedData(id, [
      'x',
      'y',
      'rotation',
      'scaleX',
      'scaleY',
      'skewX',
      'skewY'
    ]),
  isContainerType: elementApis.isContainerType,
  isLocked: (id) => core.getElementMetadata(id)?.lock === true,
  create: (ds, id) =>
    elementApis.createElementsInParent(ds, id, mutationOptions),
  select: (ids) => selectionApis.selectElements(ids, mutationOptions)
}
export const createPreparedDesignAction = (
  apis: PreparedDesignApis = defaultApis,
  yieldToHost: () => Promise<void> = yieldToCooperativeHost,
  now: () => number = () => performance.now(),
  evidence?: { isCurrent(stamp: unknown): boolean },
  material?: Pick<
    ReturnType<typeof createPreparedMaterialApplication>,
    'capture'
  >
): AiActionDefinition<{
  design: PreparedDesign
  parentId?: string
  response?: 'compact' | 'full'
  attachmentEvidence?: PreparedAttachmentEvidence
  materialElementIds?: string[]
}> => ({
  ...actionToolSemantics(AiActionNames.APPLY_PREPARED_DESIGN, {
    allOf: [
      toolResultObject(
        {
          status: toolResultStatus,
          compositionId: toolResultString,
          timing: { type: 'object' },
          materialProvenance: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { enum: ['available', 'unavailable'] },
              message: { type: 'string' }
            }
          }
        },
        ['status', 'compositionId', 'timing']
      ),
      {
        anyOf: [
          {
            required: ['appliedElementCount'],
            properties: { appliedElementCount: toolResultCount }
          },
          {
            required: ['appliedElementIds', 'keyToId', 'roleToElementIds'],
            properties: {
              appliedElementIds: toolResultIds,
              keyToId: {
                type: 'object',
                additionalProperties: toolResultString
              },
              roleToElementIds: {
                type: 'object',
                additionalProperties: toolResultIds
              }
            }
          }
        ]
      }
    ]
  }),
  name: AiActionNames.APPLY_PREPARED_DESIGN,
  description:
    'Apply a server-prepared editable design with native text, shapes and illustration paths. Use the backend preparation receipt; never invent canonical descriptors.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['design'],
    properties: {
      design: { type: 'object' },
      materialElementIds: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', minLength: 1 }
      },
      attachmentEvidence: preparedAttachmentEvidenceSchema,
      parentId: { type: 'string', minLength: 1 },
      response: { type: 'string', enum: ['compact', 'full'] }
    }
  },
  execute: async (args, context) => {
    const { signal } = context
    if (
      args.response !== undefined &&
      args.response !== 'compact' &&
      args.response !== 'full'
    )
      throw new Error('Invalid design response mode.')
    if (
      args.parentId !== undefined &&
      (typeof args.parentId !== 'string' || !args.parentId.trim())
    )
      throw new Error('Invalid design parent identity.')
    const startedAt = now()
    const design = admitPreparedDesign(args.design)
    const materialIds = args.materialElementIds ?? []
    if (
      new Set(materialIds).size !== materialIds.length ||
      materialIds.some(
        (id) => !design.entries.some((entry) => entry.descriptor.id === id)
      )
    )
      throw new Error('Material members must belong to this prepared design.')
    const admissionMs = now() - startedAt
    const canonicalWork = {
      scope: 'synchronous-core-creation',
      timing: 'inclusive-owner-phases',
      phases: {} as Record<string, { count: number; totalMs: number }>,
      counters: {} as Record<string, number>
    }
    let createMs = 0,
      transactionMs = 0,
      selectionMs = 0,
      validationMs = 0,
      cooperativeYieldMs = 0,
      sliceCount = 0
    const workspaceId = apis.getWorkspaceId()
    if (!workspaceId) throw new Error('The target workspace is unavailable.')
    const targetParentId = args.parentId ?? workspaceId
    const checkAttachment = () => {
      if (args.parentId === undefined || targetParentId === workspaceId) return
      let id: string | undefined = targetParentId
      const visited = new Set<string>()
      while (id !== workspaceId) {
        if (!id || visited.has(id) || apis.isLocked(id))
          throw new Error(
            'The continuation parent is not editable in the current workspace.'
          )
        visited.add(id)
        const element = apis.getElementMetadata(id)
        if (!element || !apis.isContainerType(element.type))
          throw new Error('The continuation parent is not a current container.')
        id = element.parentId
      }
    }
    const continuationOffset = () => {
      if (!design.continuation) return { x: 0, y: 0 }
      const root = apis.getElementMetadata(design.rootId)
      const anchor = design.continuation.anchor
      const member = apis.getElementMetadata(anchor.id)
      const placement = apis.getPlacement?.(design.rootId)
      const memberPlacement = apis.getPlacement?.(anchor.id)
      if (
        root?.type !== 'group' ||
        root.parentId !== targetParentId ||
        member?.parentId !== design.rootId ||
        apis.isLocked(design.rootId) ||
        apis.isLocked(anchor.id) ||
        !placement ||
        !memberPlacement
      )
        throw new Error(
          'The partition continuation root or anchor is unavailable.'
        )
      for (const value of [placement, memberPlacement]) {
        if (
          !Number.isFinite(value.x) ||
          !Number.isFinite(value.y) ||
          ['rotation', 'skewX', 'skewY'].some(
            (key) => value[key] !== undefined && value[key] !== 0
          ) ||
          ['scaleX', 'scaleY'].some(
            (key) => value[key] !== undefined && value[key] !== 1
          )
        )
          throw new Error('The partition continuation placement changed.')
      }
      for (const axis of ['x', 'y'] as const) {
        const actual = Number(placement[axis]) + Number(memberPlacement[axis])
        const tolerance =
          64 *
          Number.EPSILON *
          Math.max(1, Math.abs(anchor[axis]), Math.abs(actual))
        if (Math.abs(actual - anchor[axis]) > tolerance)
          throw new Error(
            'The partition continuation anchor moved; do not replay completed work.'
          )
      }
      return {
        x: Number(design.entries[0].descriptor.x) - Number(placement.x),
        y: Number(design.entries[0].descriptor.y) - Number(placement.y)
      }
    }
    const checkCurrent = (parentId: string) => {
      checkAttachment()
      continuationOffset()
      if (signal.aborted) throw new Error('Design application cancelled.')
      if (
        !workspaceId ||
        apis.getWorkspaceId() !== workspaceId ||
        apis.isLocked(workspaceId) ||
        apis.isLocked(parentId)
      )
        throw new Error(
          'The target workspace is no longer available for editing.'
        )
    }
    checkCurrent(workspaceId ?? '')
    const firstEntry = design.continuation ? 1 : 0
    for (const { descriptor: d } of design.entries.slice(firstEntry)) {
      if (apis.getElementType(d.id) !== undefined)
        throw new Error('A design object already exists.')
    }
    const appliedElementIds: string[] = []
    let appliedElementCount = 0
    let offset = firstEntry
    try {
      while (offset < design.entries.length) {
        const parentId = design.entries[offset].parentId ?? targetParentId
        checkCurrent(parentId)
        const descriptors: PreparedElementDescriptor[] = []
        let points = 0
        while (
          offset < design.entries.length &&
          descriptors.length < PREPARED_DRAWING_SLICE_ELEMENT_BUDGET
        ) {
          const entry = design.entries[offset]
          if ((entry.parentId ?? targetParentId) !== parentId) break
          const count = Object.keys(entry.descriptor.points ?? {}).length
          if (
            descriptors.length &&
            points + count > PREPARED_DRAWING_SLICE_POINT_BUDGET
          )
            break
          if (apis.getElementType(entry.descriptor.id) !== undefined)
            throw new Error('A design object already exists.')
          descriptors.push(entry.descriptor)
          points += count
          offset++
        }
        const transactionStartedAt = now()
        let callbackMs = 0
        await runAiMutation(
          context,
          () => {
            const callbackStartedAt = now()
            checkCurrent(parentId)
            if (appliedElementCount === 0 && args.attachmentEvidence) {
              const attachment = args.attachmentEvidence
              if (
                attachment.workspaceId !== workspaceId ||
                attachment.parentId !== targetParentId
              )
                throw new Error(
                  'Reviewed attachment parent or workspace changed before application.'
                )
              if (!evidence?.isCurrent(attachment.evidence))
                throw new Error(
                  'Reviewed attachment evidence expired before application; review current dependencies.'
                )
            }
            if (
              descriptors.some(
                (descriptor) => apis.getElementType(descriptor.id) !== undefined
              )
            )
              throw new Error('A design object already exists.')
            const createStartedAt = now()
            validationMs += createStartedAt - callbackStartedAt
            const stopPhases = subscribeToBrowserDragPhases(
              (name, durationMs) => {
                const entry = canonicalWork.phases[name] ?? {
                  count: 0,
                  totalMs: 0
                }
                entry.count++
                entry.totalMs += durationMs
                canonicalWork.phases[name] = entry
              }
            )
            const stopCounters = subscribeToDiagnosticCounters(
              (name, value) => {
                canonicalWork.counters[name] =
                  (canonicalWork.counters[name] ?? 0) + value
              }
            )
            try {
              const shift = continuationOffset()
              const values =
                design.continuation && parentId === design.rootId
                  ? descriptors.map((d) => ({
                      ...d,
                      x: Number(d.x) + shift.x,
                      y: Number(d.y) + shift.y
                    }))
                  : descriptors
              return apis.create(values, parentId)
            } finally {
              stopPhases()
              stopCounters()
              createMs += now() - createStartedAt
              callbackMs = now() - callbackStartedAt
            }
          },
          (ids) => {
            if (
              !ids ||
              ids.length !== descriptors.length ||
              ids.some((id, i) => id !== descriptors[i].id)
            )
              throw new Error(
                'Design creation did not preserve its object identities.'
              )
            appliedElementCount += ids.length
            if (args.response !== 'compact') appliedElementIds.push(...ids)
          }
        )
        transactionMs += Math.max(0, now() - transactionStartedAt - callbackMs)
        sliceCount++
        const yieldStartedAt = now()
        await yieldToHost()
        cooperativeYieldMs += now() - yieldStartedAt
      }
      checkCurrent(workspaceId ?? '')
      const selectionStartedAt = now()
      let selectionCallbackMs = 0
      let materialProvenance:
        { status: 'available' | 'unavailable'; message?: string } | undefined
      await runAiMutation(context, () => {
        const callbackStartedAt = now()
        checkCurrent(workspaceId)
        const selectStartedAt = now()
        validationMs += selectStartedAt - callbackStartedAt
        apis.select([design.rootId])
        if (materialIds.length || (design.continuation && material)) {
          try {
            if (!material)
              throw new Error('Material provenance consumer is unavailable.')
            material.capture(
              design.rootId,
              materialIds,
              signal,
              !!design.continuation
            )
            if (materialIds.length) materialProvenance = { status: 'available' }
          } catch (error) {
            materialProvenance = {
              status: 'unavailable',
              message: error instanceof Error ? error.message : String(error)
            }
          }
        }
        selectionMs += now() - selectStartedAt
        selectionCallbackMs = now() - callbackStartedAt
      })
      transactionMs += Math.max(
        0,
        now() - selectionStartedAt - selectionCallbackMs
      )
      const totalMs = now() - startedAt
      const orchestrationMs = Math.max(
        0,
        totalMs -
          admissionMs -
          createMs -
          cooperativeYieldMs -
          transactionMs -
          selectionMs -
          validationMs
      )
      return {
        status: 'complete',
        ...(materialProvenance ? { materialProvenance } : {}),
        timing: {
          canonicalWork,
          admissionMs,
          createMs,
          transactionMs,
          selectionMs,
          validationMs,
          orchestrationMs,
          cooperativeYieldMs,
          totalMs,
          sliceCount,
          elementCount: appliedElementCount
        },
        compositionId: design.rootId,
        ...(args.response === 'compact'
          ? { appliedElementCount }
          : {
              appliedElementIds,
              keyToId: design.keyToId,
              roleToElementIds: Object.fromEntries(
                Object.entries(design.keyToId).map(([key, id]) => [key, [id]])
              )
            })
      }
    } catch (error) {
      if (!appliedElementCount) throw error
      let settlement: 'completed' | 'partial' | 'unknown' =
        appliedElementCount === design.entries.length - firstEntry
          ? 'completed'
          : 'partial'
      if (
        error instanceof AiTransactionSettlementError &&
        error.status === 'unknown'
      )
        settlement = 'unknown'
      throw new AiActionExecutionError(
        'Design application stopped after acknowledged changes. Inspect the retained receipt; do not replay the drawing.',
        {
          settlement,
          result: {
            status: 'partial',
            compositionId: design.rootId,
            appliedElementCount,
            plannedElementCount: design.entries.length - firstEntry,
            appliedRange: {
              start: firstEntry,
              end: firstEntry + appliedElementCount
            },
            ...(args.response === 'compact' ? {} : { appliedElementIds }),
            recovery:
              'Do not replay this artifact or acknowledged mutations. Inspect the current state and retained source before choosing confirmed remaining work.'
          }
        }
      )
    }
  }
})

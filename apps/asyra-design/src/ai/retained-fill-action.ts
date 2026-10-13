import {
  toolResultCount,
  toolResultIds,
  toolRequestReference,
  toolResultObject,
  toolResultStatus,
  actionToolSemantics
} from './tool-contract'
import {
  AiActionExecutionError,
  runAiMutation,
  type AiActionDefinition
} from '@asyra/ai-agent-runtime'
import core from '../contexts'
import { documentContextSchema } from './context-action'
import type { DesignContextQuery } from '../common-apis/design-context'
import { fillApis, type FillPatch } from '../common-apis/fills'
import type { createRetainedDesignContext } from '../common-apis/retained-design-context'
import { AiActionNames } from '../constants'

interface FillMapping {
  snapshotId?: string
  leaseId?: string
  query?: DesignContextQuery
  coordinateSpace: 'parent-local'
  axis: 'x' | 'y'
  domain: number[]
  index: number
  outside: 'clamp' | 'reject'
  stops: { at: number; color: string; opacity?: number }[]
}
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const colorChannels = (color: string) =>
  [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16))

/** Explicit finite interpolation only. Artistic choices remain in the caller's mapping. */
export const createRetainedFillAction = (
  queries: ReturnType<typeof createRetainedDesignContext>,
  apis: {
    metadata: (id: string) => { lock?: boolean; parentId?: string } | undefined
    targets: typeof fillApis.getFillTargetsAtIndex
    update: typeof fillApis.updateFillFieldsBatch
  } = {
    metadata: (id: string) => core.getElementMetadata(id),
    targets: fillApis.getFillTargetsAtIndex,
    update: fillApis.updateFillFieldsBatch
  }
): AiActionDefinition<{ mappings: FillMapping[] }> => ({
  ...actionToolSemantics(
    AiActionNames.MAP_RETAINED_FILLS,
    toolResultObject({
      status: toolResultStatus,
      appliedCount: toolResultCount,
      snapshots: toolResultIds,
      coordinateSpace: { const: 'parent-local' }
    })
  ),
  composition: 'allowed',
  name: AiActionNames.MAP_RETAINED_FILLS,
  description:
    'Apply position-dependent fill colors from a query or retained read_design_context snapshots without exporting rows or resending IDs. Prefer query={scope:ids,elementIds} or query={scope:region,bounds,filter}; required columns are read and consumed internally before one atomic write. For existing snapshots pass snapshotId and its leaseId; caller-owned leases remain retained until explicit release or request settlement. Internally acquired query leases are released by this action. Request x or y columns with delivery=reference only when that result has another consumer. Coordinates are parent-local; choose an explicit domain in that space. Map normalized positions through ordered color stops. All mappings must use the same fill index and disjoint targets; one plural canonical fill call preserves shared-property validation and Undo. Shared fills with conflicting new values reject; detach them explicitly and requery when independent colors are intended.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['mappings'],
    properties: {
      mappings: {
        type: 'array',
        minItems: 1,
        maxItems: 32,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'coordinateSpace',
            'axis',
            'domain',
            'index',
            'outside',
            'stops'
          ],
          oneOf: [{ required: ['snapshotId'] }, { required: ['query'] }],
          properties: {
            query: {
              type: 'object',
              additionalProperties: false,
              required: ['scope'],
              properties: {
                scope: { type: 'string', enum: ['ids', 'region'] },
                elementIds: documentContextSchema.properties.elementIds,
                bounds: documentContextSchema.properties.bounds,
                filter: documentContextSchema.properties.filter
              }
            },
            leaseId: toolRequestReference,
            snapshotId: toolRequestReference,
            coordinateSpace: { type: 'string', enum: ['parent-local'] },
            axis: { type: 'string', enum: ['x', 'y'] },
            domain: {
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: { type: 'number' }
            },
            index: { type: 'integer', minimum: 0 },
            outside: { type: 'string', enum: ['clamp', 'reject'] },
            stops: {
              type: 'array',
              minItems: 2,
              maxItems: 32,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['at', 'color'],
                properties: {
                  at: { type: 'number', minimum: 0, maximum: 1 },
                  color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
                  opacity: { type: 'number', minimum: 0, maximum: 1 }
                }
              }
            }
          }
        }
      }
    }
  },
  execute: async ({ mappings }, context) => {
    const consumedLeases = new Set<string>()
    try {
      return await runAiMutation(context, () => {
        const ids: string[] = []
        const patches: FillPatch[] = []
        const unique = new Set<string>()
        const checkedAncestors = new Set<string>()
        const assertUnlocked = (elementId: string) => {
          const visited = new Set<string>()
          let id: string | undefined = elementId
          while (id && !checkedAncestors.has(id)) {
            if (visited.has(id))
              throw new Error('Target hierarchy contains a cycle.')
            visited.add(id)
            const data = apis.metadata(id)
            if (!data || data.lock)
              throw new Error('Target or parent is unavailable or locked.')
            id = data.parentId
          }
          for (const ancestor of visited) checkedAncestors.add(ancestor)
        }
        if (
          !Array.isArray(mappings) ||
          !mappings.length ||
          mappings.length > 32
        )
          throw new Error('A bounded mappings array is required.')
        const index = mappings[0].index
        for (const mapping of mappings) {
          if (
            !mapping ||
            mapping.coordinateSpace !== 'parent-local' ||
            !['x', 'y'].includes(mapping.axis) ||
            !Number.isSafeInteger(index) ||
            index < 0 ||
            mapping.index !== index ||
            !Array.isArray(mapping.domain) ||
            mapping.domain.length !== 2 ||
            !mapping.domain.every(finite) ||
            mapping.domain[0] >= mapping.domain[1] ||
            !Number.isFinite(mapping.domain[1] - mapping.domain[0]) ||
            !['clamp', 'reject'].includes(mapping.outside)
          )
            throw new Error(
              'Use one fill index and a finite increasing domain in declared parent-local coordinates.'
            )
          const stops = mapping.stops
          if (
            !Array.isArray(stops) ||
            stops.length < 2 ||
            stops.length > 32 ||
            stops[0].at !== 0 ||
            stops.at(-1)?.at !== 1 ||
            stops.some(
              (stop, offset) =>
                !finite(stop.at) ||
                !/^#[0-9a-fA-F]{6}$/.test(stop.color) ||
                (offset > 0 && stop.at <= stops[offset - 1].at) ||
                (stop.opacity !== undefined &&
                  (!finite(stop.opacity) ||
                    stop.opacity < 0 ||
                    stop.opacity > 1))
            ) ||
            stops.some(
              (stop) =>
                (stop.opacity === undefined) !==
                (stops[0].opacity === undefined)
            )
          )
            throw new Error(
              'Provide ordered color stops from 0 to 1; opacity must be specified for all stops or none.'
            )
          if (
            Boolean(mapping.query) === Boolean(mapping.snapshotId) ||
            (mapping.query && mapping.leaseId)
          )
            throw new Error(
              'Provide either a query or a retained snapshot and its lease.'
            )
          let snapshotId = mapping.snapshotId
          let leaseId = mapping.leaseId
          if (mapping.query) {
            const receipt = queries.read(
              {
                ...mapping.query,
                fields: [mapping.axis],
                delivery: 'reference'
              },
              context.signal
            )
            snapshotId = receipt.snapshotId
            leaseId = receipt.leaseId
            if (leaseId) consumedLeases.add(leaseId)
          }
          if (!snapshotId)
            throw new Error('Mapping has no retained snapshot identity')
          const snapshot = queries.get(snapshotId, leaseId, context.signal)
          if (
            snapshot.coordinateSpace !== mapping.coordinateSpace ||
            !snapshot.fields.includes(mapping.axis) ||
            snapshot.result.missingIds.length
          )
            throw new Error(
              'Retained query lacks complete targets or the required position column; read the scope again.'
            )
          const channels = stops.map((stop) => colorChannels(stop.color))
          for (const element of snapshot.result.elements) {
            assertUnlocked(element.id)
            if (unique.has(element.id))
              throw new Error(
                'Targets must exist, be unlocked and occur once across all mappings.'
              )
            const position = element.properties[mapping.axis]
            if (!finite(position))
              throw new Error('Retained position is unavailable or non-finite.')
            let normalized =
              (position - mapping.domain[0]) /
              (mapping.domain[1] - mapping.domain[0])
            if (
              !finite(normalized) ||
              (mapping.outside === 'reject' &&
                (normalized < 0 || normalized > 1))
            )
              throw new Error(
                'Position lies outside the explicit mapping domain.'
              )
            normalized = Math.min(1, Math.max(0, normalized))
            const right = Math.max(
              1,
              stops.findIndex((stop) => stop.at >= normalized)
            )
            const left = right - 1
            const ratio =
              (normalized - stops[left].at) / (stops[right].at - stops[left].at)
            const interpolate = (a: number, b: number) => a + (b - a) * ratio
            patches.push({
              color:
                '#' +
                channels[left]
                  .map((value, channel) =>
                    Math.round(interpolate(value, channels[right][channel]))
                      .toString(16)
                      .padStart(2, '0')
                  )
                  .join(''),
              ...(stops[0].opacity === undefined
                ? {}
                : {
                    opacity: interpolate(
                      Number(stops[left].opacity),
                      Number(stops[right].opacity)
                    )
                  })
            })
            unique.add(element.id)
            ids.push(element.id)
          }
          if (leaseId && consumedLeases.has(leaseId)) {
            queries.releaseLease(leaseId, context.signal)
            consumedLeases.delete(leaseId)
          }
        }
        // Mapping supplies simultaneous values; reject conflicting shared identities before the canonical write.
        const targets = apis.targets(ids, index)
        const sharedValues = new Map<string, FillPatch>()
        const updates = targets.map((target, offset) => {
          const patch = patches[offset]
          const prior = sharedValues.get(target.fillId)
          if (
            prior &&
            (prior.color !== patch.color || prior.opacity !== patch.opacity)
          )
            throw new Error(
              'Conflicting mapped values for a shared fill; detach explicitly and read again.'
            )
          sharedValues.set(target.fillId, patch)
          return { ...target, patch }
        })
        apis.update(updates)
        return {
          status: 'complete',
          appliedCount: ids.length,
          snapshots: mappings.flatMap((mapping) =>
            mapping.snapshotId ? [mapping.snapshotId] : []
          ),
          coordinateSpace: 'parent-local'
        }
      })
    } catch (error) {
      if (context.signal.aborted) throw error
      throw new AiActionExecutionError(
        error instanceof Error ? error.message : 'Retained fill mapping failed.'
      )
    } finally {
      for (const leaseId of consumedLeases)
        queries.releaseLease(leaseId, context.signal)
    }
  }
})

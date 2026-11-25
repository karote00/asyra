import {
  toolResultCount,
  toolDocumentReference,
  toolResultObject,
  toolResultStatus,
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
import {
  originalParentPoint,
  createPreparedSiblings
} from './prepared-group-insertion'
import { yieldToCooperativeHost } from '@asyra/core'
import {
  elementApis,
  hierarchyApis,
  selectionApis,
  type PreparedElementDescriptor
} from '../common-apis'
import { AiActionNames } from '../constants'
import core from '../contexts'
import { admitPreparedDesignDelivery } from './prepared-design-admission'
import {
  preparedAttachmentEvidenceSchema,
  type PreparedAttachmentEvidence
} from './inspection-evidence'
import {
  DesignPreparationLimits,
  type PreparedDesignDelivery
} from './prepared-design'
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
  originalParentPoint?(
    rootId: string,
    parentId: string,
    point: { x: number; y: number }
  ): { x: number; y: number }
  isContainerType(type: string): boolean
  isLocked(id: string): boolean
  create(
    descriptors: readonly PreparedElementDescriptor[],
    parentId: string,
    attachment?: { rootId: string; continuation: boolean }
  ): readonly string[] | null
  select(ids: string[]): void
}
const preparedElementReference = {
  ...toolDocumentReference,
  maxLength: DesignPreparationLimits.identityLength
}
const preparedElementReferences = {
  type: 'array',
  items: preparedElementReference
}

const preparedApplicationView = toolResultObject(
  {
    status: { const: 'complete' },
    compositionId: preparedElementReference,
    appliedElementCount: toolResultCount,
    materialProvenance: toolResultObject(
      {
        status: { enum: ['available', 'unavailable'] },
        message: { type: 'string' }
      },
      ['status']
    )
  },
  ['status', 'compositionId', 'appliedElementCount']
)

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

  originalParentPoint,

  create: (descriptors, parentId, attachment) =>
    createPreparedSiblings(descriptors, parentId, mutationOptions, attachment),

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
  design: PreparedDesignDelivery
  parentId?: string
  attachmentEvidence?: PreparedAttachmentEvidence
  materialElementIds?: string[]
}> => ({
  composition: 'allowed',
  ...actionToolSemantics(AiActionNames.APPLY_PREPARED_DESIGN, {
    allOf: [
      toolResultObject(
        {
          status: toolResultStatus,
          compositionId: preparedElementReference,
          timing: { type: 'object' },
          modelResult: preparedApplicationView,
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
        required: ['appliedElementCount', 'appliedElementIds'],
        properties: {
          appliedElementCount: toolResultCount,
          appliedElementIds: preparedElementReferences,
          keyToId: {
            type: 'object',
            additionalProperties: preparedElementReference
          },
          roleToElementIds: {
            type: 'object',
            additionalProperties: preparedElementReferences
          }
        },
        anyOf: [
          {
            properties: { status: { const: 'complete' } },
            required: ['keyToId', 'roleToElementIds']
          },
          { properties: { status: { const: 'partial' } } }
        ]
      }
    ]
  }),
  revision: 4,
  delivery: { path: '/modelResult', outputSchema: preparedApplicationView },
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
      parentId: toolDocumentReference
    }
  },

  execute: async (args, context) => {
    const { signal } = context

    if (
      args.parentId !== undefined &&
      (typeof args.parentId !== 'string' || !args.parentId.trim())
    ) {
      throw new Error('Invalid design parent identity.')
    }

    const startedAt = now()
    const design = admitPreparedDesignDelivery(args.design)
    const materialIds = args.materialElementIds ?? []

    if (
      new Set(materialIds).size !== materialIds.length ||
      materialIds.some(
        (id) => !design.entries.some((entry) => entry.descriptor.id === id)
      )
    ) {
      throw new Error('Material members must belong to this prepared design.')
    }

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

    if (!workspaceId) {
      throw new Error('The target workspace is unavailable.')
    }

    const targetParentId = args.parentId ?? workspaceId

    const checkAttachment = () => {
      if (args.parentId === undefined || targetParentId === workspaceId) {
        return
      }

      let id: string | undefined = targetParentId
      const visited = new Set<string>()

      while (id !== workspaceId) {
        if (!id || visited.has(id) || apis.isLocked(id)) {
          throw new Error(
            'The continuation parent is not editable in the current workspace.'
          )
        }

        visited.add(id)
        const element = apis.getElementMetadata(id)

        if (!element || !apis.isContainerType(element.type)) {
          throw new Error('The continuation parent is not a current container.')
        }

        id = element.parentId
      }
    }

    const continuationOffset = () => {
      if (!design.continuation) {
        return { x: 0, y: 0 }
      }

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
      ) {
        throw new Error(
          'The partition continuation root or anchor is unavailable.'
        )
      }

      for (const value of [placement, memberPlacement]) {
        if (
          !Number.isFinite(value.x) ||
          !Number.isFinite(value.y) ||
          ['skewX', 'skewY'].some(
            (key) => value[key] !== undefined && value[key] !== 0
          ) ||
          ['scaleX', 'scaleY'].some(
            (key) => value[key] !== undefined && value[key] !== 1
          )
        ) {
          throw new Error('The partition continuation placement changed.')
        }
      }

      if (
        (placement.rotation ?? 0) !== 0 ||
        (memberPlacement.rotation ?? 0) !== (anchor.rotation ?? 0)
      ) {
        throw new Error(
          'The partition continuation rotation changed; do not replay completed work.'
        )
      }

      const localAnchor = {
        x: Number(placement.x) + Number(memberPlacement.x),
        y: Number(placement.y) + Number(memberPlacement.y)
      }
      const originalAnchor =
        apis.originalParentPoint?.(
          design.rootId,
          targetParentId,
          localAnchor
        ) ?? localAnchor

      for (const axis of ['x', 'y'] as const) {
        const actual = originalAnchor[axis]
        const tolerance =
          64 *
          Number.EPSILON *
          Math.max(1, Math.abs(anchor[axis]), Math.abs(actual))

        if (
          !Number.isFinite(actual) ||
          Math.abs(actual - anchor[axis]) > tolerance
        ) {
          throw new Error(
            'The partition continuation anchor moved; do not replay completed work.'
          )
        }
      }

      return {
        x:
          Number(memberPlacement.x) -
          (anchor.x - Number(design.entries[0].descriptor.x)),
        y:
          Number(memberPlacement.y) -
          (anchor.y - Number(design.entries[0].descriptor.y))
      }
    }

    const checkCurrent = (parentId: string) => {
      checkAttachment()
      const shift = continuationOffset()

      if (signal.aborted) {
        throw new Error('Design application cancelled.')
      }

      if (
        !workspaceId ||
        apis.getWorkspaceId() !== workspaceId ||
        apis.isLocked(workspaceId) ||
        apis.isLocked(parentId)
      ) {
        throw new Error(
          'The target workspace is no longer available for editing.'
        )
      }

      return shift
    }

    checkCurrent(workspaceId ?? '')
    const firstEntry = design.continuation ? 1 : 0

    for (const { descriptor: d } of design.entries.slice(firstEntry)) {
      if (apis.getElementType(d.id) !== undefined) {
        throw new Error('A design object already exists.')
      }
    }

    const appliedElementIds: string[] = []
    let appliedElementCount = 0
    let offset = firstEntry

    const timingSnapshot = () => {
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
      }
    }

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

          if ((entry.parentId ?? targetParentId) !== parentId) {
            break
          }

          const count = Object.keys(entry.descriptor.points ?? {}).length

          if (
            descriptors.length &&
            points + count > PREPARED_DRAWING_SLICE_POINT_BUDGET
          ) {
            break
          }

          if (apis.getElementType(entry.descriptor.id) !== undefined) {
            throw new Error('A design object already exists.')
          }

          descriptors.push(entry.descriptor)
          points += count
          offset++
        }

        const transactionStartedAt = now()
        let callbackMs = 0

        try {
          await runAiMutation(
            context,
            () => {
              const callbackStartedAt = now()

              const shift = checkCurrent(parentId)

              if (appliedElementCount === 0 && args.attachmentEvidence) {
                const attachment = args.attachmentEvidence

                if (
                  attachment.workspaceId !== workspaceId ||
                  attachment.parentId !== targetParentId
                ) {
                  throw new Error(
                    'Reviewed attachment parent or workspace changed before application.'
                  )
                }

                if (!evidence?.isCurrent(attachment.evidence)) {
                  throw new Error(
                    'Reviewed attachment evidence expired before application; review current dependencies.'
                  )
                }
              }

              if (
                descriptors.some(
                  (descriptor) =>
                    apis.getElementType(descriptor.id) !== undefined
                )
              ) {
                throw new Error('A design object already exists.')
              }

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
                const values =
                  design.continuation && parentId === design.rootId
                    ? descriptors.map((d) => ({
                        ...d,
                        x: Number(d.x) + shift.x,
                        y: Number(d.y) + shift.y
                      }))
                    : descriptors

                const continuation = Boolean(
                  design.continuation && parentId === design.rootId
                )

                if (
                  continuation ||
                  (parentId === targetParentId &&
                    targetParentId !== workspaceId &&
                    apis.getElementMetadata(parentId)?.type === 'group')
                ) {
                  return apis.create(values, parentId, {
                    rootId: design.rootId,
                    continuation
                  })
                }

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
              ) {
                throw new Error(
                  'Design creation did not preserve its object identities.'
                )
              }

              appliedElementCount += ids.length
              appliedElementIds.push(...ids)
            }
          )
        } finally {
          transactionMs += Math.max(
            0,
            now() - transactionStartedAt - callbackMs
          )
        }

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

      try {
        await runAiMutation(context, () => {
          const callbackStartedAt = now()

          checkCurrent(workspaceId)
          const selectStartedAt = now()

          validationMs += selectStartedAt - callbackStartedAt
          try {
            apis.select([design.rootId])
            if (materialIds.length || (design.continuation && material)) {
              try {
                if (!material) {
                  throw new Error(
                    'Material provenance consumer is unavailable.'
                  )
                }

                material.capture(
                  design.rootId,
                  materialIds,
                  signal,
                  !!design.continuation
                )
                if (materialIds.length) {
                  materialProvenance = { status: 'available' }
                }
              } catch (error) {
                materialProvenance = {
                  status: 'unavailable',
                  message:
                    error instanceof Error ? error.message : String(error)
                }
              }
            }
          } finally {
            selectionMs += now() - selectStartedAt
            selectionCallbackMs = now() - callbackStartedAt
          }
        })
      } finally {
        transactionMs += Math.max(
          0,
          now() - selectionStartedAt - selectionCallbackMs
        )
      }

      const summary = {
        status: 'complete',
        compositionId: design.rootId,
        appliedElementCount,
        ...(materialProvenance ? { materialProvenance } : {})
      }

      return {
        ...summary,
        modelResult: summary,
        timing: timingSnapshot(),
        appliedElementIds,
        keyToId: design.keyToId,
        roleToElementIds: Object.fromEntries(
          Object.entries(design.keyToId).map(([key, id]) => [key, [id]])
        )
      }
    } catch (error) {
      if (!appliedElementCount) {
        throw error
      }

      let settlement: 'completed' | 'partial' | 'unknown' =
        appliedElementCount === design.entries.length - firstEntry
          ? 'completed'
          : 'partial'

      if (
        error instanceof AiTransactionSettlementError &&
        error.status === 'unknown'
      ) {
        settlement = 'unknown'
      }

      throw new AiActionExecutionError(
        'Design application stopped after acknowledged changes. Inspect the retained receipt; do not replay the drawing.',
        {
          settlement,
          result: {
            status: 'partial',
            timing: timingSnapshot(),
            compositionId: design.rootId,
            appliedElementCount,
            plannedElementCount: design.entries.length - firstEntry,
            appliedRange: {
              start: firstEntry,
              end: firstEntry + appliedElementCount
            },
            appliedElementIds,
            recovery:
              'Do not replay this artifact or acknowledged mutations. Inspect the current state and retained source before choosing confirmed remaining work.'
          }
        }
      )
    }
  }
})

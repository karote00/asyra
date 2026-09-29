import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { yieldToCooperativeHost } from '@asyra/core'
import {
  elementApis,
  hierarchyApis,
  selectionApis,
  type PreparedElementDescriptor
} from '../common-apis'
import { AiActionNames } from '../constants'
import { admitPreparedDesign } from './prepared-design-admission'
import type { PreparedDesign } from './prepared-design'
import {
  PREPARED_DRAWING_SLICE_ELEMENT_BUDGET,
  PREPARED_DRAWING_SLICE_POINT_BUDGET
} from './prepared-drawing-artifact'

export interface PreparedDesignApis {
  getWorkspaceId(): string | null
  getElementType(id: string): string | undefined
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
  getElementType: elementApis.getElementType,
  isLocked: elementApis.isElementLocked,
  create: (ds, id) =>
    elementApis.createElementsInParent(ds, id, mutationOptions),
  select: (ids) => selectionApis.selectElements(ids, mutationOptions)
}
export const createPreparedDesignAction = (
  apis: PreparedDesignApis = defaultApis,
  yieldToHost: () => Promise<void> = yieldToCooperativeHost,
  now: () => number = () => performance.now()
): AiActionDefinition<{
  design: PreparedDesign
  response?: 'compact' | 'full'
}> => ({
  name: AiActionNames.APPLY_PREPARED_DESIGN,
  description:
    'Apply a server-prepared editable design with native text, shapes and illustration paths. Use the backend preparation receipt; never invent canonical descriptors.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['design'],
    properties: {
      design: { type: 'object' },
      response: { type: 'string', enum: ['compact', 'full'] }
    }
  },
  execute: async (args, { signal }) => {
    if (
      args.response !== undefined &&
      args.response !== 'compact' &&
      args.response !== 'full'
    )
      throw new Error('Invalid design response mode.')
    const startedAt = now()
    const design = admitPreparedDesign(args.design)
    const admissionMs = now() - startedAt
    let createMs = 0,
      cooperativeYieldMs = 0,
      sliceCount = 0
    const workspaceId = apis.getWorkspaceId()
    if (!workspaceId) throw new Error('The target workspace is unavailable.')
    const checkCurrent = (parentId: string) => {
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
    for (const { descriptor: d } of design.entries) {
      if (apis.getElementType(d.id) !== undefined)
        throw new Error('A design object already exists.')
    }
    const appliedElementIds: string[] = []
    let appliedElementCount = 0
    let offset = 0
    while (offset < design.entries.length) {
      const parentId = design.entries[offset].parentId ?? workspaceId
      checkCurrent(parentId)
      const descriptors: PreparedElementDescriptor[] = []
      let points = 0
      while (
        offset < design.entries.length &&
        descriptors.length < PREPARED_DRAWING_SLICE_ELEMENT_BUDGET
      ) {
        const entry = design.entries[offset]
        if ((entry.parentId ?? workspaceId) !== parentId) break
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
      const createStartedAt = now()
      const ids = apis.create(descriptors, parentId)
      createMs += now() - createStartedAt
      sliceCount++
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
      const yieldStartedAt = now()
      await yieldToHost()
      cooperativeYieldMs += now() - yieldStartedAt
    }
    checkCurrent(workspaceId ?? '')
    apis.select([design.rootId])
    return {
      status: 'complete',
      timing: {
        admissionMs,
        createMs,
        cooperativeYieldMs,
        totalMs: now() - startedAt,
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
  }
})

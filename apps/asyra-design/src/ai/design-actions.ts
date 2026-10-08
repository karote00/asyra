import { runAiMutation, type AiActionDefinition } from '@asyra/ai-agent-runtime'
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
import type { PreparedDesign } from './prepared-design'
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
  isContainerType: elementApis.isContainerType,
  isLocked: (id) => core.getElementMetadata(id)?.lock === true,
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
  parentId?: string
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
    const admissionMs = now() - startedAt
    let createMs = 0,
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
    const checkCurrent = (parentId: string) => {
      checkAttachment()
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
      const ids = await runAiMutation(context, () => {
        checkCurrent(parentId)
        if (
          descriptors.some(
            (descriptor) => apis.getElementType(descriptor.id) !== undefined
          )
        )
          throw new Error('A design object already exists.')
        const createStartedAt = now()
        try {
          return apis.create(descriptors, parentId)
        } finally {
          createMs += now() - createStartedAt
        }
      })
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
    await runAiMutation(context, () => {
      checkCurrent(workspaceId)
      apis.select([design.rootId])
    })
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

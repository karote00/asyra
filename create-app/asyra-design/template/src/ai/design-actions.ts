import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { waitForCooperativePaint } from '@asyra/core'
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
  paint: () => Promise<void> = waitForCooperativePaint
): AiActionDefinition<{ design: PreparedDesign }> => ({
  name: AiActionNames.APPLY_PREPARED_DESIGN,
  description:
    'Apply a server-prepared editable design with native text, shapes and illustration paths. Use the backend preparation receipt; never invent canonical descriptors.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['design'],
    properties: { design: { type: 'object' } }
  },
  execute: async (args, { signal }) => {
    const design = admitPreparedDesign(args.design)
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
      const ids = apis.create(descriptors, parentId)
      if (
        !ids ||
        ids.length !== descriptors.length ||
        ids.some((id, i) => id !== descriptors[i].id)
      )
        throw new Error(
          'Design creation did not preserve its object identities.'
        )
      appliedElementIds.push(...ids)
      await paint()
    }
    checkCurrent(workspaceId ?? '')
    apis.select([design.rootId])
    return {
      status: 'complete',
      compositionId: design.rootId,
      appliedElementIds,
      keyToId: design.keyToId,
      roleToElementIds: Object.fromEntries(
        Object.entries(design.keyToId).map(([key, id]) => [key, [id]])
      )
    }
  }
})

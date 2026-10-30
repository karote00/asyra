import { runTransaction } from '@asyra/core'
import {
  groupElements,
  moveElementsWithGroupGeometry,
  ungroupElement
} from '@asyra/preset'
import type {
  ElementRawData,
  EVENT_OPTIONS,
  MoveHierarchyRequest,
  MoveHierarchyResult,
  RemoveSubtreeResult
} from '@asyra/utils'
import { UI_PROPERTIES } from '../constants/ui-properties'
import core from '../contexts'

export const hierarchyApis = {
  getWorkspaceId: (): string | null => {
    const workspaceId = core.getCurrentWorkspaceId()
    return typeof workspaceId === 'string' && workspaceId.length > 0
      ? workspaceId
      : null
  },

  getFlattenedElementIds: (): string[] =>
    core.getUIProperty<string[]>(UI_PROPERTIES.FLATTENED_ELEMENT_IDS) ?? [],

  getElementDataMap: (): Record<string, Partial<ElementRawData>> =>
    core.getUIProperty<Record<string, Partial<ElementRawData>>>(
      UI_PROPERTIES.ELEMENT_DATA_MAP
    ) ?? {},

  groupElements: (elementIds: readonly string[], options?: EVENT_OPTIONS) =>
    groupElements(core, elementIds, options),

  ungroupElement: (groupId: string, options?: EVENT_OPTIONS) =>
    ungroupElement(core, groupId, options),

  moveElements: (
    request: MoveHierarchyRequest,
    options?: EVENT_OPTIONS
  ): MoveHierarchyResult =>
    moveElementsWithGroupGeometry(core, request, options),

  moveElementsRelative: (
    request: {
      elementIds: string[]
      anchorId: string
      placement: 'before' | 'after'
    },
    options?: EVENT_OPTIONS
  ): MoveHierarchyResult => {
    if (
      !request ||
      !Array.isArray(request.elementIds) ||
      !request.elementIds.length ||
      !['before', 'after'].includes(request.placement) ||
      request.elementIds.includes(request.anchorId)
    )
      throw new Error(
        'Relative move requires targets and a separate before/after anchor'
      )
    const anchor = core.getElementMetadata(request.anchorId)
    if (!anchor?.parentId)
      throw new Error('Relative move anchor is unavailable')
    const parent = core.getElementMetadata(anchor.parentId)
    if (!parent?.childCount)
      throw new Error('Relative move parent is unavailable')
    const siblings = core.getElementChildren(
      anchor.parentId,
      0,
      parent.childCount
    ).elementIds
    const moving = new Set(request.elementIds)
    const anchorIndex = siblings
      .filter((id) => !moving.has(id))
      .indexOf(request.anchorId)
    if (anchorIndex < 0)
      throw new Error('Relative move anchor is not a current child')
    return moveElementsWithGroupGeometry(
      core,
      {
        elementIds: request.elementIds,
        targetParentId: anchor.parentId,
        targetIndex: anchorIndex + (request.placement === 'after' ? 1 : 0)
      },
      options
    )
  },

  removeSubtree: (
    elementId: string,
    options?: EVENT_OPTIONS
  ): RemoveSubtreeResult =>
    runTransaction(() => core.removeSubtree(elementId, options))
}

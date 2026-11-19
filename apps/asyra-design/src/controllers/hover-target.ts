import type { SystemContextSnapshot } from '@asyra/utils'
import { elementApis, systemContextApis } from '../common-apis'
import { resolveCurrentCanvasHierarchyTarget } from './canvas-hierarchy-target'

/** One target policy for pointer events and post-mutation reevaluation. */
export const publishHoverTarget = (
  rawElementId: string | null,
  snapshot: Pick<SystemContextSnapshot, 'keyMeta' | 'keyCtrl'>
) => {
  const pathId = systemContextApis.getPathEditingVectorId()
  const outsideEditingTarget = pathId && rawElementId && rawElementId !== pathId
  const target = outsideEditingTarget
    ? null
    : resolveCurrentCanvasHierarchyTarget(rawElementId, snapshot)
  const hoveredId =
    target &&
    !elementApis.isElementLocked(target) &&
    elementApis.isElementVisible(target)
      ? target
      : null

  systemContextApis.updateHoveredElementId(hoveredId)

  return { hoveredId }
}

export const refreshHoverAtPointer = (
  snapshot: Pick<SystemContextSnapshot, 'mousePosition' | 'keyMeta' | 'keyCtrl'>
) =>
  publishHoverTarget(
    elementApis.getRenderElementIdAtClientPos(snapshot.mousePosition),
    snapshot
  )

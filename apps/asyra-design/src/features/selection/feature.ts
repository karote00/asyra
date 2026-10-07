import {
  type PositionData,
  type Rect,
  type SystemContextSnapshot,
  rectFromPoints
} from '@asyra/utils'
import { defineFeature } from '@asyra/core'
import {
  elementApis,
  selectionApis,
  systemContextApis,
  transactionApis
} from '../../common-apis'
import {
  FEATURE_MOVEMENT_THRESHOLD,
  FeatureNames,
  InputSystemEvents,
  PrimaryToolType
} from '../../constants'
import {
  resolveCanvasHierarchyTargetAtClientPos,
  resolveContainerChildAtClientPos
} from '../../controllers/canvas-hierarchy-target'

interface SelectionAPI {
  getSelectedIds: () => string[]
  clearSelection: () => void
  toggleSelection: (elementId: string) => void
  [key: string]: unknown
}

interface SelectionClickState {
  mode: 'click'
  [key: string]: unknown
}

interface SelectionAreaState {
  mode: 'area'
  dragStartClientPos: PositionData
  dragStartWorkspacePos: PositionData
  additive: boolean
  initialSelectionIds: string[]
  hasMoved: boolean
  [key: string]: unknown
}

type SelectionSessionState = SelectionClickState | SelectionAreaState

const api: SelectionAPI = {
  getSelectedIds: () => selectionApis.getSelectedIds(),
  clearSelection: () => {
    selectionApis.clearSelection()
  },
  toggleSelection: (elementId: string) => {
    selectionApis.toggleSelection(elementId)
  }
}

const clearPathEditingIfSelectionChanged = () => {
  const pathEditingMode = systemContextApis.getPathEditingMode()
  if (!pathEditingMode) {
    return
  }

  const pathEditingVectorId = systemContextApis.getPathEditingVectorId()
  if (!pathEditingVectorId) {
    systemContextApis.exitPathEditingMode()
    return
  }

  const selectedIds = selectionApis.getSelectedIds()
  if (selectedIds.length === 1 && selectedIds[0] === pathEditingVectorId) {
    return
  }

  systemContextApis.exitPathEditingMode()
}

const resolveSelectionIds = (
  selectionBounds: Rect,
  baseSelectionIds: string[],
  mode: 'replace' | 'toggle'
) => {
  const areaSelectionIds = elementApis
    .getElementIdsInBounds(selectionBounds)
    .filter(
      (id) =>
        !elementApis.isElementLocked(id) && elementApis.isElementVisible(id)
    )
  if (mode === 'replace' || baseSelectionIds.length === 0) {
    return areaSelectionIds
  }

  const baseSet = new Set(baseSelectionIds)
  const result = new Set(baseSelectionIds)
  areaSelectionIds.forEach((id) => {
    if (baseSet.has(id)) {
      result.delete(id)
    } else {
      result.add(id)
    }
  })
  return Array.from(result)
}

export const selectionFeature = defineFeature<
  SelectionAPI,
  SelectionSessionState
>(FeatureNames.SELECTION, InputSystemEvents.INPUT_DRAG, {
  priority: 5,
  exclusive: false,
  cancelPolicy: 'commit-current',
  api,
  session: {
    onStart: (snapshot: SystemContextSnapshot) => {
      const { primaryTool } = snapshot
      const mouse = {
        position: snapshot.mousePosition,
        down: snapshot.mouseDown
      }
      const pathEditingMode = systemContextApis.getPathEditingMode()

      if (primaryTool !== PrimaryToolType.SELECT || !mouse.down) {
        return null
      }

      // In path editing mode, keep focus on the current vector only.
      if (pathEditingMode) {
        return null
      }

      const hoveredElementId = resolveCanvasHierarchyTargetAtClientPos(snapshot)

      systemContextApis.clearAreaSelection()

      if (hoveredElementId) {
        if (
          elementApis.isElementLocked(hoveredElementId) ||
          !elementApis.isElementVisible(hoveredElementId)
        ) {
          return null
        }
        transactionApis.runTransaction(() => {
          if (snapshot.keyShift) {
            api.toggleSelection(hoveredElementId)
          } else {
            selectionApis.selectElements([hoveredElementId])
          }

          clearPathEditingIfSelectionChanged()
        })

        return { mode: 'click' }
      }

      const dragStartWorkspacePos = elementApis.getMousePosInWorkspace(
        mouse.position
      )
      if (!dragStartWorkspacePos) {
        return null
      }

      return {
        mode: 'area',
        dragStartClientPos: mouse.position,
        dragStartWorkspacePos,
        additive: snapshot.keyShift,
        initialSelectionIds: snapshot.keyShift
          ? selectionApis.getSelectedIds()
          : [],
        hasMoved: false
      }
    },
    onUpdate: (
      snapshot: SystemContextSnapshot,
      state: SelectionSessionState
    ) => {
      if (state.mode !== 'area') {
        return
      }

      if (!snapshot.mouseDragging) {
        return
      }

      const hasMoved =
        state.hasMoved ||
        elementApis.hasMovedBeyondThreshold(
          state.dragStartClientPos,
          snapshot.mousePosition,
          FEATURE_MOVEMENT_THRESHOLD.areaSelection
        )
      if (!hasMoved) {
        return
      }

      const currentWorkspacePos = elementApis.getMousePosInWorkspace(
        snapshot.mousePosition
      )
      if (!currentWorkspacePos) {
        return
      }

      state.hasMoved = true

      const selectionBounds = rectFromPoints(
        state.dragStartWorkspacePos,
        currentWorkspacePos
      )
      const nextSelectionIds = resolveSelectionIds(
        selectionBounds,
        state.additive ? state.initialSelectionIds : [],
        state.additive ? 'toggle' : 'replace'
      )

      selectionApis.selectElements(nextSelectionIds, {
        undoable: false,
        sharedDelivery: 'immediate'
      })

      systemContextApis.setAreaSelection({
        dragStart: state.dragStartWorkspacePos,
        dragCurrent: currentWorkspacePos,
        additive: state.additive
      })
    },
    onEnd: (snapshot: SystemContextSnapshot, state: SelectionSessionState) => {
      if (state.mode !== 'area') {
        return
      }

      systemContextApis.clearAreaSelection()

      if (!state.hasMoved) {
        if (state.additive) {
          return
        }

        transactionApis.runTransaction(() => {
          selectionApis.selectElements([])
          clearPathEditingIfSelectionChanged()
        })
        return
      }

      const currentWorkspacePos = elementApis.getMousePosInWorkspace(
        snapshot.mousePosition
      )
      if (!currentWorkspacePos) {
        return
      }

      const selectionBounds = rectFromPoints(
        state.dragStartWorkspacePos,
        currentWorkspacePos
      )
      const nextSelectionIds = resolveSelectionIds(
        selectionBounds,
        state.additive ? state.initialSelectionIds : [],
        state.additive ? 'toggle' : 'replace'
      )

      transactionApis.runTransaction(() => {
        selectionApis.selectElements(nextSelectionIds)
        clearPathEditingIfSelectionChanged()
      })
    },
    onCancel: (): undefined => {
      systemContextApis.clearAreaSelection()
    }
  }
})

export default selectionFeature

export const selectContainerChildFeature = defineFeature(
  FeatureNames.SELECT_CONTAINER_CHILD,
  InputSystemEvents.INPUT_DOUBLE_CLICK,
  {
    priority: 100,
    exclusive: true,
    execution: (snapshot: SystemContextSnapshot) => {
      if (
        snapshot.primaryTool !== PrimaryToolType.SELECT ||
        snapshot.keyShift ||
        snapshot.keyMeta ||
        snapshot.keyCtrl ||
        snapshot.keyAlt ||
        systemContextApis.getPathEditingMode()
      )
        return null

      const selectedIds = selectionApis.getSelectedIds()
      if (selectedIds.length !== 1) return null
      const containerId = selectedIds[0]
      const type = elementApis.getElementType(containerId)
      if (!type || !elementApis.isContainerType(type)) return null

      const childId = resolveContainerChildAtClientPos(
        containerId,
        snapshot.mousePosition
      )
      if (!childId) return null
      selectionApis.selectElements([childId])
      // Consume this gesture; vector editing belongs to a later double-click.
      return { selectedElementId: childId }
    }
  }
)

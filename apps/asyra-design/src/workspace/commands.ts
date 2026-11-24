import { cloneDeep } from 'lodash'
import type { MoveHierarchyRequest, PositionData, Rect } from '@asyra/utils'
import { TextSizing, PresetSystemPropertyKeys } from '@asyra/preset'
import core from '../contexts'
import { edit, enabled, editable, position, rectangle } from './command-inputs'
import { appearanceCommands } from './appearance-commands'
import { pathCommands } from './path-commands'

import { elementApis } from '../common-apis/element'
import { viewportApis } from '../common-apis/viewport'
import { hierarchyApis } from '../common-apis/hierarchy'
import { selectionApis } from '../common-apis/selection'
import { createWorkspaceText } from '../common-apis/text-canvas'
import { resolveSelectionIds } from '../features/selection'
import { selectElements } from '../controllers/element-selection'
import { hoverElementFeature } from '../features/hover-element'
import { getActiveCollaborationHandle } from '../collaboration/session-observation'
import {
  downloadRecoveryFile,
  retrySaving
} from '../render-app/document-recovery'

function recovery() {
  const session = getActiveCollaborationHandle()

  if (!session?.getSessionState().recoveryAvailable) {
    throw new Error('Document recovery is unavailable')
  }

  return session
}

export function workspaceCommands(reopen: () => Promise<void>) {
  return {
    getLayers() {
      return {
        workspaceId: hierarchyApis.getWorkspaceId(),
        ids: [...hierarchyApis.getFlattenedElementIds()],
        elements: cloneDeep(hierarchyApis.getElementDataMap())
      }
    },

    getElementProperties(elementId: string, fields?: readonly string[]) {
      return structuredClone(core.getElementComputedData(elementId, fields))
    },

    getViewport() {
      return {
        position: { ...viewportApis.getPosition() },
        scale: viewportApis.getScale()
      }
    },

    panTo(point: PositionData) {
      enabled('pan')
      const { x, y } = position(point)

      viewportApis.panTo(x, y)
    },

    zoomTo(scale: number, center: PositionData) {
      enabled('zoom')
      if (!Number.isFinite(scale) || scale <= 0) {
        throw new TypeError('Expected positive scale')
      }

      const { x, y } = position(center)

      viewportApis.zoomToCenter(scale, x, y)
    },

    selectArea(bounds: Rect, additive = false) {
      enabled('select')
      const ids = resolveSelectionIds(
        rectangle(bounds),
        selectionApis.getSelectedIds(),
        additive ? 'toggle' : 'replace'
      )

      selectElements(ids, { undoable: false })
    },

    setHoveredElement(elementId: string | null) {
      enabled('hoverElement')
      hoverElementFeature.api.setHoveredElementId(elementId)
    },

    moveElements(positions: Record<string, PositionData>) {
      enabled('moveElements')
      const entries = Object.entries(positions).map(([id, point]) => {
        editable(id)

        return [id, position(point)]
      })

      elementApis.setElementPositions(Object.fromEntries(entries), edit)
    },

    moveLayers(request: MoveHierarchyRequest) {
      enabled('moveLayerHierarchy')
      request.elementIds.forEach(editable)
      if (request.targetParentId !== core.getCurrentWorkspaceId()) {
        editable(request.targetParentId)
      }

      return [...hierarchyApis.moveElements(request, edit).elementIds]
    },

    setLayerLocked(elementId: string, locked: boolean) {
      enabled('lock')
      if (typeof locked !== 'boolean') {
        throw new TypeError('Expected a lock state')
      }

      return elementApis.setElementLock(elementId, locked, edit).value
    },

    setLayerVisible(elementId: string, visible: boolean) {
      enabled('visibility')
      if (typeof visible !== 'boolean') {
        throw new TypeError('Expected visibility')
      }

      return elementApis.setElementVisible(elementId, visible, edit)
    },

    createText(
      text: string,
      bounds: Rect,
      sizing: (typeof TextSizing)[keyof typeof TextSizing] = 'fixed'
    ) {
      enabled('text')
      if (
        typeof text !== 'string' ||
        !text.length ||
        text.length > 100000 ||
        !Object.values(TextSizing).includes(sizing)
      ) {
        throw new TypeError('Invalid text or sizing')
      }

      return createWorkspaceText(rectangle(bounds), text, sizing)
    },

    ...pathCommands,
    ...appearanceCommands,

    getCollaborationState() {
      return structuredClone(
        getActiveCollaborationHandle()?.getSessionState() ?? null
      )
    },

    retrySaving: () => retrySaving({ session: recovery(), reopen }),

    downloadRecoveryFile: () => downloadRecoveryFile(recovery())
  }
}

export function observeWorkspace(
  key: string,
  listener: (value: unknown) => void
) {
  if (key === 'collaboration') {
    const session = getActiveCollaborationHandle()

    listener(structuredClone(session?.getSessionState() ?? null))

    return (
      session?.onSessionStateChange((state) =>
        listener(structuredClone(state))
      ) ?? (() => undefined)
    )
  }

  if (key === PresetSystemPropertyKeys.VIEWPORT_POSITION) {
    const source = core.getSystemPropertyObservable<PositionData>(key)

    if (!source) {
      throw new Error('Viewport observation is unavailable')
    }

    const subscription = source.subscribe((value) => listener({ ...value }))

    return () => subscription.unsubscribe()
  }

  if (!core.getUIPropertySubject(key)) {
    throw new TypeError('Unknown workspace observation: ' + key)
  }

  return core.onUIPropertyChange(key, (value) => listener(cloneDeep(value)))
}

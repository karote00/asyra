import core, {
  getPropertyComponentAccessor,
  getSessionManager,
  runTransaction,
  unregisterPropertyComponent
} from '@asyra/core'
import {
  DEFAULT_ROBOT,
  validateRobot,
  assessRobotDesign,
  type RobotConfiguration
} from '../domain/robot-configuration'
import type { FarmConfiguration } from '../domain/farm-configuration'

const RobotIds = {
  COMPONENT: 'robot-configuration',
  CHANGE: 'robot.configuration.change'
} as const

/** Core owns settings; this composition retains only the current read projection. */
export function createRobotWorkspace(
  getFarm: () => FarmConfiguration,
  changed: () => void
) {
  let closed = false
  let elementId = ''
  let snapshot = assessRobotDesign(validateRobot(DEFAULT_ROBOT), getFarm())
  const listeners = new Set<() => void>()
  const assertLive = () => {
    if (closed) throw new Error('Robot workspace is closed')
  }
  core.definePropertyComponent({
    type: RobotIds.COMPONENT,
    defaults: { settings: DEFAULT_ROBOT }
  })
  core.defineComponent({
    type: RobotIds.COMPONENT,
    idPrefix: 'robot',
    namePrefix: 'Robot',
    properties: [
      {
        name: 'settings',
        type: RobotIds.COMPONENT,
        defaultValue: DEFAULT_ROBOT
      }
    ],
    renderStrategy: () => undefined
  })
  const read = () => {
    const id = core.getElementData(elementId)?.props?.settings
    const property = id
      ? getPropertyComponentAccessor().getPropertyById(id)
      : undefined
    if (!property) throw new Error('Missing canonical robot configuration')
    return validateRobot(
      (property.save() as unknown as { settings: RobotConfiguration }).settings
    )
  }
  const refresh = (farmChanged = false) => {
    assertLive()
    const next = read()
    if (
      !farmChanged &&
      JSON.stringify(next) === JSON.stringify(snapshot.settings)
    )
      return
    snapshot = assessRobotDesign(next, getFarm())
    changed()
    listeners.forEach((listener) => listener())
  }
  const feature = core.defineFeature(RobotIds.CHANGE, undefined, {
    priority: 100,
    exclusive: true,
    api: {
      patch: (patch: Partial<RobotConfiguration>) => {
        assertLive()
        const detached = structuredClone(patch)
        return getSessionManager().runAfterCancellingActiveSessions(
          () => core.getSystemContextSnapshot(),
          () => {
            assertLive()
            const current = read()
            const next = validateRobot({ ...current, ...detached })
            if (JSON.stringify(current) === JSON.stringify(next)) return
            const prepared = assessRobotDesign(next, getFarm())
            runTransaction(() =>
              core.updateElementProperties([
                { elementId, values: { settings: next } }
              ])
            )
            snapshot = prepared
            changed()
            listeners.forEach((listener) => listener())
          },
          RobotIds.CHANGE
        )
      }
    }
  })
  return {
    initialize: () => {
      assertLive()
      runTransaction(() => {
        elementId = core.createElement(
          {
            type: RobotIds.COMPONENT,
            x: 0,
            y: 0,
            settings: snapshot.settings,
            visible: false
          },
          undefined,
          undefined,
          { undoable: false }
        )
      })
    },
    get: () => snapshot,
    subscribe: (listener: () => void) => {
      assertLive()
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    patch: feature.api.patch,
    refresh,
    close: () => {
      closed = true
      listeners.clear()
    },
    unregister: () => {
      core.unregisterComponent(RobotIds.COMPONENT)
      unregisterPropertyComponent(RobotIds.COMPONENT)
    }
  }
}

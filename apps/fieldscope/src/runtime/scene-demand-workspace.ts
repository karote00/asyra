import core, {
  getPropertyComponentAccessor,
  getSessionManager,
  runTransaction,
  unregisterPropertyComponent
} from '@asyra/core'
import type { FarmConfiguration } from '../domain/farm-configuration'
import {
  DEFAULT_SCENE_DEMAND_CONFIGURATION,
  assertCurrentSceneDemandRoute,
  validateSceneDemandConfiguration,
  type SceneDemandConfiguration
} from '../domain/scene-demand-configuration'
import type { PreparedScene } from '../render-app/site-geometry'
import * as sceneDemand from '../simulation/scene-demand'

const SceneDemandIds = {
  COMPONENT: 'scene-demand-configuration',
  CHANGE: 'scene-demand.configuration.change'
} as const

/** Core owns the saved settings; W1 retains one current derived scene product. */
export function createSceneDemandWorkspace(
  getFarm: () => FarmConfiguration,
  getScene: () => PreparedScene
) {
  let closed = false
  let elementId = ''
  let configuration = DEFAULT_SCENE_DEMAND_CONFIGURATION
  let snapshot = sceneDemand.prepareSceneDemand(
    getFarm(),
    getScene(),
    configuration
  )
  const listeners = new Set<() => void>()
  const assertLive = () => {
    if (closed) throw new Error('Scene demand workspace is closed')
  }
  core.definePropertyComponent({
    type: SceneDemandIds.COMPONENT,
    defaults: { settings: DEFAULT_SCENE_DEMAND_CONFIGURATION }
  })
  core.defineComponent({
    type: SceneDemandIds.COMPONENT,
    idPrefix: 'scene-demand',
    namePrefix: 'Scene Demand',
    properties: [
      {
        name: 'settings',
        type: SceneDemandIds.COMPONENT,
        defaultValue: DEFAULT_SCENE_DEMAND_CONFIGURATION
      }
    ],
    renderStrategy: () => undefined
  })
  const read = () => {
    const propertyId = core.getElementData(elementId)?.props?.settings
    const property = propertyId
      ? getPropertyComponentAccessor().getPropertyById(propertyId)
      : undefined
    if (!property)
      throw new Error('Missing canonical scene demand configuration')
    return validateSceneDemandConfiguration(
      (property.save() as unknown as { settings: SceneDemandConfiguration })
        .settings
    )
  }
  const publish = (
    nextConfiguration: SceneDemandConfiguration,
    farm: FarmConfiguration,
    scene: PreparedScene
  ) => {
    configuration = nextConfiguration
    snapshot = sceneDemand.prepareSceneDemand(farm, scene, configuration)
    listeners.forEach((listener) => listener())
  }
  const refresh = (farm: FarmConfiguration, scene: PreparedScene) => {
    assertLive()
    const next = read()
    if (
      farm === snapshot.farm &&
      scene === snapshot.scene &&
      JSON.stringify(next) === JSON.stringify(configuration)
    )
      return
    publish(next, farm, scene)
  }
  const feature = core.defineFeature(SceneDemandIds.CHANGE, undefined, {
    priority: 100,
    exclusive: true,
    api: {
      apply: (draft: SceneDemandConfiguration) => {
        assertLive()
        const next = validateSceneDemandConfiguration(draft)
        return getSessionManager().runAfterCancellingActiveSessions(
          () => core.getSystemContextSnapshot(),
          () => {
            assertLive()
            const farm = getFarm()
            assertCurrentSceneDemandRoute(next, farm)
            if (JSON.stringify(next) === JSON.stringify(configuration)) return
            const prepared = sceneDemand.prepareSceneDemand(
              farm,
              getScene(),
              next
            )
            runTransaction(() =>
              core.updateElementProperties([
                { elementId, values: { settings: next } }
              ])
            )
            configuration = next
            snapshot = prepared
            listeners.forEach((listener) => listener())
          },
          SceneDemandIds.CHANGE
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
            type: SceneDemandIds.COMPONENT,
            x: 0,
            y: 0,
            settings: configuration,
            visible: false
          },
          undefined,
          undefined,
          { undoable: false }
        )
      })
    },
    getConfiguration: () => {
      assertLive()
      return configuration
    },
    get: () => {
      assertLive()
      return snapshot
    },
    isCurrent: (product: sceneDemand.SceneDemand) =>
      !closed && product === snapshot,
    subscribe: (listener: () => void) => {
      assertLive()
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setConfiguration: feature.api.apply,
    refresh,
    close: () => {
      closed = true
      listeners.clear()
    },
    unregister: () => {
      core.unregisterComponent(SceneDemandIds.COMPONENT)
      unregisterPropertyComponent(SceneDemandIds.COMPONENT)
    }
  }
}

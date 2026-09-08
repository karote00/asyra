import {
  DEFAULT_CONFIGURATION,
  validateConfiguration,
  type FarmConfiguration
} from '../domain/farm-configuration'
import core, {
  getSessionManager,
  runTransaction,
  undoWithRenderPolicy,
  redoWithRenderPolicy,
  getPropertyComponentAccessor,
  unregisterPropertyComponent
} from '@asyra/core'
import { applyPreset, PresetProfiles } from '@asyra/preset'
import type { RenderEngineProvider } from '@asyra/render-engine'
import { ThreeEngine } from '../engine/three-engine'
import {
  SpatialLayer,
  SPATIAL_LAYER_NAME,
  type SpatialCamera
} from '../render-app/spatial-layer'
import {
  buildSiteMeshes,
  projectView,
  cameraPreset,
  fitCamera,
  INITIAL_VIEW,
  INITIAL_LAYERS,
  type ViewState,
  type CameraMode,
  type LayerId
} from '../render-app/site-projection'

import {
  cameraDistance,
  measureScene,
  fitScene,
  panCamera,
  setCameraDistance
} from '../render-app/camera-navigation'

const RuntimeKeys = { VIEW: 'farm.view', FRAME: 'farm.frame' } as const
const FeatureNames = {
  VIEW: 'farm.view.change',
  CAMERA: 'farm.camera.navigate',
  CONFIGURATION: 'farm.configuration.change',
  HISTORY: 'farm.configuration.history'
} as const

export async function bootstrap(
  host: HTMLElement,
  provider: RenderEngineProvider = () => new ThreeEngine()
) {
  let closed = false,
    revision = 0
  let observer: ResizeObserver | undefined
  let disposePromise: Promise<void> | undefined
  let config = validateConfiguration(DEFAULT_CONFIGURATION)
  let configurationId = ''
  const configListeners = new Set<() => void>()
  let view = INITIAL_VIEW
  let camera = cameraPreset(view.camera, config)
  const initialBounds = host.getBoundingClientRect()
  let width = Math.max(1, initialBounds.width),
    height = Math.max(1, initialBounds.height)
  let aspect = width / height
  let zoomPercent = 100
  const zoomListeners = new Set<() => void>()
  const listeners = new Set<() => void>()
  const assertLive = () => {
    if (closed) throw new Error('Runtime is closed')
  }
  applyPreset(core, { profile: PresetProfiles.CUSTOM, defaults: [] })
  core.setRenderEngineProvider(provider)
  core.defineSystemProperty(RuntimeKeys.VIEW, INITIAL_VIEW, {
    runtime: true,
    silent: true
  })
  core.defineSystemProperty(RuntimeKeys.FRAME, 0, {
    runtime: true,
    silent: true
  })
  let meshes = buildSiteMeshes(config)
  let sceneBounds = measureScene(meshes)
  const configurationType = 'farm-configuration'
  core.definePropertyComponent({
    type: configurationType,
    defaults: { settings: DEFAULT_CONFIGURATION }
  })
  core.defineComponent({
    type: configurationType,
    idPrefix: 'farm',
    namePrefix: 'Farm',
    properties: [
      {
        name: 'settings',
        type: configurationType,
        defaultValue: DEFAULT_CONFIGURATION
      }
    ],
    renderStrategy: () => undefined
  })
  const layer = new SpatialLayer(() =>
    core.setSystemProperty(RuntimeKeys.FRAME, ++revision)
  )
  core.registerRenderLayer(layer.registration)
  const readZoom = (next: SpatialCamera) => {
    const reference = cameraPreset(view.camera, config)
    return (
      (100 *
        cameraDistance(reference) *
        Math.tan((reference.fov * Math.PI) / 360)) /
      (cameraDistance(next) * Math.tan((next.fov * Math.PI) / 360))
    )
  }
  const publishCamera = (next: SpatialCamera) => {
    camera = next
    const percent = Math.round(readZoom(next))
    if (percent !== zoomPercent) {
      zoomPercent = percent
      zoomListeners.forEach((listener) => listener())
    }
    layer.submitCamera(fitCamera(next, aspect))
  }
  const readConfiguration = () => {
    const propertyId = core.getElementData(configurationId)?.props?.settings
    const property = propertyId
      ? getPropertyComponentAccessor().getPropertyById(propertyId)
      : undefined
    if (!property) throw new Error('Missing canonical farm configuration')
    return validateConfiguration(
      (property.save() as unknown as { settings: FarmConfiguration }).settings
    )
  }
  const publishConfiguration = (
    next: FarmConfiguration,
    prepared = buildSiteMeshes(next)
  ) => {
    config = next
    meshes = prepared
    sceneBounds = measureScene(meshes)
    camera = cameraPreset(view.camera, config)
    layer.submit({
      meshes: projectView(meshes, view),
      camera: fitCamera(camera, aspect)
    })
    publishCamera(camera)
    configListeners.forEach((listener) => listener())
  }
  const configFeature = core.defineFeature(
    FeatureNames.CONFIGURATION,
    undefined,
    {
      priority: 100,
      exclusive: true,
      api: {
        apply: async (draft: FarmConfiguration) => {
          assertLive()
          // Detach the request before it enters the session queue.
          const next = validateConfiguration(draft)
          return getSessionManager().runAfterCancellingActiveSessions(
            () => core.getSystemContextSnapshot(),
            () => {
              assertLive()
              if (JSON.stringify(next) === JSON.stringify(config)) return
              const prepared = buildSiteMeshes(next)
              runTransaction(() =>
                core.updateElementProperties([
                  {
                    elementId: configurationId,
                    values: {
                      settings: {
                        ...next,
                        strips: next.strips.map((strip) => ({ ...strip }))
                      }
                    }
                  }
                ])
              )
              publishConfiguration(readConfiguration(), prepared)
            },
            FeatureNames.CONFIGURATION
          )
        }
      }
    }
  )
  const historyFeature = core.defineFeature(FeatureNames.HISTORY, undefined, {
    priority: 100,
    exclusive: true,
    api: {
      replay: (redo: boolean) => {
        assertLive()
        return getSessionManager().runAfterCancellingActiveSessions(
          () => core.getSystemContextSnapshot(),
          async () => {
            assertLive()
            if (redo) await redoWithRenderPolicy({ mode: 'atomic' })
            else await undoWithRenderPolicy({ mode: 'atomic' })
            const next = readConfiguration()
            if (JSON.stringify(next) !== JSON.stringify(config))
              publishConfiguration(next)
          },
          FeatureNames.HISTORY
        )
      }
    }
  })
  const viewFeature = core.defineFeature(FeatureNames.VIEW, undefined, {
    priority: 100,
    exclusive: true,
    api: {
      change: (
        patch: Partial<ViewState> | ((current: ViewState) => Partial<ViewState>)
      ) => {
        assertLive()
        return getSessionManager().runAfterCancellingActiveSessions(
          () => core.getSystemContextSnapshot(),
          () => {
            assertLive()
            const current = core.getSystemProperty<ViewState>(RuntimeKeys.VIEW)
            if (!current) throw new Error('Missing view state')
            const next = {
              ...current,
              ...(typeof patch === 'function' ? patch(current) : patch)
            }
            if (
              !Number.isFinite(next.filmOpacity) ||
              next.filmOpacity < 0 ||
              next.filmOpacity > 0.65
            )
              throw new Error('覆膜不透明度必須介於 0 與 0.65')
            if (
              !['overview', 'top', 'front', 'inside', 'joint'].includes(
                next.camera
              )
            )
              throw new Error('Unknown camera preset')
            if (
              Object.keys(next.layers).length !==
                Object.keys(INITIAL_LAYERS).length ||
              Object.keys(INITIAL_LAYERS).some(
                (key) => typeof next.layers[key as LayerId] !== 'boolean'
              )
            )
              throw new Error('Invalid display layers')
            core.setSystemProperty(RuntimeKeys.VIEW, next)
          },
          FeatureNames.VIEW
        )
      }
    }
  })
  const cameraFeature = core.defineFeature(FeatureNames.CAMERA, undefined, {
    priority: 50,
    exclusive: true,
    // Presentation-only camera commands consume no editable document state.
    api: {
      orbit: (dx: number, dy: number) => {
        assertLive()
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) return
        const [x, y, z] = camera.position.map((v, i) => v - camera.target[i])
        const radius = Math.hypot(x, y, z)
        const theta = Math.atan2(x, z) - dx * 0.006
        const phi = Math.max(
          0.02,
          Math.min(Math.PI / 2 - 0.015, Math.acos(y / radius) - dy * 0.006)
        )
        publishCamera({
          ...camera,
          position: [
            camera.target[0] + radius * Math.sin(phi) * Math.sin(theta),
            camera.target[1] + radius * Math.cos(phi),
            camera.target[2] + radius * Math.sin(phi) * Math.cos(theta)
          ]
        })
      },
      zoom: (delta: number) => {
        assertLive()
        if (!Number.isFinite(delta)) return
        const current = readZoom(camera)
        const next = Math.max(
          1,
          Math.min(10000, current * Math.exp(-delta * 0.001))
        )
        // Optical magnification keeps the camera outside the inspected surfaces.
        publishCamera({
          ...camera,
          fov: Math.min(
            150,
            (360 / Math.PI) *
              Math.atan(
                (Math.tan((camera.fov * Math.PI) / 360) * current) / next
              )
          )
        })
      },
      pan: (dx: number, dy: number) => {
        assertLive()
        publishCamera(
          panCamera(
            camera,
            dx,
            dy,
            width,
            height,
            cameraDistance(cameraPreset(view.camera, config)),
            cameraPreset(view.camera, config).fov
          )
        )
      },
      fit: () => {
        assertLive()
        publishCamera(
          fitScene(
            { ...camera, fov: cameraPreset(view.camera, config).fov },
            sceneBounds,
            width,
            height
          )
        )
      },
      actualSize: () => {
        assertLive()
        publishCamera(
          setCameraDistance(
            { ...camera, fov: cameraPreset(view.camera, config).fov },
            cameraDistance(cameraPreset(view.camera, config))
          )
        )
      },
      reset: (mode: CameraMode) => {
        assertLive()
        publishCamera(cameraPreset(mode, config))
      }
    }
  })
  const subscription = core
    .getSystemPropertyObservable<ViewState>(RuntimeKeys.VIEW)
    ?.subscribe((next) => {
      if (closed) return
      const previous = view
      view = next
      if (previous.camera !== next.camera)
        camera = cameraPreset(next.camera, config)
      layer.submit({
        meshes: projectView(meshes, next),
        camera: fitCamera(camera, aspect)
      })
      listeners.forEach((listener) => listener())
    })
  const dispose = () => {
    if (disposePromise) return disposePromise
    closed = true
    observer?.disconnect()
    subscription?.unsubscribe()
    configListeners.clear()
    listeners.clear()
    zoomListeners.clear()
    disposePromise = Promise.resolve().then(async () => {
      try {
        core.unregisterRenderLayer(SPATIAL_LAYER_NAME)
        layer.dispose()
      } finally {
        await core.resetRuntime()
        core.unregisterComponent(configurationType)
        unregisterPropertyComponent(configurationType)
      }
    })
    return disposePromise
  }
  try {
    const rect = host.getBoundingClientRect()
    await core.start(host, {
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
      backgroundColor: 0xe8ede4
    })
    core.sceneTreeInit()
    runTransaction(() => {
      configurationId = core.createElement(
        {
          type: configurationType,
          x: 0,
          y: 0,
          settings: config,
          visible: false
        },
        undefined,
        undefined,
        { undoable: false }
      )
    })
    observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (!closed && box && box.width > 0 && box.height > 0) {
        width = box.width
        height = box.height
        aspect = width / height
        layer.submitCamera(fitCamera(camera, aspect))
        core.resizeRenderer(box.width, box.height)
      }
    })
    observer.observe(host)
    return {
      getConfiguration: () => config,
      subscribeConfiguration: (listener: () => void) => {
        configListeners.add(listener)
        return () => {
          configListeners.delete(listener)
        }
      },
      setConfiguration: configFeature.api.apply,
      undo: () => historyFeature.api.replay(false),
      redo: () => historyFeature.api.replay(true),
      getUndoDepth: () => core.getUndoHistoryDepth(),
      getView: () => view,
      getZoom: () => zoomPercent,
      subscribeZoom: (listener: () => void) => {
        assertLive()
        zoomListeners.add(listener)
        return () => {
          zoomListeners.delete(listener)
        }
      },
      subscribe: (listener: () => void) => {
        assertLive()
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
      setLayer: (key: Exclude<LayerId, 'base'>, visible: boolean) =>
        viewFeature.api.change((current) => ({
          layers: { ...current.layers, [key]: visible }
        })),
      setOpacity: (filmOpacity: number) =>
        viewFeature.api.change({ filmOpacity }),
      setCamera: async (mode: CameraMode) => {
        await viewFeature.api.change({ camera: mode })
        cameraFeature.api.reset(mode)
      },
      pan: cameraFeature.api.pan,
      fit: cameraFeature.api.fit,
      actualSize: cameraFeature.api.actualSize,
      orbit: cameraFeature.api.orbit,
      zoom: cameraFeature.api.zoom,
      dispose
    }
  } catch (error) {
    await dispose()
    throw error
  }
}
export type FarmRuntime = Awaited<ReturnType<typeof bootstrap>>

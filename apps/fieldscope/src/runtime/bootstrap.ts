import core, { getSessionManager } from '@asyra/core'
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
  CAMERA: 'farm.camera.navigate'
} as const

export async function bootstrap(
  host: HTMLElement,
  provider: RenderEngineProvider = () => new ThreeEngine()
) {
  let closed = false,
    revision = 0
  let observer: ResizeObserver | undefined
  let disposePromise: Promise<void> | undefined
  let view = INITIAL_VIEW
  let camera = cameraPreset(view.camera)
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
  const meshes = buildSiteMeshes()
  const sceneBounds = measureScene(meshes)
  const layer = new SpatialLayer(() =>
    core.setSystemProperty(RuntimeKeys.FRAME, ++revision)
  )
  core.registerRenderLayer(layer.registration)
  const publishCamera = (next: SpatialCamera) => {
    camera = next
    const percent = Math.round(
      (100 * cameraDistance(cameraPreset(view.camera))) / cameraDistance(next)
    )
    if (percent !== zoomPercent) {
      zoomPercent = percent
      zoomListeners.forEach((listener) => listener())
    }
    layer.submitCamera(fitCamera(next, aspect))
  }
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
            if (!['overview', 'top', 'front', 'inside'].includes(next.camera))
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
        const vector = camera.position.map((v, i) => v - camera.target[i])
        const distance = Math.hypot(...vector)
        const next = Math.max(
          2,
          Math.min(180, distance * Math.exp(delta * 0.001))
        )
        publishCamera({
          ...camera,
          position: vector.map(
            (v, i) => camera.target[i] + (v / distance) * next
          ) as [number, number, number]
        })
      },
      pan: (dx: number, dy: number) => {
        assertLive()
        publishCamera(panCamera(camera, dx, dy, width, height))
      },
      fit: () => {
        assertLive()
        publishCamera(fitScene(camera, sceneBounds, width, height))
      },
      actualSize: () => {
        assertLive()
        publishCamera(
          setCameraDistance(camera, cameraDistance(cameraPreset(view.camera)))
        )
      },
      reset: (mode: CameraMode) => {
        assertLive()
        publishCamera(cameraPreset(mode))
      }
    }
  })
  const subscription = core
    .getSystemPropertyObservable<ViewState>(RuntimeKeys.VIEW)
    ?.subscribe((next) => {
      if (closed) return
      const previous = view
      view = next
      if (previous.camera !== next.camera) camera = cameraPreset(next.camera)
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
    listeners.clear()
    zoomListeners.clear()
    disposePromise = Promise.resolve().then(async () => {
      try {
        core.unregisterRenderLayer(SPATIAL_LAYER_NAME)
        layer.dispose()
      } finally {
        await core.resetRuntime()
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

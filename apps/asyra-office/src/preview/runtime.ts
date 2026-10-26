import core from '@asyra/core'
import { applyPreset, PresetProfiles } from '@asyra/preset'
import { SpatialLayer } from '@asyra/preset/spatial'
import { createPreviewController } from './controller'
import {
  createAssetReviewController,
  type ReviewAsset
} from './vegetation-controller'

const FRAME_REVISION = 'asset-preview.frame-revision'
const FEATURE_ID = 'asset-preview.presentation'
let runtimeCore = core
let active = false

/** One preview owner per browser document; Core reset owns the successor generation. */
export async function startAssetPreview(
  host: HTMLElement,
  asset?: ReviewAsset
) {
  if (active) throw new Error('An asset preview is already active')
  active = true
  const owner = runtimeCore
  let stopped = false,
    revision = 0
  let observer: ResizeObserver | undefined
  let controller:
    | ReturnType<typeof createPreviewController>
    | ReturnType<typeof createAssetReviewController>
    | undefined
  let layer: SpatialLayer | undefined
  let cleanup: Promise<void> | undefined
  const dispose = () => {
    if (cleanup) return cleanup
    stopped = true
    observer?.disconnect()
    controller?.dispose()
    if (layer) {
      owner.unregisterRenderLayer(layer.registration.name)
      layer.dispose()
    }
    cleanup = owner
      .resetRuntime()
      .then((next) => {
        runtimeCore = next
      })
      .finally(() => {
        active = false
      })
    return cleanup
  }
  try {
    applyPreset(owner, {
      profile: PresetProfiles['3D'],
      defaults: [],
      spatial: {
        lighting: {
          hemisphere: [0xffffff, 0xe1d8c8, 1.6],
          keyPosition: [-3, 6, 5],
          fillPosition: [4, 3, -2],
          shadowExtent: 4,
          shadowFar: 20,
          keyIntensity: 2.1,
          fillIntensity: 0.65,
          castShadows: false
        }
      }
    })
    owner.defineSystemProperty(FRAME_REVISION, 0, {
      runtime: true,
      silent: true
    })
    layer = new SpatialLayer(() => {
      if (!stopped) owner.setSystemProperty(FRAME_REVISION, ++revision)
    })
    owner.registerRenderLayer(layer.registration)
    const size = () => ({
      width: Math.max(1, host.clientWidth),
      height: Math.max(1, host.clientHeight)
    })
    controller = asset
      ? createAssetReviewController(layer, asset, size())
      : createPreviewController(layer, {
          height: size().height,
          pixelRatio: Math.min(window.devicePixelRatio, 2)
        })
    const { api } = owner.defineFeature(FEATURE_ID, undefined, {
      api: { setView: controller.setView, setNeutral: controller.setNeutral },
      priority: 10,
      exclusive: true
    })
    owner.load({
      version: '1.0.0',
      props: {},
      sceneTree: { workspace: '', workspaceList: [], elements: {} }
    })
    await owner.start(host, { ...size(), backgroundColor: 0xf4f1e9 })
    observer = new ResizeObserver(() => {
      if (stopped) return
      const next = size()
      owner.resizeRenderer(next.width, next.height)
      if (asset && controller)
        (controller as ReturnType<typeof createAssetReviewController>).resize(
          next.height,
          Math.min(window.devicePixelRatio, 2),
          next.width
        )
      else controller?.resize(next.height, Math.min(window.devicePixelRatio, 2))
    })
    observer.observe(host)
    return {
      getSnapshot: controller.getSnapshot,
      subscribe: controller.subscribe,
      setView: api.setView,
      setNeutral: api.setNeutral,
      dispose
    }
  } catch (error) {
    await dispose()
    throw error
  }
}
export type PreviewRuntime = Awaited<ReturnType<typeof startAssetPreview>>

import core from '@asyra/core'
import { bindCameraKeyboard } from '../ui/camera-keyboard'
import { applyPreset, PresetProfiles } from '@asyra/preset'
import { SpatialLayer } from '@asyra/preset/spatial'
import { createReferenceScene, buildSpatialMeshes } from './reference-scene'
import { createSceneController, overviewCamera } from './controller'
import { createSurfaces, labelMeshes } from './surfaces'
import { prepareArtwork } from './artwork'
import { INTERIOR_REVIEW_STAGE } from './office-interior'
let ownerCore = core,
  active = false
const FRAME_REVISION = 'reference-scene.frame-revision'
export async function startReferenceScene(host: HTMLElement) {
  if (active) {
    throw new Error('Scene already active')
  }
  active = true
  const owner = ownerCore
  let stopped = false,
    revision = 0,
    observer: ResizeObserver | undefined,
    stopKeyboard: (() => void) | undefined,
    layer: SpatialLayer | undefined,
    controller: ReturnType<typeof createSceneController> | undefined,
    cleanup: Promise<void> | undefined
  const dispose = () => {
    if (cleanup) {
      return cleanup
    }
    stopped = true
    stopKeyboard?.()
    observer?.disconnect()
    controller?.dispose()
    if (layer) {
      owner.unregisterRenderLayer(layer.registration.name)
      layer.dispose()
    }
    cleanup = owner
      .resetRuntime()
      .then((next) => {
        ownerCore = next
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
        bloom: { strength: 0.315, radius: 8 },
        lighting: {
          hemisphere: [0xfff4df, 0xb0aa8e, 0.95],
          keyPosition: [-3, 12, 4],
          fillPosition: [6, 7, -8],
          keyColor: 0xffe6be,
          keyIntensity: 3.4,
          fillColor: 0xdce7eb,
          fillIntensity: 0.65,
          shadowExtent: 9,
          shadowFar: 30,
          castShadows: true
        }
      }
    })
    owner.defineSystemProperty(FRAME_REVISION, 0, {
      runtime: true,
      silent: true
    })
    layer = new SpatialLayer(() => {
      if (!stopped) {
        owner.setSystemProperty(FRAME_REVISION, ++revision)
      }
    })
    owner.registerRenderLayer(layer.registration)
    const size = () => ({
      width: Math.max(1, host.clientWidth),
      height: Math.max(1, host.clientHeight)
    })
    const scene = createReferenceScene(INTERIOR_REVIEW_STAGE),
      artwork = await prepareArtwork(scene.labels),
      meshes = [
        ...buildSpatialMeshes(scene, createSurfaces()),
        ...labelMeshes(scene.labels, artwork)
      ]
    layer.submit({
      camera: overviewCamera(size().width / size().height),
      meshes
    })
    controller = createSceneController(layer, size().width / size().height)
    const { api } = owner.defineFeature(
      'reference-scene.presentation',
      undefined,
      {
        priority: 10,
        exclusive: true,
        api: {
          overview: controller.overview,
          focusPlace: controller.focusPlace,
          follow: controller.follow,
          orbit: controller.orbit,
          zoom: controller.zoom,
          move: controller.move
        }
      }
    )
    owner.load({
      version: '1.0.0',
      props: {},
      sceneTree: { workspace: '', workspaceList: [], elements: {} }
    })
    await owner.start(host, { ...size(), backgroundColor: 0xc9c5b5 })
    const browser = host.ownerDocument.defaultView
    if (!browser) {
      throw new Error('Scene host requires a browser window')
    }
    stopKeyboard = bindCameraKeyboard(browser, api.move, owner)
    observer = new ResizeObserver(() => {
      if (stopped) {
        return
      }
      const next = size()
      owner.resizeRenderer(next.width, next.height)
      controller?.resize(next.width / next.height)
    })
    observer.observe(host)
    const triangles = meshes.reduce(
      (s, m) =>
        s +
        (m.descriptor.shape.kind === 'triangles'
          ? (m.descriptor.shape.indices.length / 3) *
            (m.descriptor.instances?.length ?? 1)
          : 0),
      0
    )
    return {
      ...api,
      getSnapshot: controller.getSnapshot,
      subscribe: controller.subscribe,
      dispose,
      stats: {
        assemblies: scene.assemblies.length,
        draws: meshes.length,
        triangles
      }
    }
  } catch (e) {
    await dispose()
    throw e
  }
}
export type SceneRuntime = Awaited<ReturnType<typeof startReferenceScene>>

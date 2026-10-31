import {
  readSpatialDescriptor,
  type SpatialVector
} from '@asyra/preset/spatial-contract'
import {
  readSpatialCamera,
  type SpatialCamera,
  type SpatialFrame,
  type SpatialLayer
} from '@asyra/preset/spatial'
import { createWall, type WallPart } from '../assets/wall'

export const REVIEW_VIEWS = [
  'Front',
  'Right',
  'Back',
  'Top',
  'Three-quarter',
  'Cap detail',
  'Distant'
] as const
export type ReviewView = (typeof REVIEW_VIEWS)[number]
export type ReviewSnapshot = Readonly<{
  view: ReviewView
  neutral: boolean
  detail: 'near' | 'distant'
  triangles: number
}>
const target: SpatialVector = [0, 1.25, 0]
export function cameraForView(view: ReviewView): SpatialCamera {
  const positions: Record<ReviewView, SpatialVector> = {
    Front: [0, 1.25, 180],
    Right: [180, 1.25, 0],
    Back: [0, 1.25, -180],
    Top: [0, 181.25, 0.001],
    'Three-quarter': [120, 86.25, 120],
    'Cap detail': [1.2, 2.65, 0.5],
    Distant: [15, 12, 25]
  }
  if (!Object.hasOwn(positions, view)) {
    throw new Error('Unknown review view')
  }
  let fov = 1
  if (view === 'Cap detail') {
    fov = 20
  }
  if (view === 'Distant') {
    fov = 35
  }
  const focus: SpatialVector = view === 'Cap detail' ? [0.42, 2.46, 0] : target
  const distance = Math.hypot(...positions[view].map((n, i) => n - focus[i]))
  return readSpatialCamera({
    kind: 'camera',
    position: positions[view],
    target: focus,
    fov,
    near: view === 'Cap detail' ? 0.02 : distance - 5,
    far: view === 'Cap detail' ? 5 : distance + 5
  })
}

/** Camera policy belongs to the preview; no mesh construction occurs here. */
export function detailForError(
  previous: 'near' | 'distant',
  projectedError: number
) {
  if (!Number.isFinite(projectedError) || projectedError < 0) {
    throw new Error('Invalid projected error')
  }
  if (previous === 'near' && projectedError < 0.4) {
    return 'distant'
  }
  if (previous === 'distant' && projectedError > 0.6) {
    return 'near'
  }
  return previous
}

export function createPreviewController(
  layer: Pick<SpatialLayer, 'submit' | 'submitCamera'>,
  dimensions: { height: number; pixelRatio: number },
  build: () => readonly WallPart[] = createWall
) {
  // This immutable construction result belongs to this session, not to each view.
  const parts = build()
  const listeners = new Set<() => void>()
  let snapshot: ReviewSnapshot = Object.freeze({
    view: 'Three-quarter',
    neutral: false,
    detail: 'near',
    triangles: 64
  })
  let camera = cameraForView(snapshot.view),
    disposed = false
  let height = dimensions.height,
    pixelRatio = dimensions.pixelRatio
  const assertLive = () => {
    if (disposed) {
      throw new Error('Asset preview is disposed')
    }
  }
  const meshes = (
    detail: ReviewSnapshot['detail'],
    neutral: boolean
  ): SpatialFrame['meshes'] =>
    parts.map((part) => {
      const source = part.descriptor
      const shape = detail === 'distant' ? source.distant?.shape : source.shape
      if (!shape) {
        throw new Error('Missing distant shape')
      }
      const descriptor = readSpatialDescriptor({
        ...source,
        shape,
        instances: undefined,
        distant: undefined,
        color: neutral ? 0xb9b9b9 : source.color
      })
      if (descriptor.kind !== 'mesh') {
        throw new Error('Expected mesh')
      }
      return { id: part.id, descriptor, visible: true }
    })
  const update = (view: ReviewView, neutral: boolean, initial = false) => {
    assertLive()
    const nextCamera = cameraForView(view)
    const distance = Math.hypot(
      ...nextCamera.position.map((n, i) => n - nextCamera.target[i])
    )
    const error =
      (0.004 * height * pixelRatio) /
      (2 *
        Math.tan((nextCamera.fov * Math.PI) / 360) *
        Math.max(0.001, distance - 1.4))
    // Inspection views always retain the approved details; distant mode exercises the same LOD policy.
    const detail =
      view === 'Distant' ? detailForError(snapshot.detail, error) : 'near'
    const modelChanged =
      initial || detail !== snapshot.detail || neutral !== snapshot.neutral
    camera = nextCamera
    if (modelChanged) {
      layer.submit({ camera, meshes: meshes(detail, neutral) })
    } else {
      layer.submitCamera(camera)
    }
    if (
      initial ||
      view !== snapshot.view ||
      neutral !== snapshot.neutral ||
      detail !== snapshot.detail
    ) {
      snapshot = Object.freeze({
        view,
        neutral,
        detail,
        triangles: detail === 'near' ? 64 : 32
      })
      listeners.forEach((listener) => listener())
    }
  }
  update(snapshot.view, snapshot.neutral, true)
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      assertLive()
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setView: (view: ReviewView) => update(view, snapshot.neutral),
    setNeutral: (neutral: boolean) => update(snapshot.view, neutral),
    resize: (nextHeight: number, ratio: number) => {
      assertLive()
      if (
        !Number.isFinite(nextHeight) ||
        nextHeight <= 0 ||
        !Number.isFinite(ratio) ||
        ratio <= 0
      ) {
        throw new Error('Invalid viewport')
      }
      if (height === nextHeight && pixelRatio === ratio) {
        return
      }
      height = nextHeight
      pixelRatio = ratio
      update(snapshot.view, snapshot.neutral)
    },
    dispose: () => {
      disposed = true
      listeners.clear()
    }
  }
}
export type PreviewController = ReturnType<typeof createPreviewController>

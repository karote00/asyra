import {
  RenderContainer,
  RenderMesh,
  type RenderLayerRegistration
} from '@asyra/render'
import {
  SPATIAL_PROPERTY,
  readSpatialDescriptor,
  type SpatialDescriptor
} from './spatial-contract.js'

import { SpatialBoundsOwner, type SpatialBounds } from './bounds.js'

export const SPATIAL_LAYER_NAME = 'spatial-layer'
export type SpatialCamera = Extract<SpatialDescriptor, { kind: 'camera' }>
export type SpatialMesh = Extract<SpatialDescriptor, { kind: 'mesh' }>
export interface SpatialFrame {
  camera: SpatialCamera
  meshes: readonly {
    id: string
    elementId?: string
    descriptor: SpatialMesh
    visible: boolean
  }[]
}

class CameraProjection extends RenderContainer {
  constructor(private descriptor: SpatialCamera) {
    super()
  }
  override getEngineProperties() {
    return {
      ...super.getEngineProperties(),
      [SPATIAL_PROPERTY]: this.descriptor
    }
  }
  update(descriptor: SpatialCamera): void {
    this.descriptor = descriptor
    this.updateEngineProperties({ [SPATIAL_PROPERTY]: descriptor })
  }
}

/** Derived output only. Callers own the canonical model and shared pose evaluation. */
export class SpatialLayer {
  readonly registration: RenderLayerRegistration
  private readonly layer = new RenderContainer()
  private readonly meshes = new Map<string, RenderMesh>()
  private readonly applied = new Map<string, SpatialMesh>()
  private camera: CameraProjection | null = null
  private pending: SpatialFrame | null = null
  private pendingCamera: SpatialCamera | null = null
  private destroyed = false
  private accepted: SpatialFrame | null = null
  private acceptedCamera: SpatialCamera | null = null
  private readonly bounds = new SpatialBoundsOwner()

  constructor(
    private readonly invalidate: () => void,
    private readonly options: {
      name?: string
      readDescriptor?: typeof readSpatialDescriptor
    } = {}
  ) {
    const name = options.name ?? SPATIAL_LAYER_NAME
    this.layer.label = name
    this.registration = {
      name,
      layer: this.layer,
      zIndex: 0,
      shouldUpdate: () => this.pending !== null || this.pendingCamera !== null,
      update: () => this.flush()
    }
  }

  submit(frame: SpatialFrame): void {
    if (this.destroyed) throw new Error('Spatial layer is disposed')
    const camera = this.readDescriptor(frame.camera)
    if (camera.kind !== 'camera') throw new Error('Expected a camera')
    const ids = new Set<string>()
    if (!Array.isArray(frame.meshes))
      throw new Error('Expected ordered spatial records')
    const meshes = Array.from(frame.meshes, (item) => {
      const source = { ...item }
      if (typeof source.id !== 'string' || !source.id || ids.has(source.id))
        throw new Error('Spatial identities must be nonempty and unique')
      if (
        source.elementId !== undefined &&
        (typeof source.elementId !== 'string' || !source.elementId)
      )
        throw new Error('Invalid projected element identity')
      ids.add(source.id)
      const descriptor = this.readDescriptor(source.descriptor)
      if (descriptor.kind !== 'mesh' || typeof source.visible !== 'boolean')
        throw new Error('Expected a mesh projection')
      return {
        id: source.id,
        elementId: source.elementId,
        descriptor,
        visible: source.visible
      }
    })
    const accepted = this.accepted
    const modelChanged =
      !accepted ||
      meshes.length !== accepted.meshes.length ||
      meshes.some((mesh, index) => {
        const old = accepted.meshes[index]
        return (
          mesh.id !== old.id ||
          mesh.elementId !== old.elementId ||
          mesh.visible !== old.visible ||
          mesh.descriptor !== old.descriptor
        )
      })
    const cameraChanged = !this.sameCamera(camera)
    if (!modelChanged && !cameraChanged) return
    const requested = this.pending !== null || this.pendingCamera !== null
    this.accepted = Object.freeze({
      camera,
      meshes: Object.freeze(meshes.map((mesh) => Object.freeze(mesh)))
    })
    if (modelChanged) this.pending = this.accepted
    this.acceptedCamera = camera
    if (cameraChanged) this.pendingCamera = camera
    if (!requested) this.invalidate()
  }

  submitCamera(value: SpatialCamera): void {
    if (this.destroyed) throw new Error('Spatial layer is disposed')
    const camera = this.readDescriptor(value)
    if (camera.kind !== 'camera') throw new Error('Expected a camera')
    if (this.sameCamera(camera)) return
    const requested = this.pending !== null || this.pendingCamera !== null
    this.acceptedCamera = camera
    this.pendingCamera = camera
    if (!requested) this.invalidate()
  }

  getBounds(): SpatialBounds | null {
    if (this.destroyed) throw new Error('Spatial layer is disposed')
    return this.bounds.measure(
      (this.accepted?.meshes ?? [])
        .filter((mesh) => mesh.visible)
        .map((mesh) => mesh.descriptor)
    )
  }

  private readDescriptor(value: unknown): SpatialDescriptor {
    return readSpatialDescriptor(
      this.options.readDescriptor ? this.options.readDescriptor(value) : value
    )
  }

  private sameCamera(camera: SpatialCamera): boolean {
    const previous = this.acceptedCamera
    return (
      !!previous &&
      camera.fov === previous.fov &&
      camera.near === previous.near &&
      camera.far === previous.far &&
      camera.position.every((n, i) => n === previous.position[i]) &&
      camera.target.every((n, i) => n === previous.target[i])
    )
  }

  dispose(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.pending = null
    this.pendingCamera = null
    this.accepted = null
    this.acceptedCamera = null
    this.bounds.dispose()
    this.meshes.forEach((mesh) => mesh.destroy())
    this.meshes.clear()
    this.applied.clear()
    this.camera?.destroy()
    this.camera = null
    this.layer.destroy()
  }

  private flush(): boolean {
    const frame = this.pending
    const camera = this.pendingCamera
    if ((!camera && !frame) || this.destroyed) return false
    if (camera && !this.camera) {
      this.camera = new CameraProjection(camera)
      this.layer.addChild(this.camera)
    } else if (camera && this.camera) this.camera.update(camera)
    this.pendingCamera = null
    if (!frame) return true
    const ids = new Set(frame.meshes.map((mesh) => mesh.id))
    for (const [id, mesh] of this.meshes) {
      if (!ids.has(id)) {
        mesh.destroy()
        this.meshes.delete(id)
        this.applied.delete(id)
      }
    }
    for (const [index, item] of frame.meshes.entries()) {
      let mesh = this.meshes.get(item.id)
      if (!mesh) {
        mesh = new RenderMesh({ [SPATIAL_PROPERTY]: item.descriptor })
        mesh.label = item.elementId ?? item.id
        this.layer.addChild(mesh)
        this.meshes.set(item.id, mesh)
      } else if (this.applied.get(item.id) !== item.descriptor)
        mesh.update({ [SPATIAL_PROPERTY]: item.descriptor })
      this.applied.set(item.id, item.descriptor)
      const identity = mesh.projectionIdentity
      if (
        identity?.visualId !== item.id ||
        identity.elementId !== item.elementId
      )
        mesh.projectionIdentity = {
          visualId: item.id,
          elementId: item.elementId
        }
      if (this.layer.children[index + 1] !== mesh)
        this.layer.setChildIndex(mesh, index + 1)
      const label = item.elementId ?? item.id
      if (mesh.label !== label) mesh.label = label
      if (mesh.visible !== item.visible) mesh.visible = item.visible
    }
    this.pending = null
    return true
  }
}

import {
  RenderContainer,
  RenderMesh,
  type RenderLayerRegistration
} from '@asyra/render'
import {
  readSpatialDescriptor,
  SPATIAL_PROPERTY,
  type SpatialDescriptor,
  type SpatialShape
} from '@asyra/preset/spatial'
import {
  PLACES,
  WaypointMotion,
  type OfficeLayout,
  type PlaceId,
  type Point3
} from '../domain/layout'
import type { ActivityStatus } from '@asyra/preset/agent-activity'
type Mesh = Extract<SpatialDescriptor, { kind: 'mesh' }>
class Camera extends RenderContainer {
  update(position: Point3, target: Point3) {
    this.updateEngineProperties({
      [SPATIAL_PROPERTY]: readSpatialDescriptor({
        kind: 'camera',
        position,
        target,
        fov: 43,
        near: 0.1,
        far: 100
      })
    })
  }
}
interface Part {
  mesh: RenderMesh
  descriptor: Mesh
  offset: Point3
}
const meshDescriptor = (
  shape: SpatialShape,
  position: Point3,
  color: number
): Mesh =>
  readSpatialDescriptor({
    kind: 'mesh',
    shape,
    position,
    rotation: [0, 0, 0, 1],
    color,
    opacity: 1,
    wireframe: false,
    selectable: false
  }) as Mesh
/** Scene assets and motion are presentation only; no task/document reads in a frame. */
export class OfficeScene {
  readonly registration: RenderLayerRegistration
  private readonly root = new RenderContainer()
  private readonly room = new RenderContainer()
  private readonly camera = new Camera()
  private readonly parts: Part[] = []
  private readonly motion = new WaypointMotion()
  private anchor: Point3 = [-1.5, 0, 0]
  private cameraPosition: Point3 = [13, 12, 16]
  private cameraTarget: Point3 = [1, 0, 0]
  private cameraGoal: Point3 = this.cameraPosition
  private targetGoal: Point3 = this.cameraTarget
  private following = false
  private closed = false
  private frame: number | null = null
  private last = 0
  private reduced = false
  private status: ActivityStatus = 'idle'
  constructor(private readonly invalidate: () => void) {
    this.registration = {
      name: 'office.scene',
      layer: this.root,
      zIndex: 0,
      shouldUpdate: () => false,
      update: () => false
    }
    this.root.addChild(this.camera)
    this.root.addChild(this.room)
    this.box(this.root, [18, 0.25, 13], [1.5, -0.35, 0], 0xb0c8a3)
    this.box(this.root, [2.1, 0.05, 12], [5.5, -0.16, 0], 0xe6ddc8)
    this.box(this.root, [7, 0.06, 1.1], [0, -0.14, 3.8], 0xe6ddc8)
    this.box(this.root, [2, 1.8, 1.5], [6.8, 0.75, -3.3], 0xc7a07b)
    this.box(this.root, [2.3, 0.25, 1.9], [6.8, 1.8, -3.3], 0x6d8974)
    this.box(this.root, [1.7, 0.55, 0.1], [6.8, 1.25, -2.5], 0x384c40)
    this.box(this.root, [2.2, 0.15, 0.8], [6.5, 0.5, 2.5], 0xa67750)
    for (const x of [5.7, 7.3])
      this.box(this.root, [0.1, 0.55, 0.65], [x, 0.15, 2.5], 0x4a5b45)
    for (const [x, z] of [
      [-5, -3],
      [-5, 2],
      [8, 4],
      [8, -5]
    ]) {
      this.box(this.root, [0.25, 1.4, 0.25], [x, 0.45, z], 0x9b795a)
      this.sphere(this.root, 0.9, [x, 1.5, z], 0x779564)
      this.sphere(this.root, 0.62, [x + 0.35, 2, z], 0x97b17b)
    }
    this.part(
      { kind: 'capsule', radius: 0.22, length: 0.35 },
      [0, 0.6, 0],
      0x6b8f8a
    )
    this.part({ kind: 'sphere', radius: 0.29 }, [0, 1.15, 0], 0xf0c6a8)
    this.part({ kind: 'sphere', radius: 0.3 }, [0, 1.3, -0.05], 0x58473c)
    this.part({ kind: 'sphere', radius: 0.035 }, [-0.1, 1.15, 0.27], 0x302e2b)
    this.part({ kind: 'sphere', radius: 0.035 }, [0.1, 1.15, 0.27], 0x302e2b)
    this.part(
      { kind: 'box', size: [0.16, 0.3, 0.18] },
      [-0.13, 0.2, 0],
      0x344450
    )
    this.part(
      { kind: 'box', size: [0.16, 0.3, 0.18] },
      [0.13, 0.2, 0],
      0x344450
    )
    // One small companion, with a distinct silhouette and no provider authority.
    this.part({ kind: 'sphere', radius: 0.2 }, [0.7, 0.25, 0.3], 0xe3ac67)
    this.part({ kind: 'sphere', radius: 0.17 }, [0.7, 0.48, 0.43], 0xefc78d)
    this.part(
      { kind: 'box', size: [0.1, 0.17, 0.08] },
      [0.58, 0.64, 0.43],
      0xe3ac67
    )
    this.part(
      { kind: 'box', size: [0.1, 0.17, 0.08] },
      [0.82, 0.64, 0.43],
      0xe3ac67
    )
    this.motion.setTarget(this.anchor)
    this.motion.advance(0, true)
    this.updateAgent()
    this.updateCamera()
  }
  private box(
    parent: RenderContainer,
    size: Point3,
    position: Point3,
    color: number
  ) {
    return this.add(
      parent,
      meshDescriptor({ kind: 'box', size }, position, color)
    )
  }
  private sphere(
    parent: RenderContainer,
    radius: number,
    position: Point3,
    color: number
  ) {
    return this.add(
      parent,
      meshDescriptor({ kind: 'sphere', radius }, position, color)
    )
  }
  private add(parent: RenderContainer, descriptor: Mesh) {
    const mesh = new RenderMesh({ [SPATIAL_PROPERTY]: descriptor })
    parent.addChild(mesh)
    return mesh
  }
  private part(shape: SpatialShape, offset: Point3, color: number) {
    const descriptor = meshDescriptor(shape, offset, color)
    const mesh = this.add(this.root, descriptor)
    this.parts.push({ mesh, descriptor, offset })
  }
  setLayout(layout: OfficeLayout) {
    if (this.closed) return
    for (const child of [...this.room.children]) child.destroy()
    this.box(
      this.room,
      [layout.width, 0.2, layout.depth],
      [0, -0.08, 0],
      0xe7d9bb
    )
    this.box(
      this.room,
      [layout.width, 2.6, 0.15],
      [0, 1.2, -layout.depth / 2],
      layout.wall
    )
    this.box(
      this.room,
      [0.15, 2.6, layout.depth],
      [-layout.width / 2, 1.2, 0],
      layout.wall
    )
    this.box(
      this.room,
      [2.1, 1.3, 0.05],
      [1.4, 1.4, -layout.depth / 2 + 0.1],
      0x99bcc2
    )
    this.box(
      this.room,
      [0.08, 1.3, 0.1],
      [1.4, 1.4, -layout.depth / 2 + 0.15],
      0xf7eee0
    )
    this.box(
      this.room,
      [2.1, 0.08, 0.1],
      [1.4, 1.4, -layout.depth / 2 + 0.15],
      0xf7eee0
    )
    this.box(this.room, [3, 0.025, 2], [-1.5, 0.035, 1.3], 0xb3beb0)
    for (const item of layout.furniture) {
      const { x, z } = item
      if (item.kind === 'desk') {
        this.box(this.room, [1.7, 0.12, 0.9], [x, 0.9, z], 0xbb956c)
        for (const dx of [-0.65, 0.65])
          this.box(this.room, [0.12, 0.8, 0.6], [x + dx, 0.4, z], 0x455b4d)
        this.box(this.room, [0.58, 0.035, 0.4], [x, 1, z], 0x38434c)
        this.box(this.room, [0.58, 0.42, 0.04], [x, 1.21, z - 0.15], 0x38434c)
        this.box(this.room, [0.48, 0.31, 0.045], [x, 1.21, z - 0.12], 0xa2d5c4)
        this.anchor = [x, 0, z + 0.75]
      } else if (item.kind === 'sofa') {
        this.box(this.room, [1.8, 0.5, 0.8], [x, 0.3, z], 0xc18466)
        this.box(this.room, [1.8, 0.65, 0.2], [x, 0.65, z - 0.35], 0xcf9678)
      } else {
        this.box(this.room, [0.4, 0.45, 0.4], [x, 0.25, z], 0xc6aa88)
        this.sphere(this.room, 0.45, [x, 0.8, z], 0x7e9d68)
      }
    }
    if (this.status === 'working' || this.status === 'idle')
      this.motion.setTarget(this.anchor)
    this.wake()
    this.invalidate()
  }
  setStatus(status: ActivityStatus) {
    this.status = status
    if (status === 'working' || status === 'waiting')
      this.motion.setTarget(this.anchor)
    this.wake()
  }
  visit(place: PlaceId) {
    if (this.status === 'working' || this.status === 'waiting')
      throw new Error(
        'This agent is working; wait for an idle or completed state'
      )
    this.motion.setTarget(PLACES[place].point)
    this.wake()
  }
  focus(place: PlaceId | 'overview') {
    this.following = false
    if (place === 'overview') {
      this.cameraGoal = [13, 12, 16]
      this.targetGoal = [1, 0, 0]
    } else {
      const point = PLACES[place].point
      this.cameraGoal = [point[0] + 7, 7, point[2] + 9]
      this.targetGoal = point
    }
    this.wake()
  }
  follow() {
    this.following = true
    this.wake()
  }
  setReducedMotion(value: boolean) {
    this.reduced = value
    this.wake()
  }
  private updateAgent() {
    const position = this.motion.getPosition()
    for (const part of this.parts)
      part.mesh.update({
        [SPATIAL_PROPERTY]: {
          ...part.descriptor,
          position: part.offset.map((value, i) => value + position[i])
        }
      })
  }
  private updateCamera() {
    this.camera.update(this.cameraPosition, this.cameraTarget)
  }
  private wake() {
    if (!this.closed && this.frame === null) {
      this.last = performance.now()
      this.frame = requestAnimationFrame((now) => this.tick(now))
    }
  }
  private tick(now: number) {
    this.frame = null
    if (this.closed) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    const moving = this.motion.moving
    if (moving) {
      this.motion.advance(dt, this.reduced)
      this.updateAgent()
    }
    if (this.following) {
      const p = this.motion.getPosition()
      this.cameraGoal = [p[0] + 0.5, 3, p[2] + 5]
      this.targetGoal = [p[0], 0.8, p[2]]
    }
    const mix = (a: Point3, b: Point3): Point3 =>
      a.map(
        (value, i) => value + (b[i] - value) * (this.reduced ? 1 : 0.12)
      ) as unknown as Point3
    this.cameraPosition = mix(this.cameraPosition, this.cameraGoal)
    this.cameraTarget = mix(this.cameraTarget, this.targetGoal)
    this.updateCamera()
    this.invalidate()
    const cameraMoving =
      this.cameraPosition.some(
        (value, i) => Math.abs(value - this.cameraGoal[i]) > 0.005
      ) ||
      this.cameraTarget.some(
        (value, i) => Math.abs(value - this.targetGoal[i]) > 0.005
      )
    if (this.motion.moving || cameraMoving)
      this.frame = requestAnimationFrame((time) => this.tick(time))
  }
  dispose() {
    this.closed = true
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.root.destroy()
  }
}

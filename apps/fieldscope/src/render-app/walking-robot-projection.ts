import type { Point3 } from '../domain/greenhouse'
import type {
  Quaternion4,
  WalkingRigidTransform
} from '../domain/walking-robot-definition'
import { readSpatialDescriptor } from '../engine/spatial-contract'
import type { WalkingOperatingReport } from '../runtime/walking-operating-workspace'
import type { SpatialFrame, SpatialMesh } from './spatial-layer'

const multiply = (a: Quaternion4, b: Quaternion4): Quaternion4 =>
  Object.freeze([
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
  ]) as Quaternion4
const rotate = (q: Quaternion4, p: Point3): Point3 => {
  const [x, y, z, w] = q,
    tx = 2 * (y * p[2] - z * p[1]),
    ty = 2 * (z * p[0] - x * p[2]),
    tz = 2 * (x * p[1] - y * p[0])
  return Object.freeze([
    p[0] + w * tx + y * tz - z * ty,
    p[1] + w * ty + z * tx - x * tz,
    p[2] + w * tz + x * ty - y * tx
  ]) as Point3
}
const compose = (
  parent: WalkingRigidTransform,
  child: WalkingRigidTransform
): WalkingRigidTransform => {
  const delta = rotate(parent.rotation, child.position)
  return Object.freeze({
    position: Object.freeze([
      parent.position[0] + delta[0],
      parent.position[1] + delta[1],
      parent.position[2] + delta[2]
    ]) as Point3,
    rotation: multiply(parent.rotation, child.rotation)
  })
}

/** Projects only the selected active W2 source; it owns no geometry decisions. */
export class WalkingRobotProjection {
  readonly work = { shapeAdmissions: 0, poseProjections: 0 }
  private source?: Extract<
    WalkingOperatingReport,
    { status: Exclude<WalkingOperatingReport['status'], 'legacy-view'> }
  >['source']
  private poseResult?: Extract<
    WalkingOperatingReport,
    { status: Exclude<WalkingOperatingReport['status'], 'legacy-view'> }
  >['stowedPoseResult']
  private shapes = new Map<string, SpatialMesh['shape']>()
  private meshes: SpatialFrame['meshes'] = Object.freeze([])

  update(report: WalkingOperatingReport): SpatialFrame['meshes'] {
    if (report.status === 'legacy-view') {
      this.clear()
      return this.meshes
    }
    if (!('envelope' in report) || !report.envelope) {
      this.meshes = Object.freeze([])
      return this.meshes
    }
    if (this.source !== report.source) {
      this.source = report.source
      this.shapes = new Map()
      for (const part of report.source.parts) {
        const descriptor = readSpatialDescriptor({
          kind: 'mesh',
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          shape: part.shape,
          color: part.bodyId === 'base' ? 0x395f52 : 0x718a7d,
          metalness: 0.35,
          roughness: 0.55,
          opacity: 1,
          wireframe: false,
          selectable: false
        })
        if (descriptor.kind !== 'mesh') throw new Error('Expected walking mesh')
        this.shapes.set(part.id, descriptor.shape)
        this.work.shapeAdmissions++
      }
    }
    if (this.poseResult === report.stowedPoseResult) return this.meshes
    const transforms = new Map(
      report.stowedPoseResult.bodyTransforms.map((item) => [
        item.id,
        item.transform
      ])
    )
    this.meshes = Object.freeze(
      report.source.parts.map((part) => {
        const body = transforms.get(part.bodyId)
        const shape = this.shapes.get(part.id)
        if (!body || !shape)
          throw new Error('Incomplete walking projection source')
        const transform = compose(body, part.localFrame)
        const descriptor = readSpatialDescriptor({
          kind: 'mesh',
          position: transform.position,
          rotation: transform.rotation,
          shape,
          color: part.bodyId === 'base' ? 0x395f52 : 0x718a7d,
          metalness: 0.35,
          roughness: 0.55,
          opacity: 1,
          wireframe: false,
          selectable: false
        })
        if (descriptor.kind !== 'mesh') throw new Error('Expected walking mesh')
        return Object.freeze({
          id: `walking-robot.${part.id}`,
          visible: true,
          descriptor
        })
      })
    )
    this.poseResult = report.stowedPoseResult
    this.work.poseProjections++
    return this.meshes
  }

  clear() {
    this.source = undefined
    this.poseResult = undefined
    this.shapes.clear()
    this.meshes = Object.freeze([])
  }
}

import {
  createRobotModel,
  createDockModel,
  type RobotPart
} from '../domain/robot-model'
import type { RobotSnapshot } from '../domain/robot-configuration'
import { readSpatialDescriptor } from '../engine/spatial-contract'
import type { SpatialFrame, SpatialMesh } from './spatial-layer'
import type { SceneBounds } from './camera-navigation'

function project(
  parts: readonly RobotPart[],
  x: number,
  z: number,
  prefix: string
): SpatialFrame['meshes'] {
  return parts.map((part) => ({
    id: `${prefix}.${part.id}`,
    visible: true,
    descriptor: readSpatialDescriptor({
      kind: 'mesh',
      position: [x, 0, z],
      rotation: [0, 0, 0, 1],
      shape: part.shape,
      color: part.color,
      metalness: part.metalness,
      roughness: 0.48,
      opacity: 1,
      wireframe: false,
      selectable: false
    }) as SpatialMesh
  }))
}

/** One definition product per runtime; camera and UI never construct geometry. */
export class RobotProjection {
  private definition = ''
  private localBounds: SceneBounds = { min: [0, 0, 0], max: [0, 0, 0] }
  private parts: SpatialFrame['meshes'] = []
  private readonly dock = project(createDockModel(), 0, 0, 'dock')
  update(report: RobotSnapshot): SpatialFrame['meshes'] {
    const s = report.settings
    const key = `${s.width}:${s.length}:${s.height}:${s.tool}`
    if (key !== this.definition) {
      this.parts = project(createRobotModel(s), 0, 0, 'robot')
      const min: [number, number, number] = [Infinity, Infinity, Infinity]
      const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
      for (const item of [...this.parts, ...this.dock]) {
        const shape = item.descriptor.shape
        if (shape.kind !== 'triangles')
          throw new Error('Expected robot triangle product')
        shape.positions.forEach((value, i) => {
          const axis = i % 3
          min[axis] = Math.min(min[axis], value)
          max[axis] = Math.max(max[axis], value)
        })
      }
      this.localBounds = { min, max }
      this.definition = key
    }
    const meshes = [...this.parts, ...this.dock].map((item) => ({
      ...item,
      descriptor: readSpatialDescriptor({
        ...item.descriptor,
        position: [s.dockX, 0, s.dockZ]
      }) as SpatialMesh
    }))
    const lane = report.lane
    if (lane)
      meshes.push({
        id: 'robot.route',
        visible: true,
        descriptor: readSpatialDescriptor({
          kind: 'mesh',
          position: [lane.centerX, 0.025, (s.start + s.end) / 2],
          rotation: [0, 0, 0, 1],
          shape: { kind: 'box', size: [0.028, 0.012, s.end - s.start] },
          color: {
            blocked: 0xc34432,
            screened: 0x3c946a,
            unverified: 0xc99530
          }[lane.status],
          roughness: 1,
          opacity: 1,
          wireframe: false,
          selectable: false
        }) as SpatialMesh
      })
    return meshes
  }
  bounds(x: number, z: number): SceneBounds {
    const { min, max } = this.localBounds
    return {
      min: [min[0] + x, min[1], min[2] + z],
      max: [max[0] + x, max[1], max[2] + z]
    }
  }
  clear() {
    this.parts = []
    this.definition = ''
  }
}

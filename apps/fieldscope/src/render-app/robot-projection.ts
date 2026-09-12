import {
  createRobotModel,
  createDockModel,
  type RobotPart
} from '../domain/robot-model'
import type { RobotSnapshot } from '../domain/robot-configuration'
import { readSpatialDescriptor } from '../engine/spatial-contract'
import type { SpatialFrame, SpatialMesh } from './spatial-layer'
import type { SceneBounds } from './camera-navigation'

import {
  prepareRobotRig,
  evaluateRobotPose,
  UnsupportedRobotRigError,
  type RobotRig,
  type RobotJoints
} from '../domain/robot-kinematics'

export interface RobotSource {
  readonly revision: number
  readonly parts: readonly Readonly<RobotPart>[]
  readonly rig: RobotRig | null
  readonly unavailable: 'unsupported-lift' | null
}
export interface DockSource {
  readonly revision: number
  readonly meshes: SpatialFrame['meshes']
}
let nextRevision = 0

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
  private source?: RobotSource
  private dockSource?: DockSource
  private localBounds: SceneBounds = { min: [0, 0, 0], max: [0, 0, 0] }
  private parts: SpatialFrame['meshes'] = []
  private readonly dock = project(createDockModel(), 0, 0, 'dock')
  update(report: RobotSnapshot): SpatialFrame['meshes'] {
    const s = report.settings
    const key = `${s.width}:${s.length}:${s.height}:${s.tool}`
    if (key !== this.definition) {
      const raw = createRobotModel(s)
      this.parts = project(raw, 0, 0, 'robot')
      const parts = Object.freeze(
        raw.map((part, index) => {
          const shape = this.parts[index].descriptor.shape
          if (shape.kind !== 'triangles')
            throw new Error('Expected robot triangle product')
          return Object.freeze({ ...part, shape })
        })
      )
      let rig: RobotRig | null = null
      try {
        rig = prepareRobotRig(s, parts)
      } catch (error) {
        if (!(error instanceof UnsupportedRobotRigError)) throw error
      }
      this.source = Object.freeze({
        revision: ++nextRevision,
        parts,
        rig,
        unavailable: rig ? null : 'unsupported-lift'
      })
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
    const position = this.dockSource?.meshes[0].descriptor.position
    if (!position || position[0] !== s.dockX || position[2] !== s.dockZ) {
      this.dockSource = Object.freeze({
        revision: ++nextRevision,
        meshes: Object.freeze(
          this.dock.map((item) =>
            Object.freeze({
              ...item,
              descriptor: readSpatialDescriptor({
                ...item.descriptor,
                position: [s.dockX, 0, s.dockZ]
              }) as SpatialMesh
            })
          )
        )
      })
    }
    const meshes = this.parts.map((item) => ({
      ...item,
      descriptor: readSpatialDescriptor({
        ...item.descriptor,
        position: [s.dockX, 0, s.dockZ]
      }) as SpatialMesh
    }))
    meshes.push(...this.getDockSource().meshes)
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
  getDockSource(): DockSource {
    if (!this.dockSource) throw new Error('Dock source is unavailable')
    return this.dockSource
  }
  isCurrentDockSource(source: DockSource): boolean {
    return this.dockSource !== undefined && source === this.dockSource
  }
  getSource(): RobotSource {
    if (!this.source) throw new Error('Robot source is unavailable')
    return this.source
  }
  isCurrentSource(source: RobotSource): boolean {
    return this.source !== undefined && source === this.source
  }
  evaluatePose(source: RobotSource, joints: RobotJoints) {
    if (!this.isCurrentSource(source)) throw new Error('Retired robot source')
    if (!source.rig)
      throw new UnsupportedRobotRigError('Unsupported lift stroke')
    return evaluateRobotPose(source.rig, joints)
  }
  clear() {
    this.source = undefined
    this.dockSource = undefined
    this.parts = []
    this.definition = ''
  }
}

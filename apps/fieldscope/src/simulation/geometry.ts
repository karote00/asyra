import type { PreparedScene, SceneFruit } from '../render-app/site-geometry'
import type { SiteMesh } from '../render-app/site-projection'
import type { DockSource, RobotSource } from '../render-app/robot-projection'
import type { SpatialMesh } from '../render-app/spatial-layer'
import type { SpatialShape } from '../engine/spatial-contract'
import type { RobotPart } from '../domain/robot-model'
import type { RobotBody } from '../domain/robot-kinematics'
import { transformRobotPoint } from '../domain/robot-kinematics'
import type { Point3 } from '../domain/greenhouse'

/** Composition-issued same-update tuple; currentness requires original identity. */
export interface GeometryReceipt {
  readonly revision: number
  readonly scene: PreparedScene
  readonly robot: RobotSource
  readonly dock: DockSource
}
export interface GeometryOwners {
  isCurrentReceipt(receipt: GeometryReceipt): boolean
  isCurrentScene(scene: PreparedScene): boolean
  isCurrentRobot(robot: RobotSource): boolean
  isCurrentDock(dock: DockSource): boolean
}
type CropPart = SceneFruit['model']['parts'][number]
export interface GeometryMesh {
  readonly kind: 'farm' | 'robot' | 'dock'
  readonly frame: 'world' | 'robot'
  readonly origin:
    Readonly<SiteMesh> | DockSource['meshes'][number] | Readonly<RobotPart>
  readonly shape: SpatialShape
  readonly descriptor?: SpatialMesh
  readonly layer?: SiteMesh['layer']
  readonly body?: RobotBody
  readonly partitions?: CropPart['partitions']
  readonly plants?: readonly SceneFruit['plant'][]
}
export interface GeometrySource {
  readonly receipt: GeometryReceipt
  readonly shapes: readonly SpatialShape[]
  readonly meshes: readonly GeometryMesh[]
  readonly fruits: PreparedScene['fruits']
}
const placementKey = (position: readonly number[], yaw: number) =>
  `${position[0]}:${position[1]}:${position[2]}:${yaw}`

/** Shared source preparation, not a detector or collision decision provider. */
export class QueryGeometry {
  private source?: GeometrySource
  constructor(private readonly owners: GeometryOwners) {}

  private assertCurrent(receipt: GeometryReceipt) {
    if (
      !this.owners.isCurrentReceipt(receipt) ||
      !Number.isSafeInteger(receipt.revision) ||
      receipt.revision < 0 ||
      !this.owners.isCurrentScene(receipt.scene) ||
      !this.owners.isCurrentRobot(receipt.robot) ||
      !this.owners.isCurrentDock(receipt.dock)
    )
      throw new Error('Retired or invalid geometry receipt')
  }

  prepare(receipt: GeometryReceipt): GeometrySource {
    this.assertCurrent(receipt)
    if (this.source?.receipt === receipt) return this.source
    if (!receipt.robot.rig) throw new Error('Robot rigid ownership unavailable')
    const shapes = new Set<SpatialShape>()
    const meshes: GeometryMesh[] = []
    const parts = new Map<
      SpatialShape,
      { part: CropPart; model: SceneFruit['model'] }
    >()
    const models = new Set<SceneFruit['model']>()
    for (const fruit of receipt.scene.fruits) {
      if (models.has(fruit.model)) continue
      models.add(fruit.model)
      for (const part of fruit.model.parts) {
        if (parts.has(part.shape))
          throw new Error('Ambiguous crop shape ownership')
        parts.set(part.shape, { part, model: fruit.model })
      }
    }
    const plants = new Map<
      SceneFruit['model'],
      Map<string, SceneFruit['plant']>
    >()
    for (const model of models) {
      const group = new Map<string, SceneFruit['plant']>()
      for (const plant of receipt.scene.plants) {
        if (plant.species !== model.species || plant.variant !== model.variant)
          continue
        const key = placementKey(plant.position, plant.yaw)
        if (group.has(key)) throw new Error('Ambiguous plant placement')
        group.set(key, plant)
      }
      plants.set(model, group)
    }
    const register = (mesh: GeometryMesh) => {
      if (mesh.shape.kind !== 'triangles')
        throw new Error('Unsupported physical source shape')
      shapes.add(mesh.shape)
      meshes.push(Object.freeze(mesh))
    }
    for (const mesh of receipt.scene.meshes) {
      if (mesh.layer === 'dimensions') continue
      const { descriptor } = mesh
      const crop = parts.get(descriptor.shape)
      let bindings: readonly SceneFruit['plant'][] | undefined
      if (mesh.layer === 'cucumbers' || mesh.layer === 'tomatoes') {
        if (!crop || !descriptor.instances)
          throw new Error('Missing canonical crop ownership')
        const group = plants.get(crop.model)
        bindings = Object.freeze(
          descriptor.instances.map((instance) => {
            const plant = group?.get(
              placementKey(instance.position, instance.yaw)
            )
            if (!plant) throw new Error('Missing canonical plant instance')
            return plant
          })
        )
      }
      register({
        kind: 'farm',
        frame: 'world',
        origin: mesh,
        descriptor,
        shape: descriptor.shape,
        layer: mesh.layer,
        ...(crop ? { partitions: crop.part.partitions, plants: bindings } : {})
      })
    }
    for (const part of receipt.robot.rig.parts) {
      if (!receipt.robot.parts.includes(part.source))
        throw new Error('Mismatched robot source')
      register({
        kind: 'robot',
        frame: 'robot',
        origin: part.source,
        shape: part.source.shape,
        body: part.body
      })
    }
    if (receipt.robot.rig.parts.length !== receipt.robot.parts.length)
      throw new Error('Incomplete robot source')
    for (const mesh of receipt.dock.meshes) {
      register({
        kind: 'dock',
        frame: 'world',
        origin: mesh,
        descriptor: mesh.descriptor,
        shape: mesh.descriptor.shape
      })
    }
    this.assertCurrent(receipt)
    const source = Object.freeze({
      receipt,
      shapes: Object.freeze([...shapes]),
      meshes: Object.freeze(meshes),
      fruits: receipt.scene.fruits
    })
    this.source = source
    return source
  }

  read(source: GeometrySource): GeometrySource {
    if (source !== this.source)
      throw new Error('Unissued or retired query geometry')
    this.assertCurrent(source.receipt)
    return source
  }

  /** Farm/dock world placement only; a working robot needs D's current pose. */
  placePoint(
    source: GeometrySource,
    mesh: GeometryMesh,
    point: Point3,
    instance = 0
  ): Point3 {
    this.read(source)
    if (!source.meshes.includes(mesh)) throw new Error('Unissued geometry mesh')
    if (mesh.frame !== 'world' || !mesh.descriptor)
      throw new Error('Current robot pose required')
    if (
      !Number.isInteger(instance) ||
      instance < 0 ||
      point.length !== 3 ||
      !point.every(Number.isFinite)
    )
      throw new Error('Invalid placement input')
    const descriptor = mesh.descriptor
    let local = point
    if (descriptor.instances) {
      const placement = descriptor.instances[instance]
      if (!placement) throw new Error('Missing source instance')
      const cosine = Math.cos(placement.yaw),
        sine = Math.sin(placement.yaw)
      local = [
        placement.position[0] + cosine * point[0] + sine * point[2],
        placement.position[1] + point[1],
        placement.position[2] - sine * point[0] + cosine * point[2]
      ]
    } else if (instance !== 0) throw new Error('Unexpected source instance')
    return transformRobotPoint(descriptor, local)
  }

  clear() {
    this.source = undefined
  }
}

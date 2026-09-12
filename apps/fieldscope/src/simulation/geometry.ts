import type { PreparedScene, SceneFruit } from '../render-app/site-geometry'
import type { SiteMesh } from '../render-app/site-projection'
import type { DockSource, RobotSource } from '../render-app/robot-projection'
import type { SpatialMesh } from '../render-app/spatial-layer'
import type { SpatialShape } from '../engine/spatial-contract'
import type { RobotPart } from '../domain/robot-model'
import type { RobotBody } from '../domain/robot-kinematics'
import { transformRobotPoint } from '../domain/robot-kinematics'
import type { Point3 } from '../domain/greenhouse'
import type { SourceRegion } from '../domain/source-occupancy'

export interface GeometryBounds {
  readonly min: Point3
  readonly max: Point3
}
export interface PreparedGeometry {
  readonly bounds: GeometryBounds
  readonly regions: readonly {
    readonly source: SourceRegion
    readonly bounds: GeometryBounds
  }[]
}
export interface GeometryWork {
  readonly shapeBounds: number
  readonly vertexVisits: number
  readonly regionBounds: number
  readonly regionIndexVisits: number
}

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
  readonly prepared: PreparedGeometry
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
  readonly work: GeometryWork
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
    const work = {
      shapeBounds: 0,
      vertexVisits: 0,
      regionBounds: 0,
      regionIndexVisits: 0
    }
    const localBounds = new Map<SpatialShape, GeometryBounds>()
    const products = new Map<
      SpatialShape,
      Map<readonly SourceRegion[], PreparedGeometry>
    >()
    const prepareBounds = (
      shape: Extract<SpatialShape, { kind: 'triangles' }>,
      region?: SourceRegion
    ): GeometryBounds => {
      const min: [number, number, number] = [Infinity, Infinity, Infinity]
      const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
      const start = region?.indexStart ?? 0
      const end = region
        ? start + region.indexCount
        : shape.positions.length / 3
      if (region) work.regionBounds++
      else work.shapeBounds++
      for (let index = start; index < end; index++) {
        const offset = (region ? shape.indices[index] : index) * 3
        if (region) work.regionIndexVisits++
        else work.vertexVisits++
        for (let axis = 0; axis < 3; axis++) {
          min[axis] = Math.min(min[axis], shape.positions[offset + axis])
          max[axis] = Math.max(max[axis], shape.positions[offset + axis])
        }
      }
      return Object.freeze({ min: Object.freeze(min), max: Object.freeze(max) })
    }
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
    const register = (mesh: Omit<GeometryMesh, 'prepared'>) => {
      if (mesh.shape.kind !== 'triangles')
        throw new Error('Unsupported physical source shape')
      let box = localBounds.get(mesh.shape)
      if (!box) {
        box = prepareBounds(mesh.shape)
        localBounds.set(mesh.shape, box)
      }
      let mappings = products.get(mesh.shape)
      if (!mappings) {
        mappings = new Map()
        products.set(mesh.shape, mappings)
      }
      let prepared = mappings.get(mesh.origin.regions)
      if (!prepared) {
        const shape = mesh.shape
        prepared = Object.freeze({
          bounds: box,
          regions: Object.freeze(
            mesh.origin.regions
              .filter((region) => region.kind !== 'sheet')
              .map((region) =>
                Object.freeze({
                  source: region,
                  bounds: prepareBounds(shape, region)
                })
              )
          )
        })
        mappings.set(mesh.origin.regions, prepared)
      }
      shapes.add(mesh.shape)
      meshes.push(Object.freeze({ ...mesh, prepared }))
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
      fruits: receipt.scene.fruits,
      work: Object.freeze(work)
    })
    this.source = source
    return source
  }

  read(source: GeometrySource): GeometrySource {
    if (source !== this.source)
      throw new Error('Unissued or retired query geometry')
    try {
      this.assertCurrent(source.receipt)
    } catch (error) {
      this.source = undefined
      throw error
    }
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

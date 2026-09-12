import {
  readSourceRegions,
  type SourceRegion
} from '../domain/source-occupancy'
import { createCropPositions, type CropPosition } from '../domain/crop-layout'
import type { SiteMesh } from './site-projection'
import { createCropModels, type CropModel } from '../domain/crop-models'
import type { FarmConfiguration } from '../domain/farm-configuration'
import {
  readSpatialShape,
  readSpatialInstances,
  type SpatialInstance,
  type SpatialShape
} from '../engine/spatial-contract'

export interface CropGeometry {
  species: CropModel['species']
  variant: number
  fruits: readonly Readonly<CropModel['fruits'][number]>[]
  parts: {
    id: string
    regions: readonly SourceRegion[]
    distantRegions: readonly SourceRegion[]
    partitions: readonly Readonly<
      CropModel['parts'][number]['partitions'][number]
    >[]
    distantPartitions: readonly Readonly<
      CropModel['parts'][number]['partitions'][number]
    >[]
    color: number
    roughness: number
    surface?: CropModel['parts'][number]['surface']
    shape: SpatialShape
    distantShape: SpatialShape
  }[]
}

export interface SceneFruit {
  readonly id: string
  readonly plant: Readonly<CropPosition>
  readonly model: CropGeometry
  readonly source: Readonly<CropModel['fruits'][number]>
  readonly position: readonly [number, number, number]
}
export interface PreparedScene {
  readonly revision: number
  readonly meshes: readonly Readonly<SiteMesh>[]
  readonly plants: readonly Readonly<CropPosition>[]
  readonly fruits: readonly SceneFruit[]
}
let sceneRevision = 0

/** Runtime-owned admitted geometry. Placement never contributes to this key. */
export class SiteGeometry {
  private planting?: {
    key: readonly (string | number)[]
    groups: Map<string, readonly SpatialInstance[]>
    plants: readonly Readonly<CropPosition>[]
  }

  cropInstances(config: FarmConfiguration) {
    const key = [
      config.width,
      config.length,
      config.soilInset,
      config.startInset,
      config.endInset,
      ...config.strips.flatMap(({ kind, width }) => [kind, width])
    ]
    const previous = this.planting
    if (
      previous &&
      previous.key.length === key.length &&
      key.every((value, i) => value === previous.key[i])
    )
      return previous.groups
    const groups = new Map<string, SpatialInstance[]>()
    const plants = Object.freeze(
      createCropPositions(config).map((plant) => {
        Object.freeze(plant.position)
        return Object.freeze(plant)
      })
    )
    for (const { species, variant, position, yaw } of plants) {
      const id = `${species}-${variant}`
      const group = groups.get(id) ?? []
      group.push({ position, yaw })
      groups.set(id, group)
    }
    const admitted = new Map(
      [...groups].map(([id, instances]) => [
        id,
        readSpatialInstances(instances)
      ])
    )
    this.planting = { key, groups: admitted, plants }
    return admitted
  }

  private projections = new Map<
    'base' | 'envelope' | 'terrain' | 'cultivation' | 'crops',
    { key: readonly (number | string)[]; meshes: SiteMesh[] }
  >()

  projection(
    group: 'base' | 'envelope' | 'terrain' | 'cultivation' | 'crops',
    key: readonly (number | string)[],
    produce: () => SiteMesh[]
  ) {
    const previous = this.projections.get(group)
    if (
      previous &&
      previous.key.length === key.length &&
      key.every((value, i) => value === previous.key[i])
    )
      return previous.meshes
    const meshes = produce()
    this.projections.set(group, { key: [...key], meshes })
    return meshes
  }

  private primitives = new Map<
    string,
    { readonly shape: SpatialShape; readonly regions: readonly SourceRegion[] }
  >()

  primitive(
    key: string,
    produce: () => { shape: SpatialShape; regions: readonly SourceRegion[] }
  ) {
    const existing = this.primitives.get(key)
    if (existing) return existing
    const raw = produce()
    const shape = readSpatialShape(raw.shape)
    if (shape.kind !== 'triangles')
      throw new Error('Expected primitive triangles')
    const product = Object.freeze({
      shape,
      regions: readSourceRegions(raw.regions, shape.indices.length)
    })
    this.primitives.set(key, product)
    if (this.primitives.size > 32) {
      const oldest = this.primitives.keys().next().value
      if (oldest !== undefined) this.primitives.delete(oldest)
    }
    return product
  }

  private crops: { top: number; bottom: number; models: CropGeometry[] }[] = []

  cropModels(config: Pick<FarmConfiguration, 'netTop' | 'netBottom'>) {
    const found = this.crops.find(
      (entry) =>
        entry.top === config.netTop && entry.bottom === config.netBottom
    )
    if (found) return found.models
    const models = createCropModels(config).map((model) => ({
      species: model.species,
      variant: model.variant,
      fruits: Object.freeze(
        model.fruits.map((fruit) => {
          Object.freeze(fruit.center)
          if (fruit.cutSite) {
            Object.freeze(fruit.cutSite.position)
            Object.freeze(fruit.cutSite)
          }
          return Object.freeze(fruit)
        })
      ),
      parts: model.parts.map((part) => {
        if (!part.distantPartitions || !part.distantRegions)
          throw new Error('Missing distant crop ownership')
        return {
          id: part.id,
          regions: part.regions,
          distantRegions: part.distantRegions,
          partitions: Object.freeze(
            part.partitions.map((span) => Object.freeze(span))
          ),
          distantPartitions: Object.freeze(
            part.distantPartitions.map((span) => Object.freeze(span))
          ),
          color: part.color,
          roughness: part.roughness,
          surface: part.surface,
          shape: readSpatialShape(part.shape),
          distantShape: readSpatialShape(part.distantShape)
        }
      })
    }))
    models.forEach((model) => {
      model.parts.forEach(Object.freeze)
      Object.freeze(model.parts)
      Object.freeze(model)
    })
    Object.freeze(models)
    this.crops.push({ top: config.netTop, bottom: config.netBottom, models })
    if (this.crops.length > 2) this.crops.shift()
    return models
  }

  private scene?: PreparedScene
  private sceneMeshes?: SiteMesh[]

  prepareScene(config: FarmConfiguration, meshes: SiteMesh[]): PreparedScene {
    if (this.scene && this.sceneMeshes === meshes) return this.scene
    this.cropInstances(config)
    if (!this.planting) throw new Error('Missing admitted planting source')
    const plants = this.planting.plants
    const models = new Map(
      (plants.length ? this.cropModels(config) : []).map((model) => [
        `${model.species}-${model.variant}`,
        model
      ])
    )
    const fruits: SceneFruit[] = []
    for (const plant of plants) {
      const model = models.get(`${plant.species}-${plant.variant}`)
      if (!model) throw new Error('Missing admitted cultivar source')
      const cosine = Math.cos(plant.yaw),
        sine = Math.sin(plant.yaw)
      for (const source of model.fruits) {
        const [x, y, z] = source.center
        fruits.push(
          Object.freeze({
            id: `${plant.id}/${source.id}`,
            plant,
            model,
            source,
            position: Object.freeze([
              plant.position[0] + cosine * x + sine * z,
              plant.position[1] + y,
              plant.position[2] - sine * x + cosine * z
            ] as [number, number, number])
          })
        )
      }
    }
    const admittedMeshes = Object.freeze(
      meshes.map((mesh) => {
        const shape = mesh.descriptor.shape
        if (shape.kind !== 'triangles')
          throw new Error('Expected source triangles')
        const regions = readSourceRegions(mesh.regions, shape.indices.length)
        const distant = mesh.descriptor.distant?.shape
        const distantRegions =
          distant && mesh.distantRegions
            ? readSourceRegions(
                mesh.distantRegions,
                distant.kind === 'triangles' ? distant.indices.length : -1
              )
            : undefined
        if (distant && !distantRegions)
          throw new Error('Missing distant source regions')
        return Object.freeze({
          ...mesh,
          regions,
          ...(distantRegions ? { distantRegions } : {})
        })
      })
    )
    this.sceneMeshes = meshes
    this.scene = Object.freeze({
      revision: ++sceneRevision,
      meshes: admittedMeshes,
      plants,
      fruits: Object.freeze(fruits)
    })
    return this.scene
  }

  getScene(): PreparedScene {
    if (!this.scene) throw new Error('No admitted scene source')
    return this.scene
  }

  isCurrentScene(scene: PreparedScene) {
    return this.scene === scene
  }

  clear() {
    this.scene = undefined
    this.sceneMeshes = undefined
    this.planting = undefined
    this.projections.clear()
    this.crops = []
    this.primitives.clear()
  }
}

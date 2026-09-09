import { createCropPositions } from '../domain/crop-layout'
import type { SiteMesh } from './site-projection'
import { createCropModels, type CropModel } from '../domain/crop-models'
import type { FarmConfiguration } from '../domain/farm-configuration'
import {
  readSpatialShape,
  readSpatialInstances,
  type SpatialInstance,
  type SpatialShape
} from '../engine/spatial-contract'

interface CropGeometry {
  species: CropModel['species']
  variant: number
  parts: {
    color: number
    roughness: number
    surface?: CropModel['parts'][number]['surface']
    shape: SpatialShape
    distantShape: SpatialShape
  }[]
}

/** Runtime-owned admitted geometry. Placement never contributes to this key. */
export class SiteGeometry {
  private planting?: {
    key: readonly (string | number)[]
    groups: Map<string, readonly SpatialInstance[]>
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
    for (const { species, variant, position, yaw } of createCropPositions(
      config
    )) {
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
    this.planting = { key, groups: admitted }
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

  private primitives = new Map<string, SpatialShape>()

  primitive(key: string, produce: () => SpatialShape) {
    const existing = this.primitives.get(key)
    if (existing) return existing
    const shape = readSpatialShape(produce())
    this.primitives.set(key, shape)
    if (this.primitives.size > 32) {
      const oldest = this.primitives.keys().next().value
      if (oldest !== undefined) this.primitives.delete(oldest)
    }
    return shape
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
      parts: model.parts.map((part) => ({
        color: part.color,
        roughness: part.roughness,
        surface: part.surface,
        shape: readSpatialShape(part.shape),
        distantShape: readSpatialShape(part.distantShape)
      }))
    }))
    this.crops.push({ top: config.netTop, bottom: config.netBottom, models })
    if (this.crops.length > 2) this.crops.shift()
    return models
  }

  clear() {
    this.planting = undefined
    this.projections.clear()
    this.crops = []
    this.primitives.clear()
  }
}

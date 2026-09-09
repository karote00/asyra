import { createCropModels, type CropModel } from '../domain/crop-models'
import type { FarmConfiguration } from '../domain/farm-configuration'
import { readSpatialShape, type SpatialShape } from '../engine/spatial-contract'

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
    this.crops = []
    this.primitives.clear()
  }
}

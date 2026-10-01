import {
  readSourceRegions,
  readSourcePatches,
  type SourceRegion
} from '../domain/source-occupancy'
import { createCropPositions, type CropPosition } from '../domain/crop-layout'
import type { SiteMesh } from './site-projection'
import {
  createCropModels,
  type CropModel,
  type CropSourceAnatomy,
  type CropSourcePatch
} from '../domain/crop-models'
import type { FarmConfiguration } from '../domain/farm-configuration'
import {
  add,
  subtract,
  multiply,
  divide,
  interval
} from '../domain/scalar-arithmetic'
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
    patches: readonly CropSourcePatch[]
    distantPatches: readonly CropSourcePatch[]
    sourceAnatomy?: CropSourceAnatomy
    distantSourceAnatomy?: CropSourceAnatomy
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

function admitCropSourceAnatomy(
  input: CropSourceAnatomy | undefined,
  regions: readonly SourceRegion[],
  indexCount: number
): CropSourceAnatomy | undefined {
  if (input === undefined) return
  try {
    if (
      input.format !== 'crop-source-anatomy/1' ||
      !Array.isArray(input.patches)
    )
      throw new Error('Invalid format')
    const sources = readSourcePatches(
      input.patches.map((patch) => patch.source),
      regions,
      indexCount
    )
    const occupied = new Set<number>()
    const patches = input.patches.map((patch, index) => {
      if (
        patch.id !== patch.source.id ||
        !['leaf-blade', 'leaf-vein-ribbon', 'leaf-hair'].includes(patch.role)
      )
        throw new Error('Invalid patch')
      const source = sources[index]
      for (const range of source.ranges)
        for (
          let triangle = range.indexStart;
          triangle < range.indexStart + range.indexCount;
          triangle += 3
        ) {
          if (occupied.has(triangle)) throw new Error('Duplicate triangle')
          occupied.add(triangle)
        }
      if (Object.isFrozen(patch) && patch.source === source) return patch
      return Object.freeze({ id: patch.id, role: patch.role, source })
    })
    if (
      Object.isFrozen(input) &&
      Object.isFrozen(input.patches) &&
      patches.every((patch, index) => patch === input.patches[index])
    )
      return input
    return Object.freeze({
      format: 'crop-source-anatomy/1',
      patches: Object.freeze(patches)
    })
  } catch {
    throw new Error('Invalid crop source anatomy')
  }
}

function admitCropPatches(
  input: readonly CropSourcePatch[],
  regions: readonly SourceRegion[],
  indexCount: number,
  partitions: readonly CropModel['parts'][number]['partitions'][number][],
  fruits: readonly CropModel['fruits'][number][]
): readonly CropSourcePatch[] {
  const sources = readSourcePatches(
    input.map((patch) => patch.source),
    regions,
    indexCount
  )
  const occupied = new Set<number>()
  return Object.freeze(
    input.map((patch, index) => {
      if (
        patch.id !== patch.source.id ||
        !fruits.some((fruit) => fruit.id === patch.targetFruitId) ||
        ![
          'fruit-skin',
          'fine-spines',
          'calyx',
          'retained-pedicel',
          'plant-pedicel',
          'fruit-detail'
        ].includes(patch.role) ||
        patch.owner !==
          (patch.role === 'plant-pedicel' ? 'plant' : 'target-fruit')
      )
        throw new Error('Invalid botanical patch identity')
      const source = sources[index]
      for (const range of source.ranges) {
        const partition = partitions.find(
          (span) =>
            range.indexStart >= span.indexStart &&
            range.indexStart + range.indexCount <=
              span.indexStart + span.indexCount
        )
        if (
          !partition ||
          partition.fruitId !==
            (patch.owner === 'plant' ? null : patch.targetFruitId)
        )
          throw new Error('Invalid botanical patch ownership')
        for (
          let triangle = range.indexStart;
          triangle < range.indexStart + range.indexCount;
          triangle += 3
        ) {
          if (occupied.has(triangle))
            throw new Error('Overlapping botanical source patches')
          occupied.add(triangle)
        }
      }
      return Object.freeze({
        id: patch.id,
        targetFruitId: patch.targetFruitId,
        owner: patch.owner,
        role: patch.role,
        source
      })
    })
  )
}

function admitCutBoundaries(model: CropGeometry): CropGeometry['fruits'] {
  return Object.freeze(
    model.fruits.map((fruit) => {
      const cut = fruit.cutSite
      if (!cut || cut.kind === 'unknown') return fruit
      const part = model.parts.find(
        (candidate) => candidate.id === cut.boundary.partId
      )
      const plant = part?.patches.find(
        (patch) => patch.id === cut.boundary.plantPatchId
      )
      const retained = part?.patches.find(
        (patch) => patch.id === cut.boundary.retainedPatchId
      )
      if (
        !part ||
        part.shape.kind !== 'triangles' ||
        !plant ||
        !retained ||
        plant.role !== 'plant-pedicel' ||
        retained.role !== 'retained-pedicel' ||
        plant.targetFruitId !== fruit.id ||
        retained.targetFruitId !== fruit.id ||
        plant.source.region !== retained.source.region ||
        ![...cut.position, ...cut.towardPlant].every(Number.isFinite) ||
        Math.hypot(...cut.towardPlant) === 0
      )
        throw new Error('Invalid botanical source cut boundary')
      const shape = part.shape
      const vertices = (patch: CropSourcePatch) =>
        new Set(
          patch.source.ranges.flatMap((range) =>
            shape.indices.slice(
              range.indexStart,
              range.indexStart + range.indexCount
            )
          )
        )
      const plantVertices = vertices(plant)
      const shared = [...vertices(retained)].filter((vertex) =>
        plantVertices.has(vertex)
      )
      const declared = cut.boundary.sourceVertexIndices
      if (
        shared.length < 3 ||
        declared.length !== shared.length ||
        new Set(declared).size !== declared.length ||
        declared.some(
          (vertex) => !Number.isSafeInteger(vertex) || !shared.includes(vertex)
        )
      )
        throw new Error('Invalid botanical shared source ring')
      const proximal = [...plantVertices].filter(
        (vertex) => !shared.includes(vertex)
      )
      if (proximal.length !== shared.length)
        throw new Error('Invalid botanical adjacent source ring')
      const centroid = (ring: readonly number[]) =>
        [0, 1, 2].map((axis) =>
          divide(
            ring.reduce(
              (sum, vertex) =>
                add(sum, interval(shape.positions[vertex * 3 + axis])),
              interval(0)
            ),
            interval(ring.length)
          )
        )
      const boundaryPosition = centroid(shared)
      const attachmentPosition = centroid(proximal)
      const direction = attachmentPosition.map((value, axis) =>
        subtract(value, boundaryPosition[axis])
      )
      const contains = (value: { low: number; high: number }, scalar: number) =>
        Number.isFinite(value.low) &&
        Number.isFinite(value.high) &&
        scalar >= value.low &&
        scalar <= value.high
      const aligned = direction.reduce(
        (sum, value, axis) =>
          add(sum, multiply(value, interval(cut.towardPlant[axis]))),
        interval(0)
      )
      if (
        !boundaryPosition.every((value, axis) =>
          contains(value, cut.position[axis])
        ) ||
        !direction.every((value, axis) =>
          contains(value, cut.towardPlant[axis])
        ) ||
        !direction.some((value) => value.low > 0 || value.high < 0) ||
        aligned.low <= 0
      ) {
        // Retain the crop and source identities; only unproved numeric cut evidence retires.
        const unavailable = { ...fruit }
        delete unavailable.cutSite
        return Object.freeze(unavailable)
      }
      return fruit
    })
  )
}

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
            if (fruit.cutSite.kind === 'synthetic-source-boundary') {
              Object.freeze(fruit.cutSite.position)
              Object.freeze(fruit.cutSite.towardPlant)
              Object.freeze(fruit.cutSite.boundary.sourceVertexIndices)
              Object.freeze(fruit.cutSite.boundary)
              Object.freeze(fruit.cutSite.evidence)
            }
            Object.freeze(fruit.cutSite)
          }
          return Object.freeze(fruit)
        })
      ),
      parts: model.parts.map((part) => {
        if (
          !part.distantPartitions ||
          !part.distantRegions ||
          !part.distantPatches
        )
          throw new Error('Missing distant crop ownership')
        const shape = readSpatialShape(part.shape)
        const distantShape = readSpatialShape(part.distantShape)
        if (shape.kind !== 'triangles' || distantShape.kind !== 'triangles')
          throw new Error('Expected botanical source triangles')
        const regions = readSourceRegions(part.regions, shape.indices.length)
        const distantRegions = readSourceRegions(
          part.distantRegions,
          distantShape.indices.length
        )
        return {
          id: part.id,
          regions,
          distantRegions,
          patches: admitCropPatches(
            part.patches,
            regions,
            shape.indices.length,
            part.partitions,
            model.fruits
          ),
          distantPatches: admitCropPatches(
            part.distantPatches,
            distantRegions,
            distantShape.indices.length,
            part.distantPartitions,
            model.fruits
          ),
          ...(part.sourceAnatomy
            ? {
                sourceAnatomy: admitCropSourceAnatomy(
                  part.sourceAnatomy,
                  regions,
                  shape.indices.length
                )
              }
            : {}),
          ...(part.distantSourceAnatomy
            ? {
                distantSourceAnatomy: admitCropSourceAnatomy(
                  part.distantSourceAnatomy,
                  distantRegions,
                  distantShape.indices.length
                )
              }
            : {}),
          partitions: Object.freeze(
            part.partitions.map((span) => Object.freeze(span))
          ),
          distantPartitions: Object.freeze(
            part.distantPartitions.map((span) => Object.freeze(span))
          ),
          color: part.color,
          roughness: part.roughness,
          surface: part.surface,
          shape,
          distantShape
        }
      })
    }))
    models.forEach((model) => {
      model.fruits = admitCutBoundaries(model)
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
        const sourceAnatomy = admitCropSourceAnatomy(
          mesh.sourceAnatomy,
          regions,
          shape.indices.length
        )
        const distantSourceAnatomy = distant
          ? admitCropSourceAnatomy(
              mesh.distantSourceAnatomy,
              distantRegions ?? [],
              distant.kind === 'triangles' ? distant.indices.length : -1
            )
          : undefined
        if (!distant && mesh.distantSourceAnatomy)
          throw new Error('Invalid crop source anatomy')
        return Object.freeze({
          ...mesh,
          regions,
          ...(distantRegions ? { distantRegions } : {}),
          ...(sourceAnatomy ? { sourceAnatomy } : {}),
          ...(distantSourceAnatomy ? { distantSourceAnatomy } : {})
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

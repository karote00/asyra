import * as farmGeometry from '../domain/farm-configuration'
import * as greenhouse from '../domain/greenhouse'
import type { Point3 } from '../domain/greenhouse'
import type { SourceRegion } from '../domain/source-occupancy'
import type {
  GrowthVolume,
  SceneDemandConfiguration,
  SceneDemandEvidence
} from '../domain/scene-demand-configuration'
import type { SpatialInstance, SpatialShape } from '../engine/spatial-contract'
import type {
  CropGeometry,
  PreparedScene,
  SceneFruit
} from '../render-app/site-geometry'
import type { SiteMesh } from '../render-app/site-projection'
import { add, divide, interval, subtract } from './query-arithmetic'
import {
  prepareQueryForwardFrame,
  prepareQueryInstanceFrame,
  transformQueryPoint
} from './ray-query'

export interface SceneDemandBounds {
  readonly min: Point3
  readonly max: Point3
}

export interface SceneDemandWork {
  readonly siteConfigurations: number
  readonly layouts: number
  readonly localBounds: number
  readonly sourceIndexVisits: number
  readonly descriptorFrames: number
  readonly installedTransforms: number
  readonly envelopeCorners: number
  readonly targetPartitions: number
  readonly targetPatches: number
}

export interface SceneDemandRouteProduct {
  readonly bay: number
  readonly stripId: string
  readonly stripIndex: number
  readonly strip: farmGeometry.ConfigurationStrip
  readonly volume: SceneDemandBounds
}

export interface SceneDemandChannelRegion {
  readonly bay: number
  readonly stripId: string
  readonly strip: farmGeometry.ConfigurationStrip
  readonly bounds: SceneDemandBounds
  readonly relation: 'hard-exclusion'
}

export interface SceneDemandTargetPartition {
  readonly part: CropGeometry['parts'][number]
  readonly partition: CropGeometry['parts'][number]['partitions'][number]
  readonly mesh: Readonly<SiteMesh>
  readonly instance: number
  readonly transform: {
    readonly descriptor: SiteMesh['descriptor']
    readonly instance: SpatialInstance
  }
  readonly bounds: SceneDemandBounds
}

export interface SceneDemandTargetPatch {
  readonly part: CropGeometry['parts'][number]
  readonly patch: CropGeometry['parts'][number]['patches'][number]
  readonly mesh: Readonly<SiteMesh>
  readonly instance: number
  readonly transform: SceneDemandTargetPartition['transform']
  readonly bounds: SceneDemandBounds
}

export interface SceneDemandTarget {
  readonly id: string
  readonly fruit: SceneFruit
  readonly installedCenter: Point3
  readonly partitions: readonly SceneDemandTargetPartition[]
  readonly bounds: SceneDemandBounds
  readonly anatomy: {
    readonly support: 'complete' | 'unknown'
    readonly cut: 'complete' | 'unknown'
    readonly reasons: readonly string[]
    readonly patches: readonly SceneDemandTargetPatch[]
  }
  readonly cutSite?: {
    readonly source: Extract<
      SceneFruit['source']['cutSite'],
      { kind: 'synthetic-source-boundary' }
    >
    readonly bounds: SceneDemandBounds
    readonly transform: SceneDemandTargetPartition['transform']
  }
}

export interface SceneDemandReachSide {
  readonly low: {
    readonly metres: number
    readonly targetIds: readonly string[]
  }
  readonly high: {
    readonly metres: number
    readonly targetIds: readonly string[]
  }
}

export type SceneDemandExclusion =
  | {
      readonly kind: 'growth'
      readonly relation: 'hard-exclusion'
      readonly volume: GrowthVolume
      readonly bounds: SceneDemandBounds
    }
  | {
      readonly kind: 'channel'
      readonly relation: 'hard-exclusion'
      readonly channel: SceneDemandChannelRegion
      readonly bounds: SceneDemandBounds
    }
  | {
      readonly kind: 'source'
      readonly relation: 'conservative-source-envelope'
      readonly mesh: Readonly<SiteMesh>
      readonly region: SourceRegion
      readonly instance: number
      readonly transform: {
        readonly descriptor: SiteMesh['descriptor']
        readonly instance?: SpatialInstance
      }
      readonly bounds: SceneDemandBounds
    }

export interface SceneDemand {
  readonly identity: Readonly<object>
  readonly revision: number
  readonly farm: farmGeometry.FarmConfiguration
  readonly scene: PreparedScene
  readonly configuration: SceneDemandConfiguration
  readonly evidence: SceneDemandEvidence
  readonly status: 'ready' | 'blocked' | 'unknown'
  readonly reasons: readonly string[]
  readonly route: SceneDemandRouteProduct | null
  readonly channels: readonly SceneDemandChannelRegion[]
  readonly targets: {
    readonly left: readonly SceneDemandTarget[]
    readonly right: readonly SceneDemandTarget[]
    readonly unassigned: readonly SceneDemandTarget[]
  }
  readonly reach: {
    readonly left: SceneDemandReachSide | null
    readonly right: SceneDemandReachSide | null
  }
  readonly freePassage: {
    readonly kind: 'axis-aligned-difference'
    readonly route: SceneDemandBounds | null
    readonly exclusions: readonly SceneDemandExclusion[]
    readonly status: 'ready' | 'blocked' | 'unknown'
    readonly reasons: readonly string[]
  }
  readonly work: SceneDemandWork
}

type TriangleShape = Extract<SpatialShape, { kind: 'triangles' }>
interface Span {
  readonly indexStart: number
  readonly indexCount: number
}
type IntervalFrame = ReturnType<typeof prepareQueryForwardFrame>

const obstacleLayers = new Set<SiteMesh['layer']>([
  'cucumbers',
  'tomatoes',
  'net',
  'ties',
  'supports',
  'clips',
  'film',
  'steel',
  'barriers'
])

let demandRevision = 0

const point = (values: number[]): Point3 =>
  Object.freeze(values) as unknown as Point3

const bounds = (min: number[], max: number[]): SceneDemandBounds =>
  Object.freeze({ min: point(min), max: point(max) })

const intersects = (first: SceneDemandBounds, second: SceneDemandBounds) =>
  first.min.every(
    (minimum, axis) =>
      minimum < second.max[axis] && first.max[axis] > second.min[axis]
  )

const contains = (outer: SceneDemandBounds, inner: SceneDemandBounds) =>
  outer.min.every(
    (minimum, axis) =>
      minimum <= inner.min[axis] && outer.max[axis] >= inner.max[axis]
  )

const expanded = (value: SceneDemandBounds, margin: number) => {
  if (margin === 0) return value
  return bounds(
    value.min.map(
      (minimum) => subtract(interval(minimum), interval(margin)).low
    ),
    value.max.map((maximum) => add(interval(maximum), interval(margin)).high)
  )
}

function transformedBounds(
  local: SceneDemandBounds,
  frames: readonly IntervalFrame[],
  work: {
    envelopeCorners: number
  }
): SceneDemandBounds {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let corner = 0; corner < 8; corner++) {
    let value: ReturnType<typeof transformQueryPoint> = [
      interval(corner & 1 ? local.max[0] : local.min[0]),
      interval(corner & 2 ? local.max[1] : local.min[1]),
      interval(corner & 4 ? local.max[2] : local.min[2])
    ]
    for (const frame of frames) value = transformQueryPoint(frame, value)
    work.envelopeCorners++
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], value[axis].low)
      max[axis] = Math.max(max[axis], value[axis].high)
    }
  }
  if (![...min, ...max].every(Number.isFinite))
    throw new Error('Unbounded scene demand source envelope')
  return bounds(min, max)
}

function joinedBounds(values: readonly SceneDemandBounds[]): SceneDemandBounds {
  if (!values.length)
    throw new Error('Missing scene demand target source bounds')
  return bounds(
    [0, 1, 2].map((axis) =>
      Math.min(...values.map((value) => value.min[axis]))
    ),
    [0, 1, 2].map((axis) => Math.max(...values.map((value) => value.max[axis])))
  )
}

const reach = (
  targets: readonly SceneDemandTarget[]
): SceneDemandReachSide | null => {
  if (!targets.length) return null
  const low = Math.min(...targets.map((target) => target.bounds.min[1]))
  const high = Math.max(...targets.map((target) => target.bounds.max[1]))
  return Object.freeze({
    low: Object.freeze({
      metres: low,
      targetIds: Object.freeze(
        targets
          .filter((target) => target.bounds.min[1] === low)
          .map(({ id }) => id)
      )
    }),
    high: Object.freeze({
      metres: high,
      targetIds: Object.freeze(
        targets
          .filter((target) => target.bounds.max[1] === high)
          .map(({ id }) => id)
      )
    })
  })
}

/** One route-bound W1 product. It prepares source envelopes but performs no exact CSG. */
export function prepareSceneDemand(
  farm: farmGeometry.FarmConfiguration,
  scene: PreparedScene,
  configuration: SceneDemandConfiguration
): SceneDemand {
  const mutableWork = {
    siteConfigurations: 0,
    layouts: 0,
    localBounds: 0,
    sourceIndexVisits: 0,
    descriptorFrames: 0,
    installedTransforms: 0,
    envelopeCorners: 0,
    targetPartitions: 0,
    targetPatches: 0
  }
  const reasons: string[] = []
  const freeReasons: string[] = []
  const exclusions: SceneDemandExclusion[] = []
  const targets: {
    left: SceneDemandTarget[]
    right: SceneDemandTarget[]
    unassigned: SceneDemandTarget[]
  } = { left: [], right: [], unassigned: [] }

  if (configuration.route.kind === 'unknown') {
    reasons.push('route-unknown')
    if (configuration.evidence.kind === 'unknown')
      reasons.push('evidence-unknown')
    if (configuration.growth.kind === 'unknown') reasons.push('growth-unknown')
    if (configuration.clearanceMargin.kind === 'unknown')
      reasons.push('clearance-margin-unknown')
    return Object.freeze({
      identity: Object.freeze({}),
      revision: ++demandRevision,
      farm,
      scene,
      configuration,
      evidence: configuration.evidence,
      status: 'unknown',
      reasons: Object.freeze(reasons),
      route: null,
      channels: Object.freeze([]),
      targets: Object.freeze({
        left: Object.freeze([]),
        right: Object.freeze([]),
        unassigned: Object.freeze([])
      }),
      reach: Object.freeze({ left: null, right: null }),
      freePassage: Object.freeze({
        kind: 'axis-aligned-difference',
        route: null,
        exclusions: Object.freeze([]),
        status: 'unknown',
        reasons: Object.freeze(['route-unknown'])
      }),
      work: Object.freeze(mutableWork)
    })
  }

  const site = farmGeometry.configurationSite(farm)
  mutableWork.siteConfigurations++
  const layout = greenhouse.createLayout(site, farm.strips)
  mutableWork.layouts++
  const routeInput = configuration.route
  const stripIndex = farm.strips.findIndex(
    ({ id }) => id === routeInput.stripId
  )
  const selected =
    stripIndex < 0
      ? undefined
      : layout.strips[routeInput.bay * farm.strips.length + stripIndex]
  const channels = Object.freeze(
    layout.strips.flatMap((strip, index) => {
      if (strip.kind !== 'drain') return []
      const authored = farm.strips[index % farm.strips.length]
      return [
        Object.freeze({
          bay: strip.bay,
          stripId: authored.id,
          strip: authored,
          bounds: bounds(
            [strip.x, -site.height, 0],
            [strip.x + strip.width, 0, site.length]
          ),
          relation: 'hard-exclusion' as const
        })
      ]
    })
  )
  let route: SceneDemandRouteProduct | null = null
  if (!selected || selected.bay !== routeInput.bay)
    reasons.push('route-strip-missing')
  else if (selected.kind !== 'soil') reasons.push('route-is-channel')
  else if (routeInput.until > site.length)
    reasons.push('route-interval-outside-farm')
  else {
    route = Object.freeze({
      bay: routeInput.bay,
      stripId: routeInput.stripId,
      stripIndex,
      strip: farm.strips[stripIndex],
      volume: bounds(
        [selected.x, 0, routeInput.from],
        [selected.x + selected.width, site.eave, routeInput.until]
      )
    })
  }
  if (!route) {
    return Object.freeze({
      identity: Object.freeze({}),
      revision: ++demandRevision,
      farm,
      scene,
      configuration,
      evidence: configuration.evidence,
      status: reasons.includes('route-is-channel') ? 'blocked' : 'unknown',
      reasons: Object.freeze(reasons),
      route,
      channels,
      targets: Object.freeze({
        left: Object.freeze([]),
        right: Object.freeze([]),
        unassigned: Object.freeze([])
      }),
      reach: Object.freeze({ left: null, right: null }),
      freePassage: Object.freeze({
        kind: 'axis-aligned-difference',
        route: null,
        exclusions: Object.freeze([]),
        status: reasons.includes('route-is-channel') ? 'blocked' : 'unknown',
        reasons: Object.freeze([...reasons])
      }),
      work: Object.freeze(mutableWork)
    })
  }

  if (configuration.evidence.kind === 'unknown')
    reasons.push('evidence-unknown')
  if (configuration.growth.kind === 'unknown') reasons.push('growth-unknown')
  else if (configuration.growth.coverage === 'discrete')
    reasons.push('growth-coverage-discrete')
  if (configuration.clearanceMargin.kind === 'unknown')
    reasons.push('clearance-margin-unknown')

  const wholeBounds = new Map<TriangleShape, SceneDemandBounds>()
  const spanBounds = new Map<TriangleShape, Map<object, SceneDemandBounds>>()
  const localBounds = (shape: TriangleShape, span?: Span & object) => {
    if (!span) {
      const previous = wholeBounds.get(shape)
      if (previous) return previous
    } else {
      const previous = spanBounds.get(shape)?.get(span)
      if (previous) return previous
    }
    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]
    const count = span?.indexCount ?? shape.positions.length / 3
    const start = span?.indexStart ?? 0
    for (let index = start; index < start + count; index++) {
      const vertex = span ? shape.indices[index] : index
      if (span) mutableWork.sourceIndexVisits++
      const offset = vertex * 3
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], shape.positions[offset + axis])
        max[axis] = Math.max(max[axis], shape.positions[offset + axis])
      }
    }
    if (![...min, ...max].every(Number.isFinite))
      throw new Error('Invalid scene demand source bounds')
    const product = bounds(min, max)
    mutableWork.localBounds++
    if (span) {
      let products = spanBounds.get(shape)
      if (!products) {
        products = new Map()
        spanBounds.set(shape, products)
      }
      products.set(span, product)
    } else wholeBounds.set(shape, product)
    return product
  }

  const descriptorFrames = new Map<SiteMesh['descriptor'], IntervalFrame>()
  const descriptorFrame = (descriptor: SiteMesh['descriptor']) => {
    const previous = descriptorFrames.get(descriptor)
    if (previous) return previous
    const product = prepareQueryForwardFrame(descriptor)
    descriptorFrames.set(descriptor, product)
    mutableWork.descriptorFrames++
    return product
  }
  const installedFrames = new Map<SpatialInstance, IntervalFrame>()
  const installedFrame = (instance: SpatialInstance) => {
    const previous = installedFrames.get(instance)
    if (previous) return previous
    const product = prepareQueryInstanceFrame(instance)
    installedFrames.set(instance, product)
    mutableWork.installedTransforms++
    return product
  }
  const cropMeshes = new Map<SpatialShape, Readonly<SiteMesh>>()
  for (const mesh of scene.meshes)
    if (mesh.layer === 'cucumbers' || mesh.layer === 'tomatoes') {
      if (cropMeshes.has(mesh.descriptor.shape))
        throw new Error('Ambiguous scene demand crop source')
      cropMeshes.set(mesh.descriptor.shape, mesh)
    }
  const plantKey = (position: readonly number[], yaw: number) =>
    `${position[0]}:${position[1]}:${position[2]}:${yaw}`
  const cropInstances = new Map<SpatialShape, Map<string, number>>()
  const cropPlacements = new Map<string, SpatialInstance>()
  for (const [shape, mesh] of cropMeshes) {
    const instances = new Map<string, number>()
    mesh.descriptor.instances?.forEach((instance, index) => {
      const key = plantKey(instance.position, instance.yaw)
      instances.set(key, index)
      if (!cropPlacements.has(key)) cropPlacements.set(key, instance)
    })
    cropInstances.set(shape, instances)
  }

  const routeCenter = divide(
    add(interval(route.volume.min[0]), interval(route.volume.max[0])),
    interval(2)
  )
  for (const fruit of scene.fruits) {
    if (
      fruit.plant.bay !== route.bay ||
      fruit.plant.position[0] < route.volume.min[0] ||
      fruit.plant.position[0] > route.volume.max[0]
    )
      continue
    const partitions: SceneDemandTargetPartition[] = []
    const patches: SceneDemandTargetPatch[] = []
    let targetFrame: IntervalFrame | undefined
    for (const part of fruit.model.parts) {
      if (part.shape.kind !== 'triangles')
        throw new Error('Unsupported scene demand target shape')
      const mesh = cropMeshes.get(part.shape)
      const instance = cropInstances
        .get(part.shape)
        ?.get(plantKey(fruit.plant.position, fruit.plant.yaw))
      if (!mesh || instance === undefined || !mesh.descriptor.instances)
        throw new Error('Missing installed scene demand crop source')
      const placement = mesh.descriptor.instances[instance]
      for (const patch of part.patches) {
        if (patch.targetFruitId !== fruit.source.id) continue
        const frames = [
          installedFrame(placement),
          descriptorFrame(mesh.descriptor)
        ]
        const patchBounds = joinedBounds(
          patch.source.ranges.map((range) =>
            transformedBounds(
              localBounds(part.shape as TriangleShape, range),
              frames,
              mutableWork
            )
          )
        )
        mutableWork.targetPatches++
        patches.push(
          Object.freeze({
            part,
            patch,
            mesh,
            instance,
            transform: Object.freeze({
              descriptor: mesh.descriptor,
              instance: placement
            }),
            bounds: patchBounds
          })
        )
      }
      for (const partition of part.partitions) {
        if (partition.fruitId !== fruit.source.id) continue
        const frame = installedFrame(placement)
        targetFrame ??= frame
        const partitionBounds = transformedBounds(
          localBounds(part.shape, partition),
          [frame, descriptorFrame(mesh.descriptor)],
          mutableWork
        )
        mutableWork.targetPartitions++
        partitions.push(
          Object.freeze({
            part,
            partition,
            mesh,
            instance,
            transform: Object.freeze({
              descriptor: mesh.descriptor,
              instance: placement
            }),
            bounds: partitionBounds
          })
        )
      }
    }
    if (!partitions.length)
      throw new Error('Missing fruit-owned source partition')
    if (!targetFrame) throw new Error('Missing installed scene demand target')
    const targetBounds = joinedBounds(partitions.map(({ bounds }) => bounds))
    if (
      targetBounds.max[2] < route.volume.min[2] ||
      targetBounds.min[2] > route.volume.max[2]
    )
      continue
    let cutSite: SceneDemandTarget['cutSite']
    const sourceCut = fruit.source.cutSite
    const plantPatch = patches.find(
      (item) =>
        sourceCut?.kind === 'synthetic-source-boundary' &&
        item.part.id === sourceCut.boundary.partId &&
        item.patch.id === sourceCut.boundary.plantPatchId
    )
    const anatomyReasons: string[] = []
    const roles = new Set(patches.map(({ patch }) => patch.role))
    const supportComplete =
      roles.has('fruit-skin') &&
      (fruit.model.species === 'cucumber-1914'
        ? fruit.source.spineCount > 0 &&
          patches.filter(({ patch }) => patch.role === 'fine-spines').length ===
            fruit.source.spineCount
        : roles.has('calyx') && roles.has('retained-pedicel'))
    if (!supportComplete) anatomyReasons.push('support-anatomy-unknown')
    if (
      sourceCut?.kind === 'synthetic-source-boundary' &&
      sourceCut.evidence?.kind === 'synthetic' &&
      plantPatch &&
      patches.some(
        (item) =>
          item.part === plantPatch.part &&
          item.patch.id === sourceCut.boundary.retainedPatchId
      )
    ) {
      const local = bounds(
        sourceCut.position.slice(),
        sourceCut.position.slice()
      )
      cutSite = Object.freeze({
        source: sourceCut,
        transform: plantPatch.transform,
        bounds: transformedBounds(
          local,
          [
            installedFrame(plantPatch.transform.instance),
            descriptorFrame(plantPatch.transform.descriptor)
          ],
          mutableWork
        )
      })
    }
    if (!cutSite)
      anatomyReasons.push(
        sourceCut?.kind === 'unknown' ? sourceCut.reason : 'cut-anatomy-unknown'
      )
    const target = Object.freeze({
      id: fruit.id,
      fruit,
      installedCenter: fruit.position,
      partitions: Object.freeze(partitions),
      bounds: targetBounds,
      anatomy: Object.freeze({
        support: supportComplete ? ('complete' as const) : ('unknown' as const),
        cut: cutSite ? ('complete' as const) : ('unknown' as const),
        reasons: Object.freeze(anatomyReasons),
        patches: Object.freeze(patches)
      }),
      ...(cutSite ? { cutSite } : {})
    })
    const installedCenter = interval(fruit.position[0])
    if (installedCenter.high < routeCenter.low) targets.left.push(target)
    else if (installedCenter.low > routeCenter.high) targets.right.push(target)
    else targets.unassigned.push(target)
  }

  if (configuration.growth.kind === 'bounded') {
    const plants = new Map(scene.plants.map((plant) => [plant.id, plant]))
    for (const volume of configuration.growth.volumes) {
      let product = bounds(volume.min.slice(), volume.max.slice())
      if (volume.anchor.kind === 'plant') {
        const plant = plants.get(volume.anchor.plantId)
        const placement = plant
          ? cropPlacements.get(plantKey(plant.position, plant.yaw))
          : undefined
        if (!plant || !placement) {
          reasons.push('growth-anchor-missing')
          continue
        }
        product = transformedBounds(
          product,
          [installedFrame(placement)],
          mutableWork
        )
      }
      if (!intersects(product, route.volume)) continue
      exclusions.push(
        Object.freeze({
          kind: 'growth',
          relation: 'hard-exclusion',
          volume,
          bounds: product
        })
      )
      if (
        contains(product, route.volume) &&
        !reasons.includes('growth-covers-route')
      )
        reasons.push('growth-covers-route')
    }
  }

  for (const channel of channels)
    if (intersects(channel.bounds, route.volume))
      exclusions.push(
        Object.freeze({
          kind: 'channel',
          relation: 'hard-exclusion',
          channel,
          bounds: channel.bounds
        })
      )

  const margin =
    configuration.clearanceMargin.kind === 'bounded'
      ? configuration.clearanceMargin.metres
      : 0
  for (const mesh of scene.meshes) {
    if (!obstacleLayers.has(mesh.layer)) continue
    const shape = mesh.descriptor.shape
    if (shape.kind !== 'triangles')
      throw new Error('Unsupported scene demand source shape')
    const sourceDescriptorFrame = descriptorFrame(mesh.descriptor)
    const placements: readonly (SpatialInstance | undefined)[] = mesh.descriptor
      .instances ?? [undefined]
    const whole = localBounds(shape)
    for (let instance = 0; instance < placements.length; instance++) {
      const placement = placements[instance]
      const frames: IntervalFrame[] = []
      if (placement) frames.push(installedFrame(placement))
      frames.push(sourceDescriptorFrame)
      if (
        !intersects(
          expanded(transformedBounds(whole, frames, mutableWork), margin),
          route.volume
        )
      )
        continue
      for (const region of mesh.regions) {
        const product = expanded(
          transformedBounds(localBounds(shape, region), frames, mutableWork),
          margin
        )
        if (!intersects(product, route.volume)) continue
        exclusions.push(
          Object.freeze({
            kind: 'source',
            relation: 'conservative-source-envelope',
            mesh,
            region,
            instance,
            transform: Object.freeze({
              descriptor: mesh.descriptor,
              ...(placement ? { instance: placement } : {})
            }),
            bounds: product
          })
        )
      }
    }
  }
  if (
    exclusions.some(
      (exclusion) => exclusion.relation === 'conservative-source-envelope'
    )
  )
    freeReasons.push('exact-source-query-required')
  if (reasons.includes('growth-covers-route'))
    freeReasons.push('growth-covers-route')
  for (const reason of reasons)
    if (!freeReasons.includes(reason)) freeReasons.push(reason)
  const blocked = reasons.includes('growth-covers-route')
  let status: SceneDemand['status'] = 'ready'
  if (blocked) status = 'blocked'
  else if (reasons.length) status = 'unknown'
  let freeStatus: SceneDemand['freePassage']['status'] = 'ready'
  if (blocked) freeStatus = 'blocked'
  else if (freeReasons.length) freeStatus = 'unknown'
  const frozenTargets = Object.freeze({
    left: Object.freeze(targets.left),
    right: Object.freeze(targets.right),
    unassigned: Object.freeze(targets.unassigned)
  })
  return Object.freeze({
    identity: Object.freeze({}),
    revision: ++demandRevision,
    farm,
    scene,
    configuration,
    evidence: configuration.evidence,
    status,
    reasons: Object.freeze(reasons),
    route,
    channels,
    targets: frozenTargets,
    reach: Object.freeze({
      left: reach(frozenTargets.left),
      right: reach(frozenTargets.right)
    }),
    freePassage: Object.freeze({
      kind: 'axis-aligned-difference',
      route: route.volume,
      exclusions: Object.freeze(exclusions),
      status: freeStatus,
      reasons: Object.freeze(freeReasons)
    }),
    work: Object.freeze(mutableWork)
  })
}

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import * as fruitSource from '../crop-fruit'
import * as hairSource from '../crop-hairs'
import {
  createCropModels,
  DEFAULT_CROP_SOURCE_ASSUMPTIONS
} from '../crop-models'
import {
  digest,
  exactSourceStructure,
  renderHandoff
} from './source-geometry-oracle'

const required = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error('Missing source product')
  return value
}

const models = createCropModels({ netTop: 3, netBottom: 0.45 })

const FROZEN_SOURCE_MANIFEST_SHA256 =
  'aa320ea1b7c894fe51b80ed90c8884b1635d77e997e7a75844f1d8b2503e1658'
const FROZEN_SOURCE_COMMIT = '8138d03ab31ca65e20ae927d36928cb4d4a46a10'
const FROZEN_SOURCE_TREE = '88c6e5a755ff2aebd29a06ded6259bfc94b76dac'
const FROZEN_SOURCE_FILES = [
  'crop-models.ts',
  'crop-fruit.ts',
  'crop-hairs.ts',
  'crop-layout.ts',
  'mesh.ts',
  'leaf-surface.ts',
  'source-occupancy.ts',
  'planting-supports.ts',
  'farm-configuration.ts',
  'greenhouse.ts'
] as const
const frozenSourceDirectory = new URL(
  './fixtures/pre-p5b-source/',
  import.meta.url
)
const sha256 = (value: Uint8Array | string) =>
  createHash('sha256').update(value).digest('hex')

interface FrozenSourceManifest {
  readonly format: 'fieldscope-frozen-source/1'
  readonly source: {
    readonly commit: string
    readonly tree: string
    readonly prefix: string
  }
  readonly files: readonly {
    readonly path: string
    readonly sourcePath: string
    readonly gitBlob: string
    readonly sha256: string
  }[]
  readonly historicalDarwinDiagnostics: {
    readonly runtime: { readonly platform: string; readonly node: string }
    readonly sourceCommit: string
    readonly sourceTree: string
    readonly originalSnapshotPath: string
    readonly originalSnapshotSha256: string
    readonly snapshotExports: readonly string[]
  }
}

const readFrozenSourceFiles = () =>
  new Map<string, Buffer>([
    [
      'manifest.json',
      readFileSync(new URL('manifest.json', frozenSourceDirectory))
    ],
    ...FROZEN_SOURCE_FILES.map(
      (path) =>
        [path, readFileSync(new URL(path, frozenSourceDirectory))] as const
    )
  ])

function admitFrozenSourceFiles(
  bytesByPath: ReadonlyMap<string, Uint8Array>
): FrozenSourceManifest {
  const manifestBytes = required(bytesByPath.get('manifest.json'))
  if (sha256(manifestBytes) !== FROZEN_SOURCE_MANIFEST_SHA256)
    throw new Error('Frozen source manifest digest mismatch')
  const manifest = JSON.parse(
    Buffer.from(manifestBytes).toString('utf8')
  ) as FrozenSourceManifest
  if (
    manifest.format !== 'fieldscope-frozen-source/1' ||
    manifest.source.commit !== FROZEN_SOURCE_COMMIT ||
    manifest.source.tree !== FROZEN_SOURCE_TREE ||
    manifest.source.prefix !== 'apps/fieldscope/src/domain/' ||
    manifest.files.length !== FROZEN_SOURCE_FILES.length ||
    manifest.historicalDarwinDiagnostics.sourceCommit !==
      FROZEN_SOURCE_COMMIT ||
    manifest.historicalDarwinDiagnostics.sourceTree !== FROZEN_SOURCE_TREE ||
    manifest.historicalDarwinDiagnostics.runtime.platform !== 'darwin' ||
    manifest.historicalDarwinDiagnostics.runtime.node !== 'v24.13.0' ||
    manifest.historicalDarwinDiagnostics.snapshotExports.length !== 2
  )
    throw new Error('Frozen source manifest identity mismatch')
  for (const [index, path] of FROZEN_SOURCE_FILES.entries()) {
    const file = manifest.files[index]
    if (
      file?.path !== path ||
      file.sourcePath !== `apps/fieldscope/src/domain/${path}` ||
      !/^[0-9a-f]{40}$/.test(file.gitBlob) ||
      sha256(required(bytesByPath.get(path))) !== file.sha256
    )
      throw new Error(`Frozen source file digest mismatch: ${path}`)
  }
  if (
    !manifest.historicalDarwinDiagnostics.snapshotExports[0].includes(
      'unchanged non-pedicel stem triangles and their hairs'
    ) ||
    !manifest.historicalDarwinDiagnostics.snapshotExports[1].includes(
      'preserves every source buffer outside cucumber stems 1'
    )
  )
    throw new Error('Frozen source diagnostic history mismatch')
  return manifest
}

type CropModels = ReturnType<typeof createCropModels>
type CropPart = CropModels[number]['parts'][number]
type HairRanges = Map<number[], hairSource.SurfaceHairRange[]>
interface HairModule {
  appendSurfaceHairs: typeof hairSource.appendSurfaceHairs
}
interface PatchIdentityDifference {
  readonly triangle: number
  readonly baselineId: string
  readonly currentId: string
  readonly role: string
  readonly targetFruitId: string
  readonly owner: string
  readonly baselineSourceTriangle: number
  readonly currentSourceTriangle: number
}

function captureCropModels(
  factory: (config: { netTop: number; netBottom: number }) => CropModels,
  hairModule: HairModule
): { models: CropModels; hairs: HairRanges } {
  const hairEvents = new Map<number[], hairSource.SurfaceHairRange[]>()
  const append = hairModule.appendSurfaceHairs
  const spy = vi
    .spyOn(hairModule, 'appendSurfaceHairs')
    .mockImplementation((builder, density, length, sides, color, observer) =>
      append(builder, density, length, sides, color, (range) => {
        observer?.(range)
        const events = hairEvents.get(builder.positions) ?? []
        events.push(range)
        hairEvents.set(builder.positions, events)
      })
    )
  let generated: CropModels
  try {
    generated = factory({ netTop: 3, netBottom: 0.45 })
  } finally {
    spy.mockRestore()
  }
  return { models: generated, hairs: hairEvents }
}

const includesIndex = (
  range: { readonly indexStart: number; readonly indexCount: number },
  index: number
) => index >= range.indexStart && index < range.indexStart + range.indexCount

function firstDifference(
  left: unknown,
  right: unknown,
  path = 'source'
): string | null {
  if (Object.is(left, right)) return null
  if (
    left === null ||
    right === null ||
    typeof left !== 'object' ||
    typeof right !== 'object'
  )
    return path
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return path
    if (left.length !== right.length) return `${path}.length`
    for (let index = 0; index < left.length; index++) {
      const difference = firstDifference(
        left[index],
        right[index],
        `${path}[${index}]`
      )
      if (difference) return difference
    }
    return null
  }
  const leftRecord = left as Record<string, unknown>
  const rightRecord = right as Record<string, unknown>
  const leftKeys = Object.keys(leftRecord)
  const rightKeys = Object.keys(rightRecord)
  if (
    leftKeys.length !== rightKeys.length ||
    leftKeys.some((key, index) => key !== rightKeys[index])
  )
    return `${path}.keys`
  for (const key of leftKeys) {
    const difference = firstDifference(
      leftRecord[key],
      rightRecord[key],
      `${path}.${key}`
    )
    if (difference) return difference
  }
  return null
}

const expectExactValue = (left: unknown, right: unknown, path: string) => {
  const difference = firstDifference(left, right, path)
  if (difference) throw new Error(`Frozen source mismatch at ${difference}`)
}

function retainedStemTriangles(
  part: CropPart,
  detail: 0 | 1,
  hairs: HairRanges
) {
  const shape = detail ? required(part.distantShape) : part.shape
  const regions = detail ? required(part.distantRegions) : part.regions
  const patches = detail ? required(part.distantPatches) : part.patches
  const partitions = detail ? required(part.distantPartitions) : part.partitions
  const pedicelPatches = patches.filter(
    (patch) =>
      patch.role === 'plant-pedicel' || patch.role === 'retained-pedicel'
  )
  const pedicelRanges = pedicelPatches.flatMap((patch) => patch.source.ranges)
  const pedicelHairs = (hairs.get(shape.positions) ?? []).filter((range) =>
    pedicelRanges.some((pedicel) =>
      includesIndex(pedicel, range.sourceTriangle)
    )
  )
  const excluded = [...pedicelRanges, ...pedicelHairs]
  const patchesByTriangle = new Map<number, typeof patches>()
  for (const patch of patches) {
    if (patch.role === 'plant-pedicel' || patch.role === 'retained-pedicel')
      continue
    for (const range of patch.source.ranges)
      for (
        let index = range.indexStart;
        index < range.indexStart + range.indexCount;
        index += 3
      ) {
        const owners = patchesByTriangle.get(index) ?? []
        patchesByTriangle.set(index, [...owners, patch])
      }
  }
  let regionIndex = 0
  let partitionIndex = 0
  const triangles: {
    index: number
    region: (typeof regions)[number]
    partition: (typeof partitions)[number]
    patches: (typeof patches)[number][]
  }[] = []
  for (let index = 0; index < shape.indices.length; index += 3) {
    if (excluded.some((range) => includesIndex(range, index))) continue
    while (!includesIndex(required(regions[regionIndex]), index)) regionIndex++
    while (!includesIndex(required(partitions[partitionIndex]), index))
      partitionIndex++
    triangles.push({
      index,
      region: required(regions[regionIndex]),
      partition: required(partitions[partitionIndex]),
      patches: [...(patchesByTriangle.get(index) ?? [])]
    })
  }
  return { shape, triangles }
}

function validateRevisionPatchIdentities(
  part: CropPart,
  detail: 0 | 1,
  path: string
) {
  const shape = detail ? required(part.distantShape) : part.shape
  const regions = detail ? required(part.distantRegions) : part.regions
  const patches = detail ? required(part.distantPatches) : part.patches
  const ids = patches.map((patch) => patch.id)
  expectExactValue(new Set(ids).size, ids.length, `${path}.partLocalPatchIds`)
  for (let patchIndex = 0; patchIndex < patches.length; patchIndex++) {
    const patch = required(patches[patchIndex])
    const region = patch.source.region
    if (
      patch.source.id !== patch.id ||
      !regions.includes(region) ||
      patch.source.ranges.length === 0 ||
      patch.source.ranges.some(
        (range) =>
          !Number.isInteger(range.indexStart) ||
          !Number.isInteger(range.indexCount) ||
          range.indexStart % 3 !== 0 ||
          range.indexCount <= 0 ||
          range.indexCount % 3 !== 0 ||
          range.indexStart < region.indexStart ||
          range.indexStart + range.indexCount >
            region.indexStart + region.indexCount ||
          range.indexStart + range.indexCount > shape.indices.length
      )
    )
      throw new Error(
        `Invalid revision-local patch reference at ${path}.patches[${patchIndex}]`
      )
  }
}

function compareStemShape(
  baselinePart: CropPart,
  currentPart: CropPart,
  detail: 0 | 1,
  baselineHairs: HairRanges,
  currentHairs: HairRanges,
  path: string,
  identityDifferences: PatchIdentityDifference[]
) {
  validateRevisionPatchIdentities(baselinePart, detail, `${path}.baseline`)
  validateRevisionPatchIdentities(currentPart, detail, `${path}.current`)
  const baseline = retainedStemTriangles(baselinePart, detail, baselineHairs)
  const current = retainedStemTriangles(currentPart, detail, currentHairs)
  expectExactValue(
    baseline.triangles.length,
    current.triangles.length,
    `${path}.triangleCount`
  )
  const baselineVertices = new Map<number, number>()
  const currentVertices = new Map<number, number>()
  for (
    let triangleIndex = 0;
    triangleIndex < baseline.triangles.length;
    triangleIndex++
  ) {
    const before = required(baseline.triangles[triangleIndex])
    const after = required(current.triangles[triangleIndex])
    expectExactValue(
      { id: before.region.id, kind: before.region.kind },
      { id: after.region.id, kind: after.region.kind },
      `${path}.triangles[${triangleIndex}].region`
    )
    expectExactValue(
      before.partition.fruitId,
      after.partition.fruitId,
      `${path}.triangles[${triangleIndex}].partition`
    )
    expectExactValue(
      before.patches.length,
      after.patches.length,
      `${path}.triangles[${triangleIndex}].patches.length`
    )
    for (let patchIndex = 0; patchIndex < before.patches.length; patchIndex++) {
      const beforePatch = required(before.patches[patchIndex])
      const afterPatch = required(after.patches[patchIndex])
      if (
        beforePatch.source.id !== beforePatch.id ||
        afterPatch.source.id !== afterPatch.id ||
        beforePatch.source.region !== before.region ||
        afterPatch.source.region !== after.region ||
        !beforePatch.source.ranges.some((range) =>
          includesIndex(range, before.index)
        ) ||
        !afterPatch.source.ranges.some((range) =>
          includesIndex(range, after.index)
        )
      )
        throw new Error(
          `Invalid revision-local patch reference at ${path}.triangles[${triangleIndex}].patches[${patchIndex}]`
        )
      expectExactValue(
        {
          targetFruitId: beforePatch.targetFruitId,
          owner: beforePatch.owner,
          role: beforePatch.role,
          region: {
            id: beforePatch.source.region.id,
            kind: beforePatch.source.region.kind
          }
        },
        {
          targetFruitId: afterPatch.targetFruitId,
          owner: afterPatch.owner,
          role: afterPatch.role,
          region: {
            id: afterPatch.source.region.id,
            kind: afterPatch.source.region.kind
          }
        },
        `${path}.triangles[${triangleIndex}].patches[${patchIndex}]`
      )
      if (beforePatch.id !== afterPatch.id)
        identityDifferences.push({
          triangle: triangleIndex,
          baselineId: beforePatch.id,
          currentId: afterPatch.id,
          role: beforePatch.role,
          targetFruitId: beforePatch.targetFruitId,
          owner: beforePatch.owner,
          baselineSourceTriangle: before.index,
          currentSourceTriangle: after.index
        })
    }
    for (let corner = 0; corner < 3; corner++) {
      const beforeVertex = baseline.shape.indices[before.index + corner]
      const afterVertex = current.shape.indices[after.index + corner]
      let beforeDense = baselineVertices.get(beforeVertex)
      if (beforeDense === undefined) {
        beforeDense = baselineVertices.size
        baselineVertices.set(beforeVertex, beforeDense)
      }
      let afterDense = currentVertices.get(afterVertex)
      if (afterDense === undefined) {
        afterDense = currentVertices.size
        currentVertices.set(afterVertex, afterDense)
      }
      expectExactValue(
        beforeDense,
        afterDense,
        `${path}.triangles[${triangleIndex}].corners[${corner}].sourceVertex`
      )
      for (let axis = 0; axis < 3; axis++) {
        expectExactValue(
          baseline.shape.positions[beforeVertex * 3 + axis],
          current.shape.positions[afterVertex * 3 + axis],
          `${path}.triangles[${triangleIndex}].corners[${corner}].position[${axis}]`
        )
        expectExactValue(
          baseline.shape.colors?.[beforeVertex * 3 + axis],
          current.shape.colors?.[afterVertex * 3 + axis],
          `${path}.triangles[${triangleIndex}].corners[${corner}].color[${axis}]`
        )
      }
      for (let axis = 0; axis < 2; axis++)
        expectExactValue(
          baseline.shape.uvs?.[beforeVertex * 2 + axis],
          current.shape.uvs?.[afterVertex * 2 + axis],
          `${path}.triangles[${triangleIndex}].corners[${corner}].uv[${axis}]`
        )
    }
  }
}

function expectExactCropSource(
  baseline: { models: CropModels; hairs: HairRanges },
  current: { models: CropModels; hairs: HairRanges }
) {
  const identityDifferences: PatchIdentityDifference[] = []
  expectExactValue(
    baseline.models.length,
    current.models.length,
    'source.models.length'
  )
  for (let modelIndex = 0; modelIndex < baseline.models.length; modelIndex++) {
    const before = required(baseline.models[modelIndex])
    const after = required(current.models[modelIndex])
    const cucumber = before.species === 'cucumber-1914'
    const {
      parts: beforeParts,
      fruits: beforeFruits,
      stemHairCount: beforeStemHairs,
      ...beforeMetadata
    } = before
    const {
      parts: afterParts,
      fruits: afterFruits,
      stemHairCount: afterStemHairs,
      ...afterMetadata
    } = after
    expectExactValue(
      cucumber
        ? beforeMetadata
        : { ...beforeMetadata, stemHairCount: beforeStemHairs },
      cucumber
        ? afterMetadata
        : { ...afterMetadata, stemHairCount: afterStemHairs },
      `source.models[${modelIndex}].metadata`
    )
    expectExactValue(
      beforeFruits.map((fruit) => {
        const { cutSite, ...metadata } = fruit
        return cucumber ? metadata : { ...metadata, cutSite }
      }),
      afterFruits.map((fruit) => {
        const { cutSite, ...metadata } = fruit
        return cucumber ? metadata : { ...metadata, cutSite }
      }),
      `source.models[${modelIndex}].fruits`
    )
    expectExactValue(
      beforeParts.length,
      afterParts.length,
      `source.models[${modelIndex}].parts.length`
    )
    for (let partIndex = 0; partIndex < beforeParts.length; partIndex++) {
      const beforePart = required(beforeParts[partIndex])
      const afterPart = required(afterParts[partIndex])
      const path = `source.models[${modelIndex}].parts[${partIndex}]`
      expectExactValue(beforePart.id, afterPart.id, `${path}.id`)
      if (cucumber && beforePart.id === 'stems') {
        const {
          shape: beforeShape,
          distantShape: beforeDistantShape,
          regions: beforeRegions,
          distantRegions: beforeDistantRegions,
          patches: beforePatches,
          distantPatches: beforeDistantPatches,
          partitions: beforePartitions,
          distantPartitions: beforeDistantPartitions,
          ...beforeMaterial
        } = beforePart
        const {
          shape: afterShape,
          distantShape: afterDistantShape,
          regions: afterRegions,
          distantRegions: afterDistantRegions,
          patches: afterPatches,
          distantPatches: afterDistantPatches,
          partitions: afterPartitions,
          distantPartitions: afterDistantPartitions,
          ...afterMaterial
        } = afterPart
        void beforeShape
        void beforeDistantShape
        void beforeRegions
        void beforeDistantRegions
        void beforePatches
        void beforeDistantPatches
        void beforePartitions
        void beforeDistantPartitions
        void afterShape
        void afterDistantShape
        void afterRegions
        void afterDistantRegions
        void afterPatches
        void afterDistantPatches
        void afterPartitions
        void afterDistantPartitions
        expectExactValue(beforeMaterial, afterMaterial, `${path}.material`)
        compareStemShape(
          beforePart,
          afterPart,
          0,
          baseline.hairs,
          current.hairs,
          `${path}.near`,
          identityDifferences
        )
        compareStemShape(
          beforePart,
          afterPart,
          1,
          baseline.hairs,
          current.hairs,
          `${path}.distant`,
          identityDifferences
        )
      } else expectExactValue(beforePart, afterPart, path)
    }
  }
  return identityDifferences
}

const nextFloat64 = (value: number) => {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  view.setBigUint64(0, view.getBigUint64(0) + (value < 0 ? -1n : 1n))
  return view.getFloat64(0)
}

it('preserves every source product outside the cucumber pedicel revision against the frozen pre-P5b graph', async () => {
  const sourceBytes = readFrozenSourceFiles()
  const tamperedManifest = new Map(sourceBytes)
  const changedManifest = Buffer.from(
    required(tamperedManifest.get('manifest.json'))
  )
  changedManifest[32] ^= 1
  tamperedManifest.set('manifest.json', changedManifest)
  expect(() => admitFrozenSourceFiles(tamperedManifest)).toThrow(
    'Frozen source manifest digest mismatch'
  )
  const tamperedFile = new Map(sourceBytes)
  const changedFile = Buffer.from(required(tamperedFile.get('crop-models.ts')))
  changedFile[32] ^= 1
  tamperedFile.set('crop-models.ts', changedFile)
  expect(() => admitFrozenSourceFiles(tamperedFile)).toThrow(
    'Frozen source file digest mismatch: crop-models.ts'
  )
  admitFrozenSourceFiles(sourceBytes)

  const frozenHairModule =
    (await import('./fixtures/pre-p5b-source/crop-hairs')) as unknown as HairModule
  const frozenModelModule =
    await import('./fixtures/pre-p5b-source/crop-models')
  const baseline = captureCropModels(
    frozenModelModule.createCropModels as unknown as (config: {
      netTop: number
      netBottom: number
    }) => CropModels,
    frozenHairModule
  )
  const current = captureCropModels(createCropModels, hairSource)
  const expectCurrentSource = () => expectExactCropSource(baseline, current)
  const identityDifferences = expectCurrentSource()
  expect(identityDifferences).toContainEqual({
    triangle: 4086,
    baselineId: 'fruit-2/fruit-detail/5',
    currentId: 'fruit-2/fruit-detail/6',
    role: 'fruit-detail',
    targetFruitId: 'fruit-2',
    owner: 'target-fruit',
    baselineSourceTriangle: 12597,
    currentSourceTriangle: 12837
  })

  const foliage = required(
    current.models[0].parts.find((part) => part.id === 'foliage')
  )
  const originalPosition = foliage.shape.positions[0]
  foliage.shape.positions[0] = nextFloat64(originalPosition)
  expect(expectCurrentSource).toThrow('Frozen source mismatch')
  foliage.shape.positions[0] = originalPosition

  const originalWinding = foliage.shape.indices.slice(0, 3)
  ;[foliage.shape.indices[0], foliage.shape.indices[1]] = [
    foliage.shape.indices[1],
    foliage.shape.indices[0]
  ]
  expect(expectCurrentSource).toThrow('Frozen source mismatch')
  foliage.shape.indices.splice(0, 3, ...originalWinding)

  const originalRoughness = foliage.roughness
  foliage.roughness = nextFloat64(originalRoughness)
  expect(expectCurrentSource).toThrow('Frozen source mismatch')
  foliage.roughness = originalRoughness

  const originalIndexCount = foliage.shape.indices.length
  foliage.shape.indices.push(...foliage.shape.indices.slice(0, 3))
  expect(expectCurrentSource).toThrow('Frozen source mismatch')
  foliage.shape.indices.length = originalIndexCount

  const stems = required(
    current.models[0].parts.find((part) => part.id === 'stems')
  )
  const pedicelRanges = stems.patches
    .filter(
      (patch) =>
        patch.role === 'plant-pedicel' || patch.role === 'retained-pedicel'
    )
    .flatMap((patch) => patch.source.ranges)
  const retainedHair = required(
    current.hairs
      .get(stems.shape.positions)
      ?.find(
        (range) =>
          !pedicelRanges.some((pedicel) =>
            includesIndex(pedicel, range.sourceTriangle)
          )
      )
  )
  const hairPositionIndex = retainedHair.vertexStart * 3
  const originalHairPosition = stems.shape.positions[hairPositionIndex]
  stems.shape.positions[hairPositionIndex] = nextFloat64(originalHairPosition)
  expect(expectCurrentSource).toThrow('Frozen source mismatch')
  stems.shape.positions[hairPositionIndex] = originalHairPosition

  const sourcePatch = required(
    stems.patches.find((patch) => patch.role === 'fruit-detail')
  )
  const mutablePatch = sourcePatch as unknown as {
    targetFruitId: string
    owner: string
    role: string
    source: { region: (typeof stems.regions)[number] }
  }
  const originalTarget = mutablePatch.targetFruitId
  mutablePatch.targetFruitId = 'wrong-target'
  expect(expectCurrentSource).toThrow('Frozen source mismatch')
  mutablePatch.targetFruitId = originalTarget
  const originalOwner = mutablePatch.owner
  mutablePatch.owner = 'plant'
  expect(expectCurrentSource).toThrow('Frozen source mismatch')
  mutablePatch.owner = originalOwner
  const originalRole = mutablePatch.role
  mutablePatch.role = 'fine-spines'
  expect(expectCurrentSource).toThrow('Frozen source mismatch')
  mutablePatch.role = originalRole
  const originalRegion = mutablePatch.source.region
  mutablePatch.source.region = { ...originalRegion }
  expect(expectCurrentSource).toThrow('Invalid revision-local patch reference')
  mutablePatch.source.region = originalRegion

  const excludedPatch = required(
    stems.patches.find((patch) => patch.role === 'plant-pedicel')
  ) as unknown as {
    id: string
    source: { id: string }
  }
  const originalExcludedId = excludedPatch.id
  const originalExcludedSourceId = excludedPatch.source.id
  excludedPatch.id = sourcePatch.id
  excludedPatch.source.id = sourcePatch.id
  expect(expectCurrentSource).toThrow('partLocalPatchIds')
  excludedPatch.id = originalExcludedId
  excludedPatch.source.id = originalExcludedSourceId

  expectCurrentSource()
}, 30000)

it('provides an actual shared cucumber source ring between plant and retained pedicel', () => {
  for (const model of models.filter(
    (model) => model.species === 'cucumber-1914'
  )) {
    const stems = required(model.parts.find((part) => part.id === 'stems'))
    for (const fruit of model.fruits) {
      const cut = fruit.cutSite
      expect(cut?.kind).toBe('synthetic-source-boundary')
      if (cut?.kind !== 'synthetic-source-boundary')
        throw new Error('Missing cucumber source cut ring')
      const plant = required(
        stems.patches.find((patch) => patch.id === cut.boundary.plantPatchId)
      )
      const retained = required(
        stems.patches.find((patch) => patch.id === cut.boundary.retainedPatchId)
      )
      expect(plant.owner).toBe('plant')
      expect(retained.owner).toBe('target-fruit')
      expect(plant.source.region).toBe(retained.source.region)
      expect(plant.source.region.kind).toBe('open-shell')
      expect(plant.source.region.indexCount).toBe(96)
      expect(plant.source.ranges[0].indexCount).toBe(48)
      expect(retained.source.ranges[0].indexStart).toBe(
        plant.source.ranges[0].indexStart + 48
      )
      expect(retained.source.ranges[0].indexCount).toBe(48)
      const indices = (patch: typeof plant) =>
        new Set(
          patch.source.ranges.flatMap((range) =>
            stems.shape.indices.slice(
              range.indexStart,
              range.indexStart + range.indexCount
            )
          )
        )
      const before = indices(plant)
      expect(
        [...indices(retained)]
          .filter((index) => before.has(index))
          .sort((a, b) => a - b)
      ).toEqual(cut.boundary.sourceVertexIndices)
      expect(cut.boundary.sourceVertexIndices).toHaveLength(8)
      expect(Math.hypot(...cut.towardPlant)).toBeGreaterThan(0)
      const ringStart = cut.boundary.sourceVertexIndices[0]
      const centroid = (start: number) =>
        [0, 1, 2].map(
          (axis) =>
            Array.from(
              { length: 8 },
              (_, index) => stems.shape.positions[(start + index) * 3 + axis]
            ).reduce((sum, value) => sum + value, 0) / 8
        )
      const tip = centroid(ringStart - 8),
        top = centroid(ringStart + 8)
      for (let axis = 0; axis < 3; axis++) {
        expect(cut.position[axis]).toBeCloseTo((tip[axis] + top[axis]) / 2, 12)
        expect(cut.towardPlant[axis]).toBeCloseTo(
          tip[axis] - cut.position[axis],
          12
        )
        expect(top[axis]).toBeCloseTo(
          fruit.center[axis] + (axis === 1 ? fruit.length / 2 : 0),
          12
        )
      }
      for (const start of [ringStart - 8, ringStart, ringStart + 8]) {
        const center = centroid(start)
        for (let index = 0; index < 8; index++)
          expect(
            Math.hypot(
              ...center.map(
                (value, axis) =>
                  stems.shape.positions[(start + index) * 3 + axis] - value
              )
            )
          ).toBeCloseTo(0.0009, 12)
      }
      expect(cut.sourceAssumptions).toEqual(DEFAULT_CROP_SOURCE_ASSUMPTIONS)
      expect(Object.isFrozen(cut.sourceAssumptions)).toBe(true)
    }
  }
})

it('captures each source assumption once before validating', () => {
  let reads = 0
  const source = {
    ...DEFAULT_CROP_SOURCE_ASSUMPTIONS,
    cucumberCutSite: {
      ...DEFAULT_CROP_SOURCE_ASSUMPTIONS.cucumberCutSite,
      get fraction() {
        return ++reads === 1 ? 0.5 : NaN
      }
    }
  }
  const generated = createCropModels({ netTop: 3, netBottom: 0.45 }, source)
  expect(reads).toBe(1)
  const cut = generated[0].fruits[0].cutSite
  if (cut?.kind !== 'synthetic-source-boundary')
    throw new Error('Missing captured source')
  expect(cut.sourceAssumptions?.cucumberCutSite.fraction).toBe(0.5)
  const surface = vi.spyOn(fruitSource, 'appendFruitSurface')
  try {
    expect(() =>
      createCropModels(
        { netTop: 3, netBottom: 0.45 },
        {
          ...source,
          cucumberCutSite: { ...source.cucumberCutSite, fraction: NaN }
        }
      )
    ).toThrow()
    expect(surface).not.toHaveBeenCalled()
  } finally {
    surface.mockRestore()
  }
})

it('owns synthetic cut assumptions once per source generation and rejects collapsed segments', () => {
  const assumptions = {
    ...DEFAULT_CROP_SOURCE_ASSUMPTIONS,
    cucumberCutSite: {
      ...DEFAULT_CROP_SOURCE_ASSUMPTIONS.cucumberCutSite,
      fraction: 0.25,
      evidence: { ...DEFAULT_CROP_SOURCE_ASSUMPTIONS.cucumberCutSite.evidence }
    }
  }
  const generated = createCropModels(
    { netTop: 3, netBottom: 0.45 },
    assumptions
  )
  const cuts = generated
    .filter((model) => model.species === 'cucumber-1914')
    .flatMap((model) => model.fruits.map((fruit) => fruit.cutSite))
  const first = cuts[0]
  if (first?.kind !== 'synthetic-source-boundary')
    throw new Error('Missing assumption source')
  const admitted = required(first.sourceAssumptions)
  expect(admitted).not.toBe(assumptions)
  expect(Object.isFrozen(admitted.cucumberCutSite)).toBe(true)
  expect(Object.isFrozen(admitted.cucumberCutSite.evidence)).toBe(true)
  for (const cut of cuts) {
    if (cut?.kind !== 'synthetic-source-boundary')
      throw new Error('Missing custom cut source')
    expect(cut.sourceAssumptions).toBe(admitted)
  }
  assumptions.cucumberCutSite.fraction = 0.75
  assumptions.cucumberCutSite.evidence.label = 'Changed caller label'
  expect(admitted.cucumberCutSite.fraction).toBe(0.25)
  expect(admitted.cucumberCutSite.evidence.label).toBe(
    DEFAULT_CROP_SOURCE_ASSUMPTIONS.cucumberCutSite.evidence.label
  )
  const defaultCut = models[0].fruits[0].cutSite
  if (defaultCut?.kind !== 'synthetic-source-boundary')
    throw new Error('Missing default cut')
  expect(defaultCut.sourceAssumptions).not.toBe(admitted)
  expect(defaultCut.position).not.toEqual(first.position)
  expect(
    digest(generated.filter((model) => model.species === 'tomato-yu-nu'))
  ).toBe(digest(models.filter((model) => model.species === 'tomato-yu-nu')))
  for (const fraction of [0, 1, -1, NaN, Infinity, Number.MIN_VALUE])
    expect(() =>
      createCropModels(
        { netTop: 3, netBottom: 0.45 },
        {
          ...assumptions,
          cucumberCutSite: { ...assumptions.cucumberCutSite, fraction }
        }
      )
    ).toThrow()
})

it('preserves exact botanical structure and materials plus the render handoff', () => {
  expect(
    models.map((model) => ({
      species: model.species,
      variant: model.variant,
      structure: digest(
        model.parts.map((part) => ({
          id: part.id,
          color: part.color,
          roughness: part.roughness,
          ...(part.surface ? { surface: part.surface } : {}),
          partitions: part.partitions,
          distantPartitions: part.distantPartitions,
          regions: part.regions,
          distantRegions: part.distantRegions,
          shape: exactSourceStructure(part.shape),
          distantShape: part.distantShape
            ? exactSourceStructure(part.distantShape)
            : null
        }))
      ),
      renderHandoff: digest(
        model.parts.map((part) => ({
          id: part.id,
          shape: renderHandoff(part.shape),
          distantShape: part.distantShape
            ? renderHandoff(part.distantShape)
            : null
        }))
      )
    }))
  ).toMatchSnapshot()
})

it('partitions every near and distant source buffer exactly once with stable fruit ownership', () => {
  for (const model of models) {
    expect(new Set(model.fruits.map((fruit) => fruit.id)).size).toBe(
      model.fruits.length
    )
    const nearFruit = new Set<string>()
    const distantFruit = new Set<string>()
    for (const part of model.parts) {
      for (const [shape, spans, owners] of [
        [part.shape, part.partitions, nearFruit],
        [required(part.distantShape), part.distantPartitions, distantFruit]
      ] as const) {
        expect(spans).toBeDefined()
        if (!spans) throw new Error('Missing source partitions')
        let indices = 0
        const restored: number[] = []
        for (const span of spans) {
          expect(span.indexStart).toBe(indices)
          for (let i = indices; i < indices + span.indexCount; i++) {
            const sourceIndex = shape.indices[i]
            if (sourceIndex < 0 || sourceIndex >= shape.positions.length / 3)
              throw new Error('Invalid source vertex reference')
            restored.push(sourceIndex)
          }
          if (span.fruitId !== null) owners.add(span.fruitId)
          indices += span.indexCount
        }
        expect(indices).toBe(shape.indices.length)
        expect(digest(restored)).toBe(digest(shape.indices))
      }
    }
    expect([...nearFruit].sort()).toEqual(
      model.fruits.map((fruit) => fruit.id).sort()
    )
    expect([...distantFruit].sort()).toEqual([...nearFruit].sort())
  }
})

it('owns cucumber spines and tomato calyx and distal pedicel with the target', () => {
  for (const model of models) {
    for (const fruit of model.fruits) {
      const owned = model.parts.flatMap((part) =>
        part.partitions
          .filter((span) => span.fruitId === fruit.id)
          .map((span) => ({ ...span, part: part.id }))
      )
      expect(
        owned.some((span) => ['green', 'turning', 'ripe'].includes(span.part))
      ).toBe(true)
      expect(owned.some((span) => span.part === 'stems')).toBe(true)
      if (model.species === 'tomato-yu-nu') {
        if (fruit.cutSite?.kind !== 'synthetic-source-boundary')
          throw new Error('Missing synthetic source cut boundary')
        expect(fruit.cutSite.kind).toBe('synthetic-source-boundary')
        expect(fruit.cutSite.position[1]).toBeCloseTo(
          fruit.center[1] + fruit.length / 2 + 0.009 * Math.min(1, 3 / 3)
        )
        const stems = required(model.parts.find((part) => part.id === 'stems'))
        const distal = required(
          stems.partitions.find((span) => span.fruitId === fruit.id)
        )
        expect(
          stems.partitions.some(
            (span) =>
              span.fruitId === null && span.indexStart < distal.indexStart
          )
        ).toBe(true)
        // Adjacent tube ownership shares original ring vertices, never rebuilds a tube.
        const proximal = required(
          stems.partitions.find(
            (span) => span.indexStart + span.indexCount === distal.indexStart
          )
        )
        const before = new Set(
          stems.shape.indices.slice(
            proximal.indexStart,
            proximal.indexStart + proximal.indexCount
          )
        )
        expect(
          stems.shape.indices
            .slice(distal.indexStart, distal.indexStart + distal.indexCount)
            .some((index) => before.has(index))
        ).toBe(true)
      }
    }
  }
})

it('identifies exact botanical roles without changing source triangle ownership', () => {
  for (const model of models) {
    for (const part of model.parts) {
      expect(part.patches).toBeDefined()
      const occupied = new Set<number>()
      for (const patch of part.patches) {
        expect(
          model.fruits.some((fruit) => fruit.id === patch.targetFruitId)
        ).toBe(true)
        expect(part.regions).toContain(patch.source.region)
        expect(patch.source.id).toBe(patch.id)
        for (const range of patch.source.ranges) {
          expect(range.indexStart % 3).toBe(0)
          expect(range.indexCount % 3).toBe(0)
          expect(range.indexStart).toBeGreaterThanOrEqual(
            patch.source.region.indexStart
          )
          expect(range.indexStart + range.indexCount).toBeLessThanOrEqual(
            patch.source.region.indexStart + patch.source.region.indexCount
          )
          for (
            let index = range.indexStart;
            index < range.indexStart + range.indexCount;
            index += 3
          ) {
            if (occupied.has(index))
              throw new Error('Overlapping semantic source triangles')
            occupied.add(index)
            const partition = required(
              part.partitions.find(
                (span) =>
                  index >= span.indexStart &&
                  index < span.indexStart + span.indexCount
              )
            )
            if (
              partition.fruitId !==
              (patch.owner === 'plant' ? null : patch.targetFruitId)
            )
              throw new Error('Semantic source ownership mismatch')
          }
        }
      }
    }
    for (const fruit of model.fruits) {
      const patches = model.parts.flatMap((part) =>
        part.patches.filter((patch) => patch.targetFruitId === fruit.id)
      )
      expect(
        patches.filter((patch) => patch.role === 'fruit-skin')
      ).toHaveLength(1)
      expect(
        patches.filter((patch) => patch.role === 'plant-pedicel')
      ).toHaveLength(1)
      if (model.species === 'cucumber-1914') {
        expect(
          patches.filter((patch) => patch.role === 'fine-spines')
        ).toHaveLength(84)
        expect(fruit.cutSite?.kind).toBe('synthetic-source-boundary')
      } else {
        expect(patches.filter((patch) => patch.role === 'calyx')).toHaveLength(
          1
        )
        expect(
          patches.filter((patch) => patch.role === 'retained-pedicel')
        ).toHaveLength(1)
        const cut = fruit.cutSite
        if (cut?.kind !== 'synthetic-source-boundary')
          throw new Error('Missing source boundary')
        expect(cut.evidence.kind).toBe('synthetic')
        expect(Math.hypot(...cut.towardPlant)).toBeGreaterThan(0)
        const stems = required(
          model.parts.find((part) => part.id === cut.boundary.partId)
        )
        const plant = required(
          patches.find((patch) => patch.id === cut.boundary.plantPatchId)
        )
        const retained = required(
          patches.find((patch) => patch.id === cut.boundary.retainedPatchId)
        )
        expect(plant.role).toBe('plant-pedicel')
        expect(retained.role).toBe('retained-pedicel')
        expect(plant.source.ranges).toHaveLength(1)
        expect(plant.source.ranges[0].indexCount).toBe(48)
        expect(retained.source.ranges[0].indexCount).toBe(48)
        const vertices = (patch: typeof plant) =>
          new Set(
            patch.source.ranges.flatMap((range) =>
              stems.shape.indices.slice(
                range.indexStart,
                range.indexStart + range.indexCount
              )
            )
          )
        const proximal = vertices(plant)
        const shared = [...vertices(retained)]
          .filter((index) => proximal.has(index))
          .sort((a, b) => a - b)
        expect(cut.boundary.sourceVertexIndices).toEqual(shared)
        expect(shared).toHaveLength(8)
        for (let axis = 0; axis < 3; axis++) {
          const midpoint =
            shared.reduce(
              (sum, index) => sum + stems.shape.positions[index * 3 + axis],
              0
            ) / shared.length
          expect(midpoint).toBeCloseTo(cut.position[axis], 12)
        }
      }
    }
  }
})

it('assigns every generated fruit surface, calyx and late hair to its source owner', () => {
  const events = new Map<
    number[],
    { start: number; count: number; source?: number; kind: string }[]
  >()
  const add = (
    positions: number[],
    event: { start: number; count: number; source?: number; kind: string }
  ) => {
    const values = events.get(positions) ?? []
    values.push(event)
    events.set(positions, values)
  }
  const surface = fruitSource.appendFruitSurface
  const calyx = fruitSource.appendFruitCalyx
  const hairs = hairSource.appendSurfaceHairs
  const surfaceSpy = vi
    .spyOn(fruitSource, 'appendFruitSurface')
    .mockImplementation((...args) => {
      const start = args[0].indices.length
      const result = surface(...args)
      add(args[0].positions, {
        start,
        count: args[0].indices.length - start,
        kind: 'surface'
      })
      return result
    })
  const calyxSpy = vi
    .spyOn(fruitSource, 'appendFruitCalyx')
    .mockImplementation((...args) => {
      const start = args[0].indices.length
      calyx(...args)
      add(args[0].positions, {
        start,
        count: args[0].indices.length - start,
        kind: 'calyx'
      })
    })
  const hairSpy = vi
    .spyOn(hairSource, 'appendSurfaceHairs')
    .mockImplementation((builder, density, length, sides, color, observer) =>
      hairs(builder, density, length, sides, color, (range) => {
        observer?.(range)
        add(builder.positions, {
          start: range.indexStart,
          count: range.indexCount,
          source: range.sourceTriangle,
          kind: 'hair'
        })
      })
    )
  try {
    const generated = createCropModels({ netTop: 3, netBottom: 0.45 })
    expect(digest(generated)).toBe(digest(models))
    expect(
      generated.some((model) =>
        model.fruits.some((fruit) => fruit.spineCount === 84)
      )
    ).toBe(true)
    let retainedHair = 0,
      retainedCalyx = 0,
      retainedSurface = 0
    for (const model of generated)
      for (const part of model.parts)
        for (const [shape, partitions] of [
          [part.shape, part.partitions],
          [required(part.distantShape), required(part.distantPartitions)]
        ] as const) {
          const ownerAt = (index: number) =>
            partitions.find(
              (span) =>
                index >= span.indexStart &&
                index < span.indexStart + span.indexCount
            )?.fruitId
          for (const event of events.get(shape.positions) ?? []) {
            const owner = ownerAt(event.start)
            if (event.source !== undefined) {
              expect(owner).toBe(ownerAt(event.source))
              if (owner) retainedHair++
            } else {
              expect(owner).toBeTypeOf('string')
              if (event.kind === 'calyx') retainedCalyx++
              else retainedSurface++
            }
            // Every source triangle in the generated detail follows that owner.
            for (
              let index = event.start;
              index < event.start + event.count;
              index += 3
            )
              if (ownerAt(index) !== owner)
                throw new Error('Partial fruit detail ownership')
          }
        }
    expect(retainedHair).toBeGreaterThan(0)
    expect(retainedCalyx).toBeGreaterThan(0)
    expect(retainedSurface).toBe(
      generated.reduce((sum, model) => sum + model.fruits.length * 2, 0)
    )
  } finally {
    surfaceSpy.mockRestore()
    calyxSpy.mockRestore()
    hairSpy.mockRestore()
  }
})

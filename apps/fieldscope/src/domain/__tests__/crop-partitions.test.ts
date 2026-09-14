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

it('preserves every source buffer outside cucumber stems', () => {
  const hairEvents = new Map<number[], hairSource.SurfaceHairRange[]>()
  const append = hairSource.appendSurfaceHairs
  const spy = vi
    .spyOn(hairSource, 'appendSurfaceHairs')
    .mockImplementation((builder, density, length, sides, color, observer) =>
      append(builder, density, length, sides, color, (range) => {
        observer?.(range)
        const events = hairEvents.get(builder.positions) ?? []
        events.push(range)
        hairEvents.set(builder.positions, events)
      })
    )
  let generated: ReturnType<typeof createCropModels>
  try {
    generated = createCropModels({ netTop: 3, netBottom: 0.45 })
  } finally {
    spy.mockRestore()
  }
  expect(
    generated
      .filter((model) => model.species === 'cucumber-1914')
      .map((model) => {
        const part = required(model.parts.find((part) => part.id === 'stems'))
        return [part.shape, required(part.distantShape)].map(
          (shape, detail) => {
            const patches = detail
              ? required(part.distantPatches)
              : part.patches
            const pedicel = patches
              .filter(
                (patch) =>
                  patch.role === 'plant-pedicel' ||
                  patch.role === 'retained-pedicel'
              )
              .flatMap((patch) => patch.source.ranges)
            const contains = (index: number) =>
              pedicel.some(
                (range) =>
                  index >= range.indexStart &&
                  index < range.indexStart + range.indexCount
              )
            const excluded = [
              ...pedicel,
              ...(hairEvents.get(shape.positions) ?? []).filter((range) =>
                contains(range.sourceTriangle)
              )
            ]
            const triangles = []
            for (let index = 0; index < shape.indices.length; index += 3) {
              if (
                excluded.some(
                  (range) =>
                    index >= range.indexStart &&
                    index < range.indexStart + range.indexCount
                )
              )
                continue
              triangles.push(
                shape.indices.slice(index, index + 3).map((vertex) => ({
                  position: shape.positions.slice(vertex * 3, vertex * 3 + 3),
                  color: shape.colors?.slice(vertex * 3, vertex * 3 + 3),
                  uv: shape.uvs?.slice(vertex * 2, vertex * 2 + 2)
                }))
              )
            }
            return digest(triangles)
          }
        )
      })
  ).toMatchSnapshot('unchanged non-pedicel stem triangles and their hairs')
  expect(
    models.map((model) => ({
      species: model.species,
      variant: model.variant,
      parts: model.parts
        .filter(
          (part) => model.species !== 'cucumber-1914' || part.id !== 'stems'
        )
        .map((part) => ({
          id: part.id,
          source: digest({
            shape: part.shape,
            distantShape: part.distantShape,
            regions: part.regions,
            distantRegions: part.distantRegions,
            partitions: part.partitions,
            distantPartitions: part.distantPartitions,
            color: part.color,
            roughness: part.roughness,
            surface: part.surface
          })
        }))
    }))
  ).toMatchSnapshot()
})

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

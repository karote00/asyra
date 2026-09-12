import { createHash } from 'node:crypto'
import { expect, it, vi } from 'vitest'
import * as fruitSource from '../crop-fruit'
import * as hairSource from '../crop-hairs'
import { createCropModels } from '../crop-models'

const required = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error('Missing source product')
  return value
}

const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')
const models = createCropModels({ netTop: 3, netBottom: 0.45 })

it('preserves canonical botanical geometry and materials before source partitioning', () => {
  expect(
    models.map((model) => ({
      species: model.species,
      variant: model.variant,
      parts: model.parts.map((part) =>
        digest({
          color: part.color,
          roughness: part.roughness,
          ...(part.surface ? { surface: part.surface } : {}),
          shape: part.shape,
          distantShape: part.distantShape
        })
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
        if (!fruit.cutSite) throw new Error('Missing synthetic cut site')
        expect(fruit.cutSite.kind).toBe('synthetic')
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

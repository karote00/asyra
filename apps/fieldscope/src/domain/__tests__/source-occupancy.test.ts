import { expect, it } from 'vitest'
import { TriangleBuilder } from '../mesh'
import { createRobotModel, createDockModel } from '../robot-model'
import { DEFAULT_ROBOT } from '../robot-configuration'
import { createCropModels } from '../crop-models'
import {
  readSourceRegions,
  readSourcePatches,
  type SourcePatch,
  type SourceRegion
} from '../source-occupancy'

it('admits exact source patch subsets with detached regions and frozen ranges', () => {
  const region = {
    id: 'solid',
    kind: 'closed-solid' as const,
    indexStart: 0,
    indexCount: 12
  }
  const regions = [region]
  const range = { indexStart: 3, indexCount: 3 }
  const patch = {
    id: 'face',
    region,
    ranges: [range, { indexStart: 9, indexCount: 3 }]
  }
  const input = [patch, { id: 'shared-face', region, ranges: [range] }]
  const admitted = readSourcePatches(input, regions, 12)
  expect(admitted).not.toBe(input)
  expect(admitted[0]).not.toBe(patch)
  expect(admitted[0].region).not.toBe(region)
  expect(admitted[1].region).toBe(admitted[0].region)
  expect(admitted[0].ranges).not.toBe(patch.ranges)
  expect(admitted[0].ranges[0]).not.toBe(range)
  expect(admitted[0].ranges).toEqual([
    { indexStart: 3, indexCount: 3 },
    { indexStart: 9, indexCount: 3 }
  ])
  expect(Object.isFrozen(admitted)).toBe(true)
  for (const value of admitted) {
    expect(Object.isFrozen(value)).toBe(true)
    expect(Object.isFrozen(value.region)).toBe(true)
    expect(Object.isFrozen(value.ranges)).toBe(true)
    expect(value.ranges.every(Object.isFrozen)).toBe(true)
  }
  region.id = 'mutated'
  range.indexStart = 0
  patch.id = 'mutated'
  patch.ranges.pop()
  regions.length = 0
  input.length = 0
  expect(admitted[0].id).toBe('face')
  expect(admitted[0].region.id).toBe('solid')
  expect(admitted[0].ranges).toEqual([
    { indexStart: 3, indexCount: 3 },
    { indexStart: 9, indexCount: 3 }
  ])
  const canonicalRegions = Object.freeze([admitted[0].region])
  expect(readSourcePatches(admitted, canonicalRegions, 12)).toBe(admitted)
  expect(readSourcePatches([], [], 0)).toEqual([])
})

it('rejects invalid source patch declarations before exposing any subset', () => {
  const regions = readSourceRegions(
    [
      { id: 'first', kind: 'sheet', indexStart: 0, indexCount: 6 },
      { id: 'second', kind: 'sheet', indexStart: 6, indexCount: 6 }
    ],
    12
  )
  const patch: SourcePatch = {
    id: 'face',
    region: regions[1],
    ranges: [{ indexStart: 6, indexCount: 3 }]
  }
  expect(readSourcePatches([patch], regions, 12)[0].region).toBe(regions[1])
  for (const count of [
    -3,
    1,
    9,
    15,
    Infinity,
    NaN,
    Number.MAX_SAFE_INTEGER + 1
  ])
    expect(() => readSourcePatches([patch], regions, count)).toThrow()
  for (const invalidRegions of [
    [],
    [regions[1]],
    [regions[0], regions[0]],
    [{ ...regions[0], indexCount: 9 }, regions[1]]
  ])
    expect(() => readSourcePatches([], invalidRegions, 12)).toThrow()
  const invalidPatches = [
    new Array<SourcePatch>(1),
    [{ ...patch, id: '' }],
    [{ ...patch, id: ' ' }],
    [patch, patch],
    [{ ...patch, region: { ...regions[1] } }],
    [{ ...patch, ranges: [] }],
    ...[
      [{ indexStart: 7, indexCount: 3 }],
      [{ indexStart: 6, indexCount: 1 }],
      [{ indexStart: 6, indexCount: 0 }],
      [{ indexStart: 6, indexCount: -3 }],
      [{ indexStart: -3, indexCount: 3 }],
      [{ indexStart: 3, indexCount: 3 }],
      [{ indexStart: 9, indexCount: 6 }],
      [{ indexStart: 6, indexCount: Number.MAX_SAFE_INTEGER + 1 }],
      [{ indexStart: Number.MAX_SAFE_INTEGER - 1, indexCount: 3 }],
      [{ indexStart: Infinity, indexCount: 3 }],
      [{ indexStart: NaN, indexCount: 3 }],
      [
        { indexStart: 9, indexCount: 3 },
        { indexStart: 6, indexCount: 3 }
      ],
      [
        { indexStart: 6, indexCount: 6 },
        { indexStart: 9, indexCount: 3 }
      ]
    ].map((ranges) => [{ ...patch, ranges }])
  ]
  for (const invalid of invalidPatches)
    expect(() => readSourcePatches(invalid, regions, 12)).toThrow()
  expect(() =>
    readSourcePatches(
      [
        {
          ...patch,
          region: regions[0],
          ranges: [{ indexStart: 3, indexCount: 6 }]
        }
      ],
      regions,
      12
    )
  ).toThrow()
  // Frozen caller objects still require admission; freezing is not validation.
  expect(() =>
    readSourcePatches(
      Object.freeze([Object.freeze({ ...patch, ranges: Object.freeze([]) })]),
      regions,
      12
    )
  ).toThrow()
})

it('admits immutable complete regions and rejects gaps, overlap and forged declarations', () => {
  const raw: SourceRegion[] = [
    { id: 'surface', kind: 'sheet', indexStart: 0, indexCount: 3 }
  ]
  const admitted = readSourceRegions(raw, 3)
  raw.push({ ...raw[0], id: 'later', indexStart: 3 })
  expect(admitted).toHaveLength(1)
  expect(readSourceRegions(admitted, 3) === admitted).toBe(true)
  for (const invalid of [
    [],
    [{ ...raw[0], indexStart: 3 }],
    [raw[0], raw[0]],
    [{ ...raw[0], indexCount: 1 }],
    [{ ...raw[0], id: '' }],
    [{ ...raw[0], kind: 'unknown' }]
  ])
    expect(() => readSourceRegions(invalid as SourceRegion[], 3)).toThrow()
})

it('proves exact closed box edge pairing without treating cylinder seams as welded', () => {
  const parts = [...createRobotModel(DEFAULT_ROBOT), ...createDockModel()]
  for (const { shape, regions } of parts) {
    for (const region of regions.filter(
      (region) => region.kind === 'closed-solid'
    )) {
      const edges = new Map<string, { count: number; winding: number }>()
      const vertex = (index: number) =>
        shape.positions.slice(index * 3, index * 3 + 3).join(',')
      for (
        let i = region.indexStart;
        i < region.indexStart + region.indexCount;
        i += 3
      ) {
        const triangle = shape.indices.slice(i, i + 3).map(vertex)
        expect(new Set(triangle).size).toBe(3)
        for (let edge = 0; edge < 3; edge++) {
          const a = triangle[edge],
            b = triangle[(edge + 1) % 3]
          const key = [a, b].sort().join('|')
          const entry = edges.get(key) ?? { count: 0, winding: 0 }
          entry.count++
          entry.winding += a < b ? 1 : -1
          edges.set(key, entry)
        }
      }
      expect(
        [...edges.values()].every(
          ({ count, winding }) => count === 2 && winding === 0
        )
      ).toBe(true)
    }
  }
  const tire = parts.find((part) => part.id === 'tire--1--1')
  if (!tire) throw new Error('Missing source tire')
  // Each original sector writes a side quad followed by two cap triangles
  // (ten vertices). Compare the 0 and 2π side endpoints without welding.
  const firstSeam = tire.shape.positions.slice(0, 3)
  const finalSeam = tire.shape.positions.slice(31 * 30 + 3, 31 * 30 + 6)
  expect(firstSeam.some((value, axis) => value !== finalSeam[axis])).toBe(true)
  expect(tire.regions).toEqual([
    {
      id: 'region-0',
      kind: 'open-shell',
      indexStart: 0,
      indexCount: tire.shape.indices.length
    }
  ])
})

it('preserves distinct closed boxes, sheet faces and uncapped tube source ranges', () => {
  const builder = new TriangleBuilder()
  builder.box([0, 0, 0], [2, 2, 2])
  builder.quad([3, 0, 0], [4, 0, 0], [4, 1, 0], [3, 1, 0])
  builder.tube({
    points: [
      [5, 0, 0],
      [5, 1, 0]
    ],
    diameter: 0.1
  })
  expect(builder.regions()).toEqual([
    { id: 'region-0', kind: 'closed-solid', indexStart: 0, indexCount: 36 },
    { id: 'region-1', kind: 'sheet', indexStart: 36, indexCount: 6 },
    { id: 'region-2', kind: 'open-shell', indexStart: 42, indexCount: 48 }
  ])
  // Unclaimed direct buffer writes cannot silently inherit another region.
  builder.indices.push(0, 1, 2)
  expect(() => builder.regions()).toThrow()
})

it('covers every original robot, dock and cultivar triangle without declaring botanical solids', () => {
  const products = [...createRobotModel(DEFAULT_ROBOT), ...createDockModel()]
  for (const part of products) {
    expect(part.regions).toBeDefined()
    expect(
      part.regions.reduce((sum, region) => sum + region.indexCount, 0)
    ).toBe(part.shape.indices.length)
  }
  for (const model of createCropModels({ netTop: 3, netBottom: 0.45 })) {
    for (const part of model.parts) {
      for (const [shape, regions] of [
        [part.shape, part.regions],
        [part.distantShape, part.distantRegions]
      ] as const) {
        expect(shape).toBeDefined()
        expect(regions).toBeDefined()
        if (!shape || !regions) throw new Error('Missing source regions')
        let end = 0
        for (const region of regions) {
          expect(region.indexStart).toBe(end)
          expect(region.kind).not.toBe('closed-solid')
          end += region.indexCount
        }
        expect(end).toBe(shape.indices.length)
      }
    }
  }
})

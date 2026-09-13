import { expect, it } from 'vitest'
import { TriangleBuilder } from '../mesh'
import { createRobotModel, createDockModel } from '../robot-model'
import { DEFAULT_ROBOT } from '../robot-configuration'
import { createCropModels } from '../crop-models'
import { readSourceRegions, type SourceRegion } from '../source-occupancy'

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

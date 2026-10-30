import { expect, it } from 'vitest'
import { tube } from '../geometry'
import { bench, teaChair } from '../furnishings'
import { requiredSpecValue } from '../specification'

it('transports tube sections across a bend without reversing their radial direction', () => {
  const mesh = tube(
    [
      [0, 0, 0],
      [0, 0, 0.4],
      [0, 0.4, 0.4]
    ],
    0.02,
    12
  )
  const first = mesh.positions.slice(0, 3)
  const second = mesh.positions.slice(13 * 3, 13 * 3 + 3)
  expect(first[0] * second[0]).toBeGreaterThan(0)
})
it('uses the approved seven-part tea chair with a broad rear crown', () => {
  const pieces = teaChair()
  expect(pieces).toHaveLength(7)
  const shell = requiredSpecValue(
    pieces.find((p) => p.id === 'shell'),
    'tea shell'
  ).mesh.positions
  const heights = []
  for (let i = 0; i < shell.length; i += 3) {
    const angle = Math.atan2(shell[i] / 0.22, shell[i + 1] / 0.23)
    if (Math.abs(angle - Math.PI / 3) < 0.015) {
      heights.push(shell[i + 2])
    }
  }
  expect(Math.max(...heights)).toBeGreaterThan(0.55)
})
it('uses the approved park bench slat counts, seat datum and inclined back', () => {
  const pieces = bench()
  const seats = pieces.filter((p) => p.id.startsWith('seat-slat-'))
  const backs = pieces.filter((p) => p.id.startsWith('back-slat-'))
  expect(seats).toHaveLength(4)
  expect(backs).toHaveLength(3)
  expect(
    Math.max(
      ...seats.flatMap((p) => p.mesh.positions.filter((_, i) => i % 3 === 2))
    )
  ).toBeCloseTo(0.34, 6)
  const averageY = (i: number) => {
    const p = backs[i].mesh.positions.filter((_, k) => k % 3 === 1)
    return p.reduce((a, b) => a + b, 0) / p.length
  }
  expect(averageY(2) - averageY(0)).toBeCloseTo(0.2 * Math.tan(Math.PI / 12), 6)
})
it('retains all four apron rails under the tea tabletop', async () => {
  const { teaTable } = await import('../furnishings')
  expect(teaTable().filter((p) => p.id.startsWith('apron-'))).toHaveLength(4)
})
it('builds the approved widened armchair with separate side panels and substantial splayed feet', async () => {
  const { catalogAsset } = await import('../catalog')
  const parts = catalogAsset('lounge-armchair')
  const coordinates = parts.flatMap((p) => p.mesh.positions)
  const xs = coordinates.filter((_, i) => i % 3 === 0)
  expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(0.713, 3)
  expect(parts.map((p) => p.id)).toContain('left-arm')
  expect(parts.map((p) => p.id)).toContain('right-arm')
  const foot = requiredSpecValue(
    parts.find((p) => p.id === 'foot-1'),
    'front foot'
  ).mesh.positions
  const x = foot.filter((_, i) => i % 3 === 0)
  expect(Math.max(...x) - Math.min(...x)).toBeGreaterThan(0.07)
})
it('uses female face regions and omits default male spectacles', async () => {
  const { puppet } = await import('../puppets')
  const parts = puppet('woman')
  expect(parts.some((p) => p.id.startsWith('rim-'))).toBe(false)
  expect(
    requiredSpecValue(
      parts.find((p) => p.id === 'cheek-left'),
      'cheek'
    ).color
  ).toBe(0xeca88e)
})

it('keeps armchair rear feet inset from the backrest as in the approved side view', async () => {
  const { catalogAsset } = await import('../catalog')
  const parts = catalogAsset('lounge-armchair')
  const rear = parts.filter((p) => p.id === 'foot-3' || p.id === 'foot-4')
  const bodyRear = Math.max(
    ...parts
      .filter((p) => !p.id.startsWith('foot-'))
      .flatMap((p) => p.mesh.positions.filter((_, i) => i % 3 === 1))
  )
  const footRear = Math.max(
    ...rear.flatMap((p) => p.mesh.positions.filter((_, i) => i % 3 === 1))
  )
  // SIDE: about 55 px rear overhang over a 419 px body depth, scaled to 610 mm.
  expect(bodyRear - footRear).toBeGreaterThan(0.07)
  expect(bodyRear - footRear).toBeLessThan(0.09)
})

it('keeps the tea chair inside its declared 20000 triangle master budget', () => {
  expect(
    teaChair().reduce((sum, p) => sum + p.mesh.indices.length / 3, 0)
  ).toBeLessThanOrEqual(20000)
})

it('ends work-chair back supports at the seat underside after shared back positioning', async () => {
  const { catalogAsset } = await import('../catalog')
  const posts = catalogAsset('work-chair').filter((p) =>
    p.id.startsWith('back-post-')
  )
  for (const p of posts) {
    expect(
      Math.min(...p.mesh.positions.filter((_, i) => i % 3 === 2))
    ).toBeCloseTo(0.29, 3)
  }
})

it('revolves the approved canister as separate closed body and lid with reusable appearance', async () => {
  const { pantryCanister } = await import('../pantry-smallware')
  const parts = pantryCanister(0xaabbcc)
  expect(parts.map((p) => p.id)).toEqual(['body', 'lid'])
  expect(parts[0].color).toBe(0xaabbcc)
  const all = parts.flatMap((p) => p.mesh.positions)
  for (const [axis, expected] of [
    [0, 0.09],
    [1, 0.09],
    [2, 0.125]
  ]) {
    const values = all.filter((_, i) => i % 3 === axis)
    expect(Math.max(...values) - Math.min(...values)).toBeCloseTo(expected, 6)
  }
  for (const p of parts) {
    expect(p.mesh.positions.every(Number.isFinite)).toBe(true)
    expect(p.distant?.mesh.indices.length).toBeLessThan(p.mesh.indices.length)
  }
})

it('builds the source pantry front as a left door, two stacked drawers and a narrow end panel', async () => {
  const { catalogAsset } = await import('../catalog')
  const parts = catalogAsset('sink-cabinet')
  expect(parts.map((p) => p.id)).toEqual(
    expect.arrayContaining([
      'door--1',
      'drawer-front-upper',
      'drawer-front-lower',
      'end-panel'
    ])
  )
  expect(parts.some((p) => p.id === 'door-1')).toBe(false)
  const centers = parts
    .filter((p) => p.id.startsWith('drawer-front'))
    .map((p) => {
      const z = p.mesh.positions.filter((_, i) => i % 3 === 2)
      return (Math.min(...z) + Math.max(...z)) / 2
    })
    .sort((a, b) => a - b)
  expect(centers[1] - centers[0]).toBeCloseTo(0.259, 6)
})

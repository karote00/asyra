import { beforeAll, expect, it } from 'vitest'
import baseline from './fixtures/building-before-expansion.json'
import structure from '../reference/office-structure.json'
import { createReferenceScene } from '../reference-scene'
import { meshBounds } from '../room-furnishing-helpers'
import type { AssetPart } from '../../assets/catalog'

const parts = new Map<string, AssetPart[]>()
beforeAll(() => {
  const scene = createReferenceScene()
  let offset = 0
  for (const a of scene.assemblies) {
    parts.set(a.id, scene.parts.slice(offset, offset + a.parts.length))
    offset += a.parts.length
  }
})
const bounds = (id: string) => {
  const value = parts.get(id)
  if (!value) throw new Error('Missing assembly: ' + id)
  return meshBounds(value)
}

it('adds exactly half a metre of clear depth to all four room zones', () => {
  const depths = (s: typeof structure) => {
    const p = s.parameters
    const front = s.shell.frontY + s.shell.facadeThickness / 2
    const rear = p.rearY - s.shell.exteriorThickness / 2
    return [
      p.creamY - 0.08 - front,
      rear - p.creamY - 0.08,
      p.loungeY - 0.07 - front,
      rear - p.loungeY - 0.07
    ]
  }
  const previous = depths(baseline.structure as typeof structure)
  depths(structure).forEach((value, i) =>
    expect(value - previous[i]).toBeCloseTo(0.5, 10)
  )
  expect(
    structure.parameters.rearY - baseline.structure.parameters.rearY
  ).toBeCloseTo(1, 10)
  expect(structure.shell).toEqual(baseline.structure.shell)
  expect(structure.floors).toEqual(baseline.structure.floors)
})

it('retains frontage and stepped heights while extending every connected wall run', () => {
  for (const old of baseline.structure.walls) {
    const current = structure.walls.find((w) => w.id === old.id)
    if (!current) throw new Error('Missing wall: ' + old.id)
    for (const key of [
      'top',
      'endTop',
      'base',
      'thickness',
      'alongY',
      'ends'
    ] as const)
      expect(current[key], old.id + ' ' + key).toEqual(old[key])
    if (
      [
        'front-thin-wall',
        'front-facade',
        'entry-pier',
        'entry-header'
      ].includes(old.id)
    )
      expect(current).toEqual(old)
  }
  const wall = (id: string) => {
    const value = structure.walls.find((w) => w.id === id)
    if (!value) throw new Error('Missing wall: ' + id)
    return value
  }
  expect(wall('left-wall').end).toBe(wall('discussion-left-wall').start)
  expect(wall('discussion-left-wall').end).toBe(structure.parameters.rearY)
  expect(wall('pantry-divider').end).toBe(structure.parameters.rearY)
  expect(wall('lounge-left-low').end).toBe(wall('lounge-left-return').start)
  expect(wall('lounge-left-return').end).toBeCloseTo(
    wall('lounge-divider').cross,
    10
  )
  expect(bounds('office-slab')[1]).toEqual([
    -2.51,
    expect.closeTo(3.782099517721014, 8)
  ])
  expect(bounds('pantry-floor-band')[1]).toEqual([
    expect.closeTo(0.6313434728681635, 8),
    expect.closeTo(3.622099517721014, 8)
  ])
})

it('recesses the full dispenser within the extended wall without entering the fridge opening', () => {
  const dispenser = bounds('water-dispenser'),
    fridge = bounds('fridge')
  expect(dispenser[1][0]).toBeGreaterThan(bounds('pantry-divider')[1][0])
  expect(dispenser[1][0]).toBeCloseTo(1.816, 6)
  expect(fridge[1][0]).toBeCloseTo(2.820149517721014, 6)
  const clearance =
    Math.hypot(fridge[0][1] - dispenser[0][1], fridge[1][0] - dispenser[1][1]) -
    0.752
  expect(clearance).toBeGreaterThan(0.05)
  expect(bounds('sink')[1][1]).toBeCloseTo(structure.parameters.rearY - 0.08, 8)
})

it('moves the rear street and shops two metres and preserves the front street', () => {
  expect(bounds('street-rear')[1]).toEqual([5.3, 7.3])
  expect(bounds('street-front')[1]).toEqual([-5.75, -3.25])
  expect(bounds('shop-2')[1]).toEqual([
    expect.closeTo(7.85, 6),
    expect.closeTo(10.15, 6)
  ])
  expect(bounds('street-rear')[1][0] - bounds('office-slab')[1][1]).toBeCloseTo(
    1.517900482278986,
    6
  )
})

import { requiredSpecValue } from '../../assets/specification'
import { beforeAll, expect, it } from 'vitest'
import { createReferenceScene } from '../reference-scene'
import type { AssetPart } from '../../assets/catalog'

let scene: ReturnType<typeof createReferenceScene>
const parts = new Map<string, AssetPart[]>()
beforeAll(() => {
  scene = createReferenceScene()
  let offset = 0
  for (const a of scene.assemblies) {
    parts.set(a.id, scene.parts.slice(offset, offset + a.parts.length))
    offset += a.parts.length
  }
})
function bounds(id: string, region?: string) {
  const items = parts.get(id)
  if (!items) throw new Error(`Missing room furnishing: ${id}`)
  const b = [
    [Infinity, -Infinity],
    [Infinity, -Infinity],
    [Infinity, -Infinity]
  ]
  for (const part of items.filter((p) => !region || p.id === region))
    part.mesh.positions.forEach((n, i) => {
      b[i % 3][0] = Math.min(b[i % 3][0], n)
      b[i % 3][1] = Math.max(b[i % 3][1], n)
    })
  return b
}
it('places the open laptop on the desk with a source-relative lid width', () => {
  const desk = bounds('desk'),
    laptop = bounds('work-laptop')
  expect(laptop[2][0]).toBeCloseTo(desk[2][1], 4)
  expect(
    (laptop[0][1] - laptop[0][0]) / (desk[0][1] - desk[0][0])
  ).toBeGreaterThan(0.4)
  expect(
    (laptop[0][1] - laptop[0][0]) / (desk[0][1] - desk[0][0])
  ).toBeLessThan(0.51)
  for (const axis of [0, 1]) {
    expect(laptop[axis][0]).toBeGreaterThan(desk[axis][0])
    expect(laptop[axis][1]).toBeLessThan(desk[axis][1])
  }
})
it('uses an oval work rug and three separate wall-mounted shelves', () => {
  const rug = bounds('work-rug')
  expect(rug[2][0]).toBeCloseTo(0.38, 6)
  expect(rug[0][1] - rug[0][0]).toBeGreaterThan((rug[1][1] - rug[1][0]) * 1.2)
  for (const id of [
    'work-shelf-lower',
    'work-shelf-middle',
    'work-shelf-upper'
  ])
    expect(parts.has(id), id).toBe(true)
  const m = requiredSpecValue(parts.get('work-rug'), 'rug')[0].mesh
  expect(m.positions.length).toBeGreaterThan(100)
})
it('keeps the rejected chair, sofa and indoor occupants absent', () => {
  for (const id of [
    'desk-chair',
    'meeting-chair-left',
    'meeting-chair-right',
    'lounge-armchair',
    'lounge-sofa',
    'actor-mina',
    'actor-leo',
    'actor-sage'
  ])
    expect(parts.has(id), id).toBe(false)
})
it('preserves each existing table, structural and exterior mesh', () => {
  const baseline = createReferenceScene('tables-and-chairs')
  let offset = 0
  for (const a of baseline.assemblies) {
    expect(parts.get(a.id), a.id).toEqual(
      baseline.parts.slice(offset, offset + a.parts.length)
    )
    offset += a.parts.length
  }
})
it('supports sink accessories on the solid counter strip, outside the basin', () => {
  const countertop = requiredSpecValue(parts.get('sink'), 'sink').find(
    (p) => p.id === 'countertop'
  )
  // The basin is offset toward the left of the cabinet, not centered on it.
  const cutoutRight = bounds('sink', 'basin-outer')[0][1]
  for (const id of ['pantry-sink-mug', 'pantry-sink-plant']) {
    const b = bounds(id, id.endsWith('plant') ? 'pot' : undefined)
    expect(b[2][0], id).toBeCloseTo(0.38 + 0.64 * 1.25, 5)
    expect(b[0][0], id).toBeGreaterThan(cutoutRight)
    expect(b[0][1], id).toBeLessThan(bounds('sink', 'countertop')[0][1])
  }
  expect(countertop).toBeDefined()
})
it('adds lounge floor, wall and tabletop details without changing the accepted table', () => {
  const table = bounds('lounge-coffee-table'),
    rug = bounds('lounge-rug')
  expect(rug[2][0]).toBeCloseTo(0.38, 5)
  for (const axis of [0, 1]) {
    expect(rug[axis][0]).toBeLessThan(table[axis][0])
    expect(rug[axis][1]).toBeGreaterThan(table[axis][1])
  }
  for (const id of ['lounge-table-mug', 'lounge-table-plant'])
    expect(bounds(id)[2][0], id).toBeCloseTo(table[2][1], 5)
  expect(parts.has('lounge-sconce')).toBe(true)
  expect(parts.has('lounge-console-top')).toBe(true)
})
it('keeps the lounge side print and lamp below their actual stepped wall tops', () => {
  expect(bounds('lounge-side-print')[2][1]).toBeLessThan(1.131485)
  expect(bounds('lounge-sconce')[2][1]).toBeLessThan(1.57716)
})
it('places the rotated fridge behind the dispenser with its door facing the aisle', () => {
  const fridge = bounds('fridge'),
    dispenser = bounds('water-dispenser')
  expect(fridge[0][0]).toBeGreaterThan(0.1776932207)
  expect(dispenser[0][0]).toBeGreaterThan(0.1776932207)
  expect(dispenser[1][1]).toBeLessThan(fridge[1][0])
  expect(bounds('fridge', 'upper-door')[1][0]).toBeLessThan(
    bounds('fridge', 'cabinet')[1][0]
  )
  for (const id of ['fridge', 'water-dispenser', 'sink'])
    expect(bounds(id)[2][0], id).toBeCloseTo(0.38, 5)
  expect(bounds('pantry-wallpaper-17')[0][1]).toBeLessThan(
    bounds('pantry-print')[0][0]
  )
})
it('grounds shelf objects and keeps source printed artwork bounded to real frames', () => {
  for (const level of ['middle', 'upper']) {
    const top = bounds('work-shelf-' + level)[2][1]
    for (const suffix of ['', '-right'])
      expect(
        bounds('work-shelf-plant-' + level + suffix, 'pot')[2][0]
      ).toBeCloseTo(top, 5)
  }
  for (const label of scene.labels.filter((l) => l.artwork)) {
    expect(label.width).toBeLessThan(0.6)
    expect(label.height).toBeLessThan(0.6)
    expect(requiredSpecValue(label.artwork, 'artwork').corners).toHaveLength(4)
  }
})
it('joins the two pantry counters without coplanar overlap or a doubled worktop', () => {
  const coffee = bounds('coffee-counter-top')
  const sink = bounds('sink', 'countertop')
  expect(coffee[0][1]).toBeLessThanOrEqual(sink[0][0])
  expect(sink[0][0] - coffee[0][1]).toBeLessThan(0.01)
  expect(coffee[2][1]).toBeCloseTo(sink[2][1], 5)
})

it('matches the source dispenser bottle-to-body proportion without changing its overall height', () => {
  const bottle = bounds('water-dispenser', 'bottle'),
    body = bounds('water-dispenser', 'cabinet'),
    whole = bounds('water-dispenser')
  const ratio = (bottle[2][1] - bottle[2][0]) / (body[2][1] - 0.38)
  expect(ratio).toBeGreaterThan(0.7)
  expect(ratio).toBeLessThan(0.85)
  expect(bottle[2][0]).toBeCloseTo(body[2][1], 5)
  expect(whole[2][0]).toBeCloseTo(0.38, 5)
  expect(whole[2][1] - whole[2][0]).toBeCloseTo(1.12 * 0.95, 5)
})
it('uses the source pantry objects instead of an unsupported coffee machine', () => {
  expect(parts.has('coffee-machine')).toBe(false)
  expect(parts.has('pantry-fridge-night-light')).toBe(true)
  expect(parts.has('pantry-preparation-plant')).toBe(true)
  expect(parts.has('pantry-preparation-sink')).toBe(false)
  expect(
    [...parts.keys()].filter((id) => /^pantry-canister-\d+$/.test(id))
  ).toHaveLength(4)
  expect(bounds('pantry-fridge-night-light')[2][0]).toBeCloseTo(
    bounds('fridge')[2][1],
    5
  )
})
it('uses a wood sink worktop and a dark left cabinet door from the source', () => {
  const sink = requiredSpecValue(parts.get('sink'), 'sink')
  expect(sink.find((p) => p.id === 'countertop')?.material).toBe('wood')
  expect(sink.find((p) => p.id === 'door--1')?.color).toBe(0x65594d)
})
it('uses a compact leafy crown above the refrigerator rather than a sparse upright plant', () => {
  const leaves = requiredSpecValue(
    parts.get('pantry-fridge-plant'),
    'fridge plant'
  ).filter((p) => p.id.startsWith('leaf-'))
  expect(leaves.length).toBeGreaterThanOrEqual(28)
  const b = bounds('pantry-fridge-plant')
  expect((b[0][1] - b[0][0]) / (b[2][1] - b[2][0])).toBeGreaterThan(0.65)
})
it('attaches fridge notes directly to the upper door and grounds the right floor jar', () => {
  const door = bounds('fridge', 'upper-door')
  for (let i = 0; i < 3; i++)
    expect(bounds('pantry-fridge-note-' + i)[1][1]).toBeCloseTo(door[1][0], 5)
  const jar = bounds('pantry-floor-jar'),
    band = bounds('pantry-floor-band')
  expect(jar[2][0]).toBeCloseTo(band[2][1], 5)
  for (const axis of [0, 1]) {
    expect(jar[axis][0]).toBeGreaterThan(band[axis][0])
    expect(jar[axis][1]).toBeLessThan(band[axis][1])
  }
})
it('supports the dark cup beside the sink opening rather than across the basin', () => {
  expect(bounds('pantry-dark-cup')[0][1]).toBeLessThan(
    bounds('sink', 'basin-outer')[0][0]
  )
})

it('distinguishes the blue succulent pot and rounded porcelain floor jar', () => {
  const jar = requiredSpecValue(parts.get('pantry-canister-5'), 'succulent pot')
  expect(jar.some((p) => p.id === 'lid')).toBe(false)
  expect(jar.some((p) => p.id === 'soil')).toBe(true)
  expect(
    jar.filter((p) => p.id.startsWith('succulent-leaf-')).length
  ).toBeGreaterThan(8)
  expect(jar.some((p) => p.id === 'flower-bud')).toBe(true)
  expect(jar.some((p) => p.id.startsWith('utensil-'))).toBe(false)
  const floorJar = requiredSpecValue(parts.get('pantry-floor-jar'), 'floor jar')
  expect(floorJar.some((p) => p.id === 'lid-knob')).toBe(true)
  const belly = bounds('pantry-floor-jar', 'body')
  const neck = bounds('pantry-floor-jar', 'neck-band')
  expect(neck[0][1] - neck[0][0]).toBeLessThan(
    (belly[0][1] - belly[0][0]) * 0.85
  )
})

it('supports every source vessel and retains the separate small counter bottle', () => {
  const top = bounds('coffee-counter-top')
  const bottle = bounds('pantry-counter-bottle')
  expect(bottle[2][0]).toBeCloseTo(top[2][1], 6)
  const mug = bounds('pantry-counter-pitcher')
  expect(bottle[1][1]).toBeLessThan(mug[1][0])
  for (const axis of [0, 1]) {
    expect(bottle[axis][0]).toBeGreaterThan(top[axis][0])
    expect(bottle[axis][1]).toBeLessThan(top[axis][1])
  }
  const shelf = bounds('pantry-shelf')
  for (const i of [0, 2, 3, 5]) {
    const jar = bounds('pantry-canister-' + i)
    expect(jar[2][0]).toBeCloseTo(shelf[2][1], 6)
    for (const axis of [0, 1]) {
      expect(jar[axis][0]).toBeGreaterThan(shelf[axis][0])
      expect(jar[axis][1]).toBeLessThan(shelf[axis][1])
    }
  }
})

it('spreads pantry foliage naturally while retaining its supported pot and smallware clearances', () => {
  const foliage = requiredSpecValue(
    parts.get('pantry-sink-plant'),
    'sink plant'
  ).filter((p) => p.id.startsWith('leaf-'))
  expect(foliage.length).toBeGreaterThanOrEqual(10)
  const cup = bounds('pantry-dark-cup'),
    basin = bounds('sink', 'basin-outer')
  expect(cup[0][1]).toBeLessThan(basin[0][0])
})

it('fits the shortened cabinet and shelf beside the recessed fridge', () => {
  const shelf = bounds('pantry-shelf'),
    top = bounds('coffee-counter-top'),
    fridge = bounds('fridge')
  expect(shelf[0][0]).toBeCloseTo(top[0][0], 6)
  expect(top[0][0] - fridge[0][1]).toBeCloseTo(0.04, 6)
  for (const id of [
    'coffee-counter-top',
    'coffee-counter-body',
    'coffee-counter-door'
  ])
    expect(bounds(id)[0][0]).toBeGreaterThan(fridge[0][1])
  expect(bounds('coffee-counter-body')[0][0] - top[0][0]).toBeCloseTo(0.02, 6)
  const sink = bounds('sink', 'countertop')
  expect(sink[0][0] - top[0][1]).toBeCloseTo(0.0075, 6)
  expect(top[2][1]).toBeCloseTo(sink[2][1], 6)
})

it('keeps the complete flower foliage near the shortened shelf left edge', () => {
  const shelf = bounds('pantry-shelf'),
    pot = bounds('pantry-shelf-plant')
  expect(pot[0][0] - shelf[0][0]).toBeGreaterThan(0)
  expect(pot[0][0] - shelf[0][0]).toBeLessThan(0.08)
})

it('aligns the preparation and sink worktop fronts and backs at the same depth', () => {
  const prep = bounds('coffee-counter-top'),
    sink = bounds('sink', 'countertop')
  expect(prep[1][0]).toBeCloseTo(sink[1][0], 6)
  expect(prep[1][1]).toBeCloseTo(sink[1][1], 6)
  expect(prep[1][1] - prep[1][0]).toBeCloseTo(0.625, 6)
})
it('retains the substantial reference sizes and left grouping of pantry smallware', () => {
  const cream = bounds('pantry-canister-2'),
    mug = bounds('pantry-counter-pitcher')
  expect(cream[0][1] - cream[0][0]).toBeCloseTo(0.18, 5)
  expect(cream[2][1] - cream[2][0]).toBeCloseTo(0.285, 5)
  expect(mug[2][1] - mug[2][0]).toBeGreaterThan(0.2)
  const pot = bounds('pantry-preparation-plant', 'pot')
  expect((pot[0][0] + pot[0][1]) / 2).toBeLessThan((mug[0][0] + mug[0][1]) / 2)
  expect(mug[0][1]).toBeLessThan(bounds('coffee-counter-top')[0][1])
})

it('uses the shelf source plant low ochre vessel and tapering foliage instead of the fridge shrub instance', () => {
  const pot = bounds('pantry-shelf-plant', 'pot')
  expect(pot[2][1] - pot[2][0]).toBeLessThan(0.13)
  expect(pot[0][1] - pot[0][0]).toBeGreaterThan(pot[2][1] - pot[2][0])
  expect(
    parts.get('pantry-shelf-plant')?.find((p) => p.id === 'pot')?.color
  ).toBe(0xc19d5a)
})

it('places a small leafy plant in the second shelf pot', () => {
  const plant = requiredSpecValue(
    parts.get('pantry-canister-0'),
    'second shelf pot'
  )
  const leaves = plant.filter((p) => p.id.startsWith('leaf-'))
  expect(leaves.length).toBeGreaterThan(3)
  expect(plant.some((p) => p.id === 'soil')).toBe(true)
  const pot = bounds('pantry-canister-0', 'body')
  expect(bounds('pantry-canister-0')[2][1]).toBeGreaterThan(pot[2][1] + 0.04)
  expect(bounds('pantry-canister-0')[2][1]).toBeLessThan(
    bounds('pantry-canister-2')[2][1]
  )
})

it('places the new framed light at the existing refrigerator anchor with emission at its base', () => {
  expect(parts.has('pantry-fridge-jar')).toBe(false)
  const lamp = requiredSpecValue(
    parts.get('pantry-fridge-night-light'),
    'night-light'
  )
  expect(lamp.map((p) => p.id)).toEqual(
    expect.arrayContaining([
      'base',
      'glass-cylinder',
      'light-core',
      'width-frame',
      'depth-frame'
    ])
  )
  expect(lamp.some((p) => ['top-loop', 'cap', 'diffuser'].includes(p.id))).toBe(
    false
  )
  expect(bounds('pantry-fridge-night-light')[2][0]).toBeCloseTo(
    bounds('fridge')[2][1],
    5
  )
  const glass = bounds('pantry-fridge-night-light', 'glass-cylinder')
  const core = bounds('pantry-fridge-night-light', 'light-core')
  expect(core[2][1]).toBeLessThan(glass[2][0] + 0.02)
  expect(lamp.find((p) => p.id === 'glass-cylinder')?.opacity).toBe(0.13)
  expect(lamp.find((p) => p.id === 'light-core')?.emissiveIntensity).toBe(1.75)
})

it('retains the two condiment jars and succulent after the two plants', () => {
  for (const [i, asset] of [
    [2, 'shelf-sage-jar'],
    [3, 'shelf-brown-jar'],
    [5, 'shelf-succulent']
  ] as const) {
    const a = requiredSpecValue(
      scene.assemblies.find((a) => a.id === 'pantry-canister-' + i),
      'shelf assembly'
    )
    expect(a.asset).toBe(asset)
    expect(bounds(a.id)[2][0]).toBeCloseTo(bounds('pantry-shelf')[2][1], 6)
  }
})

it('supports the staggered plant, pitcher and tumbler on the shortened countertop', () => {
  const plant = bounds('pantry-preparation-plant'),
    pitcher = bounds('pantry-counter-pitcher'),
    tumbler = bounds('pantry-counter-tumbler')
  expect(pitcher[0][0] - plant[0][1]).toBeCloseTo(0.1, 6)
  expect(tumbler[1][1]).toBeLessThan(pitcher[1][0])
  const top = bounds('coffee-counter-top')
  for (const id of [
    'pantry-preparation-plant',
    'pantry-counter-pitcher',
    'pantry-counter-tumbler'
  ]) {
    const b = bounds(id, id.endsWith('plant') ? 'pot' : undefined)
    expect(b[2][0]).toBeCloseTo(top[2][1], 6)
    for (const axis of [0, 1]) {
      expect(b[axis][0]).toBeGreaterThan(top[axis][0])
      expect(b[axis][1]).toBeLessThan(top[axis][1])
    }
  }
  expect(parts.has('pantry-counter-mug')).toBe(false)
  expect(parts.has('pantry-soap-pump')).toBe(false)
})

it('omits the stored preparation basin and unsupported tray from the current scene', () => {
  expect(parts.has('pantry-preparation-sink')).toBe(false)
  expect(parts.has('pantry-dish-tray')).toBe(false)
})

import { useReferenceSceneFixture } from './fixtures/reference-scene'
import { beforeAll, beforeEach, afterEach, expect, it } from 'vitest'
import { clearImmediate, setImmediate } from 'node:timers'
import { readSpatialDescriptor } from '@asyra/preset/spatial-contract'
import { createReferenceScene, buildSpatialMeshes } from '../reference-scene'
import { meshBounds } from '../room-furnishing-helpers'
import { placeParts, type AssetPart } from '../../assets/catalog'
import { emptyMesh } from '../../assets/geometry'
import {
  discussionStorage,
  discussionTree,
  DISCUSSION_CONIFER_SIZES
} from '../discussion-details'
import discussionPosterUrl from '../reference/discussion-poster.svg?url'
import discussionNoteUrl from '../reference/discussion-note.svg?url'
import discussionNoteSource from '../reference/discussion-note.svg?raw'
import { OFFICE_STRUCTURE } from '../office-layout'
import { americanoGlass, sugarJar } from '../../assets/discussion-tableware'

/** Materialize the same instance basis and placement used by the public renderer. */
function expanded(source: AssetPart[]): AssetPart[] {
  return source.map((part) => {
    if (!part.instances) return part
    const mesh = emptyMesh()
    for (const instance of part.instances) {
      const offset = mesh.positions.length / 3
      for (let i = 0; i < part.mesh.positions.length; i += 3) {
        for (let axis = 0; axis < 3; axis++) {
          let value = instance.position[axis]
          for (let local = 0; local < 3; local++)
            value +=
              part.mesh.positions[i + local] *
              instance.basis[local][axis] *
              instance.scale
          mesh.positions.push(value)
        }
      }
      for (const index of part.mesh.indices) mesh.indices.push(index + offset)
      for (const uv of part.mesh.uvs) mesh.uvs.push(uv)
    }
    const result = { ...part, mesh, instances: undefined, placement: undefined }
    return part.placement
      ? placeParts(
          [result],
          part.placement.position,
          part.placement.rotation,
          part.placement.scale
        )[0]
      : result
  })
}

const parts = new Map<string, AssetPart[]>()
let labels: ReturnType<typeof createReferenceScene>['labels']
// Register the assertion before the fixture cleanup so its host yield runs first.
let hostTurnObserved = false
let pendingHostTurn: ReturnType<typeof setImmediate>
beforeEach(() => {
  hostTurnObserved = false
  pendingHostTurn = setImmediate(() => {
    hostTurnObserved = true
  })
})
afterEach(() => {
  clearImmediate(pendingHostTurn)
  expect(
    hostTurnObserved,
    'The worker must service host messages between geometry cases'
  ).toBe(true)
})
const referenceSceneFixture = useReferenceSceneFixture()
beforeAll(() => {
  const scene = referenceSceneFixture()
  labels = scene.labels
  let offset = 0
  for (const a of scene.assemblies) {
    parts.set(a.id, scene.parts.slice(offset, offset + a.parts.length))
    offset += a.parts.length
  }
})
const expandedParts = new Map<string, AssetPart[]>()
function item(id: string) {
  const value = parts.get(id)
  if (!value) throw new Error(`Missing discussion furnishing ${id}`)
  let result = expandedParts.get(id)
  if (!result) {
    result = expanded(value)
    expandedParts.set(id, result)
  }
  return result
}
const bounds = (id: string) => meshBounds(item(id))
it('renders a dated calendar above the console instead of a text poster', () => {
  const note = labels.find((label) => label.text === 'October 2026 calendar')
  expect(note?.artwork?.resolution).toBe(512)
  expect(note?.artwork?.source).toBe(discussionNoteUrl)
  expect(note?.width).toBeCloseTo(0.344)
  expect(note?.height).toBeCloseTo(0.444)
  expect(discussionNoteSource).not.toMatch(/Small steps|Every day/)
  const dates = [
    ...discussionNoteSource.matchAll(
      /data-date="2026-10-(\d{2})" x="(\d+)" y="(\d+)"/g
    )
  ]
  expect(dates).toHaveLength(31)
  dates.forEach((match, index) => {
    expect(Number(match[1])).toBe(index + 1)
    // October 1, 2026 is Thursday in a Monday-first calendar.
    expect(Number(match[2])).toBe(64 + ((index + 3) % 7) * 64)
    expect(Number(match[3])).toBe(290 + Math.floor((index + 3) / 7) * 64)
  })
})
it('uses crisp authored lettering for the large discussion print instead of a photographic crop', () => {
  const poster = labels.find(
    (label) => label.text === 'Better\nAgents\nHappier\nPeople'
  )
  expect(poster?.artwork?.source).toBe(discussionPosterUrl)
  expect(poster?.artwork?.resolution).toBe(512)
  expect(poster?.artwork?.corners).toEqual([
    [0, 0],
    [767, 0],
    [767, 1007],
    [0, 1007]
  ])
})
it('fills the source left wall with a tall print beside separate climbing foliage', () => {
  const print = bounds('discussion-print')
  expect(print[2][1] - print[2][0]).toBeGreaterThan(1.4)
  expect(print[2][1]).toBeLessThan(2.94)
  const foliage = bounds('discussion-left-climber')
  expect(foliage[2][1]).toBeGreaterThan(2.48)
  expect(foliage[1][1]).toBeLessThan(print[1][0])
  expect(foliage[0][0]).toBeGreaterThan(-2.94)
})
it('uses dark-potted pointed tabletop foliage and grounds its tea accessories', () => {
  const plant = item('discussion-table-plant')
  expect(plant.find((p) => p.id === 'pot')?.color).toBe(0x42372d)
  const top = bounds('meeting-table')[2][1]
  for (const id of [
    'discussion-table-plant',
    'discussion-cup-right',
    'discussion-americano',
    'discussion-sugar'
  ]) {
    expect(bounds(id)[2][0], id).toBeCloseTo(top, 5)
  }
  expect(bounds('discussion-table-plant')[2][1] - top).toBeGreaterThan(0.29)
  expect(bounds('discussion-table-plant')[2][1] - top).toBeLessThan(0.44)
})
it('places a tapered clear Americano before the notebook, with a short white sugar jar and handleless cup', () => {
  const glass = item('discussion-americano')
  const shell = glass.find((p) => p.id === 'glass')
  if (!shell) throw new Error('Missing clear glass shell')
  expect(shell.opacity).toBe(1)
  expect(shell.optics).toMatchObject({ transmission: 1, captureLayer: 2 })
  const coffee = glass.find((p) => p.id === 'coffee')
  if (!coffee) throw new Error('Missing Americano contents')
  expect(coffee.color).toBe(0xffffff)
  expect(coffee.optics?.attenuationColor).toBe(0x332218)
  expect(coffee.optics?.transmission).toBe(1)
  const g = meshBounds(glass.filter((p) => p.id.startsWith('glass')))
  expect(g[2][1] - g[2][0]).toBeCloseTo(0.105)
  expect(meshBounds([coffee])[2][1]).toBeLessThan(g[2][1] - 0.008)
  const sugar = item('discussion-sugar')
  expect(sugar.find((p) => p.id === 'vessel')?.color).toBe(0xf5f1e7)
  expect(
    sugar.filter((p) => p.id.startsWith('sugar-cube-')).length
  ).toBeGreaterThan(0)
  const s = bounds('discussion-sugar')
  expect(s[2][1] - s[2][0]).toBeLessThan(0.09)
  expect(s[1][1]).toBeLessThan(g[1][0])
  const cup = item('discussion-cup-right')
  expect(cup.map((p) => p.id)).toEqual(['vessel'])
  const c = bounds('discussion-cup-right')
  expect(c[0][1] - c[0][0]).toBeGreaterThan(c[2][1] - c[2][0])
  expect(parts.has('discussion-milk-jug')).toBe(false)
})
it('retains the horizontal notebook footprint without intersecting the coffee', () => {
  const book = bounds('discussion-table-book')
  expect(book[0][1] - book[0][0]).toBeCloseTo(0.15)
  expect(book[1][1] - book[1][0]).toBeCloseTo(0.22)
  const glass = bounds('discussion-americano')
  expect(
    book
      .slice(0, 2)
      .some((axis, i) => axis[1] < glass[i][0] || axis[0] > glass[i][1])
  ).toBe(true)
})
it('places coffee above-right of sugar and the notebook above-left of coffee in the initial camera', () => {
  const { position, target } = OFFICE_STRUCTURE.camera
  const forward = target.map((n, i) => n - position[i])
  const length = Math.hypot(...forward)
  forward.forEach((n, i) => {
    forward[i] = n / length
  })
  const horizontal = Math.hypot(forward[0], forward[1])
  const right = [forward[1] / horizontal, -forward[0] / horizontal, 0]
  const up = [
    right[1] * forward[2],
    -right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0]
  ]
  const projectBase = (id: string, partId: string) => {
    const b = meshBounds(item(id).filter((part) => part.id === partId))
    const point = [(b[0][0] + b[0][1]) / 2, (b[1][0] + b[1][1]) / 2, b[2][0]]
    const relative = point.map((n, i) => n - position[i])
    const depth = relative.reduce((sum, n, i) => sum + n * forward[i], 0)
    return [right, up].map(
      (axis) => relative.reduce((sum, n, i) => sum + n * axis[i], 0) / depth
    )
  }
  const coffee = projectBase('discussion-americano', 'glass-base')
  const sugar = projectBase('discussion-sugar', 'vessel')
  expect(coffee[0]).toBeGreaterThan(sugar[0])
  expect(coffee[1]).toBeGreaterThan(sugar[1])
  const notebook = projectBase('discussion-table-book', 'body')
  expect(notebook[0]).toBeLessThan(coffee[0])
  expect(notebook[1]).toBeGreaterThan(coffee[1])
})
it('scatters individual sugar cube orientations without intersections or unstable rebuilds', () => {
  const cubes = sugarJar().filter((p) => p.id.startsWith('sugar-cube-'))
  expect(cubes).toHaveLength(16)
  expect(sugarJar().filter((p) => p.id.startsWith('sugar-cube-'))).toEqual(
    cubes
  )
  const widths = cubes.map((p) => {
    const b = meshBounds([p])
    return Math.round((b[0][1] - b[0][0]) * 100000)
  })
  expect(new Set(widths).size).toBeGreaterThan(6)
  const envelopes = cubes.map((p) => meshBounds([p]))
  for (let i = 0; i < envelopes.length; i++) {
    const a = envelopes[i]
    expect(a[2][0]).toBeGreaterThanOrEqual(0.006 - 1e-9)
    expect(a[2][1]).toBeLessThanOrEqual(0.042 + 1e-9)
    if (a[2][1] > 0.028)
      expect(a[0][1] < -0.003 || a[1][0] > 0.01 || a[1][1] < -0.01).toBe(true)
    if (a[2][0] > 0.007) {
      const supported = envelopes.some(
        (b) =>
          Math.abs(b[2][1] - a[2][0]) < 1e-9 &&
          Math.hypot(
            (a[0][0] + a[0][1] - b[0][0] - b[0][1]) / 2,
            (a[1][0] + a[1][1] - b[1][0] - b[1][1]) / 2
          ) < 0.002
      )
      expect(supported).toBe(true)
    }
    const inner = [
      [0.006, 0.035],
      [0.015, 0.047],
      [0.023, 0.051],
      [0.03, 0.049],
      [0.038, 0.044],
      [0.044, 0.041]
    ]
    const positions = cubes[i].mesh.positions
    for (let k = 0; k < positions.length; k += 3) {
      const z = positions[k + 2]
      const end = inner.findIndex(
        (point, index) => index > 0 && point[0] >= z - 1e-9
      )
      const [z0, r0] = inner[end - 1],
        [z1, r1] = inner[end]
      const radius = r0 + ((r1 - r0) * (z - z0)) / (z1 - z0)
      expect(Math.hypot(positions[k], positions[k + 1])).toBeLessThan(radius)
    }
    for (let j = i + 1; j < envelopes.length; j++) {
      const b = envelopes[j]
      expect(
        a.some(
          (axis, k) => axis[1] <= b[k][0] + 1e-9 || b[k][1] <= axis[0] + 1e-9
        )
      ).toBe(true)
    }
  }
})
it('exposes the glass lip, clear base and empty headspace around translucent coffee', () => {
  const glass = item('discussion-americano')
  const rim = glass.find((p) => p.id === 'glass-rim')
  const base = glass.find((p) => p.id === 'glass-base')
  const coffee = glass.find((p) => p.id === 'coffee')
  const surface = glass.find((p) => p.id === 'coffee-surface')
  expect(surface?.optics?.transmission).toBe(1)
  expect(surface?.roughness).toBeLessThan(coffee?.roughness ?? 0)
  if (!rim || !base || !coffee)
    throw new Error('Missing glass construction regions')
  for (const region of [rim, base, coffee]) {
    expect(region.opacity).toBeGreaterThan(0)
    expect(region.opacity).toBe(1)
    expect(region.optics?.transmission).toBe(1)
  }
  const cup = bounds('discussion-americano')
  const fill = meshBounds([coffee])
  expect(cup[2][1] - fill[2][1]).toBeGreaterThanOrEqual(0.008)
  expect(fill[2][0] - cup[2][0]).toBeGreaterThanOrEqual(0.014)
  expect(meshBounds([rim])[2][0]).toBeGreaterThan(fill[2][1])
})
it('matches the selected wide-mouth tapered tumbler with a thick rounded glass base', () => {
  const glass = americanoGlass()
  const region = (id: string) => {
    const value = glass.find((part) => part.id === id)
    if (!value) throw new Error('Missing tumbler region: ' + id)
    return value
  }
  const rim = meshBounds([region('glass-rim')])
  const base = meshBounds([region('glass-base')])
  const shell = region('glass').mesh.positions
  expect(rim[0][1] - rim[0][0]).toBeCloseTo(0.09, 5)
  expect(rim[2][1]).toBeCloseTo(0.105, 5)
  expect(base[0][1] - base[0][0]).toBeCloseTo(0.064, 5)
  expect(base[2][1] - base[2][0]).toBeCloseTo(0.014, 5)
  expect(Math.min(...shell.filter((_, i) => i % 3 === 2))).toBeCloseTo(
    base[2][1],
    5
  )
  expect(Math.max(...shell.filter((_, i) => i % 3 === 2))).toBeCloseTo(
    rim[2][0],
    5
  )
  for (const id of ['coffee', 'coffee-surface']) {
    const positions = region(id).mesh.positions
    for (let i = 0; i < positions.length; i += 3) {
      const z = positions[i + 2]
      expect(z).toBeGreaterThanOrEqual(0.015 - 1e-9)
      expect(z).toBeLessThanOrEqual(0.096 + 1e-9)
      const cavityRadius = 0.0296 + ((z - 0.014) / 0.088) * 0.013
      expect(Math.hypot(positions[i], positions[i + 1])).toBeLessThan(
        cavityRadius
      )
    }
  }
  expect(region('glass').optics).toMatchObject({
    transmission: 1,
    captureLayer: 2
  })
})
it('uses a low round-bellied sugar jar with a fitted notched lid and an inserted teaspoon', () => {
  const sugar = sugarJar(0xf5f1e7, 'closed')
  const body = sugar.find((p) => p.id === 'vessel')
  const lid = sugar.find((p) => p.id === 'lid')
  const spoon = sugar.find((p) => p.id === 'teaspoon')
  if (!body || !lid || !spoon) throw new Error('Missing sugar jar or teaspoon')
  const b = meshBounds([body]),
    l = meshBounds([lid]),
    s = meshBounds([spoon])
  expect(b[2][1] - b[2][0]).toBeLessThan(0.05)
  expect(b[0][1] - b[0][0]).toBeGreaterThan(l[0][1] - l[0][0])
  expect(l[2][1] - b[2][0]).toBeLessThan(0.065)
  expect(spoon.material).toBe('metal')
  expect(s[2][0]).toBeLessThan(b[2][1])
  expect(s[0][1]).toBeGreaterThan(b[0][1] + 0.03)
})
it('leans the removable lid against the jar with its bottom edge supported by the tabletop', () => {
  const sugar = item('discussion-sugar')
  const lid = sugar.find((p) => p.id === 'lid')
  const body = sugar.find((p) => p.id === 'vessel')
  if (!lid || !body) throw new Error('Missing sugar jar parts')
  const l = meshBounds([lid]),
    b = meshBounds([body])
  const top = bounds('meeting-table')[2][1]
  expect(l[2][0]).toBeCloseTo(top, 6)
  expect(l[2][1] - l[2][0]).toBeGreaterThan(0.075)
  expect(l[1][1]).toBeLessThan((b[1][0] + b[1][1]) / 2)
  let contact = Infinity
  for (let i = 0; i < lid.mesh.positions.length; i += 3) {
    const a = lid.mesh.positions.slice(i, i + 3)
    if (a[2] > b[2][1]) continue
    for (let j = 0; j < body.mesh.positions.length; j += 3) {
      contact = Math.min(
        contact,
        Math.hypot(
          a[0] - body.mesh.positions[j],
          a[1] - body.mesh.positions[j + 1],
          a[2] - body.mesh.positions[j + 2]
        )
      )
    }
  }
  expect(contact).toBeLessThan(0.002)
  expect(
    sugar
      .filter((p) => p.id.startsWith('sugar-cube-'))
      .some((p) => meshBounds([p])[2][1] > b[2][1] - 0.006)
  ).toBe(true)
})
it('raises the rear console above the tea table and retains grounded storage on both sides', () => {
  const consoleTop = bounds('discussion-console')[2][1]
  expect(consoleTop - bounds('meeting-table')[2][1]).toBeGreaterThan(0.12)
  for (const id of [
    'discussion-left-storage',
    'discussion-right-cabinet',
    'discussion-right-floor-plant'
  ]) {
    expect(bounds(id)[2][0], id).toBeCloseTo(0.38, 5)
  }
  expect(bounds('discussion-right-cabinet')[0][1]).toBeLessThan(0.0177)
  expect(bounds('discussion-right-cabinet')[1][1]).toBeLessThan(
    bounds('discussion-console')[1][0]
  )
  expect(
    meshBounds(
      item('discussion-console-plant').filter((p) => p.id === 'pot')
    )[2][0]
  ).toBeCloseTo(consoleTop, 5)
})

it('keeps the rear foliage clear of the wall and leaves above its pot', () => {
  const foliage = bounds('discussion-rear-climber')
  expect(foliage[1][1]).toBeLessThan(3.622099517721014)
  expect(foliage[0][1]).toBeLessThan(0.0176932207)
})

it('places one rectangular basket under an open side table and an empty vessel on its top', () => {
  const storage = discussionStorage(false)
  const baskets = storage.filter((p) => p.id.startsWith('basket'))
  expect(baskets).toHaveLength(1)
  const basket = meshBounds(baskets)
  expect(basket[0][1] - basket[0][0]).toBeCloseTo(0.3)
  expect(basket[1][1] - basket[1][0]).toBeCloseTo(0.23)
  expect(basket[2]).toEqual([0, 0.39])
  expect(storage.filter((p) => p.id.startsWith('leg-'))).toHaveLength(4)
  expect(storage.some((p) => /^(back|base|side-)/.test(p.id))).toBe(false)
  const vessel = storage.filter((p) => p.id === 'empty-vessel')
  expect(vessel).toHaveLength(1)
  expect(meshBounds(vessel)[2][0]).toBeCloseTo(
    meshBounds(storage.filter((p) => p.id === 'top'))[2][1]
  )
  const lip = vessel[0].mesh.positions
  const maxZ = meshBounds(vessel)[2][1]
  for (let i = 0; i < lip.length; i += 3) {
    if (lip[i + 2] > maxZ - 0.01)
      expect(Math.hypot(lip[i], lip[i + 1] + 0.015)).toBeGreaterThan(0.09)
  }
})

it('forms a tapered three-dimensional tree beside a low cabinet under the print', () => {
  const foliage = item('discussion-left-climber').filter((p) =>
    p.id.startsWith('leaves-')
  )
  const band = (low: number, high: number) => {
    const points = foliage.flatMap((p) => {
      const values: number[][] = []
      for (let i = 0; i < p.mesh.positions.length; i += 3) {
        const point = p.mesh.positions.slice(i, i + 3)
        if (point[2] >= low && point[2] <= high) values.push(point)
      }
      return values
    })
    expect(points.length).toBeGreaterThan(0)
    return [0, 1].map(
      (axis) =>
        points.reduce((value, p) => Math.max(value, p[axis]), -Infinity) -
        points.reduce((value, p) => Math.min(value, p[axis]), Infinity)
    )
  }
  const middle = band(0.95, 1.55),
    apex = band(2.4, 2.68)
  // The enlarged source has a substantial upper crown, not separated beads.
  for (const span of band(1.65, 1.85)) expect(span).toBeGreaterThan(0.29)
  expect(middle[0]).toBeGreaterThan(0.4)
  expect(middle[1]).toBeGreaterThan(0.4)
  expect(middle[0] / middle[1]).toBeGreaterThan(0.65)
  expect(middle[0] / middle[1]).toBeLessThan(1.4)
  for (const axis of [0, 1])
    expect(middle[axis]).toBeGreaterThan(apex[axis] * 1.65)
  const tree = bounds('discussion-left-climber'),
    cabinet = bounds('discussion-left-storage')
  expect(cabinet[1][0]).toBeGreaterThan(tree[1][1])
  expect(cabinet[1][1]).toBeGreaterThan(bounds('discussion-print')[1][0])
  expect(cabinet[2][1]).toBeLessThan(bounds('discussion-print')[2][0])
})

it('aligns the rear note with the console left edge and orders two plants around perfume', () => {
  const consoleBounds = bounds('discussion-console')
  expect(bounds('discussion-note')[0][0]).toBeCloseTo(consoleBounds[0][0], 5)
  expect(parts.has('discussion-console-cup')).toBe(false)
  const ids = [
    'discussion-console-plant',
    'discussion-console-perfume',
    'discussion-rear-climber'
  ]
  const objects = ids.map(bounds)
  for (let i = 0; i < objects.length; i++) {
    expect(objects[i][2][0], ids[i]).toBeCloseTo(consoleBounds[2][1], 5)
    expect(objects[i][0][0]).toBeGreaterThan(consoleBounds[0][0])
    expect(objects[i][0][1]).toBeLessThan(consoleBounds[0][1])
    if (i) expect(objects[i][0][0]).toBeGreaterThan(objects[i - 1][0][1])
  }
  expect(objects[2][2][1]).toBeGreaterThan(objects[0][2][1])
  const bottle = objects[1]
  expect(bottle[2][1] - bottle[2][0]).toBeCloseTo(0.23)
  expect(bottle[0][1] - bottle[0][0]).toBeCloseTo(0.1)
  expect(item(ids[1]).some((p) => p.id.includes('handle'))).toBe(false)
})

it('gives the console tree full-depth foliage with a clear rear-wall gap', () => {
  const crown = meshBounds(
    item('discussion-rear-climber').filter((p) => p.id.startsWith('leaves-'))
  )
  const width = crown[0][1] - crown[0][0]
  const depth = crown[1][1] - crown[1][0]
  expect(depth / width).toBeGreaterThan(0.75)
  expect(depth / width).toBeLessThan(1.3)
  expect(crown[1][1]).toBeLessThan(3.622099517721014 - 0.015)
})

it('keeps connected fine foliage throughout the conifer crown', () => {
  const crown = expanded(
    discussionTree(DISCUSSION_CONIFER_SIZES.reference, 37)
  ).filter((p) => p.id.startsWith('leaves-'))
  for (let z = 0.36; z <= 1.1; z += 0.04) {
    let radius = 0
    for (const part of crown)
      for (let i = 0; i < part.mesh.positions.length; i += 3) {
        const [x, y, height] = part.mesh.positions.slice(i, i + 3)
        if (Math.abs(z - height) < 0.025)
          radius = Math.max(radius, Math.hypot(x, y))
      }
    expect(radius, `foliage at ${z}`).toBeGreaterThan(0.35 * (1.2 - z) * 0.55)
    expect(radius).toBeLessThan(0.46)
  }
})

it('ends the central stem inside the apex foliage in both trees', () => {
  for (const id of ['discussion-left-climber', 'discussion-rear-climber']) {
    const stem = meshBounds(item(id).filter((p) => p.id === 'stems'))
    const crown = meshBounds(item(id).filter((p) => p.id.startsWith('leaves-')))
    expect(stem[2][1]).toBeLessThanOrEqual(crown[2][1])
  }
})

it('constructs the new conifer with fine needles and a charcoal tapered pot', () => {
  const tree = expanded(discussionTree(DISCUSSION_CONIFER_SIZES.reference, 37))
  const crown = tree.filter((p) => p.id.startsWith('leaves-'))
  const canopy = meshBounds(crown),
    whole = meshBounds(tree)
  const width = canopy[0][1] - canopy[0][0]
  expect(width / whole[2][1]).toBeGreaterThan(0.6)
  expect(width / whole[2][1]).toBeLessThan(0.82)
  expect(tree.find((p) => p.id === 'pot')?.color).toBe(0x393638)
  for (const part of crown) {
    const { positions, indices } = part.mesh
    let longest = 0
    for (let i = 0; i < indices.length; i += 3)
      for (let side = 0; side < 3; side++) {
        const a = indices[i + side] * 3,
          b = indices[i + ((side + 1) % 3)] * 3
        longest = Math.max(
          longest,
          Math.hypot(
            ...[0, 1, 2].map(
              (axis) => positions[a + axis] - positions[b + axis]
            )
          )
        )
      }
    expect(longest).toBeLessThan(0.025)
  }
})

it('admits the completed scene geometry through the public spatial contract', () => {
  const scene = referenceSceneFixture()
  for (const entry of buildSpatialMeshes(scene, {})) {
    expect(
      () => readSpatialDescriptor(entry.descriptor),
      entry.id
    ).not.toThrow()
  }
})

it('reuses connected spray geometry without dropping any branches or needles', () => {
  const tree = discussionTree(DISCUSSION_CONIFER_SIZES.reference, 37)
  const leaves = tree.filter((p) => p.id.startsWith('leaves-'))
  expect(leaves.reduce((n, p) => n + (p.instances?.length ?? 0), 0)).toBe(1092)
  expect(tree.find((p) => p.id === 'sprig-stems')?.instances).toHaveLength(1092)
  for (const leaf of leaves) {
    expect(leaf.mesh).toBe(leaves[0].mesh)
    expect(leaf.mesh.indices.length / 3).toBe(85 * 8)
    for (const instance of leaf.instances ?? []) {
      for (const axis of instance.basis)
        expect(Math.hypot(...axis)).toBeCloseTo(1)
    }
  }
})

it.each(Object.entries(DISCUSSION_CONIFER_SIZES))(
  'covers the %s inner silhouette without open branch ladders',
  (_name, dimensions) => {
    const radialScale = dimensions.crownRadius / 0.44
    const verticalScale = (dimensions.height - dimensions.potHeight) / 0.98
    const crown = expanded(discussionTree(dimensions, 37)).filter((p) =>
      p.id.startsWith('leaves-')
    )
    const size = 64,
      covered = new Set<number>()
    for (const part of crown) {
      const { positions, indices } = part.mesh
      for (let i = 0; i < indices.length; i += 3) {
        const points = indices
          .slice(i, i + 3)
          .map((index) => [
            ((positions[index * 3] / radialScale + 0.4) / 0.8) * size,
            ((positions[index * 3 + 2] - dimensions.potHeight) /
              verticalScale /
              0.94) *
              size
          ])
        const edge = (a: number[], b: number[], x: number, y: number) =>
          (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])
        const minX = Math.max(
          0,
          Math.floor(Math.min(...points.map((p) => p[0])))
        )
        const maxX = Math.min(
          size - 1,
          Math.ceil(Math.max(...points.map((p) => p[0])))
        )
        const minY = Math.max(
          0,
          Math.floor(Math.min(...points.map((p) => p[1])))
        )
        const maxY = Math.min(
          size - 1,
          Math.ceil(Math.max(...points.map((p) => p[1])))
        )
        for (let y = minY; y <= maxY; y++)
          for (let x = minX; x <= maxX; x++) {
            const signs = points.map((p, n) =>
              edge(p, points[(n + 1) % 3], x + 0.5, y + 0.5)
            )
            if (signs.every((n) => n >= 0) || signs.every((n) => n <= 0))
              covered.add(y * size + x)
          }
      }
    }
    let total = 0,
      filled = 0
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const height = 0.22 + ((y + 0.5) / size) * 0.94
        const horizontal = ((x + 0.5) / size) * 0.8 - 0.4
        if (
          height < 0.3 ||
          height > 1.05 ||
          Math.abs(horizontal) > (0.32 * (1.16 - height)) / 0.86
        )
          continue
        total++
        if (covered.has(y * size + x)) filled++
      }
    expect(filled / total).toBeGreaterThan(0.85)
  }
)

it('preserves room tree heights while adapting branch reach to the available footprint', () => {
  for (const [id, height, diameter] of [
    ['discussion-left-climber', 2.26, 0.28],
    ['discussion-rear-climber', 0.8588, 0.1064]
  ] as const) {
    const whole = bounds(id)
    expect(whole[2][1] - whole[2][0], id).toBeGreaterThan(height * 0.96)
    expect(whole[2][1] - whole[2][0], id).toBeLessThan(height * 1.04)
    const pot = meshBounds(item(id).filter((p) => p.id === 'pot'))
    expect(pot[0][1] - pot[0][0]).toBeCloseTo(diameter, 4)
  }
})

it('changes branch reach without anisotropically deforming needles or resizing the pot', () => {
  const tall = DISCUSSION_CONIFER_SIZES.floor
  const low = { ...tall, height: 1.2 }
  const a = discussionTree(tall, 37),
    b = discussionTree(low, 37)
  expect(a.find((p) => p.id === 'leaves-0')?.mesh).toEqual(
    b.find((p) => p.id === 'leaves-0')?.mesh
  )
  expect(a.find((p) => p.id === 'pot')?.mesh).toEqual(
    b.find((p) => p.id === 'pot')?.mesh
  )
  for (const leaf of a.filter((p) => p.id.startsWith('leaves-'))) {
    for (const instance of leaf.instances ?? []) {
      expect(typeof instance.scale).toBe('number')
      for (let axis = 0; axis < 3; axis++) {
        expect(Math.hypot(...instance.basis[axis])).toBeCloseTo(1)
        const next = instance.basis[(axis + 1) % 3]
        expect(
          instance.basis[axis].reduce((sum, n, i) => sum + n * next[i], 0)
        ).toBeCloseTo(0)
      }
    }
  }
})

it('fills the clear tumbler near its rim with brown coffee and irregular contained ice', () => {
  const parts = americanoGlass()
  const coffee = parts.find((p) => p.id === 'coffee')
  const surface = parts.find((p) => p.id === 'coffee-surface')
  if (!coffee || !surface) throw new Error('Missing iced Americano liquid')
  expect(meshBounds([coffee])[2][1]).toBeCloseTo(0.096, 5)
  expect(meshBounds([surface])[2][0]).toBeCloseTo(0.096, 5)
  const ice = parts.filter((p) => p.id.startsWith('ice-'))
  expect(ice).toHaveLength(7)
  for (const cube of ice) {
    const [bottom, top] = meshBounds([cube])[2]
    expect
      .soft(top, cube.id + ' must break the liquid surface')
      .toBeGreaterThan(0.096)
    expect
      .soft(bottom, cube.id + ' must remain mostly submerged')
      .toBeLessThan(0.09)
    expect
      .soft(top, cube.id + ' must not stack above the rim')
      .toBeLessThan(0.105)
  }
  for (const cube of ice) {
    expect(cube.opacity).toBeGreaterThan(0)
    expect(cube.opacity).toBe(1)
    expect(cube.optics).toMatchObject({ transmission: 1, captureLayer: 0 })
    expect(cube.emissiveIntensity ?? 0).toBe(0)
    const v = cube.mesh.positions
    for (let i = 0; i < v.length; i += 3) {
      expect(v[i + 2]).toBeGreaterThan(0.015)
      const radius =
        0.0296 + ((Math.min(v[i + 2], 0.102) - 0.014) / 0.088) * 0.013
      expect(Math.hypot(v[i], v[i + 1])).toBeLessThan(radius)
    }
  }
  // The liquid surface must have real openings, not cover the floating ice.
  const triangleArea = (mesh: typeof surface.mesh) => {
    let area = 0
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const [a, b, c] = mesh.indices
        .slice(i, i + 3)
        .map((n) => mesh.positions.slice(n * 3, n * 3 + 3))
      area +=
        Math.abs(
          (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        ) / 2
    }
    return area
  }
  expect(triangleArea(surface.mesh)).toBeLessThan(Math.PI * 0.0413 ** 2 * 0.85)
  expect(triangleArea(surface.mesh)).toBeGreaterThan(
    Math.PI * 0.0413 ** 2 * 0.4
  )
})

it('keeps complete glass and liquid paths translucent without repainting ice cavities', () => {
  const parts = americanoGlass()
  const region = (id: string) => {
    const part = parts.find((p) => p.id === id)
    if (!part) throw new Error('Missing optical region: ' + id)
    return part
  }
  // Full-coverage transmission preserves reflections without an alpha veil.
  expect(region('glass').opacity).toBe(1)
  expect(region('glass').optics?.captureLayer).toBe(2)
  expect(region('coffee').optics?.captureLayer).toBe(1)
  expect(region('coffee').optics?.ior).toBe(1.33)
  expect(region('coffee').optics?.attenuationDistance).toBeGreaterThan(0)
  expect(region('coffee').color).toBe(0xffffff)
  expect(region('coffee-ice-interface').opacity).toBe(0)
  expect(region('coffee-ice-interface').mesh.indices.length).toBeGreaterThan(0)
  const body = region('coffee').mesh
  expect(body.positions.length / 3).toBeLessThan(body.indices.length / 2)
  for (const p of parts.filter((p) => p.id.startsWith('ice-')))
    expect(p.optics).toMatchObject({ transmission: 1, captureLayer: 0 })
})

it('keeps the coffee surface upward-facing for optical front-face rendering', () => {
  const surface = americanoGlass().find((p) => p.id === 'coffee-surface')
  if (!surface) throw new Error('Missing coffee surface')
  for (let i = 0; i < surface.mesh.indices.length; i += 3) {
    const [a, b, c] = surface.mesh.indices
      .slice(i, i + 3)
      .map((id) => surface.mesh.positions.slice(id * 3, id * 3 + 3))
    const nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    expect(nz).toBeGreaterThan(0)
  }
})

it('uses dark coffee-brown absorption without tinting the clear glass or ice', () => {
  const parts = americanoGlass()
  for (const id of ['coffee', 'coffee-surface']) {
    const color = parts.find((p) => p.id === id)?.optics?.attenuationColor
    if (color === undefined) throw new Error('Missing liquid absorption')
    const linear = (channel: number) => {
      const value = channel / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    }
    const [r, g, b] = [color >> 16, (color >> 8) & 255, color & 255].map(linear)
    expect(0.2126 * r + 0.7152 * g + 0.0722 * b).toBeLessThan(0.03)
    expect(r / g).toBeLessThan(3)
    expect(r).toBeGreaterThan(g)
    expect(g).toBeGreaterThan(b)
  }
  for (const p of parts.filter(
    (p) => p.id.startsWith('glass') || p.id.startsWith('ice-')
  ))
    expect(p.optics?.attenuationColor).toBe(0xffffff)
})

it('keeps the floating ice solids separated instead of intersecting each other', () => {
  const cubes = americanoGlass().filter((p) => p.id.startsWith('ice-'))
  const vertices = cubes.map((cube) => {
    const result: number[][] = []
    for (let i = 0; i < cube.mesh.positions.length; i += 3)
      result.push(cube.mesh.positions.slice(i, i + 3))
    return result
  })
  const normals = cubes.map((cube, index) => {
    const unique = new Map<string, number[]>()
    for (let i = 0; i < cube.mesh.indices.length; i += 3) {
      const [a, b, c] = cube.mesh.indices
        .slice(i, i + 3)
        .map((id) => vertices[index][id])
      const u = b.map((v, k) => v - a[k]),
        v = c.map((n, k) => n - a[k])
      const cross = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
      ]
      const length = Math.hypot(...cross)
      if (length < 1e-12) continue
      const normal = cross.map((n) => n / length)
      unique.set(normal.map((n) => n.toFixed(5)).join(','), normal)
    }
    return [...unique.values()]
  })
  for (let i = 0; i < cubes.length; i++)
    for (let j = i + 1; j < cubes.length; j++) {
      // Any separating face plane proves the two convex rounded solids are disjoint.
      const separated = [...normals[i], ...normals[j]].some((normal) => {
        const project = (points: number[][]) =>
          points.map((p) => p.reduce((sum, n, k) => sum + n * normal[k], 0))
        const a = project(vertices[i]),
          b = project(vertices[j])
        return (
          Math.max(...a) < Math.min(...b) - 1e-5 ||
          Math.max(...b) < Math.min(...a) - 1e-5
        )
      })
      expect.soft(separated, cubes[i].id + ' / ' + cubes[j].id).toBe(true)
    }
})

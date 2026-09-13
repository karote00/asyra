import { expect, it } from 'vitest'
import { frontierBox, frontierPrism } from '../__fixtures__/frontier-meshes'
import { buildMeshIndex, refineMeshIndex, type MeshNode } from '../mesh-index'
import {
  MeshFrontier,
  type FrontierWork,
  type FrontierPass
} from '../mesh-frontier'

const ignore = () => undefined
const index = (geometry = frontierBox()) =>
  refineMeshIndex(buildMeshIndex(geometry, ignore), ignore)
function offsets(node: MeshNode | undefined): number[] {
  if (!node) return [-1]
  if (node.children) return node.children.flatMap(offsets)
  return node.triangles.map((t) => t.offset)
}
function exhaust(pass: FrontierPass) {
  const products: string[] = []
  while (pass.hasPending) {
    const [a, b] = pass.next()
    if (a?.children) {
      pass.split('a')
      continue
    }
    if (b?.children) {
      pass.split('b')
      continue
    }
    for (const left of offsets(a))
      for (const right of offsets(b)) products.push(`${left}:${right}`)
    pass.retain()
  }
  pass.publish()
  return products.sort()
}
function consumeCover(pass: FrontierPass) {
  const products: string[] = []
  while (pass.hasPending) {
    const [a, b] = pass.next()
    for (const left of offsets(a))
      for (const right of offsets(b)) products.push(`${left}:${right}`)
    pass.retain()
  }
  pass.publish()
  return products.sort()
}
it('maintains exactly the full Cartesian source cover after arbitrary legal subdivisions and reuse', () => {
  const a = frontierBox(),
    b = frontierPrism(),
    ai = index(a),
    bi = index(b),
    frontier = new MeshFrontier(ignore)
  expect(frontier.observe(a, b)).toBe(true)
  const pass = frontier.start(ai, bi)
  if (!pass) throw new Error('Missing eligible frontier')
  const actual = exhaust(pass),
    expected = offsets(ai.root)
      .flatMap((a) => offsets(bi.root).map((b) => `${a}:${b}`))
      .sort()
  expect(actual).toEqual(expected)
  expect(new Set(actual).size).toBe(expected.length)
  const reused = frontier.start(ai, bi)
  if (!reused) throw new Error('Missing complete frontier')
  expect(consumeCover(reused)).toEqual(expected)
})
it('forbids duplicate processing and publishing active or unvisited regions', () => {
  const g = frontierBox(),
    i = index(g),
    frontier = new MeshFrontier(ignore)
  frontier.observe(g, g)
  const pass = frontier.start(i, i)
  if (!pass) throw new Error('Missing frontier')
  expect(() => pass.publish()).toThrow('Incomplete')
  pass.next()
  expect(() => pass.next()).toThrow('Unsettled')
  expect(() => pass.publish()).toThrow('Incomplete')
  pass.split('a')
  expect(() => pass.retain()).toThrow('No active')
  expect(() => pass.publish()).toThrow('Incomplete')
  expect(exhaust(pass)).toHaveLength(144)
  expect(() => pass.publish()).toThrow('closed')
})
it('invalidates ordered geometry and exact hierarchy identity including lazy refinement', () => {
  const a = frontierBox(),
    b = frontierPrism(),
    ai = index(a),
    bi = index(b),
    frontier = new MeshFrontier(ignore)
  frontier.observe(a, b)
  const pass = frontier.start(ai, bi)
  if (!pass) throw new Error('Missing pass')
  exhaust(pass)
  const replacement = buildMeshIndex(a, ignore)
  const replaced = frontier.start(replacement, bi)
  if (!replaced) throw new Error('Missing replacement')
  expect(replaced.next()).toEqual([replacement.root, bi.root])
  replaced.retain()
  replaced.publish()
  const refined = frontier.start(refineMeshIndex(replacement, ignore), bi)
  if (!refined) throw new Error('Missing refinement')
  expect(refined.next()[0]).not.toBe(replacement.root)
  frontier.observe(b, a)
  expect(() => refined.publish()).toThrow()
  const reversed = frontier.start(bi, ai)
  if (!reversed) throw new Error('Missing reverse')
  expect(reversed.next()).toEqual([bi.root, ai.root])
  expect(frontier.observe({ ...a }, b)).toBe(false)
  expect(frontier.start(ai, bi)).toBeUndefined()
})
it('charges exact complete preparation cold and warm, once per invocation, with frozen graph ownership', () => {
  const g = frontierBox(),
    i = index(g),
    counts = { nodes: 0, triangles: 0 }
  const visit = (node: MeshNode) => {
    counts.nodes++
    counts.triangles += node.triangles.length
    node.children?.forEach(visit)
  }
  visit(i.root)
  const runs: FrontierWork[][] = []
  for (let n = 0; n < 2; n++) {
    const charges: FrontierWork[] = [],
      frontier = new MeshFrontier((kind) => charges.push(kind))
    frontier.observe(g, g)
    const first = frontier.start(i, i)
    if (!first) throw new Error('Missing first')
    first.next()
    first.retain()
    first.publish()
    const before = charges.length,
      next = frontier.start(i, i)
    if (!next) throw new Error('Missing next')
    expect(charges.length - before).toBe(1)
    expect(charges.filter((k) => k === 'prepare-node')).toHaveLength(
      counts.nodes
    )
    expect(charges.filter((k) => k === 'prepare-triangle')).toHaveLength(
      counts.triangles
    )
    expect(charges.filter((k) => k === 'prepare-representative')).toHaveLength(
      i.representatives.length
    )
    runs.push(charges)
  }
  expect(runs[1]).toEqual(runs[0])
  expect(Object.isFrozen(i)).toBe(true)
  expect(Object.isFrozen(i.root)).toBe(true)
  expect(() => {
    ;(i.root.bounds[0] as unknown as number[])[0] = 100
  }).toThrow()
})
it('rejects stale transaction publication and retains no interrupted new partition', () => {
  const g = frontierBox(),
    i = index(g),
    frontier = new MeshFrontier(ignore)
  frontier.observe(g, g)
  const old = frontier.start(i, i)
  if (!old) throw new Error('Missing old')
  old.next()
  old.retain()
  const current = frontier.start(i, i)
  if (!current) throw new Error('Missing current')
  expect(() => old.publish()).toThrow('Stale')
  expect(current.next()).toEqual([i.root, i.root])
})
it.each([
  'prepare-node',
  'prepare-triangle',
  'prepare-representative',
  'capture',
  'reopen',
  'publish'
] as const)('does not publish through cancellation at %s', (stage) => {
  const g = frontierBox(),
    i = index(g),
    sentinel = new Error(`cancel ${stage}`)
  let armed = true
  const frontier = new MeshFrontier((kind) => {
    if (armed && kind === stage) throw sentinel
  })
  frontier.observe(g, g)
  expect(() => {
    const pass = frontier.start(i, i)
    if (!pass) throw new Error('Missing pass')
    exhaust(pass)
  }).toThrow(sentinel)
  armed = false
  const retry = frontier.start(i, i)
  if (!retry) throw new Error('Missing retry')
  expect(retry.next()).toEqual([i.root, i.root])
})
it('rejects a missing mesh index, incomplete source cover, and substituted source coordinates', () => {
  const g = frontierBox(),
    frontier = new MeshFrontier(ignore)
  frontier.observe(g, g)
  expect(() => frontier.start(undefined, undefined)).toThrow('Missing original')
  const flat = buildMeshIndex(g, ignore, false)
  const missing = {
    ...flat,
    root: { ...flat.root, triangles: flat.root.triangles.slice(1) }
  }
  expect(() => frontier.start(missing, flat)).toThrow('Incomplete original')
  const substituted = buildMeshIndex(frontierBox(2), ignore, false)
  expect(() => frontier.start(substituted, flat)).toThrow('geometry mismatch')
})
it('rejects duplicate source offsets, hybrid nodes and an index bound to the opposite geometry', () => {
  const g = frontierBox(),
    h = frontierPrism(),
    flat = buildMeshIndex(g, ignore, false),
    frontier = new MeshFrontier(ignore)
  frontier.observe(g, g)
  expect(() =>
    frontier.start(
      {
        ...flat,
        root: {
          ...flat.root,
          triangles: [flat.root.triangles[0], ...flat.root.triangles]
        }
      },
      flat
    )
  ).toThrow('triangle identity')
  expect(() =>
    frontier.start(
      { ...flat, root: { ...flat.root, children: [flat.root, flat.root] } },
      flat
    )
  ).toThrow('partition')
  const pass = frontier.start(flat, flat)
  if (!pass) throw new Error('Missing pass')
  exhaust(pass)
  frontier.observe(h, g)
  expect(() => frontier.start(flat, flat)).toThrow('ordered geometry')
})
it('clears the partition on intervening native-only work and covers the native singleton exactly', () => {
  const g = frontierBox(),
    i = index(g),
    native = Object.freeze({ kind: 'box' as const, size: [1, 1, 1] as const }),
    frontier = new MeshFrontier(ignore)
  frontier.observe(g, native)
  const pass = frontier.start(i, undefined)
  if (!pass) throw new Error('Missing mesh-native pass')
  expect(exhaust(pass)).toEqual(
    offsets(i.root)
      .map((a) => `${a}:-1`)
      .sort()
  )
  expect(frontier.observe(native, native)).toBe(false)
  frontier.observe(g, native)
  const fresh = frontier.start(i, undefined)
  expect(fresh?.next()).toEqual([i.root, undefined])
})
it('exhaustively checks source products across mixed retained and reopened partitions', () => {
  const a = frontierBox(),
    b = frontierPrism(),
    ai = index(a),
    bi = index(b)
  const expected = offsets(ai.root)
    .flatMap((x) => offsets(bi.root).map((y) => `${x}:${y}`))
    .sort()
  const frontier = new MeshFrontier(ignore)
  frontier.observe(a, b)
  // All six-bit schedules; each publication is checked against every original
  // triangle pair, then the next schedule starts from that actual saved cover.
  for (let mask = 0; mask < 64; mask++) {
    const pass = frontier.start(ai, bi)
    if (!pass) throw new Error('Missing eligible pass')
    let step = 0
    while (pass.hasPending) {
      const [left, right] = pass.next(),
        split = (mask >> (step++ % 6)) & 1
      if (split && (left?.children || right?.children)) {
        pass.split(
          left?.children && (!(step & 1) || !right?.children) ? 'a' : 'b'
        )
      } else pass.retain()
    }
    pass.publish()
    const check = frontier.start(ai, bi)
    if (!check) throw new Error('Missing complete partition')
    const actual = consumeCover(check)
    expect(actual).toEqual(expected)
    expect(new Set(actual).size).toBe(expected.length)
  }
})

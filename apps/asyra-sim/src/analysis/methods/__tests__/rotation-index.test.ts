import { expect, it } from 'vitest'
import type { Bounds, MeshIndex, MeshNode } from '../mesh-index'
import { rotateIndex } from './rotation-index-fixture'

const leaf = (x: number): MeshNode => ({
  bounds: [
    [x, x + 1 / 4],
    [0, 1 / 4],
    [0, 1 / 4]
  ],
  triangles: []
})
const combine = (a: MeshNode, b: MeshNode): MeshNode => ({
  bounds: a.bounds.map((axis, i) => [
    Math.min(axis[0], b.bounds[i][0]),
    Math.max(axis[1], b.bounds[i][1])
  ]) as unknown as Bounds,
  triangles: [],
  children: [a, b]
})
const index = (root: MeshNode): MeshIndex => ({
  root,
  representatives: [],
  componentCount: 0
})
function inspect(root: MeshNode) {
  const leaves: MeshNode[] = [],
    pending = [root],
    seen = new Set<MeshNode>()
  let cost = 0
  while (pending.length) {
    const node = pending.pop()
    if (!node || seen.has(node))
      throw new Error('Repeated source node or cycle')
    seen.add(node)
    if (!node.children) {
      leaves.push(node)
      continue
    }
    expect(node.bounds).toEqual(combine(...node.children).bounds)
    const [x, y, z] = node.bounds.map((axis) => axis[1] - axis[0])
    cost += 2 * (x * y + x * z + y * z)
    pending.push(...node.children)
  }
  return { leaves, cost }
}
it('selects a strictly improving opposite child swap with every leaf retained', () => {
  const a = leaf(0),
    b = leaf(10),
    r = leaf(1),
    root = combine(combine(a, b), r)
  const before = JSON.stringify(root)
  let work = 0
  const result = rotateIndex(index(root), () => work++)
  expect(result.root.children?.[0].children).toEqual([a, r])
  expect(result.root.children?.[1]).toBe(b)
  expect(new Set(inspect(result.root).leaves)).toEqual(new Set([a, b, r]))
  expect(inspect(result.root).cost).toBeLessThan(inspect(root).cost)
  expect(JSON.stringify(root)).toBe(before)
  expect(work).toBe(11)
})
it('selects the compound regrouping when both original groups span distant leaves', () => {
  const a = leaf(0),
    b = leaf(10),
    c = leaf(1 / 2),
    d = leaf(10.5)
  const root = combine(combine(a, b), combine(c, d))
  let work = 0
  const result = rotateIndex(index(root), () => work++)
  expect(result.root.children?.[0].children).toEqual([a, c])
  expect(result.root.children?.[1].children).toEqual([b, d])
  expect(new Set(inspect(result.root).leaves)).toEqual(new Set([a, b, c, d]))
  expect(inspect(result.root).cost).toBeLessThan(inspect(root).cost)
  expect(work).toBe(24)
})
it('keeps no-op ties and accounts for all rejected candidates', () => {
  const root = combine(combine(leaf(0), leaf(0)), combine(leaf(0), leaf(0)))
  let work = 0
  expect(rotateIndex(index(root), () => work++).root).toBe(root)
  expect(work).toBe(21)
  expect(() =>
    rotateIndex(index(root), () => {
      throw new Error('cancel')
    })
  ).toThrow('cancel')
})

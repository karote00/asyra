import type { Bounds, MeshIndex, MeshNode } from '../mesh-index'

/** Fixed, charged single-original-postorder rotation hypothesis. */
export function rotateIndex(
  index: MeshIndex,
  checkpoint: () => void
): MeshIndex {
  const area = (bounds: Bounds) => {
    const [x, y, z] = bounds.map((axis) => axis[1] - axis[0])
    return 2 * (x * y + x * z + y * z)
  }
  const union = (a: MeshNode, b: MeshNode): Bounds => {
    checkpoint()
    return a.bounds.map((axis, i) => [
      Math.min(axis[0], b.bounds[i][0]),
      Math.max(axis[1], b.bounds[i][1])
    ]) as unknown as Bounds
  }
  interface Branch {
    children: [MeshNode, MeshNode]
    bounds: Bounds
  }
  type Part = MeshNode | Branch
  const branch = (a: MeshNode, b: MeshNode): Branch => ({
    children: [a, b],
    bounds: union(a, b)
  })
  const materialize = (part: Part): MeshNode => {
    if ('triangles' in part) return part
    checkpoint()
    return { ...part, triangles: [] }
  }
  const done = new Map<MeshNode, MeshNode>()
  const pending: { node: MeshNode; ready: boolean }[] = [
    { node: index.root, ready: false }
  ]
  while (pending.length) {
    const next = pending.pop()
    if (!next) throw new Error('Missing original node')
    const { node, ready } = next
    if (node.children && !ready) {
      pending.push(
        { node, ready: true },
        { node: node.children[1], ready: false },
        { node: node.children[0], ready: false }
      )
      continue
    }
    checkpoint()
    if (!node.children) {
      done.set(node, node)
      continue
    }
    const left = done.get(node.children[0]),
      right = done.get(node.children[1])
    if (!left || !right) throw new Error('Incomplete original postorder')
    let best: { parts: [Part, Part]; delta: number } | undefined
    const consider = (parts: [Part, Part], before: number, after: number) => {
      checkpoint()
      const delta = after - before
      if (Number.isFinite(delta) && delta < 0 && (!best || delta < best.delta))
        best = { parts, delta }
    }
    if (left.children) {
      const [a, b] = left.children
      const rb = branch(right, b)
      consider([rb, a], area(left.bounds), area(rb.bounds))
      const ar = branch(a, right)
      consider([ar, b], area(left.bounds), area(ar.bounds))
    }
    if (right.children) {
      const [c, d] = right.children
      const ld = branch(left, d)
      consider([c, ld], area(right.bounds), area(ld.bounds))
      const cl = branch(c, left)
      consider([d, cl], area(right.bounds), area(cl.bounds))
    }
    if (left.children && right.children) {
      const [a, b] = left.children,
        [c, d] = right.children
      const ac = branch(a, c),
        bd = branch(b, d)
      const before = area(left.bounds) + area(right.bounds)
      consider([ac, bd], before, area(ac.bounds) + area(bd.bounds))
      const ad = branch(a, d),
        bc = branch(b, c)
      consider([ad, bc], before, area(ad.bounds) + area(bc.bounds))
    }
    if (!best && left === node.children[0] && right === node.children[1]) {
      done.set(node, node)
      continue
    }
    const children: [MeshNode, MeshNode] = best
      ? [materialize(best.parts[0]), materialize(best.parts[1])]
      : [left, right]
    checkpoint()
    done.set(node, { bounds: node.bounds, triangles: [], children })
  }
  const root = done.get(index.root)
  if (!root) throw new Error('Incomplete rotation')
  return { ...index, root }
}

import type { Bounds, MeshIndex, MeshNode, MeshTriangle } from '../mesh-index'

/** Complete admitted-component grouping; all extra immutable preparation is charged. */
export function componentIndex(
  index: MeshIndex,
  checkpoint: () => void
): MeshIndex {
  const scan = <T>(items: readonly T[], visit: (item: T) => void) => {
    items.forEach((item, i) => {
      if (i % 256 === 0) checkpoint()
      visit(item)
    })
  }
  const triangles: MeshTriangle[] = [],
    pending = [index.root]
  while (pending.length) {
    const node = pending.pop()
    if (!node) throw new Error('Missing original node')
    checkpoint()
    triangles.push(...node.triangles)
    if (node.children) pending.push(node.children[1], node.children[0])
  }
  const groups = new Map<number, MeshTriangle[]>()
  scan(triangles, (triangle) => {
    const group = groups.get(triangle.component)
    if (group) group.push(triangle)
    else groups.set(triangle.component, [triangle])
  })
  if (groups.size !== index.componentCount)
    throw new Error('Incomplete admitted components')
  function build<T>(
    items: T[],
    getBounds: (item: T) => Bounds,
    key: (item: T) => number,
    limit: number,
    leaf: (items: T[], bounds?: Bounds) => MeshNode
  ): MeshNode {
    checkpoint()
    if (limit === 1 && items.length === 1) return leaf(items)
    const bounds: [[number, number], [number, number], [number, number]] = [
      [Infinity, -Infinity],
      [Infinity, -Infinity],
      [Infinity, -Infinity]
    ]
    scan(items, (item) => {
      const box = getBounds(item)
      for (let axis = 0; axis < 3; axis++) {
        bounds[axis][0] = Math.min(bounds[axis][0], box[axis][0])
        bounds[axis][1] = Math.max(bounds[axis][1], box[axis][1])
      }
    })
    if (items.length <= limit) return leaf(items, bounds)
    const widths = bounds.map((axis) => axis[1] - axis[0]),
      axis = widths.indexOf(Math.max(...widths))
    let comparisons = 0
    items.sort((a, b) => {
      if (comparisons++ % 256 === 0) checkpoint()
      const ab = getBounds(a),
        bb = getBounds(b)
      return (
        ab[axis][0] + ab[axis][1] - (bb[axis][0] + bb[axis][1]) ||
        key(a) - key(b)
      )
    })
    const middle = Math.floor(items.length / 2)
    return {
      bounds,
      triangles: [],
      children: [
        build(items.slice(0, middle), getBounds, key, limit, leaf),
        build(items.slice(middle), getBounds, key, limit, leaf)
      ]
    }
  }
  const roots = [...groups].map(([component, items]) => ({
    component,
    node: build(
      items,
      (item) => item.bounds,
      (item) => item.offset,
      4,
      (items, bounds) => {
        if (!bounds) throw new Error('Missing triangle bounds')
        return { bounds, triangles: items }
      }
    )
  }))
  const root = build(
    roots,
    (item) => item.node.bounds,
    (item) => item.component,
    1,
    (items) => items[0].node
  )
  return { ...index, root }
}

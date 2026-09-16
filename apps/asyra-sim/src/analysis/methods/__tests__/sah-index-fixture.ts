import type { Bounds, MeshIndex, MeshNode, MeshTriangle } from '../mesh-index'

/** Test-owned fixed 8-bin, 3-axis SAH probe with explicit additional prep work. */
export function partitionIndex(
  index: MeshIndex,
  checkpoint: () => void
): MeshIndex {
  const scan = <T>(
    items: readonly T[],
    visit: (item: T, index: number) => void
  ) => {
    for (let i = 0; i < items.length; i++) {
      if (i % 256 === 0) checkpoint()
      visit(items[i], i)
    }
  }
  const sorted = (
    items: readonly MeshTriangle[],
    compare: (a: MeshTriangle, b: MeshTriangle) => number
  ) => {
    let comparisons = 0
    return [...items].sort((a, b) => {
      if (comparisons++ % 256 === 0) checkpoint()
      return compare(a, b)
    })
  }
  const combine = (
    a: Bounds | undefined,
    b: Bounds | undefined
  ): Bounds | undefined => {
    if (!a) return b
    if (!b) return a
    return a.map((axis, i) => [
      Math.min(axis[0], b[i][0]),
      Math.max(axis[1], b[i][1])
    ]) as unknown as Bounds
  }
  const area = (bounds: Bounds) => {
    const [x, y, z] = bounds.map((axis) => axis[1] - axis[0])
    return 2 * (x * y + x * z + y * z)
  }
  const center = (triangle: MeshTriangle, axis: number) =>
    triangle.bounds[axis][0] / 2 + triangle.bounds[axis][1] / 2
  function build(items: MeshTriangle[]): MeshNode {
    checkpoint()
    let bounds: Bounds | undefined
    scan(items, (item) => {
      bounds = combine(bounds, item.bounds)
    })
    if (!bounds) throw new Error('Empty source partition')
    if (items.length <= 4) return { bounds, triangles: items }
    let best:
      | { cost: number; axis: number; split: number; min: number; max: number }
      | undefined
    for (let axis = 0; axis < 3; axis++) {
      let min = Infinity,
        max = -Infinity
      scan(items, (item) => {
        const value = center(item, axis)
        min = Math.min(min, value)
        max = Math.max(max, value)
      })
      if (min === max) continue
      const bins = Array.from({ length: 8 }, () => ({
        count: 0,
        bounds: undefined as Bounds | undefined
      }))
      scan(items, (item) => {
        const bin =
          bins[
            Math.min(
              7,
              Math.floor(((center(item, axis) - min) / (max - min)) * 8)
            )
          ]
        bin.count++
        bin.bounds = combine(bin.bounds, item.bounds)
      })
      const prefix: typeof bins = [],
        suffix: typeof bins = []
      let count = 0,
        box: Bounds | undefined
      scan(bins, (bin) => {
        count += bin.count
        box = combine(box, bin.bounds)
        prefix.push({ count, bounds: box })
      })
      count = 0
      box = undefined
      scan([...bins].reverse(), (bin) => {
        count += bin.count
        box = combine(box, bin.bounds)
        suffix.unshift({ count, bounds: box })
      })
      for (let split = 0; split < 7; split++) {
        const left = prefix[split],
          right = suffix[split + 1]
        if (!left.count || !right.count || !left.bounds || !right.bounds)
          continue
        checkpoint()
        const cost =
          area(left.bounds) * left.count + area(right.bounds) * right.count
        if (!best || cost < best.cost) best = { cost, axis, split, min, max }
      }
    }
    let left: MeshTriangle[] = [],
      right: MeshTriangle[] = []
    if (best) {
      const choice = best
      scan(items, (item) => {
        const bin = Math.min(
          7,
          Math.floor(
            ((center(item, choice.axis) - choice.min) /
              (choice.max - choice.min)) *
              8
          )
        )
        ;(bin <= choice.split ? left : right).push(item)
      })
    }
    if (!left.length || !right.length) {
      checkpoint()
      const widths = bounds.map((axis) => axis[1] - axis[0]),
        axis = widths.indexOf(Math.max(...widths))
      const ordered = sorted(
        items,
        (a, b) => center(a, axis) - center(b, axis) || a.offset - b.offset
      )
      left = ordered.slice(0, Math.floor(ordered.length / 2))
      right = ordered.slice(Math.floor(ordered.length / 2))
    }
    return { bounds, triangles: [], children: [build(left), build(right)] }
  }
  const triangles: MeshTriangle[] = []
  const collect = (node: MeshNode) => {
    checkpoint()
    triangles.push(...node.triangles)
    for (const child of node.children ?? []) collect(child)
  }
  collect(index.root)
  return {
    ...index,
    root: build(sorted(triangles, (a, b) => a.offset - b.offset))
  }
}

import type { ConvexShape } from './convex-query'
import type { MeshIndex, MeshNode } from './mesh-index'

export type FrontierWork =
  | 'entry'
  | 'admission'
  | 'lookup'
  | 'begin'
  | 'cleanup'
  | 'root-cell'
  | 'prepare-node'
  | 'prepare-triangle'
  | 'prepare-representative'
  | 'journal'
  | 'child-cell'
  | 'update'
  | 'undo'
  | 'publish'
type Geometry = ConvexShape['geometry']
type Cell = [MeshNode | undefined, MeshNode | undefined] & {
  next: Cell | undefined
}
interface Journal {
  cell: Cell
  a: MeshNode | undefined
  b: MeshNode | undefined
  next: Cell | undefined
  previous: Journal | undefined
}
const frozenGeometry = (g: Geometry) =>
  Object.isFrozen(g) &&
  (g.kind !== 'mesh' ||
    (Object.isFrozen(g.positions) && Object.isFrozen(g.indices)))

/** Exclusive, query-private structural cover. Never stores geometry evidence. */
export class MeshFrontier {
  private pair: readonly [Geometry, Geometry] | undefined
  private indices:
    readonly [MeshIndex | undefined, MeshIndex | undefined] | undefined
  private head: Cell | undefined
  private cursor: Cell | undefined
  private active: Cell | undefined
  private journal: Journal | undefined
  private hadHead = false
  private busy = false
  private started = false
  private eligible = false
  private prepared = new WeakSet<MeshIndex>()
  private bindings = new WeakMap<MeshIndex, Geometry>()
  constructor(private readonly charge: (kind: FrontierWork) => void) {}
  enter(): void {
    if (this.busy) throw new Error('Reentrant frontier query')
    this.busy = true
    try {
      this.charge('entry')
    } catch (error) {
      // A retained cover keeps its previously paid cleanup reservation.
      // Reentrant rejection occurs above, outside this own-entry cleanup.
      if (this.head) this.cancel()
      this.busy = false
      throw error
    }
  }
  leave(): void {
    this.busy = false
  }
  observe(a: Geometry, b: Geometry): boolean {
    this.charge('admission')
    this.eligible =
      frozenGeometry(a) &&
      frozenGeometry(b) &&
      (a.kind === 'mesh' || b.kind === 'mesh')
    if (!this.eligible || this.pair?.[0] !== a || this.pair?.[1] !== b) {
      this.head = undefined
      this.indices = undefined
    }
    this.pair = this.eligible ? [a, b] : undefined
    return this.eligible
  }
  private seal(index: MeshIndex | undefined, geometry: Geometry): void {
    if (!index) {
      if (geometry.kind === 'mesh')
        throw new Error('Missing original source hierarchy')
      return
    }
    if (geometry.kind !== 'mesh')
      throw new Error('Native geometry cannot own a mesh frontier index')
    if (this.prepared.has(index)) {
      if (this.bindings.get(index) !== geometry)
        throw new Error('Wrong ordered geometry index identity')
      return
    }
    const seen = new WeakSet<MeshNode>(),
      offsets = new Set<number>()
    const visit = (node: MeshNode) => {
      this.charge('prepare-node')
      if (seen.has(node)) throw new Error('Repeated source hierarchy node')
      seen.add(node)
      if (
        (node.children &&
          (node.children.length !== 2 || node.triangles.length)) ||
        (!node.children && !node.triangles.length)
      )
        throw new Error('Invalid source hierarchy partition')
      for (const range of node.bounds)
        if (
          !Number.isFinite(range[0]) ||
          !Number.isFinite(range[1]) ||
          range[0] > range[1]
        )
          throw new Error('Invalid source node bounds')
      for (const triangle of node.triangles) {
        this.charge('prepare-triangle')
        if (
          offsets.has(triangle.offset) ||
          triangle.offset % 3 !== 0 ||
          triangle.offset < 0 ||
          triangle.offset + 2 >= geometry.indices.length
        )
          throw new Error('Invalid source triangle identity')
        offsets.add(triangle.offset)
        for (const range of triangle.bounds)
          if (
            !Number.isFinite(range[0]) ||
            !Number.isFinite(range[1]) ||
            range[0] > range[1]
          )
            throw new Error('Invalid source triangle bounds')
        triangle.vertices.forEach((point, vertex) =>
          point.forEach((value, axis) => {
            const expected =
              geometry.positions[
                geometry.indices[triangle.offset + vertex] * 3 + axis
              ]
            if (
              value !== expected ||
              value < triangle.bounds[axis][0] ||
              value > triangle.bounds[axis][1]
            )
              throw new Error('Source triangle geometry mismatch')
          })
        )
        triangle.vertices.forEach(Object.freeze)
        Object.freeze(triangle.vertices)
        triangle.bounds.forEach(Object.freeze)
        Object.freeze(triangle.bounds)
        Object.freeze(triangle)
      }
      node.children?.forEach(visit)
      for (const bounds of [
        ...node.triangles.map((triangle) => triangle.bounds),
        ...(node.children ?? []).map((child) => child.bounds)
      ]) {
        for (let axis = 0; axis < 3; axis++)
          if (
            bounds[axis][0] < node.bounds[axis][0] ||
            bounds[axis][1] > node.bounds[axis][1]
          )
            throw new Error('Incomplete source node bounds')
      }
      if (node.children) Object.freeze(node.children)
      node.bounds.forEach(Object.freeze)
      Object.freeze(node.bounds)
      Object.freeze(node.triangles)
      Object.freeze(node)
    }
    visit(index.root)
    if (offsets.size * 3 !== geometry.indices.length)
      throw new Error('Incomplete original source hierarchy')
    for (const representative of index.representatives) {
      this.charge('prepare-representative')
      Object.freeze(representative)
    }
    Object.freeze(index.representatives)
    Object.freeze(index)
    this.bindings.set(index, geometry)
    this.prepared.add(index)
  }

  start(
    a: MeshIndex | undefined,
    b: MeshIndex | undefined
  ): MeshFrontier | undefined {
    if (!this.busy || this.started)
      throw new Error('Invalid frontier transaction entry')
    if (!this.eligible) return undefined
    if (!this.pair) throw new Error('Missing ordered source geometry')
    this.charge('lookup')
    this.seal(a, this.pair[0])
    this.seal(b, this.pair[1])
    this.charge('begin')
    // A completed/restored cover retains this invalidation reservation until
    // discarded. Entry/begin and publication/undo pay normal phase work.
    this.charge('cleanup')
    if (this.indices?.[0] !== a || this.indices?.[1] !== b)
      this.head = undefined
    this.indices = [a, b]
    this.hadHead = Boolean(this.head)
    this.started = true
    if (!this.head) {
      this.charge('root-cell')
      const cell = [a?.root, b?.root] as Cell
      cell.next = undefined
      this.head = cell
    }
    this.cursor = this.head
    this.active = undefined
    this.journal = undefined
    return this
  }
  get hasPending(): boolean {
    return this.cursor !== undefined
  }
  next(): Cell {
    if (!this.started || !this.cursor)
      throw new Error('Missing frontier region')
    this.active = this.cursor
    this.cursor = this.active.next
    return this.active
  }
  split(side: 'a' | 'b'): void {
    const cell = this.active,
      children = (side === 'a' ? cell?.[0] : cell?.[1])?.children
    if (!this.started || !cell || !children)
      throw new Error('Invalid source split')
    this.charge('journal')
    this.journal = {
      cell,
      a: cell[0],
      b: cell[1],
      next: cell.next,
      previous: this.journal
    }
    this.charge('child-cell')
    const child = (
      side === 'a' ? [children[0], cell[1]] : [cell[0], children[0]]
    ) as Cell
    child.next = cell.next
    this.charge('update')
    cell[side === 'a' ? 0 : 1] = children[1]
    cell.next = child
    this.cursor = cell
  }
  /** Called only after the canonical owner completes all current geometry. */
  publish(): void {
    if (!this.started || this.cursor)
      throw new Error('Incomplete Cartesian traversal')
    this.charge('publish')
    this.journal = undefined
    this.active = undefined
    this.started = false
  }
  /** Ordinary nonpublication restores the previous exact structural partition. */
  finish(): void {
    if (!this.started) return
    while (this.journal) {
      this.charge('undo')
      const entry = this.journal
      entry.cell[0] = entry.a
      entry.cell[1] = entry.b
      entry.cell.next = entry.next
      this.journal = entry.previous
    }
    if (!this.hadHead) this.head = undefined
    this.cursor = undefined
    this.active = undefined
    this.started = false
  }
  /** Reserved constant cleanup: never scan/rollback after cancellation. */
  cancel(): void {
    this.head = undefined
    this.cursor = undefined
    this.active = undefined
    this.journal = undefined
    this.started = false
  }
}

import type { ConvexShape } from './convex-query'
import type { MeshIndex, MeshNode } from './mesh-index'

export type FrontierWork =
  | 'admission'
  | 'lookup'
  | 'prepare-node'
  | 'prepare-triangle'
  | 'prepare-representative'
  | 'capture'
  | 'reopen'
  | 'publish'
type Pair = readonly [MeshNode | undefined, MeshNode | undefined]
type Geometry = ConvexShape['geometry']
const frozenGeometry = (g: Geometry) =>
  Object.isFrozen(g) &&
  (g.kind !== 'mesh' ||
    (Object.isFrozen(g.positions) && Object.isFrozen(g.indices)))

/** Structural cover only. No distance, pose, certificate direction or witness. */
export class FrontierPass {
  private cursor = 0
  private pending: Pair[] = []
  private output: Pair[] = []
  private active: Pair | undefined
  private closed = false
  constructor(
    private readonly input: readonly Pair[],
    private readonly charge: (kind: FrontierWork) => void,
    private readonly commit: (pairs: readonly Pair[]) => void
  ) {}
  get hasPending(): boolean {
    return Boolean(
      this.active || this.pending.length || this.cursor < this.input.length
    )
  }
  next(): Pair {
    if (this.closed) throw new Error('Frontier transaction is closed')
    if (this.active) throw new Error('Unsettled frontier region')
    const pair = this.pending.pop() ?? this.input[this.cursor++]
    if (!pair) throw new Error('Missing frontier region')
    this.active = pair
    return pair
  }
  split(side: 'a' | 'b'): void {
    if (!this.active) throw new Error('No active frontier region')
    const [a, b] = this.active,
      children = (side === 'a' ? a : b)?.children
    if (!children) throw new Error('Cannot split a terminal source node')
    this.charge('reopen')
    for (const child of children)
      this.pending.push(side === 'a' ? [child, b] : [a, child])
    this.active = undefined
  }
  retain(): void {
    if (!this.active) throw new Error('No active frontier region')
    this.charge('capture')
    this.output.push(Object.freeze([...this.active]) as Pair)
    this.active = undefined
  }
  publish(): void {
    if (this.closed) throw new Error('Frontier transaction is closed')
    if (this.hasPending) throw new Error('Incomplete Cartesian frontier')
    this.charge('publish')
    this.commit(Object.freeze(this.output))
    this.closed = true
  }
}

/** Default-off prerequisite owner. Its single slot dies with the query context. */
export class MeshFrontier {
  private pair: readonly [Geometry, Geometry] | undefined
  private packet:
    | {
        a: MeshIndex | undefined
        b: MeshIndex | undefined
        pairs: readonly Pair[]
      }
    | undefined
  private generation = 0
  private eligible = false
  private prepared = new WeakSet<MeshIndex>()
  private bindings = new WeakMap<MeshIndex, Geometry>()
  constructor(private readonly charge: (kind: FrontierWork) => void) {}
  observe(a: Geometry, b: Geometry): boolean {
    this.charge('admission')
    this.generation++
    this.eligible =
      frozenGeometry(a) &&
      frozenGeometry(b) &&
      (a.kind === 'mesh' || b.kind === 'mesh')
    if (!this.eligible || this.pair?.[0] !== a || this.pair?.[1] !== b)
      this.packet = undefined
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
  ): FrontierPass | undefined {
    if (!this.eligible) return undefined
    if (!this.pair) throw new Error('Missing ordered source geometry')
    this.charge('lookup')
    this.seal(a, this.pair[0])
    this.seal(b, this.pair[1])
    const packet = this.packet
    const input =
      packet && packet.a === a && packet.b === b
        ? packet.pairs
        : [Object.freeze([a?.root, b?.root]) as Pair]
    if (this.packet?.a !== a || this.packet?.b !== b) this.packet = undefined
    const generation = ++this.generation
    return new FrontierPass(input, this.charge, (pairs) => {
      if (generation !== this.generation)
        throw new Error('Stale frontier transaction')
      this.packet = { a, b, pairs }
    })
  }
}

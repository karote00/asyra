import { emptyMesh, type Mesh, type Vec } from './geometry'
interface Point {
  p: Vec
  uv: number[]
}
interface Face {
  vertices: Point[]
  normal: Vec
  w: number
  region: number
}
const epsilon = 1e-8
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function face(vertices: Point[], region: number): Face | null {
  const a = sub(vertices[1].p, vertices[0].p),
    b = sub(vertices[2].p, vertices[0].p),
    n: Vec = [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ],
    length = Math.hypot(...n)
  if (length < 1e-14) return null
  const normal = n.map((v) => v / length) as Vec
  return { vertices, normal, w: dot(normal, vertices[0].p), region }
}
function split(
  plane: Face,
  p: Face,
  coplanarFront: Face[],
  coplanarBack: Face[],
  front: Face[],
  back: Face[]
) {
  const types = p.vertices.map((v) => {
      const d = dot(plane.normal, v.p) - plane.w
      if (d > epsilon) return 1
      if (d < -epsilon) return 2
      return 0
    }),
    kind = types.reduce<number>((a, b) => a | b, 0)
  if (kind === 0) {
    ;(dot(plane.normal, p.normal) > 0 ? coplanarFront : coplanarBack).push(p)
    return
  }
  if (kind === 1) {
    front.push(p)
    return
  }
  if (kind === 2) {
    back.push(p)
    return
  }
  const f: Point[] = [],
    b: Point[] = []
  for (let i = 0; i < p.vertices.length; i++) {
    const j = (i + 1) % p.vertices.length,
      a = p.vertices[i],
      c = p.vertices[j],
      ta = types[i],
      tc = types[j]
    if (ta !== 2) f.push(a)
    if (ta !== 1) b.push(a)
    if ((ta | tc) === 3) {
      const t =
        (plane.w - dot(plane.normal, a.p)) / dot(plane.normal, sub(c.p, a.p))
      const point: Point = {
        p: a.p.map((v, k) => v + t * (c.p[k] - v)) as Vec,
        uv: a.uv.map((v, k) => v + t * (c.uv[k] - v))
      }
      f.push(point)
      b.push(point)
    }
  }
  // Split polygons stay convex; remove consecutive duplicate points at cut planes.
  const clean = (v: Point[]) =>
    v.filter(
      (p, i) =>
        Math.hypot(...sub(p.p, v[(i + v.length - 1) % v.length].p)) >
        epsilon / 10
    )
  for (const [vertices, target] of [
    [clean(f), front],
    [clean(b), back]
  ] as const)
    if (vertices.length >= 3) {
      // Preserve the known plane even when the first three resulting vertices are collinear.
      target.push({ ...p, vertices: [...vertices] })
    }
}
class SolidTree {
  plane: Face | undefined
  faces: Face[] = []
  front: SolidTree | undefined
  back: SolidTree | undefined
  constructor(polygons: Face[] = []) {
    this.build(polygons)
  }
  build(polygons: Face[]) {
    if (!polygons.length) return
    this.plane ??= polygons[Math.floor(polygons.length / 2)]
    const front: Face[] = [],
      back: Face[] = []
    for (const p of polygons)
      split(this.plane, p, this.faces, this.faces, front, back)
    if (front.length) {
      this.front ??= new SolidTree()
      this.front.build(front)
    }
    if (back.length) {
      this.back ??= new SolidTree()
      this.back.build(back)
    }
  }
  all(): Face[] {
    return [
      ...this.faces,
      ...(this.front?.all() ?? []),
      ...(this.back?.all() ?? [])
    ]
  }
  invert() {
    const invert = (p: Face): Face => ({
      ...p,
      vertices: [...p.vertices].reverse(),
      normal: p.normal.map((v) => -v) as Vec,
      w: -p.w
    })
    this.faces = this.faces.map(invert)
    if (this.plane) this.plane = invert(this.plane)
    this.front?.invert()
    this.back?.invert()
    ;[this.front, this.back] = [this.back, this.front]
  }
  clip(polygons: Face[]): Face[] {
    if (!this.plane) return [...polygons]
    let front: Face[] = [],
      back: Face[] = []
    for (const p of polygons) split(this.plane, p, front, back, front, back)
    if (this.front) front = this.front.clip(front)
    back = this.back ? this.back.clip(back) : []
    return [...front, ...back]
  }
  clipTo(other: SolidTree) {
    this.faces = other.clip(this.faces)
    this.front?.clipTo(other)
    this.back?.clipTo(other)
  }
}
function polygons(mesh: Mesh, region: number): Face[] {
  const faces: Face[] = []
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const f = face(
      mesh.indices.slice(i, i + 3).map((id) => ({
        p: mesh.positions.slice(id * 3, id * 3 + 3) as Vec,
        uv: mesh.uvs.slice(id * 2, id * 2 + 2)
      })),
      region
    )
    if (f) faces.push(f)
  }
  return faces
}
/** Subtract closed outward-wound solids, preserving their curved source surfaces. */
export function subtractSolid(outer: Mesh, cutter: Mesh): Mesh {
  return subtractSolids(outer, [cutter])
}

export function subtractSolids(outer: Mesh, cutters: Mesh[]): Mesh {
  let faces = polygons(outer, 0)
  for (const [i, cutter] of cutters.entries()) {
    const a = new SolidTree(faces),
      b = new SolidTree(polygons(cutter, i + 1))
    a.invert()
    a.clipTo(b)
    b.clipTo(a)
    b.invert()
    b.clipTo(a)
    b.invert()
    a.build(b.all())
    a.invert()
    faces = a.all()
  }
  return triangulateSolid(faces)
}

/** Share every cut vertex along both adjacent faces before triangulating. */
function triangulateSolid(faces: Face[]): Mesh {
  const key = (p: Vec) => p.map((v) => Math.round(v * 1e9)).join(',')
  const points = new Map<string, Vec>()
  for (const f of faces)
    for (const v of f.vertices) {
      const k = key(v.p)
      let position = points.get(k)
      if (!position) {
        position = v.p.map((x) => Math.round(x * 1e9) / 1e9) as Vec
        points.set(k, position)
      }
      v.p = position
    }
  const positions = [...points.values()]
  const extent = Math.max(
    ...[0, 1, 2].map(
      (k) =>
        Math.max(...positions.map((p) => p[k])) -
        Math.min(...positions.map((p) => p[k]))
    )
  )
  const cell = extent / 24,
    grid = new Map<string, Vec[]>()
  const bucket = (p: Vec) => p.map((v) => Math.floor(v / cell))
  for (const p of positions) {
    const k = bucket(p).join(',')
    grid.set(k, [...(grid.get(k) ?? []), p])
  }
  const splitEdge = (a: Point, b: Point): Point[] => {
    const d = sub(b.p, a.p),
      length = dot(d, d),
      steps = Math.max(1, Math.ceil(Math.max(...d.map(Math.abs)) / cell) * 2),
      candidates = new Set<Vec>()
    for (let i = 0; i <= steps; i++) {
      const [x, y, z] = bucket(a.p.map((v, k) => v + (d[k] * i) / steps) as Vec)
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dz = -1; dz <= 1; dz++)
            for (const p of grid.get(`${x + dx},${y + dy},${z + dz}`) ?? [])
              candidates.add(p)
    }
    const inner: [number, Vec][] = []
    for (const p of candidates) {
      const v = sub(p, a.p),
        t = dot(v, d) / length
      if (t <= 1e-8 || t >= 1 - 1e-8) continue
      if (Math.hypot(...v.map((x, k) => x - t * d[k])) < 2e-9)
        inner.push([t, p])
    }
    inner.sort((u, v) => u[0] - v[0])
    return [
      a,
      ...inner.map(([t, p]) => ({
        p,
        uv: a.uv.map((u, k) => u + t * (b.uv[k] - u))
      }))
    ]
  }
  const mesh = emptyMesh(),
    vertices = new Map<string, number>()
  const index = (p: Point, region: number) => {
    const k = [region, ...p.p, ...p.uv]
      .map((v) => Math.round(v * 1e9))
      .join(',')
    const found = vertices.get(k)
    if (found !== undefined) return found
    const id = mesh.positions.length / 3
    mesh.positions.push(...p.p)
    mesh.uvs.push(...p.uv)
    vertices.set(k, id)
    return id
  }
  for (const f of faces) {
    const boundary = f.vertices.flatMap((v, i) =>
      splitEdge(v, f.vertices[(i + 1) % f.vertices.length])
    )
    const centre: Point = { p: [0, 0, 0], uv: [0, 0] }
    for (const v of boundary) {
      for (let k = 0; k < 3; k++) centre.p[k] += v.p[k] / boundary.length
      for (let k = 0; k < 2; k++) centre.uv[k] += v.uv[k] / boundary.length
    }
    const ci = index(centre, f.region)
    for (let i = 0; i < boundary.length; i++) {
      const a = boundary[i],
        b = boundary[(i + 1) % boundary.length]
      if (!face([centre, a, b], f.region)) continue
      mesh.indices.push(ci, index(a, f.region), index(b, f.region))
    }
  }
  return mesh
}

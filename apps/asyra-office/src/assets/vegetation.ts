import {
  growTreeBranches,
  distributeTreeFoliage,
  type TreeCurve
} from './tree-branching'
import { createTreeGrowth } from './tree-growth'
import type { GeometryInstance } from './instances'
import spec from '../../../../assets/asyra-office/models/street/tree-construction-spec.json'
import {
  add,
  bezier,
  emptyMesh,
  mul,
  tube,
  vec,
  type Mesh,
  type Vec
} from './geometry'
import { part, type AssetPart } from './catalog'
const dot = (a: Vec, b: Vec) => a.reduce((s, n, i) => s + n * b[i], 0)
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]
const unit = (a: Vec) => mul(a, 1 / (Math.hypot(...a) || 1))
const sub = (a: Vec, b: Vec) => add(a, mul(b, -1))
const project = (a: Vec, n: Vec) => sub(a, mul(n, dot(a, n)))
const random = (seed: number) => () => {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
  return (seed + 0.5) / 2 ** 32
}
export function leaf(detail: 'near' | 'far' = 'near'): Mesh {
  const radial = detail === 'near' ? [0.5, 1] : [1],
    samples = detail === 'near' ? 8 : 2
  const m = emptyMesh(),
    boundary = spec.leaf.outlineCubicBezierCCW.flatMap((points) =>
      bezier(
        points.map(([x, y]) => [x, y, 0]),
        samples
      ).slice(0, -1)
    ),
    n = boundary.length
  for (const back of [false, true]) {
    const base = m.positions.length / 3
    m.positions.push(
      0,
      0,
      spec.leaf.bulge - (back ? spec.leaf.shellTranslation : 0)
    )
    m.uvs.push(0.5, 0.5)
    for (const rho of radial) {
      for (const p of boundary) {
        m.positions.push(
          rho * p[0],
          rho * p[1],
          spec.leaf.bulge * (1 - rho * rho) ** 2 -
            (back ? spec.leaf.shellTranslation : 0)
        )
        m.uvs.push((rho * p[0]) / 0.1 + 0.5, (rho * p[1]) / 0.058 + 0.5)
      }
    }
    const tri = (a: number, b: number, c: number) =>
      m.indices.push(...(back ? [a, c, b] : [a, b, c]))
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      tri(base, base + 1 + i, base + 1 + j)
      if (radial.length === 2) {
        tri(base + 1 + i, base + 1 + n + i, base + 1 + n + j)
        tri(base + 1 + i, base + 1 + n + j, base + 1 + j)
      }
    }
  }
  // Each skin and the thin rim own their normals. Sharing rim vertices tilts
  // the skin normals sideways and makes broad leaves look like crumpled foil.
  const side = 1 + radial.length * n
  const rim = m.positions.length / 3
  const perimeter = [0]
  for (let i = 1; i <= n; i++) {
    perimeter.push(
      perimeter[i - 1] + Math.hypot(...sub(boundary[i % n], boundary[i - 1]))
    )
  }
  for (let i = 0; i <= n; i++) {
    const index = 1 + (radial.length - 1) * n + (i % n)
    for (const offset of [0, side]) {
      m.positions.push(
        ...m.positions.slice((index + offset) * 3, (index + offset + 1) * 3)
      )
      m.uvs.push(perimeter[i] / perimeter[n], offset ? 0 : 1)
    }
  }
  for (let i = 0; i < n; i++) {
    const a = rim + i * 2
    m.indices.push(a, a + 1, a + 3, a, a + 3, a + 2)
  }
  return m
}
/** Construct the authored catalog recipe; whole-unit sizing belongs to placement. */
export function tree(options: { seed?: number } = {}): AssetPart[] {
  return createTreeVariants([options.seed ?? spec.growth.defaultSeed])[0]
}

/** Prepare invariant leaf geometry once per batch, not once per tree or frame. */
export function createTreeVariants(seeds: readonly number[]): AssetPart[][] {
  const prototypes = { near: leaf(), far: leaf('far') }
  return seeds.map((seed) => buildTree(seed, prototypes))
}

function buildTree(
  seed: number,
  prototypes: { near: Mesh; far: Mesh }
): AssetPart[] {
  const stations = spec.trunk.stationsXYZRadius
  const trunk = (z: number): Vec => {
    let i = stations.findIndex(
      (s, j) => j < stations.length - 1 && z <= stations[j + 1][2]
    )
    if (i < 0) {
      i = stations.length - 2
    }
    const a = stations[i],
      b = stations[i + 1],
      d = b[2] - a[2],
      u = (z - a[2]) / d
    const derivative = (k: number, axis: number) => {
      const p = stations[Math.max(0, k - 1)],
        q = stations[Math.min(stations.length - 1, k + 1)]
      return (q[axis] - p[axis]) / (q[2] - p[2])
    }
    return [0, 1]
      .map(
        (k) =>
          (2 * u ** 3 - 3 * u * u + 1) * a[k] +
          (u ** 3 - 2 * u * u + u) * d * derivative(i, k) +
          (-2 * u ** 3 + 3 * u * u) * b[k] +
          (u ** 3 - u * u) * d * derivative(i + 1, k)
      )
      .concat(z) as Vec
  }
  const curves = new Map<string, TreeCurve>()
  curves.set('trunk', {
    at: (t) => trunk(t * 2.55),
    radius: (t) => {
      const z = t * 2.55
      let i = stations.findIndex(
        (s, j) => j < stations.length - 1 && z <= stations[j + 1][2]
      )
      if (i < 0) {
        i = stations.length - 2
      }
      const a = stations[i],
        b = stations[i + 1],
        u = (z - a[2]) / (b[2] - a[2])
      return a[3] * (1 - u) + b[3] * u
    }
  })
  const p: AssetPart[] = [],
    grow = createTreeGrowth(seed, trunk)
  for (const branch of [...spec.branches.entries].sort(
    (a, b) => a.level - b.level
  )) {
    const parent = curves.get(branch.parent)
    if (!parent) {
      throw new Error('Missing parent branch')
    }
    const at =
        branch.parent === 'trunk'
          ? (branch.attachmentZ ?? 0) / 2.55
          : (branch.parentT ?? 0),
      s = parent.at(at),
      growth = grow(branch.id, branch.end, branch.controlLift),
      e = growth.end,
      c = add(mul(add(s, e), 0.5), [0, 0, growth.lift]),
      root =
        branch.level === 1
          ? Math.min(0.055, 0.82 * parent.radius(at))
          : 0.58 * parent.radius(at),
      tip =
        branch.level === 1
          ? Math.min(0.007, 0.22 * root)
          : Math.min(0.004, 0.28 * root)
    curves.set(branch.id, {
      at: (t) =>
        add(add(mul(s, (1 - t) ** 2), mul(c, 2 * (1 - t) * t)), mul(e, t * t)),
      radius: (t) => tip + (root - tip) * (1 - t) ** 1.2
    })
  }
  const additions = growTreeBranches(seed, curves)
  for (const [id, curve] of curves) {
    p.push(
      part(
        id,
        tube(
          Array.from({ length: 25 }, (_, i) => curve.at(i / 24)),
          Array.from({ length: 25 }, (_, i) => curve.radius(i / 24)),
          10
        ),
        0x806144,
        'wood',
        spec.materials.bark.roughness
      )
    )
  }
  const proto = prototypes.near,
    distant = prototypes.far,
    groups: GeometryInstance[][] = [[], [], []]
  const clusters = distributeTreeFoliage(seed, additions)
  clusters.forEach((cluster, g) => {
    const curve = curves.get(cluster.branch)
    if (!curve) {
      throw new Error('Missing foliage branch')
    }
    const t =
        cluster.branch === 'trunk'
          ? (cluster.attachmentZ ?? 0) / 2.55
          : (cluster.branchT ?? 0),
      w = unit(
        sub(curve.at(Math.min(1, t + 0.001)), curve.at(Math.max(0, t - 0.001)))
      ),
      a = unit(project(Math.abs(w[0]) > 0.99 ? [0, 1, 0] : [1, 0, 0], w)),
      b = cross(w, a),
      frame = (p: Vec) => add(add(mul(a, p[0]), mul(b, p[1])), mul(w, p[2])),
      centre = add(curve.at(t), frame(vec(cluster.localOffset))),
      rng = random(seed + 1009 * g)
    const dominant = spec.foliage.subgroups.map((_, j) => {
      const u = random(seed + 1009 * g + 65537 * (j + 1))()
      if (u < 0.5) {
        return 0
      }
      return u < 0.8 ? 1 : 2
    })
    for (let i = 0; i < cluster.count; i++) {
      const u = Array.from({ length: 8 }, rng),
        j = i % 5,
        z = 1 - 2 * u[0],
        theta = 2 * Math.PI * u[1],
        v: Vec = [
          Math.sqrt(1 - z * z) * Math.cos(theta),
          Math.sqrt(1 - z * z) * Math.sin(theta),
          z
        ],
        local = vec(
          cluster.radii.map(
            (r, k) =>
              r *
              (spec.foliage.subgroupOffsetFraction *
                spec.foliage.subgroups[j][k] +
                v[k] * spec.foliage.jitterRadiusFraction * Math.cbrt(u[2]))
          )
        ),
        pos = add(centre, local),
        scale = leafScale(j, u[3])
      const z2 = 1 - 2 * u[4],
        phi = 2 * Math.PI * u[5],
        v2: Vec = [
          Math.sqrt(1 - z2 * z2) * Math.cos(phi),
          Math.sqrt(1 - z2 * z2) * Math.sin(phi),
          z2
        ],
        normal = unit(
          add(
            unit(vec(v.map((n, k) => n / cluster.radii[k]))),
            mul(v2, spec.foliage.normalPerturbation)
          )
        ),
        projection = project(w, normal),
        U = unit(
          Math.hypot(...projection) < 1e-6 ? project(a, normal) : projection
        ),
        V = cross(normal, U),
        alpha = ((2 * u[6] - 1) * 80 * Math.PI) / 180,
        long = add(mul(U, Math.cos(alpha)), mul(V, Math.sin(alpha))),
        short = add(mul(U, -Math.sin(alpha)), mul(V, Math.cos(alpha))),
        others = [0, 1, 2].filter((n) => n !== dominant[j]),
        color = u[7] < 0.75 ? dominant[j] : others[u[7] < 0.875 ? 0 : 1],
        instances = groups[color]
      instances.push({
        id: `cluster-${g}-leaf-${i}`,
        position: pos,
        basis: [long, short, normal],
        scale
      })
    }
  })
  groups.forEach((instances, i) =>
    p.push({
      ...part(
        `leaves-${i}`,
        proto,
        [0x829347, 0xa7ad58, 0x596d3d][i],
        'leaf',
        0.9
      ),
      instances,
      distant: { mesh: distant, maxError: 0.01 }
    })
  )
  return p
}

function leafScale(subgroup: number, u: number) {
  if (subgroup === spec.foliage.budSubgroupIndex) {
    const [min, max] = spec.foliage.budScale
    return min + (max - min) * u
  }
  let start = 0
  for (const range of spec.foliage.sizeMixture) {
    if (u < start + range.probability) {
      return (
        range.scale[0] +
        ((range.scale[1] - range.scale[0]) * (u - start)) / range.probability
      )
    }
    start += range.probability
  }
  throw new Error('Leaf size mixture must cover the unit interval')
}

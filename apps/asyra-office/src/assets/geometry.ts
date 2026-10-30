import { meshNormals, transformNormal, latheNormals } from './geometry-normals'
import {
  readSpatialShape,
  type SpatialShape,
  type SpatialVector
} from '@asyra/preset/spatial-contract'
export type Vec = [number, number, number]
export interface Mesh {
  positions: number[]
  indices: number[]
  uvs: number[]
  normals?: number[]
}
export const vec = (a: readonly number[]): Vec => [a[0], a[1], a[2]]
export const add = (a: readonly number[], b: readonly number[]): Vec => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2]
]
export const mul = (a: readonly number[], s: number): Vec => [
  a[0] * s,
  a[1] * s,
  a[2] * s
]
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]
const unit = (v: Vec): Vec => mul(v, 1 / (Math.hypot(...v) || 1))
export const emptyMesh = (): Mesh => ({ positions: [], indices: [], uvs: [] })
export function append(
  target: Mesh,
  source: Mesh,
  position: Vec = [0, 0, 0],
  rotation: Vec = [0, 0, 0],
  scale: Vec = [1, 1, 1]
) {
  const offset = target.positions.length / 3
  if (target.normals || source.normals) {
    target.normals ??= meshNormals(target)
    const normals = meshNormals(source)
    for (let i = 0; i < normals.length; i += 3) {
      target.normals.push(
        ...transformNormal(normals.slice(i, i + 3), rotation, scale)
      )
    }
  }
  for (let i = 0; i < source.positions.length; i += 3) {
    let [x, y, z] = source.positions.slice(i, i + 3).map((n, a) => n * scale[a])
    const [a, b, c] = rotation.map((n) => (n * Math.PI) / 180)
    ;[y, z] = [
      y * Math.cos(a) - z * Math.sin(a),
      y * Math.sin(a) + z * Math.cos(a)
    ]
    ;[x, z] = [
      x * Math.cos(b) + z * Math.sin(b),
      -x * Math.sin(b) + z * Math.cos(b)
    ]
    ;[x, y] = [
      x * Math.cos(c) - y * Math.sin(c),
      x * Math.sin(c) + y * Math.cos(c)
    ]
    target.positions.push(x + position[0], y + position[1], z + position[2])
  }
  for (const index of source.indices) {
    target.indices.push(index + offset)
  }
  for (const uv of source.uvs) {
    target.uvs.push(uv)
  }
}
function vertex(m: Mesh, p: Vec, uv: [number, number] = [0, 0]) {
  m.positions.push(...p)
  m.uvs.push(...uv)
  return m.positions.length / 3 - 1
}
export function box(
  size: Vec,
  radius = 0,
  segments = 3,
  samples: readonly (readonly number[])[] = []
): Mesh {
  const m = emptyMesh(),
    h = size.map((n) => n / 2),
    r = Math.min(radius, ...h)
  if (size.some((n) => !Number.isFinite(n) || n <= 0) || r < 0) {
    throw new Error('Invalid box dimensions')
  }
  for (let axis = 0; axis < 3; axis++) {
    for (const sign of [-1, 1]) {
      const u = (axis + 1) % 3,
        v = (axis + 2) % 3,
        n = r ? segments * 2 + 1 : 1,
        base = m.positions.length / 3
      const coordinate = (i: number, half: number) => {
        if (i === 0) {
          return -half
        }
        if (i === n) {
          return half
        }
        if (!r) {
          return half
        }
        if (i <= segments) {
          return -half + (r * i) / segments
        }
        return half - r + (r * (i - segments - 1)) / segments
      }
      const axisSamples = (axis: number) =>
        [
          ...new Set([
            ...Array.from({ length: n + 1 }, (_, i) => coordinate(i, h[axis])),
            ...(samples[axis] ?? [])
          ])
        ]
          .filter((value) => value >= -h[axis] && value <= h[axis])
          .sort((a, b) => a - b)
      const us = axisSamples(u),
        vs = axisSamples(v)
      for (const vValue of vs) {
        for (const uValue of us) {
          const p: Vec = [0, 0, 0]
          p[axis] = sign * h[axis]
          p[u] = uValue
          p[v] = vValue
          const inner = p.map((x, k) =>
              Math.max(-h[k] + r, Math.min(h[k] - r, x))
            ),
            delta = unit(vec(p.map((x, k) => x - inner[k])))
          const q: Vec = r ? vec(inner.map((x, k) => x + delta[k] * r)) : p
          vertex(m, q, [(p[u] + h[u]) / size[u], (p[v] + h[v]) / size[v]])
        }
      }
      for (let j = 0; j < vs.length - 1; j++) {
        for (let i = 0; i < us.length - 1; i++) {
          const a = base + j * us.length + i,
            b = a + 1,
            c = a + us.length,
            d = c + 1
          m.indices.push(
            ...(sign > 0 ? [a, b, d, a, d, c] : [a, d, b, a, c, d])
          )
        }
      }
    }
  }
  return m
}
export function lathe(
  profile: readonly (readonly number[])[],
  segments = 24,
  smooth = false
): Mesh {
  const m = emptyMesh()
  if (smooth) {
    m.normals = latheNormals(profile, segments)
  }
  for (let j = 0; j < profile.length; j++) {
    for (let i = 0; i <= segments; i++) {
      const [r, z] = profile[j],
        a = (i / segments) * Math.PI * 2
      vertex(
        m,
        [r * Math.cos(a), r * Math.sin(a), z],
        [i / segments, j / (profile.length - 1)]
      )
    }
  }
  for (let j = 0; j < profile.length - 1; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i,
        b = a + 1,
        c = a + segments + 1,
        d = c + 1
      if (profile[j][0] > 0) {
        m.indices.push(a, b, d)
      }
      if (profile[j + 1][0] > 0) {
        m.indices.push(a, d, c)
      }
    }
  }
  return m
}
export function cylinder(
  radius: number,
  height: number,
  top = radius,
  segments = 24
): Mesh {
  return lathe(
    [
      [0, -height / 2],
      [radius, -height / 2],
      [top, height / 2],
      [0, height / 2]
    ],
    segments
  )
}
export function ellipsoid(radii: Vec, segments = 20, rings = 12): Mesh {
  const m = lathe(
    Array.from({ length: rings + 1 }, (_, i) => {
      const t = (i / rings) * Math.PI
      return [Math.sin(t), -Math.cos(t)]
    }),
    segments
  )
  for (let i = 0; i < m.positions.length; i++) {
    m.positions[i] *= radii[i % 3]
  }
  return m
}
export function loft(
  rings: readonly (readonly number[])[],
  segments = 24,
  cap = true
): Mesh {
  const m = emptyMesh()
  for (const [z, x, y, rx, ry] of rings) {
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      vertex(
        m,
        [x + rx * Math.cos(a), y + ry * Math.sin(a), z],
        [i / segments, z]
      )
    }
  }
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i,
        b = a + 1,
        c = a + segments + 1,
        d = c + 1
      m.indices.push(a, b, d, a, d, c)
    }
  }
  if (cap) {
    for (const [row, flip] of [
      [0, true],
      [rings.length - 1, false]
    ] as const) {
      const [z, x, y] = rings[row],
        center = vertex(m, [x, y, z])
      for (let i = 0; i < segments; i++) {
        const a = row * (segments + 1) + i
        m.indices.push(...(flip ? [center, a + 1, a] : [center, a, a + 1]))
      }
    }
  }
  return m
}
export function tube(
  points: readonly Vec[],
  radii: number | readonly number[],
  segments = 10
): Mesh {
  const m = emptyMesh()
  let previousU: Vec | undefined
  for (let j = 0; j < points.length; j++) {
    const t = unit(
      vec(
        points[Math.min(points.length - 1, j + 1)].map(
          (n, k) => n - points[Math.max(0, j - 1)][k]
        )
      )
    )
    const projected = previousU
      ? add(
          previousU,
          mul(
            t,
            -previousU.reduce((sum, value, axis) => sum + value * t[axis], 0)
          )
        )
      : undefined
    const u =
        projected && Math.hypot(...projected) > 1e-8
          ? unit(projected)
          : unit(cross(t, Math.abs(t[2]) > 0.9 ? [0, 1, 0] : [0, 0, 1])),
      v = cross(t, u),
      r = typeof radii === 'number' ? radii : radii[j]
    previousU = u
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      vertex(
        m,
        add(points[j], add(mul(u, Math.cos(a) * r), mul(v, Math.sin(a) * r))),
        [i / segments, j / points.length]
      )
    }
  }
  for (let j = 0; j < points.length - 1; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i,
        b = a + 1,
        c = a + segments + 1,
        d = c + 1
      m.indices.push(a, b, d, a, d, c)
    }
  }
  for (const [j, flip] of [
    [0, true],
    [points.length - 1, false]
  ] as const) {
    const c = vertex(m, points[j])
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i
      m.indices.push(...(flip ? [c, a + 1, a] : [c, a, a + 1]))
    }
  }
  return m
}
export const bezier = (points: readonly Vec[], steps = 16): Vec[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    let p = points.map(vec)
    while (p.length > 1) {
      p = p.slice(1).map((b, j) => add(mul(p[j], 1 - t), mul(b, t)))
    }
    return p[0]
  })
export function toSpatial(mesh: Mesh): SpatialShape {
  const p: number[] = []
  for (let i = 0; i < mesh.positions.length; i += 3) {
    p.push(mesh.positions[i], mesh.positions[i + 2], -mesh.positions[i + 1])
  }
  return readSpatialShape({
    kind: 'triangles',
    positions: p,
    ...(mesh.normals
      ? {
          normals: mesh.normals.flatMap((n, i, values) =>
            i % 3 === 0 ? [n, values[i + 2], -values[i + 1]] : []
          )
        }
      : {}),
    indices: mesh.indices,
    uvs: mesh.uvs
  })
}
export const renderPosition = (v: readonly number[]): SpatialVector => [
  v[0],
  v[2],
  -v[1]
]

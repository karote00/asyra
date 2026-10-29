import {
  append,
  cylinder,
  emptyMesh,
  loft,
  type Mesh,
  type Vec
} from './geometry'
import { part, type AssetPart } from './catalog'

export function loftRow(rows: readonly number[][], z: number): number[] {
  const i = Math.max(
    0,
    Math.min(
      rows.length - 2,
      rows.findIndex(
        (r, j) => j < rows.length - 1 && z >= r[0] && z <= rows[j + 1][0]
      )
    )
  )
  const a = rows[i],
    b = rows[i + 1],
    t = (z - a[0]) / (b[0] - a[0]),
    s = t * t * (3 - 2 * t)
  return a.map((v, k) => (k === 0 ? z : v + (b[k] - v) * s))
}
export function smoothRows(rows: readonly number[][]): number[][] {
  return rows.flatMap((a, i) =>
    i === rows.length - 1
      ? [a]
      : Array.from({ length: 4 }, (_, j) =>
          loftRow(rows, a[0] + ((rows[i + 1][0] - a[0]) * j) / 4)
        )
  )
}
function annulus(outer: number[][], inner: number[][]): Mesh {
  const mesh = loft(outer, 24, false),
    inside = loft(inner, 24, false),
    offset = mesh.positions.length / 3
  mesh.positions.push(...inside.positions)
  mesh.uvs.push(...inside.uvs)
  for (let i = 0; i < inside.indices.length; i += 3)
    mesh.indices.push(
      inside.indices[i] + offset,
      inside.indices[i + 2] + offset,
      inside.indices[i + 1] + offset
    )
  for (const row of [0, outer.length - 1])
    for (let i = 0; i < 24; i++) {
      const a = row * 25 + i,
        b = a + 1,
        c = a + offset,
        d = b + offset
      mesh.indices.push(
        ...(row === 0 ? [a, b, d, a, d, c] : [a, d, b, a, c, d])
      )
    }
  return mesh
}
interface Shirt {
  bodyOuterRings: number[][]
  sleeves: {
    id: string
    rings: number[][]
    cuffZRange: number[]
    cuffOffset: number
    cuffThickness: number
  }[]
  collar: {
    bandInnerRadii: number[]
    bandOuterRadii: number[]
    zRange: number[]
    frontFlaps: (
      | {
          id: string
          rootPhiDegrees: number[]
          rootZ: number
          freeEdge: number[][]
          wallThickness: number
          rootEmbed: number
        }
      | { id: string; mirrorOf: string; axis: string }
    )[]
  }
  buttons: null | {
    centresZ: number[]
    x: number
    radius: number
    depth: number
    defaultMaterial: string
  }
}
export function garmentDetails(
  shirt: Shirt,
  color: number,
  materials: Record<string, number>
): AssetPart[] {
  const c = shirt.collar,
    outer = c.zRange.map((z) => [z, 0, 0, ...c.bandOuterRadii]),
    inner = c.zRange.map((z) => [z, 0, 0, ...c.bandInnerRadii]),
    parts = [part('collar-band', annulus(outer, inner), color, 'fabric')]
  const source = c.frontFlaps[0]
  if (!('rootPhiDegrees' in source))
    throw new Error('Missing collar flap source')
  const flap = emptyMesh(),
    count = 12
  for (const offset of [-source.wallThickness / 2, source.wallThickness / 2])
    for (let i = 0; i <= count; i++) {
      const t = i / count,
        a =
          ((source.rootPhiDegrees[0] +
            t * (source.rootPhiDegrees[1] - source.rootPhiDegrees[0])) *
            Math.PI) /
          180
      const root: Vec = [
        (c.bandOuterRadii[0] - source.rootEmbed) * Math.sin(a),
        -(c.bandOuterRadii[1] - source.rootEmbed) * Math.cos(a),
        source.rootZ
      ]
      const free = source.freeEdge[0].map(
        (v, k) => v + (source.freeEdge[1][k] - v) * t
      )
      for (const p of [root, free]) {
        flap.positions.push(p[0], p[1] + offset, p[2])
        flap.uvs.push(t, p === root ? 0 : 1)
      }
    }
  const n = (count + 1) * 2
  for (let i = 0; i < count; i++) {
    const a = i * 2,
      b = a + 2
    flap.indices.push(
      a,
      b,
      b + 1,
      a,
      b + 1,
      a + 1,
      a + n,
      b + 1 + n,
      b + n,
      a + n,
      a + 1 + n,
      b + 1 + n
    )
    for (const side of [0, 1]) {
      const u = a + side,
        v = b + side
      flap.indices.push(u, u + n, v + n, u, v + n, v)
    }
  }
  for (const start of [0, count * 2])
    flap.indices.push(
      start,
      start + 1,
      start + 1 + n,
      start,
      start + 1 + n,
      start + n
    )
  parts.push(part('collar-flap-left', flap, color, 'fabric'))
  const mirrored = {
    positions: flap.positions.map((v, i) => (i % 3 === 0 ? -v : v)),
    uvs: [...flap.uvs],
    indices: [] as number[]
  }
  for (let i = 0; i < flap.indices.length; i += 3)
    mirrored.indices.push(
      flap.indices[i],
      flap.indices[i + 2],
      flap.indices[i + 1]
    )
  parts.push(part('collar-flap-right', mirrored, color, 'fabric'))
  for (const s of shirt.sleeves) {
    const rows = Array.from({ length: 5 }, (_, i) =>
      loftRow(
        s.rings,
        s.cuffZRange[0] + ((s.cuffZRange[1] - s.cuffZRange[0]) * i) / 4
      )
    )
    const inner = rows.map((r) =>
        r.map((v, k) => (k < 3 ? v : v + s.cuffOffset))
      ),
      outer = inner.map((r) =>
        r.map((v, k) => (k < 3 ? v : v + s.cuffThickness))
      )
    // The upper return meets the sleeve surface instead of hovering above it.
    inner[inner.length - 1] = rows[rows.length - 1]
    parts.push(
      part(
        s.id.replace('sleeve', 'cuff'),
        annulus(outer, inner),
        color,
        'fabric'
      )
    )
  }
  if (shirt.buttons)
    for (const [i, z] of shirt.buttons.centresZ.entries()) {
      const b = shirt.buttons,
        row = loftRow(shirt.bodyOuterRings, z),
        q = 1 - ((b.x - row[1]) / row[3]) ** 2
      if (q < 0) throw new Error('Button outside garment')
      const y = row[2] - row[4] * Math.sqrt(q),
        mesh = emptyMesh()
      append(
        mesh,
        cylinder(b.radius, b.depth + 0.0005, b.radius, 16),
        [b.x, y - (b.depth - 0.0005) / 2, z],
        [90, 0, 0]
      )
      parts.push(part(`shirt-button-${i}`, mesh, materials[b.defaultMaterial]))
    }
  return parts
}

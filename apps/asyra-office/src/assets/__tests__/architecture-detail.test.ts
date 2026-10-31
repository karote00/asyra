import { expect, it } from 'vitest'
import { catalogAsset } from '../catalog'
import { requiredSpecValue } from '../specification'
import { box, append, emptyMesh, type Mesh } from '../geometry'

function frontDepth(mesh: Mesh, x: number, z: number) {
  const hits: number[] = []
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = mesh.indices
      .slice(i, i + 3)
      .map((id) => mesh.positions.slice(id * 3, id * 3 + 3))
    const det = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2])
    if (Math.abs(det) < 1e-12) {
      continue
    }
    const u = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / det
    const v = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / det
    if (u >= -1e-9 && v >= -1e-9 && u + v <= 1 + 1e-9) {
      hits.push(u * a[1] + v * b[1] + (1 - u - v) * c[1])
    }
  }
  if (!hits.length) {
    throw new Error('Door ray misses mesh')
  }
  return Math.min(...hits)
}

it('cuts both declared door fields six millimetres into the actual front with sloped borders', () => {
  const parts = catalogAsset('entry-door-set')
  const mesh = requiredSpecValue(
    parts.find((p) => p.id === 'right-main-leaf'),
    'door leaf'
  ).mesh
  for (const z of [0.61, 1.49]) {
    expect(frontDepth(mesh, 0.306, z)).toBeCloseTo(-0.024, 8)
    expect(frontDepth(mesh, 0.306 - 0.275 + 0.003, z)).toBeCloseTo(-0.027, 8)
    expect(frontDepth(mesh, 0.306 - 0.29, z)).toBeCloseTo(-0.03, 8)
  }
  expect(frontDepth(mesh, 0.306, 1.06)).toBeCloseTo(-0.03, 8)
  const back = mesh.positions.filter((_, i) => i % 3 === 1)
  expect(Math.max(...back)).toBeCloseTo(0.03, 8)
  expect(parts).toHaveLength(8)
})

it('constructs four recessed panes and four exact mitred frame members', () => {
  const parts = catalogAsset('window-four-pane')
  expect(parts.filter((p) => p.id.startsWith('pane-'))).toHaveLength(4)
  const jamb = requiredSpecValue(
    parts.find((p) => p.id === 'jamb-right'),
    'jamb'
  )
  const positions = jamb.mesh.positions
  const innerTop = Array.from({ length: positions.length / 3 }, (_, i) =>
    positions.slice(i * 3, i * 3 + 3)
  ).filter(([x]) => Math.abs(x - 0.83) < 1e-9)
  expect(Math.max(...innerTop.map((p) => p[2]))).toBeCloseTo(1.2, 8)
  const pane = requiredSpecValue(
    parts.find((p) => p.id === 'pane-0-0'),
    'pane'
  )
  expect(frontDepth(pane.mesh, -0.43, 0.345)).toBeCloseTo(-0.004, 8)
  expect(frontDepth(jamb.mesh, 0.87, 0.64)).toBeCloseTo(-0.05, 8)
})

it('keeps flat frame faces from sharing a shading vertex across right-angle edges', () => {
  const mesh = catalogAsset('window-four-pane')[0].mesh
  const normals = new Map<number, number[][]>()
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const ids = mesh.indices.slice(i, i + 3),
      [a, b, c] = ids.map((id) => mesh.positions.slice(id * 3, id * 3 + 3))
    const u = b.map((v, k) => v - a[k]),
      v = c.map((v, k) => v - a[k])
    const normal = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
      ],
      l = Math.hypot(...normal)
    for (const id of ids) {
      normals.set(id, [...(normals.get(id) ?? []), normal.map((n) => n / l)])
    }
  }
  for (const list of normals.values()) {
    for (const normal of list) {
      expect(
        normal.reduce((sum, v, k) => sum + v * list[0][k], 0)
      ).toBeGreaterThan(0.999)
    }
  }
})
it('retains rounded appliance housing corners when subtracting the serving bay', () => {
  const mesh = requiredSpecValue(
    catalogAsset('coffee-machine').find((p) => p.id === 'housing'),
    'housing'
  ).mesh
  const corner = [0.1, 0.125, 0.29]
  const distances = Array.from({ length: mesh.positions.length / 3 }, (_, i) =>
    Math.hypot(
      ...mesh.positions.slice(i * 3, i * 3 + 3).map((v, k) => v - corner[k])
    )
  )
  expect(Math.min(...distances)).toBeGreaterThan(0.014)
})
it('keeps the appliance side skin intact away from the front cavity', () => {
  const housing = requiredSpecValue(
    catalogAsset('coffee-machine').find((p) => p.id === 'housing'),
    'housing'
  ).mesh
  const side = { ...housing, positions: [] as number[] }
  for (let i = 0; i < housing.positions.length; i += 3) {
    side.positions.push(
      housing.positions[i + 1],
      -housing.positions[i],
      housing.positions[i + 2]
    )
  }
  for (const y of [-0.08, -0.04, 0, 0.04, 0.08]) {
    for (const z of [0.05, 0.1, 0.15, 0.2, 0.26]) {
      expect(frontDepth(side, y, z), `${y},${z}`).toBeCloseTo(-0.1, 6)
    }
  }
})
it('does not leave overlapping or reversed faces on the flat appliance side', () => {
  const mesh = requiredSpecValue(
    catalogAsset('coffee-machine').find((p) => p.id === 'housing'),
    'housing'
  ).mesh
  let area = 0
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = mesh.indices
      .slice(i, i + 3)
      .map((id) => mesh.positions.slice(id * 3, id * 3 + 3))
    if (![a, b, c].every((p) => Math.abs(p[0] - 0.1) < 1e-9)) {
      continue
    }
    const cross = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1])
    expect(cross).toBeGreaterThan(-1e-12)
    area += cross / 2
  }
  expect(area).toBeCloseTo((0.25 - 0.044) * (0.28 - 0.044), 8)
})

it('preserves exterior winding and area after GPU float32 conversion', () => {
  const mesh = requiredSpecValue(
    catalogAsset('coffee-machine').find((p) => p.id === 'housing'),
    'housing'
  ).mesh
  let unstable = 0
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const points = mesh.indices
      .slice(i, i + 3)
      .map((id) => mesh.positions.slice(id * 3, id * 3 + 3))
    const normal = (p: number[][]) => {
      const u = p[1].map((v, k) => v - p[0][k]),
        v = p[2].map((v, k) => v - p[0][k])
      return [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
      ]
    }
    const exact = normal(points),
      gpu = normal(points.map((p) => p.map(Math.fround)))
    const dot = exact.reduce((s, v, k) => s + v * gpu[k], 0)
    if (dot <= 0 || Math.hypot(...gpu) < Math.hypot(...exact) * 0.5) {
      unstable++
    }
  }
  expect(unstable).toBe(0)
})

it('preserves every untouched rounded housing surface through subtraction', () => {
  const mesh = requiredSpecValue(
    catalogAsset('coffee-machine').find((p) => p.id === 'housing'),
    'housing'
  ).mesh
  const source = emptyMesh()
  append(source, box([0.2, 0.25, 0.28], 0.022), [0, 0, 0.15])
  const sub = (a: number[], b: number[]) => a.map((v, k) => v - b[k])
  const dot = (a: number[], b: number[]) =>
    a.reduce((s, v, k) => s + v * b[k], 0)
  const faces = []
  for (let i = 0; i < mesh.indices.length; i += 3) {
    faces.push(
      mesh.indices
        .slice(i, i + 3)
        .map((id) => mesh.positions.slice(id * 3, id * 3 + 3))
    )
  }
  const missing: number[][] = []
  for (let i = 0; i < source.indices.length; i += 3) {
    const points = source.indices
      .slice(i, i + 3)
      .map((id) => source.positions.slice(id * 3, id * 3 + 3))
    const p = points[0].map((_, k) => points.reduce((s, v) => s + v[k], 0) / 3)
    if (
      Math.abs(p[0]) < 0.072 &&
      p[1] < -0.032 &&
      p[2] > 0.023 &&
      p[2] < 0.207
    ) {
      continue
    }
    const found = faces.some(([a, b, c]) => {
      const u = sub(b, a),
        v = sub(c, a),
        w = sub(p, a),
        uu = dot(u, u),
        uv = dot(u, v),
        vv = dot(v, v),
        uw = dot(u, w),
        vw = dot(v, w),
        det = uu * vv - uv * uv
      if (Math.abs(det) < 1e-24) {
        return false
      }
      const s = (uw * vv - vw * uv) / det,
        t = (vw * uu - uw * uv) / det
      const d = Math.hypot(...w.map((q, k) => q - s * u[k] - t * v[k]))
      return d < 1e-7 && s >= -1e-7 && t >= -1e-7 && s + t <= 1 + 1e-7
    })
    if (!found) {
      missing.push(p)
    }
  }
  expect(missing).toEqual([])
})

it('keeps every preserved exterior triangle facing out of the rounded source', () => {
  const mesh = requiredSpecValue(
    catalogAsset('coffee-machine').find((p) => p.id === 'housing'),
    'housing'
  ).mesh
  const bad: number[][] = []
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = mesh.indices
      .slice(i, i + 3)
      .map((id) => mesh.positions.slice(id * 3, id * 3 + 3))
    const p = a.map((v, k) => (v + b[k] + c[k]) / 3),
      local = [p[0], p[1], p[2] - 0.15],
      h = [0.1, 0.125, 0.14],
      r = 0.022
    const d = local.map(
      (v, k) => v - Math.max(-h[k] + r, Math.min(h[k] - r, v))
    )
    if (Math.hypot(...d) < r - 0.004) {
      continue
    }
    const u = b.map((v, k) => v - a[k]),
      v = c.map((v, k) => v - a[k])
    const n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ]
    if (n.reduce((s, v, k) => s + v * d[k], 0) <= 0) {
      bad.push(p)
    }
  }
  expect(bad).toEqual([])
})

it('closes every rounded box edge before Boolean operations', () => {
  const mesh = box([0.2, 0.25, 0.28], 0.022),
    edges = new Map<string, number>()
  const key = (id: number) =>
    mesh.positions
      .slice(id * 3, id * 3 + 3)
      .map((v) => v.toFixed(9))
      .join(',')
  for (let i = 0; i < mesh.indices.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const k = [key(mesh.indices[i + j]), key(mesh.indices[i + ((j + 1) % 3)])]
        .sort()
        .join('|')
      edges.set(k, (edges.get(k) ?? 0) + 1)
    }
  }
  expect([...edges].filter(([, count]) => count !== 2)).toEqual([])
})

it('cuts sink door fields and six blind tray slots instead of overlaying dark markings', () => {
  const door = requiredSpecValue(
    catalogAsset('sink-cabinet').find((p) => p.id === 'door--1'),
    'door'
  ).mesh
  expect(frontDepth(door, -0.2175, 0.323)).toBeCloseTo(-0.244, 8)
  expect(frontDepth(door, -0.2175 + 0.195, 0.323)).toBeCloseTo(-0.248, 8)
  for (const [asset, z] of [
    ['coffee-machine', 0.032],
    // Original-crop revision: cabinet compressed from 0.79 m to 0.64 m.
    ['water-dispenser', (0.489 * 0.64) / 0.79]
  ] as const) {
    const tray = requiredSpecValue(
      catalogAsset(asset).find((p) => p.id === 'drip-tray'),
      'tray'
    ).mesh
    const top = { ...tray, positions: [] as number[] }
    for (let i = 0; i < tray.positions.length; i += 3) {
      top.positions.push(
        tray.positions[i],
        -tray.positions[i + 2],
        tray.positions[i + 1]
      )
    }
    for (const x of asset === 'coffee-machine'
      ? [-0.046, 0, 0.046]
      : [-0.067, 0, 0.067]) {
      for (const y of asset === 'coffee-machine'
        ? [-0.11, -0.075]
        : [-0.155, -0.123]) {
        expect(frontDepth(top, x, y)).toBeCloseTo(-(z - 0.002), 7)
      }
    }
  }
})
it('constructs all four bottle ribs from the owner photo profile', () => {
  const mesh = requiredSpecValue(
    catalogAsset('water-dispenser').find((p) => p.id === 'bottle'),
    'bottle'
  ).mesh
  for (const z of [0.812, 0.866, 1.024, 1.08]) {
    const radius = []
    for (let i = 0; i < mesh.positions.length; i += 3) {
      if (Math.abs(mesh.positions[i + 2] - z) < 1e-8) {
        radius.push(Math.hypot(mesh.positions[i], mesh.positions[i + 1]))
      }
    }
    expect(radius.length).toBeGreaterThanOrEqual(64)
    expect(Math.max(...radius)).toBeCloseTo(0.131, 8)
  }
})

it('emits a conforming closed housing after cutting instead of T-junction cracks', () => {
  const mesh = requiredSpecValue(
    catalogAsset('coffee-machine').find((p) => p.id === 'housing'),
    'housing'
  ).mesh
  const edges = new Map<string, number>()
  const key = (id: number) =>
    mesh.positions
      .slice(id * 3, id * 3 + 3)
      .map((v) => Math.round(v * 1e8))
      .join(',')
  for (let i = 0; i < mesh.indices.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const a = key(mesh.indices[i + j]),
        b = key(mesh.indices[i + ((j + 1) % 3)])
      if (a === b) {
        continue
      }
      const k = [a, b].sort().join('|')
      edges.set(k, (edges.get(k) ?? 0) + 1)
    }
  }
  expect([...edges.values()].filter((n) => n !== 2).length).toBe(0)
})

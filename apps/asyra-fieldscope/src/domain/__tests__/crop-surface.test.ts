import { expect, it } from 'vitest'
import { appendFruitSurface } from '../crop-fruit'
import { appendSurfaceHairs } from '../crop-hairs'
import { TriangleBuilder } from '../mesh'

it('gives cucumber skin longitudinal irregular relief rather than smooth uniform ribs', () => {
  const mesh = new TriangleBuilder()
  appendFruitSurface(mesh, [0, 0, 0], 0.22, 0.014, true, 0, false, 1, 0.5)
  const radii: number[] = []
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const [x, y, z] = mesh.positions.slice(i, i + 3)
    if (x <= 0 || Math.abs(z) > 1e-10 || Math.abs(y) > 0.055) continue
    const t = 0.5 - y / 0.22
    radii.push(x / Math.sin(Math.PI * t) ** 0.25)
  }
  expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(0.0007)
})

it('roots fine hairs on source triangles and emits both leaf sides without resampling hair triangles', () => {
  const mesh = new TriangleBuilder()
  mesh.positions.push(0, 0, 0, 1, 0, 0, 0, 1, 0)
  mesh.indices.push(0, 1, 2)
  const count = appendSurfaceHairs(mesh, 20, 0.001, true, [0.1, 0.2, 0.05])
  expect(count).toBe(10)
  expect(mesh.positions.length).toBe(9 + count * 12)
  expect(mesh.colors.length).toBe(mesh.positions.length)
  const sides = new Set<number>()
  for (let i = 9; i < mesh.positions.length; i += 12) {
    const x =
      (mesh.positions[i] + mesh.positions[i + 3] + mesh.positions[i + 6]) / 3
    const y =
      (mesh.positions[i + 1] + mesh.positions[i + 4] + mesh.positions[i + 7]) /
      3
    expect(x).toBeGreaterThan(0)
    expect(y).toBeGreaterThan(0)
    expect(x + y).toBeLessThan(1)
    expect(mesh.positions[i + 2]).toBe(0)
    const height = mesh.positions[i + 11]
    expect(Math.abs(height)).toBeGreaterThanOrEqual(0.00065)
    expect(Math.abs(height)).toBeLessThanOrEqual(0.001)
    sides.add(Math.sign(height))
  }
  expect(sides).toEqual(new Set([-1, 1]))
})

it('keeps surface hair UVs nondegenerate for normal-mapped shading', () => {
  const mesh = new TriangleBuilder()
  mesh.positions.push(0, 0, 0, 1, 0, 0, 0, 1, 0)
  mesh.indices.push(0, 1, 2)
  mesh.uvs.push(0, 0, 1, 0, 0, 1)
  appendSurfaceHairs(mesh, 20, 0.001, true, [0.1, 0.2, 0.05])
  for (let i = 3; i < mesh.indices.length; i += 3) {
    const [a, b, c] = mesh.indices
      .slice(i, i + 3)
      .map((index) => mesh.uvs.slice(index * 2, index * 2 + 2))
    const determinant =
      (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])
    expect(Math.abs(determinant)).toBeGreaterThan(1e-9)
  }
})

it('reports hair source triangle ownership without changing generated buffers', () => {
  const create = () => {
    const mesh = new TriangleBuilder()
    mesh.triangle([0, 0, 0], [1, 0, 0], [0, 1, 0])
    mesh.triangle([2, 0, 0], [3, 0, 0], [2, 1, 0])
    return mesh
  }
  const canonical = create(),
    observed = create()
  appendSurfaceHairs(canonical, 20, 0.001, true, [0.1, 0.2, 0.05])
  const spans: {
    sourceTriangle: number
    vertexStart: number
    vertexCount: number
    indexStart: number
    indexCount: number
  }[] = []
  appendSurfaceHairs(observed, 20, 0.001, true, [0.1, 0.2, 0.05], (span) =>
    spans.push(span)
  )
  expect(observed.shape()).toEqual(canonical.shape())
  expect(spans).toEqual([
    {
      sourceTriangle: 0,
      vertexStart: 6,
      vertexCount: 40,
      indexStart: 6,
      indexCount: 90
    },
    {
      sourceTriangle: 3,
      vertexStart: 46,
      vertexCount: 40,
      indexStart: 96,
      indexCount: 90
    }
  ])
})

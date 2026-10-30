import { expect, it } from 'vitest'
import { append, box, emptyMesh, lathe, toSpatial } from '../geometry'
import { subtractSolids } from '../solid-subtraction'
import { sugarJar } from '../discussion-tableware'
import { part } from '../catalog'
import { buildSpatialMeshes } from '../../scene/reference-scene'

it('preserves smooth radial normals through cutting without smoothing the slot planes', () => {
  const source = lathe(
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
      [0, 2]
    ],
    48,
    true
  )
  const cutter = emptyMesh()
  append(cutter, box([0.8, 0.4, 1]), [1, 0, 1.8])
  const result = subtractSolids(source, [cutter])
  expect(result.normals).toHaveLength(result.positions.length)
  if (!result.normals) {
    throw new Error('Missing cut normals')
  }
  let sideSamples = 0,
    cutSamples = 0
  for (let t = 0; t < result.triangleRegions.length; t++) {
    for (const id of result.indices.slice(t * 3, t * 3 + 3)) {
      const [x, y, z] = result.positions.slice(id * 3, id * 3 + 3)
      const n = result.normals.slice(id * 3, id * 3 + 3)
      expect(Math.hypot(...n)).toBeCloseTo(1, 6)
      if (result.triangleRegions[t] === 0 && Math.abs(z - 1) < 1e-7) {
        expect(n[0]).toBeCloseTo(x / Math.hypot(x, y), 4)
        expect(n[1]).toBeCloseTo(y / Math.hypot(x, y), 4)
        expect(n[2]).toBeCloseTo(0, 4)
        sideSamples++
      }
      if (result.triangleRegions[t] === 1) {
        expect(Math.max(...n.map(Math.abs))).toBeCloseTo(1, 6)
        cutSamples++
      }
    }
  }
  expect(sideSamples).toBeGreaterThan(30)
  expect(cutSamples).toBeGreaterThan(0)
})

it('transforms authored normals with inverse scale and retains them through both batch passes', () => {
  const source = lathe(
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
      [0, 2]
    ],
    24,
    true
  )
  expect(source.normals).toHaveLength(source.positions.length)
  if (!source.normals) {
    throw new Error('Missing source normals')
  }
  const transformed = emptyMesh()
  append(transformed, source, [3, 4, 5], [30, 20, 10], [2, 3, 4])
  if (!transformed.normals) {
    throw new Error('Missing transformed normals')
  }
  for (let i = 0; i < source.positions.length; i += 3) {
    const n = source.normals.slice(i, i + 3)
    const basis = emptyMesh()
    append(
      basis,
      { positions: n.map((v, k) => v / [2, 3, 4][k]), indices: [], uvs: [] },
      [0, 0, 0],
      [30, 20, 10]
    )
    const length = Math.hypot(...basis.positions)
    for (let k = 0; k < 3; k++) {
      expect(transformed.normals[i + k]).toBeCloseTo(
        basis.positions[k] / length,
        7
      )
    }
  }
  const plain = box([1, 1, 1])
  const meshes = buildSpatialMeshes(
    {
      parts: [
        part('plain', plain, 0xffffff, 'plain'),
        part('smooth', transformed, 0xffffff, 'plain'),
        part('other', source, 0xdddddd, 'plain')
      ],
      assemblies: [],
      labels: []
    },
    {}
  )
  const expected = toSpatial(transformed)
  if (expected.kind !== 'triangles') {
    throw new Error('Expected triangles')
  }
  expect(meshes).toHaveLength(1)
  const shape = meshes[0].descriptor.shape
  if (shape.kind !== 'triangles') {
    throw new Error('Expected triangles')
  }
  expect(shape.normals).toHaveLength(shape.positions.length)
  if (!shape.normals || !expected.normals) {
    throw new Error('Missing batch normals')
  }
  const actual = shape.normals.slice(
    plain.positions.length,
    plain.positions.length + transformed.positions.length
  )
  for (let i = 0; i < actual.length; i++) {
    expect(actual[i]).toBeCloseTo(expected.normals[i], 12)
  }
})

it('authors continuous sugar body and lid normals including the leaning transform', () => {
  const asset = sugarJar()
  for (const name of ['vessel', 'lid']) {
    const mesh = asset.find((p) => p.id === name)?.mesh
    expect(mesh, name).toBeDefined()
    if (!mesh || !mesh.normals) {
      throw new Error('Missing sugar normals: ' + name)
    }
    expect(mesh.normals, name).toHaveLength(mesh.positions.length)
    for (let i = 0; i < mesh.positions.length; i += 3) {
      expect(Math.hypot(...mesh.normals.slice(i, i + 3))).toBeCloseTo(1, 6)
    }
  }
})

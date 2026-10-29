import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import { leaf, tree } from '../vegetation'
import { planter } from '../plants'
import { useReferenceSceneFixture } from '../../scene/__tests__/fixtures/reference-scene'
const referenceSceneFixture = useReferenceSceneFixture()

it('publishes the catalog canopy without scene-specific density or size multipliers', () => {
  const scene = referenceSceneFixture()
  let offset = 0
  const leaves = scene.assemblies.flatMap((assembly) => {
    const parts = scene.parts.slice(offset, offset + assembly.parts.length)
    offset += assembly.parts.length
    return /^tree-[0-5]$/.test(assembly.id)
      ? parts.filter((part) => part.instances)
      : []
  })
  expect(
    scene.assemblies.filter((a) => /^tree-[0-5]$/.test(a.id))
  ).toHaveLength(6)
  expect(leaves.flatMap((p) => p.instances ?? [])).toHaveLength(6 * 3264)
  for (const instance of leaves.flatMap((p) => p.instances ?? []))
    expect(instance.scale).toBeLessThanOrEqual(2.2)
})

it('retains deterministic palette assignments within the declared tree envelope', () => {
  const parts = tree().filter((p) => p.instances)
  expect(parts.map((p) => p.instances)).toEqual(
    tree()
      .filter((p) => p.instances)
      .map((p) => p.instances)
  )
  expect(parts.map((p) => p.roughness)).toEqual([0.9, 0.9, 0.9])
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]
  for (const part of parts)
    for (const item of part.instances ?? [])
      for (let vertex = 0; vertex < part.mesh.positions.length / 3; vertex++) {
        const i = vertex * 3
        for (let k = 0; k < 3; k++) {
          const p =
            item.position[k] +
            item.scale *
              item.basis.reduce(
                (sum, axis, j) => sum + axis[k] * part.mesh.positions[i + j],
                0
              )
          min[k] = Math.min(min[k], p)
          max[k] = Math.max(max[k], p)
        }
      }
  for (let axis = 0; axis < 3; axis++) {
    expect(min[axis]).toBeGreaterThanOrEqual([-1.5, -1.5, 0][axis])
    expect(max[axis]).toBeLessThanOrEqual([1.5, 1.5, 3.55][axis])
  }
})

it('maps the leaf rim by physical perimeter distance rather than vertex index', () => {
  const mesh = leaf()
  const start = 130,
    lengths = [0]
  for (let i = 1; i <= 32; i++) {
    const a = (start + (i - 1) * 2) * 3,
      b = (start + i * 2) * 3
    lengths.push(
      lengths[i - 1] +
        Math.hypot(
          ...[0, 1, 2].map((k) => mesh.positions[b + k] - mesh.positions[a + k])
        )
    )
  }
  for (let i = 0; i <= 32; i++)
    expect(mesh.uvs[(start + i * 2) * 2]).toBeCloseTo(
      lengths[i] / lengths[32],
      8
    )
})

it('uses the specified plant stem radii and all declared construction materials', () => {
  const parts = planter(),
    stem = requiredSpecValue(
      parts.find((p) => p.id === 'stem'),
      'stem'
    )
  const radii = []
  for (let i = 0; i < stem.mesh.positions.length; i += 3)
    if (Math.abs(stem.mesh.positions[i + 2] - 0.29) < 1e-8)
      radii.push(Math.hypot(stem.mesh.positions[i], stem.mesh.positions[i + 1]))
  expect(Math.max(...radii)).toBeCloseTo(0.002, 8)
  expect(parts.every((p) => p.roughness === 0.95)).toBe(true)
  const soil = requiredSpecValue(
    parts.find((p) => p.id === 'soil'),
    'soil'
  )
  const bottom = []
  for (let i = 0; i < soil.mesh.positions.length; i += 3)
    if (Math.abs(soil.mesh.positions[i + 2] - 0.085) < 1e-8)
      bottom.push(
        Math.hypot(soil.mesh.positions[i], soil.mesh.positions[i + 1])
      )
  // Inner cavity: linear R=.044 at Z=.015 to R=.060 at Z=.100.
  expect(Math.max(...bottom)).toBeCloseTo(
    0.044 + ((0.085 - 0.015) / (0.1 - 0.015)) * (0.06 - 0.044),
    8
  )
})

it('retains the plant cavity, 96 radial samples, welded axis and bounded rim rounding', () => {
  const pot = requiredSpecValue(
    planter().find((p) => p.id === 'pot'),
    'pot'
  ).mesh
  const positions = Array.from({ length: pot.positions.length / 3 }, (_, i) =>
    pot.positions.slice(i * 3, i * 3 + 3)
  )
  const angles = new Set(
    positions
      .filter(([x, y]) => Math.hypot(x, y) > 1e-6)
      .map(([x, y]) =>
        Math.round(((Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2)) * 1e6)
      )
  )
  expect(angles.size).toBe(96)
  expect(positions.filter(([x, y]) => Math.hypot(x, y) < 1e-8)).toHaveLength(2)
  expect(Math.max(...positions.map(([x, y]) => Math.hypot(x, y)))).toBeCloseTo(
    0.07,
    6
  )
  expect(Math.max(...positions.map((p) => p[2]))).toBeGreaterThan(0.1192)
  expect(new Set(positions.map((p) => p[2])).size).toBeGreaterThan(14)
})

it('resolves the approved rounded leaf outline within half a millimetre', async () => {
  const { default: spec } =
    await import('../../../../../assets/asyra-office/models/street/tree-construction-spec.json')
  const { bezier } = await import('../geometry')
  const mesh = leaf()
  const boundary = []
  for (let i = 0; i < mesh.positions.length; i += 3)
    if (Math.abs(mesh.positions[i + 2]) < 1e-10)
      boundary.push(mesh.positions.slice(i, i + 2))
  const unique = [...new Map(boundary.map((p) => [p.join(','), p])).values()]
  // Sort the rim around its interior centre; compare independent dense curve samples.
  unique.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]))
  let error = 0
  for (const arc of spec.leaf.outlineCubicBezierCCW)
    for (const p of bezier(
      arc.map(([x, y]) => [x, y, 0]),
      128
    )) {
      const distance = Math.min(
        ...unique.map((a, i) => {
          const b = unique[(i + 1) % unique.length],
            dx = b[0] - a[0],
            dy = b[1] - a[1]
          const t = Math.max(
            0,
            Math.min(
              1,
              ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
            )
          )
          return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
        })
      )
      error = Math.max(error, distance)
    }
  expect(error).toBeLessThan(0.0005)
})

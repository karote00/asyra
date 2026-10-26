import { expect, it } from 'vitest'
import { createReferenceScene } from '../../scene/reference-scene'
it('uses independent cover and frame parts instead of tubes painted over the street', () => {
  const scene = createReferenceScene()
  const assembly = scene.assemblies.find((a) => a.id === 'manhole')
  expect(assembly?.parts).toEqual(['frame', 'cover'])
  expect(scene.assemblies.some((a) => a.id.startsWith('cover-ring-'))).toBe(
    false
  )
})
it('preserves the four millimetre removable cover gap and nondegenerate radial relief', async () => {
  const { manhole } = await import('../manhole')
  const [frame, cover] = manhole()
  const points = (mesh: typeof cover.mesh) =>
    Array.from({ length: mesh.positions.length / 3 }, (_, i) =>
      mesh.positions.slice(i * 3, i * 3 + 3)
    )
  expect(
    Math.min(...points(frame.mesh).map((p) => Math.hypot(p[0], p[1]))) -
      Math.max(...points(cover.mesh).map((p) => Math.hypot(p[0], p[1])))
  ).toBeCloseTo(0.004, 8)
  const p = points(cover.mesh)
  for (let i = 0; i < cover.mesh.indices.length; i += 3) {
    const [a, b, c] = cover.mesh.indices.slice(i, i + 3).map((id) => p[id]),
      u = b.map((v, k) => v - a[k]),
      v = c.map((v, k) => v - a[k])
    expect(
      Math.hypot(
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
      )
    ).toBeGreaterThan(1e-13)
  }
})

import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import { box } from '../geometry'
import { lantern } from '../furnishings'
it('keeps primitive UVs inside the available texture instead of stretching clamped edge pixels', () => {
  const mesh = box([5, 4, 2], 0.01)
  expect(Math.min(...mesh.uvs)).toBeGreaterThanOrEqual(0)
  expect(Math.max(...mesh.uvs)).toBeLessThanOrEqual(1)
})
it('constructs the lantern at the approved 2.74 m height and 0.53 m roof width', () => {
  const parts = lantern()
  const positions = parts.flatMap((p) => p.mesh.positions)
  const axis = (a: number) => positions.filter((_, i) => i % 3 === a)
  expect(Math.min(...axis(2))).toBeCloseTo(0, 6)
  expect(Math.max(...axis(2))).toBeCloseTo(2.74, 6)
  expect(Math.max(...axis(0)) - Math.min(...axis(0))).toBeCloseTo(0.53, 6)
})
it('seats both puppet profiles on the supplied seat datum with feet forward and independent geometry', async () => {
  const { puppet } = await import('../puppets')
  for (const profile of ['man', 'woman'] as const) {
    const standing = puppet(profile),
      seated = puppet(profile, undefined, undefined, 0.4)
    const pelvis = requiredSpecValue(
      seated.find((p) => p.id === 'trousers-pelvis'),
      "seated.find((p) => p.id === 'trousers-pelvis')"
    ).mesh.positions
    expect(Math.min(...pelvis.filter((_, i) => i % 3 === 2))).toBeCloseTo(
      0.4,
      6
    )
    const foot = (parts: typeof seated) =>
      requiredSpecValue(
        parts.find((p) => p.id === 'foot-left'),
        "parts\n        .find((p) => p.id === 'foot-left')"
      ).mesh.positions.filter((_, i) => i % 3 === 1)
    expect(Math.min(...foot(seated))).toBeLessThan(
      Math.min(...foot(standing)) - 0.05
    )
  }
})
it('fits the entire eye patch to the curved head instead of burying its upper edge', async () => {
  const { puppet } = await import('../puppets')
  const { default: spec } =
    await import('../../../../../assets/asyra-office/models/people/man-puppet-model-spec.json')
  const head = spec.defaultDimensions,
    eye = requiredSpecValue(
      puppet('man').find((p) => p.id === 'eye-left'),
      "puppet('man').find((p) => p.id === 'eye-left')"
    ).mesh.positions
  let top = 0
  for (let i = 0; i < eye.length; i += 3) if (eye[i + 2] > eye[top + 2]) top = i
  const x = eye[top],
    z = eye[top + 2],
    surface =
      (-head.skinHeadSize[1] / 2) *
      Math.sqrt(
        1 -
          (x / (head.skinHeadSize[0] / 2)) ** 2 -
          ((z - head.skinHeadCentre[2]) / (head.skinHeadSize[2] / 2)) ** 2
      )
  expect(eye[top + 1]).toBeLessThanOrEqual(surface - 0.0009)
})
it('closes each tapered fringe at one tip rather than a full-depth blade', async () => {
  const { puppet } = await import('../puppets')
  const fringe = requiredSpecValue(
    puppet('man').find((p) => p.id === 'fringe-middle'),
    'fringe-middle'
  )
  const tail = fringe.mesh.positions.slice(-27)
  for (let axis = 0; axis < 3; axis++) {
    const values = tail.filter((_, i) => i % 3 === axis)
    expect(Math.max(...values) - Math.min(...values)).toBeLessThan(1e-8)
  }
})
it('retains smooth shirt sections and both connected glasses temples', async () => {
  const { puppet } = await import('../puppets')
  const parts = puppet('man')
  expect(parts.filter((p) => p.id.startsWith('eyewear-temple-'))).toHaveLength(
    2
  )
  const shirt = requiredSpecValue(
    parts.find((p) => p.id === 'shirt'),
    'shirt'
  ).mesh.positions
  expect(
    shirt.some(
      (v, i) =>
        i % 3 === 2 && Math.abs(v - (0.433 + (0.504 - 0.433) / 4)) < 1e-10
    )
  ).toBe(true)
})
it('retains garment collar, cuffs and source-specific buttons as replaceable regions', async () => {
  const { puppet } = await import('../puppets')
  const man = puppet('man').map((p) => p.id),
    woman = puppet('woman').map((p) => p.id)
  for (const ids of [man, woman])
    for (const id of [
      'collar-band',
      'collar-flap-left',
      'collar-flap-right',
      'cuff-left',
      'cuff-right'
    ])
      expect(ids).toContain(id)
  expect(man.filter((id) => id.startsWith('shirt-button-'))).toHaveLength(2)
  expect(woman.filter((id) => id.startsWith('shirt-button-'))).toHaveLength(0)
})

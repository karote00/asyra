import { expect, it } from 'vitest'
import { createLayout, SITE } from '../greenhouse'
import { SUPPORT_LAYOUT, createSupportPositions } from '../planting-supports'

it('places 1992 tube centrelines 15cm into the soil on both sides of all twelve drains', () => {
  const supports = createSupportPositions()
  const drains = createLayout().strips.filter((strip) => strip.kind === 'drain')
  expect(SUPPORT_LAYOUT.diameter).toBe(0.02)
  expect(supports).toHaveLength(1992)
  expect(new Set(supports.map((support) => support.x)).size).toBe(24)
  for (const [row, drain] of drains.entries())
    for (const side of ['left', 'right'] as const) {
      const line = supports.filter(
        (support) => support.row === row && support.side === side
      )
      expect(line).toHaveLength(83)
      expect(line[0].z).toBeCloseTo(0.25)
      expect(line.at(-1)?.z).toBeCloseTo(49.45)
      expect(SITE.length - (line.at(-1)?.z ?? 0)).toBeCloseTo(0.55)
      line.forEach((support, index) => {
        expect(support.bay).toBe(drain.bay)
        const inset =
          side === 'left'
            ? drain.x - support.x
            : support.x - (drain.x + drain.width)
        expect(inset).toBeCloseTo(0.15)
        if (index > 0) expect(support.z - line[index - 1].z).toBeCloseTo(0.6)
        const soil = createLayout().strips.find(
          (strip) =>
            strip.kind === 'soil' &&
            support.x > strip.x &&
            support.x < strip.x + strip.width
        )
        expect(soil).toBeDefined()
        expect(support.x - SUPPORT_LAYOUT.diameter / 2).toBeGreaterThan(
          soil?.x ?? Infinity
        )
        expect(support.x + SUPPORT_LAYOUT.diameter / 2).toBeLessThan(
          (soil?.x ?? 0) + (soil?.width ?? 0)
        )
      })
    }
})

it('uses the supplied above-ground height and burial depth without changing placement', async () => {
  const { createSupportTubes } = await import('../planting-supports')
  // Explicit test dimensions; the product dimensions are chosen separately.
  const tubes = createSupportTubes(1.8, 0.3)
  expect(tubes).toHaveLength(1992)
  tubes.forEach((tube) => {
    expect(tube.points[0]).toEqual([tube.x, -0.3, tube.z])
    expect(tube.points[1]).toEqual([tube.x, 1.8, tube.z])
    expect(tube.diameter).toBe(0.02)
  })
  expect(() => createSupportTubes(0, 0.3)).toThrow()
  expect(() => createSupportTubes(2, Number.NaN)).toThrow()
})

it('connects buried uprights to all transverse beams through tangent longitudinal rails', async () => {
  const { createSupportAssembly, springClipWire, supportJointTarget } =
    await import('../planting-supports')
  const { tubes, rails, clips } = createSupportAssembly()
  expect(tubes).toHaveLength(1992)
  expect(rails).toHaveLength(24)
  expect(clips).toHaveLength(2256)
  for (const tube of tubes) {
    expect(tube.points[0][1]).toBe(-0.15)
    expect(tube.points[1][1]).toBe(3)
    const rail = rails.find(
      (candidate) =>
        candidate.bay === tube.bay &&
        Math.abs(Math.abs(candidate.points[0][0] - tube.x) - 0.02) < 1e-9
    )
    expect(rail).toBeDefined()
    if (!rail) throw new Error('Missing support rail')
    expect(rail.points[0][1] + rail.diameter / 2).toBeCloseTo(
      SITE.eave - SITE.tubeDiameter / 2
    )
  }
  expect(
    clips.filter((clip) => clip.secondDiameter === SITE.tubeDiameter)
  ).toHaveLength(264)
  expect(supportJointTarget()[2]).toBe(0.25)
  // Every wire centreline stays outside both crossed cylinders, including connecting segments.
  for (const clip of [clips[0], clips[83], clips[1992]]) {
    const wire = springClipWire(clip)
    expect(wire.diameter).toBe(0.0025)
    const dot = (p: readonly number[], axis: readonly number[]) =>
      p.reduce((sum, value, i) => sum + value * axis[i], 0)
    for (let i = 1; i < wire.points.length; i++) {
      for (let step = 0; step <= 10; step++) {
        const p = wire.points[i].map(
          (value, k) =>
            wire.points[i - 1][k] +
            ((value - wire.points[i - 1][k]) * step) / 10 -
            clip.origin[k]
        )
        const u = dot(p, clip.firstAxis),
          v = dot(p, clip.secondAxis),
          w = dot(p, clip.normal)
        expect(Math.hypot(v, w)).toBeGreaterThanOrEqual(
          clip.firstDiameter / 2 - 1e-8
        )
        expect(
          Math.hypot(u, w - (clip.firstDiameter + clip.secondDiameter) / 2)
        ).toBeGreaterThanOrEqual(clip.secondDiameter / 2 - 1e-8)
      }
    }
  }
})

it('locks the second pipe at both ends while both arms bear on the opposite side of the first pipe', async () => {
  const { createSupportAssembly, springClipWire } =
    await import('../planting-supports')
  const clips = createSupportAssembly().clips
  for (const clip of [clips[0], clips[83], clips[1992]]) {
    const wire = springClipWire(clip)
    const local = wire.points.map((point) => {
      const delta = point.map((value, i) => value - clip.origin[i])
      const dot = (axis: readonly number[]) =>
        delta.reduce((sum, value, i) => sum + value * axis[i], 0)
      return [dot(clip.firstAxis), dot(clip.secondAxis), dot(clip.normal)]
    })
    const separation = (clip.firstDiameter + clip.secondDiameter) / 2
    // Both free tips hook the second pipe on the same axial side, beyond its far surface.
    for (const tip of [local[0], local[local.length - 1]]) {
      expect(tip[1]).toBeGreaterThan(clip.firstDiameter / 2)
      expect(tip[2]).toBeGreaterThan(separation + clip.secondDiameter / 3)
    }
    // The continuous U bight captures that same pipe on the other axial side.
    expect(
      local.some(
        (p) =>
          p[1] < -clip.firstDiameter / 2 &&
          p[2] > separation + clip.secondDiameter / 3
      )
    ).toBe(true)
    // Both parallel arms bear behind the first pipe instead of putting the hooks around it.
    for (const side of [-1, 1])
      expect(
        local.some(
          (p) =>
            p[0] * side > 0 &&
            Math.abs(p[1]) < 1e-8 &&
            p[2] < -clip.firstDiameter / 2
        )
      ).toBe(true)
  }
})

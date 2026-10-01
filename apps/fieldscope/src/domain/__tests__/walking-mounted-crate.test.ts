import { describe, expect, it } from 'vitest'
import { createRobotModel } from '../robot-model'
import { DEFAULT_ROBOT } from '../robot-configuration'
import { createSyntheticWalkingRobotDefinition } from '../walking-robot-definition'
import { WalkingRobotSourceOwner } from '../walking-robot-source'
import { WalkingMountedCrateOwner } from '../walking-mounted-crate'
import { dyadic } from '../scalar-arithmetic'

const evidence = (id: string) => ({
  kind: 'synthetic' as const,
  id,
  label: id + ' - synthetic assumption'
})
const request = () => ({
  format: 'walking-mounted-crate-request/1' as const,
  dimensions: {
    width: DEFAULT_ROBOT.width,
    length: DEFAULT_ROBOT.length,
    height: DEFAULT_ROBOT.height
  },
  minimumClearance: { metres: 0.003125, evidence: evidence('mount-clearance') },
  retention: evidence('mechanically-retained-partial-contact'),
  massIdentity: 'synthetic-empty-crate-mass'
})
const fixture = () => {
  const sourceOwner = new WalkingRobotSourceOwner()
  const source = sourceOwner.prepare(
    createSyntheticWalkingRobotDefinition({
      definitionId: 'mounted-crate-source',
      sourceProfile: 'solid-articulation/2'
    })
  )
  return {
    sourceOwner,
    source,
    owner: new WalkingMountedCrateOwner(sourceOwner)
  }
}
function fraction(value: ReturnType<typeof dyadic>) {
  return value.exponent >= 0
    ? [value.significand << BigInt(value.exponent), 1n]
    : [value.significand, 1n << BigInt(-value.exponent)]
}
function compare(a: ReturnType<typeof dyadic>, b: ReturnType<typeof dyadic>) {
  const [an, ad] = fraction(a),
    [bn, bd] = fraction(b)
  const d = an * bd - bn * ad
  if (d < 0n) return -1
  return d > 0n ? 1 : 0
}
describe('canonical mounted crate source', () => {
  it('publishes all original crate solids and exact partial contact without admitting W3 or W4', () => {
    const { owner, source } = fixture()
    const product = owner.prepare(source, request())
    expect(product.format).toBe('walking-mounted-crate/1')
    expect(product.geometry.parts.map((p) => p.id)).toEqual(
      createRobotModel(DEFAULT_ROBOT)
        .filter((p) => p.id.startsWith('crate-'))
        .map((p) => p.id)
    )
    expect(product.geometry.parts).toHaveLength(11)
    const cavity = product.geometry.cavity
    expect(cavity.upwardOpen).toBe(true)
    for (let axis = 0; axis < 3; axis++)
      expect(compare(cavity.min[axis], cavity.max[axis])).toBe(-1)
    const originals = createRobotModel(DEFAULT_ROBOT)
    for (const part of product.geometry.parts) {
      const original = originals.find((p) => p.id === part.id)
      if (!original) throw new Error('Missing original crate part')
      expect(part.shape).toEqual(original.shape)
      expect(part.regions).toEqual(original.regions)
      const coordinates = [0, 1, 2].map((axis) =>
        original.shape.positions.filter((_, index) => index % 3 === axis)
      )
      const low = coordinates.map((values) => dyadic(Math.min(...values)))
      const high = coordinates.map((values) => dyadic(Math.max(...values)))
      expect(
        compare(high[1], cavity.min[1]) <= 0 ||
          compare(high[0], cavity.min[0]) <= 0 ||
          compare(low[0], cavity.max[0]) >= 0 ||
          compare(high[2], cavity.min[2]) <= 0 ||
          compare(low[2], cavity.max[2]) >= 0
      ).toBe(true)
    }
    expect(product.geometry.bottomPatch.ranges).toEqual([
      { indexStart: 30, indexCount: 6 }
    ])
    expect(product.trayPatch.ranges).toEqual([
      { indexStart: 24, indexCount: 6 }
    ])
    expect(product.source).toBe(source)
    expect(product.base).toBe(source.rig.bodies.find((b) => b.id === 'base'))
    expect(product.tray.patches.includes(product.trayPatch)).toBe(true)
    expect(product.contact.area.significand > 0n).toBe(true)
    expect(product.contact.partial).toBe(true)
    expect(compare(product.bounds.min[2], product.railOuterZ)).toBe(1)
    expect(product.request.retention.kind).toBe('synthetic')
    expect(product.massIdentity).toBe('synthetic-empty-crate-mass')
    expect(Object.isFrozen(product.geometry.parts[0].shape.positions)).toBe(
      true
    )
    expect(owner.read(source, product)).toBe(product)
    expect(owner.read(source, { ...product })).toBeUndefined()
  })
  it('does not rebuild crate geometry for tool-only differences, a new source, or a new mount gap', () => {
    const { owner, source, sourceOwner } = fixture()
    const crates = (tool: 'cucumber' | 'tomato') =>
      createRobotModel({ ...DEFAULT_ROBOT, tool }).filter((p) =>
        p.id.startsWith('crate-')
      )
    expect(crates('cucumber')).toEqual(crates('tomato'))
    const first = owner.prepare(source, request())
    const baseline = { ...owner.work }
    expect(owner.prepare(source, first.request)).toBe(first)
    expect(owner.work).toEqual(baseline)
    const gap = owner.prepare(source, {
      ...request(),
      minimumClearance: {
        metres: 0.004,
        evidence: evidence('different-clearance')
      }
    })
    expect(gap.geometry).toBe(first.geometry)
    expect(owner.read(source, first)).toBeUndefined()
    const next = sourceOwner.prepare(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'replacement-mounted-source',
        sourceProfile: 'solid-articulation/2'
      })
    )
    expect(owner.read(source, gap)).toBeUndefined()
    const replacement = owner.prepare(next, gap.request)
    expect(replacement.geometry).toBe(first.geometry)
    expect(owner.work.geometryBuilds).toBe(1)
    expect(owner.work.mountBuilds).toBe(3)
    const resized = owner.prepare(next, {
      ...request(),
      dimensions: { ...request().dimensions, width: 0.54 }
    })
    expect(resized.geometry).not.toBe(first.geometry)
    expect(owner.work.geometryBuilds).toBe(2)
  })
  it('rejects unsupported source, foreign product, incomplete input and nonpositive or nonfinite clearance', () => {
    const { owner, source, sourceOwner } = fixture()
    const first = owner.prepare(source, request())
    expect(
      new WalkingMountedCrateOwner(sourceOwner).read(source, first)
    ).toBeUndefined()
    expect(() => owner.prepare({ ...source }, request())).toThrow()
    expect(() => owner.prepare(source, first)).toThrow()
    for (const metres of [0, -0.01, Infinity, NaN])
      expect(() =>
        owner.prepare(source, {
          ...request(),
          minimumClearance: { metres, evidence: evidence('invalid') }
        })
      ).toThrow()
    expect(() =>
      owner.prepare(source, { ...request(), sourceParts: [] })
    ).toThrow()
    expect(() =>
      owner.prepare(source, { ...request(), retention: undefined })
    ).toThrow()
    const legacy = sourceOwner.prepare(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'legacy-crate-source',
        sourceProfile: 'solid-articulation/1'
      })
    )
    expect(() => owner.prepare(legacy, request())).toThrow()
    expect(owner.read(source, first)).toBeUndefined()
  })
  it.each(['width', 'length', 'height'] as const)(
    'rejects %s that closes the actual original-material cavity',
    (dimension) => {
      const { owner, source } = fixture()
      const prior = owner.prepare(source, request())
      expect(() =>
        owner.prepare(source, {
          ...request(),
          dimensions: { ...request().dimensions, [dimension]: 0.01 }
        })
      ).toThrow()
      expect(owner.read(source, prior)).toBeUndefined()
    }
  )
  it('detaches mutable inputs and retires handles on failed replacement and clear', () => {
    const { owner, source } = fixture(),
      raw = request()
    const first = owner.prepare(source, raw)
    raw.minimumClearance.metres = 0.1
    raw.dimensions.width = 0.9
    expect(first.request.minimumClearance.metres).toBe(0.003125)
    expect(first.request.dimensions.width).toBe(DEFAULT_ROBOT.width)
    expect(() => owner.prepare(source, { ...raw, massIdentity: '' })).toThrow()
    expect(owner.read(source, first)).toBeUndefined()
    const second = owner.prepare(source, request())
    owner.clear()
    expect(owner.read(source, second)).toBeUndefined()
  })
})

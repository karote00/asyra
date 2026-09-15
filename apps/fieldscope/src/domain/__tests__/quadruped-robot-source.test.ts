import { describe, expect, it } from 'vitest'
import { createSyntheticQuadrupedRobotDefinition } from '../quadruped-robot-definition'
import { createSyntheticWalkingRobotDefinition } from '../walking-robot-definition'
import { createSyntheticBasketInput } from '../basket-interface'
import { QuadrupedRobotSourceOwner } from '../quadruped-robot-source'

describe('quadruped canonical material and definition lifetime', () => {
  it('issues four complete leg chains and four root-pitch arm chains from original closed material', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const definition = createSyntheticQuadrupedRobotDefinition()
    const source = owner.prepare(definition)
    expect(source.definition).toBe(definition)
    expect(source.rig.armChains.map((chain) => chain.id).sort()).toEqual([
      'left-cutter',
      'left-holder',
      'right-cutter',
      'right-holder'
    ])
    expect(source.rig.legChains.map((chain) => chain.id).sort()).toEqual([
      'left-front',
      'left-rear',
      'right-front',
      'right-rear'
    ])
    expect(new Set(source.parts.map((part) => part.id)).size).toBe(
      source.parts.length
    )
    expect(source.parts.length).toBeGreaterThan(60)
    expect(
      source.parts.every(
        (part) =>
          part.regions.length > 0 &&
          part.regions.every((region) => region.kind === 'closed-solid')
      )
    ).toBe(true)
    expect(
      source.parts.every((part) => part.shape.positions.every(Number.isFinite))
    ).toBe(true)
    expect(source.parts.some((part) => part.id.includes('mast'))).toBe(false)
    expect(
      source.parts.some((part) => part.material.material === 'soft-contact')
    ).toBe(true)
    expect(
      source.parts.some((part) => part.material.material === 'joint-housing')
    ).toBe(true)
    for (const chain of source.rig.armChains) {
      expect(chain.jointIds.some((id) => id.endsWith('rootPitch'))).toBe(true)
      expect(chain.jointIds.indexOf(chain.id + '-rootPitch')).toBeLessThan(
        chain.jointIds.indexOf(chain.id + '-elbowPitch')
      )
    }
    expect(source.massProperties.bodies.length).toBe(source.rig.bodies.length)
    expect(
      new Set(source.massProperties.bodies.map((body) => body.bodyId)).size
    ).toBe(source.rig.bodies.length)
    expect(source.massProperties.totalMassKg).toBeGreaterThan(0)
    expect(Object.isFrozen(source.parts[0].shape.positions)).toBe(true)
    expect(owner.prepare(definition)).toBe(source)
    expect(owner.work.robotBuilds).toBe(1)
    expect(() =>
      owner.prepare(
        createSyntheticWalkingRobotDefinition({ definitionId: 'legacy-test' })
      )
    ).toThrow()
  })

  it('rebuilds basket material without rebuilding robot material and retires stale attachments', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
    const input = createSyntheticBasketInput([0.6, 0.2, 1])
    const first = owner.mount(source, input)
    expect(first.parts.some((part) => part.id.includes('latch'))).toBe(true)
    expect(first.parts.some((part) => part.id.includes('bottom'))).toBe(true)
    expect(owner.mount(source, input)).toBe(first)
    const next = owner.mount(
      source,
      createSyntheticBasketInput([0.2, 0.1, 0.3])
    )
    expect(owner.work.robotBuilds).toBe(1)
    expect(owner.work.basketBuilds).toBe(2)
    expect(owner.isCurrentMount(first)).toBe(false)
    expect(owner.isCurrentMount(next)).toBe(true)
    expect(owner.read()).toBe(source)
    owner.clear()
    expect(owner.isCurrent(source)).toBe(false)
    expect(owner.isCurrentMount(next)).toBe(false)
    expect(() => owner.mount(source, input)).toThrow()
  })

  it('rejects absent load geometry rather than substituting a guessed load volume', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
    const input = createSyntheticBasketInput([0.4, 0.15, 0.6])
    input.basket.payloadKg = 25
    expect(() => owner.mount(source, input)).toThrow(/load-geometry/)
  })
})

describe('named quadruped designed contact evidence', () => {
  it('retains exact original face references for feet, basket support and revolute bearings', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
    const mount = owner.mount(source, createSyntheticBasketInput([0.6, 0.2, 1]))
    expect(source.contacts.feet).toHaveLength(4)
    expect(source.contacts.bearings.length).toBeGreaterThan(20)
    expect(mount.contacts.supports).toHaveLength(mount.input.supports.length)
    for (const contact of [
      ...source.contacts.feet,
      ...source.contacts.bearings.flatMap((pair) => [pair.parent, pair.child]),
      ...mount.contacts.supports
    ]) {
      expect([...source.parts, ...mount.parts]).toContain(contact.part)
      expect(contact.part.patches).toContain(contact.patch)
      expect(contact.part.regions).toContain(contact.patch.region)
      expect(contact.patch.ranges.length).toBeGreaterThan(0)
      for (const range of contact.patch.ranges) {
        expect(range.indexCount).toBeGreaterThan(0)
        expect(range.indexStart + range.indexCount).toBeLessThanOrEqual(
          contact.part.shape.indices.length
        )
      }
    }
  })
})
describe('basket bottom material follows the admitted contact shape', () => {
  it('retains underside gaps between pads instead of filling them with a flat slab', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
    const input = createSyntheticBasketInput([0.4, 0.15, 0.6])
    const flat = owner.mount(source, input)
    input.basket.bottom = {
      kind: 'pads',
      contacts: input.supports.map((centre) => ({ centre, size: [0.06, 0.06] }))
    }
    const pads = owner.mount(source, input)
    const bottom = Math.min(
      ...flat.parts
        .filter((part) => part.kind === 'basket')
        .map((part) => part.localFrame.position[1] - part.size[1] / 2)
    )
    const belowFloor =
      bottom + (input.basket.externalSize[1] - input.basket.internalSize[1]) / 4
    const contains = (mount: typeof pads, point: number[]) =>
      mount.parts.some(
        (part) =>
          part.kind === 'basket' &&
          point.every(
            (value, axis) =>
              value > part.localFrame.position[axis] - part.size[axis] / 2 &&
              value < part.localFrame.position[axis] + part.size[axis] / 2
          )
      )
    expect(contains(flat, [0, belowFloor, 0])).toBe(true)
    expect(contains(pads, [0, belowFloor, 0])).toBe(false)
    for (const [x, z] of input.supports)
      expect(contains(pads, [x, belowFloor, z])).toBe(true)
    expect(owner.work.robotBuilds).toBe(1)
    expect(owner.work.basketBuilds).toBe(2)
    expect(source.contacts.cutters).toHaveLength(4)
    expect(
      source.contacts.cutters.every((contact) =>
        contact.part.patches.includes(contact.patch)
      )
    ).toBe(true)
  })
})
describe('quadruped source frame and mass regression', () => {
  it('rejects fixed material placed beyond the body width by its actual stage mount', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const raw = JSON.parse(
      JSON.stringify(createSyntheticQuadrupedRobotDefinition())
    )
    raw.stages.left.mount.position[0] = -1
    expect(() => owner.prepare(raw)).toThrow(/body-width/)
  })

  it('preserves the first mass moment of every constituent on aggregated bodies', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const raw = JSON.parse(
      JSON.stringify(createSyntheticQuadrupedRobotDefinition())
    )
    raw.platform.fixedParts[0].localCoM = [0, 0.2, 0]
    raw.arms[0].tool.localCoM = [0.1, 0.2, -0.1]
    raw.arms[0].guard.localCoM = [0.4, -0.1, 0.3]
    const source = owner.prepare(raw)
    const base = source.massProperties.bodies.find(
      (body) => body.bodyId === 'base'
    )
    const tool = source.massProperties.bodies.find(
      (body) => body.bodyId === 'left-holder-tool'
    )
    if (!base || !tool) throw new Error('Missing aggregate body')
    expect(base.massKg).toBeCloseTo(14.4, 12)
    expect(base.localCoM[1]).toBeCloseTo(0.4 / 14.4, 12)
    const constituents = [raw.arms[0].tool, raw.arms[0].guard]
    for (const axis of [0, 1, 2])
      expect(tool.massKg * tool.localCoM[axis]).toBeCloseTo(
        constituents.reduce(
          (sum, part) => sum + part.massKg * part.localCoM[axis],
          0
        ),
        12
      )
  })
})

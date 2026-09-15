import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { createSyntheticQuadrupedRobotDefinition } from '../quadruped-robot-definition'
import { createSyntheticWalkingRobotDefinition } from '../walking-robot-definition'
import { createSyntheticBasketInput } from '../basket-interface'
import { QuadrupedRobotSourceOwner } from '../quadruped-robot-source'

function expectedMaterialIds(
  source: ReturnType<QuadrupedRobotSourceOwner['prepare']>,
  mount: ReturnType<QuadrupedRobotSourceOwner['mount']>
) {
  const ids = [
    'chassis',
    'platform-deck',
    'stage-base-bridge--1',
    'stage-base-bridge-1'
  ]
  source.definition.platform.fixedParts
    .slice(1)
    .forEach((_, i) => ids.push('fixed-latch-housing-' + i))
  for (const side of ['left', 'right'] as const) {
    for (
      let i = 0;
      i < source.definition.stages[side].telescope.segmentCount;
      i++
    )
      ids.push(side + '-stage-' + (i === 0 ? 'fixed' : i) + '-shell')
    ids.push(side + '-shoulder-stage-cover', side + '-shoulder-stage-plug')
  }
  const bearing = (id: string) => {
    for (const suffix of [
      'housing',
      'back-cap',
      'outer-cap',
      'thrust-race',
      'sleeve'
    ])
      ids.push(id + '-' + suffix)
  }
  for (const arm of source.definition.arms) {
    const id = arm.side + '-' + arm.role,
      tool = id + '-tool'
    for (const joint of [
      'rootYaw',
      'rootPitch',
      'elbowPitch',
      'wristPitch',
      'wristYaw',
      'wristRoll'
    ])
      bearing(id + '-' + joint)
    ids.push(
      id + '-root-yoke',
      id + '-rootPitch-cover',
      id + '-elbowPitch-cover',
      tool + '-palm'
    )
    for (const wrist of ['wristPitch', 'wristYaw', 'wristRoll'])
      ids.push(id + '-' + wrist + '-carrier')
    for (const sign of [-1, 1])
      ids.push(
        ...(arm.role === 'holder'
          ? [tool + '-padded-finger-' + sign, tool + '-foliage-guide-' + sign]
          : [tool + '-guard-' + sign, tool + '-blade-' + sign + '-material'])
      )
  }
  for (const leg of source.definition.legs) {
    const id = leg.side + '-' + leg.station
    for (const joint of ['hipAbduction', 'hipPitch', 'kneePitch', 'anklePitch'])
      bearing(id + '-' + joint)
    ids.push(
      id + '-mount',
      id + '-hip-yoke',
      id + '-hipPitch-cover',
      id + '-kneePitch-cover',
      id + '-ankle-carrier',
      id + '-foot-pad'
    )
  }
  for (const sign of [-1, 1])
    ids.push(
      'basket-base-crossbar-' + sign,
      'basket-side-' + sign,
      'basket-end-' + sign,
      'basket-width-stop-' + sign,
      'basket-retainer-crossbar-' + sign,
      'basket-length-latch-' + sign
    )
  ids.push('basket-bottom', 'basket-width-adjustment-beam')
  ;[...new Set(mount.input.supports.map(([x]) => x))].forEach((_, i) =>
    ids.push('basket-support-rail-' + i)
  )
  mount.input.supports.forEach((_, i) => ids.push('basket-support-' + i))
  if (mount.input.basket.bottom.kind === 'pads')
    mount.input.basket.bottom.contacts.forEach((_, i) =>
      ids.push('basket-bottom-pad-' + i)
    )
  return ids.sort()
}

describe('quadruped canonical material and definition lifetime', () => {
  it.each([
    [0.028, 0.04, 0.14],
    [0.04, 0.04, 0.04]
  ])(
    'rejects a deck size %j that belongs to another material module',
    (x, y, z) => {
      const raw = structuredClone(createSyntheticQuadrupedRobotDefinition())
      ;(raw.platform.fixedParts[0] as unknown as { size: number[] }).size = [
        x,
        y,
        z
      ]
      expect(() => new QuadrupedRobotSourceOwner().prepare(raw)).toThrow(
        /Unsupported/
      )
    }
  )
  it('binds the platform to its own rigid module without changing validated default buffers', () => {
    const source = new QuadrupedRobotSourceOwner().prepare(
      createSyntheticQuadrupedRobotDefinition()
    )
    expect(
      source.parts.find((part) => part.id === 'platform-deck')?.sourceModuleId
    ).toBe('platform-deck')
    expect(
      createHash('sha256')
        .update(
          JSON.stringify(
            source.parts.map((part) => [
              part.id,
              part.sourceModuleId,
              part.localFrame.position,
              part.localFrame.rotation,
              part.shape.positions,
              part.shape.indices
            ])
          )
        )
        .digest('hex')
    ).toBe('af81c78473d6ece669e0afd58107429ab3232798270c8bddcb3c82c607b9e966')
  })
  it.each([
    ['width', 0, 0.5],
    ['height', 1, 0.05],
    ['length', 2, 0.8]
  ] as const)(
    'rejects unsupported rigid deck %s instead of rewriting the definition',
    (_name, axis, value) => {
      const raw = structuredClone(createSyntheticQuadrupedRobotDefinition())
      ;(raw.platform.fixedParts[0].size as unknown as number[])[axis] = value
      expect(() => new QuadrupedRobotSourceOwner().prepare(raw)).toThrow(
        /Unsupported/
      )
    }
  )
  it.each([0, 1, 2])(
    'rejects an incompatible deck centre axis %i instead of leaving bridges behind',
    (axis) => {
      const raw = structuredClone(createSyntheticQuadrupedRobotDefinition())
      ;(raw.platform.fixedParts[0].centre as unknown as number[])[axis] += 0.01
      expect(() => new QuadrupedRobotSourceOwner().prepare(raw)).toThrow(
        /Unsupported/
      )
    }
  )
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
  it('covers the independently required material inventory including all fixed parts and actual sliding joints', () => {
    const owner = new QuadrupedRobotSourceOwner(),
      source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
    const mount = owner.mount(source, createSyntheticBasketInput([0.6, 0.2, 1]))
    const parts = [...source.parts, ...mount.parts]
    const expected = expectedMaterialIds(source, mount)
    expect(parts.map((part) => part.id).sort()).toEqual(expected)
    for (const removed of parts)
      expect(
        parts
          .filter((part) => part !== removed)
          .map((part) => part.id)
          .sort()
      ).not.toEqual(expected)
    const groups = [
      ...source.contacts.bearings,
      ...source.contacts.connections,
      ...(source.contacts.pivots ?? []),
      ...mount.contacts.supportPairs,
      ...(mount.contacts.connections ?? [])
    ]
    const declared = new Set(
      groups.flatMap((group) =>
        [...group.parent, ...group.child].map((reference) => reference.part)
      )
    )
    for (const slider of source.contacts.sliders ?? []) {
      declared.add(slider.parent)
      declared.add(slider.child)
    }
    expect(
      parts.filter((part) => !declared.has(part)).map((part) => part.id)
    ).toEqual([])
    expect(
      source.contacts.sliders?.map((slider) => slider.jointId).sort()
    ).toEqual(
      source.rig.joints
        .filter((joint) => joint.motion === 'prismatic')
        .map((joint) => joint.id)
        .sort()
    )
  })
  it('publishes paired original patch collections for each designed contact', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
    const mount = owner.mount(source, createSyntheticBasketInput([0.6, 0.2, 1]))
    expect(source.contacts.bearings).toHaveLength(40)
    for (const bearing of source.contacts.bearings) {
      expect(Array.isArray(bearing.parent)).toBe(true)
      expect(Array.isArray(bearing.child)).toBe(true)
    }
    expect(mount.contacts).toHaveProperty('supportPairs')
  })
  it('retains exact original face references for feet, basket support and revolute bearings', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
    const mount = owner.mount(source, createSyntheticBasketInput([0.6, 0.2, 1]))
    expect(source.contacts.feet).toHaveLength(4)
    expect(source.contacts.bearings.length).toBeGreaterThan(20)
    expect(mount.contacts.supports).toHaveLength(mount.input.supports.length)
    for (const contact of [
      ...source.contacts.feet,
      ...source.contacts.bearings.flatMap((pair) => [
        ...pair.parent,
        ...pair.child
      ]),
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
        .map((part) =>
          Math.min(...part.shape.positions.filter((_, i) => i % 3 === 1))
        )
    )
    const belowFloor =
      bottom + (input.basket.externalSize[1] - input.basket.internalSize[1]) / 4
    const contains = (mount: typeof pads, point: number[]) =>
      mount.parts.some(
        (part) =>
          part.kind === 'basket' &&
          point.every(
            (value, axis) =>
              value >
                Math.min(
                  ...part.shape.positions.filter((_, i) => i % 3 === axis)
                ) &&
              value <
                Math.max(
                  ...part.shape.positions.filter((_, i) => i % 3 === axis)
                )
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

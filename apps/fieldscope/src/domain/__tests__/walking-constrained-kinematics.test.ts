import { describe, expect, it } from 'vitest'
import {
  WalkingConstrainedKinematicsOwner,
  WalkingConstrainedCycleOwner
} from '../walking-constrained-kinematics'
import { evaluateWalkingRobotPose } from '../walking-robot-kinematics'

import {
  cycleFixture,
  exact,
  fixture,
  fraction,
  inRange,
  minus,
  negate,
  plus,
  required,
  rotateOracle,
  times,
  vectorMinus,
  vectorPlus
} from './walking-constrained-kinematics-test-fixtures'
import type { Fraction } from './walking-constrained-kinematics-test-fixtures'

describe('exact polynomial complementary tripod cycle', () => {
  it('issues phase-root membership from the actual support branch only', () => {
    const { source, raw } = cycleFixture({
      sourceProfile: 'solid-articulation/2'
    })
    const owner = new WalkingConstrainedCycleOwner()
    const cycle = owner.prepare(source, raw)
    for (const phase of [0, 1] as const) {
      const receipt = owner.readPhaseRootMotion(cycle, phase)
      if (!receipt) throw new Error('Missing phase-root receipt')
      expect(receipt.phase).toBe(phase)
      expect(receipt.cycle).toBe(cycle)
      expect(receipt.source).toBe(source)
      const support = new Set(cycle.recipe.groups[phase])
      for (const chain of source.rig.legChains) {
        expect(receipt.bodies.some((e) => e.body.id === chain.bodyIds[0])).toBe(
          support.has(chain.id)
        )
        for (const id of chain.bodyIds.slice(1))
          expect(receipt.bodies.some((e) => e.body.id === id)).toBe(false)
      }
      for (const contact of source.rig.contacts.feet)
        expect(receipt.parts.some((e) => e.part === contact.part)).toBe(false)
      const point = owner.evaluate(cycle, phase, fraction(1n, 3n))
      const root = required(
        point.bodies.find((p) => p.body.id === 'base')
      ).exact
      for (const entry of receipt.parts) {
        const actual = required(
          point.parts.find((p) => p.part === entry.part)
        ).exact
        for (let i = 0; i < 3; i++) {
          expect(actual.origin[i]).toEqual(
            plus(
              root.origin[i],
              root.matrix[i].reduce(
                (s, v, j) => plus(s, times(v, entry.local.origin[j])),
                exact(0)
              )
            )
          )
          for (let j = 0; j < 3; j++)
            expect(actual.matrix[i][j]).toEqual(
              root.matrix[i].reduce(
                (s, v, k) => plus(s, times(v, entry.local.matrix[k][j])),
                exact(0)
              )
            )
        }
      }
      const work = owner.work.operations
      expect(owner.readPhaseRootMotion(cycle, phase)).toBe(receipt)
      expect(owner.work.operations).toBe(work)
    }
    expect(owner.readPhaseRootMotion(cycle, 0)).not.toBe(
      owner.readPhaseRootMotion(cycle, 1)
    )
    expect(owner.readPhaseRootMotion({ ...cycle }, 0)).toBeUndefined()
    expect(owner.readPhaseRootMotion(cycle, 2)).toBeUndefined()
    expect(
      owner
        .readConstantMotion(cycle)
        ?.bodies.some((e) => e.body.id.includes('coxa'))
    ).toBe(false)
    owner.dispose()
    expect(owner.readPhaseRootMotion(cycle, 0)).toBeUndefined()
  })
  it('issues constant-root membership only from compiler constant descendants', () => {
    const { source, raw } = cycleFixture({
      sourceProfile: 'solid-articulation/2'
    })
    const owner = new WalkingConstrainedCycleOwner()
    const cycle = owner.prepare(source, raw)
    const receipt = owner.readConstantMotion(cycle)
    expect(receipt?.source).toBe(source)
    expect(receipt?.recipe).toBe(cycle.recipe)
    if (!receipt) throw new Error('Missing constant-root receipt')
    expect(receipt.bodies.some((p) => p.body.id === 'carriage')).toBe(true)
    const legs = new Set(source.rig.legChains.flatMap((c) => c.bodyIds))
    for (const entry of receipt.bodies)
      expect(legs.has(entry.body.id)).toBe(false)
    expect(receipt.parts.some((p) => p.part.id === 'lift-rail-negative')).toBe(
      true
    )
    expect(receipt.parts.some((p) => p.part.id.includes('foot'))).toBe(false)
    expect(
      owner.readBaseMotion(cycle)?.parts.every((p) => p.part.bodyId === 'base')
    ).toBe(true)
    for (const phase of [0, 1]) {
      const point = owner.evaluate(cycle, phase, fraction(1n, 3n))
      const root = required(
        point.bodies.find((p) => p.body.id === 'base')
      ).exact
      for (const entry of receipt.parts) {
        const actual = required(
          point.parts.find((p) => p.part === entry.part)
        ).exact
        for (let i = 0; i < 3; i++) {
          expect(actual.origin[i]).toEqual(
            plus(
              root.origin[i],
              root.matrix[i].reduce(
                (s, v, j) => plus(s, times(v, entry.local.origin[j])),
                exact(0)
              )
            )
          )
          for (let j = 0; j < 3; j++)
            expect(actual.matrix[i][j]).toEqual(
              root.matrix[i].reduce(
                (s, v, k) => plus(s, times(v, entry.local.matrix[k][j])),
                exact(0)
              )
            )
        }
      }
    }
    const work = owner.work.operations
    expect(owner.readConstantMotion(cycle)).toBe(receipt)
    expect(owner.work.operations).toBe(work)
    expect(owner.readConstantMotion({ ...cycle })).toBeUndefined()
    owner.dispose()
    expect(owner.readConstantMotion(cycle)).toBeUndefined()
  })
  it('issues a whole-phase base receipt from the shared compiler expression', () => {
    const { source, raw } = cycleFixture({
      sourceProfile: 'solid-articulation/2'
    })
    const owner = new WalkingConstrainedCycleOwner()
    const cycle = owner.prepare(source, raw)
    const receipt = owner.readBaseMotion(cycle)
    expect(receipt?.cycle).toBe(cycle)
    expect(receipt?.source).toBe(source)
    expect(receipt?.recipe).toBe(cycle.recipe)
    expect(receipt?.parts.map((p) => p.part)).toEqual(
      source.parts.filter((p) => p.bodyId === 'base')
    )
    expect(receipt?.determinant.numerator).toBeGreaterThan(0n)
    if (!receipt) throw new Error('Missing base receipt')
    for (const phase of [0, 1]) {
      const point = owner.evaluate(cycle, phase, fraction(1n, 2n))
      const root = required(
        point.bodies.find((p) => p.body === receipt.body)
      ).exact
      expect(root.matrix).toEqual(receipt.rootMatrix)
      for (const entry of receipt.parts) {
        const actual = required(
          point.parts.find((p) => p.part === entry.part)
        ).exact
        for (let i = 0; i < 3; i++) {
          expect(actual.origin[i]).toEqual(
            plus(
              root.origin[i],
              root.matrix[i].reduce(
                (sum, v, j) => plus(sum, times(v, entry.local.origin[j])),
                exact(0)
              )
            )
          )
          for (let j = 0; j < 3; j++)
            expect(actual.matrix[i][j]).toEqual(
              root.matrix[i].reduce(
                (sum, v, k) => plus(sum, times(v, entry.local.matrix[k][j])),
                exact(0)
              )
            )
        }
      }
    }
    const work = owner.work.operations
    expect(owner.readBaseMotion(cycle)).toBe(receipt)
    expect(owner.work.operations).toBe(work)
    expect(owner.readBaseMotion({ ...cycle })).toBeUndefined()
    owner.dispose()
    expect(owner.readBaseMotion(cycle)).toBeUndefined()
    expect(() =>
      owner.prepare(source, {
        ...raw,
        baseOrientation: [exact(0), exact(0), exact(0), exact(0)]
      })
    ).toThrow()
    expect(owner.readBaseMotion(cycle)).toBeUndefined()
    const reverse = owner.prepare(source, {
      ...raw,
      baseOrientation: [exact(0), exact(1), exact(0), exact(0)],
      anchors: raw.anchors.map((anchor) => ({
        ...anchor,
        anchorOrigin: [
          negate(anchor.anchorOrigin[0]),
          anchor.anchorOrigin[1],
          negate(anchor.anchorOrigin[2])
        ]
      }))
    })
    expect(owner.readBaseMotion(reverse)?.rootMatrix).toEqual([
      [exact(-1), exact(0), exact(0)],
      [exact(0), exact(1), exact(0)],
      [exact(0), exact(0), exact(-1)]
    ])
  })
  it('uses exact yaw reversal and current recipe identities without per-foot correction', () => {
    const { source, raw } = cycleFixture(),
      q = [exact(0), exact(1), exact(0), exact(0)]
    const reversed = {
      ...raw,
      baseOrientation: q,
      anchors: raw.anchors.map((v) => ({
        ...v,
        anchorOrigin: rotateOracle(q, v.anchorOrigin)
      }))
    }
    const owner = new WalkingConstrainedCycleOwner(),
      cycle = owner.prepare(source, reversed)
    expect(cycle.netDisplacement[2].numerator).toBeGreaterThan(0n)
    const work = owner.work
    expect(owner.prepare(source, cycle.recipe)).toBe(cycle)
    expect(owner.read(source, cycle.recipe)).toBe(cycle)
    expect(owner.work).toEqual(work)
    expect(Object.isFrozen(cycle.phases[0].supports[0].fixedVertices)).toBe(
      true
    )
    expect(() =>
      owner.prepare(source, { ...reversed, alpha: exact(0) })
    ).toThrow()
    expect(owner.read(source, cycle.recipe)).toBeUndefined()
    expect(() => owner.evaluate(cycle, 0, exact(0))).toThrow()
  })
  it('rejects invalid source, group, patch, anchor, preset, domain and finite budget inputs', () => {
    const { source, raw } = cycleFixture()
    const cases = [
      { ...raw, source: { ...source } },
      { ...raw, groups: [raw.groups[0], raw.groups[0]] },
      {
        ...raw,
        anchors: raw.anchors.map((v, i) =>
          i ? v : { ...v, patch: raw.anchors[1].patch }
        )
      },
      {
        ...raw,
        anchors: raw.anchors.map((v, i) =>
          i
            ? v
            : {
                ...v,
                anchorOrigin: v.anchorOrigin.map((x, k) =>
                  k ? x : plus(x, fraction(1n, 1n << 60n))
                )
              }
        )
      },
      { ...raw, fixedJoints: { ...source.rig.presets.stowed } },
      { ...raw, baseOrientation: [exact(1), exact(0), exact(0), exact(1)] },
      { ...raw, baseOrientation: [exact(0), exact(0), exact(0), exact(0)] },
      { ...raw, alpha: exact(0) },
      { ...raw, alpha: exact(0.5) },
      { ...raw, budget: { maxOperations: 1, maxBits: 24000 } },
      { ...raw, budget: { maxOperations: 10000000, maxBits: 32 } }
    ]
    for (const bad of cases)
      expect(() =>
        new WalkingConstrainedCycleOwner().prepare(source, bad)
      ).toThrow()
    const defaults = cycleFixture({ authored: false })
    expect(() =>
      new WalkingConstrainedCycleOwner().prepare(defaults.source, defaults.raw)
    ).toThrow(/domain/)
  })
  it('retains the real open-phase certificate when a rational point exceeds its resource guard', () => {
    const { source, raw } = cycleFixture(),
      owner = new WalkingConstrainedCycleOwner(),
      cycle = owner.prepare(source, raw)
    expect(
      cycle.phases.every((p) =>
        p.swing.every((s) => s.certificate.openPhasePositive)
      )
    ).toBe(true)
    const before = owner.work
    expect(() => owner.evaluate(cycle, 0, fraction(1n, 1n << 2000n))).toThrow(
      /budget/
    )
    expect(owner.work.evaluations).toBe(before.evaluations + 1)
    expect(owner.work.operations).toBeGreaterThan(before.operations)
    expect(owner.read(source, cycle.recipe)).toBe(cycle)
    expect(() =>
      owner.bound(cycle, 0, { low: exact(0.75), high: exact(0.25) })
    ).toThrow()
    expect(() =>
      owner.bound(cycle, 0, { low: exact(-1), high: exact(0) })
    ).toThrow()
  })

  it('bounds an exact rational subinterval instead of reusing the whole phase box', () => {
    const { source, raw } = cycleFixture()
    const owner = new WalkingConstrainedCycleOwner()
    const cycle = owner.prepare(source, raw)
    const whole = owner.bound(cycle, 0, { low: exact(0), high: exact(1) })
    const narrow = owner.bound(cycle, 0, {
      low: fraction(7n, 16n),
      high: fraction(9n, 16n)
    })
    const single = owner.bound(cycle, 0, { low: exact(0.5), high: exact(0.5) })
    const point = owner.evaluate(cycle, 0, exact(0.5))
    const width = (value: typeof whole) =>
      value.parts.reduce(
        (sum, p) => sum + p.sourceBounds.max[2] - p.sourceBounds.min[2],
        0
      )
    expect(width(narrow)).toBeLessThan(width(whole))
    expect(width(single)).toBeLessThan(width(narrow))
    for (let i = 0; i < point.bodies.length; i++)
      for (let k = 0; k < 3; k++)
        inRange(
          point.bodies[i].exact.origin[k],
          single.bodies[i].bounds.origin[k]
        )
    expect(single.cycle).toBe(cycle)
    expect(single.work.unvisited).toBe(0)
  })
  it('publishes two actual-source phases with exact handoff and periodic net motion', () => {
    const { source, raw } = cycleFixture()
    const owner = new WalkingConstrainedCycleOwner()
    const cycle = owner.prepare(source, raw)
    expect(cycle.source).toBe(source)
    expect(cycle.phases).toHaveLength(2)
    const start = owner.evaluate(cycle, 0, exact(0))
    const handoff = owner.evaluate(cycle, 0, exact(1))
    const next = owner.evaluate(cycle, 1, exact(0))
    const end = owner.evaluate(cycle, 1, exact(1))
    expect(handoff.bodies).toEqual(next.bodies)
    expect(start.bodies).toHaveLength(46)
    for (let i = 0; i < start.bodies.length; i++) {
      expect(end.bodies[i].exact.matrix).toEqual(start.bodies[i].exact.matrix)
      expect(end.bodies[i].exact.origin).toEqual(
        start.bodies[i].exact.origin.map((v: Fraction, k: number) =>
          plus(v, cycle.netDisplacement[k])
        )
      )
    }
    expect(cycle.netDisplacement[2].numerator).toBeLessThan(0n)
  })
})
describe('constrained projection formal dependencies and original material', () => {
  it('proves conjugate similarity and shared displacement cancellation for every original sole triangle', () => {
    // A/N and B/N are independent rational expressions, not ideal sin/cos.
    // (c²-s²)²+(2cs)²=(c²+s²)² certifies the inverse for every nonzero q.
    type Polynomial = Record<string, bigint>
    const product = (a: Polynomial, b: Polynomial) => {
      const result: Polynomial = {}
      for (const [ka, va] of Object.entries(a))
        for (const [kb, vb] of Object.entries(b)) {
          const aa = ka.split(',').map(Number),
            bb = kb.split(',').map(Number),
            key = [aa[0] + bb[0], aa[1] + bb[1]].join(',')
          result[key] = (result[key] ?? 0n) + va * vb
        }
      return result
    }
    const A = { '0,2': 1n, '2,0': -1n },
      B = { '1,1': 2n },
      N = { '0,2': 1n, '2,0': 1n }
    const aa = product(A, A),
      bb = product(B, B),
      nn = product(N, N)
    for (const key of new Set([
      ...Object.keys(aa),
      ...Object.keys(bb),
      ...Object.keys(nn)
    ]))
      expect((aa[key] ?? 0n) + (bb[key] ?? 0n) - (nn[key] ?? 0n)).toBe(0n)
    const { source, recipe } = fixture()
    const baseOrientation = [exact(1), exact(2), exact(3), exact(4)]
    const transformed = {
      ...recipe,
      baseOrientation,
      supports: recipe.supports.map((entry) => ({
        ...entry,
        anchorOrigin: rotateOracle(baseOrientation, entry.anchorOrigin)
      }))
    }
    const owner = new WalkingConstrainedKinematicsOwner()
    const projection = owner.prepare(source, transformed)
    expect(projection.certificate.quaternionNormBounds.low).toBeGreaterThan(0)
    let reference:
      | {
          constant: Fraction[]
          a: Fraction[]
          b: Fraction[]
          anchor: readonly Fraction[]
        }
      | undefined
    let originalVertices = 0
    for (const support of projection.supports) {
      const chain = required(
        source.rig.legChains.find((chain) => chain.id === support.chainId)
      )
      const joints = chain.jointIds.map((id) =>
        required(source.rig.joints.find((joint) => joint.id === id))
      )
      const foot = required(
        required(source.rig.bodies.find((body) => body.id === chain.footBodyId))
          .fixedFrame
      )
      const contact = required(
        source.rig.contacts.feet.find(
          (contact) =>
            contact.part === support.part && contact.patch === support.patch
        )
      )
      const offset = vectorPlus(
        joints[0].frame.position.map(exact),
        joints[1].frame.position.map(exact)
      )
      const k = joints[2].frame.position.map(exact)
      const ca = [k[0], k[1], k[2]],
        cb = [exact(0), k[2], negate(k[1])]
      expect(k[0]).toEqual(exact(0))
      const constant = vectorPlus(
        vectorPlus(offset, foot.position.map(exact)),
        contact.localFrame.position.map(exact)
      )
      if (!reference)
        reference = { constant, a: ca, b: cb, anchor: support.anchorOrigin }
      const variableA = rotateOracle(
        baseOrientation,
        vectorMinus(ca, reference.a)
      )
      const variableB = rotateOracle(
        baseOrientation,
        vectorMinus(cb, reference.b)
      )
      expect(variableA).toEqual([exact(0), exact(0), exact(0)])
      expect(variableB).toEqual([exact(0), exact(0), exact(0)])
      const indices = new Set<number>()
      for (const range of support.patch.ranges)
        for (
          let offset = range.indexStart;
          offset < range.indexStart + range.indexCount;
          offset++
        )
          indices.add(support.part.shape.indices[offset])
      expect(
        support.fixedVertices
          .map((vertex) => vertex.index)
          .sort((a, b) => a - b)
      ).toEqual([...indices].sort((a, b) => a - b))
      for (const index of indices) {
        const v = support.part.shape.positions
          .slice(index * 3, index * 3 + 3)
          .map(exact)
        const local = vectorPlus(
          rotateOracle(support.part.localFrame.rotation.map(exact), v),
          support.part.localFrame.position.map(exact)
        )
        const rawConstant = vectorPlus(
          vectorPlus(offset, foot.position.map(exact)),
          local
        )
        const commonRootResult = vectorPlus(
          reference.anchor,
          rotateOracle(
            baseOrientation,
            vectorMinus(rawConstant, reference.constant)
          )
        )
        const anchorResult = vectorPlus(
          support.anchorOrigin,
          rotateOracle(
            baseOrientation,
            vectorMinus(local, contact.localFrame.position.map(exact))
          )
        )
        expect(commonRootResult).toEqual(anchorResult)
        expect(
          required(
            support.fixedVertices.find((vertex) => vertex.index === index)
          ).position
        ).toEqual(anchorResult)
        originalVertices++
      }
    }
    expect(originalVertices).toBeGreaterThanOrEqual(12)
  })
  it('does not use legacy rounded anchor corrections or Math trigonometry as its authority', () => {
    const { source, recipe, alpha } = fixture()
    const joints = {
      ...source.rig.presets.stowed,
      legs: source.rig.presets.stowed.legs.map((leg) => {
        const chain = required(
          source.rig.legChains.find(
            (chain) => chain.side === leg.side && chain.station === leg.station
          )
        )
        return recipe.supports.some((entry) => entry.chainId === chain.id)
          ? { ...leg, hip: -alpha, knee: alpha }
          : leg
      })
    }
    const initial = evaluateWalkingRobotPose(source, {
      base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
      joints
    })
    const reference = recipe.supports[0]
    const old = required(
      initial.frames.contacts.feet.find((foot) => foot.part === reference.part)
    )
    const root = reference.anchorOrigin.map(
      (value, index) =>
        Number(value.numerator) / Number(value.denominator) -
        old.position[index]
    ) as [number, number, number]
    const legacy = evaluateWalkingRobotPose(source, {
      base: { position: root, rotation: [0, 0, 0, 1] },
      joints
    })
    expect(
      recipe.supports.some((entry) => {
        const foot = required(
          legacy.frames.contacts.feet.find((foot) => foot.part === entry.part)
        )
        return entry.anchorOrigin.some(
          (value, index) =>
            minus(exact(foot.position[index]), value).numerator !== 0n
        )
      })
    ).toBe(true)
    const oldSin = Math.sin,
      oldCos = Math.cos
    Math.sin = () => {
      throw new Error('Unexpected Math.sin leaf')
    }
    Math.cos = () => {
      throw new Error('Unexpected Math.cos leaf')
    }
    try {
      const owner = new WalkingConstrainedKinematicsOwner()
      const projection = owner.prepare(source, recipe)
      expect(owner.evaluate(projection, alpha).frames).toHaveLength(46)
    } finally {
      Math.sin = oldSin
      Math.cos = oldCos
    }
  })
  it('detaches raw rationals, reuses admitted identities and retires stale source or recipes without hidden work', () => {
    const { source, recipe, alpha } = fixture()
    const owner = new WalkingConstrainedKinematicsOwner()
    const projection = owner.prepare(source, recipe)
    const work = owner.work
    expect(owner.prepare(source, projection.recipe)).toBe(projection)
    expect(owner.read(source, projection.recipe)).toBe(projection)
    expect(owner.work).toEqual(work)
    const point = owner.evaluate(projection, alpha)
    const pointWork = owner.work
    expect(owner.evaluate(projection, alpha)).toBe(point)
    expect(owner.work).toEqual(pointWork)
    recipe.supports[0].anchorOrigin[0] = plus(
      recipe.supports[0].anchorOrigin[0],
      fraction(1n, 1n << 100n)
    )
    expect(owner.read(source, projection.recipe)).toBe(projection)
    expect(() => owner.prepare(source, recipe)).toThrow(
      'incompatible exact anchors'
    )
    expect(owner.read(source, projection.recipe)).toBeUndefined()
    expect(() => owner.evaluate(projection, 0)).toThrow('stale projection')
    const fresh = fixture()
    expect(() => owner.prepare(fresh.source, projection.recipe)).toThrow(
      'source or recipe binding'
    )
  })
  it.each([
    'rounded-anchor',
    'rational-residual',
    'wrong-patch',
    'independent-hip',
    'mutable-fixed-state',
    'zero-norm',
    'zero-denominator',
    'nonfinite-interval',
    'budget',
    'bit-budget'
  ] as const)(
    'rejects unproved %s before publishing a constrained product',
    (kind) => {
      const { source, recipe } = fixture()
      let invalid: unknown = recipe
      if (kind === 'rounded-anchor')
        invalid = {
          ...recipe,
          supports: recipe.supports.map((entry) => ({
            ...entry,
            anchorOrigin: entry.anchorOrigin.map((value) =>
              exact(Number(value.numerator) / Number(value.denominator))
            )
          }))
        }
      if (kind === 'rational-residual')
        invalid = {
          ...recipe,
          supports: recipe.supports.map((entry, index) =>
            index === 0
              ? {
                  ...entry,
                  anchorOrigin: entry.anchorOrigin.map((value, axis) =>
                    axis === 0 ? plus(value, fraction(1n, 1n << 100n)) : value
                  )
                }
              : entry
          )
        }
      if (kind === 'wrong-patch')
        invalid = {
          ...recipe,
          supports: recipe.supports.map((entry, index) =>
            index === 0 ? { ...entry, patch: recipe.supports[1].patch } : entry
          )
        }
      if (kind === 'independent-hip')
        invalid = { ...recipe, hipMode: 'independently-evaluated' }
      if (kind === 'mutable-fixed-state')
        invalid = { ...recipe, fixedJoints: { ...recipe.fixedJoints } }
      if (kind === 'zero-norm')
        invalid = {
          ...recipe,
          baseOrientation: [exact(0), exact(0), exact(0), exact(0)]
        }
      if (kind === 'zero-denominator')
        invalid = {
          ...recipe,
          baseOrientation: [
            fraction(0n),
            fraction(0n),
            fraction(0n),
            { numerator: 1n, denominator: 0n }
          ]
        }
      if (kind === 'nonfinite-interval')
        invalid = { ...recipe, interval: { low: NaN, high: 1 } }
      if (kind === 'budget')
        invalid = { ...recipe, budget: { maxOperations: 1, maxBits: 24000 } }
      if (kind === 'bit-budget')
        invalid = {
          ...recipe,
          budget: { maxOperations: 1000000, maxBits: 256 }
        }
      const owner = new WalkingConstrainedKinematicsOwner()
      expect(() => owner.prepare(source, invalid)).toThrow(
        'Unavailable constrained projection'
      )
    }
  )
  it('rejects default negative domains and unequal source dependencies, but permits nonunit rational base orientation', () => {
    const defaultFixture = fixture({ authored: false })
    expect(() =>
      new WalkingConstrainedKinematicsOwner().prepare(
        defaultFixture.source,
        defaultFixture.recipe
      )
    ).toThrow('support joint domain')
    const unequal = fixture({ upperLengthDelta: 0.01 })
    expect(() =>
      new WalkingConstrainedKinematicsOwner().prepare(
        unequal.source,
        unequal.recipe
      )
    ).toThrow('unsupported unequal support dimensions')
    const { source, recipe } = fixture()
    const firstOwner = new WalkingConstrainedKinematicsOwner(),
      secondOwner = new WalkingConstrainedKinematicsOwner()
    const first = firstOwner.prepare(source, recipe)
    const second = secondOwner.prepare(source, {
      ...recipe,
      baseOrientation: [exact(0), exact(0), exact(0), exact(-2)]
    })
    expect(
      firstOwner.evaluate(first, 0).frames.map((entry) => entry.exact)
    ).toEqual(
      secondOwner.evaluate(second, 0).frames.map((entry) => entry.exact)
    )
  })
})

describe('canonical constrained support projection', () => {
  it('enforces the declared bit budget on polynomial leaf work as well as rational frames', () => {
    const { source, recipe } = fixture()
    const complete = new WalkingConstrainedKinematicsOwner().prepare(
      source,
      recipe
    )
    expect(complete.work.maxBits).toBeGreaterThan(1)
    expect(() =>
      new WalkingConstrainedKinematicsOwner().prepare(source, {
        ...recipe,
        budget: { ...recipe.budget, maxBits: complete.work.maxBits - 1 }
      })
    ).toThrow('bit budget')
  })
  it('publishes one shared-root authority for three complete source soles over the authored arc', () => {
    const { source, recipe } = fixture()
    const owner = new WalkingConstrainedKinematicsOwner()
    const projection = owner.prepare(source, recipe)
    expect(projection.source).toBe(source)
    expect(projection.certificate.sharedTranslations).toBe(1)
    expect(projection.certificate.sharedDisplacements).toBe(1)
    expect(projection.supports).toHaveLength(3)
    expect(projection.bodies).toHaveLength(46)
    expect(projection.parts.map((entry) => entry.part)).toEqual(source.parts)
    expect(owner.read(source, projection.recipe)).toBe(projection)
    expect(owner.prepare(source, projection.recipe)).toBe(projection)
    expect(Object.isFrozen(projection.recipe.supports[0].anchorOrigin)).toBe(
      true
    )
  })
})

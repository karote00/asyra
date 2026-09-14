import { describe, expect, it } from 'vitest'
import {
  dyadic,
  divide,
  interval,
  multiply,
  subtract
} from '../scalar-arithmetic'
import {
  createSyntheticWalkingRobotDefinition,
  readWalkingRobotDefinition
} from '../walking-robot-definition'
import { WalkingRobotSourceOwner } from '../walking-robot-source'
import { WalkingConstrainedKinematicsOwner } from '../walking-constrained-kinematics'
import { evaluateWalkingRobotPose } from '../walking-robot-kinematics'

type Fraction = Readonly<{ numerator: bigint; denominator: bigint }>
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing formal fixture dependency')
  return value
}
function gcd(a: bigint, b: bigint): bigint {
  if (b !== 0n) return gcd(b, a % b)
  return a < 0n ? -a : a
}
function fraction(n: bigint, d = 1n): Fraction {
  if (d < 0n) {
    n = -n
    d = -d
  }
  const divisor = gcd(n, d)
  return { numerator: n / divisor, denominator: d / divisor }
}
function exact(value: number): Fraction {
  const v = dyadic(value)
  return v.exponent >= 0
    ? fraction(v.significand << BigInt(v.exponent))
    : fraction(v.significand, 1n << BigInt(-v.exponent))
}
const plus = (a: Fraction, b: Fraction) =>
  fraction(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator
  )
const minus = (a: Fraction, b: Fraction) =>
  plus(a, fraction(-b.numerator, b.denominator))
function fixture(
  options: { authored?: boolean; upperLengthDelta?: number } = {}
) {
  const baseline = createSyntheticWalkingRobotDefinition({
    definitionId: 'constrained-default'
  })
  const stations = baseline.legs
    .filter((leg) => leg.side === 'left')
    .map((leg) => leg.mount.position[2])
    .sort((a, b) => a - b)
  const spacing = Math.min(
    ...stations.slice(1).map((z, index) => z - stations[index])
  )
  const alpha = Math.min(
    ...baseline.legs.map(
      (leg) =>
        divide(
          subtract(interval(spacing), interval(leg.foot.size[2])),
          multiply(interval(4), interval(leg.upper.length))
        ).low
    )
  )
  const definition = readWalkingRobotDefinition({
    ...baseline,
    definitionId: 'constrained-authored',
    jointEvidence: {
      kind: 'synthetic',
      id: 'constrained-authored-joints',
      label: 'Support arc - synthetic authored assumption'
    },
    legs: baseline.legs.map((leg, index) => ({
      ...leg,
      upper: {
        ...leg.upper,
        length:
          leg.upper.length + (index === 0 ? (options.upperLengthDelta ?? 0) : 0)
      },
      jointRanges: {
        ...leg.jointRanges,
        knee: [options.authored === false ? 0 : -alpha, leg.jointRanges.knee[1]]
      }
    }))
  })
  const source = new WalkingRobotSourceOwner().prepare(definition)
  const supports = source.rig.legChains
    .filter((chain) => (chain.side === 'left') !== (chain.station === 'middle'))
    .map((chain) => {
      const contact = required(
        source.rig.contacts.feet.find(
          (contact) => contact.part.bodyId === chain.footBodyId
        )
      )
      const frames = chain.jointIds.map(
        (id) =>
          required(source.rig.joints.find((joint) => joint.id === id)).frame
      )
      const foot = required(
        required(source.rig.bodies.find((body) => body.id === chain.footBodyId))
          .fixedFrame
      )
      return {
        chainId: chain.id,
        part: contact.part,
        patch: contact.patch,
        anchorOrigin: [0, 1, 2].map((axis) =>
          [...frames, foot, contact.localFrame].reduce(
            (sum, frame) => plus(sum, exact(frame.position[axis])),
            exact(0)
          )
        )
      }
    })
  const recipe = {
    format: 'walking-constrained-kinematic-projection/1',
    source,
    baseOrientation: [exact(0), exact(0), exact(0), exact(1)],
    supports,
    fixedJoints: source.rig.presets.stowed,
    interval: { low: -alpha, high: alpha },
    budget: { maxOperations: 1000000, maxBits: 24000 }
  }
  return { baseline, source, recipe, alpha }
}
const times = (a: Fraction, b: Fraction) =>
  fraction(a.numerator * b.numerator, a.denominator * b.denominator)
const over = (a: Fraction, b: Fraction) =>
  fraction(a.numerator * b.denominator, a.denominator * b.numerator)
const negate = (a: Fraction) => fraction(-a.numerator, a.denominator)
const sum = (values: readonly Fraction[]) => values.reduce(plus, exact(0))
const vectorPlus = (a: readonly Fraction[], b: readonly Fraction[]) =>
  a.map((value, index) => plus(value, b[index]))
const vectorMinus = (a: readonly Fraction[], b: readonly Fraction[]) =>
  a.map((value, index) => minus(value, b[index]))
function hamilton(a: readonly Fraction[], b: readonly Fraction[]) {
  return [
    sum([
      times(a[3], b[0]),
      times(a[0], b[3]),
      times(a[1], b[2]),
      negate(times(a[2], b[1]))
    ]),
    sum([
      times(a[3], b[1]),
      negate(times(a[0], b[2])),
      times(a[1], b[3]),
      times(a[2], b[0])
    ]),
    sum([
      times(a[3], b[2]),
      times(a[0], b[1]),
      negate(times(a[1], b[0])),
      times(a[2], b[3])
    ]),
    sum([
      times(a[3], b[3]),
      negate(times(a[0], b[0])),
      negate(times(a[1], b[1])),
      negate(times(a[2], b[2]))
    ])
  ]
}
function rotateOracle(q: readonly Fraction[], point: readonly Fraction[]) {
  const norm = sum(q.map((value) => times(value, value)))
  const conjugate = [...q.slice(0, 3).map(negate), q[3]]
  return hamilton(hamilton(q, [...point, exact(0)]), conjugate)
    .slice(0, 3)
    .map((value) => over(value, norm))
}
function pointOracle(
  frame: {
    origin: readonly Fraction[]
    matrix: readonly (readonly Fraction[])[]
  },
  point: readonly Fraction[]
) {
  return vectorPlus(
    frame.origin,
    frame.matrix.map((row) =>
      sum(row.map((value, index) => times(value, point[index])))
    )
  )
}
const inRange = (value: Fraction, bounds: { low: number; high: number }) => {
  expect(minus(value, exact(bounds.low)).numerator).toBeGreaterThanOrEqual(0n)
  expect(minus(exact(bounds.high), value).numerator).toBeGreaterThanOrEqual(0n)
}
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
  it('keeps every exact body frame and original part vertex inside one polynomial recipe interval', () => {
    const { source, recipe, alpha } = fixture()
    const owner = new WalkingConstrainedKinematicsOwner()
    const projection = owner.prepare(source, recipe)
    expect(projection.work.boundLeaves).toBe(2)
    expect(projection.work.sourceVertices).toBe(
      source.parts.reduce(
        (count, part) => count + part.shape.positions.length / 3,
        0
      )
    )
    expect(projection.work.supportVertices).toBe(
      projection.supports.reduce(
        (count, support) => count + support.fixedVertices.length,
        0
      )
    )
    for (const parameter of [-alpha, alpha / 3, alpha]) {
      const point = owner.evaluate(projection, parameter)
      expect(point.work.pointLeaves).toBe(2)
      expect(point.source).toBe(source)
      expect(point.recipe).toBe(projection.recipe)
      for (const body of point.frames) {
        const bounds = required(
          projection.bodies.find((entry) => entry.body === body.body)
        ).bounds
        body.exact.origin.forEach((value, index) =>
          inRange(value, bounds.origin[index])
        )
        body.exact.matrix.forEach((row, index) =>
          row.forEach((value, column) =>
            inRange(value, bounds.matrix[index][column])
          )
        )
        expect(
          [...body.display.origin, ...body.display.matrix.flat()].every(
            Number.isFinite
          )
        ).toBe(true)
      }
      for (const entry of point.parts) {
        const bounds = required(
          projection.parts.find((part) => part.part === entry.part)
        ).sourceBounds
        for (
          let offset = 0;
          offset < entry.part.shape.positions.length;
          offset += 3
        ) {
          const p = pointOracle(
            entry.exact,
            entry.part.shape.positions.slice(offset, offset + 3).map(exact)
          )
          p.forEach((value, axis) =>
            inRange(value, { low: bounds.min[axis], high: bounds.max[axis] })
          )
        }
        const support = projection.supports.find(
          (support) => support.part === entry.part
        )
        if (support)
          for (const vertex of support.fixedVertices)
            expect(
              pointOracle(
                entry.exact,
                entry.part.shape.positions
                  .slice(vertex.index * 3, vertex.index * 3 + 3)
                  .map(exact)
              )
            ).toEqual(vertex.position)
      }
    }
    const nonSupport = required(
      projection.bodies.find((entry) => entry.body.id === 'base')
    )
    expect(
      nonSupport.bounds.origin.some((value) => value.low < value.high)
    ).toBe(true)
  }, 30000)
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

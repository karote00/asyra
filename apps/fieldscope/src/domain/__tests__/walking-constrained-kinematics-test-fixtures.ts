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
import { evaluateExactPolynomialTrig } from '../kinematic-trigonometry'

export type Fraction = Readonly<{ numerator: bigint; denominator: bigint }>
export function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing formal fixture dependency')
  return value
}
export function gcd(a: bigint, b: bigint): bigint {
  if (b !== 0n) return gcd(b, a % b)
  return a < 0n ? -a : a
}
export function fraction(n: bigint, d = 1n): Fraction {
  if (d < 0n) {
    n = -n
    d = -d
  }
  const divisor = gcd(n, d)
  return { numerator: n / divisor, denominator: d / divisor }
}
export function exact(value: number): Fraction {
  const v = dyadic(value)
  return v.exponent >= 0
    ? fraction(v.significand << BigInt(v.exponent))
    : fraction(v.significand, 1n << BigInt(-v.exponent))
}
export const plus = (a: Fraction, b: Fraction) =>
  fraction(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator
  )
export const minus = (a: Fraction, b: Fraction) =>
  plus(a, fraction(-b.numerator, b.denominator))
export function fixture(
  options: {
    authored?: boolean
    upperLengthDelta?: number
    sourceProfile?: 'solid-articulation/1' | 'solid-articulation/2'
  } = {}
) {
  const baseline = createSyntheticWalkingRobotDefinition({
    definitionId: 'constrained-default',
    sourceProfile: options.sourceProfile ?? 'solid-articulation/2'
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
export const times = (a: Fraction, b: Fraction) =>
  fraction(a.numerator * b.numerator, a.denominator * b.denominator)
export const over = (a: Fraction, b: Fraction) =>
  fraction(a.numerator * b.denominator, a.denominator * b.numerator)
export const negate = (a: Fraction) => fraction(-a.numerator, a.denominator)
export function cycleFixture(
  options: {
    authored?: boolean
    sourceProfile?: 'solid-articulation/1' | 'solid-articulation/2'
  } = {}
) {
  const { source, alpha } = fixture(options)
  const half = over(exact(alpha), exact(2))
  const s = evaluateExactPolynomialTrig('sin', half).value
  const c = evaluateExactPolynomialTrig('cos', half).value
  const norm = plus(times(s, s), times(c, c))
  const sigma = over(times(exact(2), times(s, c)), norm)
  const cosine = over(minus(times(c, c), times(s, s)), norm)
  const groups = [true, false].map((side) =>
    source.rig.legChains
      .filter(
        (chain) =>
          ((chain.side === 'left') !== (chain.station === 'middle')) === side
      )
      .map((chain) => chain.id)
  )
  const anchors = source.rig.legChains.map((chain) => {
    const contact = required(
      source.rig.contacts.feet.find((p) => p.part.bodyId === chain.footBodyId)
    )
    const transforms = chain.jointIds.map(
      (id) => required(source.rig.joints.find((j) => j.id === id)).frame
    )
    const foot = required(
      required(source.rig.bodies.find((b) => b.id === chain.footBodyId))
        .fixedFrame
    )
    const anchorOrigin = [0, 1, 2].map((axis) =>
      [...transforms, foot, contact.localFrame].reduce(
        (v, t) => plus(v, exact(t.position[axis])),
        exact(0)
      )
    )
    const upper = required(
      source.definition.legs.find(
        (l) => l.side === chain.side && l.station === chain.station
      )
    ).upper.length
    anchorOrigin[1] = plus(
      anchorOrigin[1],
      times(exact(upper), minus(exact(1), cosine))
    )
    const z = times(exact(upper), sigma)
    anchorOrigin[2] = plus(
      anchorOrigin[2],
      groups[0].includes(chain.id) ? negate(z) : z
    )
    return {
      chainId: chain.id,
      part: contact.part,
      patch: contact.patch,
      anchorOrigin
    }
  })
  return {
    source,
    raw: {
      format: 'walking-constrained-cycle/1',
      source,
      fixedJoints: source.rig.presets.stowed,
      baseOrientation: [exact(0), exact(0), exact(0), exact(1)],
      alpha: exact(alpha),
      groups,
      anchors,
      budget: { maxOperations: 10000000, maxBits: 24000 }
    }
  }
}

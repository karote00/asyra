import type { Point3 } from './greenhouse'
import type {
  WalkingEvidence,
  WalkingMassGeometry
} from './walking-robot-definition'

type Pair = [number, number]
export interface BasketContact {
  centre: Pair
  size: Pair
}
export interface BasketPlatform {
  fixedParts: WalkingMassGeometry[]
  adjustment: { width: Pair; length: Pair; height: Pair }
  supportTravel: { lateral: Pair; longitudinal: Pair }
  padSize: Pair
  maxOverhang: Pair
  latchEngagementRange: Pair
  evidence: WalkingEvidence
}
export interface BasketMountInput {
  basket: {
    basketId: string
    externalSize: [number, number, number]
    internalSize: [number, number, number]
    usableVolumeM3: number
    bottom: { kind: 'flat' | 'pads'; contacts: BasketContact[] }
    tareKg: number
    payloadKg: number
    tareCoM: [number, number, number]
    payloadCoM: [number, number, number]
    evidence: WalkingEvidence
  }
  stopSpan: Pair
  supports: Pair[]
  retention: {
    latched: boolean
    engagement: number
    evidence: WalkingEvidence
  }
}
const invalid = (): never => {
  throw new Error('Invalid or unsupported basket mount input')
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const exact = (
  value: unknown,
  keys: string[]
): value is Record<string, unknown> =>
  record(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))
const positive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
const nonnegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
const tuple = (value: unknown, length: number): value is number[] =>
  Array.isArray(value) &&
  value.length === length &&
  value.every((item) => typeof item === 'number' && Number.isFinite(item))
const range = (value: unknown): value is Pair =>
  tuple(value, 2) && value[0] < value[1]
const inside = (value: number, domain: Pair) =>
  value >= domain[0] && value <= domain[1]
const identity = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0
function evidence(value: unknown) {
  if (!record(value) || !identity(value.id)) return false
  if (value.kind === 'measured') return exact(value, ['kind', 'id'])
  return (
    exact(value, ['kind', 'id', 'label']) &&
    value.kind === 'synthetic' &&
    identity(value.label)
  )
}
function part(value: unknown) {
  return (
    exact(value, ['size', 'centre', 'massKg', 'localCoM']) &&
    tuple(value.size, 3) &&
    value.size.every(positive) &&
    tuple(value.centre, 3) &&
    positive(value.massKg) &&
    tuple(value.localCoM, 3)
  )
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

/** Schema admission only. It supplies no load rating or source-contact certificate. */
export function readBasketPlatform(raw: unknown): BasketPlatform {
  if (
    !exact(raw, [
      'fixedParts',
      'adjustment',
      'supportTravel',
      'padSize',
      'maxOverhang',
      'latchEngagementRange',
      'evidence'
    ])
  )
    return invalid()
  const adjustment = raw.adjustment,
    travel = raw.supportTravel
  if (
    !Array.isArray(raw.fixedParts) ||
    raw.fixedParts.length === 0 ||
    !raw.fixedParts.every(part) ||
    !exact(adjustment, ['width', 'length', 'height']) ||
    ![adjustment.width, adjustment.length, adjustment.height].every(
      (value) => range(value) && value[0] > 0
    ) ||
    !exact(travel, ['lateral', 'longitudinal']) ||
    !range(travel.lateral) ||
    !range(travel.longitudinal) ||
    !tuple(raw.padSize, 2) ||
    !raw.padSize.every(positive) ||
    !tuple(raw.maxOverhang, 2) ||
    !raw.maxOverhang.every(nonnegative) ||
    !range(raw.latchEngagementRange) ||
    raw.latchEngagementRange[0] < 0 ||
    !evidence(raw.evidence)
  )
    return invalid()
  return freeze(structuredClone(raw) as unknown as BasketPlatform)
}

/**
 * Checks declared planar contact coverage and finite adjustment inputs.
 * Physical retention, load distribution and material contact belong to later W2/W4.
 */
export function readBasketMountInput(
  platformRaw: unknown,
  raw: unknown
): BasketMountInput {
  const platform = readBasketPlatform(platformRaw)
  if (!exact(raw, ['basket', 'stopSpan', 'supports', 'retention']))
    return invalid()
  const basket = raw.basket,
    retention = raw.retention
  if (
    !exact(basket, [
      'basketId',
      'externalSize',
      'internalSize',
      'usableVolumeM3',
      'bottom',
      'tareKg',
      'payloadKg',
      'tareCoM',
      'payloadCoM',
      'evidence'
    ]) ||
    !identity(basket.basketId) ||
    !tuple(basket.externalSize, 3) ||
    !basket.externalSize.every(positive) ||
    !tuple(basket.internalSize, 3) ||
    !basket.internalSize.every(positive) ||
    !positive(basket.usableVolumeM3) ||
    !positive(basket.tareKg) ||
    !nonnegative(basket.payloadKg) ||
    !tuple(basket.tareCoM, 3) ||
    !tuple(basket.payloadCoM, 3) ||
    !evidence(basket.evidence) ||
    !exact(basket.bottom, ['kind', 'contacts']) ||
    (basket.bottom.kind !== 'flat' && basket.bottom.kind !== 'pads') ||
    !Array.isArray(basket.bottom.contacts) ||
    basket.bottom.contacts.length === 0 ||
    !tuple(raw.stopSpan, 2) ||
    !Array.isArray(raw.supports) ||
    raw.supports.length < 3 ||
    !raw.supports.every((value) => tuple(value, 2)) ||
    !exact(retention, ['latched', 'engagement', 'evidence']) ||
    retention.latched !== true ||
    !nonnegative(retention.engagement) ||
    !inside(retention.engagement, platform.latchEngagementRange) ||
    !evidence(retention.evidence)
  )
    return invalid()
  const outer = basket.externalSize,
    inner = basket.internalSize
  if (
    inner.some((value, index) => value > outer[index]) ||
    basket.usableVolumeM3 > inner[0] * inner[1] * inner[2] ||
    !inside(outer[0], platform.adjustment.width) ||
    !inside(outer[1], platform.adjustment.height) ||
    !inside(outer[2], platform.adjustment.length) ||
    raw.stopSpan[0] !== outer[0] ||
    raw.stopSpan[1] !== outer[2]
  )
    return invalid()
  const contacts = basket.bottom.contacts
  for (const contact of contacts) {
    if (
      !exact(contact, ['centre', 'size']) ||
      !tuple(contact.centre, 2) ||
      !tuple(contact.size, 2) ||
      !contact.size.every(positive)
    )
      return invalid()
    for (const axis of [0, 1]) {
      const extent = outer[axis === 0 ? 0 : 2] / 2
      if (Math.abs(contact.centre[axis]) + contact.size[axis] / 2 > extent)
        return invalid()
    }
  }
  const supports = raw.supports as Pair[]
  if (
    new Set(supports.map((point) => JSON.stringify(point))).size !==
    supports.length
  )
    return invalid()
  for (const support of supports) {
    if (
      !inside(support[0], platform.supportTravel.lateral) ||
      !inside(support[1], platform.supportTravel.longitudinal)
    )
      return invalid()
    const covered = (contacts as unknown as BasketContact[]).some((contact) =>
      [0, 1].every(
        (axis) =>
          Math.abs(support[axis] - contact.centre[axis]) +
            platform.padSize[axis] / 2 <=
          contact.size[axis] / 2
      )
    )
    if (!covered) return invalid()
  }
  // Reject collinear support inputs; this is not a stability or CoM assessment.
  const first = supports[0]
  if (
    !supports.some((a) =>
      supports.some(
        (b) =>
          (a[0] - first[0]) * (b[1] - first[1]) !==
          (a[1] - first[1]) * (b[0] - first[0])
      )
    )
  )
    return invalid()
  for (const axis of [0, 1]) {
    const half = platform.padSize[axis] / 2
    const low = Math.min(...supports.map((point) => point[axis] - half))
    const high = Math.max(...supports.map((point) => point[axis] + half))
    const extent = outer[axis === 0 ? 0 : 2] / 2
    if (
      extent + low > platform.maxOverhang[axis] ||
      extent - high > platform.maxOverhang[axis]
    )
      return invalid()
  }
  return freeze(structuredClone(raw) as unknown as BasketMountInput)
}

const synthetic = (): WalkingEvidence => ({
  kind: 'synthetic',
  id: 'basket-geometry-candidate',
  label: 'Synthetic basket geometry - not hardware capability'
})
export function createSyntheticBasketPlatform(): BasketPlatform {
  const fixedPart = (
    size: Point3,
    centre: Point3,
    massKg: number
  ): WalkingMassGeometry => ({ size, centre, massKg, localCoM: [0, 0, 0] })
  return readBasketPlatform({
    fixedParts: [
      fixedPart([0.68, 0.04, 0.72], [0, 0.2, 0], 2),
      fixedPart([0.04, 0.06, 0.08], [-0.36, 0.24, 0], 0.2),
      fixedPart([0.04, 0.06, 0.08], [0.36, 0.24, 0], 0.2)
    ],
    adjustment: {
      width: [0.18, 0.65],
      length: [0.25, 1.05],
      height: [0.08, 0.3]
    },
    supportTravel: { lateral: [-0.25, 0.25], longitudinal: [-0.34, 0.34] },
    padSize: [0.04, 0.04],
    maxOverhang: [0.2, 0.2],
    latchEngagementRange: [0.005, 0.03],
    evidence: synthetic()
  })
}
/** Creates mutable synthetic scenario input, never a mount or payload authorization. */
export function createSyntheticBasketInput(
  size: [number, number, number]
): BasketMountInput {
  if (!tuple(size, 3) || size.some((value) => value <= 0.02)) return invalid()
  const [width, height, length] = size
  const internalSize: [number, number, number] = [
    width - 0.02,
    height - 0.02,
    length - 0.02
  ]
  const x = Math.min(width / 4, 0.24),
    z = Math.min(length * 0.3, 0.32)
  return {
    basket: {
      basketId: 'synthetic-basket',
      externalSize: [...size],
      internalSize,
      usableVolumeM3: internalSize[0] * internalSize[1] * internalSize[2] * 0.9,
      bottom: {
        kind: 'flat',
        contacts: [{ centre: [0, 0], size: [width, length] }]
      },
      tareKg: 1.5,
      payloadKg: 0,
      tareCoM: [0, height / 2, 0],
      payloadCoM: [0, height / 2, 0],
      evidence: synthetic()
    },
    stopSpan: [width, length],
    supports: [
      [-x, -z],
      [x, -z],
      [-x, z],
      [x, z]
    ],
    retention: { latched: true, engagement: 0.015, evidence: synthetic() }
  }
}

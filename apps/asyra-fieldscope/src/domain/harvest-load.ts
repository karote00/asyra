export interface CrateLoad {
  baseMass: number
  payload: number
  nextFruit: number
  payloadLimit: number
  fill: number
  returnFill: number
  latched: boolean
  scaleTrusted: boolean
  track: number
  baseHeight: number
  payloadHeight: number
  baseOffset: number
  payloadOffset: number
  roll: number
  lateralAcceleration: number
  uncertainty: number
}

/** Stowed-pose lateral screening; no contact or dynamic stability solver. */
export function assessCrateLoad(load: CrateLoad) {
  for (const key of [
    'baseMass',
    'payloadLimit',
    'track',
    'returnFill'
  ] as const)
    if (!Number.isFinite(load[key]) || load[key] <= 0)
      throw new Error(`Invalid load ${key}`)
  for (const key of [
    'payload',
    'nextFruit',
    'fill',
    'baseHeight',
    'payloadHeight',
    'uncertainty'
  ] as const)
    if (!Number.isFinite(load[key]) || load[key] < 0)
      throw new Error(`Invalid load ${key}`)
  for (const key of [
    'baseOffset',
    'payloadOffset',
    'roll',
    'lateralAcceleration'
  ] as const)
    if (!Number.isFinite(load[key])) throw new Error(`Invalid load ${key}`)
  if (
    load.fill > 1 ||
    load.returnFill > 1 ||
    Math.abs(load.roll) >= Math.PI / 2 ||
    typeof load.latched !== 'boolean' ||
    typeof load.scaleTrusted !== 'boolean'
  )
    throw new Error('Invalid crate observation')
  const reserve = (payload: number) => {
    const mass = load.baseMass + payload
    const x =
      (load.baseMass * load.baseOffset + payload * load.payloadOffset) / mass
    const height =
      (load.baseMass * load.baseHeight + payload * load.payloadHeight) / mass
    return (
      load.track / 2 -
      Math.abs(x) -
      height * Math.tan(Math.abs(load.roll)) -
      (height * Math.abs(load.lateralAcceleration)) / 9.80665 -
      load.uncertainty
    )
  }
  const lateralReserve = reserve(load.payload)
  const projectedReserve = reserve(load.payload + load.nextFruit)
  if (
    ![load.baseMass + load.payload, lateralReserve, projectedReserve].every(
      Number.isFinite
    )
  )
    throw new Error('Load arithmetic exceeds finite range')
  const stop: string[] = []
  const exchange: string[] = []
  if (!load.latched) stop.push('crate-unlatched')
  if (!load.scaleTrusted) stop.push('untrusted-scale')
  if (load.payload > load.payloadLimit) stop.push('overload')
  if (lateralReserve <= 0) stop.push('lateral-reserve')
  if (
    load.payload >= load.payloadLimit ||
    load.payload + load.nextFruit > load.payloadLimit
  )
    exchange.push('payload-capacity')
  if (load.fill >= load.returnFill) exchange.push('fill-capacity')
  if (projectedReserve <= 0) exchange.push('projected-lateral-reserve')
  let action: 'stop' | 'exchange' | 'continue-screening' = 'continue-screening'
  if (exchange.length) action = 'exchange'
  if (stop.length) action = 'stop'
  return {
    action,
    stop,
    exchange,
    totalMass: load.baseMass + load.payload,
    lateralReserve,
    projectedReserve
  }
}

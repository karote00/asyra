export interface EnergyBudget {
  nominalWh: number
  usableFraction: number
  soc: number
  socUncertainty: number
  nextWorkWh: number
  returnWh: number
  contingencyWh: number
  reserveWh: number
  batteryFresh: boolean
  returnPathAdmitted: boolean
  dockAvailable: boolean
}

/** Conservative budget arithmetic; measured consumption remains a caller obligation. */
export function assessHarvestEnergy(budget: EnergyBudget) {
  for (const key of ['nominalWh', 'usableFraction', 'reserveWh'] as const)
    if (!Number.isFinite(budget[key]) || budget[key] <= 0)
      throw new Error(`Invalid energy ${key}`)
  for (const key of [
    'soc',
    'socUncertainty',
    'nextWorkWh',
    'returnWh',
    'contingencyWh'
  ] as const)
    if (!Number.isFinite(budget[key]) || budget[key] < 0)
      throw new Error(`Invalid energy ${key}`)
  for (const key of ['usableFraction', 'soc', 'socUncertainty'] as const)
    if (budget[key] > 1) throw new Error(`Invalid energy fraction ${key}`)
  for (const key of [
    'batteryFresh',
    'returnPathAdmitted',
    'dockAvailable'
  ] as const)
    if (typeof budget[key] !== 'boolean')
      throw new Error(`Invalid energy observation ${key}`)
  const usableWh = budget.nominalWh * budget.usableFraction
  const availableWh = usableWh * Math.max(0, budget.soc - budget.socUncertainty)
  const returnRequiredWh =
    budget.returnWh + budget.contingencyWh + budget.reserveWh
  const missionRequiredWh = returnRequiredWh + budget.nextWorkWh
  const minimumDispatchSoc =
    missionRequiredWh / usableWh + budget.socUncertainty
  if (
    ![
      usableWh,
      availableWh,
      returnRequiredWh,
      missionRequiredWh,
      minimumDispatchSoc
    ].every(Number.isFinite)
  )
    throw new Error('Energy arithmetic exceeds finite range')
  const reasons: string[] = []
  if (!budget.batteryFresh) reasons.push('stale-battery')
  if (!budget.returnPathAdmitted) reasons.push('return-path-unavailable')
  if (!budget.dockAvailable) reasons.push('dock-unavailable')
  if (availableWh < returnRequiredWh) reasons.push('insufficient-return-energy')
  let action: 'hold' | 'return-to-charge' | 'continue-screening' =
    'continue-screening'
  if (availableWh < missionRequiredWh) action = 'return-to-charge'
  if (reasons.length) action = 'hold'
  return {
    action,
    reasons,
    usableWh,
    availableWh,
    returnRequiredWh,
    missionRequiredWh,
    minimumDispatchSoc,
    undersized: minimumDispatchSoc > 1
  }
}

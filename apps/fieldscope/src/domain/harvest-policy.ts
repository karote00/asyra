export interface HarvestObservations {
  energy: 'hold' | 'return-to-charge' | 'continue-screening'
  emergencyStop: boolean
  person: boolean
  unstable: boolean
  crateUnlatched: boolean
  sensorsFresh: boolean
  communicationFresh: boolean
  obstacle: boolean
  toolContact: boolean
  fruitAndStemVerified: boolean
  load: 'stop' | 'exchange' | 'continue-screening'
}

/** Advisory priority only. Return travel still needs a stowed tool and admitted route. */
export function adviseHarvestAction(observations: HarvestObservations) {
  const keys: (keyof HarvestObservations)[] = [
    'emergencyStop',
    'person',
    'unstable',
    'crateUnlatched',
    'sensorsFresh',
    'communicationFresh',
    'obstacle',
    'toolContact',
    'fruitAndStemVerified'
  ]
  if (
    !['hold', 'return-to-charge', 'continue-screening'].includes(
      observations.energy
    )
  )
    throw new Error('Invalid energy advice')
  if (!['stop', 'exchange', 'continue-screening'].includes(observations.load))
    throw new Error('Invalid load advice')
  for (const key of keys)
    if (typeof observations[key] !== 'boolean')
      throw new Error(`Invalid observation ${key}`)
  let action:
    | 'protect-people'
    | 'immobilize'
    | 'await-observation'
    | 'wait-or-replan'
    | 'hold-tool'
    | 'observe-or-defer'
    | 'return-to-dock'
    | 'return-to-charge'
    | 'continue-screening' = 'continue-screening'
  if (!observations.fruitAndStemVerified) action = 'observe-or-defer'
  if (observations.load === 'exchange') action = 'return-to-dock'
  if (observations.energy === 'return-to-charge') action = 'return-to-charge'
  if (observations.energy === 'hold') action = 'await-observation'
  if (observations.toolContact) action = 'hold-tool'
  if (observations.obstacle) action = 'wait-or-replan'
  if (!observations.sensorsFresh || !observations.communicationFresh)
    action = 'await-observation'
  if (
    observations.unstable ||
    observations.crateUnlatched ||
    observations.load === 'stop'
  )
    action = 'immobilize'
  if (observations.person || observations.emergencyStop)
    action = 'protect-people'
  return {
    action,
    inhibitCutting: action !== 'continue-screening',
    stopTravel:
      action !== 'continue-screening' &&
      action !== 'return-to-dock' &&
      action !== 'return-to-charge',
    requireReturnAdmission:
      action === 'return-to-dock' || action === 'return-to-charge'
  }
}

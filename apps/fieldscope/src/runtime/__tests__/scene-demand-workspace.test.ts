import { expect, it } from 'vitest'
import core from '@asyra/core'
import { createSceneDemandWorkspace } from '../scene-demand-workspace'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../../domain/farm-configuration'

it('keeps lazy observation source work zero for the unknown route lifetime', () => {
  const farm = validateConfiguration(DEFAULT_CONFIGURATION)
  const scene = Object.freeze({
    revision: 1,
    meshes: Object.freeze([]),
    plants: Object.freeze([]),
    fruits: Object.freeze([])
  })
  const workspace = createSceneDemandWorkspace(
    () => farm,
    () => scene
  )
  try {
    const demand = workspace.get()
    for (let index = 0; index < 100; index++)
      expect(workspace.get()).toBe(demand)
    const observation = workspace.prepareObservationSpace()
    expect(observation.status).toBe('unknown')
    expect(workspace.prepareObservationSpace()).toBe(observation)
    expect(
      Object.values(workspace.getSourceWork()).every((value) => value === 0)
    ).toBe(true)
    expect(workspace.isCurrentObservationSpace(observation)).toBe(true)
    workspace.close()
    expect(workspace.isCurrentObservationSpace(observation)).toBe(false)
    expect(() => workspace.prepareObservationSpace()).toThrow()
  } finally {
    workspace.close()
    workspace.unregister()
    core.unregisterFeature('scene-demand.configuration.change')
  }
})

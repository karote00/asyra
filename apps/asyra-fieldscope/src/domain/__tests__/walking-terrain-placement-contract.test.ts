import { expect, it } from 'vitest'
import { readWalkingTerrainPlacementRequest } from '../walking-terrain-placement-contract'

it('requires an explicit source-bound terrain placement request', () => {
  expect(() => readWalkingTerrainPlacementRequest(null)).toThrow()
})

import { expect, it } from 'vitest'
import { walkingActionFixture } from './walking-observation-test-fixtures'

it('declared synthetic sight volume below route height is obstacle-inventory evidence only', () => {
  const f = walkingActionFixture('actual-site')
  const walking = f
  const domain = {
    min: [0, -f.demand.farm.height, 0] as const,
    max: [100, 20, 10] as const
  }
  f.dynamics.prepare({ ...f.world, domain })
  const request = {
    ...walking.input,
    actionBounds: {
      min: [2.44, -0.21, 1.5] as const,
      max: [2.46, -0.19, 1.55] as const
    },
    camera: {
      ...f.input.camera,
      pose: {
        position: [2.45, -0.2, 1] as const,
        rotation: [0, 0, 0, 1] as const
      }
    }
  }
  const result = walking.observations.observeActionVolume(
    walking.context,
    request
  )
  expect(result.coverage).toBe('complete-empty')
  expect(result.detections).toEqual([])
  expect(result.work.sightQueries).toBe(1)
  const space = walking.getSpace()
  if (!space) throw new Error('Missing lazy obstacle inventory')
  expect(space.provenance).toBe('w1-canonical-obstacles/1')
  expect(
    space.sources.some(
      (v) => v.mesh.layer === 'soil' || v.mesh.layer === 'drains'
    )
  ).toBe(false)
  const outside = walking.observations.observeActionVolume(walking.context, {
    ...request,
    actionBounds: {
      min: [2.44, domain.min[1] - 2, 1.5],
      max: [2.46, domain.min[1] - 1, 1.55]
    }
  })
  expect(outside.coverage).not.toBe('complete-empty')
  expect(outside.reasons).toContain('outside-observation-domain')
}, 30000)
it('walking observation shares the action kernel with exact walking currentness and no legacy context', () => {
  const { observations, context, input, operating, prepareSpace } =
    walkingActionFixture('actual-site')
  const result = observations.observeActionVolume(context, input)
  expect(prepareSpace).toHaveBeenCalledTimes(1)
  expect(result.format).toBe('walking-action-volume-observation/1')
  expect(result.context).toBe(context)
  expect(result.coverage).toBe('complete-empty')
  expect(observations.isCurrent(result)).toBe(true)
  const again = observations.observeActionVolume(context, input)
  expect(again.work.membershipBuilds).toBe(0)
  expect(again.work.cameraFrames).toBe(1)
  expect(again.work.sightQueries).toBe(1)
  expect(operating.transitScreen.work.builds).toBe(1)
  expect(
    observations.observeActionVolume(context, {
      ...input,
      optics: { ...input.optics, illumination: null }
    }).coverage
  ).not.toBe('complete-empty')
  operating.clear()
  expect(observations.isCurrent(result)).toBe(false)
}, 30000)

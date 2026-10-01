import { expect, it } from 'vitest'
import { readWalkingNonlinearMotionRequest } from '../../domain/walking-motion-contract'
import { WalkingMountedCrateOwner } from '../../domain/walking-mounted-crate'
import { DEFAULT_ROBOT } from '../../domain/robot-configuration'
import { nonlinearFixture } from './walking-motion-test-fixtures'

const evidence = (id: string) => ({
  kind: 'synthetic' as const,
  id,
  label: `${id} - synthetic walking admission evidence`
})

it('mounted crate consumer admits only the current original source artifact', () => {
  const f = nonlinearFixture('solid-articulation/2', true)
  const mountOwner = new WalkingMountedCrateOwner(f.sourceOwner)
  const crate = mountOwner.prepare(f.source, {
    format: 'walking-mounted-crate-request/1',
    dimensions: {
      width: DEFAULT_ROBOT.width,
      length: DEFAULT_ROBOT.length,
      height: DEFAULT_ROBOT.height
    },
    minimumClearance: { metres: 0.003125, evidence: evidence('mounted-gap') },
    retention: evidence('mounted-retention'),
    massIdentity: 'mounted-mass'
  })
  const raw = {
    ...f.raw,
    load: { ...f.raw.load, crate: { kind: 'mounted', artifact: crate } }
  }
  const current = { owner: f.cycleOwner, cycle: f.cycle }
  const mounted = { owner: mountOwner, crate }
  const admitted = readWalkingNonlinearMotionRequest(
    raw,
    f.source,
    f.demand,
    current,
    mounted
  )
  expect(admitted.load.crate.kind).toBe('mounted')
  if (admitted.load.crate.kind !== 'mounted')
    throw new Error('Missing mounted input')
  expect(admitted.load.crate.artifact).toBe(crate)
  expect(admitted.load.crate.artifact.geometry.parts).toHaveLength(11)
  expect(() =>
    readWalkingNonlinearMotionRequest(raw, f.source, f.demand, current)
  ).toThrow()
  expect(() =>
    readWalkingNonlinearMotionRequest(
      {
        ...raw,
        load: {
          ...raw.load,
          crate: { kind: 'mounted', artifact: { ...crate } }
        }
      },
      f.source,
      f.demand,
      current,
      mounted
    )
  ).toThrow()
  mountOwner.clear()
  expect(() =>
    readWalkingNonlinearMotionRequest(
      admitted,
      f.source,
      f.demand,
      current,
      mounted
    )
  ).toThrow()
}, 30000)

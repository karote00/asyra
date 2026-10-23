import { expect, it } from 'vitest'
import { WalkingConstrainedCycleOwner } from '../../domain/walking-constrained-kinematics'
import { cycleFixture } from '../../domain/__tests__/walking-constrained-kinematics-test-fixtures'
import {
  WalkingRuntimeMonitorOwner,
  type WalkingRuntimeMonitorProfile
} from '../walking-runtime-monitor'

function fixture() {
  const { source, raw } = cycleFixture({
    sourceProfile: 'solid-articulation/2'
  })
  const cycleOwner = new WalkingConstrainedCycleOwner()
  const cycle = cycleOwner.prepare(source, raw)
  const load = Object.freeze({
    kind: 'empty' as const,
    id: 'synthetic-monitor-load'
  })
  const context = {
    source,
    load,
    massProperties: source.massProperties,
    cycleOwner,
    cycle,
    phase: 0,
    now: 1
  }
  let current = true
  const owner = new WalkingRuntimeMonitorOwner(
    (value) =>
      current &&
      value.source === source &&
      value.load === load &&
      value.massProperties === source.massProperties
  )
  const profile: WalkingRuntimeMonitorProfile = {
    format: 'walking-runtime-monitor-profile/1',
    id: 'synthetic-monitor-profile',
    assumption: 'Explicit synthetic force and orientation sensor limits',
    validFrom: 0,
    validUntil: 10,
    limits: {
      maxTiltRadians: 0.2,
      maxAngularRateRadiansPerSecond: 0.5,
      minContactForce: 1,
      maxContactForce: 1000,
      maxSampleGap: 0.5
    },
    uncertainty: { orientationRadians: 0.001, contactForce: 0.1 }
  }
  const contacts = cycle.recipe.groups[0].map((chainId) => {
    const anchor = cycle.recipe.anchors.find((a) => a.chainId === chainId)
    if (!anchor) throw new Error('Missing canonical support')
    return {
      part: anchor.part,
      patch: anchor.patch,
      force: { low: 20, high: 21 }
    }
  })
  const sample = {
    format: 'synthetic-walking-runtime-sample/1' as const,
    assumption:
      'Explicit current synthetic orientation and support-force samples',
    orientations: [
      { at: 0.9, rotation: [0, 0, 0, 1] as const },
      { at: 1, rotation: [0, 0, 0, 1] as const }
    ],
    contacts
  }
  owner.configure(profile)
  return {
    source,
    context,
    cycleOwner,
    owner,
    profile,
    sample,
    retire: () => {
      current = false
    }
  }
}

it('walking runtime monitor computes fresh bounded orientation and three exact support contacts', () => {
  const f = fixture()
  const first = f.owner.evaluate(f.context, f.sample)
  expect(first.status).toBe('within-synthetic-profile')
  expect(first.source).toBe(f.source)
  expect(first.load).toBe(f.context.load)
  expect(first.massProperties).toBe(f.source.massProperties)
  expect(first.cycle).toBe(f.context.cycle)
  expect(first.values.tilt.high).toBeLessThan(f.profile.limits.maxTiltRadians)
  expect(first.values.angularRate.high).toBeLessThan(
    f.profile.limits.maxAngularRateRadiansPerSecond
  )
  expect(first.work).toMatchObject({
    orientationSamples: 2,
    stanceContacts: 3,
    farmVisits: 0,
    geometryVisits: 0
  })
  expect(first.work.arithmeticOperations).toBeGreaterThan(0)
  expect(f.owner.read(f.context, first)).toBe(first)
  const nextContext = { ...f.context, now: 1.1 }
  const second = f.owner.evaluate(nextContext, {
    ...f.sample,
    orientations: [
      { at: 1, rotation: [0, 0, 0, 1] },
      { at: 1.1, rotation: [0, 0, 0, 1] }
    ]
  })
  expect(second.status).toBe('within-synthetic-profile')
  expect(second.work.orientationSamples).toBe(2)
  expect(second.work.stanceContacts).toBe(3)
  expect(f.owner.read(f.context, first)).toBeUndefined()
  expect(f.owner.read(nextContext, { ...second })).toBeUndefined()
  f.retire()
  expect(f.owner.read(nextContext, second)).toBeUndefined()
  f.owner.close()
  expect(() => f.owner.evaluate(nextContext, f.sample)).toThrow()
})

it('walking runtime monitor holds missing foreign zero-force tilted fast or stale sensor evidence', () => {
  const f = fixture()
  const unknown = (sample: typeof f.sample) => {
    const result = f.owner.evaluate(f.context, sample)
    expect(result.status).not.toBe('within-synthetic-profile')
    return result
  }
  expect(
    unknown({ ...f.sample, contacts: f.sample.contacts.slice(1) }).status
  ).toBe('unknown')
  expect(
    unknown({
      ...f.sample,
      contacts: f.sample.contacts.map((v, i) =>
        i ? v : { ...v, patch: { ...v.patch } }
      )
    }).status
  ).toBe('unknown')
  unknown({
    ...f.sample,
    contacts: f.sample.contacts.map((v, i) =>
      i ? v : { ...v, force: { low: 0, high: 20 } }
    )
  })
  unknown({
    ...f.sample,
    orientations: [
      { at: 0.1, rotation: [0, 0, 0, 1] },
      f.sample.orientations[1]
    ]
  })
  unknown({
    ...f.sample,
    orientations: [f.sample.orientations[1], f.sample.orientations[0]]
  })
  const tilted = {
    ...f.sample,
    orientations: [
      { at: 0.9, rotation: [0, 0, 0, 1] as const },
      { at: 1, rotation: [1, 0, 0, 0] as const }
    ]
  }
  expect(f.owner.evaluate(f.context, tilted).status).toBe('hold')
  const turning = f.owner.evaluate(f.context, {
    ...f.sample,
    orientations: [
      f.sample.orientations[0],
      { at: 1, rotation: [0, Math.sin(0.1), 0, Math.cos(0.1)] }
    ]
  })
  expect(turning.status).toBe('hold')
  expect(turning.values.tilt.high).toBeLessThan(f.profile.limits.maxTiltRadians)
  expect(turning.reasons).toContain('synthetic-rate-bound-not-within-profile')
  expect(
    unknown({ ...f.sample, orientations: f.sample.orientations.slice(1) })
      .status
  ).toBe('unknown')
  expect(
    f.owner.evaluate({ ...f.context, load: { ...f.context.load } }, f.sample)
      .status
  ).toBe('unknown')
  expect(
    f.owner.evaluate(
      { ...f.context, massProperties: { ...f.source.massProperties } },
      f.sample
    ).status
  ).toBe('unknown')
  expect(
    f.owner.evaluate({ ...f.context, cycle: { ...f.context.cycle } }, f.sample)
      .status
  ).toBe('unknown')
  expect(f.owner.evaluate({ ...f.context, now: 11 }, f.sample).status).toBe(
    'unknown'
  )
  expect(() =>
    f.owner.configure({ ...f.profile, safe: true } as typeof f.profile)
  ).toThrow()
  f.owner.close()
  f.cycleOwner.dispose()
})

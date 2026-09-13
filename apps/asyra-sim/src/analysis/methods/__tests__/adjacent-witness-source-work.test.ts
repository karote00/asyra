import { afterEach, expect, it, vi } from 'vitest'
import * as poses from '../../../domain/kinematic-algebra'
import * as convex from '../convex-query'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())
it('preserves complete adjacent source evidence with every publication and transport charge', async () => {
  const snapshot = await representativeSnapshot(0)
  const pair = snapshot.pairs.find(
    (pair) =>
      pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === 'obstacle-11'
  )
  if (!pair) throw new Error('Missing source pair')
  const frames = snapshot.trajectory.keyframes
  const query = {
    workcell: snapshot.workcell,
    trajectory: snapshot.trajectory,
    a: pair.a,
    b: pair.b,
    interval: [frames[113].time, frames[115].time] as const
  }
  const settings = {
    ...snapshot.method.settings,
    threshold: snapshot.rule.minimumClearance,
    maxIntervals: snapshot.budget.maxIntervals
  }
  const run = (enabled: boolean) => {
    vi.restoreAllMocks()
    const context = new OriginalMeshQuery()
    if (!enabled) {
      const make = context.createStaticSampler.bind(context)
      context.createStaticSampler = (settings) => {
        const sample = make(settings)
        return (a, b, origin, source) => sample(a, b, origin, source)
      }
    }
    let time = NaN,
      targetWork = 0,
      targetSourceWork = 0,
      targetConvex = 0
    const interpolate = poses.interpolateSegment
    vi.spyOn(poses, 'interpolateSegment').mockImplementation((...args) => {
      if (!Array.isArray(args[2]))
        throw new Error('Expected interval pose input')
      time = args[2][0] === args[2][1] ? args[2][0] : NaN
      return interpolate(...args)
    })
    const solve = convex.convexDistance
    vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
      if (time === frames[113].time) targetConvex++
      return solve(...args)
    })
    const categories = {
      distance: 0,
      lower: 0,
      source: 0,
      handoff: 0,
      derivation: 0
    }
    const distance = context.distance.bind(context),
      lower = context.lowerOver.bind(context)
    context.distance = (...args) => {
      const before = context.work
      try {
        return distance(...args)
      } finally {
        const delta = context.work - before
        categories.distance += delta
        if (time === frames[113].time) targetWork += delta
      }
    }
    context.lowerOver = (...args) => {
      const before = context.work
      try {
        return lower(...args)
      } finally {
        categories.lower += context.work - before
      }
    }
    for (const [method, category] of [
      ['chargeSourceWitness', 'source'],
      ['chargeEvidenceHandoff', 'handoff'],
      ['chargeEvidenceDerivation', 'derivation']
    ] as const) {
      const charge = context[method].bind(context)
      context[method] = () => {
        const before = context.work
        try {
          return charge()
        } finally {
          const delta = context.work - before
          categories[category] += delta
          if (category === 'source' && time === frames[113].time)
            targetSourceWork += delta
        }
      }
    }
    const result = queryOriginalPartPair(
      query,
      settings,
      () => undefined,
      context
    )
    expect(Object.values(categories).reduce((a, b) => a + b, 0)).toBe(
      context.work
    )
    return {
      result,
      work: context.work,
      targetWork: targetWork + targetSourceWork,
      targetSourceWork,
      targetConvex,
      categories
    }
  }
  const control = run(false),
    candidate = run(true)
  // eslint-disable-next-line no-console -- bounded complete source evidence and exact cost categories
  console.info(
    JSON.stringify({ profile: 'adjacent-source-work', control, candidate })
  )
  expect(control.result.coverage).toBe('complete')
  expect(candidate.result).toEqual(control.result)
  expect(candidate.targetWork).toBeLessThanOrEqual(control.targetWork * 0.8)
  expect(candidate.targetConvex).toBeLessThanOrEqual(control.targetConvex)
  expect(candidate.work).toBeLessThan(control.work)
  expect(candidate.categories.source - control.categories.source).toBe(7)
}, 20000)

import { expect, it } from 'vitest'
import { WalkingMotionOwner } from '../walking-motion'
import { mountedConsumerFixture } from './walking-motion-test-fixtures'

it('phase-root canonical coverage retains original required pairs without crossing phases', async (context) => {
  await context.annotate(
    'Starting bounded constant-root integration proof',
    'info'
  )
  const f = mountedConsumerFixture()
  const owner = new WalkingMotionOwner({
    getCurrentSceneDemand: () => f.demand,
    getCurrentWalkingRobotSource: () => f.source,
    getCurrentWalkingCycle: () => f.current,
    getCurrentMountedCrate: () => f.mounted
  })
  const result = owner.prepare({
    ...f.raw,
    budget: { ...f.raw.budget, maxPhaseNodes: 2, maxSubdivisions: 1 },
    load: { ...f.raw.load, crate: { kind: 'mounted', artifact: f.crate } }
  })
  if (!('format' in result) || result.format !== 'walking-motion-admission/3')
    throw new Error('Missing canonical nonlinear result')
  const relations = result.sourceRelations
  const selected = relations.phases[0].pairs.filter(
    (p) =>
      relations.inventory[p.first].part?.id === 'lift-rail-negative' &&
      relations.inventory[p.first].region.indexStart === 0 &&
      relations.inventory[p.second].part?.id === 'carriage' &&
      relations.inventory[p.second].region.indexStart === 324
  )
  const summary = JSON.stringify({
    coverage: relations.coverage,
    reasons: relations.reasons,
    selected: selected.map((p) => ({
      kind: p.kind,
      proofs: p.proofs.map((q) => ({
        kind: q.kind,
        low:
          q.parameter.low.numerator.toString() +
          '/' +
          q.parameter.low.denominator.toString(),
        high:
          q.parameter.high.numerator.toString() +
          '/' +
          q.parameter.high.denominator.toString()
      }))
    }))
  })
  process.stdout.write(summary + '\n')
  expect(selected, summary).toHaveLength(1)
  expect(['exactSeparated', 'declaredBoundary']).toContain(selected[0].kind)
  expect(selected[0].proofs).toHaveLength(1)
  expect(selected[0].proofs[0].parameter.low).toEqual({
    numerator: 0n,
    denominator: 1n
  })
  expect(selected[0].proofs[0].parameter.high).toEqual({
    numerator: 1n,
    denominator: 1n
  })
  const c = relations.coverage
  expect(relations.work.globalFixedReuses).toBeGreaterThan(0)
  const phasePair = (phase: number) =>
    relations.phases[phase].pairs.find(
      (p) =>
        relations.inventory[p.first].part?.id === 'left-front-abduction-pin' &&
        relations.inventory[p.first].region.indexStart === 24 &&
        relations.inventory[p.second].part?.id ===
          'left-front-abduction-sleeve' &&
        relations.inventory[p.second].region.indexStart === 36
    )
  const supportPair = phasePair(0),
    swingPair = phasePair(1)
  process.stdout.write(
    JSON.stringify({ phaseRootPairs: [supportPair, swingPair] }, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ) + '\n'
  )
  expect(supportPair?.kind).toBe('exactSeparated')
  expect(supportPair?.proofs).toHaveLength(1)
  expect(supportPair?.proofs[0].parameter).toEqual({
    low: { numerator: 0n, denominator: 1n },
    high: { numerator: 1n, denominator: 1n }
  })
  expect(swingPair?.kind).toBe('unknown')
  expect(
    swingPair?.proofs.some(
      (p) => p.reason === 'nonlinear-source-interval-unproved'
    )
  ).toBe(true)
  expect(c.required).toBe(
    c.strictBounds +
      c.exactSeparated +
      c.declaredBoundary +
      c.blocked +
      c.targetRefinement +
      c.unknown +
      c.unvisited
  )
}, 300000)

import { expect, it } from 'vitest'
import { createSyntheticExample } from '../../../samples/synthetic-workcell'
import { createSyntheticExperimentPresets } from '../../../samples/synthetic-experiment'
import { inspectHistoricalExperiment } from '../../analysis/preflight'
import { validateTrajectory } from '../workcell'

it('provides six distinct, valid studies that include every workcell part', () => {
  const example = createSyntheticExample('sample-test')
  const presets = createSyntheticExperimentPresets(example)
  expect(presets.map((preset) => preset.name)).toEqual([
    'Synthetic clearance study',
    'Shoulder reach study',
    'Elbow folding study',
    'Wrist orientation study',
    'Tool and table sweep',
    'Tool and table collision'
  ])
  expect(
    new Set(presets.map(({ draft }) => JSON.stringify(draft.trajectory))).size
  ).toBe(6)
  for (const { draft } of presets) {
    expect(() =>
      validateTrajectory(example.workcell, draft.trajectory)
    ).not.toThrow()
    expect(draft.interval).toEqual([0, 8])
    expect(draft.sourceUnits.joints).toEqual(
      Object.fromEntries(
        example.workcell.bodies
          .filter((body) => body.joint.kind !== 'fixed')
          .map((body) => [body.id, 'rad'])
      )
    )
    const preflight = inspectHistoricalExperiment(example.workcell, {
      ...draft,
      revision: 1,
      rule: { ...draft.rule, revision: 1 }
    })
    expect(preflight.blockers).toEqual([])
    expect(preflight.pairs.length).toBeGreaterThan(0)
    const included = new Set([
      ...draft.scope.primaryBodyIds,
      ...draft.scope.influencingBodyIds
    ])
    const checked = new Set(
      preflight.pairs.flatMap((pair) => [pair.a.bodyId, pair.b.bodyId])
    )
    const allParts = new Set(example.workcell.bodies.map((body) => body.id))

    expect(included).toEqual(allParts)
    expect(checked).toEqual(allParts)
    expect(draft.scope.acknowledgedExcludedVisibleBodyIds).toEqual([])
    expect(draft.scope.selfCollision).toBe(true)
    expect(draft.scope.externalCollision).toBe(true)
    expect(draft.scope.excludedPairs).toEqual(
      example.excludedPairs.map((pair) => ({ version: 1, ...pair }))
    )
  }
})

it('keeps all preset drafts independent without mutating the source example', () => {
  const example = createSyntheticExample()
  const original = structuredClone(example)
  const presets = createSyntheticExperimentPresets(example)
  const otherDrafts = structuredClone(presets.slice(1))
  Object.assign(presets[0].draft.trajectory.keyframes[0].joints, {
    'example:joint-1': 99
  })
  presets[0].draft.scope.primaryBodyIds = ['new-body']
  presets[0].draft.rule.minimumClearance = 100
  expect(presets.slice(1)).toEqual(otherDrafts)
  expect(example).toEqual(original)
  expect(
    createSyntheticExperimentPresets(example)[0].draft.rule.minimumClearance
  ).toBe(0.02)
})

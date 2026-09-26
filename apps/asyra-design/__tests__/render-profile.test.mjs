import assert from 'node:assert/strict'
import test from 'node:test'
import { assertRenderDeltaContracts } from '../e2e/render-contracts.mjs'
import { summarize, summarizeStrategyGeometry } from '../e2e/render-profile.mjs'

const createRenderDeltaSummary = () => ({
  sampleFrames: 12,
  fullRehydrateCallsDuringDelta: 0,
  renderSnapshotDeltaApplies: 12,
  elementSaveCallsDuringDelta: 12,
  computedSnapshotCallsDuringDelta: 13,
  fullRehydrateReference: { count: 12 },
  sceneTree: { count: 12 },
  renderSnapshot: { count: 12 },
  strategyGeometry: { count: 12 },
  strategyGeometryFirstSampleMs: 0.25,
  strategyGeometrySteadyState: { count: 11 },
  engineHandoff: { count: 12 }
})

test('p95 remains distinct from the separately reported maximum', () => {
  const result = summarize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  assert.equal(result.p95Ms, 11)
  assert.equal(result.maxMs, 12)
})
test('first measured sample is separated without dropping later spikes', () => {
  const result = summarizeStrategyGeometry([6.6, 0.3, 0.4, 0.3, 7.4, 0.3])
  assert.equal(result.firstSampleMs, 6.6)
  assert.equal(result.steadyState.maxMs, 7.4)
  assert.equal(result.steadyState.count, 5)
})
test('every slow sample remains visible regardless of its position', () => {
  for (let index = 0; index < 12; index++) {
    const samples = Array(12).fill(0.5)
    samples[index] = 20
    const result = summarize(samples)
    assert.equal(result.maxMs, 20)
    assert.equal(result.totalMs, 25.5)
  }
})
test('sustained slow execution remains visible in percentile and total metrics', () => {
  const result = summarize(Array(12).fill(7))
  assert.equal(result.p95Ms, 7)
  assert.equal(result.totalMs, 84)
})

test('render contracts retain slow timing measurements without a timing threshold', () => {
  const summary = createRenderDeltaSummary()
  summary.sceneTree = { count: 12, totalMs: 120, p95Ms: 12, maxMs: 30 }
  summary.strategyGeometryFirstSampleMs = 30

  assert.equal(assertRenderDeltaContracts(summary, 12), summary)
  assert.equal(summary.sceneTree.totalMs, 120)
  assert.equal(summary.sceneTree.p95Ms, 12)
  assert.equal(summary.sceneTree.maxMs, 30)
  assert.equal(summary.strategyGeometryFirstSampleMs, 30)
})

test('render contracts still reject violations of work and sample-count limits', () => {
  const violations = [
    ['full rehydrate during delta', 'fullRehydrateCallsDuringDelta', 1],
    ['delta apply count', 'renderSnapshotDeltaApplies', 11],
    ['element save work', 'elementSaveCallsDuringDelta', 13],
    ['computed snapshot work', 'computedSnapshotCallsDuringDelta', 14]
  ]

  for (const [label, field, value] of violations) {
    const summary = createRenderDeltaSummary()
    summary[field] = value
    assert.throws(
      () => assertRenderDeltaContracts(summary, 12),
      undefined,
      label
    )
  }

  for (const phase of [
    'fullRehydrateReference',
    'sceneTree',
    'renderSnapshot',
    'strategyGeometry',
    'engineHandoff'
  ]) {
    const summary = createRenderDeltaSummary()
    summary[phase].count = 11
    assert.throws(
      () => assertRenderDeltaContracts(summary, 12),
      undefined,
      `${phase} sample count`
    )
  }

  const summary = createRenderDeltaSummary()
  summary.strategyGeometrySteadyState.count = 10
  assert.throws(
    () => assertRenderDeltaContracts(summary, 12),
    undefined,
    'steady-state sample count'
  )
})

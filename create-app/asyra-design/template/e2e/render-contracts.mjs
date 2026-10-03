import assert from 'node:assert/strict'

export const assertRenderDeltaContracts = (summary, sampleFrames) => {
  assert.equal(summary.sampleFrames, sampleFrames)
  assert.equal(summary.fullRehydrateCallsDuringDelta, 0)
  assert.equal(summary.renderSnapshotDeltaApplies, sampleFrames)
  assert.ok(summary.elementSaveCallsDuringDelta <= sampleFrames)
  assert.ok(summary.computedSnapshotCallsDuringDelta <= sampleFrames + 1)

  for (const phase of [
    summary.fullRehydrateReference,
    summary.sceneTree,
    summary.renderSnapshot,
    summary.strategyGeometry,
    summary.engineHandoff
  ]) {
    assert.equal(phase.count, sampleFrames)
  }
  assert.equal(summary.strategyGeometrySteadyState.count, sampleFrames - 1)

  return summary
}

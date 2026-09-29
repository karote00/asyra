import assert from 'node:assert/strict'
import test from 'node:test'
import { summarize, summarizeStrategyGeometry } from '../e2e/render-profile.mjs'

test('p95 remains distinct from the independently enforced maximum', () => {
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

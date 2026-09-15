const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const data = require('../asyra-website-landing-flow-inspector.data.cjs')
const root = path.resolve(__dirname, '../../../..')

test('homepage authority resolves the current accepted story instead of an old visual reference', () => {
  for (const file of Object.values(data.authority))
    assert.ok(fs.existsSync(path.join(root, file)), file)
  assert.equal(
    data.authority.specPath,
    'apps/asyra-framework-site/docs/spatial-story.md'
  )
  assert.equal(data.caseIds.length, new Set(data.caseIds).size)
  for (const id of [
    'continuous-six-chapter-homepage',
    'house-to-tower-replacement',
    'native-site-navigation',
    'removed-preview-route',
    'canonical-discovery'
  ])
    assert.ok(data.caseIds.includes(id))
})
test('the three existing owner steps retain explicit handoffs and fail at their owning step', () => {
  assert.deepEqual(
    data.steps.map((step) => step.id),
    [
      'freeze-result-first-contract',
      'render-result-first-page',
      'verify-result-first-page'
    ]
  )
  for (const step of data.steps) {
    assert.equal(step.failureOwnerStepId, step.id)
    for (const key of [
      'inputs',
      'outputs',
      'conditions',
      'allowedContributors',
      'forbiddenContributors',
      'implementationBoundary',
      'specRefs'
    ])
      assert.ok(step[key].length > 0, `${step.id}: ${key}`)
    assert.deepEqual(step.cacheDimensions, [])
  }
  assert.deepEqual(data.steps[1].inputs, data.steps[0].outputs)
  assert.deepEqual(data.steps[2].inputs, data.steps[1].outputs)
})
test('render and verification boundaries protect continuity, static reading and human review', () => {
  const render = JSON.stringify(data.steps[1])
  for (const pattern of [
    /one shared desktop scene/i,
    /stays idle/i,
    /reverse scroll/i,
    /footprint/i,
    /no JavaScript/i,
    /server-owned/i,
    /noopener noreferrer/i
  ])
    assert.match(render, pattern)
  const verify = JSON.stringify(data.steps[2])
  assert.match(verify, /404/)
  assert.match(verify, /exact submitted head/)
  assert.match(verify, /no merge/)
})

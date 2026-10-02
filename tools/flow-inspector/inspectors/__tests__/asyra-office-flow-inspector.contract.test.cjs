const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const data = require('../asyra-office-flow-inspector.data.cjs')
test('Office static architecture retains one owner per artifact and complete handoffs', () => {
  assert.equal(data.schema.version, 2)
  const steps = new Map(data.steps.map((step) => [step.id, step]))
  const artifacts = new Map(
    data.artifacts.map((artifact) => [artifact.id, artifact])
  )
  assert.equal(steps.size, data.steps.length)
  for (const step of steps.values()) {
    for (const key of [
      'inputs',
      'outputs',
      'conditions',
      'bypasses',
      'allowedContributors',
      'forbiddenContributors',
      'implementationBoundary',
      'specRefs'
    ])
      assert.ok(step[key].length, step.id + ' ' + key)
    assert.ok(steps.has(step.failureOwnerStepId))
    for (const id of [...step.inputs, ...step.outputs].filter((id) =>
      id.startsWith('artifact:')
    ))
      assert.ok(artifacts.has(id), id)
    for (const ref of step.specRefs)
      assert.ok(
        fs.existsSync(path.resolve(__dirname, '../../../..', ref.split('#')[0]))
      )
  }
  for (const artifact of artifacts.values()) {
    assert.ok(steps.get(artifact.ownerStepId).outputs.includes(artifact.id))
    for (const consumer of artifact.consumerStepIds) {
      assert.ok(steps.get(consumer).inputs.includes(artifact.id))
      assert.ok(
        data.routes.some(
          (route) =>
            route.from === artifact.ownerStepId &&
            route.to === consumer &&
            route.producedArtifacts.includes(artifact.id)
        )
      )
    }
  }
  assert.ok(
    steps
      .get('render-spatial')
      .implementationBoundary.includes('packages/preset/src/spatial/')
  )
  assert.ok(!JSON.stringify(data).includes('test-results'))
})

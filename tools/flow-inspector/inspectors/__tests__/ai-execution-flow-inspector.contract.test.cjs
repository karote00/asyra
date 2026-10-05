const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const flow = require('../ai-execution-flow-inspector.data.cjs')
const root = path.resolve(__dirname, '../../../..')

test('AI execution architecture resolves current authorities and boundaries', () => {
  assert.equal(flow.schema.version, 2)
  assert.ok(Object.isFrozen(flow))
  const spec = fs.readFileSync(path.join(root, flow.authority.specPath), 'utf8')
  assert.ok(fs.existsSync(path.join(root, flow.authority.inspectorPath)))
  const headings = new Set(
    [...spec.matchAll(/^## (.+)$/gm)].map(
      (match) =>
        '#' +
        match[1]
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, '')
          .replaceAll(' ', '-')
    )
  )
  for (const step of flow.steps) {
    assert.equal(step.ownerPackage, '@asyra/asyra-design')
    assert.equal(step.failureOwnerStepId, step.id)
    for (const field of [
      'inputs',
      'outputs',
      'conditions',
      'bypasses',
      'allowedContributors',
      'forbiddenContributors',
      'implementationBoundary',
      'specRefs'
    ]) {
      assert.ok(step[field].length, `${step.id}: ${field}`)
    }
    for (const file of step.implementationBoundary)
      assert.ok(fs.existsSync(path.join(root, file)), file)
    for (const ref of step.specRefs) assert.ok(headings.has(ref), ref)
    if (step.id === 'compose' || step.id === 'prepare') {
      assert.ok(step.cacheDimensions.length > 0)
      for (const dimension of step.cacheDimensions)
        assert.match(dimension, /request-local/)
      assert.match(step.cacheDimensions.join(' '), /refresh/)
    } else assert.deepEqual(step.cacheDimensions, [])
  }
})

test('AI execution routes preserve artifact ownership and declared consumers', () => {
  const steps = new Map(flow.steps.map((step) => [step.id, step]))
  const artifacts = new Map(
    flow.artifacts.map((artifact) => [artifact.id, artifact])
  )
  assert.equal(steps.size, flow.steps.length)
  assert.equal(artifacts.size, flow.artifacts.length)
  for (const route of flow.routes) {
    assert.ok(steps.has(route.from), route.id)
    if (route.to) assert.ok(steps.has(route.to), route.id)
    for (const id of route.producedArtifacts) {
      const artifact = artifacts.get(id)
      assert.equal(artifact?.ownerStepId, route.from, route.id)
      assert.ok(steps.get(route.from).outputs.includes(id), route.id)
      if (route.to) {
        assert.ok(artifact.consumerStepIds.includes(route.to), route.id)
        assert.ok(steps.get(route.to).inputs.includes(id), route.id)
      }
    }
  }
  for (const artifact of artifacts.values()) {
    assert.equal(artifact.terminal, artifact.consumerStepIds.length === 0)
    for (const consumer of artifact.consumerStepIds)
      assert.ok(
        flow.routes.some(
          (route) =>
            route.from === artifact.ownerStepId &&
            route.to === consumer &&
            route.producedArtifacts.includes(artifact.id)
        )
      )
  }
})

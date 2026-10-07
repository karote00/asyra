const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const data = require('../container-double-click-selection-flow-inspector.data.cjs')
const root = path.resolve(__dirname, '../../../..')

test('container selection flow resolves its product authority, owner and terminal output', () => {
  assert.equal(data.schema.version, 2)
  assert.equal(data.steps.length, 2)
  const step = data.steps[0]
  assert.equal(step.failureOwnerStepId, step.id)
  assert.deepEqual(step.cacheDimensions, [])
  for (const key of [
    'inputs',
    'outputs',
    'conditions',
    'bypasses',
    'allowedContributors',
    'forbiddenContributors',
    'implementationBoundary',
    'specRefs'
  ]) {
    assert.ok(step[key].length > 0, key)
  }
  for (const file of [
    data.authority.specPath,
    data.authority.inspectorPath,
    ...step.implementationBoundary
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), file)
  }
  const spec = fs.readFileSync(path.join(root, data.authority.specPath), 'utf8')
  assert.ok(spec.includes('## Container double-click selection'))
  for (const contract of data.acceptanceContracts) {
    assert.ok(Array.isArray(contract.assertions))
    assert.ok(contract.assertions.length > 0)
  }
  for (const route of data.routes) {
    const step = data.steps.find((item) => item.id === route.from)
    assert.ok(step)
    assert.equal(route.kind, 'terminal')
    for (const id of route.producedArtifacts) {
      const artifact = data.artifacts.find((item) => item.id === id)
      assert.ok(artifact)
      assert.equal(artifact.ownerStepId, step.id)
      assert.equal(artifact.terminal, true)
      assert.ok(step.outputs.includes(id))
    }
  }
})

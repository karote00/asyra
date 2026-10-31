/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const repositoryRoot = path.resolve(__dirname, '../../..')
const sources = [
  'asyra-sim-r0',
  'ai-conversational-drawing-performance',
  'group-context-menu',
  'vector-local-geometry-transform',
  'remote-subtree-restore-snapshot',
  'group-interaction-mvp',
  'stroke',
  'transaction',
  'canonical-projection-and-collaboration-contract',
  'render-engine-boundary',
  'canvas-pipeline-debugger',
  'property-type-redefinition',
  'ai-agent-runtime',
  'group-component-and-hierarchy',
  'framework-release-readiness',
  'framework-package-release',
  'node-24-runtime-upgrade',
  'flow-inspector-static-workspace'
]
const topLevelKeys = [
  'schema',
  'target',
  'authority',
  'links',
  'lanes',
  'steps',
  'routes',
  'artifacts',
  'invariants',
  'acceptanceContracts'
]
const stepFields = [
  'id',
  'order',
  'laneId',
  'title',
  'ownerPackage',
  'purpose',
  'inputs',
  'outputs',
  'conditions',
  'bypasses',
  'allowedContributors',
  'forbiddenContributors',
  'cacheDimensions',
  'implementationBoundary',
  'specRefs',
  'failureOwnerStepId'
]

function deeplyFrozen(value) {
  return (
    !value ||
    typeof value !== 'object' ||
    (Object.isFrozen(value) && Object.values(value).every(deeplyFrozen))
  )
}

function anchor(heading) {
  return heading
    .toLowerCase()
    .replaceAll('`', '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

for (const source of sources) {
  test(`${source} retains its complete architecture and specification contract`, () => {
    const filename = path.resolve(
      __dirname,
      '../inspectors',
      `${source}-flow-inspector.data.cjs`
    )
    const data = require(filename)
    assert.deepEqual(Object.keys(data), topLevelKeys)
    assert.doesNotMatch(fs.readFileSync(filename, 'utf8'), /\brequire\s*\(/)
    assert.ok(deeplyFrozen(data))
    assert.equal(data.schema.id, 'flow-inspector')
    assert.equal(data.schema.version, 2)
    assert.ok(data.steps.length > 0)
    assert.equal(Object.hasOwn(data, 'stages'), false)
    const sets = {}
    for (const name of [
      'lanes',
      'steps',
      'routes',
      'artifacts',
      'invariants',
      'acceptanceContracts'
    ]) {
      sets[name] = new Set(data[name].map((item) => item.id))
      assert.equal(sets[name].size, data[name].length, `${name} IDs are unique`)
    }
    for (const step of data.steps) {
      assert.deepEqual(Object.keys(step), stepFields)
      assert.ok(sets.lanes.has(step.laneId), step.id)
      assert.ok(sets.steps.has(step.failureOwnerStepId), step.id)
      assert.equal(Object.hasOwn(step, 'failureOwnerStageId'), false)
      for (const input of step.inputs.filter((value) =>
        value.startsWith('artifact:')
      )) {
        assert.ok(sets.artifacts.has(input), `${step.id}: ${input}`)
      }
      for (const output of step.outputs) {
        assert.ok(sets.artifacts.has(output), `${step.id}: ${output}`)
      }
    }
    for (const route of data.routes) {
      assert.ok(sets.steps.has(route.from), route.id)
      if (route.kind === 'terminal') {
        assert.equal(Object.hasOwn(route, 'to'), false)
      } else {
        assert.ok(sets.steps.has(route.to), route.id)
      }
      for (const id of route.producedArtifacts) {
        const artifact = data.artifacts.find((item) => item.id === id)
        assert.ok(artifact, route.id)
        assert.equal(artifact.ownerStepId, route.from, route.id)
        if (route.to) {
          assert.ok(artifact.consumerStepIds.includes(route.to), route.id)
        }
      }
    }
    for (const artifact of data.artifacts) {
      assert.equal(Object.hasOwn(artifact, 'ownerStageId'), false)
      assert.equal(Object.hasOwn(artifact, 'consumerStageIds'), false)
      const owner = data.steps.find((step) => step.id === artifact.ownerStepId)
      assert.ok(owner?.outputs.includes(artifact.id), artifact.id)
      assert.equal(artifact.terminal, artifact.consumerStepIds.length === 0)
      for (const id of artifact.consumerStepIds) {
        assert.ok(
          data.steps
            .find((step) => step.id === id)
            ?.inputs.includes(artifact.id),
          artifact.id
        )
        assert.ok(
          data.routes.some(
            (route) =>
              route.from === artifact.ownerStepId &&
              route.to === id &&
              route.producedArtifacts.includes(artifact.id)
          ),
          artifact.id
        )
      }
      if (artifact.terminal) {
        assert.ok(
          data.routes.some(
            (route) =>
              route.kind === 'terminal' &&
              route.from === artifact.ownerStepId &&
              route.producedArtifacts.includes(artifact.id)
          ),
          artifact.id
        )
      }
    }
    const spec = fs.readFileSync(
      path.resolve(repositoryRoot, data.authority.specPath),
      'utf8'
    )
    const anchors = new Set(
      [...spec.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => anchor(match[1]))
    )
    for (const item of [
      ...data.steps,
      ...data.invariants,
      ...data.acceptanceContracts
    ]) {
      assert.equal(Object.hasOwn(item, 'stageIds'), false)
      for (const id of item.stepIds ?? []) {
        assert.ok(sets.steps.has(id), item.id)
      }
      for (const id of item.artifactIds ?? []) {
        assert.ok(sets.artifacts.has(id), item.id)
      }
      for (const reference of item.specRefs) {
        assert.match(reference, /^#[a-z0-9-]+$/)
        assert.ok(anchors.has(reference.slice(1)), `${item.id}: ${reference}`)
      }
    }
    for (const link of data.links) {
      assert.ok(
        fs.existsSync(
          path.resolve(path.dirname(filename), link.href.split('#')[0])
        ),
        link.id
      )
    }
  })
}

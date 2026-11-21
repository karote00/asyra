import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'
import test from 'node:test'

const require = createRequire(import.meta.url)
const {
  admitProject
} = require('../../tools/flow-inspector/flow-files/api.cjs')
const root = fileURLToPath(new URL('../../docs/ai/', import.meta.url))
const projects = new Map()

for (const file of fs.readdirSync(root, { recursive: true })) {
  if (!file.split(path.sep).includes('plans') || !file.endsWith('.flow.json')) {
    continue
  }

  const directory = path.dirname(file)

  if (!projects.has(directory)) {
    projects.set(directory, [])
  }

  projects.get(directory).push(file)
}

for (const [directory, files] of [...projects].sort()) {
  test(`plan Flow project admits current documents: ${directory}`, () => {
    const documents = files
      .sort()
      .map((file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')))

    assert.doesNotThrow(() => admitProject(documents))
  })
}

const ownershipFlow = () =>
  JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        'framework/plans/ai-agent-runtime-ownership-transfer/ownership-transfer.flow.json'
      ),
      'utf8'
    )
  )

const requireHandoff = (architecture, artifactId, owner, consumer) => {
  const artifact = architecture.artifacts.find(({ id }) => id === artifactId)

  assert.ok(artifact, `Missing handoff: ${artifactId}`)
  assert.equal(artifact.ownerStepId, owner)
  assert.ok(artifact.consumerStepIds.includes(consumer))
  assert.ok(
    architecture.routes.some(
      (route) =>
        route.from === owner &&
        route.to === consumer &&
        route.producedArtifacts.includes(artifactId)
    ),
    `Missing route: ${owner} -> ${consumer} for ${artifactId}`
  )
}

test('ownership flow returns complete results to composition without storage or model delivery', () => {
  const { architecture } = ownershipFlow().definition

  requireHandoff(architecture, 'artifact:internal-result', 'result', 'host')
  for (const id of ['artifact:raw', 'artifact:internal-result']) {
    const artifact = architecture.artifacts.find((item) => item.id === id)

    assert.ok(!artifact.consumerStepIds.includes('provider'))
  }

  assert.ok(
    !architecture.artifacts
      .find(({ id }) => id === 'artifact:delivery')
      .consumerStepIds.includes('host')
  )
})

test('ownership flow leaves final transaction settlement with the App adapter', () => {
  const { architecture } = ownershipFlow().definition

  requireHandoff(
    architecture,
    'artifact:transaction-settlement',
    'execute',
    'close'
  )
  const execute = architecture.steps.find(({ id }) => id === 'execute')

  assert.ok(
    execute.implementationBoundary.includes(
      'apps/asyra-design/src/ai/transaction.ts'
    )
  )
  for (const id of ['rollback-policy', 'preserve-progress-policy']) {
    const acceptance = architecture.acceptanceContracts.find(
      (item) => item.id === id
    )

    assert.ok(acceptance, `Missing transaction policy acceptance: ${id}`)
    assert.ok(acceptance.stepIds.includes('execute'))
    assert.ok(acceptance.stepIds.includes('close'))
  }
})

test('ownership flow delegates authored syntax after admission and returns existing recipe inputs', () => {
  const { architecture } = ownershipFlow().definition

  requireHandoff(architecture, 'artifact:authored-request', 'host', 'translate')
  requireHandoff(
    architecture,
    'artifact:normalized-request',
    'translate',
    'host'
  )
  const translate = architecture.steps.find(({ id }) => id === 'translate')

  assert.ok(
    translate.implementationBoundary.includes(
      'apps/asyra-design/server/local-design-sequence.ts'
    )
  )
  assert.ok(
    translate.implementationBoundary.every((file) =>
      file.startsWith('apps/asyra-design/')
    )
  )
  assert.ok(
    !architecture.routes.some(
      (route) => route.from === 'translate' && route.to === 'execute'
    )
  )
})

test('ownership integration requires one connected non-Design journey and automated evidence', () => {
  const { architecture, criteria } = ownershipFlow().definition
  const journey = architecture.acceptanceContracts.find(
    ({ id }) => id === 'non-design-journey'
  )

  assert.ok(journey)
  for (const id of [
    'compose',
    'catalog',
    'knowledge',
    'host',
    'execute',
    'result',
    'retain',
    'provider',
    'close'
  ]) {
    assert.ok(journey.stepIds.includes(id), `Journey omits ${id}`)
  }

  for (const [artifact, from, to] of [
    ['artifact:call', 'provider', 'host'],
    ['artifact:dispatch', 'host', 'execute'],
    ['artifact:raw', 'execute', 'result'],
    ['artifact:internal-result', 'result', 'host'],
    ['artifact:delivery', 'result', 'provider'],
    ['artifact:lookup', 'host', 'retain'],
    ['artifact:stored', 'retain', 'host']
  ]) {
    requireHandoff(architecture, artifact, from, to)
  }

  const proof = criteria.find(({ id }) => id === 'non-design-journey')

  assert.equal(proof?.kind, 'automated')
  assert.ok(proof.selector.producer)
  assert.ok(proof.selector.identity)
})

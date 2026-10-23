import { URL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  architectureFiles,
  observationDeadline,
  evaluationArtifactBudget,
  architectureScenario
} from '../architecture-protocol.mjs'
const spec = JSON.parse(
  fs.readFileSync(new URL('../architecture-101.json', import.meta.url))
)
test('the only model case is architectural 101 with an exact ten-minute deadline', () => {
  const scenario = architectureScenario(spec)
  assert.equal(scenario.deadlineMs, 600000)
  assert.ok(scenario.prompt.includes('Draw the entire Taipei 101'))
  assert.throws(() => architectureScenario({ ...spec, deadlineMs: 900000 }))
  assert.throws(() => architectureScenario({ ...spec, id: 'general-design' }))
  assert.throws(() => architectureScenario({ ...spec, modules: ['icons'] }))
})
test('the ablation changes only the two new advisory bodies, never unrelated knowledge', () => {
  assert.deepEqual(architectureFiles, [
    'domain-knowledge/illustration.architecture.md',
    'apps/asyra-design/knowledge/design.architectural-illustration.md'
  ])
  assert.equal(spec.attachments.length, 2)
  for (const attachment of spec.attachments)
    assert.match(attachment.sha256, /^[a-f0-9]{64}$/)
})

test('a run-scoped deadline can shorten but never extend the canonical scenario', () => {
  assert.equal(observationDeadline(spec, []), 600000)
  assert.equal(observationDeadline(spec, ['--deadline-ms=120000']), 120000)
  assert.equal(spec.deadlineMs, 600000)
  for (const args of [
    ['--deadline-ms=600001'],
    ['--deadline-ms=0'],
    ['--deadline-ms=NaN'],
    ['--deadline-ms=1.5'],
    ['--deadline-ms=-1'],
    ['--unknown=120000'],
    ['--deadline-ms=120000', '--deadline-ms=60000']
  ])
    assert.throws(() => observationDeadline(spec, args))
})

test('only an explicit isolated 2000 evaluation budget is admitted', () => {
  assert.equal(evaluationArtifactBudget([]), undefined)
  assert.equal(
    evaluationArtifactBudget([
      '--deadline-ms=120000',
      '--expanded-node-limit=2000'
    ]),
    2000
  )
  for (const args of [
    ['--expanded-node-limit=10000'],
    ['--expanded-node-limit=5000'],
    ['--expanded-node-limit=2001'],
    ['--expanded-node-limit'],
    ['--expanded-node-limit=2000', '--expanded-node-limit=2000']
  ])
    assert.throws(() => evaluationArtifactBudget(args))
})

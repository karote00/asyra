import { URL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  architectureFiles,
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

import { URL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readTaipei101Deadline } from '../test-data/ai-drawing/taipei-101-live-contract.mjs'

const read = (path) =>
  readFileSync(new URL('../../../' + path, import.meta.url), 'utf8')

test('continuity rules distinguish saved snapshots from expiring request authority', () => {
  const spec = read('docs/ai/apps/asyra-design/specs/ai-execution-flow.md')

  assert.equal(
    /no geometry or image cache crosses requests/.test(spec),
    false,
    'Remove the blanket cross-request cache prohibition'
  )
  assert.equal(
    /Image attachment indexes and pixels are request-owned/.test(spec),
    false,
    'Separate pixel snapshots from request-owned indexes'
  )
  assert.match(spec, /Saved result images keep trusted capture provenance/)
  assert.match(spec, /Request-only handles cannot become cross-turn references/)
  assert.match(
    spec,
    /Names survive subsequent requests in the same open App document and\s+conversation/
  )
  assert.doesNotMatch(spec, /only names\s+accompany the next model turn/)
  assert.match(
    spec,
    /Names and bounded descriptors accompany the next model turn/
  )
})

test('request architecture allows saved snapshots without extending request authority', () => {
  const inspector = read(
    'tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs'
  )

  assert.doesNotMatch(inspector, /'cross-request geometry cache'/)
  assert.match(
    inspector,
    /request-owned geometry handles as cross-request authority/
  )
})

test('current discovery specification has one explicit wrapper acquisition rule', () => {
  const spec = read('docs/ai/apps/asyra-design/specs/ai-execution-flow.md')

  assert.match(
    spec,
    /Bare action identities publish only the primary action route in every view/
  )
  assert.doesNotMatch(
    spec,
    /Full and machine-schema reads include\s+both actual input contracts/
  )
})

test('Knowledge distinguishes final publication confirmation from a document write', () => {
  const advice = read(
    'apps/asyra-design/knowledge/design.architectural-illustration.contracts.md'
  )

  assert.doesNotMatch(advice, /not an edit or saving acknowledgement/)
  for (const status of ['durable', 'local-only', 'unavailable']) {
    assert.ok(advice.includes(status), 'Missing persistence outcome: ' + status)
  }
})

test('documented recorder overrides match the formal duration owner', () => {
  const guide = read(
    'docs/ai/apps/asyra-design/modules/ai-development-and-debugging.md'
  )
  const range = /--minutes=N` \(integer\s+1[–-](\d+)\)/.exec(guide)

  assert.ok(range, 'Missing documented recorder range')
  const maximum = Number(range[1])

  assert.equal(readTaipei101Deadline(['--minutes=' + maximum]), maximum * 60000)
  assert.throws(() => readTaipei101Deadline(['--minutes=' + (maximum + 1)]))
  assert.ok(guide.includes(maximum + '-minute safety ceiling'))
})

test('preparation and provider specifications preserve complete canonical receipts before model delivery', () => {
  for (const file of ['design-preparation.md', 'local-ai-provider.md']) {
    const spec = read('docs/ai/apps/asyra-design/specs/' + file)

    assert.equal(
      /without constructing\s+ID arrays\/role maps|Explicit full mode preserves|Compact combined receipts are requested at the action source|full mode remains\s+available for ID selection/.test(
        spec
      ),
      false,
      'Remove superseded canonical receipt modes from ' + file
    )
  }

  const spec = read('docs/ai/apps/asyra-design/specs/design-preparation.md')

  assert.match(
    spec,
    /Prepared application returns complete acknowledged IDs and counts/
  )
  assert.match(spec, /The Host applies delivery after owner\s+validation/)
})

test('preparation specifications do not retain visual correction-attempt accounting', () => {
  const spec = read('docs/ai/apps/asyra-design/specs/design-preparation.md')

  assert.equal(
    /consume visual-correction attempts|consuming screenshot correction attempts/.test(
      spec
    ),
    false,
    'Remove retired correction-attempt accounting'
  )
  const provider = read('docs/ai/apps/asyra-design/specs/local-ai-provider.md')

  assert.match(
    provider,
    /Inspections and measurement cycles have no cumulative quota/
  )
})

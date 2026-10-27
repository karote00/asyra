import console from 'node:console'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  loadFixtures,
  inspectSuccessor,
  runNativeDelivery
} from '../native-delivery.mjs'

test('retained fixtures have verified bytes and source digests', async () => {
  const fixtures = await loadFixtures()
  assert.deepEqual(
    fixtures.map((f) => f.bytes),
    [66434, 84960]
  )
})

test('missing successor cannot be classified as truncation', () => {
  assert.throws(() => inspectSuccessor(null, 'call', 'data'), /Missing/)
  assert.throws(
    () => inspectSuccessor({ input: [] }, 'call', 'data'),
    /Missing/
  )
})

test('outbound comparison preserves UTF-8 and distinguishes exact text', () => {
  const raw = '材質🌲'
  const result = inspectSuccessor(
    { input: [{ type: 'function_call_output', call_id: 'call', output: raw }] },
    'call',
    raw
  )
  assert.equal(result.exact, true)
  assert.equal(result.sourceBytes, Buffer.byteLength(raw))
})

for (const mode of ['direct']) {
  test(
    `native 0.160.0 captures real successor requests in ${mode} mode`,
    { timeout: 110000 },
    async () => {
      for (const fixture of await loadFixtures()) {
        const result = await runNativeDelivery({ fixture })
        assert.equal(result.version, 'codex-cli 0.160.0')
        assert.equal(result.requests, 2)
        assert.equal(result.nativeReplyExact, true)
        assert.equal(result.comparison.captured, true)
        assert.equal(result.comparison.truncationMarker, true)
        assert.ok(result.comparison.omission.bytes > 0)
        assert.equal(
          result.comparison.omission.bytes,
          result.comparison.omission.endByte -
            result.comparison.omission.startByte
        )
        assert.match(result.identity.binarySHA256, /^[a-f0-9]{64}$/)
        assert.equal(result.receipt.status, 'saved')
        assert.equal(result.source.sourceIdentityStatus, 'captured')
        const records = (await readFile(result.receipt.path, 'utf8'))
          .trim()
          .split('\n')
          .map(JSON.parse)
        const ref = records.find(
          (record) => record.stage === 'request-2'
        ).receipt
        const bytes = await readFile(join(result.directory, ref.path))
        assert.equal(
          createHash('sha256').update(bytes).digest('hex'),
          ref.sha256
        )
        const wire = JSON.parse(bytes).wireBody
        assert.deepEqual(
          inspectSuccessor(
            JSON.parse(wire),
            'native_delivery_call',
            fixture.raw
          ),
          result.comparison
        )
        assert.equal(result.cleanup.errors.length, 0)
        console.log(result.directory)
      }
    }
  )
}

test('wrong native version fails before starting a provider', async () => {
  const fixture = (await loadFixtures())[0]
  await assert.rejects(
    runNativeDelivery({
      fixture: { ...fixture, nativeVersion: 'unsupported' }
    }),
    /version mismatch/
  )
})

for (const mode of ['direct']) {
  test(`small UTF-8 native reply remains complete in ${mode} mode`, async () => {
    const fixture = {
      ...(await loadFixtures())[0],
      kind: 'synthetic-utf8-control',
      raw: JSON.stringify({ message: '材質🌲', status: 'complete' })
    }
    const result = await runNativeDelivery({ fixture })
    assert.equal(result.nativeReplyExact, true)
    assert.equal(result.comparison.exact, true)
    assert.equal(result.comparison.omission, null)
    assert.equal(result.receipt.status, 'saved')
    assert.equal(result.cleanup.errors.length, 0)
  })
}

test('a literal truncation phrase in an intact reply is not evidence of loss', () => {
  const raw = 'A report may contain …10 tokens truncated… as quoted data.'
  const result = inspectSuccessor(
    { input: [{ type: 'function_call_output', call_id: 'call', output: raw }] },
    'call',
    raw
  )
  assert.equal(result.exact, true)
  assert.equal(result.truncationMarker, false)
  assert.equal(result.omission, null)
})

test('invalid direct call sequences reject before native startup', async () => {
  const fixture = (await loadFixtures())[1]
  for (const executions of [[], [{}], [{ input: {}, expected: '' }]]) {
    await assert.rejects(runNativeDelivery({ fixture, executions }), /Invalid/)
  }
})

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

for (const mode of ['direct', 'code']) {
  test(
    `native 0.160.0 captures real successor requests in ${mode} mode`,
    { timeout: 110000 },
    async () => {
      for (const fixture of await loadFixtures()) {
        const result = await runNativeDelivery({ fixture, mode })
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
        console.log(JSON.stringify(result))
      }
    }
  )
}

test('wrong native version fails before starting a provider', async () => {
  const fixture = (await loadFixtures())[0]
  await assert.rejects(
    runNativeDelivery({
      fixture: { ...fixture, nativeVersion: 'unsupported' },
      mode: 'direct'
    }),
    /version mismatch/
  )
})

for (const mode of ['direct', 'code']) {
  test(`small UTF-8 native reply remains complete in ${mode} mode`, async () => {
    const fixture = {
      ...(await loadFixtures())[0],
      kind: 'synthetic-utf8-control',
      raw: JSON.stringify({ message: '材質🌲', status: 'complete' })
    }
    const result = await runNativeDelivery({ fixture, mode })
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

test('Code Mode retains values across separate exec calls', async () => {
  const fixture = (await loadFixtures())[1]
  const result = await runNativeDelivery({
    fixture,
    mode: 'code',
    executions: [
      {
        code: 'store("retained", { value: "材質🌲" }); text("stored");',
        expected: 'stored'
      },
      { code: 'text(load("retained").value);', expected: '材質🌲' }
    ]
  })
  assert.equal(result.requests, 3)
  assert.equal(result.comparisons.length, 2)
  assert.ok(result.comparisons.every((comparison) => comparison.exact))
  assert.equal(result.cleanup.errors.length, 0)
})

test('Code Mode exposes the native tool result shape', async () => {
  const fixture = (await loadFixtures())[1]
  const result = await runNativeDelivery({
    fixture,
    mode: 'code',
    executions: [
      {
        code: `const r=await tools.${fixture.namespace}__${fixture.tool}(${JSON.stringify(fixture.input)}); text(typeof r);`,
        reply: fixture.raw,
        expected: 'string'
      }
    ]
  })
  assert.equal(result.comparisons[0].exact, true)
})

// Protocol fixtures derive only from permanent saved replies. They characterize
// scripted assembly, not production pagination or historical model choices.
function assemblyScenario(fixture, fault) {
  const chunks = fixture.raw.match(/[\s\S]{1,16000}/gu)
  const revision = createHash('sha256').update(fixture.raw).digest('hex')
  const totalBytes = Buffer.byteLength(fixture.raw)
  let offset = 0
  const pages = chunks.map((text, index) => {
    const startByte = offset
    offset += Buffer.byteLength(text)
    return {
      kind: 'json-fragment',
      revision,
      startByte,
      endByte: offset,
      totalBytes,
      text,
      lastPage: index === chunks.length - 1
    }
  })
  if (fault === 'missing') pages.splice(1, 1)
  if (fault === 'revision') pages[1] = { ...pages[1], revision: '0'.repeat(64) }
  const executions = pages.map((page, index) => {
    const input = {
      ...fixture.input,
      contentPage: { revision, offset: page.startByte }
    }
    return {
      input,
      reply: JSON.stringify({
        contentDelivery: {
          ...page,
          next: page.lastPage
            ? null
            : {
                tool: fixture.tool,
                arguments: {
                  ...fixture.input,
                  contentPage: { revision, offset: page.endByte }
                }
              }
        }
      }),
      code: `const reply = await tools.${fixture.namespace}__${fixture.tool}(${JSON.stringify(input)});
const page = JSON.parse(reply).contentDelivery;
const pages = ${index === 0 ? '[]' : 'load("pages")'};
pages.push(page); store("pages", pages); text(page.text);`,
      expected: page.text
    }
  })
  executions.push({
    code: `const pages = load("pages"); let end = 0; let valid = true;
for (const page of pages) {
  if (page.revision !== pages[0].revision || page.totalBytes !== pages[0].totalBytes || page.startByte !== end || page.endByte - page.startByte !== encodeURIComponent(page.text).replace(/%[0-9A-F]{2}/g, "x").length) valid = false;
  end = page.endByte;
}
if (!pages.at(-1).lastPage || end !== pages[0].totalBytes) valid = false;
if (valid) { const assembled = pages.map(p => p.text).join(""); JSON.parse(assembled); store("assembled", assembled); }
text(valid ? "assembled" : "rejected");`,
    expected: fault ? 'rejected' : 'assembled'
  })
  if (fault) {
    executions.push({
      code: 'text(load("assembled") === undefined ? "absent" : "unexpected");',
      expected: 'absent'
    })
  } else {
    executions.push({ code: 'text(load("assembled"));', expected: fixture.raw })
    // Read every slice again AFTER the lossy full print, proving retention is
    // separate from delivery, without claiming access to native memory internals.
    let start = 0
    for (const chunk of chunks) {
      const end = start + chunk.length
      executions.push({
        code: `text(load("assembled").slice(${start}, ${end}));`,
        expected: chunk
      })
      start = end
    }
  }
  const declaration = globalThis.structuredClone(fixture.declaration)
  declaration.tools[0].inputSchema.properties.contentPage = {
    type: 'object',
    properties: { revision: { type: 'string' }, offset: { type: 'integer' } },
    required: ['revision', 'offset'],
    additionalProperties: false
  }
  return {
    fixture: { ...fixture, declaration, kind: 'scripted-fragment-protocol' },
    executions,
    count: pages.length
  }
}

for (const fault of [undefined, 'missing', 'revision']) {
  test(
    `Code Mode cross-execution assembly ${fault || 'preserves saved schema and advice'}`,
    { timeout: 110000 },
    async () => {
      const fixtures = await loadFixtures()
      for (const fixture of fault ? fixtures.slice(1) : fixtures) {
        const scenario = assemblyScenario(fixture, fault)
        const result = await runNativeDelivery({ ...scenario, mode: 'code' })
        assert.equal(result.requests, scenario.executions.length + 1)
        assert.equal(result.nativeReplies, scenario.count)
        assert.equal(result.storageInternals, 'unavailable')
        assert.equal(result.publicItems.includes('functionCallOutput'), false)
        assert.equal(result.receipt.status, 'saved')
        assert.equal(result.cleanup.errors.length, 0)
        for (const [index, comparison] of result.comparisons.entries()) {
          if (!fault && index === scenario.count + 1) {
            assert.equal(comparison.exact, false)
            assert.equal(comparison.truncationMarker, true)
            assert.ok(comparison.omission.bytes > 0)
          } else
            assert.equal(
              comparison.exact,
              true,
              `execution ${index}; ${result.directory}`
            )
        }
        // Reconstruct from ACTUAL successor output, not expected script literals.
        if (!fault) {
          const records = (await readFile(result.receipt.path, 'utf8'))
            .trim()
            .split('\n')
            .map(JSON.parse)
          const returned = []
          for (
            let index = scenario.count + 2;
            index < scenario.executions.length;
            index++
          ) {
            const ref = records.find(
              (r) => r.stage === `request-${index + 2}`
            ).receipt
            const saved = await readFile(join(result.directory, ref.path))
            assert.equal(
              createHash('sha256').update(saved).digest('hex'),
              ref.sha256
            )
            const request = JSON.parse(JSON.parse(saved).wireBody)
            const output = request.input.find(
              (i) =>
                i.call_id === `native_delivery_call_${index}` &&
                i.type === 'custom_tool_call_output'
            ).output
            const expected = scenario.executions[index].expected
            returned.push(
              output.find((i) => i.type === 'input_text' && i.text === expected)
                .text
            )
          }
          assert.equal(returned.join(''), fixture.raw)
          assert.equal(
            createHash('sha256').update(returned.join('')).digest('hex'),
            fixture.sha256
          )
          assert.deepEqual(
            JSON.parse(returned.join('')),
            JSON.parse(fixture.raw)
          )
        }
        console.log(
          JSON.stringify({
            directory: result.directory,
            fault: fault || 'none',
            publicItems: result.publicItems,
            comparisons: result.comparisons.map((c) => ({
              exact: c.exact,
              omittedBytes: c.omission?.bytes
            }))
          })
        )
      }
    }
  )
}

test('invalid scripted execution sequences reject before native startup', async () => {
  const fixture = (await loadFixtures())[1]
  for (const executions of [
    [],
    [{ code: '', expected: 'x' }],
    [{ code: 'text(1)', expected: '' }],
    {}
  ])
    await assert.rejects(
      runNativeDelivery({ fixture, mode: 'code', executions }),
      /Invalid scripted/
    )
  await assert.rejects(
    runNativeDelivery({
      fixture,
      mode: 'direct',
      executions: [{ code: 'text(1)', expected: '1' }]
    }),
    /Invalid scripted/
  )
})

import { URL } from 'node:url'
import console from 'node:console'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { loadFixtures, runNativeDelivery } from '../native-delivery.mjs'
const saved = JSON.parse(
  await readFile(
    new URL(
      '../fixtures/native-delivery/search-router-20261027.json',
      import.meta.url
    ),
    'utf8'
  )
)

test('saved search identities reproduce all three native router failures without inference', async () => {
  const fixture = (await loadFixtures())[0]
  assert.equal(saved.originalArguments, 'not-preserved')
  const result = await runNativeDelivery({
    fixture: { ...fixture, raw: '{"status":"complete"}' },
    searches: saved.calls.map(({ type, namespace, name, call_id }, index) => ({
      type,
      namespace,
      name,
      call_id,
      id: `search_${index}`,
      arguments: JSON.stringify({ query: saved.controlledQuery, limit: 1 })
    }))
  })
  for (const [index, outputs] of result.searchResults.entries()) {
    assert.equal(outputs.length, 1)
    assert.ok(JSON.stringify(outputs).includes(saved.calls[index].routedName))
    assert.ok(JSON.stringify(outputs).includes('unsupported'))
  }
  console.log(`Saved failure replay: ${result.directory}`)
})

test('standard direct declarations discover deferred tools and deliver their result in the same turn', async () => {
  const fixture = (await loadFixtures())[0]
  const result = await runNativeDelivery({
    fixture: {
      ...fixture,
      raw: '{"status":"complete","restriction":"retain references"}'
    },
    searches: saved.calls.map(({ call_id }, index) => ({
      type: 'tool_search_call',
      id: `search_${index}`,
      call_id,
      execution: 'client',
      status: 'completed',
      arguments: { query: saved.controlledQuery, limit: 1 }
    }))
  })
  assert.equal(result.initialToolDelivery.additionalTools.length, 0)
  assert.ok(!JSON.stringify(result.initialToolDelivery).includes('store('))
  assert.ok(!JSON.stringify(result.initialToolDelivery).includes('text('))
  assert.ok(
    result.initialToolDelivery.tools.some((tool) => tool.type === 'tool_search')
  )
  assert.ok(
    !JSON.stringify(result.initialToolDelivery).includes('"name":"exec"')
  )
  for (const outputs of result.searchResults) {
    assert.equal(outputs[0]?.type, 'tool_search_output')
    const namespace = outputs[0].tools.find(
      (tool) => tool.name === fixture.namespace
    )
    assert.equal(namespace?.tools[0]?.name, fixture.tool)
    assert.equal(namespace?.tools[0]?.parameters.type, 'object')
    assert.ok(namespace.tools[0].parameters.required.includes('ids'))
  }
  assert.equal(result.requests, saved.calls.length + 2)
  assert.equal(result.comparison.exact, true)
  assert.equal(result.cleanup.errors.length, 0)
  console.log(`Direct discovery and successor: ${result.directory}`)
})

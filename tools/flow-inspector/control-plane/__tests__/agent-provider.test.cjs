/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const { providerAdapter } = require('../agent-provider.cjs')
const task = {
  requestId: 'task',
  objective: 'Correct rollback behavior',
  step: { id: 'finalize', inputs: ['journal'], outputs: ['rollback'] },
  routes: [],
  obligations: [{ id: 'cancel.outcome' }],
  allowedFiles: ['source.ts'],
  forbiddenActions: ['shell'],
  provider: { model: 'selected-model' },
  credentials: 'must-not-be-context'
}
function fixture(complete) {
  const events = []
  const controller = new AbortController()
  const adapter = providerAdapter(task, {
    complete,
    signal: controller.signal,
    reserve: () => {
      events.push('reserved')
      return 'request'
    },
    settle: (id, value) => events.push({ id, ...value })
  })
  return { adapter, controller, events }
}
test('provider receives only admitted context after reservation; operation stays broker data', async () => {
  let input
  const f = fixture(async (value) => {
    assert.deepEqual(f.events, ['reserved'])
    input = value
    return {
      text: '{"tool":"read","path":"source.ts"}',
      terminal: true,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 }
    }
  })
  assert.deepEqual(await f.adapter.next(null), {
    tool: 'read',
    path: 'source.ts'
  })
  assert.equal(input.contract.objective, task.objective)
  assert.equal(JSON.stringify(input).includes('must-not-be-context'), false)
  assert.equal(f.events[1].state, 'settled')
  assert.equal(f.events[1].usage.totalTokens, 15)
})
test('provider failures and unknown usage never masquerade as a valid operation or leak errors', async () => {
  for (const response of [
    {
      text: 'not JSON',
      terminal: true,
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }
    },
    { text: 'x'.repeat(524289), terminal: true },
    { text: '{"tool":"finish"}', terminal: true },
    { text: '{"tool":"finish"}', terminal: false },
    {
      text: '{}',
      terminal: true,
      usage: { inputTokens: -1, outputTokens: 1, totalTokens: 0 }
    }
  ]) {
    const f = fixture(async () => response)
    await assert.rejects(f.adapter.next(null), /Provider/)
    assert.equal(f.events.length, 2)
  }
  const f = fixture(async () => {
    throw new Error('secret-token-in-provider-error')
  })
  await assert.rejects(
    f.adapter.next(null),
    (error) => !error.message.includes('secret-token')
  )
  assert.equal(f.events[1].state, 'unresolved')
})
test('cancellation blocks dispatch or late operation; remote uncertainty remains explicit', async () => {
  let resolve
  const f = fixture(
    () =>
      new Promise((done) => {
        resolve = done
      })
  )
  const pending = f.adapter.next(null)
  f.controller.abort()
  resolve({
    text: '{"tool":"finish"}',
    terminal: true,
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }
  })
  await assert.rejects(pending, /Provider/)
  assert.equal(f.events[1].state, 'settled')
  await assert.rejects(f.adapter.next(null), /Provider/)
  assert.equal(f.events.length, 2)
})

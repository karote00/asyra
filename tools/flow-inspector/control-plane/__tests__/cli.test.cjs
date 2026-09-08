/* global fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { startServer } = require('../server.cjs')
const { main } = require('../cli.cjs')
const root = path.resolve(__dirname, '../../../..')

test('offline provider contract uses identical CLI, HTTP and service task evidence', async () => {
  const { randomUUID } = require('node:crypto')
  const parent = path.join(root, 'tmp/flow-inspector/cli-tests')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'provider-'))
  const authorization = {
    id: randomUUID(),
    actor: 'local-developer',
    adapter: 'codex-app-server',
    model: 'gpt-5.4-mini',
    billing: 'chatgpt-subscription',
    maxRequests: 1,
    expiresAt: '2099-01-01T00:00:00.000Z'
  }
  const server = await startServer(root, {
    url: 'http://127.0.0.1:0',
    serviceOptions: {
      directory,
      agentOptions: {
        available: () => true,
        providerAuthorization: authorization,
        providerComplete: async () => ({
          terminal: true,
          text: '{"tool":"shell"}',
          usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 }
        })
      }
    }
  })
  const messages = []
  try {
    const state = server.service.state()
    const request = {
      requestId: randomUUID(),
      stepId: 'finalize-transaction-state',
      objective: 'Offline provider denial',
      adapter: 'provider',
      scenario: 'task',
      providerAuthorizationId: authorization.id,
      allowedFiles: ['packages/factory/src/data-transact.ts'],
      contractDigest: state.contract.digest,
      revision: 1,
      budgets: { elapsedMs: 60000, toolCalls: 3, attempts: 2 }
    }
    const file = path.join(directory, 'request.json')
    fs.writeFileSync(file, JSON.stringify(request))
    const invoke = (...args) =>
      main(['--url', server.origin, ...args], {
        repositoryRoot: root,
        write: (value) => messages.push(value)
      })
    await invoke('task-start', path.relative(root, file))
    await server.service.waitTask(request.requestId)
    messages.length = 0
    await invoke('task-show', request.requestId)
    const http = await fetch(
      server.origin + '/api/tasks/' + request.requestId
    ).then((response) => response.json())
    assert.deepEqual(JSON.parse(messages.join('')), http)
    assert.deepEqual(http, server.service.getTask(request.requestId))
    assert.equal(http.providerRequests[0].usage.totalTokens, 3)
    assert.equal(http.deliveryStatus, 'not-delivered')
  } finally {
    await server.close()
  }
})

test(
  'CLI attaches to the running board and uses its action and evidence authority',
  { timeout: 20000 },
  async () => {
    const parent = path.join(root, 'tmp/flow-inspector/cli-tests')
    fs.mkdirSync(parent, { recursive: true })
    const directory = fs.mkdtempSync(path.join(parent, 'store-'))
    const server = await startServer(root, {
      url: 'http://127.0.0.1:0',
      serviceOptions: { directory }
    })
    const messages = []
    const options = { write: (value) => messages.push(value) }
    const invoke = (...args) => main(['--url', server.origin, ...args], options)
    try {
      assert.equal(await invoke('mapping-diff'), 0)
      assert.match(messages.join('\n'), /unchanged/)
      assert.equal(await invoke('prove'), 0)
      const runs = server.service.state().runs
      assert.equal(runs.length, server.service.contract().scenarios.length + 1)
      assert.equal(await invoke('show', runs[0].id), 0)
      assert.match(messages.join('\n'), /Core proof passed/)
      assert.match(messages.join('\n'), /Mapping/)
      assert.equal(await invoke('status'), 0)
      await assert.rejects(invoke('mapping-accept', 'invalid', 'reason'))
      assert.equal(server.service.state().runs.length, runs.length)
    } finally {
      await server.close()
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }
)

test(
  'Phase 4 CLI and HTTP share candidate review and read-only baseline snapshot',
  { timeout: 20000 },
  async (t) => {
    const parent = path.join(root, 'tmp/flow-inspector/cli-tests')
    fs.mkdirSync(parent, { recursive: true })
    const directory = fs.mkdtempSync(path.join(parent, 'phase4-'))
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const server = await startServer(root, {
      url: 'http://127.0.0.1:0',
      serviceOptions: { directory }
    })
    const messages = []
    const invoke = (...args) =>
      main(['--url', server.origin, ...args], {
        write: (value) => messages.push(value)
      })
    try {
      assert.equal(await invoke('candidate'), 0)
      const id = server.service.state().runs[0].id
      assert.equal(await invoke('contract-diff', id), 0)
      const review = server.service.state().evolution.reviews[0]
      assert.equal(
        await invoke('contract-accept', review.id, 'Reviewed candidate'),
        0
      )
      assert.equal(await invoke('shared'), 0)
      assert.match(messages.at(-1), /observedAt/)
      assert.match(messages.at(-1), /not-assessed/)
      assert.equal(server.service.state().evolution.revision, 2)
    } finally {
      await server.close()
    }
  }
)

test(
  'CI trial reports behavioral results separately from mandatory delivery enforcement',
  { timeout: 30000 },
  async (t) => {
    const parent = path.join(root, 'tmp/flow-inspector/cli-tests')
    fs.mkdirSync(parent, { recursive: true })
    const directory = fs.mkdtempSync(path.join(parent, 'trial-'))
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const server = await startServer(root, {
      url: 'http://127.0.0.1:0',
      serviceOptions: { directory }
    })
    const messages = []
    try {
      assert.equal(
        await main(['--url', server.origin, 'ci-trial'], {
          write: (v) => messages.push(v)
        }),
        0
      )
      assert.match(messages.join('\n'), /trial.*not.*required/i)
      assert.match(messages.join('\n'), /blocked/)
      assert.equal(server.service.state().runs.length, 1)
      assert.equal(
        await main(['--url', server.origin, 'ci-demo'], {
          write: (v) => messages.push(v)
        }),
        1
      )
      const negative = server.service.get(server.service.state().runs[0].id)
      assert.equal(negative.ci.evidence.status, 'failed')
      assert.equal(negative.ci.deliveryStatus, 'blocked')
      assert.deepEqual(
        negative.evidence.cases
          .filter((c) => c.status === 'failed')
          .map((c) => c.id)
          .sort(),
        ['cancel.delivery', 'cancel.outcome']
      )
      assert.equal(
        await main(['--url', server.origin, 'ci-trial'], {
          write: (v) => messages.push(v)
        }),
        0
      )
      const recovery = server.service.get(server.service.state().runs[0].id)
      assert.equal(recovery.ci.evidence.passedCount, 6)
      assert.equal(recovery.snapshot.digest, negative.snapshot.digest)
    } finally {
      await server.close()
    }
  }
)

test(
  'Phase 5 CLI and HTTP share task start, cancellation, handoff and retry identity',
  { timeout: 15000 },
  async (t) => {
    const { randomUUID } = require('node:crypto')
    const parent = path.join(root, 'tmp/flow-inspector/cli-tests')
    fs.mkdirSync(parent, { recursive: true })
    const directory = fs.mkdtempSync(path.join(parent, 'phase5-'))
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const server = await startServer(root, {
      url: 'http://127.0.0.1:0',
      serviceOptions: { directory, agentOptions: { available: () => true } }
    })
    const messages = []
    const invoke = (...args) =>
      main(['--url', server.origin, ...args], {
        repositoryRoot: root,
        write: (value) => messages.push(value)
      })
    try {
      const state = server.service.state()
      const request = {
        requestId: randomUUID(),
        stepId: 'finalize-transaction-state',
        objective: 'Review isolated source',
        allowedFiles: ['packages/factory/src/data-transact.ts'],
        adapter: 'demonstration',
        scenario: 'stall',
        contractDigest: state.contract.digest,
        revision: state.mapping.revision,
        budgets: { elapsedMs: 10000, toolCalls: 20, attempts: 3 }
      }
      const file = path.join(directory, 'request.json')
      fs.writeFileSync(file, JSON.stringify(request))
      const denied = await fetch(server.origin + '/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request)
      })
      assert.equal(denied.status, 403)
      assert.equal(await invoke('task-start', path.relative(root, file)), 0)
      const id = JSON.parse(messages.at(-1)).id
      assert.equal(id, request.requestId)
      assert.equal(await invoke('task-cancel', id), 0)
      assert.equal(await invoke('task-show', id), 0)
      assert.equal(JSON.parse(messages.at(-1)).phase, 'cancelled')
      assert.equal(await invoke('task-handoff', id), 0)
      assert.equal(await invoke('status'), 0)
      assert.equal(JSON.parse(messages.at(-1)).tasks.records[0].id, id)
      assert.equal(server.service.getTask(id).phase, 'handed-off')
      assert.equal(server.service.getTask(id).deliveryStatus, 'not-delivered')
    } finally {
      await server.close()
    }
  }
)

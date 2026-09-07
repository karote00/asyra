/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { startServer } = require('../server.cjs')
const { main } = require('../cli.cjs')
const root = path.resolve(__dirname, '../../../..')

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

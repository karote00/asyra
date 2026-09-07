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

/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const { setImmediate } = require('node:timers')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const path = require('node:path')
const { createProtocol, threadRequest } = require('../agent-transport.cjs')
const { openLocalTransport } = require('../agent-transport.cjs')
const { completeTurn } = require('../agent-transport.cjs')
const { providerProfile } = require('../agent-transport.cjs')
const { spawnSync } = require('node:child_process')
function peer() {
  const child = new EventEmitter()
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.stdin = { write: (line) => child.emit('request', JSON.parse(line)) }
  child.kill = () => child.emit('close', 0)
  return child
}
test('transport policy has no runtime environment, tools, workspace roots or inherited instructions', () => {
  const request = threadRequest('/isolated', 'selected')
  assert.deepEqual(request.environments, [])
  assert.deepEqual(request.dynamicTools, [])
  assert.deepEqual(request.runtimeWorkspaceRoots, [])
  assert.equal(request.allowProviderModelFallback, false)
  assert.equal(request.config['features.shell_tool'], false)
  assert.equal(request.config.web_search, 'disabled')
  assert.equal(request.ephemeral, true)
  assert.equal(request.modelProvider, 'openai')
  assert.equal(request.config['model_providers.openai'], undefined)
})
test('protocol routes matching responses and rejects unsolicited tool execution without reflecting raw data', async () => {
  const child = peer()
  const protocol = createProtocol(child)
  child.once('request', ({ id }) =>
    child.stdout.emit(
      'data',
      Buffer.from(JSON.stringify({ id, result: { ok: true } }) + '\n')
    )
  )
  assert.deepEqual(await protocol.request('initialize', {}), { ok: true })
  const pending = protocol.request('turn/start', {})
  child.stdout.emit(
    'data',
    Buffer.from(
      '{"id":99,"method":"item/tool/call","params":{"secret":"marker"}}\n'
    )
  )
  await assert.rejects(pending, /Provider protocol/)
  await protocol.close()
})
test('malformed and oversized protocol output fails closed', async () => {
  for (const bytes of ['invalid\n', 'x'.repeat(524289)]) {
    const child = peer()
    const protocol = createProtocol(child)
    const pending = protocol.request('initialize', {})
    child.stdout.emit('data', Buffer.from(bytes))
    await assert.rejects(pending, /Provider protocol/)
    await protocol.close()
  }
})
test('protocol preserves UTF-8 across stream chunk boundaries', async () => {
  const child = peer()
  const protocol = createProtocol(child)
  child.once('request', ({ id }) => {
    const bytes = Buffer.from(
      JSON.stringify({ id, result: { text: '正體中文' } }) + '\n'
    )
    const split = bytes.indexOf(Buffer.from('正')) + 1
    child.stdout.emit('data', bytes.subarray(0, split))
    child.stdout.emit('data', bytes.subarray(split))
  })
  assert.deepEqual(await protocol.request('initialize', {}), {
    text: '正體中文'
  })
  await protocol.close()
})

const executable = '/Applications/ChatGPT.app/Contents/Resources/codex'
test('subscription transport refuses API-key authentication before starting a model turn', async () => {
  let turns = 0
  const protocol = {
    events: new EventEmitter(),
    notify: () => undefined,
    async request(method) {
      if (method === 'account/read') return { account: { type: 'apiKey' } }
      if (method === 'thread/start')
        return {
          thread: { id: 'thread' },
          model: 'model',
          instructionSources: [],
          runtimeWorkspaceRoots: []
        }
      if (method === 'turn/start') {
        turns++
        throw new Error('turn must not start')
      }
      return {}
    }
  }
  await assert.rejects(
    completeTurn(
      protocol,
      { model: 'model', signal: new AbortController().signal },
      '/isolated'
    )
  )
  assert.equal(turns, 0)
})
test('turn completion binds final JSON and provider usage, cancellation stays unresolved', async () => {
  for (const cancelled of [false, true]) {
    const events = new EventEmitter()
    const controller = new AbortController()
    const protocol = {
      events,
      notify: () => undefined,
      async request(method) {
        if (method === 'account/read') return { account: { type: 'chatgpt' } }
        if (method === 'thread/start')
          return {
            thread: { id: 'thread' },
            model: 'model',
            instructionSources: [],
            runtimeWorkspaceRoots: []
          }
        if (method === 'turn/start') {
          setImmediate(() => {
            if (cancelled) return controller.abort()
            for (const item of [
              { type: 'userMessage', content: [] },
              {
                type: 'agentMessage',
                phase: 'commentary',
                text: 'Working on the requested source.'
              }
            ]) {
              events.emit('notification', {
                method: 'item/completed',
                params: { threadId: 'thread', turnId: 'turn', item }
              })
            }
            events.emit('notification', {
              method: 'thread/tokenUsage/updated',
              params: {
                threadId: 'thread',
                turnId: 'turn',
                tokenUsage: {
                  total: { inputTokens: 2, outputTokens: 1, totalTokens: 3 }
                }
              }
            })
            events.emit('notification', {
              method: 'item/completed',
              params: {
                threadId: 'thread',
                turnId: 'turn',
                item: { type: 'agentMessage', text: '{"tool":"finish"}' }
              }
            })
            events.emit('notification', {
              method: 'turn/completed',
              params: {
                threadId: 'thread',
                turn: { id: 'turn', status: 'completed' }
              }
            })
          })
          return { turn: { id: 'turn' } }
        }
        return {}
      }
    }
    const result = await completeTurn(
      protocol,
      { model: 'model', contract: {}, history: [], signal: controller.signal },
      '/isolated'
    )
    assert.equal(result.terminal, !cancelled)
    if (!cancelled) {
      assert.equal(result.text, '{"tool":"finish"}')
      assert.equal(result.usage.totalTokens, 3)
    }
  }
})
test(
  'trusted transport OS boundary denies undeclared source, credential writes and child creation',
  {
    skip: process.platform !== 'darwin'
  },
  () => {
    const repositoryRoot = path.resolve(__dirname, '../../../..')
    const parent = path.join(
      repositoryRoot,
      'tmp/flow-inspector/provider-containment'
    )
    fs.mkdirSync(parent, { recursive: true })
    const directory = fs.mkdtempSync(path.join(parent, 'run-'))
    const credential = path.join(parent, 'fake-auth.json')
    fs.writeFileSync(credential, 'formal-test-marker')
    const script = `const fs=require('node:fs');const cp=require('node:child_process');
    let denied=0;
    try{fs.readFileSync(${JSON.stringify(path.join(repositoryRoot, 'AGENTS.md'))})}catch{denied++}
    try{fs.writeFileSync(${JSON.stringify(credential)},'changed')}catch{denied++}
    if(cp.spawnSync(process.execPath,['-e','process.exit(0)']).error)denied++;
    if(fs.readFileSync(${JSON.stringify(credential)},'utf8')!=='formal-test-marker')process.exit(2);
    process.exit(denied===3?0:1)`
    const result = spawnSync(
      '/usr/bin/sandbox-exec',
      [
        '-p',
        providerProfile(directory, process.execPath, credential),
        process.execPath,
        '-e',
        script
      ],
      {
        cwd: directory,
        env: { PATH: '/usr/bin:/bin', HOME: directory },
        timeout: 5000
      }
    )
    assert.equal(result.status, 0)
    assert.equal(fs.readFileSync(credential, 'utf8'), 'formal-test-marker')
  }
)
test(
  'installed app-server initializes in isolated containment without credentials or model execution',
  {
    skip: process.platform !== 'darwin' || !fs.existsSync(executable)
  },
  async () => {
    const repositoryRoot = path.resolve(__dirname, '../../../..')
    const parent = path.join(
      repositoryRoot,
      'tmp/flow-inspector/provider-preflight'
    )
    fs.mkdirSync(parent, { recursive: true })
    const directory = fs.mkdtempSync(path.join(parent, 'run-'))
    let pid
    const protocol = openLocalTransport({
      repositoryRoot,
      directory,
      executable,
      onSpawn: (value) => {
        pid = value
      }
    })
    try {
      const result = await protocol.request('initialize', {
        clientInfo: { name: 'bounded-provider-contract-test', version: '1' },
        capabilities: { experimentalApi: true }
      })
      assert.ok(result)
      protocol.notify('initialized')
      const account = await protocol.request('account/read', {
        refreshToken: false
      })
      assert.equal(account.account, null)
      assert.equal(fs.existsSync(path.join(directory, 'auth.json')), false)
      const thread = await protocol.request(
        'thread/start',
        threadRequest(directory, 'gpt-5.4-mini')
      )
      assert.equal(thread.model, 'gpt-5.4-mini')
      assert.deepEqual(thread.runtimeWorkspaceRoots, [])
      assert.deepEqual(thread.instructionSources, [])
    } finally {
      await protocol.close()
    }
    assert.ok(pid)
    assert.throws(() => process.kill(pid, 0), /ESRCH/)
  }
)

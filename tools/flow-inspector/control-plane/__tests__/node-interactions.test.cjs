/* global fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const { setImmediate } = require('node:timers')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { randomUUID } = require('node:crypto')
const { createService, LOCAL_ACTOR } = require('../service.cjs')
const { loadContract } = require('../contracts.cjs')
const localization = require('../localization.cjs')
const { localizationFixture } = require('./localization-runtime-fixture.cjs')

function setup(t, options = {}) {
  const fixture = localizationFixture()
  const root = fixture.repository
  const contract = loadContract(root)
  const candidate = contract.cases[0]
  const context = localization.beginObservation(root, {
    manifestPaths: [contract.manifestPath],
    command: {
      cwd: '.',
      argv: ['sh', '-c', 'untrusted evidence must not execute']
    }
  })
  const record = localization.completeObservation(root, context, {
    success: false,
    testResults: [
      {
        name: path.join(root, contract.testFile),
        assertionResults: [
          {
            fullName: candidate.testName,
            status: 'failed',
            failureMessages: ['original failure']
          }
        ]
      }
    ]
  })
  const directory = path.join(root, 'tmp/node-service')
  const serviceOptions = { directory, ...options }
  let service = createService(root, serviceOptions)
  t.after(async () => {
    await service.close()
    fixture.restore()
  })
  return {
    fixture,
    root,
    directory,
    record,
    selection: { runId: record.id, caseId: record.cases[0].id },
    get service() {
      return service
    },
    async restart() {
      await service.close()
      service = createService(root, serviceOptions)
    }
  }
}
async function settled(service, selection) {
  for (let i = 0; i < 200; i++) {
    const value = service.nodeContext(selection.runId, selection.caseId)
      .actions[0]
    if (value.status !== 'running') return value
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('Action did not settle')
}

test('node actions deny before effects and retain append-only attribution, duplicates and missing references', async (t) => {
  const f = setup(t)
  const request = {
    ...f.selection,
    requestId: randomUUID(),
    text: '<img src=x onerror=alert(1)> investigation note'
  }
  for (const method of ['addNodeComment', 'previewNodeRerun', 'startNodeRerun'])
    assert.throws(
      () => f.service[method](request, { id: 'viewer', capabilities: [] }),
      /not authorized/
    )
  assert.equal(
    fs.existsSync(path.join(f.directory, 'node-interactions.json')),
    false
  )
  for (const text of ['', '   ', 'x'.repeat(2001)]) {
    assert.throws(
      () => f.service.addNodeComment({ ...request, text }, LOCAL_ACTOR),
      /1-2000/
    )
  }
  assert.throws(
    () =>
      f.service.previewNodeRerun({ ...f.selection, argv: ['sh'] }, LOCAL_ACTOR),
    /Invalid/
  )
  const saved = f.service.addNodeComment(request, LOCAL_ACTOR)
  assert.equal(saved.actor, LOCAL_ACTOR.id)
  assert.equal(saved.node.stepId, f.record.cases[0].locations[0].stepId)
  assert.deepEqual(f.service.addNodeComment(request, LOCAL_ACTOR), saved)
  assert.throws(
    () =>
      f.service.addNodeComment({ ...request, text: 'replace' }, LOCAL_ACTOR),
    /Conflicting/
  )
  assert.throws(
    () => f.service.addNodeComment({ ...request, delete: true }, LOCAL_ACTOR),
    /Invalid/
  )
  await f.restart()
  assert.equal(
    f.service.nodeContext(request.runId, request.caseId).comments.length,
    1
  )
  fs.unlinkSync(
    path.join(
      localization.observationDirectory(f.root),
      request.runId + '.json'
    )
  )
  const historical = f.service.nodeContext(request.runId, request.caseId)
  assert.match(historical.reference, /unavailable/)
  assert.deepEqual(historical.comments[0], saved)
  assert.throws(
    () => f.service.previewNodeRerun(f.selection, LOCAL_ACTOR),
    /unavailable/
  )
})

test('rerun preview pins exact selection, rejects drift and allows a fresh source fix without trusting recorded argv', async (t) => {
  let calls = 0
  const f = setup(t, {
    nodeInteractionOptions: {
      execute: async () => {
        calls++
        return { code: 1, reason: 'test runner unavailable', output: '' }
      }
    }
  })
  const preview = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  assert.equal(preview.command.runner, 'vitest')
  assert.equal(preview.test.name, f.record.cases[0].testName)
  assert.ok(!JSON.stringify(preview.command).includes('untrusted'))
  const source = path.join(f.root, 'packages/factory/src/value-clone.ts')
  fs.chmodSync(source, 0o600)
  fs.appendFileSync(source, '\n// Source changed after preview.\n')
  const request = {
    ...f.selection,
    requestId: randomUUID(),
    previewDigest: preview.previewDigest
  }
  assert.throws(() => f.service.startNodeRerun(request, LOCAL_ACTOR), /stale/)
  assert.equal(calls, 0)
  const fresh = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  assert.notEqual(fresh.sourceDigest, preview.sourceDigest)
  request.previewDigest = fresh.previewDigest
  const first = f.service.startNodeRerun(request, LOCAL_ACTOR)
  assert.equal(f.service.startNodeRerun(request, LOCAL_ACTOR).id, first.id)
  assert.throws(
    () =>
      f.service.startNodeRerun(
        { ...request, previewDigest: 'different' },
        LOCAL_ACTOR
      ),
    /Conflicting/
  )
  assert.throws(() => f.service.start({}, LOCAL_ACTOR), /running/)
  const action = await settled(f.service, f.selection)
  assert.equal(calls, 1)
  assert.equal(action.observedStatus, 'unavailable')
  assert.ok(action.issues.length)
  assert.equal(f.service.testResult(f.record.id).cases[0].status, 'failed')
  await f.restart()
  assert.equal(f.service.startNodeRerun(request, LOCAL_ACTOR).id, first.id)
  assert.equal(calls, 1)
})

test(
  'original Vitest rerun executes only the selected case and retains the new observation',
  { timeout: 30000 },
  async (t) => {
    const f = setup(t)
    const preview = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
    f.service.startNodeRerun(
      {
        ...f.selection,
        requestId: randomUUID(),
        previewDigest: preview.previewDigest
      },
      LOCAL_ACTOR
    )
    const action = await settled(f.service, f.selection)
    assert.equal(action.observedStatus, 'passed', JSON.stringify(action))
    const result = f.service.testResult(action.resultRunId)
    const executed = result.cases.filter((item) => item.status !== 'skipped')
    assert.equal(executed.length, 1)
    assert.equal(executed[0].testName, preview.test.name)
    assert.equal(executed[0].resolution, 'mapped')
    assert.equal(f.service.testResult(f.record.id).cases[0].status, 'failed')
  }
)

test('unwritable interaction storage prevents comment acknowledgement and rerun execution', async (t) => {
  let calls = 0
  const f = setup(t, {
    nodeInteractionOptions: {
      execute: async () => {
        calls++
        return {}
      }
    }
  })
  const preview = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  fs.mkdirSync(path.join(f.directory, 'node-interactions.json'))
  assert.throws(() =>
    f.service.addNodeComment(
      { ...f.selection, requestId: randomUUID(), text: 'not saved' },
      LOCAL_ACTOR
    )
  )
  assert.throws(() =>
    f.service.startNodeRerun(
      {
        ...f.selection,
        requestId: randomUUID(),
        previewDigest: preview.previewDigest
      },
      LOCAL_ACTOR
    )
  )
  assert.equal(calls, 0)
  assert.equal(f.service.testResult(f.record.id).cases[0].status, 'failed')
})

test('cancel and shutdown settle owned execution and never restart a duplicate request', async (t) => {
  let calls = 0
  const f = setup(t, {
    nodeInteractionOptions: {
      execute: ({ signal }) =>
        new Promise((resolve) => {
          calls++
          if (signal.aborted)
            return resolve({ code: null, reason: 'cancelled', output: '' })
          signal.addEventListener(
            'abort',
            () => resolve({ code: null, reason: 'cancelled', output: '' }),
            { once: true }
          )
        })
    }
  })
  const preview = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  const request = {
    ...f.selection,
    requestId: randomUUID(),
    previewDigest: preview.previewDigest
  }
  f.service.startNodeRerun(request, LOCAL_ACTOR)
  await new Promise((resolve) => setImmediate(resolve))
  const result = await f.service.cancelNodeRerun(request.requestId, LOCAL_ACTOR)
  assert.equal(result.status, 'cancelled')
  assert.equal(result.observedStatus, 'unavailable')
  const next = { ...request, requestId: randomUUID() }
  f.service.startNodeRerun(next, LOCAL_ACTOR)
  await f.restart()
  assert.equal(f.service.startNodeRerun(next, LOCAL_ACTOR).status, 'cancelled')
  assert.equal(calls, 2)
})

test('changed mapping preserves notes, rejects rerun and never silently relocates context', async (t) => {
  const f = setup(t)
  f.service.addNodeComment(
    { ...f.selection, requestId: randomUUID(), text: 'Original owner note' },
    LOCAL_ACTOR
  )
  const file = path.join(f.root, 'packages/factory/flow-contracts.json')
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
  manifest.flows[0].title += ' changed'
  fs.chmodSync(file, 0o600)
  fs.writeFileSync(file, JSON.stringify(manifest))
  const context = f.service.nodeContext(f.selection.runId, f.selection.caseId)
  assert.match(context.reference, /Mapping changed/)
  assert.equal(
    context.comments[0].node.title,
    f.record.cases[0].locations[0].title
  )
  assert.throws(
    () => f.service.previewNodeRerun(f.selection, LOCAL_ACTOR),
    /Mapping changed/
  )
})

test('Playwright selection pins the complete producer scope and binds participant observation identity', async (t) => {
  const { createNodeInteractions } = require('../node-interactions.cjs')
  const { ActionError } = require('../service.cjs')
  const root = path.resolve(__dirname, '../../../..')
  const manifest =
    'apps/asyra-design/playwright-collaboration-flow-contracts.json'
  const contract = loadContract(root, undefined, manifest)
  const context = localization.beginObservation(root, {
    manifestPaths: [manifest]
  })
  const candidate = contract.cases[0]
  const record = localization.completeObservation(
    root,
    context,
    {
      success: false,
      testResults: [
        {
          name: path.join(root, candidate.testFile),
          projectName: candidate.projectName,
          assertionResults: [
            {
              fullName: candidate.testName,
              projectName: candidate.projectName,
              status: 'failed',
              failureMessages: ['original']
            }
          ]
        }
      ]
    },
    { projects: [candidate.projectName] }
  )
  const directory = path.join(
    root,
    'tmp/flow-inspector/stage-c-test-' + randomUUID()
  )
  fs.mkdirSync(directory, { recursive: true })
  const observations = localization.createObservationReader(
    localization.observationDirectory(root)
  )
  let received, newObservation
  const owner = createNodeInteractions(root, {
    directory,
    observations,
    requireIdle() {
      /* The isolated owner has no other service execution. */
    },
    ErrorType: ActionError,
    execute: async (options) => {
      received = options
      newObservation = JSON.parse(
        fs.readFileSync(
          options.env.PLAYWRIGHT_JSON_OUTPUT_NAME + '.context.json',
          'utf8'
        )
      ).id
      return { code: 1, reason: 'simulated runner failure', output: '' }
    }
  })
  t.after(async () => {
    await owner.close()
    fs.rmSync(directory, { recursive: true, force: true })
    for (const id of [record.id, newObservation].filter(Boolean))
      fs.rmSync(
        path.join(localization.observationDirectory(root), id + '.json'),
        { force: true }
      )
  })
  const selection = { runId: record.id, caseId: record.cases[0].id }
  const preview = owner.preview(selection)
  assert.equal(preview.command.runner, 'playwright')
  assert.match(
    preview.command.args[preview.command.args.indexOf('--grep') + 1],
    /^\^chromium /
  )
  owner.start(
    {
      ...selection,
      requestId: randomUUID(),
      previewDigest: preview.previewDigest
    },
    LOCAL_ACTOR.id
  )
  while (owner.isActive())
    await new Promise((resolve) => setTimeout(resolve, 10))
  assert.ok(received)
  assert.equal(received.env.FLOW_OBSERVATION_ID, newObservation)
  const config = received.args[received.args.indexOf('--config') + 1]
  assert.match(fs.readFileSync(config, 'utf8'), /reuseExistingServer: false/)
  const result = owner.context(selection.runId, selection.caseId).actions[0]
  assert.notEqual(result.observedStatus, 'passed')
})

test('context reads never capture source and corrupt retained interactions remain explicit', async (t) => {
  const f = setup(t)
  const original = localization.sourceFingerprint
  let captures = 0
  localization.sourceFingerprint = (...args) => {
    captures++
    return original(...args)
  }
  t.after(() => {
    localization.sourceFingerprint = original
  })
  const request = {
    ...f.selection,
    requestId: randomUUID(),
    text: 'retained context'
  }
  f.service.addNodeComment(request, LOCAL_ACTOR)
  for (let index = 0; index < 5; index++)
    f.service.nodeContext(request.runId, request.caseId)
  assert.equal(captures, 0)
  f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  assert.equal(captures, 1)
  fs.writeFileSync(
    path.join(f.directory, 'node-interactions.json'),
    JSON.stringify({
      format: 1,
      actions: [],
      comments: [{ id: request.requestId }]
    })
  )
  assert.throws(
    () => f.service.nodeContext(request.runId, request.caseId),
    /invalid/i
  )
})

test(
  'original Playwright rerun uses the selected case and owned services with retained participant context',
  { timeout: 210000 },
  async (t) => {
    const net = require('node:net')
    const { createNodeInteractions } = require('../node-interactions.cjs')
    const { ActionError } = require('../service.cjs')
    const { runProcess } = require('../runner.cjs')
    const freePort = async () => {
      const server = net.createServer()
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
      const port = server.address().port
      await new Promise((resolve) => server.close(resolve))
      return port
    }
    const root = path.resolve(__dirname, '../../../..')
    const manifest =
      'apps/asyra-design/playwright-collaboration-flow-contracts.json'
    const contract = loadContract(root, undefined, manifest)
    const candidate = contract.cases[0]
    const initial = localization.beginObservation(root, {
      manifestPaths: [manifest]
    })
    const record = localization.completeObservation(
      root,
      initial,
      {
        success: false,
        testResults: [
          {
            name: path.join(root, candidate.testFile),
            assertionResults: [
              {
                fullName: candidate.testName,
                status: 'failed',
                failureMessages: ['Original selected-case failure']
              }
            ]
          }
        ]
      },
      { projects: [candidate.projectName] }
    )
    const directory = path.join(
      root,
      'tmp/flow-inspector/node-playwright-' + randomUUID()
    )
    fs.mkdirSync(directory, { recursive: true })
    const [app, backend, collaboration] = await Promise.all([
      freePort(),
      freePort(),
      freePort()
    ])
    const reader = localization.createObservationReader(
      localization.observationDirectory(root)
    )
    const owner = createNodeInteractions(root, {
      directory,
      observations: reader,
      requireIdle() {
        /* The isolated owner has no other service execution. */
      },
      ErrorType: ActionError,
      execute: (options) =>
        runProcess({
          ...options,
          env: {
            ...options.env,
            APP_URL: 'http://127.0.0.1:' + app,
            E2E_DOCUMENT_BACKEND_URL: 'http://127.0.0.1:' + backend,
            DOCUMENT_BACKEND_PORT: String(backend),
            COLLABORATION_WS_HOST: '127.0.0.1',
            COLLABORATION_WS_PORT: String(collaboration),
            VITE_COLLABORATION_WS_URL:
              'ws://127.0.0.1:' + collaboration + '/collaboration',
            ...(process.env.RUNNER_TEMP
              ? { TMPDIR: process.env.RUNNER_TEMP }
              : {})
          }
        })
    })
    let action
    t.after(async () => {
      await owner.close()
      for (const id of [record.id, action?.resultRunId].filter(Boolean))
        fs.rmSync(
          path.join(localization.observationDirectory(root), id + '.json'),
          { force: true }
        )
    })
    const selection = { runId: record.id, caseId: record.cases[0].id }
    const preview = owner.preview(selection)
    owner.start(
      {
        ...selection,
        requestId: randomUUID(),
        previewDigest: preview.previewDigest
      },
      LOCAL_ACTOR.id
    )
    const deadline = Date.now() + 190000
    while (owner.isActive() && Date.now() < deadline)
      await new Promise((resolve) => setTimeout(resolve, 100))
    action = owner.context(selection.runId, selection.caseId).actions[0]
    fs.writeFileSync(
      path.join(directory, 'action-result.json'),
      JSON.stringify(action, null, 2)
    )
    assert.equal(
      action.observedStatus,
      'passed',
      JSON.stringify({
        status: action.status,
        issues: action.issues,
        error: action.error,
        process: action.process,
        directory
      })
    )
    const result = reader.get(action.resultRunId)
    assert.equal(result.cases.length, 1)
    assert.equal(result.cases[0].testName, candidate.testName)
    assert.equal(result.cases[0].resolution, 'mapped')
    assert.deepEqual(result.issues, [])
  }
)

test('source change between confirmation and runner handoff never executes', async (t) => {
  let calls = 0
  const f = setup(t, {
    nodeInteractionOptions: {
      execute: async () => {
        calls++
        return { code: 0, output: '' }
      }
    }
  })
  const preview = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  f.service.startNodeRerun(
    {
      ...f.selection,
      requestId: randomUUID(),
      previewDigest: preview.previewDigest
    },
    LOCAL_ACTOR
  )
  const file = path.join(f.root, 'packages/factory/src/value-clone.ts')
  fs.chmodSync(file, 0o600)
  fs.appendFileSync(file, '\n// Changed before handoff.\n')
  const action = await settled(f.service, f.selection)
  assert.equal(calls, 0)
  assert.match(action.error, /source.*changed/i)
})

test('HTTP capability and CLI mutations share retained node context without executing denied requests', async (t) => {
  const { startServer } = require('../server.cjs')
  const { main } = require('../cli.cjs')
  const net = require('node:net')
  const f = setup(t)
  await f.service.close()
  const listener = net.createServer()
  await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve))
  const port = listener.address().port
  await new Promise((resolve) => listener.close(resolve))
  const server = await startServer(f.root, {
    url: 'http://127.0.0.1:' + port,
    serviceOptions: { directory: f.directory }
  })
  t.after(() => server.close())
  const request = {
    ...f.selection,
    requestId: randomUUID(),
    text: '界'.repeat(2000)
  }
  const denied = await fetch(server.origin + '/api/node-comments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  })
  assert.equal(denied.status, 403)
  assert.equal(
    fs.existsSync(path.join(f.directory, 'node-interactions.json')),
    false
  )
  const requestPath = path.join(f.root, 'tmp/comment.json')
  fs.writeFileSync(requestPath, JSON.stringify(request))
  const messages = []
  assert.equal(
    await main(['--url', server.origin, 'node-comment', 'tmp/comment.json'], {
      repositoryRoot: f.root,
      write: (value) => messages.push(value)
    }),
    0
  )
  const comment = JSON.parse(messages.pop())
  assert.equal(comment.text, request.text)
  assert.equal(
    await main(
      ['--url', server.origin, 'node-context', request.runId, request.caseId],
      { repositoryRoot: f.root, write: (value) => messages.push(value) }
    ),
    0
  )
  assert.deepEqual(JSON.parse(messages.pop()).comments, [comment])
  await main(
    [
      '--url',
      server.origin,
      'node-context',
      request.runId,
      request.caseId,
      'summary'
    ],
    {
      repositoryRoot: f.root,
      write: (value) => messages.push(value)
    }
  )
  const summary = JSON.parse(messages.pop())
  const response = await fetch(
    server.origin + '/api/node-context/' + request.runId + '/0/summary'
  )
  assert.deepEqual(await response.json(), summary)
  assert.equal(summary.test.status, 'failed')
  assert.equal(summary.comments, undefined)

  fs.writeFileSync(requestPath, JSON.stringify(f.selection))
  await main(['--url', server.origin, 'node-preview', 'tmp/comment.json'], {
    repositoryRoot: f.root,
    write: (value) => messages.push(value)
  })
  assert.equal(JSON.parse(messages.pop()).test.name, f.record.cases[0].testName)
  const session = await (await fetch(server.origin + '/api/session')).json()
  const foreign = await fetch(server.origin + '/api/node-comments', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-proof-capability': session.capability,
      origin: 'https://foreign.example'
    },
    body: JSON.stringify({ ...request, requestId: randomUUID() })
  })
  assert.equal(foreign.status, 403)
})

test(
  'original App Vitest rerun preserves the mapped App execution context',
  { timeout: 30000 },
  async (t) => {
    const { createNodeInteractions } = require('../node-interactions.cjs')
    const { ActionError } = require('../service.cjs')
    const root = path.resolve(__dirname, '../../../..')
    const manifest = 'apps/asyra-design/undo-redo-flow-contracts.json'
    const contract = loadContract(root, undefined, manifest)
    const candidate = contract.cases[0]
    const initial = localization.beginObservation(root, {
      manifestPaths: [manifest]
    })
    const record = localization.completeObservation(root, initial, {
      success: false,
      testResults: [
        {
          name: path.join(root, contract.testFile),
          assertionResults: [
            {
              fullName: candidate.testName,
              status: 'failed',
              failureMessages: ['Original App failure']
            }
          ]
        }
      ]
    })
    const directory = path.join(
      root,
      'tmp/flow-inspector/node-app-' + randomUUID()
    )
    fs.mkdirSync(directory, { recursive: true })
    const reader = localization.createObservationReader(
      localization.observationDirectory(root)
    )
    const owner = createNodeInteractions(root, {
      directory,
      observations: reader,
      requireIdle() {
        /* No other owner is active. */
      },
      ErrorType: ActionError
    })
    let action
    t.after(async () => {
      await owner.close()
      for (const id of [record.id, action?.resultRunId].filter(Boolean))
        fs.rmSync(
          path.join(localization.observationDirectory(root), id + '.json'),
          { force: true }
        )
    })
    const selection = { runId: record.id, caseId: record.cases[0].id }
    const preview = owner.preview(selection)
    owner.start(
      {
        ...selection,
        requestId: randomUUID(),
        previewDigest: preview.previewDigest
      },
      LOCAL_ACTOR.id
    )
    const deadline = Date.now() + 20000
    while (owner.isActive() && Date.now() < deadline)
      await new Promise((resolve) => setTimeout(resolve, 50))
    action = owner.context(selection.runId, selection.caseId).actions[0]
    assert.equal(action.observedStatus, 'passed', JSON.stringify(action))
    const result = reader.get(action.resultRunId)
    assert.equal(
      result.cases.filter((item) => item.status === 'passed').length,
      1
    )
  }
)

test('caller mutation cannot retarget a confirmed asynchronous rerun', async (t) => {
  let calls = 0
  const f = setup(t, {
    nodeInteractionOptions: {
      execute: async () => {
        calls++
        return { code: 1, reason: 'retained failure', output: '' }
      }
    }
  })
  const preview = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  const request = {
    ...f.selection,
    requestId: randomUUID(),
    previewDigest: preview.previewDigest
  }
  const id = request.requestId
  const value = f.service.startNodeRerun(request, LOCAL_ACTOR)
  request.runId = randomUUID()
  value.id = randomUUID()
  value.command.args.length = 0
  const result = await settled(f.service, f.selection)
  assert.equal(result.id, id)
  assert.equal(calls, 1)
  assert.equal(result.observedStatus, 'unavailable')
})

test('completion storage errors stay visible and interrupted history cannot redispatch after restart', async (t) => {
  let directory,
    calls = 0
  const f = setup(t, {
    nodeInteractionOptions: {
      execute: async () => {
        calls++
        fs.chmodSync(directory, 0o500)
        return { code: 1, reason: 'execution failure', output: '' }
      }
    }
  })
  directory = f.directory
  t.after(() => fs.chmodSync(directory, 0o700))
  const preview = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  const request = {
    ...f.selection,
    requestId: randomUUID(),
    previewDigest: preview.previewDigest
  }
  f.service.startNodeRerun(request, LOCAL_ACTOR)
  const action = await settled(f.service, f.selection)
  assert.equal(action.status, 'failed')
  assert.match(action.error, /Unable to retain action result/)
  fs.chmodSync(directory, 0o700)
  await f.restart()
  assert.equal(
    f.service.startNodeRerun(request, LOCAL_ACTOR).status,
    'interrupted'
  )
  assert.equal(calls, 1)
})

test('restart refuses new execution while an interrupted runner may still be alive', async (t) => {
  const f = setup(t)
  const preview = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  const id = randomUUID()
  fs.writeFileSync(
    path.join(f.directory, 'node-interactions.json'),
    JSON.stringify({
      format: 1,
      comments: [],
      actions: [
        {
          ...preview,
          id,
          actor: LOCAL_ACTOR.id,
          status: 'running',
          startedAt: new Date().toISOString(),
          runnerPid: process.pid
        }
      ]
    })
  )
  await f.restart()
  const action = f.service.nodeContext(f.selection.runId, f.selection.caseId)
    .actions[0]
  assert.equal(action.status, 'interrupted')
  assert.throws(
    () =>
      f.service.startNodeRerun(
        {
          ...f.selection,
          requestId: randomUUID(),
          previewDigest: preview.previewDigest
        },
        LOCAL_ACTOR
      ),
    /running/
  )
  assert.throws(() => f.service.start({}, LOCAL_ACTOR), /running/)
})

test('node interaction implementation belongs to the action owner only', () => {
  const inspector = require('../../inspectors/flow-inspector-core-proof-flow-inspector.data.cjs')
  for (const file of [
    'tools/flow-inspector/control-plane/node-interactions.cjs',
    'tools/flow-inspector/control-plane/__tests__/node-interactions.test.cjs'
  ]) {
    assert.deepEqual(
      inspector.steps
        .filter((step) => step.implementationBoundary.includes(file))
        .map((step) => step.id),
      ['serve-proof-actions']
    )
  }
})

test('equivalent preview request field orders confirm the same selected rerun', async (t) => {
  let calls = 0
  const f = setup(t, {
    nodeInteractionOptions: {
      execute: async () => {
        calls++
        return { code: 1, reason: 'test runner unavailable', output: '' }
      }
    }
  })
  const reordered = { caseId: f.selection.caseId, runId: f.selection.runId }
  const preview = f.service.previewNodeRerun(reordered, LOCAL_ACTOR)
  const canonical = f.service.previewNodeRerun(f.selection, LOCAL_ACTOR)
  assert.equal(preview.previewDigest, canonical.previewDigest)
  const request = {
    ...reordered,
    requestId: randomUUID(),
    previewDigest: preview.previewDigest
  }
  f.service.startNodeRerun(request, LOCAL_ACTOR)
  await settled(f.service, f.selection)
  assert.equal(calls, 1)
  f.service.startNodeRerun(request, LOCAL_ACTOR)
  assert.equal(calls, 1)
})

test('investigation summary contains one bounded read-only repair entry and preserves unavailable references', async (t) => {
  let executions = 0
  const f = setup(t, {
    nodeInteractionOptions: {
      execute: async () => {
        executions++
        throw new Error('must not execute')
      }
    }
  })
  const value = f.service.nodeContext(
    f.selection.runId,
    f.selection.caseId,
    true
  )
  assert.equal(value.format, 1)
  assert.equal(value.test.status, 'failed')
  assert.equal(value.currentness.status, 'current')
  assert.equal(value.errors[0].message, 'original failure')
  assert.equal(value.node.stepId, f.record.cases[0].locations[0].stepId)
  assert.ok(value.node.specPath)
  assert.ok(value.node.implementationBoundary.length)
  assert.equal(value.rerun.originalInvocation.argv[0], 'sh')
  assert.equal(value.rerun.originalInvocationExecutable, false)
  assert.equal(value.rerun.previewAvailable, true)
  assert.equal(value.rerun.selectedCommand.runner, 'vitest')
  for (const key of ['source', 'comments', 'actions', 'originalReport'])
    assert.equal(Object.hasOwn(value, key), false)
  assert.equal(executions, 0)
  fs.unlinkSync(
    path.join(localization.observationDirectory(f.root), f.record.id + '.json')
  )
  const missing = f.service.nodeContext(
    f.selection.runId,
    f.selection.caseId,
    true
  )
  assert.equal(missing.node, null)
  assert.equal(missing.test, null)
  assert.equal(missing.currentness.status, 'unavailable')
  assert.equal(missing.rerun.previewAvailable, false)
})

test('summary bounds original evidence and reports recovery, unresolved and changed mappings without executing', async (t) => {
  const f = setup(t)
  const contract = loadContract(f.root)
  const input = localization.beginObservation(f.root, {
    manifestPaths: [contract.manifestPath],
    command: { cwd: '.', argv: ['x'.repeat(15000)] }
  })
  input.startedAt = new Date(
    Date.parse(f.record.startedAt) + 1000
  ).toISOString()
  const output = {
    success: false,
    testResults: [
      {
        name: path.join(f.root, contract.testFile),
        assertionResults: [
          {
            fullName: contract.cases[0].testName,
            status: 'failed',
            failureMessages: Array(5).fill('界'.repeat(5000))
          },
          {
            fullName: 'unregistered',
            status: 'failed',
            failureMessages: ['unknown test']
          }
        ]
      }
    ]
  }
  const record = localization.completeObservation(f.root, input, output)
  const result = f.service.nodeContext(record.id, record.cases[0].id, true)
  assert.equal(result.errors.length, 3)
  assert.equal(result.errors[0].message.length, 2000)
  assert.ok(result.node, 'long errors do not displace the investigation entry')
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < 24000)
  assert.ok(result.truncatedFields.includes('errors'))
  assert.ok(result.truncatedFields.includes('rerun.originalInvocation'))
  assert.equal(result.rerun.originalInvocation, null)
  assert.equal(
    f.service.testResult(record.id).cases[0].failures[0].length,
    5000
  )
  const unresolved = f.service.nodeContext(record.id, record.cases[1].id, true)
  assert.equal(unresolved.errors[0].message, 'unknown test')
  assert.equal(unresolved.node, null)
  assert.equal(unresolved.rerun.previewAvailable, false)
  const old = f.service.nodeContext(f.record.id, f.record.cases[0].id, true)
  assert.equal(old.currentness.status, 'superseded')
  assert.equal(old.currentness.latest[0].runId, record.id)
  const manifest = path.join(f.root, contract.manifestPath)
  fs.chmodSync(manifest, 0o600)
  const data = JSON.parse(fs.readFileSync(manifest, 'utf8'))
  data.title += ' changed'
  fs.writeFileSync(manifest, JSON.stringify(data))
  const changed = f.service.nodeContext(record.id, record.cases[0].id, true)
  assert.equal(changed.node, null)
  assert.equal(changed.rerun.previewAvailable, false)
  assert.ok(changed.reference !== 'available')
})

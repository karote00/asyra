/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { loadContract } = require('../contracts.cjs')
const { captureSource, sha256 } = require('../snapshot.cjs')
const { createTaskOwner } = require('../agent-task.cjs')
const root = path.resolve(__dirname, '../../../..')
const parent = path.join(root, 'tmp/flow-inspector/agent-task-tests')
fs.mkdirSync(parent, { recursive: true })
const sourceFile = 'packages/factory/src/data-transact.ts'
const providerAuthorization = () => ({
  id: randomUUID(),
  actor: 'human',
  adapter: 'codex-app-server',
  model: 'gpt-5.6-sol',
  billing: 'chatgpt-subscription',
  maxRequests: 4,
  expiresAt: '2099-01-01T00:00:00.000Z'
})
function fixture(options = {}) {
  const directory = fs.mkdtempSync(path.join(parent, 'run-'))
  const contract = loadContract(root)
  const owner = createTaskOwner(root, {
    directory,
    getBaseline: () => ({ contract, revision: 1 }),
    available: () => true,
    ...options
  })
  const request = {
    requestId: randomUUID(),
    stepId: 'finalize-transaction-state',
    objective: 'Review a bounded owner change',
    allowedFiles: [sourceFile],
    adapter: 'demonstration',
    scenario: 'repair',
    contractDigest: contract.digest,
    revision: 1,
    budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 }
  }
  return { owner, request, directory, contract }
}

test('provider reservations precede dispatch and survive failed attempts, handoff and restart', async () => {
  const authorization = providerAuthorization()
  let calls = 0
  const f = fixture({
    providerAuthorization: authorization,
    providerComplete: async () => {
      calls++
      const retained = JSON.parse(
        fs.readFileSync(
          path.join(f.directory, f.request.requestId, 'task.json')
        )
      )
      assert.equal(retained.providerRequests.length, calls)
      assert.equal(retained.providerRequests.at(-1).state, 'reserved')
      return {
        text: '{"tool":"shell"}',
        terminal: true,
        usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 }
      }
    }
  })
  Object.assign(f.request, {
    adapter: 'provider',
    scenario: 'task',
    providerAuthorizationId: authorization.id
  })
  const id = f.owner.start(f.request, 'human')
  const result = await f.owner.wait(id)
  assert.equal(result.phase, 'denied')
  assert.equal(result.providerRequests.length, 1)
  assert.equal(result.providerRequests[0].usage.totalTokens, 5)
  assert.equal(result.usage.tokens, null)
  assert.equal(result.changes.length, 0)
  await f.owner.stop(id, 'handoff', 'human')
  await f.owner.close()
  const next = createTaskOwner(root, {
    directory: f.directory,
    getBaseline: () => ({ contract: f.contract, revision: 1 }),
    available: () => true,
    providerAuthorization: authorization,
    providerComplete: async () => {
      throw new Error('provider-secret-marker')
    }
  })
  await next.wait(next.resume(id, 'task', 'human'))
  assert.equal(next.get(id).providerRequests.length, 2)
  assert.equal(next.get(id).providerRequests[1].state, 'unresolved')
  assert.throws(() => next.resume(id, 'task', 'human'), /unresolved/)
  assert.equal(
    JSON.stringify(next.get(id)).includes('provider-secret-marker'),
    false
  )
  await next.close()
})

test('provider cancellation records uncertainty and denies successor dispatch even for another task', async () => {
  const authorization = providerAuthorization()
  let dispatched
  const ready = new Promise((resolve) => {
    dispatched = resolve
  })
  const f = fixture({
    providerAuthorization: authorization,
    providerComplete: async () => {
      dispatched()
      return new Promise(() => undefined)
    }
  })
  Object.assign(f.request, {
    adapter: 'provider',
    scenario: 'task',
    providerAuthorizationId: authorization.id
  })
  const id = f.owner.start(f.request, 'human')
  await ready
  await f.owner.stop(id, 'cancel', 'human')
  assert.equal(f.owner.get(id).providerRequests[0].state, 'unresolved')
  assert.throws(
    () => f.owner.start({ ...f.request, requestId: randomUUID() }, 'human'),
    /unresolved/
  )
  await f.owner.close()
})

test('provider cancellation awaits owned transport settlement before returning', async () => {
  const authorization = providerAuthorization()
  let dispatched,
    settled = false
  const ready = new Promise((resolve) => {
    dispatched = resolve
  })
  const complete = async () => {
    dispatched()
    return new Promise(() => undefined)
  }
  complete.cancel = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10))
    settled = true
  }
  const f = fixture({
    providerAuthorization: authorization,
    providerComplete: complete
  })
  Object.assign(f.request, {
    adapter: 'provider',
    scenario: 'task',
    providerAuthorizationId: authorization.id
  })
  const id = f.owner.start(f.request, 'human')
  await ready
  await f.owner.stop(id, 'cancel', 'human')
  assert.equal(settled, true)
  assert.equal(f.owner.activeId(), null)
  await f.owner.close()
})

test(
  'offline provider operations fail real retained behavior then correct the same candidate without accepting baseline',
  {
    skip: process.platform !== 'darwin',
    timeout: 15000
  },
  async () => {
    const authorization = { ...providerAuthorization(), maxRequests: 6 }
    let correction = false
    const f = fixture({
      providerAuthorization: authorization,
      providerComplete: async ({
        observation,
        history,
        previousVerification
      }) => {
        let operation = { tool: 'finish' }
        if (history.length === 0) operation = { tool: 'read', path: sourceFile }
        if (history.length === 1) {
          const mutation = f.contract.definition.scenarios.find(
            (item) => item.id === 'inverse-regression'
          ).mutation
          if (correction) assert.equal(previousVerification.status, 'failed')
          operation = {
            tool: 'replace',
            path: sourceFile,
            digest: observation.digest,
            before: correction ? mutation.to : mutation.from,
            after: correction ? mutation.from : mutation.to
          }
        }
        return {
          text: JSON.stringify(operation),
          terminal: true,
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }
        }
      }
    })
    Object.assign(f.request, {
      adapter: 'provider',
      scenario: 'task',
      providerAuthorizationId: authorization.id
    })
    const original = fs.readFileSync(path.join(root, sourceFile))
    const id = f.owner.start(f.request, 'human')
    const failed = await f.owner.wait(id)
    assert.equal(failed.verificationStatus, 'failed')
    assert.deepEqual(
      failed.attempts[0].verdict.evidence.cases
        .filter((item) => item.status === 'failed')
        .map((item) => item.id)
        .sort(),
      ['cancel.delivery', 'cancel.outcome']
    )
    correction = true
    const passed = await f.owner.wait(f.owner.resume(id, 'task', 'human'))
    assert.equal(passed.verificationStatus, 'passed')
    assert.equal(passed.attempts[1].verdict.evidence.passedCount, 6)
    assert.equal(passed.providerRequests.length, 6)
    assert.equal(passed.deliveryStatus, 'not-delivered')
    assert.deepEqual(fs.readFileSync(path.join(root, sourceFile)), original)
    assert.throws(() => f.owner.resume(id, 'task', 'human'), /budget/)
    await f.owner.close()
  }
)
test('task source edits are isolated, attributed and read projections do no repeated capture', async () => {
  let captures = 0
  const { owner, request } = fixture({
    capture: (...args) => {
      captures++
      return captureSource(...args)
    },
    verify: async () => ({ evidence: { status: 'unknown' } })
  })
  const original = fs.readFileSync(path.join(root, sourceFile))
  const id = owner.start(request, 'human')
  assert.equal(owner.start(request, 'human'), id)
  const result = await owner.wait(id)
  assert.equal(result.phase, 'completed')
  assert.equal(result.verificationStatus, 'unknown')
  assert.equal(result.workStatus, 'incomplete')
  assert.equal(result.deliveryStatus, 'not-delivered')
  assert.equal(result.changes.length, 1)
  assert.equal(result.usage.attempts, 1)
  assert.equal(result.usage.toolCalls, 3)
  const read = fs.readFileSync
  let reads = 0
  fs.readFileSync = (...args) => {
    reads++
    return read(...args)
  }
  try {
    for (let i = 0; i < 10; i++) {
      owner.list()
      owner.get(id)
    }
  } finally {
    fs.readFileSync = read
  }
  assert.equal(reads, 0)
  assert.equal(captures, 1)
  assert.deepEqual(fs.readFileSync(path.join(root, sourceFile)), original)
  assert.throws(
    () => owner.start({ ...request, objective: 'different' }, 'human'),
    /conflict/
  )
  await owner.close()
})
test('unsupported tools and filesystem escapes are denied before effects', async () => {
  for (const operation of [
    { tool: 'shell', command: 'touch outside' },
    { tool: 'network', url: 'https://example.com' },
    { tool: 'secrets' },
    { tool: 'accept-baseline' },
    { tool: 'read', path: '../outside' },
    {
      tool: 'replace',
      path: 'packages/factory/src/__tests__/flow-proof.test.ts',
      before: 'x',
      after: 'y'
    }
  ]) {
    const { owner, request } = fixture({
      adapterFactory: () => ({ next: async () => operation })
    })
    const result = await owner.wait(owner.start(request, 'human'))
    assert.equal(result.phase, 'denied')
    assert.equal(result.changes.length, 0)
    assert.equal(result.usage.toolCalls, 1)
    assert.ok(result.audit.some((event) => event.event === 'denied'))
    await owner.close()
  }
})
test('tool limits, cancellation, restart and handoff preserve budgets and source', async () => {
  const { owner, request, directory, contract } = fixture({
    verify: async () => ({ evidence: { status: 'unknown' } })
  })
  request.scenario = 'tool-limit'
  request.budgets.toolCalls = 2
  const result = await owner.wait(owner.start(request, 'human'))
  assert.equal(result.phase, 'limited')
  assert.equal(result.usage.toolCalls, 2)
  assert.throws(() => owner.resume(result.id, 'repair', 'human'), /budget/)
  const handoff = await owner.stop(result.id, 'handoff', 'human')
  assert.equal(handoff.phase, 'handed-off')
  assert.equal(handoff.usage.toolCalls, 2)
  await owner.close()
  const reopened = createTaskOwner(root, {
    directory,
    getBaseline: () => ({ contract, revision: 1 }),
    available: () => true
  })
  assert.equal(reopened.get(result.id).usage.toolCalls, 2)
  await reopened.close()
})
test('cancel settles a stalled adapter and restart never turns it green', async () => {
  const { owner, request, directory, contract } = fixture()
  request.scenario = 'stall'
  const id = owner.start(request, 'human')
  const stopped = await owner.stop(id, 'cancel', 'human')
  assert.equal(stopped.phase, 'cancelled')
  assert.equal(stopped.verificationStatus, 'unknown')
  assert.equal(owner.activeId(), null)
  await owner.close()
  const recordPath = path.join(directory, id, 'task.json')
  const record = JSON.parse(fs.readFileSync(recordPath))
  record.phase = 'running'
  record.reservedMs = 100
  fs.writeFileSync(recordPath, JSON.stringify(record))
  const reopened = createTaskOwner(root, {
    directory,
    getBaseline: () => ({ contract, revision: 1 }),
    available: () => true
  })
  assert.equal(reopened.get(id).phase, 'interrupted')
  assert.equal(reopened.get(id).usage.elapsedMs, record.usage.elapsedMs + 100)
  assert.equal(reopened.get(id).verificationStatus, 'unknown')
  await reopened.close()
})
test('deadline, revocation and stale baseline block further admission', async () => {
  const { owner, request } = fixture()
  request.scenario = 'stall'
  request.budgets.elapsedMs = 30
  const result = await owner.wait(owner.start(request, 'human'))
  assert.equal(result.phase, 'timed-out')
  assert.equal(result.usage.elapsedMs, 30)
  await owner.stop(result.id, 'revoke', 'human')
  assert.throws(() => owner.resume(result.id, 'repair', 'human'), /revoked/)
  await owner.close()
  let revision = 1
  const contract = loadContract(root)
  const stale = fixture({ getBaseline: () => ({ contract, revision }) })
  stale.request.scenario = 'scope-violation'
  const old = await stale.owner.wait(stale.owner.start(stale.request, 'human'))
  revision++
  assert.throws(() => stale.owner.resume(old.id, 'repair', 'human'), /baseline/)
  await stale.owner.close()
})
test('symlink candidate access and stale digests refuse mutation', async () => {
  for (const symlink of [false, true]) {
    let target
    const { owner, request, directory } = fixture({
      adapterFactory: () => ({
        next: async () => {
          if (symlink) {
            fs.unlinkSync(target)
            fs.symlinkSync(path.join(root, sourceFile), target)
          }
          return {
            tool: 'replace',
            path: sourceFile,
            digest: sha256('stale'),
            before: 'x',
            after: 'y'
          }
        }
      })
    })
    target = path.join(directory, request.requestId, 'candidate', sourceFile)
    const result = await owner.wait(owner.start(request, 'human'))
    assert.equal(result.phase, 'denied')
    await owner.close()
  }
})

test('restart rejects fabricated task success and invalid cumulative evidence', async () => {
  for (const mutate of [
    (record) => {
      record.verificationStatus = 'passed'
      record.workStatus = 'needs-review'
    },
    (record) => {
      record.task.allowedFiles.push('packages/factory/src/index.ts')
    },
    (record) => {
      record.usage.attempts = 0
    }
  ]) {
    const { owner, request, directory, contract } = fixture()
    request.scenario = 'scope-violation'
    const result = await owner.wait(owner.start(request, 'human'))
    await owner.close()
    const file = path.join(directory, result.id, 'task.json')
    const record = JSON.parse(fs.readFileSync(file))
    mutate(record)
    fs.writeFileSync(file, JSON.stringify(record))
    assert.throws(
      () =>
        createTaskOwner(root, {
          directory,
          getBaseline: () => ({ contract, revision: 1 }),
          available: () => true
        }),
      /Invalid|evidence|fingerprint/
    )
  }
})
test('verifier infrastructure failure is distinct from a rejected agent operation', async () => {
  const { owner, request } = fixture({
    verify: async () => {
      throw new Error('Verifier unavailable')
    }
  })
  const result = await owner.wait(owner.start(request, 'human'))
  assert.equal(result.phase, 'failed')
  assert.equal(result.verificationStatus, 'unknown')
  await owner.close()
})

test(
  'real passing task evidence survives restart and report tampering is rejected',
  { skip: process.platform !== 'darwin', timeout: 20000 },
  async () => {
    const { owner, request, directory, contract } = fixture()
    const result = await owner.wait(owner.start(request, 'human'))
    assert.equal(result.verificationStatus, 'passed', result.error)
    await owner.close()
    const open = () =>
      createTaskOwner(root, {
        directory,
        getBaseline: () => ({ contract, revision: 1 }),
        available: () => true
      })
    const reopened = open()
    assert.equal(reopened.get(result.id).workStatus, 'needs-review')
    assert.equal(reopened.get(result.id).usage.attempts, 1)
    await reopened.close()
    fs.writeFileSync(result.attempts.at(-1).verdict.runner.reportPath, '{}')
    assert.throws(open, /fingerprint/)
  }
)

test(
  'cancelling a real verification settles the owned process and preserves partial changes',
  { skip: process.platform !== 'darwin', timeout: 15000 },
  async () => {
    const { verifyCandidate } = require('../agent-verifier.cjs')
    let cancellation
    let pid
    const { owner, request } = fixture({
      verify: (options) =>
        verifyCandidate({
          ...options,
          onSpawn: (value) => {
            pid = value
            options.onSpawn(value)
            cancellation = owner.stop(owner.activeId(), 'cancel', 'human')
          }
        })
    })
    const result = await owner.wait(owner.start(request, 'human'))
    await cancellation
    assert.equal(result.phase, 'cancelled')
    assert.equal(result.verificationStatus, 'unknown')
    assert.equal(result.changes.length, 1)
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
    await owner.close()
  }
)

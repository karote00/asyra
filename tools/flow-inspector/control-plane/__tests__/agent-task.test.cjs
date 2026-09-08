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

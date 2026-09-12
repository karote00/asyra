/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const test = require('node:test')
const { spawn } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')
const { loadContract } = require('../contracts.cjs')
const { captureSource } = require('../snapshot.cjs')
const { assessEvidence } = require('../evidence.cjs')
const { runVerification } = require('../runner.cjs')
const { runProcess, runnerEnvironment } = require('../runner.cjs')
const execute = (code, options = {}) =>
  runProcess({
    executable: process.execPath,
    args: ['-e', code],
    cwd: process.cwd(),
    env: {},
    ...options
  })

test('preserves a failing process exit instead of accepting its wrapper', async () => {
  const result = await execute('process.exit(7)')
  assert.equal(result.code, 7)
  assert.equal(result.reason, null)
})
test('a deadline settles an uncooperative process', async () => {
  const result = await execute(
    "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)",
    { timeoutMs: 150 }
  )
  assert.equal(result.reason, 'timeout')
  assert.throws(() => process.kill(result.pid, 0), { code: 'ESRCH' })
})
test('cancellation prevents pre-aborted admission and settles active execution', async () => {
  const controller = new AbortController()
  let spawns = 0
  controller.abort()
  const result = await execute('process.exit(0)', {
    signal: controller.signal,
    onSpawn: () => spawns++
  })
  assert.equal(result.reason, 'cancelled')
  assert.equal(spawns, 0)
  const running = new AbortController()
  const active = await execute('setInterval(() => {}, 1000)', {
    signal: running.signal,
    onSpawn: () => running.abort()
  })
  assert.equal(active.reason, 'cancelled')
  assert.throws(() => process.kill(active.pid, 0), { code: 'ESRCH' })
})
test('output is bounded and overflow cannot pass', async () => {
  const result = await execute(
    "setInterval(() => process.stdout.write('x'.repeat(4096)), 1)",
    { maxOutputBytes: 1024 }
  )
  assert.equal(result.reason, 'output-limit')
  assert.ok(Buffer.byteLength(result.output) <= 1024)
})
test('runner environment does not inherit credentials or Node injection', () => {
  assert.deepEqual(
    Object.keys(runnerEnvironment('/source', 'baseline', '/tmp')).sort(),
    ['CI', 'FLOW_PROOF_SCENARIO', 'FLOW_PROOF_SOURCE', 'LANG', 'PATH', 'TMPDIR']
  )
})
test('spawn failure is explicitly non-passing', async () => {
  const result = await runProcess({
    executable: '/does-not-exist',
    args: [],
    env: {}
  })
  assert.equal(result.reason, 'spawn-error')
})
test('an unexpected signal is an infrastructure failure', async () => {
  const result = await execute("process.kill(process.pid, 'SIGTERM')")
  assert.equal(result.reason, 'signal')
})
test('the owned runner group settles when its service abruptly dies', async () => {
  const runner = path.resolve(__dirname, '../runner.cjs')
  const payload = 'console.log(process.ppid); setInterval(() => {}, 1000)'
  const owner = spawn(
    process.execPath,
    [
      '-e',
      `require('node:child_process').spawn(process.execPath, [${JSON.stringify(runner)}, 'child', String(process.pid), '-e', ${JSON.stringify(payload)}], { detached: true, stdio: ['ignore', 'inherit', 'inherit'] }); setInterval(() => {}, 1000)`
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  let group
  try {
    await new Promise((resolve, reject) => {
      const deadline = setTimeout(
        () => reject(new Error('Orphan runner did not settle')),
        5000
      )
      owner.stdout.once('data', (data) => {
        group = Number(data.toString().trim())
        owner.kill('SIGKILL')
      })
      owner.once('error', reject)
      // close waits for the inherited pipes held by both descendants.
      owner.once('close', () => {
        clearTimeout(deadline)
        resolve()
      })
    })
    assert.ok(Number.isInteger(group) && group > 0)
  } finally {
    owner.kill('SIGKILL')
    if (group) {
      try {
        process.kill(-group, 'SIGKILL')
      } catch (error) {
        assert.equal(error.code, 'ESRCH')
      }
    }
  }
})

test(
  'every registered negative scenario fails its exact real obligations and preserves unaffected cases',
  { timeout: 30000 },
  async (t) => {
    const root = path.resolve(__dirname, '../../../..')
    const parent = path.join(root, 'tmp/flow-inspector/runner-proofs')
    fs.mkdirSync(parent, { recursive: true })
    const dir = fs.mkdtempSync(path.join(parent, 'proof-'))
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
    const contract = loadContract(root)
    const flowIds = contract.flows.map((flow) => flow.id)
    let baselineDigest
    for (const scenario of [...contract.scenarios, contract.scenarios[0]]) {
      const runDirectory = fs.mkdtempSync(path.join(dir, 'run-'))
      const snapshot = captureSource(root, runDirectory, contract)
      baselineDigest ??= snapshot.digest
      assert.equal(snapshot.digest, baselineDigest)
      const result = await runVerification({
        repositoryRoot: root,
        runDirectory,
        snapshot,
        contract,
        scenario: scenario.id,
        flowIds
      })
      assert.equal(
        result.identity.runtimeSourceDigest,
        snapshot.runtimeSource.digest
      )
      assert.equal(result.identity.lockfileDigest, snapshot.lockfileDigest)
      assert.equal(result.identity.sourceDigest, snapshot.digest)
      assert.equal(result.identity.mappingVersion, contract.mappingVersion)
      assert.equal(result.environment.node, process.version)
      assert.equal(result.environment.vitest, result.version)
      assert.match(result.reportDigest, /^[a-f0-9]{64}$/)
      const evidence = assessEvidence(
        contract,
        snapshot,
        result,
        flowIds,
        scenario.id
      )
      assert.deepEqual(
        evidence.issues,
        [],
        scenario.id + ': ' + JSON.stringify(result)
      )
      assert.deepEqual(
        evidence.cases
          .filter((item) => item.status === 'failed')
          .map((item) => item.id)
          .sort(),
        scenario.expectedFailedCaseIds.slice().sort(),
        scenario.id
      )
      assert.equal(
        evidence.passedCount,
        contract.cases.length - scenario.expectedFailedCaseIds.length,
        scenario.id
      )
      assert.equal(result.code === 0, scenario.id === 'baseline', scenario.id)
    }
  }
)

test('verification consumes the trusted execution boundary once without bypassing it', async (t) => {
  const root = path.resolve(__dirname, '../../../..')
  const parent = path.join(root, 'tmp/flow-inspector/runner-boundary')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'run-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  let calls = 0
  const contract = loadContract(root)
  const snapshot = captureSource(root, directory, contract)
  const result = await runVerification({
    repositoryRoot: root,
    runDirectory: directory,
    snapshot,
    contract,
    scenario: 'baseline',
    flowIds: contract.flows.map((flow) => flow.id),
    processRunner: async (options) => {
      calls++
      assert.equal(options.executable, process.execPath)
      return { code: null, reason: 'containment-unavailable', output: '' }
    }
  })
  assert.equal(calls, 1)
  assert.equal(result.reason, 'containment-unavailable')
  assert.equal(
    result.identity.runtimeSourceDigest,
    snapshot.runtimeSource.digest
  )
  assert.equal(result.identity.lockfileDigest, snapshot.lockfileDigest)
  assert.equal(result.identity.sourceDigest, snapshot.digest)
  assert.equal(
    result.identity.configurationDigest,
    snapshot.configurationDigest
  )
})

test('runner carries producer runtime identity without traversing its manifest and never invents one for historical snapshots', async (t) => {
  const root = path.resolve(__dirname, '../../../..')
  const parent = path.join(root, 'tmp/flow-inspector/runner-identity')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'run-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const contract = loadContract(root)
  const snapshot = captureSource(root, directory, contract)
  const sourceIdentity = {
    format: 1,
    digest: snapshot.runtimeSource.digest,
    get files() {
      throw new Error('Runner must not rebuild runtime inventory')
    }
  }
  let executions = 0
  const invoke = (input, name) =>
    runVerification({
      repositoryRoot: root,
      runDirectory: path.join(directory, name),
      snapshot: input,
      contract,
      scenario: 'baseline',
      flowIds: contract.flows.map((flow) => flow.id),
      processRunner: async () => {
        executions++
        return { code: null, reason: 'containment-unavailable', output: '' }
      }
    })
  const current = await invoke(
    { ...snapshot, runtimeSource: sourceIdentity },
    'current'
  )
  assert.equal(
    current.identity.runtimeSourceDigest,
    snapshot.runtimeSource.digest
  )
  const historical = { ...snapshot }
  delete historical.runtimeSource
  const old = await invoke(historical, 'historical')
  assert.equal(Object.hasOwn(old.identity, 'runtimeSourceDigest'), false)
  assert.equal(old.identity.sourceDigest, snapshot.digest)
  assert.equal(executions, 2)
})

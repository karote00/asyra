/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const {
  containedProcess,
  containmentAvailable,
  verifyCandidate
} = require('../agent-verifier.cjs')
const { loadContract } = require('../contracts.cjs')
const { captureSource } = require('../snapshot.cjs')
const root = path.resolve(__dirname, '../../../..')
const parent = path.join(root, 'tmp/flow-inspector/agent-verifier-tests')
fs.mkdirSync(parent, { recursive: true })
const make = () => fs.mkdtempSync(path.join(parent, 'run-'))
test('unsupported containment is explicitly unavailable', () => {
  assert.equal(containmentAvailable('linux'), false)
  assert.equal(containmentAvailable('win32'), false)
})
test(
  'OS boundary denies external filesystem, network, commands and indirect children',
  { skip: process.platform !== 'darwin', timeout: 20000 },
  async () => {
    const directory = make()
    const forbidden = path.join(parent, 'forbidden-' + path.basename(directory))
    fs.writeFileSync(forbidden, 'test-only secret')
    const payload = `
    const fs = require('node:fs'), cp = require('node:child_process');
    let denied = 0;
    for (const operation of [() => fs.readFileSync(${JSON.stringify(forbidden)}),
      () => fs.writeFileSync(${JSON.stringify(forbidden)}, 'bad'),
      () => cp.execFileSync('/bin/sh', ['-c', 'true'])]) {
      try { operation() } catch { denied++ }
    }
    const indirect = cp.spawnSync(process.execPath, ['-e', 'try { require("node:fs").readFileSync(' + JSON.stringify(${JSON.stringify(forbidden)}) + '); process.exit(1) } catch { process.exit(0) }']);
    if (indirect.error?.code === 'EPERM' || indirect.error?.code === 'EACCES') denied++;
    const socket = require('node:net').connect(9, '127.0.0.1');
    socket.on('error', (error) => { if (error.code === 'EPERM' || error.code === 'EACCES') denied++; console.log(denied); });
  `
    const result = await containedProcess(
      {
        executable: process.execPath,
        args: ['-e', payload],
        cwd: directory,
        env: {},
        timeoutMs: 5000
      },
      { repositoryRoot: root, readRoots: [], writeRoot: directory }
    )
    assert.equal(result.code, 0, result.output)
    assert.equal(result.output.trim(), '5')
    assert.equal(fs.readFileSync(forbidden, 'utf8'), 'test-only secret')
  }
)
test(
  'real candidate verification retains all six obligations and detects inverse corruption',
  { skip: process.platform !== 'darwin', timeout: 60000 },
  async () => {
    const directory = make()
    const contract = loadContract(root)
    const snapshot = captureSource(root, directory, contract)
    const candidateRoot = path.join(directory, 'candidate')
    fs.cpSync(snapshot.sourceRoot, candidateRoot, { recursive: true })
    const sourceFile = 'packages/factory/src/data-transact.ts'
    const input = {
      repositoryRoot: root,
      directory,
      contract,
      snapshot,
      candidateRoot,
      allowedFiles: [sourceFile],
      timeoutMs: 15000
    }
    const baseline = await verifyCandidate({ ...input, attemptId: 'baseline' })
    assert.equal(
      baseline.evidence.status,
      'passed',
      JSON.stringify({
        runner: baseline.runner,
        issues: baseline.evidence.issues
      })
    )
    assert.equal(baseline.evidence.cases.length, 6)
    assert.equal(
      baseline.evidence.runtimeSourceDigest,
      snapshot.runtimeSource.digest
    )
    const file = path.join(candidateRoot, sourceFile)
    const original = fs.readFileSync(file, 'utf8')
    fs.chmodSync(file, 0o600)
    fs.writeFileSync(file, original + '\n')
    const changed = await verifyCandidate({
      ...input,
      attemptId: 'changed-runtime'
    })
    assert.equal(
      changed.evidence.status,
      'passed',
      JSON.stringify(changed.evidence.issues)
    )
    assert.notEqual(
      changed.evidence.runtimeSourceDigest,
      snapshot.runtimeSource.digest
    )
    assert.equal(
      changed.runner.identity.runtimeSourceDigest,
      changed.evidence.runtimeSourceDigest
    )
    assert.equal(changed.evidence.cases.length, 6)
    fs.writeFileSync(file, original)
    const mutation = contract.definition.scenarios.find(
      (value) => value.id === 'inverse-regression'
    ).mutation
    fs.writeFileSync(
      file,
      fs.readFileSync(file, 'utf8').replace(mutation.from, mutation.to)
    )
    const negative = await verifyCandidate({ ...input, attemptId: 'negative' })
    assert.equal(
      negative.evidence.status,
      'failed',
      JSON.stringify({
        runner: negative.runner,
        issues: negative.evidence.issues
      })
    )
    assert.deepEqual(negative.evidence.issues, [])
    assert.notEqual(
      negative.evidence.runtimeSourceDigest,
      snapshot.runtimeSource.digest
    )
    assert.equal(
      negative.runner.identity.runtimeSourceDigest,
      negative.evidence.runtimeSourceDigest
    )
    assert.deepEqual(
      negative.evidence.cases
        .filter((value) => value.status === 'failed')
        .map((value) => value.id)
        .sort(),
      ['cancel.delivery', 'cancel.outcome']
    )
    fs.writeFileSync(
      file,
      fs.readFileSync(file, 'utf8').replace(mutation.to, mutation.from)
    )
    const recovery = await verifyCandidate({ ...input, attemptId: 'recovery' })
    assert.equal(recovery.evidence.status, 'passed')
    assert.equal(
      recovery.evidence.runtimeSourceDigest,
      snapshot.runtimeSource.digest
    )
  }
)

test(
  'contained Node runtime starts before any candidate is admitted',
  { skip: process.platform !== 'darwin' },
  async () => {
    const directory = make()
    const result = await containedProcess(
      {
        executable: process.execPath,
        args: ['-e', 'console.log("runtime-started")'],
        cwd: directory,
        env: {},
        timeoutMs: 3000
      },
      { repositoryRoot: root, readRoots: [], writeRoot: directory }
    )
    assert.equal(result.code, 0, JSON.stringify(result))
    assert.equal(result.output.trim(), 'runtime-started')
  }
)

test(
  'verification source remains OS read-only even inside the writable attempt',
  { skip: process.platform !== 'darwin', timeout: 10000 },
  async () => {
    const directory = make()
    const source = path.join(directory, 'source')
    fs.mkdirSync(source)
    const assertion = path.join(source, 'assertion.txt')
    fs.writeFileSync(assertion, 'required assertion')
    const result = await containedProcess(
      {
        executable: process.execPath,
        args: [
          '-e',
          `try { require('node:fs').writeFileSync(${JSON.stringify(assertion)}, 'weakened'); process.exit(1) } catch { console.log('denied') }`
        ],
        cwd: directory,
        env: {},
        timeoutMs: 3000
      },
      { repositoryRoot: root, readRoots: [source], writeRoot: directory }
    )
    assert.equal(result.code, 0)
    assert.equal(fs.readFileSync(assertion, 'utf8'), 'required assertion')
  }
)

test(
  'candidate cannot detach a successor process from the owned group',
  { skip: process.platform !== 'darwin', timeout: 10000 },
  async () => {
    const directory = make()
    const result = await containedProcess(
      {
        executable: process.execPath,
        args: [
          '-e',
          `const result = require('node:child_process').spawnSync(process.execPath, ['-e', 'process.exit(0)'], { detached: true }); console.log(result.error ? result.error.code : result.status)`
        ],
        cwd: directory,
        env: {},
        timeoutMs: 3000
      },
      { repositoryRoot: root, readRoots: [], writeRoot: directory }
    )
    assert.equal(result.code, 0)
    assert.match(result.output, /EPERM|EACCES/)
  }
)

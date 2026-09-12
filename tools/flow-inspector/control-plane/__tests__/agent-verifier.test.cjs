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
  async (t) => {
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
    const admission = t.mock.method(
      require('../snapshot.cjs'),
      'validateSourceSnapshot'
    )
    const baseline = await verifyCandidate({ ...input, attemptId: 'baseline' })
    assert.equal(
      admission.mock.callCount(),
      1,
      'one source admission for this explicit candidate proof'
    )
    assert.equal(
      baseline.evidence.status,
      'passed',
      JSON.stringify({
        runner: baseline.runner,
        issues: baseline.evidence.issues
      })
    )
    assert.equal(
      baseline.executionSource.policy,
      'contained-native-typescript-v1'
    )
    assert.equal(baseline.configurationDigest, baseline.executionSource.digest)
    assert.equal(
      baseline.runner.identity.configurationDigest,
      baseline.executionSource.digest
    )
    assert.deepEqual(baseline.verificationSource, snapshot.verificationSource)
    assert.equal(baseline.runtimeSource.digest, snapshot.runtimeSource.digest)
    const source = require('../snapshot.cjs')
    const frozenRoot = path.join(root, baseline.artifactDirectory, 'source')
    const generated = source.createDerivedExecution({
      sourceRoot: frozenRoot,
      verificationSource: baseline.verificationSource
    })
    assert.deepEqual(baseline.executionSource, generated.executionSource)
    for (const file of generated.files)
      assert.equal(
        fs.readFileSync(path.join(frozenRoot, file.path), 'utf8'),
        file.content
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

test(
  'candidate rejects mismatched captured baseline identities before producer dispatch',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const directory = make()
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const contract = loadContract(root)
    const snapshot = captureSource(root, directory, contract)
    let spawned = 0
    for (const key of [
      'digest',
      'contractDigest',
      'mappingVersion',
      'architectureVersion'
    ]) {
      await assert.rejects(
        () =>
          verifyCandidate({
            repositoryRoot: root,
            directory,
            contract,
            snapshot: { ...snapshot, [key]: 'invalid' },
            candidateRoot: snapshot.sourceRoot,
            allowedFiles: [],
            attemptId: 'bad-' + key,
            timeoutMs: 15000,
            onSpawn: () => spawned++
          }),
        /Baseline.*identity/
      )
    }
    assert.equal(spawned, 0)
  }
)

test(
  'new candidate proofs recover only absent captured verification identity and preserve historical bytes',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const directory = make()
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const contract = loadContract(root)
    const snapshot = captureSource(root, directory, contract)
    const legacy = structuredClone(snapshot)
    delete legacy.verificationSource
    const original = structuredClone(legacy)
    const input = {
      repositoryRoot: root,
      directory,
      contract,
      candidateRoot: snapshot.sourceRoot,
      allowedFiles: [],
      timeoutMs: 15000
    }
    let spawned = 0
    const proof = await verifyCandidate({
      ...input,
      snapshot: legacy,
      attemptId: 'legacy-new-proof',
      onSpawn: (pid) => {
        assert.ok(pid > 0)
        spawned++
      }
    })
    assert.equal(
      proof.evidence.status,
      'passed',
      JSON.stringify(proof.evidence.issues)
    )
    assert.equal(spawned, 1)
    assert.deepEqual(proof.verificationSource, snapshot.verificationSource)
    assert.deepEqual(legacy, original)
    assert.notEqual(proof.configurationDigest, legacy.configurationDigest)
    await assert.rejects(
      () =>
        verifyCandidate({
          ...input,
          snapshot: { ...legacy, verificationSource: null },
          attemptId: 'present-null'
        }),
      /verification|derived/i
    )
    const stale = structuredClone(snapshot)
    stale.verificationSource.digest = '0'.repeat(64)
    const invalid = await verifyCandidate({
      ...input,
      snapshot: stale,
      attemptId: 'stale-bundle'
    })
    assert.notEqual(invalid.evidence.status, 'passed')
    assert.ok(
      invalid.evidence.issues.includes('Runtime source provenance mismatch')
    )
  }
)

test(
  'candidate post-run integrity rejects altered generated bootstrap bytes despite real passing assertions',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const directory = make()
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const contract = loadContract(root)
    const snapshot = captureSource(root, directory, contract)
    const write = fs.writeFileSync
    const injected = t.mock.method(
      fs,
      'writeFileSync',
      (file, bytes, options) =>
        write(
          file,
          String(file).endsWith('/candidate-bootstrap.cjs')
            ? bytes + '\n// formal altered retained bootstrap\n'
            : bytes,
          options
        )
    )
    const proof = await verifyCandidate({
      repositoryRoot: root,
      directory,
      contract,
      snapshot,
      candidateRoot: snapshot.sourceRoot,
      allowedFiles: [],
      attemptId: 'altered-bootstrap',
      timeoutMs: 15000
    })
    injected.mock.restore()
    assert.equal(proof.runner.code, 0)
    assert.equal(proof.evidence.passedCount, 6)
    assert.equal(proof.evidence.status, 'unknown')
    assert.ok(
      proof.evidence.issues.includes(
        'Frozen verification source was modified during execution'
      )
    )
  }
)

test(
  'candidate manifest reuses source-owned generated fingerprints while still checking actual settled bytes',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const directory = make()
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const contract = loadContract(root)
    const snapshot = captureSource(root, directory, contract)
    const source = require('../snapshot.cjs')
    const generated = source.createDerivedExecution({
      sourceRoot: path.join(directory, 'verification/count-generated/source'),
      verificationSource: snapshot.verificationSource
    })
    const hash = t.mock.method(source, 'sha256')
    const modulePath = require.resolve('../agent-verifier.cjs'),
      saved = require.cache[modulePath]
    Reflect.deleteProperty(require.cache, modulePath)
    const counted = require('../agent-verifier.cjs')
    require.cache[modulePath] = saved
    const proof = await counted.verifyCandidate({
      repositoryRoot: root,
      directory,
      contract,
      snapshot,
      candidateRoot: snapshot.sourceRoot,
      allowedFiles: [],
      attemptId: 'count-generated',
      timeoutMs: 15000
    })
    assert.equal(
      proof.evidence.status,
      'passed',
      JSON.stringify(proof.evidence.issues)
    )
    assert.equal(
      hash.mock.calls.filter((call) =>
        generated.files.some((file) => call.arguments[0] === file.content)
      ).length,
      0,
      'generation fingerprints are already source-owned'
    )
    for (const file of generated.files) {
      assert.equal(
        hash.mock.calls.filter(
          (call) =>
            Buffer.isBuffer(call.arguments[0]) &&
            call.arguments[0].toString() === file.content
        ).length,
        1,
        'post-run actual bytes remain checked'
      )
    }
  }
)

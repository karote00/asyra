/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { createHash } = require('node:crypto')
const path = require('node:path')
const test = require('node:test')
const {
  captureSource,
  validateRuntimeSource,
  createRuntimeSource
} = require('../snapshot.cjs')
const { loadContract } = require('../contracts.cjs')
const root = path.resolve(__dirname, '../../../..')
const parent = path.join(root, 'tmp/flow-inspector/snapshot-tests')
fs.mkdirSync(parent, { recursive: true })

test('captures exact source bytes once and preserves them independently of the checkout', (t) => {
  const output = fs.mkdtempSync(path.join(parent, 'run-'))
  t.after(() => fs.rmSync(output, { recursive: true, force: true }))
  const contract = loadContract(root)
  const originalRead = fs.readFileSync
  const read = t.mock.method(fs, 'readFileSync', (...args) =>
    originalRead(...args)
  )
  const snapshot = captureSource(root, output, contract)
  assert.equal(read.mock.callCount(), snapshot.fileCount)
  read.mock.restore()
  assert.ok(snapshot.fileCount > 10)
  assert.equal(snapshot.fileCount, snapshot.files.length)
  assert.equal(snapshot.fileCount, snapshot.readCount)
  assert.equal(snapshot.contractDigest, contract.digest)
  assert.equal(snapshot.mappingVersion, contract.mappingVersion)
  assert.equal(snapshot.architectureVersion, contract.architectureVersion)
  assert.equal(
    snapshot.configurationDigest,
    snapshot.files.find((item) => item.path === contract.configFile).digest
  )
  assert.equal(
    snapshot.lockfileDigest,
    snapshot.files.find((item) => item.path === 'yarn.lock').digest
  )
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(root, snapshot.manifestPath))),
    snapshot.files
  )
  const source = 'packages/factory/src/data-transact.ts'
  assert.equal(
    fs.readFileSync(path.join(snapshot.sourceRoot, source), 'utf8'),
    fs.readFileSync(path.join(root, source), 'utf8')
  )
  assert.ok(snapshot.files.find((item) => item.path === 'yarn.lock'))
  for (const packageFile of snapshot.files.filter((item) =>
    /^packages\/[^/]+\/package.json$/.test(item.path)
  )) {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(snapshot.sourceRoot, packageFile.path))
    )
    for (const dependency of Object.keys(manifest.dependencies ?? {}).filter(
      (name) => name.startsWith('@asyra/')
    )) {
      const entry =
        'packages/' + dependency.slice('@asyra/'.length) + '/src/index.ts'
      assert.ok(
        snapshot.files.some((item) => item.path === entry),
        'Missing source dependency: ' + dependency
      )
    }
  }
  assert.equal(snapshot.kind, 'worktree-snapshot')
  assert.match(snapshot.digest, /^[a-f0-9]{64}$/)
  assert.throws(() => captureSource(root, output, contract), /exists/)
})

test('rejects symlinked source files before executing code', (t) => {
  const fixture = fs.mkdtempSync(path.join(parent, 'fixture-'))
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }))
  fs.mkdirSync(path.join(fixture, 'packages/factory/src'), { recursive: true })
  fs.symlinkSync(
    path.join(root, 'packages/factory/src/index.ts'),
    path.join(fixture, 'packages/factory/src/index.ts')
  )
  assert.throws(
    () =>
      captureSource(fixture, path.join(fixture, 'attempt'), loadContract(root)),
    /symlink/i
  )
})

const fingerprint = (value) => createHash('sha256').update(value).digest('hex')
const runtimePath = (file) =>
  file === 'package.json' ||
  file === 'yarn.lock' ||
  /^packages\/(factory|reactive-events|utils|persistence)\/package\.json$/.test(
    file
  ) ||
  (/^packages\/(factory|reactive-events|utils|persistence)\/src\//.test(file) &&
    !file.split('/').includes('__tests__'))

function copiedSource(t) {
  const fixture = fs.mkdtempSync(path.join(parent, 'identity-'))
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }))
  const initial = captureSource(
    root,
    path.join(fixture, 'seed'),
    loadContract(root)
  )
  const repository = path.join(fixture, 'repository')
  fs.cpSync(initial.sourceRoot, repository, { recursive: true })
  for (const entry of initial.files)
    fs.chmodSync(path.join(repository, entry.path), 0o644)
  const capture = (name, contract = loadContract(repository)) =>
    captureSource(repository, path.join(repository, 'attempts', name), contract)
  return { repository, capture }
}

test('runtime identity covers the complete declared runtime inventory and preserves full snapshot identity with one read per file', (t) => {
  const output = fs.mkdtempSync(path.join(parent, 'runtime-'))
  t.after(() => fs.rmSync(output, { recursive: true, force: true }))
  const contract = loadContract(root)
  const originalRead = fs.readFileSync
  const reads = t.mock.method(fs, 'readFileSync', (...args) =>
    originalRead(...args)
  )
  const snapshot = captureSource(root, output, contract)
  assert.equal(reads.mock.callCount(), snapshot.fileCount)
  reads.mock.restore()
  assert.ok(
    snapshot.runtimeSource,
    'capture must issue runtime source identity'
  )
  assert.equal(snapshot.runtimeSource.format, 1)
  const expected = snapshot.files
    .filter((entry) => runtimePath(entry.path))
    .map(({ path, size, digest }) => ({ path, size, digest }))
  assert.deepEqual(snapshot.runtimeSource.files, expected)
  assert.deepEqual(
    expected.map((entry) => entry.path),
    expected.map((entry) => entry.path).sort()
  )
  assert.ok(expected.length > 10)
  assert.equal(
    new Set(expected.map((entry) => entry.path)).size,
    expected.length
  )
  for (const entry of snapshot.runtimeSource.files) {
    assert.deepEqual(Object.keys(entry), ['path', 'size', 'digest'])
    const bytes = fs.readFileSync(path.join(snapshot.sourceRoot, entry.path))
    assert.equal(entry.size, bytes.length)
    assert.equal(entry.digest, fingerprint(bytes))
    assert.ok(Object.isFrozen(entry))
  }
  assert.equal(
    snapshot.runtimeSource.digest,
    fingerprint(JSON.stringify(expected))
  )
  assert.equal(snapshot.digest, fingerprint(JSON.stringify(snapshot.files)))
  assert.ok(Object.isFrozen(snapshot.runtimeSource))
  assert.ok(Object.isFrozen(snapshot.runtimeSource.files))
  assert.equal(
    snapshot.runtimeSource.files.some(
      (entry) => entry.path === contract.configFile
    ),
    false
  )
})

test('runtime identity changes for runtime code, every package manifest, root metadata, lockfile and inventory changes', (t) => {
  const { repository, capture } = copiedSource(t)
  let previous = capture('baseline')
  assert.ok(
    previous.runtimeSource,
    'capture must issue runtime source identity'
  )
  const changedPaths = [
    'packages/factory/src/index.ts',
    'packages/reactive-events/src/index.ts',
    'packages/utils/src/index.ts',
    'packages/persistence/src/index.ts',
    ...['factory', 'reactive-events', 'utils', 'persistence'].map(
      (name) => 'packages/' + name + '/package.json'
    ),
    'package.json',
    'yarn.lock'
  ]
  for (const [index, file] of changedPaths.entries()) {
    fs.appendFileSync(path.join(repository, file), '\n')
    const next = capture('change-' + index)
    assert.notEqual(
      next.runtimeSource.digest,
      previous.runtimeSource.digest,
      file
    )
    assert.notEqual(next.digest, previous.digest, file)
    previous = next
  }
  const extra = path.join(repository, 'packages/factory/src/identity-proof.ts')
  fs.writeFileSync(extra, 'export const proof = true\n')
  const added = capture('added')
  assert.notEqual(added.runtimeSource.digest, previous.runtimeSource.digest)
  fs.unlinkSync(extra)
  const removed = capture('removed')
  assert.equal(removed.runtimeSource.digest, previous.runtimeSource.digest)
})

test('separately admitted verification bytes change full evidence identity without changing runtime identity', (t) => {
  const { repository, capture } = copiedSource(t)
  const contract = loadContract(repository)
  const before = capture('before')
  assert.ok(before.runtimeSource, 'capture must issue runtime source identity')
  let previousDigest = before.digest
  for (const [index, file] of [
    contract.manifestPath,
    contract.architecturePath,
    contract.specPath,
    contract.testFile,
    contract.configFile
  ].entries()) {
    fs.appendFileSync(path.join(repository, file), '\n')
    const after = capture('verification-' + index)
    assert.equal(after.runtimeSource.digest, before.runtimeSource.digest, file)
    assert.notEqual(after.digest, previousDigest, file)
    previousDigest = after.digest
  }
})

test('verification paths cannot disguise runtime code or dependency metadata as excluded proof inputs', (t) => {
  const { capture } = copiedSource(t)
  const contract = loadContract(root)
  for (const [index, configFile] of [
    'packages/factory/src/index.ts',
    'packages/factory/package.json',
    'package.json',
    'yarn.lock'
  ].entries()) {
    assert.throws(
      () => capture('overlap-' + index, { ...contract, configFile }),
      /verification.*runtime|runtime.*verification/i
    )
  }
})

test('runtime source admission requires its exact full snapshot manifest without source IO or legacy promotion', (t) => {
  const directory = fs.mkdtempSync(path.join(parent, 'admission-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const snapshot = captureSource(root, directory, loadContract(root))
  assert.equal(typeof validateRuntimeSource, 'function')
  const originalRead = fs.readFileSync
  const reads = t.mock.method(fs, 'readFileSync', (...args) =>
    originalRead(...args)
  )
  assert.equal(
    validateRuntimeSource(snapshot).digest,
    snapshot.runtimeSource.digest
  )
  const retained = { ...snapshot }
  delete retained.files
  assert.throws(() => validateRuntimeSource(retained), /full.*manifest/i)
  assert.equal(
    validateRuntimeSource(retained, snapshot.files).digest,
    snapshot.runtimeSource.digest
  )
  const historical = { ...retained }
  delete historical.runtimeSource
  assert.equal(validateRuntimeSource(historical), undefined)
  assert.equal(Object.hasOwn(historical, 'runtimeSource'), false)
  assert.equal(reads.mock.callCount(), 0)
})

test('runtime admission rejects malformed or self-consistent but unbound inventories', (t) => {
  const directory = fs.mkdtempSync(path.join(parent, 'invalid-admission-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const snapshot = captureSource(root, directory, loadContract(root))
  assert.equal(typeof validateRuntimeSource, 'function')
  const rehashRuntime = (input) => {
    input.runtimeSource.digest = fingerprint(
      JSON.stringify(input.runtimeSource.files)
    )
  }
  const cases = [
    [
      'present null',
      (input) => {
        input.runtimeSource = null
      }
    ],
    [
      'present undefined',
      (input) => {
        input.runtimeSource = undefined
      }
    ],
    [
      'unsupported version',
      (input) => {
        input.runtimeSource.format = 2
      }
    ],
    [
      'unknown identity field',
      (input) => {
        input.runtimeSource.trusted = true
      }
    ],
    [
      'empty inventory',
      (input) => {
        input.runtimeSource.files = []
        rehashRuntime(input)
      }
    ],
    [
      'duplicate entry',
      (input) => {
        input.runtimeSource.files.push(input.runtimeSource.files[0])
        rehashRuntime(input)
      }
    ],
    [
      'missing runtime entry with fresh digest',
      (input) => {
        input.runtimeSource.files.splice(
          input.runtimeSource.files.findIndex((entry) =>
            entry.path.endsWith('/src/index.ts')
          ),
          1
        )
        rehashRuntime(input)
      }
    ],
    [
      'reordered entries',
      (input) => {
        input.runtimeSource.files.reverse()
        rehashRuntime(input)
      }
    ],
    [
      'noncanonical entry key order',
      (input) => {
        const entry = input.runtimeSource.files[0]
        input.runtimeSource.files[0] = {
          digest: entry.digest,
          path: entry.path,
          size: entry.size
        }
        rehashRuntime(input)
      }
    ],
    [
      'unknown entry key',
      (input) => {
        input.runtimeSource.files[0].trusted = true
        rehashRuntime(input)
      }
    ],
    [
      'invalid byte length',
      (input) => {
        input.runtimeSource.files[0].size = -1
        rehashRuntime(input)
      }
    ],
    [
      'noncanonical path',
      (input) => {
        input.runtimeSource.files[0].path =
          './' + input.runtimeSource.files[0].path
        rehashRuntime(input)
      }
    ],
    [
      'wrong runtime digest',
      (input) => {
        input.runtimeSource.digest = '0'.repeat(64)
      }
    ],
    [
      'wrong full snapshot digest',
      (input) => {
        input.digest = '0'.repeat(64)
      }
    ],
    [
      'altered full manifest',
      (input) => {
        input.files[0].size++
      }
    ],
    [
      'wrong lockfile identity',
      (input) => {
        input.lockfileDigest = '0'.repeat(64)
      }
    ],
    [
      'missing required metadata in both inventories',
      (input) => {
        input.files = input.files.filter(
          (entry) => entry.path !== 'packages/factory/package.json'
        )
        input.digest = fingerprint(JSON.stringify(input.files))
        input.runtimeSource.files = input.runtimeSource.files.filter(
          (entry) => entry.path !== 'packages/factory/package.json'
        )
        rehashRuntime(input)
      }
    ],
    [
      'unsupported source path in both inventories',
      (input) => {
        const entry = {
          path: 'packages/other/src/index.ts',
          digest: 'a'.repeat(64),
          size: 1
        }
        input.files.push(entry)
        input.digest = fingerprint(JSON.stringify(input.files))
        input.runtimeSource.files.push({
          path: entry.path,
          size: entry.size,
          digest: entry.digest
        })
        rehashRuntime(input)
      }
    ]
  ]
  for (const [name, corrupt] of cases) {
    const input = structuredClone(snapshot)
    corrupt(input)
    assert.throws(
      () => validateRuntimeSource(input),
      /runtime|manifest|snapshot|lockfile/i,
      name
    )
  }
})

test('source owner constructs candidate runtime identity from captured bytes without reading source or admitting a snapshot', (t) => {
  const output = fs.mkdtempSync(path.join(parent, 'runtime-construction-'))
  t.after(() => fs.rmSync(output, { recursive: true, force: true }))
  const contract = loadContract(root)
  const snapshot = captureSource(root, output, contract)
  const read = t.mock.method(fs, 'readFileSync', () => {
    throw new Error('Unexpected source reread')
  })
  assert.deepEqual(
    createRuntimeSource([...snapshot.files].reverse()),
    snapshot.runtimeSource
  )
  const changed = snapshot.files.map((entry) =>
    entry.path === 'packages/factory/src/data-transact.ts'
      ? { ...entry, size: entry.size + 1, digest: 'a'.repeat(64) }
      : entry
  )
  const runtime = createRuntimeSource(changed)
  assert.notEqual(runtime.digest, snapshot.runtimeSource.digest)
  assert.ok(Object.isFrozen(runtime))
  assert.ok(Object.isFrozen(runtime.files))
  assert.ok(runtime.files.every(Object.isFrozen))
  assert.deepEqual(
    createRuntimeSource(
      snapshot.files.map((entry) =>
        entry.path === contract.configFile
          ? { ...entry, digest: 'b'.repeat(64) }
          : entry
      )
    ),
    snapshot.runtimeSource
  )
  assert.throws(
    () => validateRuntimeSource({ ...snapshot, runtimeSource: runtime }),
    /runtime inventory/i
  )
  const candidate = {
    ...snapshot,
    files: changed,
    runtimeSource: runtime,
    digest: createHash('sha256').update(JSON.stringify(changed)).digest('hex')
  }
  assert.deepEqual(validateRuntimeSource(candidate), runtime)
  assert.equal(read.mock.callCount(), 0)
})

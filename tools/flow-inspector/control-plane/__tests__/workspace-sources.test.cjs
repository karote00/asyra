/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const test = require('node:test')
const { admitContract } = require('../contracts.cjs')
const {
  captureSource,
  validateSourceSnapshot,
  verifyRetainedSource,
  admitRuntimeAuthoritySource,
  composeSource
} = require('../snapshot.cjs')
const originalManifest = require('../../../../packages/factory/flow-contracts.json')
const originalArchitecture = require('../../inspectors/transaction-flow-inspector.data.cjs')
const repositoryRoot = path.resolve(__dirname, '../../../..')
const parent = path.join(
  repositoryRoot,
  'tmp/flow-inspector/workspace-source-tests'
)

function fixture(t) {
  fs.mkdirSync(parent, { recursive: true })
  const root = fs.mkdtempSync(path.join(parent, 'source-'))
  const runDirectory = path.join(root, 'tmp', randomUUID())
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(
      path.join(root, file),
      typeof content === 'string' ? content : JSON.stringify(content)
    )
  }
  write('package.json', {
    private: true,
    workspaces: ['apps/*', 'packages/*', 'tools/*']
  })
  write('yarn.lock', '# captured lock\n')
  write('apps/studio/package.json', {
    name: '@example/editor',
    private: true,
    dependencies: { '@example/shared': 'workspace:*' }
  })
  write('packages/support/package.json', {
    name: '@example/shared',
    private: true
  })
  write('tools/unrelated/package.json', {
    name: '@example/unrelated',
    private: true
  })
  write('packages/support/src/index.ts', 'export const value = 1\n')
  write(
    'apps/studio/server/session.ts',
    "import { value } from '@example/shared'; export const read = () => value\n"
  )
  write('apps/studio/src/view.ts', 'export const view = 1\n')
  write('apps/studio/server/.env', 'PRIVATE_VALUE=not-a-runtime-input\n')
  write('apps/studio/server/__tests__/other.test.ts', 'excluded test\n')
  write('apps/studio/server/session.test.ts', 'excluded test\n')
  write('tools/unrelated/src/index.ts', 'excluded runtime\n')
  const manifest = structuredClone(originalManifest)
  Object.assign(manifest, {
    manifestPath: 'verification/flow-contracts.json',
    architecturePath: 'verification/architecture.cjs',
    specPath: 'verification/spec.md',
    testFile: 'verification/proof.test.ts',
    configFile: 'verification/config.ts',
    workspaceSources: [
      { name: '@example/editor', inputs: ['server/**', 'src/**'], entry: null }
    ]
  })
  const architecture = structuredClone(originalArchitecture)
  const selected = new Set(manifest.flows.flatMap((flow) => flow.stepIds))
  for (const [index, step] of architecture.steps
    .filter((step) => selected.has(step.id))
    .entries()) {
    step.ownerPackage = index === 0 ? '@example/shared' : '@example/editor'
    step.implementationBoundary = [
      index === 0
        ? 'packages/support/src/index.ts'
        : 'apps/studio/server/session.ts'
    ]
  }
  for (const scenario of manifest.scenarios)
    if (scenario.mutation)
      scenario.mutation.file = 'apps/studio/server/session.ts'
  write(manifest.specPath, '# Source fixture\n')
  write(manifest.testFile, 'export {}\n')
  write(manifest.configFile, 'export default {}\n')
  const contract = () => {
    write(manifest.manifestPath, manifest)
    write(
      manifest.architecturePath,
      'module.exports = ' + JSON.stringify(architecture)
    )
    return admitContract(manifest, architecture)
  }
  return {
    root,
    runDirectory,
    write,
    manifest,
    architecture,
    contract,
    capture: () => captureSource(root, runDirectory, contract())
  }
}

test('private App and package integration capture actual workspace identities and server inputs once', (t) => {
  const input = fixture(t)
  const reads = new Map()
  const originalRead = fs.readFileSync
  fs.readFileSync = (file, ...args) => {
    if (typeof file === 'string' && file.startsWith(input.root + path.sep))
      reads.set(file, (reads.get(file) ?? 0) + 1)
    return originalRead(file, ...args)
  }
  let snapshot
  try {
    snapshot = input.capture()
  } finally {
    fs.readFileSync = originalRead
  }
  assert.equal(snapshot.runtimeAuthority.format, 2)
  assert.deepEqual(snapshot.runtimeAuthority.packageNames, [
    '@example/editor',
    '@example/shared'
  ])
  assert.equal(
    snapshot.runtimeAuthority.packages[0].repositoryDirectory,
    'apps/studio'
  )
  assert.equal(snapshot.runtimeAuthority.packages[0].entryPath, null)
  assert.ok(
    snapshot.runtimeSource.files.some(
      (file) => file.path === 'apps/studio/server/session.ts'
    )
  )
  assert.ok(
    !snapshot.files.some((file) =>
      /unrelated|\.env|session\.test|__tests__/.test(file.path)
    )
  )
  for (const [file, count] of reads) assert.equal(count, 1, file)
  assert.equal(snapshot.readCount, reads.size)
  assert.doesNotThrow(() => validateSourceSnapshot(snapshot, input.contract()))
  assert.doesNotThrow(() =>
    admitRuntimeAuthoritySource(snapshot.sourceRoot, snapshot, input.contract())
  )
})

test('workspace source capture rejects missing, ambiguous, escaped, unused and overlapping inputs before writing', (t) => {
  const cases = [
    (input) =>
      input.write('tools/unrelated/package.json', { name: '@example/editor' }),
    (input) =>
      input.write('apps/studio/package.json', {
        name: '@example/editor',
        dependencies: { '@example/missing': 'workspace:*' }
      }),
    (input) => input.manifest.workspaceSources[0].inputs.push('missing/**'),
    (input) => input.manifest.workspaceSources[0].inputs.push('../support/**'),
    (input) =>
      input.manifest.workspaceSources.push({
        name: '@example/unrelated',
        inputs: ['src/**'],
        entry: null
      }),
    (input) => {
      input.manifest.testFile = 'apps/studio/src/view.ts'
    },
    (input) =>
      fs.symlinkSync(
        path.join(input.root, 'packages/support/src/index.ts'),
        path.join(input.root, 'apps/studio/server/link.ts')
      ),
    (input) =>
      input.write('packages/support/package.json', {
        name: '@example/shared',
        dependencies: { '@example/editor': 'workspace:*' }
      })
  ]
  for (const change of cases) {
    const input = fixture(t)
    change(input)
    assert.throws(() => input.capture())
    assert.equal(fs.existsSync(path.join(input.runDirectory, 'source')), false)
  }
})

test('workspace retained source verifies transitive bytes and admits ordinary composition', (t) => {
  const input = fixture(t)
  const contract = input.contract()
  const snapshot = input.capture()
  // These APIs receive trusted source locations separately from saved descriptors.
  assert.doesNotThrow(() =>
    admitRuntimeAuthoritySource(snapshot.sourceRoot, snapshot, contract)
  )
  const retained = {
    sourceRoot: snapshot.sourceRoot,
    admission: {
      attemptId: path.basename(input.runDirectory),
      repository: fs.realpathSync(input.root),
      head: snapshot.head,
      sourceDigest: snapshot.digest,
      contractDigest: contract.digest,
      mappingVersion: contract.mappingVersion,
      architectureVersion: contract.architectureVersion,
      configurationDigest: snapshot.configurationDigest,
      ...validateSourceSnapshot(snapshot, contract)
    }
  }
  assert.doesNotThrow(() =>
    verifyRetainedSource(input.root, retained, contract)
  )
  const composed = composeSource(
    input.root,
    path.join(input.root, 'tmp', randomUUID()),
    retained,
    retained,
    contract
  )
  assert.deepEqual(composed.runtimeSource, snapshot.runtimeSource)
  assert.deepEqual(composed.runtimeAuthority, snapshot.runtimeAuthority)
  const dependency = path.join(
    snapshot.sourceRoot,
    'packages/support/src/index.ts'
  )
  fs.chmodSync(dependency, 0o644)
  fs.writeFileSync(dependency, 'export const value = 2\n')
  assert.throws(
    () => admitRuntimeAuthoritySource(snapshot.sourceRoot, snapshot, contract),
    /bytes mismatch/
  )
  assert.throws(
    () =>
      composeSource(
        input.root,
        path.join(input.root, 'tmp', randomUUID()),
        retained,
        retained,
        contract
      ),
    /byte fingerprint mismatch/
  )
})

test('a tool workspace can derive execution without writing into its runtime roots', (t) => {
  const input = fixture(t)
  const source = require('../snapshot.cjs')
  fs.renameSync(
    path.join(input.root, 'apps/studio'),
    path.join(input.root, 'tools/flow-inspector')
  )
  fs.renameSync(
    path.join(input.root, 'tools/flow-inspector/server'),
    path.join(input.root, 'tools/flow-inspector/control-plane')
  )
  input.manifest.workspaceSources[0].inputs = ['src/**', 'control-plane/**']
  for (const step of input.architecture.steps)
    step.implementationBoundary = step.implementationBoundary.map((file) =>
      file.replace('apps/studio/server', 'tools/flow-inspector/control-plane')
    )
  for (const scenario of input.manifest.scenarios)
    if (scenario.mutation)
      scenario.mutation.file = 'tools/flow-inspector/control-plane/session.ts'
  const snapshot = input.capture()
  const generated = source.createDerivedExecution({
    sourceRoot: snapshot.sourceRoot,
    verificationSource: snapshot.verificationSource,
    runtimeAuthority: snapshot.runtimeAuthority
  })
  assert.ok(
    generated.files.every(
      (file) => !file.path.startsWith('tools/flow-inspector/')
    )
  )
})

function retain(input, contract) {
  const runDirectory = path.join(input.root, 'tmp', randomUUID())
  const snapshot = captureSource(input.root, runDirectory, contract)
  return {
    snapshot,
    sourceRoot: snapshot.sourceRoot,
    admission: {
      attemptId: path.basename(runDirectory),
      repository: fs.realpathSync(input.root),
      head: snapshot.head,
      sourceDigest: snapshot.digest,
      contractDigest: contract.digest,
      mappingVersion: contract.mappingVersion,
      architectureVersion: contract.architectureVersion,
      configurationDigest: snapshot.configurationDigest,
      ...validateSourceSnapshot(snapshot, contract)
    }
  }
}

function transferredOwner(t) {
  const input = fixture(t)
  const previousContract = input.contract()
  const previous = retain(input, previousContract)
  const selected = new Set(input.manifest.flows.flatMap((flow) => flow.stepIds))
  const moved = input.architecture.steps.find(
    (step) => selected.has(step.id) && step.ownerPackage === '@example/editor'
  )
  moved.ownerPackage = '@example/shared'
  moved.implementationBoundary = ['packages/support/src/index.ts']
  input.write('packages/support/src/index.ts', 'export const value = 2\n')
  const currentContract = input.contract()
  const current = retain(input, currentContract)
  return { input, previousContract, previous, currentContract, current }
}

for (const method of ['composeSource', 'composeDerivedSource']) {
  test(`${method} verifies transferred owners against original contracts on identical current runtime bytes`, (t) => {
    const { input, previousContract, previous, current } = transferredOwner(t)
    const reads = new Map()
    const originalRead = fs.readFileSync
    fs.readFileSync = (file, ...args) => {
      if (typeof file === 'string' && file.startsWith(input.root + path.sep))
        reads.set(file, (reads.get(file) ?? 0) + 1)
      return originalRead(file, ...args)
    }
    let composed
    try {
      composed = require('../snapshot.cjs')[method](
        input.root,
        path.join(input.root, 'tmp', randomUUID()),
        current,
        previous,
        previousContract
      )
    } finally {
      fs.readFileSync = originalRead
    }
    assert.deepEqual(composed.runtimeSource, current.snapshot.runtimeSource)
    assert.deepEqual(
      composed.verificationSource,
      previous.snapshot.verificationSource
    )
    assert.notEqual(
      composed.runtimeSource.digest,
      previous.snapshot.runtimeSource.digest
    )
    assert.equal(
      composed.runtimeAuthority.contractScopeDigest,
      previousContract.runtimeScope.digest
    )
    assert.deepEqual(
      composed.runtimeAuthority.packages,
      current.snapshot.runtimeAuthority.packages
    )
    assert.notEqual(
      composed.runtimeAuthority.digest,
      current.snapshot.runtimeAuthority.digest
    )
    for (const [file, count] of reads) assert.equal(count, 1, file)
    assert.equal(composed.readCount, reads.size)
    assert.equal(
      fs.readFileSync(
        path.join(composed.sourceRoot, 'packages/support/src/index.ts'),
        'utf8'
      ),
      'export const value = 2\n'
    )
    assert.doesNotThrow(() =>
      validateSourceSnapshot(composed, previousContract, composed.files, {
        sourceRoot: composed.sourceRoot
      })
    )
    assert.doesNotThrow(() =>
      admitRuntimeAuthoritySource(
        composed.sourceRoot,
        composed,
        previousContract
      )
    )
  })
}

test('owner transfer rejects unavailable owners, different runtime inputs and changed captured bytes before writing', (t) => {
  for (const change of ['owner', 'inputs', 'bytes', 'legacy']) {
    const { input, previousContract, previous, current } = transferredOwner(t)
    let verifier = previous,
      contract = previousContract
    if (change === 'owner') {
      input.architecture.steps.find(
        (step) => step.ownerPackage === '@example/shared'
      ).ownerPackage = '@example/unrelated'
      contract = input.contract()
      verifier = retain(input, contract)
    } else if (change === 'inputs') {
      input.manifest.workspaceSources[0].inputs = ['server/**']
      contract = input.contract()
      verifier = retain(input, contract)
    } else if (change === 'bytes') {
      const file = path.join(
        current.sourceRoot,
        'packages/support/src/index.ts'
      )
      fs.chmodSync(file, 0o644)
      fs.writeFileSync(file, 'export const value = 999\n')
    } else delete verifier.admission.runtimeAuthority
    const destination = path.join(input.root, 'tmp', randomUUID())
    assert.throws(() =>
      composeSource(input.root, destination, current, verifier, contract)
    )
    assert.equal(fs.existsSync(destination), false)
  }
})

test('owner transfer validates a derived runtime against its original authority before rebinding', (t) => {
  const { input, previousContract, previous, currentContract, current } =
    transferredOwner(t)
  const { composeDerivedSource } = require('../snapshot.cjs')
  const generated = composeDerivedSource(
    input.root,
    path.join(input.root, 'tmp', randomUUID()),
    current,
    current,
    currentContract
  )
  const retained = {
    sourceRoot: generated.sourceRoot,
    admission: {
      ...current.admission,
      attemptId: path.basename(path.dirname(generated.sourceRoot)),
      sourceDigest: generated.digest,
      configurationDigest: generated.configurationDigest,
      ...validateSourceSnapshot(generated, currentContract, generated.files, {
        sourceRoot: generated.sourceRoot
      })
    }
  }
  const composed = composeDerivedSource(
    input.root,
    path.join(input.root, 'tmp', randomUUID()),
    retained,
    previous,
    previousContract
  )
  assert.deepEqual(composed.runtimeSource, current.snapshot.runtimeSource)
  assert.notEqual(
    composed.executionSource.runtimeAuthorityDigest,
    generated.executionSource.runtimeAuthorityDigest
  )
  assert.equal(
    composed.executionSource.runtimeAuthorityDigest,
    composed.runtimeAuthority.digest
  )
  assert.doesNotThrow(() =>
    validateSourceSnapshot(composed, previousContract, composed.files, {
      sourceRoot: composed.sourceRoot
    })
  )
  retained.admission.executionSource = {
    ...retained.admission.executionSource,
    runtimeAuthorityDigest: composed.runtimeAuthority.digest
  }
  const destination = path.join(input.root, 'tmp', randomUUID())
  assert.throws(
    () =>
      composeDerivedSource(
        input.root,
        destination,
        retained,
        previous,
        previousContract
      ),
    /ordinary runtime or admitted derived execution/
  )
  assert.equal(fs.existsSync(destination), false)
})

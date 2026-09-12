/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const { admitContract } = require('../contracts.cjs')
const {
  createHistory,
  compareVersion,
  decideVersion
} = require('../evolution.cjs')
const manifest = require('../../../../packages/factory/flow-contracts.json')
const architecture = require('../../inspectors/transaction-flow-inspector.data.cjs')
const actor = {
  id: 'owner',
  capabilities: ['decide-contract', 'retire-contract']
}
function version(edit) {
  const input = structuredClone(manifest)
  edit?.(input)
  const contract = admitContract(input, architecture)
  return {
    contract,
    selectors: contract.cases.map((c) => ({
      caseId: c.id,
      file: contract.testFile,
      testName: c.testName,
      contentDigest: 'a'.repeat(64)
    }))
  }
}
const review = (base, candidate, options) =>
  compareVersion(createHistory(base), candidate, options)

test('stable identity exposes rename, move and content change independently', () => {
  const base = version()
  const renamed = version((m) => {
    m.flows[0].cases[0].testName += ' renamed'
  })
  assert.ok(review(base, renamed).changes.some((c) => c.kind === 'rename'))
  const moved = structuredClone(base)
  moved.selectors[0].file = 'packages/factory/src/__tests__/moved.test.ts'
  assert.ok(review(base, moved).changes.some((c) => c.kind === 'move'))
  const changed = structuredClone(base)
  changed.selectors[0].contentDigest = 'b'.repeat(64)
  assert.ok(
    review(base, changed).changes.some((c) => c.kind === 'content-change')
  )
  assert.equal(review(base, changed).invalidatesEvidence, true)
})

test('missing selector and unknown evidence are explicit unresolved outcomes', () => {
  const base = version(),
    candidate = structuredClone(base)
  candidate.selectors.shift()
  candidate.selectors.push({
    caseId: 'unknown',
    file: base.contract.testFile,
    testName: 'unmapped',
    contentDigest: 'a'.repeat(64)
  })
  const r = review(base, candidate)
  assert.deepEqual(r.blockers.map((b) => b.kind).sort(), [
    'missing-selector',
    'unknown-evidence'
  ])
  assert.throws(
    () =>
      decideVersion(
        createHistory(base),
        r,
        candidate,
        { decision: 'accept', reason: 'ignore absent proof' },
        actor
      ),
    /unresolved/
  )
})

test('split and merge require explicit complete successor identities without heuristic mutation', () => {
  const base = version()
  const split = version((m) => {
    const c = m.flows[0].cases[0]
    m.flows[0].cases.push({
      ...c,
      id: 'deferred.snapshot.extra',
      testName: c.testName + ' extra'
    })
  })
  const r = review(base, split, {
    relations: [
      {
        kind: 'split',
        before: ['deferred.snapshot'],
        after: ['deferred.snapshot', 'deferred.snapshot.extra']
      }
    ]
  })
  assert.ok(r.changes.some((c) => c.kind === 'split'))
  assert.throws(
    () =>
      review(base, split, {
        relations: [
          {
            kind: 'split',
            before: ['absent'],
            after: ['deferred.snapshot', 'deferred.snapshot.extra']
          }
        ]
      }),
    /relation/
  )
  const merged = review(split, base, {
    relations: [
      {
        kind: 'merge',
        before: ['deferred.snapshot', 'deferred.snapshot.extra'],
        after: ['deferred.snapshot']
      }
    ]
  })
  assert.ok(merged.changes.some((c) => c.kind === 'merge'))
  assert.ok(merged.changes.some((c) => c.kind === 'deletion'))
})

test('deletion requires separate retirement authority and preserves immutable history', () => {
  const base = version((m) => {
    m.flows[0].cases.push({
      ...m.flows[0].cases[0],
      id: 'extra',
      testName: 'additional proof'
    })
  })
  const candidate = version(),
    history = createHistory(base)
  const r = compareVersion(history, candidate)
  const request = {
    decision: 'accept',
    reason: 'Retire duplicate requirement',
    retirement: ['extra']
  }
  assert.throws(
    () =>
      decideVersion(
        history,
        r,
        candidate,
        { ...request, retirement: [] },
        actor
      ),
    /retirement/
  )
  assert.throws(
    () =>
      decideVersion(history, r, candidate, request, {
        id: 'dev',
        capabilities: ['decide-contract']
      }),
    /authorized/
  )
  const next = decideVersion(history, r, candidate, request, actor)
  assert.equal(next.revision, 2)
  assert.equal(history.revision, 1)
  assert.deepEqual(next.versions[0], history.versions[0])
  assert.deepEqual(next.decisions[0].retirement, ['extra'])
  assert.equal(next.decisions[0].actor, 'owner')
  assert.ok(Object.isFrozen(next.versions[0].contract))
  assert.equal(next.versions[1].verificationStatus, 'unknown')
})

test('acceptance binds exact base, all observed bytes, actor, reason and replay identity', () => {
  const base = version(),
    candidate = version((m) => {
      m.flows[0].goal += ' clarified'
    })
  const history = createHistory(base),
    r = compareVersion(history, candidate)
  const request = { decision: 'accept', reason: 'Approved scope revision' }
  assert.throws(
    () =>
      decideVersion(history, r, candidate, request, {
        id: 'viewer',
        capabilities: []
      }),
    /authorized/
  )
  assert.throws(
    () =>
      decideVersion(history, r, candidate, { ...request, reason: '' }, actor),
    /reason/
  )
  const changed = structuredClone(candidate)
  changed.selectors[0].contentDigest = 'b'.repeat(64)
  assert.throws(
    () => decideVersion(history, r, changed, request, actor),
    /candidate/
  )
  const next = decideVersion(history, r, candidate, request, actor)
  assert.strictEqual(decideVersion(next, r, candidate, request, actor), next)
  assert.throws(
    () =>
      decideVersion(
        next,
        r,
        candidate,
        { ...request, reason: 'different' },
        actor
      ),
    /decided/
  )
  const stale = compareVersion(history, base)
  assert.throws(() => decideVersion(next, stale, base, request, actor), /stale/)
  const rejected = decideVersion(
    history,
    r,
    candidate,
    { decision: 'reject', reason: 'keep baseline' },
    actor
  )
  assert.equal(rejected.revision, 1)
  assert.deepEqual(rejected.versions, history.versions)
})

test('duplicate or malformed selector identity cannot create accepted evidence', () => {
  const base = version(),
    candidate = structuredClone(base)
  candidate.selectors.push(candidate.selectors[0])
  assert.throws(() => review(base, candidate), /selector/)
  candidate.selectors.pop()
  candidate.selectors[0].contentDigest = 'unknown'
  assert.throws(() => review(base, candidate), /selector/)
})

function sourceVersions(t) {
  const fs = require('node:fs')
  const path = require('node:path')
  const { randomUUID } = require('node:crypto')
  const sourceOwner = require('../snapshot.cjs')
  const root = path.resolve(__dirname, '../../../..')
  const parent = path.join(root, 'tmp/flow-inspector/version-source-tests')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'run-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const contract = version().contract
  const seed = sourceOwner.captureSource(
    root,
    path.join(directory, 'seed'),
    contract
  )
  const repository = path.join(directory, 'repository')
  fs.cpSync(seed.sourceRoot, repository, { recursive: true })
  function capture() {
    const attemptId = randomUUID()
    const snapshot = sourceOwner.captureSource(
      repository,
      path.join(repository, '.proofs', attemptId),
      contract
    )
    const admitted = sourceOwner.validateSourceSnapshot(snapshot, contract)
    const contentDigest = admitted.verificationSource.files.find(
      (file) => file.path === contract.testFile
    ).digest
    return {
      contract,
      selectors: contract.cases.map((item) => ({
        caseId: item.id,
        file: contract.testFile,
        testName: item.testName,
        contentDigest
      })),
      verificationSource: {
        attemptId,
        repository,
        head: snapshot.head,
        sourceDigest: snapshot.digest,
        configurationDigest: snapshot.configurationDigest,
        descriptor: admitted.verificationSource
      }
    }
  }
  return {
    capture,
    changeConfiguration() {
      const file = path.join(repository, contract.configFile)
      fs.chmodSync(file, 0o600)
      fs.appendFileSync(file, '\n')
    }
  }
}

test('version review exposes actual verification configuration changes even when selectors are unchanged', (t) => {
  const source = sourceVersions(t)
  const base = source.capture()
  source.changeConfiguration()
  const candidate = source.capture()
  assert.deepEqual(candidate.selectors, base.selectors)
  assert.equal(candidate.contract.digest, base.contract.digest)
  const history = createHistory(base)
  const comparison = compareVersion(history, candidate)
  assert.ok(
    comparison.changes.some(
      (item) =>
        item.kind === 'content-change' && item.subject === 'verification-source'
    )
  )
  assert.equal(comparison.invalidatesEvidence, true)
  const accepted = decideVersion(
    history,
    comparison,
    candidate,
    { decision: 'accept', reason: 'Review changed verification inputs' },
    actor
  )
  assert.deepEqual(
    accepted.versions.at(-1).verificationSource,
    candidate.verificationSource
  )
  assert.ok(
    Object.isFrozen(accepted.versions.at(-1).verificationSource.descriptor)
  )
  assert.equal(accepted.versions.at(-1).verificationStatus, 'unknown')
  assert.equal(history.versions.length, 1)
})

test('same verification bytes in a different captured attempt change review identity without inventing content changes', (t) => {
  const source = sourceVersions(t)
  const base = source.capture(),
    candidate = source.capture()
  const history = createHistory(base)
  const unchanged = compareVersion(history, base)
  const changedReference = compareVersion(history, candidate)
  assert.notEqual(changedReference.id, unchanged.id)
  assert.deepEqual(changedReference.changes, [])
  assert.equal(changedReference.invalidatesEvidence, false)
  assert.throws(
    () =>
      decideVersion(
        history,
        unchanged,
        candidate,
        { decision: 'accept', reason: 'Reuse old review' },
        actor
      ),
    /candidate changed/
  )
})

test('malformed verification references and conflicting contract role or selector identities reject validation', (t) => {
  const base = sourceVersions(t).capture()
  for (const corrupt of [
    (v) => {
      v.verificationSource = null
    },
    (v) => {
      v.verificationSource.attemptId = 'untrusted-path'
    },
    (v) => {
      v.verificationSource.repository = '../repository'
    },
    (v) => {
      v.verificationSource.sourceDigest = 'invalid'
    },
    (v) => {
      v.verificationSource.descriptor.contractDigest = 'a'.repeat(64)
    },
    (v) => {
      v.verificationSource.descriptor.roles.test = v.contract.configFile
    },
    (v) => {
      v.verificationSource.descriptor.files.pop()
    },
    (v) => {
      v.selectors[0].contentDigest = 'b'.repeat(64)
    }
  ]) {
    const candidate = structuredClone(base)
    corrupt(candidate)
    assert.throws(() => createHistory(candidate), /verification/)
  }
})

test('a reviewed source reference cannot be removed by acceptance but an explicit rejection remains auditable', (t) => {
  const base = sourceVersions(t).capture()
  const candidate = { contract: base.contract, selectors: base.selectors }
  const history = createHistory(base)
  const comparison = compareVersion(history, candidate)
  assert.ok(
    comparison.blockers.some(
      (item) => item.kind === 'missing-verification-source'
    )
  )
  assert.throws(
    () =>
      decideVersion(
        history,
        comparison,
        candidate,
        { decision: 'accept', reason: 'Drop source authority' },
        actor
      ),
    /unresolved/
  )
  const rejected = decideVersion(
    history,
    comparison,
    candidate,
    { decision: 'reject', reason: 'Keep existing source authority' },
    actor
  )
  assert.equal(rejected.versions.length, 1)
  assert.equal(rejected.decisions.at(-1).decision, 'reject')
})

test('legacy absence remains unchanged and gains a source reference only through an explicit reviewed version', (t) => {
  const candidate = sourceVersions(t).capture()
  const legacy = {
    contract: candidate.contract,
    selectors: candidate.selectors
  }
  const history = createHistory(legacy)
  const before = JSON.stringify(history)
  const comparison = compareVersion(history, candidate)
  assert.equal(Object.hasOwn(history.versions[0], 'verificationSource'), false)
  const accepted = decideVersion(
    history,
    comparison,
    candidate,
    { decision: 'accept', reason: 'Bind retained verification source' },
    actor
  )
  assert.ok(accepted.versions[1].verificationSource)
  assert.equal(Object.hasOwn(accepted.versions[0], 'verificationSource'), false)
  assert.equal(JSON.stringify(history), before)
})

test('version retention consumes admitted references without rereading or revalidating source artifacts', (t) => {
  const candidate = sourceVersions(t).capture()
  const sourceOwner = require('../snapshot.cjs')
  const fs = require('node:fs')
  const forbidden = () => {
    throw new Error('Repeated source work')
  }
  const reads = t.mock.method(fs, 'readFileSync', forbidden)
  const source = t.mock.method(sourceOwner, 'validateSourceSnapshot', forbidden)
  const runtime = t.mock.method(sourceOwner, 'validateRuntimeSource', forbidden)
  const descriptor = t.mock.method(
    sourceOwner,
    'createVerificationSource',
    forbidden
  )
  const history = createHistory(candidate)
  const comparison = compareVersion(history, candidate)
  const accepted = decideVersion(
    history,
    comparison,
    candidate,
    { decision: 'accept', reason: 'Explicit exact-source retention' },
    actor
  )
  const recorded =
    accepted.versions.at(-1).verificationSource.configurationDigest
  candidate.verificationSource.configurationDigest = 'b'.repeat(64)
  assert.equal(
    accepted.versions.at(-1).verificationSource.configurationDigest,
    recorded
  )
  for (const method of [reads, source, runtime, descriptor])
    assert.equal(method.mock.callCount(), 0)
})

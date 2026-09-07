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

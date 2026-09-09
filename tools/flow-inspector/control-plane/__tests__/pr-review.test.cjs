/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { sha256 } = require('../snapshot.cjs')
const { createReviewOwner } = require('../pr-review.cjs')
const root = path.resolve(__dirname, '../../../..')
const file = 'packages/factory/src/data-transact.ts'
function fixture() {
  const parent = path.join(root, 'tmp/flow-inspector/review-tests')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'case-'))
  const sourceRoot = path.join(directory, 'source')
  const candidateRoot = path.join(directory, 'candidate')
  const verifiedRoot = path.join(directory, 'verification/source')
  const before = 'export const value = 1\n',
    after = 'export const value = 2\n'
  for (const [dir, text] of [
    [sourceRoot, before],
    [candidateRoot, after],
    [verifiedRoot, after]
  ]) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    fs.writeFileSync(path.join(dir, file), text)
  }
  const reportPath = path.join(directory, 'verification/report.json')
  fs.writeFileSync(reportPath, '{}')
  const files = [
    { path: file, digest: sha256(after), size: Buffer.byteLength(after) }
  ]
  const record = {
    id: randomUUID(),
    actor: 'human',
    phase: 'completed',
    revoked: false,
    verificationStatus: 'passed',
    workStatus: 'needs-review',
    deliveryStatus: 'not-delivered',
    task: {
      stepId: 'finalize-transaction-state',
      revision: 1,
      contractDigest: 'contract',
      allowedFiles: [file],
      adapter: 'demonstration',
      obligations: [{ id: 'one' }]
    },
    snapshot: {
      sourceRoot,
      head: 'a'.repeat(40),
      digest: 'snapshot',
      files: [
        { path: file, digest: sha256(before), size: Buffer.byteLength(before) }
      ]
    },
    attempts: [
      {
        id: randomUUID(),
        phase: 'completed',
        verdict: {
          files,
          sourceDigest: sha256(JSON.stringify(files)),
          runner: { reportPath, reportDigest: sha256('{}') },
          evidence: {
            status: 'passed',
            cases: [{ id: 'one', status: 'passed' }]
          }
        }
      }
    ],
    changes: [
      { path: file, beforeDigest: sha256(before), afterDigest: sha256(after) }
    ]
  }
  // The same admitted records are consumed by the real owner; only transport is offline.
  const counts = { inspect: 0, deliver: 0, observe: 0 }
  let baseline = { contract: { digest: 'contract' }, revision: 1 },
    baseSha = 'b'.repeat(40),
    remote = null,
    failure = null
  const adapter = {
    repository: 'owner/repo',
    base: 'main',
    async inspect() {
      counts.inspect++
      return { baseSha, baseTree: 'c'.repeat(40) }
    },
    async deliver(preview, checkpoint) {
      counts.deliver++
      await checkpoint('create-branch')
      if (failure) throw failure
      remote = {
        number: 1,
        state: 'open',
        headSha: 'd'.repeat(40),
        draft: true
      }
      return remote
    },
    async observe() {
      counts.observe++
      return remote
    }
  }
  const options = {
    directory: path.join(directory, 'reviews'),
    getTask: () => record,
    getBaseline: () => baseline,
    changes: () =>
      record.changes.map((c) => ({
        ...c,
        before: fs.readFileSync(path.join(sourceRoot, file), 'utf8'),
        after: fs.readFileSync(path.join(candidateRoot, file), 'utf8')
      })),
    candidateDirectory: () => candidateRoot,
    adapter
  }
  const owner = createReviewOwner(root, options)
  return {
    owner,
    options,
    record,
    counts,
    adapter,
    directory,
    candidateRoot,
    sourceRoot,
    verifiedRoot,
    setBase: () => (baseSha = 'e'.repeat(40)),
    setBaseline: () =>
      (baseline = { contract: { digest: 'other' }, revision: 2 }),
    setFailure: (value) => (failure = value),
    setRemote: (value) => (remote = value)
  }
}
const prepare = (f) => f.owner.prepare(f.record.id, 'human')
const confirm = (f, p) =>
  f.owner.confirm(
    f.record.id,
    { previewDigest: p.previewDigest, confirm: true },
    'human'
  )
test('eligible preview is read-only; exact confirmation submits review without accepting baseline', async () => {
  const f = fixture(),
    p = await prepare(f)
  assert.equal(p.state, 'preview')
  assert.equal(p.preview.draft, false)
  assert.equal(f.counts.deliver, 0)
  assert.equal(p.preview.taskId, f.record.id)
  assert.equal(p.preview.attemptId, f.record.attempts[0].id)
  assert.deepEqual(
    p.preview.changes.map((c) => c.path),
    [file]
  )
  assert.match(p.preview.body, /not independently protected/)
  assert.match(p.preview.sourceDiff, /export const value = 1/)
  assert.match(p.preview.sourceDiff, /export const value = 2/)
  await assert.rejects(
    () =>
      f.owner.confirm(
        f.record.id,
        { previewDigest: p.previewDigest, confirm: false },
        'human'
      ),
    /confirmation/
  )
  await assert.rejects(
    () =>
      f.owner.confirm(
        f.record.id,
        { previewDigest: 'wrong', confirm: true },
        'human'
      ),
    /preview/
  )
  const r = await confirm(f, p)
  assert.equal(r.state, 'submitted-for-review')
  assert.equal(r.observation.number, 1)
  assert.equal(f.record.deliveryStatus, 'not-delivered')
  assert.equal(f.record.task.revision, 1)
})
test('retained draft preview cannot authorize ready-for-review creation after restart', async () => {
  const f = fixture(),
    p = structuredClone(await prepare(f))
  delete p.preview.draft
  p.previewDigest = sha256(JSON.stringify(p.preview))
  fs.writeFileSync(
    path.join(f.options.directory, f.record.id + '.json'),
    JSON.stringify(p)
  )
  f.owner = createReviewOwner(root, f.options)
  await assert.rejects(() => confirm(f, p), /fresh preview/)
  assert.equal(f.counts.deliver, 0)
  const fresh = await prepare(f)
  assert.notEqual(fresh.previewDigest, p.previewDigest)
  assert.equal(fresh.preview.draft, false)
  await confirm(f, fresh)
  assert.equal(f.counts.deliver, 1)
})
for (const [name, change] of [
  ['missing candidate', (f) => (f.record.changes = [])],
  ['unknown verification', (f) => (f.record.verificationStatus = 'unknown')],
  ['failed verification', (f) => (f.record.verificationStatus = 'failed')],
  ['stale baseline', (f) => f.setBaseline()],
  ['revoked task', (f) => (f.record.revoked = true)],
  ['active attempt', (f) => (f.record.phase = 'running')],
  [
    'candidate changed',
    (f) => fs.writeFileSync(path.join(f.candidateRoot, file), 'changed')
  ],
  [
    'baseline changed',
    (f) => fs.writeFileSync(path.join(f.sourceRoot, file), 'changed')
  ],
  [
    'frozen verification changed',
    (f) => fs.writeFileSync(path.join(f.verifiedRoot, file), 'changed')
  ],
  [
    'report changed',
    (f) =>
      fs.writeFileSync(
        f.record.attempts[0].verdict.runner.reportPath,
        'changed'
      )
  ],
  ['outside allowed files', (f) => (f.record.task.allowedFiles = [])],
  [
    'extra candidate file',
    (f) => fs.writeFileSync(path.join(f.candidateRoot, 'extra.ts'), 'extra')
  ]
])
  test(name + ' refuses before external effects', async () => {
    const f = fixture()
    change(f)
    await assert.rejects(() => prepare(f))
    assert.equal(f.counts.deliver, 0)
  })
test('changed remote base or attempt refuses exact confirmation', async () => {
  const f = fixture(),
    p = await prepare(f)
  f.setBase()
  await assert.rejects(() => confirm(f, p), /base/)
  assert.equal(f.counts.deliver, 0)
  const g = fixture(),
    q = await prepare(g)
  g.record.attempts[0].id = randomUUID()
  await assert.rejects(() => confirm(g, q), /attempt/)
})
test('duplicate clicks and restart retain one delivery and zero-work reads', async () => {
  const f = fixture(),
    p = await prepare(f)
  await Promise.all([confirm(f, p), confirm(f, p)])
  assert.equal(f.counts.deliver, 1)
  const next = createReviewOwner(root, f.options)
  const counts = { ...f.counts }
  for (let i = 0; i < 30; i++)
    assert.equal(next.get(f.record.id).previewDigest, p.previewDigest)
  assert.deepEqual(f.counts, counts)
  await next.confirm(
    f.record.id,
    { previewDigest: p.previewDigest, confirm: true },
    'human'
  )
  assert.equal(f.counts.deliver, 1)
})
test('possibly successful timeout and restart reconcile only by query; absence never permits blind resend', async () => {
  const f = fixture(),
    p = await prepare(f)
  f.setFailure(new Error('secret-transport-marker'))
  const r = await confirm(f, p)
  assert.equal(r.state, 'uncertain')
  assert.equal(JSON.stringify(r).includes('secret-transport-marker'), false)
  const next = createReviewOwner(root, f.options)
  await next.refresh(f.record.id, 'human')
  await assert.rejects(
    () =>
      next.confirm(
        f.record.id,
        { previewDigest: p.previewDigest, confirm: true },
        'human'
      ),
    /uncertain/
  )
  f.setRemote({
    number: 2,
    state: 'open',
    headSha: 'd'.repeat(40),
    draft: true
  })
  const reconciled = await next.refresh(f.record.id, 'human')
  assert.equal(reconciled.state, 'submitted-for-review')
  assert.equal(f.counts.deliver, 1)
})
test('definite no-effect refusal permits explicit retry and records audit', async () => {
  const f = fixture(),
    p = await prepare(f)
  f.setFailure(
    Object.assign(new Error('private details'), {
      code: 'authentication',
      noEffect: true
    })
  )
  assert.equal((await confirm(f, p)).state, 'blocked')
  f.setFailure(null)
  assert.equal((await confirm(f, p)).state, 'submitted-for-review')
  assert.equal(f.counts.deliver, 2)
  assert.ok(f.owner.get(f.record.id).audit.length >= 4)
})
test('GitHub closed, merged or changed HEAD never writes task, baseline or local verdict', async () => {
  const f = fixture(),
    p = await prepare(f)
  await confirm(f, p)
  const before = JSON.stringify(f.record)
  for (const state of ['open', 'closed', 'merged']) {
    f.setRemote({
      number: 1,
      state,
      headSha: 'e'.repeat(40),
      checks: { headSha: 'e'.repeat(40), status: 'passed' }
    })
    assert.equal(
      (await f.owner.refresh(f.record.id, 'human')).observation.state,
      state
    )
  }
  assert.equal(JSON.stringify(f.record), before)
})

test('restart during an effect remains uncertain and lookup failure clears current checks', async () => {
  const f = fixture(),
    p = await prepare(f)
  await confirm(f, p)
  const file = path.join(f.options.directory, f.record.id + '.json')
  const saved = JSON.parse(fs.readFileSync(file))
  saved.state = 'submitting'
  saved.observation.checks = { headSha: 'd'.repeat(40), status: 'passed' }
  fs.writeFileSync(file, JSON.stringify(saved))
  const next = createReviewOwner(root, {
    ...f.options,
    adapter: {
      ...f.adapter,
      observe: async () => {
        throw new Error('secret')
      }
    }
  })
  assert.equal(next.get(f.record.id).state, 'uncertain')
  const r = await next.refresh(f.record.id, 'human')
  assert.equal(r.observation.checks, null)
  assert.equal(r.observation.stale, true)
})

test('a resumed task cannot silently replace an already submitted attempt identity', async () => {
  const f = fixture(),
    p = await prepare(f)
  await confirm(f, p)
  f.record.attempts[0].id = randomUUID()
  await assert.rejects(() => prepare(f), /another attempt/)
  assert.equal(f.owner.get(f.record.id).preview.attemptId, p.preview.attemptId)
})

test('only equivalent authorized requests coalesce while a delivery effect is pending', async () => {
  const f = fixture(),
    p = await prepare(f)
  let entered, release
  const ready = new Promise((resolve) => (entered = resolve))
  f.adapter.deliver = async () => {
    entered()
    await new Promise((resolve) => (release = resolve))
    return { number: 1, state: 'open' }
  }
  const pending = confirm(f, p)
  await ready
  try {
    await assert.rejects(
      () =>
        Promise.race([
          f.owner.refresh(f.record.id, 'human'),
          new Promise((resolve) => setTimeout(resolve, 30))
        ]),
      /different.*action/
    )
    await assert.rejects(
      () => f.owner.prepare(f.record.id, 'stranger'),
      /authorized/
    )
  } finally {
    release()
    await pending
  }
})

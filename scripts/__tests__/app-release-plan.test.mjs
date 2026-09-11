import assert from 'node:assert/strict'
import test from 'node:test'
import {
  RELEASE_APPS,
  assertBudget,
  createReleasePlan,
  requireCommit
} from '../app-release-plan.mjs'

const old = 'a'.repeat(40)
const sha = 'b'.repeat(40)
const shared = {
  name: '@asyra/shared',
  root: 'packages/shared',
  dependencies: {}
}
const snapshot = RELEASE_APPS.map((app) => ({
  name: app.id,
  root: app.root,
  dependencies: { '@asyra/shared': '*' }
})).concat(shared)
const baselines = Object.fromEntries(
  RELEASE_APPS.map((app) => [app.id, { sha: old }])
)
const plan = (files, extra = {}) =>
  createReleasePlan({
    sha,
    baselines,
    snapshot: () => snapshot,
    diff: () => files,
    ancestor: () => '',
    ...extra
  })

test('accumulated changes release only the owning App', () => {
  assert.deepEqual(
    plan(['apps/asyra-sim/src/example.ts'])
      .apps.filter((a) => a.release)
      .map((a) => a.id),
    ['asyra-sim']
  )
})
test('transitive and removed dependencies affect their consumers', () => {
  const before = snapshot
    .map((s) =>
      s.name === '@asyra/shared' ? { ...s, dependencies: { leaf: '*' } } : s
    )
    .concat({ name: 'leaf', root: 'packages/leaf' })
  const result = plan(['packages/leaf/deleted.ts'], {
    snapshot: (ref) => (ref === old ? before : snapshot)
  })
  assert.ok(result.apps.every((app) => app.release))
})
test('shared inputs, public content, tests and unrelated workspaces have distinct scope', () => {
  assert.ok(plan(['yarn.lock']).apps.every((a) => a.release))
  assert.deepEqual(
    plan(['docs/public/start.md'])
      .apps.filter((a) => a.release)
      .map((a) => a.id),
    ['asyra-framework']
  )
  assert.ok(
    plan([
      'docs/ai/plan.md',
      'apps/asyra-sim/e2e/test.spec.ts',
      'packages/unused/index.ts'
    ]).apps.every((a) => !a.release)
  )
})
test('each distinct commit snapshot and accumulated diff is produced once per invocation', () => {
  let reads = 0
  let diffs = 0
  const options = {
    snapshot: () => {
      reads++
      return snapshot
    },
    diff: () => {
      diffs++
      return ['packages/shared/index.ts']
    }
  }
  assert.ok(plan([], options).apps.every((a) => a.release))
  assert.equal(reads, 2)
  assert.equal(diffs, 1)
  plan([], options)
  assert.equal(reads, 4)
  assert.equal(diffs, 2)
})
test('each App uses its own online baseline', () => {
  const ref = 'c'.repeat(40)
  const result = plan([], {
    baselines: { ...baselines, 'asyra-sim': { sha: ref } },
    diff: (base) => (base === ref ? ['apps/asyra-sim/src/index.ts'] : [])
  })
  assert.equal(result.apps[0].release, true)
  assert.equal(result.apps[1].release, false)
})
test('fail closed on missing baselines, rollback, malformed SHA or force input', () => {
  assert.throws(() => plan([], { baselines: {} }))
  assert.throws(() =>
    plan([], {
      ancestor: () => {
        throw new Error('Not an ancestor')
      }
    })
  )
  assert.throws(() => requireCommit('main; curl attacker'))
  assert.throws(() => plan([], { forceApp: 'other' }))
  assert.throws(() => plan([], { forceApp: 'asyra-sim' }))
  assert.equal(
    plan([], {
      forceApp: 'asyra-sim',
      reason: 'Production configuration changed'
    }).apps[0].release,
    true
  )
})
test('reserve includes all owner deployments and managed retries', () => {
  assertBudget({ total: 91, managed: 9, requested: 3 })
  assert.throws(() => assertBudget({ total: 92, managed: 0, requested: 3 }))
  assert.throws(() => assertBudget({ total: 10, managed: 10, requested: 3 }))
  assert.throws(() => assertBudget({ total: NaN, managed: 0, requested: 1 }))
})

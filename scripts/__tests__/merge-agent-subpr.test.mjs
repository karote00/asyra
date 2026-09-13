import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mergeRegisteredSubpr,
  verifyRemoteIntegration
} from '../merge-agent-subpr.mjs'

const source = {
  kind: 'subpr',
  branch: 'codex/feature',
  integrationTargetTaskId: 'goal'
}
const goal = { kind: 'goal', branch: 'codex/goal' }
const pr = {
  number: 10,
  state: 'OPEN',
  isDraft: false,
  headRefName: source.branch,
  baseRefName: goal.branch,
  headRefOid: 'a'.repeat(40),
  baseRefOid: 'b'.repeat(40),
  statusCheckRollup: [{ status: 'COMPLETED', conclusion: 'SUCCESS' }]
}
const local = { head: pr.headRefOid, base: pr.baseRefOid }

test('merge path binds PR, source, goal and exact remote revisions', () => {
  assert.doesNotThrow(() =>
    verifyRemoteIntegration({
      source,
      goal,
      goalId: 'goal',
      pr,
      number: 10,
      local
    })
  )
  for (const changed of [
    { number: 11 },
    { headRefOid: 'c'.repeat(40) },
    { baseRefOid: 'c'.repeat(40) },
    { baseRefName: 'codex/other' },
    { isDraft: true },
    { state: 'CLOSED' }
  ]) {
    assert.throws(() =>
      verifyRemoteIntegration({
        source,
        goal,
        goalId: 'goal',
        pr: { ...pr, ...changed },
        number: 10,
        local
      })
    )
  }
})

test('no checks, failed checks and pending checks cannot become merge permission', () => {
  for (const checks of [
    [],
    [{ status: 'IN_PROGRESS' }],
    [{ status: 'COMPLETED', conclusion: 'FAILURE' }],
    [{ state: 'PENDING' }],
    [{ status: 'COMPLETED', conclusion: 'SKIPPED' }]
  ]) {
    assert.throws(() =>
      verifyRemoteIntegration({
        source,
        goal,
        goalId: 'goal',
        pr: { ...pr, statusCheckRollup: checks },
        number: 10,
        local
      })
    )
  }
})

test('executed merge path cannot bypass a denied local gate and binds the admitted head', () => {
  const registry = {
    tasks: {
      source: { ...source, worktree: '/repo/source' },
      goal: { ...goal, worktree: '/repo/goal' }
    }
  }
  for (const decision of ['deny', 'allow']) {
    const effects = []
    const run = (command, args, options) => {
      if (command === 'git')
        return options.cwd === '/repo/goal' ? local.base : local.head
      if (args[0] === 'repo') return 'owner/repository'
      if (args.includes('integration'))
        return JSON.stringify({ version: 1, decision })
      if (args[1] === 'merge') {
        effects.push(args)
        return ''
      }
      if (args.includes('state,mergeCommit'))
        return JSON.stringify({
          state: 'MERGED',
          mergeCommit: { oid: 'd'.repeat(40) }
        })
      return JSON.stringify(pr)
    }
    const action = () =>
      mergeRegisteredSubpr(
        { registry, sourceId: 'source', goalId: 'goal', number: 10 },
        run
      )
    if (decision === 'deny') assert.throws(action, /gate denied/)
    else assert.equal(action().mergeCommit, 'd'.repeat(40))
    assert.equal(effects.length, decision === 'allow' ? 1 : 0)
    if (effects.length)
      assert.deepEqual(effects[0].slice(-2), [
        '--match-head-commit',
        local.head
      ])
  }
})

test('goal-to-main and wrong registered relationships are rejected', () => {
  assert.throws(() =>
    verifyRemoteIntegration({
      source,
      goal: { ...goal, branch: 'main' },
      goalId: 'goal',
      pr,
      number: 10,
      local
    })
  )
  assert.throws(() =>
    verifyRemoteIntegration({
      source: { ...source, kind: 'goal' },
      goal,
      goalId: 'goal',
      pr,
      number: 10,
      local
    })
  )
  assert.throws(() =>
    verifyRemoteIntegration({
      source,
      goal,
      goalId: 'other',
      pr,
      number: 10,
      local
    })
  )
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { closeoutPaths, evaluateCloseout } from '../plan-closeout.mjs'

const baseSha = 'a'.repeat(40)
const reviewedSha = 'b'.repeat(40)
const headSha = 'c'.repeat(40)
const active = 'docs/ai/framework/plans/example.md'
const paths = closeoutPaths(active)
const plan = '# Plan\n\n## Task 1\n\nRequired outcomes and gates.\n'

function example(mode = 'plan-closeout') {
  const context = {
    version: 1,
    mode,
    objective: 'Finish task',
    base: { ref: 'origin/main', sha: baseSha },
    prerequisites: [],
    ...(mode === 'standalone'
      ? {}
      : {
          plan: { path: active, section: '## Task 1', closeoutOwner: 'owner' }
        })
  }
  const before = {
    [active]: plan,
    [paths.index]: `[Plan](plans/example.md)\n`,
    [paths.decisions]: '# Decisions\n'
  }
  const after = {
    [paths.completed]: `${plan}\n## Closeout\n\nCompleted: 2026-09-30\nReviewed source: ${reviewedSha}\nOutcome: Required cases passed.\nDecision: Accepted.\nExit criteria: All defined checks passed.\n`,
    [paths.index]: '# Active plans\n',
    [paths.decisions]: `# Decisions\n\n## 2026-09-30\n\nCompleted [plan](/${paths.completed}).\n`
  }
  const files = {
    [baseSha]: { ...before },
    [reviewedSha]: { ...before },
    [headSha]:
      mode === 'plan-closeout'
        ? after
        : { ...before, 'code.mjs': 'implementation' }
  }
  const order = [baseSha, reviewedSha, headSha]
  const snapshot = {
    async isAncestor(a, b) {
      return order.includes(a) && order.indexOf(a) <= order.indexOf(b)
    },
    async read(sha, file) {
      return files[sha]?.[file] ?? null
    },
    async changedPaths(a, b) {
      return [
        ...new Set([...Object.keys(files[a]), ...Object.keys(files[b])])
      ].filter((file) => files[a][file] !== files[b][file])
    }
  }
  return { context, baseSha, headSha, reviewedSha, snapshot, files }
}

test('standalone and partial plan tasks pass without closeout or review', async () => {
  for (const mode of ['standalone', 'plan-task']) {
    assert.equal(
      (await evaluateCloseout({ ...example(mode), reviewedSha: undefined }))
        .applicable,
      false
    )
  }
})

test('completed record, index and append-only history prove bounded closeout', async () => {
  assert.equal((await evaluateCloseout(example())).applicable, true)
})

test('task metadata cannot substitute for trusted exact-source review', async () => {
  const input = example()
  input.context.reviewedSha = reviewedSha
  await assert.rejects(
    evaluateCloseout({ ...input, reviewedSha: undefined }),
    /trusted review/
  )
  await assert.rejects(
    evaluateCloseout({ ...input, reviewedSha: 'd'.repeat(40) }),
    /ancestor/
  )
  await assert.rejects(
    evaluateCloseout({ ...input, reviewedSha: headSha }),
    /precede/
  )
})

test('implementation and acceptance changes after review require a new review', async () => {
  for (const file of [
    'code.mjs',
    'tests/acceptance.test.mjs',
    'AGENTS.md',
    'docs/ai/framework/rules/acceptance.md'
  ]) {
    const input = example()
    input.files[headSha][file] = 'changed'
    await assert.rejects(evaluateCloseout(input), /limited/)
  }
})

test('missing move, missing outcome, stale index and rewritten history fail', async () => {
  const mutations = [
    (files) => {
      files[headSha][active] = plan
    },
    (files) => {
      Reflect.deleteProperty(files[headSha], paths.completed)
    },
    (files) => {
      files[headSha][paths.completed] = 'Completed: 2026-09-30'
    },
    (files) => {
      files[headSha][paths.completed] = files[headSha][paths.completed].replace(
        'Outcome: Required cases passed.',
        ''
      )
    },
    (files) => {
      files[headSha][paths.index] = `[Plan](${active})`
    },
    (files) => {
      files[headSha][paths.index] = '[Plan](./plans/example.md)'
    },
    (files) => {
      files[headSha][paths.decisions] =
        `rewritten ${paths.completed} 2026-09-30`
    },
    (files) => {
      files[headSha][paths.decisions] = '# Decisions\n'
    }
  ]
  for (const mutate of mutations) {
    const input = example()
    mutate(input.files)
    await assert.rejects(evaluateCloseout(input))
  }
})

test('standalone and partial modes cannot hide a moved plan', async () => {
  for (const mode of ['standalone', 'plan-task']) {
    const input = example(mode)
    Reflect.deleteProperty(input.files[headSha], active)
    input.files[headSha][paths.completed] = plan
    await assert.rejects(evaluateCloseout(input))
  }
})

test('standalone corrections to an existing completed record do not close another plan', async () => {
  const input = example('standalone')
  input.files[baseSha][paths.completed] = 'old record'
  input.files[headSha][paths.completed] = 'corrected link'
  assert.equal((await evaluateCloseout(input)).applicable, false)
})

test('missing base plan and missing integrated prerequisites fail', async () => {
  const input = example('plan-task')
  Reflect.deleteProperty(input.files[baseSha], active)
  await assert.rejects(evaluateCloseout(input), /missing/)
  const other = example('plan-task')
  other.context.prerequisites = ['d'.repeat(40)]
  await assert.rejects(evaluateCloseout(other), /prerequisite/)
})

test('immutable file reads are reused once per evaluation and refreshed for the next evaluation', async () => {
  const input = example()
  const calls = new Map()
  const original = input.snapshot.read
  input.snapshot.read = async (sha, file) => {
    const key = JSON.stringify([sha, file])
    calls.set(key, (calls.get(key) ?? 0) + 1)
    return original(sha, file)
  }
  await evaluateCloseout(input)
  assert.ok(calls.size > 0)
  assert.ok([...calls.values()].every((count) => count === 1))
  calls.clear()
  input.files[headSha][paths.index] = `[Stale](plans/example.md)`
  await assert.rejects(evaluateCloseout(input), /stale/)
  assert.ok([...calls.values()].every((count) => count === 1))
})

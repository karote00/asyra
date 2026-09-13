// The only supplied remote-mutation entry point. It requires the user's existing
// sub-PR merge authorization; it does not grant new remote authority.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(scriptPath), '..')

export function verifyRemoteIntegration({
  source,
  goal,
  goalId,
  pr,
  number,
  local
}) {
  if (
    source.kind !== 'subpr' ||
    goal.kind !== 'goal' ||
    source.integrationTargetTaskId !== goalId
  )
    throw new Error('Unregistered sub-PR/goal relationship')
  if (['main', 'master'].includes(goal.branch))
    throw new Error('Goal-to-main integration is forbidden')
  if (pr.number !== number || pr.state !== 'OPEN' || pr.isDraft)
    throw new Error('PR must be the expected open, non-draft PR')
  if (pr.headRefName !== source.branch || pr.baseRefName !== goal.branch)
    throw new Error('PR branch relationship changed')
  if (pr.headRefOid !== local.head || pr.baseRefOid !== local.base)
    throw new Error('Remote source or goal revision changed')
  const checks = pr.statusCheckRollup
  if (!Array.isArray(checks) || !checks.length)
    throw new Error('Remote checks are unavailable')
  if (
    !checks.some(
      (check) =>
        check.state === 'SUCCESS' ||
        (check.status === 'COMPLETED' && check.conclusion === 'SUCCESS')
    )
  )
    throw new Error('No remote check actually passed')
  for (const check of checks) {
    const passed =
      check.state === 'SUCCESS' ||
      (check.status === 'COMPLETED' &&
        ['SUCCESS', 'SKIPPED', 'NEUTRAL'].includes(check.conclusion))
    if (!passed) throw new Error('Remote checks are incomplete or failed')
  }
}

function execute(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 20000,
    maxBuffer: 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options
  }).trim()
}

export function mergeRegisteredSubpr(
  { registry, sourceId, goalId, number },
  run = execute
) {
  const source = registry.tasks[sourceId]
  const goal = registry.tasks[goalId]
  if (!source || !goal || !Number.isSafeInteger(number) || number <= 0)
    throw new Error('Unknown task or invalid PR number')
  if (['main', 'master'].includes(goal.branch))
    throw new Error('Goal-to-main integration is forbidden')
  const repository = run('gh', [
    'repo',
    'view',
    '--json',
    'nameWithOwner',
    '--jq',
    '.nameWithOwner'
  ])
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository))
    throw new Error('Invalid repository identity')
  const pr = JSON.parse(
    run('gh', [
      'pr',
      'view',
      String(number),
      '--repo',
      repository,
      '--json',
      'number,state,isDraft,headRefName,baseRefName,headRefOid,baseRefOid,statusCheckRollup'
    ])
  )
  const head = run('git', ['rev-parse', 'HEAD'], { cwd: source.worktree })
  const tree = run('git', ['rev-parse', 'HEAD^{tree}'], {
    cwd: source.worktree
  })
  const base = run('git', ['rev-parse', 'HEAD'], { cwd: goal.worktree })
  verifyRemoteIntegration({
    source,
    goal,
    goalId,
    pr,
    number,
    local: { head, base }
  })
  const result = JSON.parse(
    run(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/agent-coordination/guard.cjs'),
        'integration'
      ],
      {
        input: JSON.stringify({
          repoRoot,
          cwd: goal.worktree,
          sourceTaskId: sourceId,
          goalTaskId: goalId,
          sourcePr: {
            number,
            baseBranch: pr.baseRefName,
            headBranch: pr.headRefName,
            headSha: head,
            headTree: tree
          },
          goal: { branch: goal.branch, headSha: base }
        })
      }
    )
  )
  if (result.version !== 1 || result.decision !== 'allow')
    throw new Error(
      `Integration gate denied: ${result.code ?? 'invalid_result'}`
    )
  // GitHub checks the source head atomically. External changes to the target
  // after this check remain a documented server-side concurrency limitation.
  run('gh', [
    'pr',
    'merge',
    String(number),
    '--repo',
    repository,
    '--squash',
    '--match-head-commit',
    head
  ])
  const merged = JSON.parse(
    run('gh', [
      'pr',
      'view',
      String(number),
      '--repo',
      repository,
      '--json',
      'state,mergeCommit'
    ])
  )
  if (merged.state !== 'MERGED' || !merged.mergeCommit?.oid)
    throw new Error(
      'Merge outcome is uncertain; inspect the PR before any retry'
    )
  return {
    pr: number,
    sourceHead: head,
    targetBranch: goal.branch,
    mergeCommit: merged.mergeCommit.oid
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const [sourceId, goalId, value, ...extra] = process.argv.slice(2)
    if (extra.length || !/^\d+$/.test(value ?? ''))
      throw new Error(
        'Usage: node scripts/merge-agent-subpr.mjs <source-task> <goal-task> <PR-number>'
      )
    const registry = JSON.parse(
      readFileSync(
        path.join(repoRoot, 'tmp/agent-coordination/state.json'),
        'utf8'
      )
    )
    process.stdout.write(
      `${JSON.stringify(mergeRegisteredSubpr({ registry, sourceId, goalId, number: Number(value) }))}\n`
    )
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}

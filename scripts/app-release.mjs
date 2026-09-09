import assert from 'node:assert/strict'
import { appendFileSync } from 'node:fs'
import { createReleasePlan, git, requireCommit } from './app-release-plan.mjs'
import {
  createApi,
  publishPlan,
  readBaselines
} from './app-release-service.mjs'

assert.equal(
  process.env.GITHUB_EVENT_NAME,
  'workflow_dispatch',
  'Release is manual only'
)
assert.equal(
  process.env.GITHUB_REF,
  'refs/heads/main',
  'Release controller must run on main'
)
assert.equal(
  process.env.GITHUB_REPOSITORY_ID,
  '893098287',
  'Release is restricted to the upstream repository'
)
const sha = requireCommit(process.env.GITHUB_SHA)
assert.equal(
  git(['rev-parse', 'HEAD']),
  sha,
  'Checkout does not match the dispatch commit'
)
const repository = process.env.GITHUB_REPOSITORY
const github = createApi('https://api.github.com', process.env.GH_TOKEN)
const baselines = await readBaselines(github, repository)
const plan = createReleasePlan({
  sha,
  baselines,
  forceApp: process.env.FORCE_APP,
  reason: process.env.RELEASE_REASON
})

if (process.argv[2] === 'plan') {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `plan=${JSON.stringify(plan)}\nhas_changes=${plan.apps.some((app) => app.release)}\n`
  )
  const rows = plan.apps
    .map(
      (app) =>
        `| ${app.id} | ${app.baseline.sha} | ${app.release ? 'Release' : 'Unchanged'} | ${app.inputs.length} |`
    )
    .join('\n')
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `Release candidate: \`${sha}\`\n\n| App | Online SHA | Decision | Changed inputs |\n| --- | --- | --- | --- |\n${rows}\n\nInspect the plan job output before approving app-production. No Vercel deployment has been created.\n`
  )
  console.log(JSON.stringify(plan, null, 2))
} else {
  assert.equal(process.argv[2], 'publish')
  assert.deepEqual(
    plan,
    JSON.parse(process.env.RELEASE_PLAN),
    'Plan changed while waiting for approval; start a new release'
  )
  assert.ok(process.env.VERCEL_TEAM_ID, 'Missing VERCEL_TEAM_ID')
  const vercel = createApi('https://api.vercel.com', process.env.VERCEL_TOKEN, {
    teamId: process.env.VERCEL_TEAM_ID
  })
  await publishPlan({
    plan,
    vercel,
    github,
    repository,
    bypassSecrets: {
      'asyra-sim': process.env.VERCEL_BYPASS_SIM,
      'asyra-design': process.env.VERCEL_BYPASS_DESIGN,
      'asyra-framework': process.env.VERCEL_BYPASS_FRAMEWORK
    },
    runUrl: `https://github.com/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`
  })
}

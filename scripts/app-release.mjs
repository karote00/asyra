import assert from 'node:assert/strict'
import { appendFileSync } from 'node:fs'
import { createReleasePlan, git, requireCommit } from './app-release-plan.mjs'
import {
  createApi,
  publishPlan,
  readBaselines
} from './app-release-service.mjs'

const command = process.argv[2]
assert.ok(['plan', 'publish'].includes(command), 'Unknown release command')
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
assert.match(
  repository ?? '',
  /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
  'Missing or invalid GITHUB_REPOSITORY'
)
let admittedPlan
if (command === 'publish') {
  assert.ok(process.env.VERCEL_TEAM_ID, 'Missing VERCEL_TEAM_ID')
  assert.ok(process.env.VERCEL_TOKEN, 'Missing VERCEL_TOKEN')
  assert.ok(process.env.RELEASE_PLAN, 'Missing RELEASE_PLAN')
  assert.match(
    process.env.GITHUB_RUN_ID ?? '',
    /^\d+$/,
    'Missing or invalid GITHUB_RUN_ID'
  )
  admittedPlan = JSON.parse(process.env.RELEASE_PLAN)
}
const github = createApi('https://api.github.com', process.env.GH_TOKEN)
const baselines = await readBaselines(
  github,
  repository,
  process.env.TARGET_APP
)
const plan = createReleasePlan({
  sha,
  baselines,
  targetApp: process.env.TARGET_APP,
  forceApp: process.env.FORCE_APP,
  reason: process.env.RELEASE_REASON
})

if (command === 'plan') {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `plan=${JSON.stringify(plan)}\nhas_changes=${plan.apps.some((app) => app.release)}\napps=${JSON.stringify(plan.apps.filter((app) => app.release).map((app) => app.id))}\n`
  )
  const rows = plan.apps
    .map(
      (app) =>
        `| ${app.id} | ${app.baseline.sha} | ${app.release ? 'Release' : 'Unchanged'} | ${app.inputs.length} |`
    )
    .join('\n')
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `Release candidate: \`${sha}\`\n\n| App | Online SHA | Decision | Changed inputs |\n| --- | --- | --- | --- |\n${rows}\n\nDeployment proceeds automatically after all verification jobs succeed. No Vercel deployment has been created.\n`
  )
  console.log(JSON.stringify(plan, null, 2))
} else {
  assert.deepEqual(
    plan,
    admittedPlan,
    'Plan changed during verification; start a new release'
  )
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

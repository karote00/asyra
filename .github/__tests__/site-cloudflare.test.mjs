/* global structuredClone */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { URL } from 'node:url'

const require = createRequire(import.meta.url)
const { load } = require('js-yaml')
const source = readFileSync(
  new URL('../workflows/site-cloudflare.yml', import.meta.url),
  'utf8'
)
const workflow = load(source)

test('production admission rejects forks, failed CI, PR runs and non-main branches', () => {
  const condition = workflow.jobs.build.if
  // GitHub uses this same boolean subset; evaluating fixtures proves its gates.
  const evaluate = (github) =>
    Function('github', `return (${condition})`)(github)
  const valid = {
    repository_id: '893098287',
    ref: 'refs/heads/main',
    event_name: 'workflow_run',
    event: {
      workflow_run: {
        conclusion: 'success',
        event: 'push',
        head_branch: 'main',
        head_repository: { id: 893098287 }
      }
    }
  }
  assert.equal(evaluate(valid), true)
  for (const [field, value] of [
    ['conclusion', 'failure'],
    ['conclusion', 'cancelled'],
    ['event', 'pull_request'],
    ['head_branch', 'feature'],
    ['head_repository', { id: 1 }]
  ]) {
    const candidate = structuredClone(valid)
    candidate.event.workflow_run[field] = value
    assert.equal(evaluate(candidate), false, field)
  }
  assert.equal(evaluate({ ...valid, repository_id: '1' }), false)
  assert.equal(evaluate({ ...valid, ref: 'refs/heads/feature' }), false)
  assert.equal(
    evaluate({ ...valid, event_name: 'workflow_dispatch', event: {} }),
    true
  )
})

test('only the verified same-run artifact reaches the credential-bearing job', () => {
  assert.deepEqual(workflow.on.workflow_run, {
    workflows: ['CI'],
    types: ['completed'],
    branches: ['main']
  })
  assert.equal(workflow.jobs.publish.needs, 'build')
  assert.equal(workflow.concurrency['cancel-in-progress'], false)
  assert.doesNotMatch(
    JSON.stringify(workflow.jobs.build),
    /secrets\.|environment/
  )
  const upload = workflow.jobs.build.steps.find((step) =>
    step.uses?.startsWith('actions/upload-artifact@')
  )
  const download = workflow.jobs.publish.steps.find((step) =>
    step.uses?.startsWith('actions/download-artifact@')
  )
  assert.equal(upload.with.name, download.with.name)
  assert.equal(upload.with.path, 'apps/asyra-framework-site/out/')
  assert.equal(download.with['run-id'], undefined)
  assert.equal(workflow.jobs.publish.environment.name, 'website-production')
  const deploy = workflow.jobs.publish.steps.find(
    (step) => step.id === 'deploy'
  )
  assert.equal(deploy.if, "steps.current.outputs.publish == 'true'")
  assert.equal(deploy.with.apiToken, '${{ secrets.CLOUDFLARE_API_TOKEN }}')
  assert.match(deploy.with.command, /--branch=main --commit-hash=/)
  assert.notEqual(deploy.with.workingDirectory, upload.with.path)
  assert.match(source, /\[ "\$current_sha" = "\$SOURCE_SHA" \]/)
  assert.match(
    source,
    /assert.equal\(\(await response.json\(\)\).sourceSha, process.env.SOURCE_SHA\)/
  )
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) {
      if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/)
      if (step.uses?.startsWith('actions/checkout@')) {
        assert.equal(step.with.ref, '${{ env.SOURCE_SHA }}')
        assert.equal(step.with['persist-credentials'], false)
      }
    }
  }
})

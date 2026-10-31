import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { URL } from 'node:url'

const temporaryRoot = path.resolve(import.meta.dirname, '../../tmp')
mkdirSync(temporaryRoot, { recursive: true })
const require = createRequire(import.meta.url)
const { load } = require('js-yaml')
const source = readFileSync(
  new URL('../workflows/site-cloudflare.yml', import.meta.url),
  'utf8'
)
const workflow = load(source)

test('deployment tooling resolves its own npm root instead of the Yarn repository', () => {
  const root = mkdtempSync(path.join(temporaryRoot, 'cloudflare-cli-test-'))
  try {
    writeFileSync(path.join(root, 'package.json'), '{"private":true}')
    mkdirSync(path.join(root, 'bin'))
    writeFileSync(path.join(root, 'bin/gh'), '#!/bin/sh\nprintf test-sha', {
      mode: 0o755
    })
    const prepare = workflow.jobs.publish.steps.find(
      (step) => step.id === 'current'
    )
    execFileSync('bash', ['-c', prepare.run], {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH}`,
        GH_REPO: 'fixture/site',
        SOURCE_SHA: 'test-sha',
        GITHUB_OUTPUT: path.join(root, 'output'),
        GITHUB_STEP_SUMMARY: path.join(root, 'summary')
      }
    })
    const deploy = workflow.jobs.publish.steps.find(
      (step) => step.id === 'deploy'
    )
    const toolRoot = path.join(root, deploy.with.workingDirectory)
    assert.equal(
      execFileSync('npm', ['prefix'], {
        cwd: toolRoot,
        encoding: 'utf8'
      }).trim(),
      toolRoot
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a clean runner builds workspace dependencies before runtime tests', () => {
  const steps = workflow.jobs.build.steps
  const buildIndex = steps.findIndex((step) =>
    step.run?.includes('build:static')
  )
  const testIndex = steps.findIndex((step) => step.run?.includes('test:local'))
  assert.ok(buildIndex >= 0)
  assert.ok(testIndex > buildIndex)
})

test('production admission allows only explicit manual dispatch on upstream main', () => {
  const evaluate = (github) =>
    Function('github', `return (${workflow.jobs.build.if})`)(github)
  const valid = {
    repository_id: '893098287',
    ref: 'refs/heads/main',
    event_name: 'workflow_dispatch',
    event: {}
  }
  assert.equal(evaluate(valid), true)
  assert.equal(evaluate({ ...valid, event_name: 'workflow_dispatch' }), true)
  assert.equal(evaluate({ ...valid, repository_id: '1' }), false)
  assert.equal(evaluate({ ...valid, ref: 'refs/heads/feature' }), false)
  for (const event_name of [
    'push',
    'schedule',
    'pull_request',
    'pull_request_target',
    'workflow_run',
    'repository_dispatch'
  ]) {
    assert.equal(evaluate({ ...valid, event_name }), false)
  }
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch'])
  assert.equal(workflow.env.SOURCE_SHA, '${{ github.sha }}')
})

test('only the verified same-run artifact reaches the credential-bearing job', () => {
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
      if (step.uses) {
        assert.match(step.uses, /@[a-f0-9]{40}$/)
      }
      if (step.uses?.startsWith('actions/checkout@')) {
        assert.equal(step.with.ref, '${{ env.SOURCE_SHA }}')
        assert.equal(step.with['persist-credentials'], false)
      }
    }
  }
})

test('publication waits for its own successful validation and keeps dependency auditing', () => {
  assert.equal(workflow.jobs.publish.needs, 'build')
  assert.equal(workflow.jobs.publish.if, undefined)
  assert.equal(workflow.jobs.build['continue-on-error'], undefined)
  for (const step of workflow.jobs.build.steps) {
    assert.equal(step['continue-on-error'], undefined)
  }
  assert.ok(
    workflow.jobs.build.steps.some((step) =>
      step.run?.includes('yarn security:audit')
    )
  )
})

test('an obsolete source cannot enable upload or create a deployment tool directory', () => {
  const root = mkdtempSync(
    path.join(temporaryRoot, 'cloudflare-obsolete-test-')
  )
  try {
    mkdirSync(path.join(root, 'bin'))
    writeFileSync(path.join(root, 'bin/gh'), '#!/bin/sh\nprintf newer-main', {
      mode: 0o755
    })
    const prepare = workflow.jobs.publish.steps.find(
      (step) => step.id === 'current'
    )
    execFileSync('bash', ['-c', prepare.run], {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH}`,
        GH_REPO: 'fixture/site',
        SOURCE_SHA: 'older-main',
        GITHUB_OUTPUT: path.join(root, 'output'),
        GITHUB_STEP_SUMMARY: path.join(root, 'summary')
      }
    })
    assert.match(
      readFileSync(path.join(root, 'summary'), 'utf8'),
      /Skipped: main advanced/
    )
    assert.throws(() => readFileSync(path.join(root, 'output')), {
      code: 'ENOENT'
    })
    assert.throws(
      () => readFileSync(path.join(root, 'tmp/cloudflare-cli/package.json')),
      { code: 'ENOENT' }
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('release guidance binds the downloaded candidate before Cloudflare mutation', () => {
  const steps = workflow.jobs.publish.steps
  const download = steps.findIndex((step) =>
    step.uses?.startsWith('actions/download-artifact@')
  )
  const prepare = steps.findIndex((step) =>
    step.run?.includes('cloudflare-release-guidance.mjs prepare')
  )
  const admission = steps.findIndex((step) =>
    step.run?.includes('cloudflare-release-guidance.mjs check')
  )
  const deploy = steps.findIndex((step) => step.id === 'deploy')
  assert.ok(
    download >= 0 &&
      prepare > download &&
      admission > prepare &&
      deploy > admission
  )
  assert.equal(steps[admission].if, "steps.current.outputs.publish == 'true'")
  const result = steps.find((step) =>
    step.run?.includes('cloudflare-release-guidance.mjs record')
  )
  assert.ok(result.if.startsWith('always()'))
  assert.equal(result.env.VERIFY_OUTCOME, '${{ steps.verify.outcome }}')
  assert.ok(
    steps.some((step) => step.with?.path?.endsWith('.json.result.json.*.json'))
  )
  assert.ok(
    workflow.jobs.build.steps.every(
      (step) => !JSON.stringify(step).includes('secrets.CLOUDFLARE')
    )
  )
})

test('Cloudflare retries restore a frozen candidate and retain it before mutation', () => {
  const steps = workflow.jobs.publish.steps
  const restore = steps.findIndex((step) =>
    step.run?.includes('cloudflare-release-guidance.mjs restore')
  )
  const prepare = steps.findIndex((step) =>
    step.run?.includes('cloudflare-release-guidance.mjs prepare')
  )
  const checkpoint = steps.findIndex(
    (step) => step.id === 'guidance-checkpoint'
  )
  const mutation = steps.findIndex(
    (step) => step.run?.includes('ensure-project') || step.id === 'deploy'
  )
  assert.ok(
    restore >= 0 &&
      prepare > restore &&
      checkpoint > prepare &&
      mutation > checkpoint
  )
  assert.equal(steps[checkpoint].with.overwrite, undefined)
  assert.equal(steps[checkpoint].with['if-no-files-found'], 'error')
  assert.ok(
    steps[checkpoint].if.includes(
      "steps.guidance-restore.outputs.candidate-retained != 'true'"
    )
  )
  assert.equal(steps[restore].id, 'guidance-restore')
  assert.equal(steps[restore].env.GH_TOKEN, '${{ github.token }}')
  assert.equal(workflow.jobs.publish.permissions.actions, 'read')

  assert.ok(
    steps.some((step) =>
      step.with?.name?.includes('-result-${{ github.run_attempt }}')
    )
  )
})

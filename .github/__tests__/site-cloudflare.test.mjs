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
import { fileURLToPath, URL } from 'node:url'

const require = createRequire(import.meta.url)
const { load } = require('js-yaml')
const source = readFileSync(
  new URL('../workflows/site-cloudflare.yml', import.meta.url),
  'utf8'
)
const workflow = load(source)

test('deployment tooling resolves its own npm root instead of the Yarn repository', () => {
  const root = mkdtempSync(
    fileURLToPath(new URL('./.cli-test-', import.meta.url))
  )
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

test('production admission is independent of repository CI and rejects forks, PRs and non-main branches', () => {
  const evaluate = (github) =>
    Function('github', `return (${workflow.jobs.build.if})`)(github)
  const valid = {
    repository_id: '893098287',
    ref: 'refs/heads/main',
    event_name: 'push',
    event: {}
  }
  assert.equal(evaluate(valid), true)
  assert.equal(evaluate({ ...valid, event_name: 'workflow_dispatch' }), true)
  assert.equal(evaluate({ ...valid, repository_id: '1' }), false)
  assert.equal(evaluate({ ...valid, ref: 'refs/heads/feature' }), false)
  for (const event_name of [
    'pull_request',
    'pull_request_target',
    'workflow_run'
  ])
    assert.equal(evaluate({ ...valid, event_name }), false)
  assert.deepEqual(workflow.on.push, { branches: ['main'] })
  assert.equal(workflow.on.workflow_run, undefined)
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
      if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/)
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
  for (const step of workflow.jobs.build.steps)
    assert.equal(step['continue-on-error'], undefined)
  assert.ok(
    workflow.jobs.build.steps.some((step) =>
      step.run?.includes('yarn security:audit')
    )
  )
})

test('an obsolete source cannot enable upload or create a deployment tool directory', () => {
  const root = mkdtempSync(
    fileURLToPath(new URL('./.obsolete-test-', import.meta.url))
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

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
  new URL('../workflows/app-cloudflare.yml', import.meta.url),
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
  ])
    assert.equal(evaluate({ ...valid, event_name }), false)
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch'])
  assert.equal(workflow.env.SOURCE_SHA, '${{ github.sha }}')
})

test('only tested static artifacts reach the three main-only publication jobs', () => {
  const build = workflow.jobs.build
  const publish = workflow.jobs.publish
  assert.equal(publish.needs, 'build')
  assert.equal(publish.environment.name, 'website-production')
  assert.equal(workflow.concurrency['cancel-in-progress'], false)
  assert.doesNotMatch(JSON.stringify(build), /secrets\.|environment/)
  assert.equal(workflow.env.VITE_COLLABORATION_WS_URL, '')
  const upload = build.steps.find((step) =>
    step.uses?.startsWith('actions/upload-artifact@')
  )
  const download = publish.steps.find((step) =>
    step.uses?.startsWith('actions/download-artifact@')
  )
  assert.equal(upload.with.name, download.with.name)
  assert.equal(upload.with.path, 'tmp/cloudflare-apps/')
  assert.equal(download.with['run-id'], undefined)
  const prepare = build.steps.findIndex((step) =>
    step.run?.includes('app-cloudflare.mjs prepare')
  )
  const browser = build.steps.findIndex((step) =>
    step.run?.includes('production-artifacts.browser.test.mjs')
  )
  assert.ok(prepare > 0 && browser > prepare)
  const deploy = publish.steps.find((step) => step.id === 'deploy')
  assert.equal(deploy.if, "steps.current.outputs.publish == 'true'")
  assert.equal(deploy.with.wranglerVersion, '4.149.0')
  assert.match(deploy.with.command, /--branch=main --commit-hash=/)
  assert.deepEqual(publish.strategy.matrix.include, [
    { app: 'asyra-design', project: 'asyra-design' },
    { app: 'fieldscope', project: 'asyra-fieldscope' },
    { app: 'asyra-sim', project: 'asyra-sim' }
  ])
  assert.ok(
    publish.steps.some((step) =>
      step.run?.includes('app-cloudflare.mjs verify')
    )
  )
  for (const job of Object.values(workflow.jobs))
    for (const step of job.steps) {
      if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/)
      if (step.uses?.startsWith('actions/checkout@')) {
        assert.equal(step.with.ref, '${{ env.SOURCE_SHA }}')
        assert.equal(step.with['persist-credentials'], false)
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

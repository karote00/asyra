/* global URL */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (file) =>
  readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')

test('release controller is manual, upstream-main-only and waits for every verifier', () => {
  const workflow = read('.github/workflows/app-release.yml')
  assert.match(workflow, /on:\n {2}workflow_dispatch:/)
  assert.doesNotMatch(
    workflow,
    /pull_request_target:|workflow_run:|repository_dispatch:|schedule:|secrets: inherit/
  )
  assert.match(workflow, /needs: \[plan, ci, e2e, production-artifacts\]/)
  assert.match(workflow, /environment: app-production/)
  assert.match(workflow, /cancel-in-progress: false/)
  assert.match(workflow, /run_balanced_ai_correctness: true/)
  const publish = workflow.split('\n  publish:\n')[1]
  assert.match(
    publish,
    /github.repository_id == '893098287' && github.ref == 'refs\/heads\/main'/
  )
  assert.match(publish, /ref: \$\{\{ github.sha \}\}/)
  assert.match(publish, /persist-credentials: false/)
  assert.doesNotMatch(
    publish,
    /run:.*(?:yarn|npm|npx|curl)|download-artifact|cache:/
  )
  assert.doesNotMatch(workflow, /run:.*\$\{\{ inputs\./)
  for (const line of workflow.match(/^\s*-?\s*uses: actions\/.+$/gm))
    assert.match(line, /@[a-f0-9]{40}$/)
})
test('all App configs prevent Git auto-deployment before any build is created', () => {
  for (const file of [
    'vercel.json',
    'apps/asyra-sim/vercel.json',
    'apps/asyra-design/vercel.json',
    'apps/asyra-framework-site/vercel.json'
  ]) {
    const config = JSON.parse(read(file))
    assert.equal(config.git.deploymentEnabled, false, file)
    assert.equal(
      config.ignoreCommand,
      undefined,
      'Manual release must not compare only HEAD^'
    )
  }
})
test('production proof is included in PR CI and never starts Vite dev or preview middleware', () => {
  const workflow = read('.github/workflows/production-artifacts.yml')
  assert.match(workflow, /pull_request:/)
  assert.match(workflow, /workflow_call:/)
  assert.match(workflow, /run: yarn react:build/)
  assert.match(workflow, /run: yarn test:production-artifacts/)
  assert.ok(
    workflow.indexOf('run: yarn react:build') <
      workflow.indexOf('run: yarn workspace @asyra/asyra-design typecheck'),
    'Build workspace declarations before checking application consumers'
  )
  assert.doesNotMatch(
    read('scripts/production-artifact-server.mjs'),
    /import .*vite/
  )
})

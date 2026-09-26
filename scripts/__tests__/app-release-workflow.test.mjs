/* global URL */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (file) =>
  readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')

const artifactProfileMarkers = [
  'const analysisProfile = Object.freeze({ defaultBudgetMs: 30_000, analysisBudgetMs: 120_000, publicationAllowanceMs: 5_000, expectedPairs: 46 })',
  "await page .getByText('Advanced settings method, precision and budget', { exact: true }) .click()",
  "const duration = page.getByLabel('Wall-time budget (ms)', { exact: true })",
  'await expect(duration).toHaveValue(String(analysisProfile.defaultBudgetMs))',
  "await expect(duration).toHaveAttribute('max', String(analysisProfile.analysisBudgetMs))",
  'await duration.fill(String(analysisProfile.analysisBudgetMs))',
  "await duration.press('Enter')",
  'await expect(duration).toHaveValue(String(analysisProfile.analysisBudgetMs))',
  ".getByRole('button', { name: 'Run analysis', exact: true })",
  '.click({ timeout: analysisProfile.analysisBudgetMs + analysisProfile.publicationAllowanceMs })',
  "await expect(field('Execution')).toHaveText('completed')",
  "await expect(field('Coverage')).toHaveText('complete')",
  "await expect(field('Pairs with evidence')).toHaveText(`${analysisProfile.expectedPairs}/${analysisProfile.expectedPairs}`)",
  "await expect(field('Finding / unresolved pairs')).toHaveText(/^\\d+ \\/ 0$/)"
]

function assertArtifactProfile(source) {
  const compact = source
    .replace(/\s+/g, ' ')
    .replace(/\( /g, '(')
    .replace(/ \)/g, ')')
  let previous = -1
  for (const marker of artifactProfileMarkers) {
    assert.equal(compact.split(marker).length - 1, 1, marker)
    const position = compact.indexOf(marker)
    assert.ok(position > previous, `Profile order: ${marker}`)
    previous = position
  }
  assert.match(compact, /\{ timeout: 180_000 \}/)
  assert.doesNotMatch(compact, /timeout: 90_000 \}\)/)
}

test('Sim artifact proof declares one public-UI functional budget and requires complete evidence', () => {
  assertArtifactProfile(
    read('scripts/__tests__/production-artifacts.browser.test.mjs')
  )
})

test('artifact profile oracle rejects missing, duplicate and reordered admission or result checks', () => {
  const valid = artifactProfileMarkers.join('\n') + '\n{ timeout: 180_000 }'
  assertArtifactProfile(valid)
  for (const marker of artifactProfileMarkers) {
    assert.throws(() => assertArtifactProfile(valid.replace(marker, '')))
    assert.throws(() =>
      assertArtifactProfile(valid.replace(marker, `${marker}\n${marker}`))
    )
  }
  const reversed =
    [...artifactProfileMarkers].reverse().join('\n') + '\n{ timeout: 180_000 }'
  assert.throws(() => assertArtifactProfile(reversed))
})

test('release controller is manual, upstream-main-only and waits for every verifier', () => {
  const workflow = read('.github/workflows/app-release-pipeline.yml')
  assert.match(workflow, /on:\n {2}workflow_call:/)
  assert.doesNotMatch(
    workflow,
    /pull_request_target:|workflow_run:|repository_dispatch:|schedule:|secrets: inherit/
  )
  assert.match(workflow, /needs: \[plan, production-artifacts\]/)
  assert.match(workflow, /environment: app-production/)
  assert.match(workflow, /cancel-in-progress: false/)
  assert.doesNotMatch(workflow, /main.yml|e2e.yml/)
  assert.doesNotMatch(
    workflow.split('\n  publish:\n')[0],
    /secrets\.|environment:|secrets:/,
    'Planning and artifact verification must not consume production secrets'
  )
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
  assert.match(
    workflow,
    /run: node scripts\/app-release-verification.mjs build/
  )
  assert.match(workflow, /run: node scripts\/app-release-verification.mjs test/)
  assert.ok(workflow.includes('RELEASE_APPS: ${{ inputs.apps }}'))
  assert.doesNotMatch(
    read('scripts/production-artifact-server.mjs'),
    /import .*vite/
  )
})

test('manual entries share one pipeline and pin independent App selection', () => {
  for (const [file, target] of [
    ['app-release.yml', ''],
    ['app-release-framework.yml', 'asyra-framework'],
    ['app-release-design.yml', 'asyra-design'],
    ['app-release-sim.yml', 'asyra-sim']
  ]) {
    const entry = read(`.github/workflows/${file}`)
    assert.match(entry, /on:\n {2}workflow_dispatch:/)
    assert.match(
      entry,
      /uses: \.\/\.github\/workflows\/app-release-pipeline.yml/
    )
    assert.match(
      entry,
      /^ {4}uses: \.\/\.github\/workflows\/app-release-pipeline.yml\n {4}secrets: inherit$/m,
      `${file} must forward secrets into the trusted release pipeline`
    )
    assert.match(entry, /deployments: write/)
    assert.match(
      entry,
      /github.repository_id == '893098287' && github.ref == 'refs\/heads\/main'/
    )
    assert.doesNotMatch(
      entry,
      /concurrency:|environment:|runs-on:|run:|pull_request:|push:/
    )
    if (target) {
      assert.ok(entry.includes(`target_app: '${target}'`))
      assert.ok(
        entry.includes(
          `force_app: \${{ inputs.force_rebuild && '${target}' || '' }}`
        )
      )
      assert.match(entry, /type: boolean/)
    } else {
      assert.doesNotMatch(entry, /target_app:/)
      assert.ok(entry.includes('force_app: ${{ inputs.force_app }}'))
    }
    assert.ok(entry.includes('reason: ${{ inputs.reason }}'))
  }
  const pipeline = read('.github/workflows/app-release-pipeline.yml')
  assert.match(pipeline, /group: manual-app-production/)
  assert.doesNotMatch(pipeline, /workflow_dispatch:/)
  assert.equal(
    pipeline.match(/TARGET_APP: \$\{\{ inputs.target_app \}\}/g)?.length,
    2
  )
  assert.equal(
    pipeline.match(/FORCE_APP: \$\{\{ inputs.force_app \}\}/g)?.length,
    2
  )
  const controller = read('scripts/app-release.mjs')
  assert.match(
    controller,
    /process.env.GITHUB_EVENT_NAME,[\s\n]*'workflow_dispatch'/
  )
  assert.match(controller, /targetApp: process.env.TARGET_APP/)
  assert.match(
    controller,
    /readBaselines\(\s*github,\s*repository,\s*process.env.TARGET_APP\s*\)/
  )
  assert.match(controller, /assert.deepEqual\([\s\n]*plan,[\s\n]*admittedPlan/)
})

// Count calls, not unique filenames: two paths to one reusable workflow run twice.
function workflowCalls(file, ancestors = []) {
  assert.ok(!ancestors.includes(file), `Recursive workflow call: ${file}`)
  return [
    file,
    ...Array.from(
      read(file).matchAll(/^ +uses: \.\/(\.github\/workflows\/[^\s]+)$/gm),
      ([, called]) => workflowCalls(called, [...ancestors, file])
    ).flat()
  ]
}

test('every manual release verifies artifacts once without rerunning PR CI', () => {
  for (const entry of [
    'app-release.yml',
    'app-release-framework.yml',
    'app-release-design.yml',
    'app-release-sim.yml'
  ]) {
    const calls = workflowCalls(`.github/workflows/${entry}`)
    assert.equal(
      calls.filter(
        (file) => file === '.github/workflows/production-artifacts.yml'
      ).length,
      1
    )
    assert.equal(
      calls.filter((file) => file === '.github/workflows/e2e.yml').length,
      0,
      `${entry} must not start competing E2E producers`
    )
    assert.equal(
      calls.filter((file) => file === '.github/workflows/main.yml').length,
      0
    )
  }
})

test('release forwards only planned releases into artifact verification', () => {
  const pipeline = read('.github/workflows/app-release-pipeline.yml')
  assert.ok(pipeline.includes('apps: ${{ steps.plan.outputs.apps }}'))
  assert.ok(pipeline.includes('apps: ${{ needs.plan.outputs.apps }}'))
  assert.match(
    read('scripts/app-release.mjs'),
    /plan.apps.filter\(\(app\) => app.release\).map\(\(app\) => app.id\)/
  )
  assert.match(pipeline, /if: needs.plan.outputs.has_changes == 'true'/)
})

test('manual dispatch is the only human approval while environment secrets and main restriction remain', () => {
  const policy = JSON.parse(read('.github/app-production-environment.json'))
  assert.deepEqual(policy, {
    wait_timer: 0,
    prevent_self_review: false,
    reviewers: [],
    deployment_branch_policy: {
      protected_branches: false,
      custom_branch_policies: true
    }
  })
  const pipeline = read('.github/workflows/app-release-pipeline.yml')
  assert.match(pipeline, /environment: app-production/)
  assert.match(pipeline, /needs: \[plan, production-artifacts\]/)
  assert.match(pipeline, /github.ref == 'refs\/heads\/main'/)
  assert.match(pipeline, /VERCEL_TOKEN: \$\{\{ secrets.VERCEL_TOKEN \}\}/)
  assert.doesNotMatch(
    read('scripts/app-release.mjs'),
    /before approving|waiting for approval/
  )
})

test('production artifact checkout explicitly freezes the caller commit', () => {
  const workflow = read('.github/workflows/production-artifacts.yml')
  assert.match(
    workflow,
    /with:\n +ref: \$\{\{ github.sha \}\}\n +persist-credentials: false/
  )
})

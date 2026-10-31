import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '../..')
const read = (file) => readFileSync(path.join(root, file), 'utf8')

test('maintained deployment sources have no retired provider dependency', () => {
  const files = execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
      '--',
      'apps',
      'create-app',
      'packages',
      'scripts',
      '.github',
      'package.json',
      '.gitignore'
    ],
    { cwd: root, encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean)
  for (const file of new Set(files)) {
    if (/^create-app\/[^/]+\/template\//.test(file)) {
      continue
    }
    if (!existsSync(path.join(root, file))) {
      continue
    }
    if (
      /\/(__tests__|docs)\/|CHANGELOG\.md$|\.lock$|\.(png|jpg|jpeg|webp|svg|woff2?|pdf|zip)$/i.test(
        file
      )
    ) {
      continue
    }
    assert.doesNotMatch(file, /vercel/i)
    if (
      !/\.(?:[cm]?js|tsx?|json|ya?ml|md)$|(?:^|\/)\.env\.example$|\.gitignore$/.test(
        file
      )
    ) {
      continue
    }
    if (file === 'scripts/ci-relationships.json') {
      const policy = JSON.parse(read(file))
      assert.deepEqual(
        policy.repositoryScriptGroups.retiredHostingInputs.patterns,
        ['vercel.json', '.vercelignore']
      )
      delete policy.repositoryScriptGroups.retiredHostingInputs
      assert.doesNotMatch(JSON.stringify(policy), /vercel/i)
    } else {
      assert.doesNotMatch(read(file), /vercel|npx skills (?:add|update)/i, file)
    }
  }
})

test('public entrypoints only advertise supported hosting and Skill installers', () => {
  for (const file of [
    'README.md',
    'docs/public/start/extend-with-ai.md',
    'docs/ai/workflows/app-cloudflare.md'
  ]) {
    assert.doesNotMatch(read(file), /vercel|npx skills (?:add|update)/i, file)
  }
  const manifest = JSON.parse(read('package.json'))
  assert.equal(manifest.homepage, 'https://asyra-framework.pages.dev')
  for (const file of ['app-cloudflare.yml', 'site-cloudflare.yml']) {
    const workflow = read(`.github/workflows/${file}`)
    assert.match(workflow, /workflow_dispatch:/)
    assert.doesNotMatch(
      workflow,
      /^ {2}(push|pull_request|workflow_run|schedule):/m
    )
  }
})

test('removing obsolete root hosting files selects the retirement proof in CI', async () => {
  const { classifyChanges, readWorkspaceManifests } =
    await import('../ci-scope.mjs')
  for (const file of ['vercel.json', '.vercelignore']) {
    assert.equal(existsSync(path.join(root, file)), false, file)
    const result = classifyChanges([file], readWorkspaceManifests(root))
    assert.deepEqual(result.unknownPaths, [], file)
    assert.ok(result.relationshipMap.sharedValidationRequired, file)
    assert.deepEqual(
      result.executionPlan.checks.repositoryScripts.tests,
      ['scripts/__tests__/hosting-retirement.test.mjs'],
      file
    )
  }
})

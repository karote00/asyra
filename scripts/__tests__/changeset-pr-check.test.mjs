import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluateChangesetPrDiff,
  parseNameStatus
} from '../changeset-pr-check.js'

test('accepts a pull request with a pending changeset record', () => {
  const result = evaluateChangesetPrDiff([
    { status: 'A', path: '.changeset/calm-tools-smile.md' },
    { status: 'M', path: 'scripts/example.js' }
  ])

  assert.deepEqual(result, {
    valid: true,
    mode: 'pending-changeset',
    packages: []
  })
})

test('accepts a release pull request with materialized versions and changelogs', () => {
  const result = evaluateChangesetPrDiff([
    { status: 'M', path: 'packages/render/package.json' },
    { status: 'M', path: 'packages/render/CHANGELOG.md' },
    { status: 'D', path: '.changeset/calm-tools-smile.md' }
  ])

  assert.deepEqual(result, {
    valid: true,
    mode: 'materialized-release',
    packages: ['@asyra/render']
  })
})

test('rejects ordinary pull requests without a changeset record', () => {
  const result = evaluateChangesetPrDiff([
    { status: 'M', path: 'scripts/example.js' }
  ])

  assert.equal(result.valid, false)
  assert.equal(result.mode, 'missing')
})

test('rejects package version edits without a generated changelog', () => {
  const result = evaluateChangesetPrDiff([
    { status: 'M', path: 'packages/render/package.json' }
  ])

  assert.equal(result.valid, false)
  assert.equal(result.mode, 'missing')
})

test('deleted changesets do not satisfy the pending-record rule by themselves', () => {
  const result = evaluateChangesetPrDiff([
    { status: 'D', path: '.changeset/calm-tools-smile.md' }
  ])

  assert.equal(result.valid, false)
  assert.equal(result.mode, 'missing')
})

for (const status of ['A', 'M', 'D']) {
  test(`accepts documentation-only ${status} changes without a changeset`, () => {
    assert.deepEqual(
      evaluateChangesetPrDiff([
        { status, path: 'docs/ai/apps/fieldscope/PLANS.md' },
        { status, path: 'apps/fieldscope/README.md' }
      ]),
      { valid: true, mode: 'documentation-only', packages: [] }
    )
  })
}

test('accepts documentation moves but checks both paths of code moves', () => {
  assert.equal(
    evaluateChangesetPrDiff(
      parseNameStatus('R100\tdocs/plan.md\tdocs/completed/plan.md\n')
    ).valid,
    true
  )
  for (const output of [
    'R100\tscripts/tool.js\tdocs/tool.md\n',
    'R100\tdocs/tool.md\tscripts/tool.js\n'
  ]) {
    assert.equal(evaluateChangesetPrDiff(parseNameStatus(output)).valid, false)
  }
})

test('does not exempt empty diffs, changeset metadata, executable docs, or mixed changes', () => {
  assert.equal(evaluateChangesetPrDiff([]).valid, false)
  for (const path of [
    'scripts/tool.js',
    'docs/example.js',
    'docs/page.mdx',
    'package.json',
    '.github/workflows/ci.yml',
    '.changeset/README.md',
    '.changeset/deleted-record.md'
  ]) {
    for (const status of ['M', 'D']) {
      if (path === '.changeset/deleted-record.md' && status === 'M') continue
      assert.equal(
        evaluateChangesetPrDiff([
          { status: 'M', path: 'docs/README.md' },
          { status, path }
        ]).valid,
        false,
        `${status} ${path}`
      )
    }
  }
})

test('moving a changeset out of its directory does not count as a pending record', () => {
  assert.equal(
    evaluateChangesetPrDiff(
      parseNameStatus(
        'R100\t.changeset/old.md\tdocs/old.md\nM\tscripts/tool.js\n'
      )
    ).valid,
    false
  )
})

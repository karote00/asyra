import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import {
  CI_E2E_GROUPS,
  collectBrowserSpecFiles,
  mergePlaywrightReports
} from '../e2e-ci-groups.mjs'

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)

test('bounded CI groups cover each configured Sim browser spec exactly once', () => {
  const selected = CI_E2E_GROUPS.flatMap((group) => group.files)

  assert.ok(CI_E2E_GROUPS.length > 1)
  assert.ok(CI_E2E_GROUPS.every((group) => group.files.length > 0))
  assert.equal(new Set(selected).size, selected.length)
  assert.deepEqual(selected.toSorted(), collectBrowserSpecFiles(appRoot))
  assert.ok(
    selected.every((file) => fs.statSync(path.join(appRoot, file)).isFile())
  )
})

test('merged reports preserve every outcome and bind each run command to identity', () => {
  const merged = mergePlaywrightReports(
    [
      {
        group: 'first',
        command: ['yarn', 'playwright', 'test', 'one.spec.ts'],
        exitCode: 0,
        startedAt: '2026-09-28T00:00:00.000Z',
        finishedAt: '2026-09-28T00:00:08.000Z',
        outputDirectory: 'test-results/ci/first',
        reportPath: '.ci-workspace-results/first.playwright.json',
        report: {
          suites: [
            {
              title: 'one.spec.ts',
              specs: [{ tests: [{ results: [{ status: 'passed' }] }] }]
            }
          ],
          errors: [],
          stats: {
            expected: 1,
            skipped: 0,
            unexpected: 0,
            flaky: 0,
            duration: 8000
          }
        }
      },
      {
        group: 'second',
        command: ['yarn', 'playwright', 'test', 'two.spec.ts'],
        exitCode: 1,
        startedAt: '2026-09-28T00:00:08.000Z',
        finishedAt: '2026-09-28T00:00:18.000Z',
        outputDirectory: 'test-results/ci/second',
        reportPath: '.ci-workspace-results/second.playwright.json',
        report: {
          suites: [
            {
              title: 'two.spec.ts',
              specs: [{ tests: [{ results: [{ status: 'failed' }] }] }]
            }
          ],
          errors: [{ message: 'assertion failed' }],
          stats: {
            expected: 0,
            skipped: 0,
            unexpected: 1,
            flaky: 0,
            duration: 10000
          }
        }
      }
    ],
    {
      repository: 'example-org/example-repository',
      base: 'a'.repeat(40),
      head: 'b'.repeat(40),
      run: 'local-run-1',
      attempt: '3'
    }
  )

  assert.equal(merged.suites.length, 2)
  assert.equal(merged.errors.length, 1)
  assert.deepEqual(merged.ci.identity, {
    repository: 'example-org/example-repository',
    base: 'a'.repeat(40),
    head: 'b'.repeat(40),
    run: 'local-run-1',
    attempt: '3'
  })
  assert.equal(merged.ci.totals.testCount, 2)
  assert.equal(merged.ci.totals.passedCount, 1)
  assert.equal(merged.ci.totals.failedCount, 2)
  assert.equal(merged.ci.totals.skippedCount, 0)
  assert.equal(merged.ci.groups[1].exitCode, 1)
  assert.equal(merged.ci.groups[1].command.at(-1), 'two.spec.ts')
  assert.equal(merged.ci.groups[1].outputDirectory, 'test-results/ci/second')
})

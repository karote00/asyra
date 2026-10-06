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

test('FieldScope CI groups cover every browser spec exactly once', () => {
  const assigned = CI_E2E_GROUPS.flatMap((group) => group.files)

  assert.ok(CI_E2E_GROUPS.length > 1)
  assert.ok(CI_E2E_GROUPS.every((group) => group.files.length > 0))
  assert.equal(new Set(assigned).size, assigned.length)
  assert.deepEqual(assigned.toSorted(), collectBrowserSpecFiles(appRoot))
  assert.ok(
    assigned.every((file) => fs.statSync(path.join(appRoot, file)).isFile())
  )
})

test('a browser spec with a custom time limit contains one Playwright case', () => {
  for (const file of collectBrowserSpecFiles(appRoot)) {
    const source = fs.readFileSync(path.join(appRoot, file), 'utf8')
    if (!/test\.setTimeout\s*\(/u.test(source)) continue
    const cases = source.match(/^\s*test\s*\(/gmu) ?? []

    assert.equal(
      cases.length,
      1,
      `${file} has a custom timeout and must contain one test case`
    )
  }
})

test('CI E2E runner does not override each case timeout globally', () => {
  const runner = fs.readFileSync(
    path.join(appRoot, 'scripts/run-e2e-ci.mjs'),
    'utf8'
  )

  assert.doesNotMatch(runner, /--timeout(?:=|\s)/u)
})

test('software-rendered browser cases budget pixels and keep desktop CSS layout', () => {
  const config = fs.readFileSync(
    path.join(appRoot, 'playwright.config.ts'),
    'utf8'
  )

  assert.match(
    config,
    /deviceScaleFactor:\s*usesCpuSoftwareRenderer\s*\?\s*0\.25\s*:\s*1/
  )
  assert.match(config, /viewport:\s*\{\s*width:\s*1440,\s*height:\s*1100\s*\}/)
})

test('merged CI report retains every group suite, failure and timing result', () => {
  const merged = mergePlaywrightReports([
    {
      group: 'first',
      exitCode: 0,
      report: {
        suites: [{ title: 'first.spec.ts', specs: [] }],
        errors: [],
        stats: {
          expected: 2,
          skipped: 1,
          unexpected: 0,
          flaky: 0,
          duration: 8000
        }
      }
    },
    {
      group: 'second',
      exitCode: 1,
      report: {
        suites: [{ title: 'second.spec.ts', specs: [] }],
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
  ])

  assert.equal(merged.suites.length, 2)
  assert.equal(merged.errors.length, 1)
  assert.deepEqual(merged.stats, {
    startTime: null,
    duration: 18000,
    expected: 2,
    skipped: 1,
    unexpected: 1,
    flaky: 0
  })
  assert.deepEqual(merged.ci.groups, [
    { group: 'first', exitCode: 0 },
    { group: 'second', exitCode: 1 }
  ])
})

test('selected browser specs stay in their owned group and reject missing paths', async () => {
  const { selectBrowserGroups } = await import('../e2e-ci-groups.mjs')
  const selected = selectBrowserGroups(['e2e/camera-flight.spec.ts'])
  assert.deepEqual(selected, [
    { name: 'camera-interaction', files: ['e2e/camera-flight.spec.ts'] }
  ])
  assert.throws(() => selectBrowserGroups(['e2e/missing.spec.ts']), /Unknown/)
  assert.throws(
    () =>
      selectBrowserGroups([
        'e2e/camera-flight.spec.ts',
        'e2e/camera-flight.spec.ts'
      ]),
    /Duplicate/
  )
})

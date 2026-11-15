import process from 'node:process'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'

const root = resolve(import.meta.dirname, '../../../..')
const app = resolve(root, 'apps/asyra-design')

const runNative = (executable) => {
  const env = { ...process.env }

  delete env.NATIVE_DELIVERY_CODEX
  if (executable !== undefined) {
    env.NATIVE_DELIVERY_CODEX = executable
  }

  return spawnSync(
    process.execPath,
    [
      resolve(root, 'node_modules/vitest/vitest.mjs'),
      'run',
      '--environment',
      'node',
      'server/__tests__/native-provider-handoff.integration.test.ts',
      '-t',
      'observes exact instructions.*undefined',
      '--reporter=json'
    ],
    {
      cwd: app,
      env,
      encoding: 'utf8',
      timeout: 90000,
      maxBuffer: 4 * 1024 * 1024
    }
  )
}

test('unconfigured native cases are reported skipped by the real test entry', () => {
  const result = runNative(undefined)

  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
  const report = JSON.parse(result.stdout)
  const cases = report.testResults.flatMap((file) => file.assertionResults)
  const selected = cases.find(
    (item) =>
      item.title ===
      'observes exact instructions and executable restrictions at the native model boundary - undefined'
  )

  assert.ok(selected, 'native case must remain visible in the report')
  assert.equal(selected.status, 'skipped')
  assert.equal(report.numPassedTests, 0)
})

for (const [name, executable, message] of [
  [
    'missing',
    resolve(root, 'tmp/no-such-native-executable'),
    'Native test executable is unavailable'
  ],
  ['wrong version', process.execPath, 'Native test executable version mismatch']
]) {
  test(`explicit ${name} native executable fails admission at the real test entry`, () => {
    const result = runNative(executable)

    assert.ifError(result.error)
    assert.notEqual(result.status, 0)
    assert.match(result.stdout + result.stderr, new RegExp(message))
  })
}

test('complete verification rejects missing native evidence before launching gates', () => {
  const env = { ...process.env }

  delete env.NATIVE_DELIVERY_CODEX
  const result = spawnSync(
    process.execPath,
    ['scripts/verify-conversation.mjs'],
    {
      cwd: app,
      env,
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 1024 * 1024
    }
  )

  assert.ifError(result.error)
  assert.notEqual(result.status, 0)
  assert.match(
    result.stderr,
    /Complete conversation verification requires NATIVE_DELIVERY_CODEX/
  )
  assert.doesNotMatch(result.stdout, /Verifying /)
})

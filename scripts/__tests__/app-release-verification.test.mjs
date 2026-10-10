/* global URL */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runVerification } from '../app-release-verification.mjs'

const identities = ['asyra-sim', 'asyra-design', 'asyra-framework']
const tasks = [
  '@asyra/asyra-sim#react:build',
  '@asyra/asyra-design#react:build',
  '@asyra/asyra-framework-site#build:asyra-framework-site'
]
const browserSource = readFileSync(
  new URL('./production-artifacts.browser.test.mjs', import.meta.url),
  'utf8'
)
const titles = [...browserSource.matchAll(/test\(\s*'([^']+)'/g)].map(
  (match) => match[1]
)

test('production artifact browser tests use runner Chrome in every environment', () => {
  assert.match(browserSource, /channel:\s*'chrome'/)
  assert.doesNotMatch(browserSource, /process\.env\.CI\s*\?/)
})

function capture(mode, apps) {
  const calls = []
  runVerification(mode, apps, (command, args) => {
    calls.push([command, ...args])
    return { status: 0 }
  })
  return calls
}

for (let mask = 1; mask < 8; mask++) {
  const selected = identities.filter((_, index) => mask & (1 << index))
  test(`verification scopes build and browser work to ${selected.join(', ')}`, () => {
    const input = JSON.stringify(selected)
    const builds = capture('build', input)
    assert.deepEqual(builds[0], ['yarn', 'gen:turbo:check'])
    assert.deepEqual(builds[1], [
      'yarn',
      'turbo',
      'run',
      ...tasks.filter((_, index) => mask & (1 << index)),
      '--concurrency=2'
    ])
    assert.equal(builds.length, selected.includes('asyra-design') ? 3 : 2)
    if (selected.includes('asyra-design'))
      assert.deepEqual(builds[2], [
        'yarn',
        'workspace',
        '@asyra/asyra-design',
        'typecheck'
      ])
    const checks = capture('test', input)
    assert.equal(checks.length, 1)
    assert.equal(checks[0][0], process.execPath)
    const pattern = new RegExp(
      checks[0]
        .find((arg) => arg.startsWith('--test-name-pattern='))
        .split('=')[1]
    )
    const owners = {
      Sim: 'asyra-sim',
      Design: 'asyra-design',
      Website: 'asyra-framework',
      FieldScope: 'fieldscope'
    }
    assert.equal(titles.length, Object.keys(owners).length)
    for (const title of titles) {
      const owner = owners[title.split(' ')[0]]
      assert.ok(
        owner,
        'Every browser case must have an explicit selection owner'
      )
      assert.equal(pattern.test(title), selected.includes(owner), title)
    }
  })
}

test('PR defaults retain all three artifact proofs', () => {
  for (const mode of ['build', 'test']) {
    assert.deepEqual(
      capture(mode, ''),
      capture(mode, JSON.stringify(identities))
    )
    assert.deepEqual(
      capture(mode, undefined),
      capture(mode, JSON.stringify(identities))
    )
  }
})

test('invalid selections and modes fail before any work starts', () => {
  let calls = 0
  const execute = () => {
    calls++
    return { status: 0 }
  }
  for (const input of [
    '[]',
    'null',
    '{}',
    '"asyra-framework"',
    'broken',
    '["unknown"]',
    '["asyra-sim","asyra-sim"]'
  ]) {
    assert.throws(() => runVerification('build', input, execute))
  }
  assert.throws(() => runVerification('deploy', '', execute))
  assert.equal(calls, 0)
})

test('a failed build stops typecheck and any later command', () => {
  let calls = 0
  assert.throws(
    () =>
      runVerification('build', '["asyra-design"]', () => ({
        status: ++calls === 2 ? 1 : 0
      })),
    /Verification failed/
  )
  assert.equal(calls, 2)
  assert.throws(
    () =>
      runVerification('test', '', () => ({ status: null, signal: 'SIGTERM' })),
    /Verification failed/
  )
})

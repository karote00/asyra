import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { URL } from 'node:url'
import test from 'node:test'

test('CI builds checkout-local dependencies before invoking the repo and portable supervisor oracles', () => {
  const workflow = readFileSync(
    new URL('../../../../.github/workflows/main.yml', import.meta.url),
    'utf8'
  )
  const markers = [
    'Record original test job deadline',
    'Initialize test execution envelope',
    'run: yarn react:build',
    'run: yarn test:ci'
  ]
  function checkOrdering(source) {
    for (const marker of markers) {
      assert.equal(source.split(marker).length - 1, 1, marker)
      assert.ok(source.indexOf(marker) >= 0, marker)
    }
    for (let index = 1; index < markers.length; index++)
      assert.ok(
        source.indexOf(markers[index - 1]) < source.indexOf(markers[index])
      )
  }
  const validateJob = workflow.match(
    /\n {2}validate:\n([\s\S]*?)(?=\n {2}[a-zA-Z][\w-]*:\n|$)/
  )?.[1]
  assert.ok(validateJob)
  checkOrdering(validateJob)
  for (const marker of markers) {
    assert.throws(
      () => checkOrdering(validateJob.replace(marker, 'removed')),
      marker
    )
    assert.throws(() => checkOrdering(validateJob + '\n' + marker), marker)
  }
  const manifest = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  )
  assert.equal(manifest.scripts['test:local'], manifest.scripts['test:ci'])
  function checkEntry(script) {
    for (const entry of [
      'scripts/__tests__/supervise-tests.test.mjs',
      'scripts/__tests__/supervise-tests-ci.test.mjs',
      'python3 scripts/supervise-tests.py'
    ])
      assert.equal(script.split(entry).length - 1, 1, entry)
    assert.doesNotMatch(script, /install|ln -s/)
  }
  checkEntry(manifest.scripts['test:ci'])
  assert.throws(() =>
    checkEntry(
      manifest.scripts['test:ci'] + ' && python3 scripts/supervise-tests.py --'
    )
  )
})

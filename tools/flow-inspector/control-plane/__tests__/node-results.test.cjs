/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const path = require('node:path')
const { normalizeNodeEvents } = require('../node-results.cjs')
const root = path.resolve(__dirname, '../../../..')
const file = path.join(__dirname, 'fixtures/runner-events.mjs')
const reporter = path.join(__dirname, '../node-test-reporter.mjs')

function execute(scenario) {
  const environment = { ...process.env, FLOW_TEST_SCENARIO: scenario }

  delete environment.NODE_TEST_CONTEXT
  const result = spawnSync(
    process.execPath,
    ['--test', '--test-reporter', reporter, file],
    {
      cwd: root,
      encoding: 'utf8',
      env: environment,
      timeout: 10000
    }
  )

  assert.equal(result.error, undefined)
  const events = result.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(JSON.parse)

  return {
    result,
    events,
    observed: normalizeNodeEvents(events, { files: [file], cwd: root })
  }
}

test('real Node events preserve distinct nested case identities without reading TAP totals', () => {
  const { result, observed } = execute('passed')

  assert.equal(result.status, 0)
  assert.deepEqual(observed.errors, [])
  assert.equal(observed.report.success, true)
  assert.deepEqual(
    observed.report.testResults[0].assertionResults.map(
      (item) => item.fullName
    ),
    ['first parent same child name', 'second parent same child name']
  )
})

for (const scenario of ['failed', 'skipped', 'empty', 'interrupted']) {
  test(
    'real ' + scenario + ' execution cannot produce complete passing evidence',
    () => {
      const { observed } = execute(scenario)
      const assertions = observed.report.testResults.flatMap(
        (suite) => suite.assertionResults
      )

      if (scenario === 'failed') {
        assert.ok(assertions.some((item) => item.status === 'failed'))
      }

      if (scenario === 'skipped') {
        assert.ok(assertions.some((item) => item.status === 'skipped'))
      }

      if (scenario === 'empty') {
        assert.match(observed.errors.join('\n'), /Missing or unexecuted/)
      }

      if (scenario === 'interrupted') {
        assert.match(
          observed.errors.join('\n'),
          /execution failed|summary|Unexecuted/
        )
      }
    }
  )
}

test('missing and duplicated final summaries are rejected independently of passing cases', () => {
  const { events } = execute('passed')
  const summary = events.find(
    (event) => event.type === 'test:summary' && !event.data.file
  )

  assert.ok(summary)
  for (const damaged of [
    events.filter((event) => event !== summary),
    [...events, summary]
  ]) {
    assert.match(
      normalizeNodeEvents(damaged, { files: [file], cwd: root }).errors.join(
        '\n'
      ),
      /summary/i
    )
  }
})

test('contradictory counts and missing selected files cannot be hidden by success', () => {
  const { events } = execute('passed')
  const damaged = structuredClone(events)
  const summary = damaged.find(
    (event) => event.type === 'test:summary' && !event.data.file
  )

  summary.data.counts.failed = 1
  assert.match(
    normalizeNodeEvents(damaged, { files: [file], cwd: root }).errors.join(
      '\n'
    ),
    /count|summary/i
  )
  assert.match(
    normalizeNodeEvents(events, {
      files: [file, path.join(root, 'missing.test.mjs')],
      cwd: root
    }).errors.join('\n'),
    /missing|unexecuted/i
  )
})

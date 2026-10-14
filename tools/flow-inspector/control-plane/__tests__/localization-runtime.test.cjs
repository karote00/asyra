/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const test = require('node:test')
const { main } = require('../cli.cjs')
const { localizationFixture } = require('./localization-runtime-fixture.cjs')
test(
  'ordinary App and Factory tests locate real source faults and recover without rewriting assertions',
  { timeout: 180000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    t.diagnostic('Retained evidence: ' + fixture.directory)
    for (const kind of ['app', 'factory']) {
      const baseline = await fixture.run(kind)
      assert.equal(baseline.result.code, 0, baseline.result.output)
      fixture.mutate(kind)
      const fault = await fixture.run(kind)
      assert.equal(fault.result.code, 1, fault.result.output)
      const failed = fault.record.cases.filter(
        (item) => item.status === 'failed'
      )
      assert.ok(failed.length > 0, fault.result.output)
      assert.ok(
        failed.every((item) => item.resolution === 'mapped'),
        JSON.stringify(fault.record.issues)
      )
      assert.ok(failed.every((item) => item.failures.length > 0))
      if (kind === 'app') {
        assert.equal(failed.length, 2)
        assert.ok(
          failed.every(
            (item) => item.locations[0].stepId === 'select-history-replay'
          )
        )
      } else
        assert.ok(
          new Set(failed.map((item) => item.locations[0].stepId)).size >= 2
        )
      const output = []
      assert.equal(
        await main(['test-results', fault.record.id], {
          repositoryRoot: fixture.repository,
          write: (line) => output.push(line)
        }),
        0
      )
      assert.deepEqual(JSON.parse(output.join('')), fault.record)
      assert.notEqual(baseline.record.source.digest, fault.record.source.digest)
      fixture.restore()
      const recovered = await fixture.run(kind)
      assert.equal(recovered.result.code, 0, recovered.result.output)
      assert.equal(
        recovered.record.source.digest,
        baseline.record.source.digest
      )
      assert.equal(
        fixture.reader
          .get(fault.record.id)
          .cases.filter((item) => item.status === 'failed').length,
        failed.length
      )
    }
  }
)

test('in-flight mapped-source edits invalidate locations and later reporter cycles retain separate identities', async () => {
  const {
    beginObservation,
    completeObservation
  } = require('../localization.cjs')
  const { default: Reporter } = await import('../vitest-reporter.mjs')
  const fixture = localizationFixture()
  const context = beginObservation(fixture.repository)
  fixture.mutate('app')
  const contract = context.contracts.find(
    (item) => item.targetId === 'history-shortcut'
  )
  const input = {
    success: false,
    testResults: [
      {
        name: contract.testFile,
        status: 'failed',
        assertionResults: [
          {
            fullName: contract.cases[0].testName,
            status: 'failed',
            failureMessages: ['original assertion']
          }
        ]
      }
    ]
  }
  const result = completeObservation(fixture.repository, context, input)
  assert.equal(result.cases[0].resolution, 'stale')
  assert.deepEqual(result.cases[0].locations, [])
  fixture.restore()
  const reporter = new Reporter()
  reporter.root = fixture.repository
  reporter.options = {}
  reporter.context = context
  reporter.completed = true
  reporter.onTestRunStart()
  assert.notEqual(reporter.context.id, context.id)
  assert.equal(fixture.reader.get(context.id).phase, 'completed')
  assert.equal(fixture.reader.get(reporter.context.id).phase, 'running')
})

test(
  'real filtered rerun preserves the other failed shortcut until it executes again',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    fixture.mutate('app')
    const failed = await fixture.run('app')
    assert.equal(failed.result.code, 1)
    fixture.restore()
    const filtered = await fixture.run('app', [
      '-t',
      'keeps the exclusive Undo'
    ])
    assert.equal(filtered.result.code, 0)
    assert.deepEqual(
      filtered.record.cases.map((item) => item.status),
      ['passed', 'skipped']
    )
    const unresolved = fixture.reader
      .list()
      .currentCases.filter((item) => item.status === 'failed')
    assert.equal(unresolved.length, 1)
    assert.equal(unresolved[0].runId, failed.record.id)
    assert.match(unresolved[0].testName, /awaits Redo/)
    await fixture.run('app')
    assert.equal(
      fixture.reader
        .list()
        .currentCases.filter((item) => item.status === 'failed').length,
      0
    )
  }
)

test(
  'real suite hook failures retain the original error stack without inventing a node',
  { timeout: 60000 },
  async () => {
    const fixture = localizationFixture()
    fixture.addHookAssertionFailure()
    const result = await fixture.run('app')
    assert.equal(result.result.code, 1)
    assert.ok(
      result.record.issues.some(
        (issue) =>
          issue.includes('localization setup failure') &&
          /feature\.test\.ts:\d+:\d+/.test(issue)
      ),
      JSON.stringify(result.record.issues)
    )
    assert.equal(result.record.executionFailureDetails?.length, 1)
    const detail = result.record.executionFailureDetails[0]
    assert.match(detail.expected, /9999/)
    assert.match(detail.actual, /57/)
    assert.match(detail.diff, /9999/)
    assert.match(detail.file, /feature\.test\.ts$/)
    assert.equal(detail.projectName, '')
    assert.deepEqual(fixture.reader.get(result.record.id), result.record)
    assert.equal(
      result.record.cases.filter((item) => item.status === 'failed').length,
      0
    )
  }
)

test('missing mapped implementation input cannot yield a precise mapped location', () => {
  const fs = require('node:fs'),
    path = require('node:path')
  const {
    beginObservation,
    completeObservation
  } = require('../localization.cjs')
  const fixture = localizationFixture()
  fs.unlinkSync(
    path.join(
      fixture.repository,
      'apps/asyra-design/src/features/undo-redo/index.ts'
    )
  )
  const context = beginObservation(fixture.repository)
  const contract = context.contracts.find(
    (item) => item.targetId === 'history-shortcut'
  )
  const result = completeObservation(fixture.repository, context, {
    success: false,
    testResults: [
      {
        name: contract.testFile,
        assertionResults: [
          {
            fullName: contract.cases[0].testName,
            status: 'failed',
            failureMessages: ['missing import']
          }
        ]
      }
    ]
  })
  assert.equal(result.cases[0].resolution, 'stale')
  assert.match(result.issues.join(' '), /missing/i)
})

test(
  'real duplicate failures retain runner differences and every soft assertion',
  { timeout: 60000 },
  async () => {
    const fixture = localizationFixture()
    fixture.addAssertionFailures()
    const fault = await fixture.run('app')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failures = fault.record.cases.filter(
      (item) => item.status === 'failed'
    )
    assert.equal(failures.length, 2)
    assert.equal(failures[0].testName, failures[1].testName)
    for (const [index, item] of failures.entries()) {
      assert.equal(item.resolution, 'ambiguous')
      assert.equal(item.failureDetails?.length, 4)
      const [array, boolean, missing, empty] = item.failureDetails
      assert.match(array.message, /Array\(100\)/)
      assert.ok(array.expected.includes(String([9999, 8888][index])))
      assert.ok(array.diff.includes(String([9999, 8888][index])))
      assert.ok(array.actual.includes('57'))
      assert.equal(boolean.actual, 'false')
      assert.equal(boolean.expected, 'true')
      assert.equal(missing.actual, 'undefined')
      assert.equal(missing.expected, 'null')
      assert.equal(empty.actual, '')
      assert.match(empty.expected, /<img/)
      assert.ok(
        item.failureDetails.every((error) =>
          error.stack.includes('feature.test.ts')
        )
      )
    }
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
    const output = []
    assert.equal(
      await main(['test-results', fault.record.id], {
        repositoryRoot: fixture.repository,
        write: (line) => output.push(line)
      }),
      0
    )
    assert.deepEqual(JSON.parse(output.join('')).cases, fault.record.cases)
  }
)

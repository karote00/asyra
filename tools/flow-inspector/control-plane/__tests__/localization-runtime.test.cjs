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

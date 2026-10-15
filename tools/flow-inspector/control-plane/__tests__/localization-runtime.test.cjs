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

test(
  'ordinary History replay faults locate registered cases while retaining all selected failures and other targets',
  { timeout: 120000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    const baseline = await fixture.run('history')
    assert.equal(baseline.result.code, 0, baseline.result.output)
    assert.equal(baseline.record.cases.length, 14)
    assert.equal(
      baseline.record.cases.filter((item) => item.resolution === 'mapped')
        .length,
      14
    )
    fixture.mutate('app')
    const appFault = await fixture.run('app')
    assert.equal(appFault.result.code, 1, appFault.result.output)
    fixture.restore()
    for (const scenario of ['replay-order', 'inverse-regression']) {
      fixture.mutateReplay(scenario)
      const fault = await fixture.run('history')
      assert.equal(fault.result.code, 1, fault.result.output)
      const failures = fault.record.cases.filter(
        (item) => item.status === 'failed'
      )
      const mapped = failures.filter((item) => item.resolution === 'mapped')
      assert.equal(mapped.length, scenario === 'replay-order' ? 8 : 9)
      assert.ok(failures.every((item) => item.resolution === 'mapped'))
      for (const item of mapped) {
        assert.equal(item.locations[0].targetId, 'history-replay')
        assert.ok(
          [
            'replay-history-action',
            'record-history-action',
            'rollback-history-action'
          ].includes(item.locations[0].stepId)
        )
        assert.equal(item.locations[0].ownerPackage, '@asyra/factory')
        assert.ok(
          item.failureDetails.some(
            (error) => error.diff && error.expected && error.actual
          )
        )
      }
      const output = []
      assert.equal(
        await main(['test-results', fault.record.id], {
          repositoryRoot: fixture.repository,
          write: (line) => output.push(line)
        }),
        0
      )
      assert.deepEqual(JSON.parse(output.join('')), fault.record)
      fixture.restore()
      // A filtered success retires only its exact identity, not skipped failures.
      const partial = await fixture.run('history', [
        '--testNamePattern=records one owner batch'
      ])
      assert.equal(partial.result.code, 0, partial.result.output)
      assert.ok(
        fixture.reader
          .list()
          .currentCases.some(
            (item) =>
              item.status === 'failed' &&
              item.locations.some(
                (location) => location.caseId === 'replay.staged-values'
              )
          )
      )
      const recovered = await fixture.run('history')
      assert.equal(recovered.result.code, 0, recovered.result.output)
      assert.equal(
        recovered.record.source.digest,
        baseline.record.source.digest
      )
      assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
      const current = fixture.reader
        .list()
        .currentCases.filter((item) => item.status === 'failed')
      assert.equal(current.length, 2)
      assert.ok(
        current.every(
          (item) => item.locations[0].targetId === 'history-shortcut'
        )
      )
    }
    t.diagnostic('History replay evidence: ' + fixture.directory)
  }
)

test(
  'ordinary Design execution failures locate distinct nodes and preserve recovery history',
  { timeout: 120000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    const baseline = await fixture.run('execution')
    assert.equal(baseline.result.code, 0, baseline.result.output)
    assert.equal(baseline.record.cases.length, 23)
    assert.ok(
      baseline.record.cases.every((item) => item.resolution === 'mapped'),
      JSON.stringify(baseline.record.issues)
    )
    assert.deepEqual(
      [
        ...new Set(
          baseline.record.cases.map((item) => item.locations[0].stepId)
        )
      ].sort(),
      ['apply', 'compose', 'inspect', 'observe', 'prepare', 'request', 'settle']
    )
    const scenarios = [
      'omit-registered-tools',
      'misclassify-combined-tool',
      'ignore-canonical-evidence'
    ]
    const steps = ['compose', 'apply', 'inspect']
    for (const [index, scenario] of scenarios.entries()) {
      fixture.mutateExecution(scenario)
      const fault = await fixture.run('execution')
      assert.equal(fault.result.code, 1, fault.result.output)
      const failed = fault.record.cases.filter(
        (item) => item.status === 'failed'
      )
      assert.deepEqual(
        failed.map((item) => item.locations[0].stepId).sort(),
        steps.slice(0, index + 1).sort()
      )
      for (const item of failed) {
        assert.equal(item.resolution, 'mapped')
        assert.equal(item.locations[0].targetId, 'ai-execution-flow')
        assert.ok(item.locations[0].implementationPaths.length)
        assert.ok(
          item.failureDetails.some((error) => error.message && error.stack)
        )
      }
      const output = []
      assert.equal(
        await main(['test-results', fault.record.id], {
          repositoryRoot: fixture.repository,
          write: (line) => output.push(line)
        }),
        0
      )
      assert.deepEqual(JSON.parse(output.join('')), fault.record)
    }
    const failedRecord = fixture.reader.get(fixture.reader.list().runs[0].id)
    fixture.restore()
    const recovery = await fixture.run('execution')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(recovery.record.source.digest, baseline.record.source.digest)
    assert.ok(
      fixture.reader
        .list()
        .currentCases.every((item) => item.status === 'passed')
    )
    assert.deepEqual(fixture.reader.get(failedRecord.id), failedRecord)
    t.diagnostic('Execution evidence: ' + fixture.directory)
  }
)

test(
  'Design execution uses the captured runtime entry and retains setup failure without a guessed node',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    fixture.failExecutionSourceEntry()
    const fault = await fixture.run('execution')
    assert.equal(fault.result.code, 1, fault.result.output)
    assert.match(fault.record.issues.join(' '), /Captured runtime entry failed/)
    assert.equal(
      fault.record.cases.filter((item) => item.status === 'failed').length,
      0
    )
    assert.equal(fault.record.cases.flatMap((item) => item.locations).length, 0)
    fixture.restore()
    const recovery = await fixture.run('execution')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(
      recovery.record.cases.filter((item) => item.resolution === 'mapped')
        .length,
      23
    )
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
  }
)

test(
  'ordinary Render viewport fault locates its owner and preserves recovery history',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    const baseline = await fixture.run('viewport')
    assert.equal(baseline.result.code, 0, baseline.result.output)
    assert.equal(baseline.record.cases.length, 6)
    assert.ok(
      baseline.record.cases.every((item) => item.resolution === 'mapped'),
      JSON.stringify(baseline.record.issues)
    )
    assert.deepEqual(baseline.record.issues, [])
    fixture.mutateViewport()
    const fault = await fixture.run('viewport')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failed = fault.record.cases.filter((item) => item.status === 'failed')
    assert.equal(failed.length, 1)
    const location = failed[0].locations[0]
    assert.equal(location.targetId, 'render-engine-boundary')
    assert.equal(location.stepId, 'orchestrate-render-adapter')
    assert.equal(location.caseId, 'navigation.camera')
    assert.equal(
      location.specPath,
      'docs/ai/framework/plans/completed/render-engine-boundary-plan.md'
    )
    assert.ok(location.specRefs.includes('#state-to-render-surface'))
    assert.deepEqual(location.implementationPaths, [
      'packages/render/src/layers/viewport/viewport-layer.ts',
      'packages/render/src/types/render-object.ts'
    ])
    assert.ok(
      failed[0].failureDetails.some(
        (error) =>
          error.message && error.stack && error.expected && error.actual
      )
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
    fixture.restore()
    const recovery = await fixture.run('viewport')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(recovery.record.source.digest, baseline.record.source.digest)
    assert.ok(
      fixture.reader
        .list()
        .currentCases.every((item) => item.status === 'passed')
    )
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
    t.diagnostic('Viewport evidence: ' + fixture.directory)
  }
)

test(
  'Render viewport uses captured source and retains setup failure without a guessed node',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    fixture.failViewportSourceEntry()
    const fault = await fixture.run('viewport')
    assert.equal(fault.result.code, 1, fault.result.output)
    assert.match(
      fault.record.issues.join(' '),
      /Captured render engine entry failed/
    )
    assert.equal(fault.record.cases.flatMap((item) => item.locations).length, 0)
    fixture.restore()
    const recovery = await fixture.run('viewport')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(
      recovery.record.cases.filter((item) => item.resolution === 'mapped')
        .length,
      6
    )
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
  }
)

test(
  'ordinary reusable composition failures retain independent owners and combined recovery evidence',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    const baseline = await fixture.run('recipe')
    assert.equal(baseline.result.code, 0, baseline.result.output)
    assert.equal(baseline.record.cases.length, 4)
    assert.deepEqual(baseline.record.issues, [])
    assert.ok(
      baseline.record.cases.every((item) => item.resolution === 'mapped')
    )
    const scenarios = [
      'allow-control-plane',
      'copy-registration-receipt',
      'omit-invocation-calls',
      'omit-reload-name'
    ]
    const steps = ['admit', 'register', 'invoke', 'persist']
    for (const [index, scenario] of scenarios.entries()) {
      fixture.restore()
      fixture.mutateRecipe(scenario)
      const fault = await fixture.run('recipe')
      assert.equal(fault.result.code, 1, fault.result.output)
      const failed = fault.record.cases.filter(
        (item) => item.status === 'failed'
      )
      assert.deepEqual(
        failed.map((item) => item.locations[0]?.stepId),
        [steps[index]]
      )
      const location = failed[0].locations[0]
      assert.equal(location.targetId, 'reusable-tool-composition')
      assert.equal(location.caseId, steps[index] + '.handoff')
      assert.equal(
        location.specPath,
        'packages/ai-agent-runtime/TOOL_SPECIFICATION.md'
      )
      assert.ok(location.implementationPaths.length)
      assert.ok(
        failed[0].failureDetails.some((error) => error.message && error.stack)
      )
    }
    fixture.restore()
    for (const scenario of scenarios) fixture.mutateRecipe(scenario)
    const combined = await fixture.run('recipe')
    assert.equal(combined.result.code, 1, combined.result.output)
    assert.deepEqual(
      combined.record.cases
        .filter((item) => item.status === 'failed')
        .map((item) => item.locations[0].stepId)
        .sort(),
      [...steps].sort()
    )
    const output = []
    assert.equal(
      await main(['test-results', combined.record.id], {
        repositoryRoot: fixture.repository,
        write: (line) => output.push(line)
      }),
      0
    )
    assert.deepEqual(JSON.parse(output.join('')), combined.record)
    fixture.restore()
    const recovery = await fixture.run('recipe')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(recovery.record.source.digest, baseline.record.source.digest)
    assert.ok(
      fixture.reader
        .list()
        .currentCases.every((item) => item.status === 'passed')
    )
    assert.deepEqual(fixture.reader.get(combined.record.id), combined.record)
    t.diagnostic('Recipe evidence: ' + fixture.directory)
  }
)

test(
  'reusable composition source failures remain execution evidence without a guessed node',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    fixture.failRecipeSourceEntry()
    const fault = await fixture.run('recipe')
    assert.equal(fault.result.code, 1, fault.result.output)
    assert.match(
      fault.record.issues.join(' '),
      /Captured recipe admission failed/
    )
    assert.equal(fault.record.cases.flatMap((item) => item.locations).length, 0)
    fixture.restore()
    const recovery = await fixture.run('recipe')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(
      recovery.record.cases.filter((item) => item.resolution === 'mapped')
        .length,
      4
    )
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
  }
)

test(
  'ordinary Pixi failures remain distinct from adapter failures on the same Inspector through partial recovery',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    const baseline = await fixture.run('pixi')
    assert.equal(baseline.result.code, 0, baseline.result.output)
    assert.equal(baseline.record.cases.length, 27)
    assert.deepEqual(baseline.record.issues, [])
    assert.ok(
      baseline.record.cases.every((item) => item.resolution === 'mapped')
    )
    fixture.mutatePixi()
    const fault = await fixture.run('pixi')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failed = fault.record.cases.filter((item) => item.status === 'failed')
    assert.equal(failed.length, 1)
    const location = failed[0].locations[0]
    assert.equal(location.stepId, 'execute-render-engine')
    assert.equal(location.targetId, 'render-engine-boundary')
    assert.equal(location.caseId, 'navigation.camera')
    assert.equal(
      location.specPath,
      'docs/ai/framework/plans/completed/render-engine-boundary-plan.md'
    )
    assert.deepEqual(location.implementationPaths, [
      'packages/render-engine-pixi/src/pixi-render-engine.ts'
    ])
    assert.ok(
      failed[0].failureDetails.some((error) => error.message && error.stack)
    )
    fixture.mutateViewport()
    const adapter = await fixture.run('viewport')
    assert.equal(adapter.result.code, 1, adapter.result.output)
    const currentFailures = () =>
      fixture.reader
        .list()
        .currentCases.filter((item) => item.status === 'failed')
    assert.deepEqual(
      currentFailures()
        .map((item) => item.locations[0].stepId)
        .sort(),
      ['execute-render-engine', 'orchestrate-render-adapter']
    )
    assert.equal(new Set(currentFailures().map((item) => item.file)).size, 2)
    fixture.restorePixi()
    const partial = await fixture.run('pixi')
    assert.equal(partial.result.code, 0, partial.result.output)
    assert.deepEqual(
      currentFailures().map((item) => item.locations[0].stepId),
      ['orchestrate-render-adapter']
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
    fixture.restore()
    const recovery = await fixture.run('viewport')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(recovery.record.source.digest, baseline.record.source.digest)
    assert.equal(currentFailures().length, 0)
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
    assert.deepEqual(fixture.reader.get(adapter.record.id), adapter.record)
    t.diagnostic('Pixi evidence: ' + fixture.directory)
  }
)

test(
  'Pixi uses the captured public engine source and retains load errors without guessed nodes',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    fixture.failViewportSourceEntry()
    const fault = await fixture.run('pixi')
    assert.equal(fault.result.code, 1, fault.result.output)
    assert.match(
      fault.record.issues.join(' '),
      /Captured render engine entry failed/
    )
    assert.equal(fault.record.cases.flatMap((item) => item.locations).length, 0)
    fixture.restore()
    const recovery = await fixture.run('pixi')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(
      recovery.record.cases.filter((item) => item.resolution === 'mapped')
        .length,
      27
    )
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
  }
)

test(
  'ordinary Preset vector faults retain their node through a passing sibling rerun and full recovery',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    const baseline = await fixture.run('vector')
    assert.equal(baseline.result.code, 0, baseline.result.output)
    assert.equal(baseline.record.cases.length, 11)
    assert.deepEqual(baseline.record.issues, [])
    assert.ok(
      baseline.record.cases.every((item) => item.resolution === 'mapped')
    )
    fixture.mutateVector()
    const fault = await fixture.run('vector')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failed = fault.record.cases.filter((item) => item.status === 'failed')
    assert.equal(failed.length, 1)
    const location = failed[0].locations[0]
    assert.equal(location.targetId, 'render-delta-update')
    assert.equal(location.stepId, 'evaluate-vector-material')
    assert.equal(location.caseId, 'navigation.native')
    assert.equal(location.specPath, 'docs/ai/framework/packages/preset.md')
    assert.ok(location.specRefs.includes(location.specPath))
    assert.deepEqual(location.implementationPaths, [
      'packages/preset/src/components/vector.ts',
      'packages/preset/src/components/fills.ts',
      'packages/preset/src/components/vector-compound-fill.ts'
    ])
    assert.ok(
      failed[0].failureDetails.some(
        (error) =>
          error.message && error.stack && error.expected && error.actual
      )
    )
    const sibling = await fixture.run('vector', [
      '--testNamePattern',
      'keeps radial gradients'
    ])
    assert.equal(sibling.result.code, 0, sibling.result.output)
    assert.equal(
      sibling.record.cases.filter((item) => item.status === 'passed').length,
      1
    )
    const currentFailures = () =>
      fixture.reader
        .list()
        .currentCases.filter((item) => item.status === 'failed')
    assert.deepEqual(
      currentFailures().map((item) => item.id),
      [failed[0].id]
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
    fixture.restore()
    const recovery = await fixture.run('vector')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(recovery.record.source.digest, baseline.record.source.digest)
    assert.equal(currentFailures().length, 0)
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
    t.diagnostic('Vector evidence: ' + fixture.directory)
  }
)

test(
  'Preset vector execution uses public Core source and retains setup failure without a guessed node',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    fixture.failVectorSourceEntry()
    const fault = await fixture.run('vector')
    assert.equal(fault.result.code, 1, fault.result.output)
    assert.match(fault.record.issues.join(' '), /Captured Core source failed/)
    assert.equal(fault.record.cases.flatMap((item) => item.locations).length, 0)
    fixture.restore()
    const recovery = await fixture.run('vector')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(
      recovery.record.cases.filter((item) => item.resolution === 'mapped')
        .length,
      11
    )
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
  }
)

test(
  'ordinary compound coverage retains three failures and isolates material recovery at the shared node',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    const baseline = await fixture.run('coverage')
    assert.equal(baseline.result.code, 0, baseline.result.output)
    assert.equal(baseline.record.cases.length, 16)
    assert.deepEqual(baseline.record.issues, [])
    assert.ok(
      baseline.record.cases.every((item) => item.resolution === 'mapped')
    )
    fixture.mutateVector()
    const material = await fixture.run('vector')
    assert.equal(material.result.code, 1, material.result.output)
    const materialFailures = material.record.cases.filter(
      (item) => item.status === 'failed'
    )
    assert.equal(materialFailures.length, 1)
    fixture.restore()
    fixture.mutateCoverage()
    const fault = await fixture.run('coverage')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failures = fault.record.cases.filter(
      (item) => item.status === 'failed'
    )
    assert.deepEqual(failures.map((item) => item.locations[0]?.caseId).sort(), [
      'coverage.cross.evenodd',
      'coverage.holes.evenodd',
      'coverage.overlap'
    ])
    for (const item of failures) {
      assert.equal(item.locations[0].targetId, 'render-delta-update')
      assert.equal(item.locations[0].stepId, 'evaluate-vector-material')
      assert.equal(
        item.locations[0].specPath,
        'docs/ai/framework/packages/preset.md'
      )
      assert.deepEqual(item.locations[0].implementationPaths, [
        'packages/preset/src/components/vector-compound-fill.ts'
      ])
      assert.ok(
        item.failureDetails.some(
          (error) =>
            error.message && error.stack && error.expected && error.actual
        )
      )
    }
    const currentFailures = () =>
      fixture.reader
        .list()
        .currentCases.filter((item) => item.status === 'failed')
    const ids = (items) => items.map((item) => item.id).sort()
    assert.deepEqual(
      ids(currentFailures()),
      ids([...materialFailures, ...failures])
    )
    const partial = await fixture.run('coverage', [
      '--testNamePattern',
      'preserves declared nonzero coverage'
    ])
    assert.equal(partial.result.code, 0, partial.result.output)
    assert.equal(
      partial.record.cases.filter((item) => item.status === 'passed').length,
      1
    )
    assert.deepEqual(
      ids(currentFailures()),
      ids([...materialFailures, ...failures])
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
    fixture.restore()
    const recovery = await fixture.run('coverage')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(recovery.record.source.digest, baseline.record.source.digest)
    assert.deepEqual(ids(currentFailures()), ids(materialFailures))
    const complete = await fixture.run('vector')
    assert.equal(complete.result.code, 0, complete.result.output)
    assert.equal(currentFailures().length, 0)
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
    assert.deepEqual(fixture.reader.get(material.record.id), material.record)
    t.diagnostic('Coverage evidence: ' + fixture.directory)
  }
)

test(
  'Compound coverage execution uses public Core source and retains setup failure without a guessed node',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    t.after(() => fixture.restore())
    fixture.failVectorSourceEntry()
    const fault = await fixture.run('coverage')
    assert.equal(fault.result.code, 1, fault.result.output)
    assert.match(fault.record.issues.join(' '), /Captured Core source failed/)
    assert.equal(fault.record.cases.flatMap((item) => item.locations).length, 0)
    fixture.restore()
    const recovery = await fixture.run('coverage')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    assert.equal(
      recovery.record.cases.filter((item) => item.resolution === 'mapped')
        .length,
      16
    )
    assert.deepEqual(fixture.reader.get(fault.record.id), fault.record)
  }
)

/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const path = require('node:path')
const test = require('node:test')
const { assessEvidence, validateStoredEvidence } = require('../evidence.cjs')
const { loadContract } = require('../contracts.cjs')
const contract = loadContract(path.resolve(__dirname, '../../../..'))
const snapshot = {
  sourceRoot: '/captured',
  digest: '1'.repeat(64),
  configurationDigest: '2'.repeat(64),
  contractDigest: contract.digest,
  mappingVersion: contract.mappingVersion,
  architectureVersion: contract.architectureVersion
}
const flowIds = contract.flows.map((flow) => flow.id)
function result() {
  return {
    code: 0,
    reason: null,
    identity: {
      sourceDigest: snapshot.digest,
      configurationDigest: snapshot.configurationDigest,
      contractDigest: contract.digest,
      mappingVersion: contract.mappingVersion,
      architectureVersion: contract.architectureVersion,
      scenario: 'baseline',
      flowIds
    },
    environment: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      vitest: '3.2.6'
    },
    version: '3.2.6',
    reportDigest: '3'.repeat(64),
    report: {
      success: true,
      numTotalTests: 6,
      numFailedTests: 0,
      numPassedTests: 6,
      testResults: [
        {
          name: path.join(snapshot.sourceRoot, contract.testFile),
          status: 'passed',
          assertionResults: contract.cases.map((item) => ({
            fullName: item.testName,
            status: 'passed',
            failureMessages: []
          }))
        }
      ]
    }
  }
}
const assess = (runner) => assessEvidence(contract, snapshot, runner, flowIds)
test('accepts only the complete six-case baseline', () => {
  const evidence = assess(result())
  assert.equal(evidence.status, 'passed')
  assert.equal(evidence.passedCount, 6)
  assert.deepEqual(evidence.issues, [])
})
for (const [name, corrupt] of [
  [
    'missing execution identity',
    (runner) => {
      delete runner.identity
    }
  ],
  [
    'wrong mapping version',
    (runner) => {
      runner.identity.mappingVersion = 'old'
    }
  ],
  [
    'wrong source fingerprint',
    (runner) => {
      runner.identity.sourceDigest = '0'.repeat(64)
    }
  ],
  [
    'wrong runner configuration',
    (runner) => {
      runner.identity.configurationDigest = '0'.repeat(64)
    }
  ],
  [
    'missing runner environment',
    (runner) => {
      delete runner.environment
    }
  ],
  [
    'wrong runner version',
    (runner) => {
      runner.environment.vitest = 'other'
    }
  ],
  [
    'missing report fingerprint',
    (runner) => {
      delete runner.reportDigest
    }
  ],
  [
    'wrong selected flow identity',
    (runner) => {
      runner.identity.flowIds = []
    }
  ],
  [
    'missing report',
    (runner) => {
      runner.report = null
    }
  ],
  [
    'zero matches',
    (runner) => {
      runner.report.testResults[0].assertionResults = []
    }
  ],
  [
    'missing case',
    (runner) => {
      runner.report.testResults[0].assertionResults.pop()
    }
  ],
  [
    'duplicate case',
    (runner) => {
      runner.report.testResults[0].assertionResults.push(
        runner.report.testResults[0].assertionResults[0]
      )
    }
  ],
  [
    'skipped case',
    (runner) => {
      runner.report.testResults[0].assertionResults[0].status = 'pending'
    }
  ],
  [
    'wrong source',
    (runner) => {
      runner.report.testResults[0].name = '/other/test.ts'
    }
  ],
  [
    'unknown case',
    (runner) => {
      runner.report.testResults[0].assertionResults[0].fullName = 'made-up pass'
    }
  ],
  [
    'summary mismatch',
    (runner) => {
      runner.report.numPassedTests = 99
    }
  ],
  [
    'suite failure',
    (runner) => {
      runner.report.testResults[0].status = 'failed'
    }
  ],
  [
    'runtime error',
    (runner) => {
      runner.report.numRuntimeErrorTestSuites = 1
    }
  ],
  [
    'failed exit',
    (runner) => {
      runner.code = 1
    }
  ],
  [
    'cancellation',
    (runner) => {
      runner.reason = 'cancelled'
    }
  ],
  [
    'malformed assertion',
    (runner) => {
      runner.report.testResults[0].assertionResults[0] = null
    }
  ]
])
  test('rejects ' + name, () => {
    const runner = result()
    corrupt(runner)
    assert.notEqual(assess(runner).status, 'passed')
  })
test('a zero-exit wrapper cannot conceal real assertion failures', () => {
  const runner = result()
  runner.report.testResults[0].assertionResults[0].status = 'failed'
  runner.report.numFailedTests = 1
  runner.report.numPassedTests = 5
  assert.equal(assess(runner).status, 'failed')
  assert.ok(
    assess(runner).issues.includes('Runner exit masked failed assertions')
  )
})
test('attributes failed obligations while preserving the passing other flow', () => {
  const runner = result()
  runner.code = 1
  runner.report.success = false
  runner.report.numFailedTests = 1
  runner.report.numPassedTests = 5
  runner.report.testResults[0].status = 'failed'
  runner.report.testResults[0].assertionResults[4].status = 'failed'
  const evidence = assess(runner)
  assert.equal(evidence.flows[0].status, 'passed')
  assert.equal(evidence.flows[1].status, 'failed')
  assert.equal(evidence.cases[4].stepId, 'finalize-transaction-state')
})
test('rejects mismatched contract provenance and empty selection', () => {
  assert.notEqual(
    assessEvidence(
      contract,
      { ...snapshot, contractDigest: 'old' },
      result(),
      flowIds
    ).status,
    'passed'
  )
  assert.notEqual(
    assessEvidence(contract, snapshot, result(), []).status,
    'passed'
  )
})

test('durable evidence admission checks the required inventory before consumers can read it', () => {
  const record = {
    phase: 'completed',
    snapshot,
    flowIds,
    evidence: assess(result())
  }
  assert.doesNotThrow(() => validateStoredEvidence(contract, record))
  const truncated = structuredClone(record)
  truncated.evidence.cases.pop()
  truncated.evidence.expectedCount--
  truncated.evidence.passedCount--
  assert.throws(
    () => validateStoredEvidence(contract, truncated),
    /Stored evidence inventory/
  )
})

for (const key of ['mappingVersion', 'architectureVersion'])
  test('durable evidence rejects a mismatched ' + key, () => {
    const record = {
      format: 2,
      phase: 'completed',
      snapshot: { ...snapshot, [key]: '0'.repeat(64) },
      flowIds,
      evidence: assess(result())
    }
    assert.throws(
      () => validateStoredEvidence(contract, record),
      /Stored evidence provenance/
    )
  })

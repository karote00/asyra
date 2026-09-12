/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const { randomUUID, createHash } = require('node:crypto')
const sourceOwner = require('../snapshot.cjs')
const { runVerification } = require('../runner.cjs')
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

async function realRuntimeProof(t) {
  const root = path.resolve(__dirname, '../../../..')
  const id = randomUUID()
  const directory = path.join(root, 'tmp/flow-inspector/evidence-runtime', id)
  fs.mkdirSync(directory, { recursive: true })
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const captured = sourceOwner.captureSource(root, directory, contract)
  const runner = await runVerification({
    repositoryRoot: root,
    runDirectory: directory,
    snapshot: captured,
    contract,
    scenario: 'baseline',
    flowIds,
    timeoutMs: 10000
  })
  assert.equal(runner.code, 0)
  const admission = Object.freeze({
    attemptId: id,
    repository: root,
    head: captured.head,
    sourceDigest: captured.digest,
    runtimeSource: sourceOwner.validateRuntimeSource(captured)
  })
  return { id, captured, runner, admission }
}

test('runtime evidence binds real captured source through the runner and durable admission without promoting historical proof', async (t) => {
  const { id, captured, runner, admission } = await realRuntimeProof(t)
  const evidence = assessEvidence(contract, captured, runner, flowIds)
  assert.equal(evidence.status, 'passed')
  assert.equal(evidence.runtimeSourceDigest, captured.runtimeSource.digest)
  const validate = t.mock.method(sourceOwner, 'validateRuntimeSource')
  const reused = assessEvidence(
    contract,
    captured,
    runner,
    flowIds,
    'baseline',
    admission
  )
  assert.deepEqual(reused, evidence)
  const retained = structuredClone(captured)
  delete retained.files
  delete retained.sourceRoot
  const record = {
    id,
    format: 2,
    phase: 'completed',
    scenario: 'baseline',
    snapshot: retained,
    runner,
    flowIds,
    evidence
  }
  assert.doesNotThrow(() => validateStoredEvidence(contract, record, admission))
  assert.equal(
    validate.mock.callCount(),
    0,
    'admitted service evidence does not repeat source validation'
  )
  assert.throws(
    () => validateStoredEvidence(contract, record),
    /runtime|manifest/i
  )
  const legacySnapshot = { ...captured }
  delete legacySnapshot.runtimeSource
  const legacyRunner = structuredClone(runner)
  delete legacyRunner.identity.runtimeSourceDigest
  const legacy = assessEvidence(contract, legacySnapshot, legacyRunner, flowIds)
  assert.equal(legacy.status, 'passed')
  assert.equal(Object.hasOwn(legacy, 'runtimeSourceDigest'), false)
})

test('runtime evidence refuses malformed, missing and source-substituted provenance while retaining actual assertion failures', async (t) => {
  const { captured, runner, admission } = await realRuntimeProof(t)
  for (const [name, corrupt] of [
    [
      'present null source',
      (s) => {
        s.runtimeSource = null
      }
    ],
    [
      'present undefined source',
      (s) => {
        s.runtimeSource = undefined
      }
    ],
    [
      'unsupported source format',
      (s) => {
        s.runtimeSource.format = 2
      }
    ],
    [
      'truncated source inventory',
      (s) => {
        s.runtimeSource.files.pop()
        s.runtimeSource.digest = createHash('sha256')
          .update(JSON.stringify(s.runtimeSource.files))
          .digest('hex')
      }
    ],
    [
      'missing runner runtime identity',
      (_, r) => {
        delete r.identity.runtimeSourceDigest
      }
    ],
    [
      'wrong runner runtime identity',
      (_, r) => {
        r.identity.runtimeSourceDigest = '0'.repeat(64)
      }
    ],
    [
      'missing runner lock identity',
      (_, r) => {
        delete r.identity.lockfileDigest
      }
    ],
    [
      'wrong runner lock identity',
      (_, r) => {
        r.identity.lockfileDigest = '0'.repeat(64)
      }
    ],
    [
      'removed source but retained new runner identity',
      (s) => {
        delete s.runtimeSource
      }
    ]
  ]) {
    const source = structuredClone(captured)
    const result = structuredClone(runner)
    corrupt(source, result)
    const evidence = assessEvidence(contract, source, result, flowIds)
    assert.notEqual(evidence.status, 'passed', name)
    assert.ok(
      evidence.issues.some((issue) => /runtime/i.test(issue)),
      name
    )
  }
  for (const key of ['digest', 'head']) {
    const replaced = { ...captured, [key]: '0'.repeat(64) }
    assert.notEqual(
      assessEvidence(contract, replaced, runner, flowIds, 'baseline', admission)
        .status,
      'passed',
      key
    )
  }
  const result = structuredClone(runner)
  delete result.identity.runtimeSourceDigest
  result.code = 1
  result.report.success = false
  result.report.numPassedTests--
  result.report.numFailedTests++
  result.report.testResults[0].status = 'failed'
  result.report.testResults[0].assertionResults[0].status = 'failed'
  const evidence = assessEvidence(contract, captured, result, flowIds)
  assert.equal(evidence.status, 'failed')
  assert.equal(evidence.cases[0].status, 'failed')
  assert.equal(evidence.runtimeSourceDigest, captured.runtimeSource.digest)
  assert.ok(evidence.issues.some((issue) => /runtime/i.test(issue)))
})

test('durable runtime evidence refuses forged pass identities and preserves legitimate unavailable evidence', async (t) => {
  const { id, captured, runner, admission } = await realRuntimeProof(t)
  const evidence = assessEvidence(contract, captured, runner, flowIds)
  const record = {
    id,
    format: 2,
    phase: 'completed',
    scenario: 'baseline',
    snapshot: captured,
    runner,
    flowIds,
    evidence
  }
  const forged = structuredClone(record)
  forged.evidence.runtimeSourceDigest = '0'.repeat(64)
  assert.throws(
    () => validateStoredEvidence(contract, forged, admission),
    /runtime/i
  )
  for (const key of ['runtimeSourceDigest', 'lockfileDigest', 'sourceDigest']) {
    const altered = structuredClone(record)
    altered.runner.identity[key] = '0'.repeat(64)
    assert.throws(
      () => validateStoredEvidence(contract, altered, admission),
      /runtime/i,
      key
    )
  }
  const unavailableRunner = structuredClone(runner)
  delete unavailableRunner.identity.runtimeSourceDigest
  const unavailable = {
    ...record,
    runner: unavailableRunner,
    evidence: assessEvidence(contract, captured, unavailableRunner, flowIds)
  }
  assert.equal(unavailable.evidence.status, 'unknown')
  assert.doesNotThrow(() =>
    validateStoredEvidence(contract, unavailable, admission)
  )
  assert.throws(
    () =>
      validateStoredEvidence(contract, record, {
        ...admission,
        attemptId: randomUUID()
      }),
    /runtime/i
  )
  assert.throws(
    () =>
      validateStoredEvidence(contract, record, {
        ...admission,
        sourceDigest: '0'.repeat(64)
      }),
    /runtime/i
  )
})

test('derived evidence requires direct trusted source admission even without runtime identity', async (t) => {
  const { id, captured, runner, admission } = await realRuntimeProof(t)
  const cases = [
    ['null execution descriptor', { ...captured, executionSource: null }],
    [
      'unsupported execution descriptor',
      { ...captured, executionSource: { format: 99 } }
    ]
  ]
  for (const [name, input] of cases) {
    assert.notEqual(
      assessEvidence(contract, input, runner, flowIds).status,
      'passed',
      name
    )
    assert.notEqual(
      assessEvidence(contract, input, runner, flowIds, 'baseline', admission)
        .status,
      'passed',
      name + ' service tuple'
    )
    const evidence = assessEvidence(contract, captured, runner, flowIds)
    assert.throws(
      () =>
        validateStoredEvidence(
          contract,
          {
            id,
            format: 2,
            phase: 'completed',
            scenario: 'baseline',
            snapshot: input,
            runner,
            flowIds,
            evidence
          },
          admission
        ),
      /derived|execution/i,
      name + ' retained'
    )
  }
  const legacy = { ...captured, executionSource: null }
  delete legacy.runtimeSource
  const oldRunner = structuredClone(runner)
  delete oldRunner.identity.runtimeSourceDigest
  assert.notEqual(
    assessEvidence(contract, legacy, oldRunner, flowIds).status,
    'passed'
  )
  const missing = { ...captured, executionSource: { format: 1 } }
  delete missing.files
  assert.notEqual(
    assessEvidence(contract, missing, runner, flowIds, 'baseline', undefined, {
      sourceRoot: captured.sourceRoot
    }).status,
    'passed'
  )
})

test(
  'direct derived evidence uses real generated configuration and one combined source admission',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async (t) => {
    const root = path.resolve(__dirname, '../../../..')
    const directory = path.join(
      root,
      'tmp/flow-inspector/evidence-derived',
      randomUUID()
    )
    fs.mkdirSync(directory, { recursive: true })
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const captured = sourceOwner.captureSource(root, directory, contract)
    const generated = sourceOwner.createDerivedExecution({
      sourceRoot: captured.sourceRoot,
      verificationSource: captured.verificationSource
    })
    for (const file of generated.files) {
      const destination = path.join(captured.sourceRoot, file.path)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.writeFileSync(destination, file.content, { flag: 'wx', mode: 0o444 })
    }
    const files = [...captured.files, ...generated.executionSource.files].sort(
      (a, b) => a.path.localeCompare(b.path)
    )
    const derived = {
      ...captured,
      files,
      digest: createHash('sha256').update(JSON.stringify(files)).digest('hex'),
      configurationDigest: generated.executionSource.digest,
      executionSource: generated.executionSource
    }
    const { containedProcess } = require('../agent-verifier.cjs')
    const runner = await runVerification({
      repositoryRoot: root,
      runDirectory: directory,
      snapshot: derived,
      contract: {
        ...contract,
        configFile: generated.executionSource.roles.configuration
      },
      scenario: 'baseline',
      flowIds,
      timeoutMs: 15000,
      processRunner: (options) =>
        containedProcess(
          {
            ...options,
            args: [
              path.join(
                captured.sourceRoot,
                generated.executionSource.roles.bootstrap
              ),
              String(process.pid),
              ...options.args.slice(3),
              '--configLoader',
              'native'
            ],
            cwd: captured.sourceRoot
          },
          {
            repositoryRoot: root,
            readRoots: [captured.sourceRoot],
            writeRoot: directory
          }
        )
    })
    assert.equal(runner.code, 0, runner.output)
    const crypto = require('node:crypto'),
      originalHash = crypto.createHash
    const hash = t.mock.method(crypto, 'createHash', (...args) =>
      originalHash(...args)
    )
    const modulePath = require.resolve('../snapshot.cjs'),
      saved = require.cache[modulePath]
    Reflect.deleteProperty(require.cache, modulePath)
    const counted = require('../snapshot.cjs')
    require.cache[modulePath] = saved
    const combined = t.mock.method(
      sourceOwner,
      'validateSourceSnapshot',
      (...args) => counted.validateSourceSnapshot(...args)
    )
    const runtime = t.mock.method(sourceOwner, 'validateRuntimeSource')
    const reads = t.mock.method(fs, 'readFileSync')
    const evidence = assessEvidence(
      contract,
      derived,
      runner,
      flowIds,
      'baseline',
      undefined,
      { sourceRoot: captured.sourceRoot }
    )
    assert.equal(evidence.status, 'passed', JSON.stringify(evidence.issues))
    assert.equal(combined.mock.callCount(), 1)
    assert.equal(runtime.mock.callCount(), 0)
    assert.equal(hash.mock.callCount(), 6)
    assert.equal(reads.mock.callCount(), 0)
    assert.equal(
      runner.identity.configurationDigest,
      generated.executionSource.digest
    )
    assert.notEqual(
      assessEvidence(contract, derived, runner, flowIds).status,
      'passed',
      'snapshot sourceRoot cannot replace trusted context'
    )
    assert.notEqual(
      assessEvidence(
        contract,
        derived,
        runner,
        flowIds,
        'baseline',
        undefined,
        { sourceRoot: path.join(directory, 'other/source') }
      ).status,
      'passed'
    )
    const invalid = structuredClone(derived)
    invalid.executionSource.files[0].digest = '0'.repeat(64)
    assert.notEqual(
      assessEvidence(
        contract,
        invalid,
        runner,
        flowIds,
        'baseline',
        undefined,
        { sourceRoot: captured.sourceRoot }
      ).status,
      'passed'
    )
    const record = {
      format: 2,
      phase: 'completed',
      scenario: 'baseline',
      snapshot: derived,
      runner,
      flowIds,
      evidence
    }
    assert.throws(
      () => validateStoredEvidence(contract, record),
      /derived|execution/i
    )
  }
)

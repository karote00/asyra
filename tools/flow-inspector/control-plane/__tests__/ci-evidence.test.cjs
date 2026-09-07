/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { admitContract } = require('../contracts.cjs')
const { assessCI } = require('../ci-evidence.cjs')
const manifest = require('../../../../packages/factory/flow-contracts.json')
const architecture = require('../../inspectors/transaction-flow-inspector.data.cjs')
const hash = (value) => createHash('sha256').update(value).digest('hex')
function fixture() {
  const contract = admitContract(manifest, architecture)
  const flowIds = contract.flows.map((f) => f.id)
  const snapshot = {
    sourceRoot: '/ci/integration/source',
    digest: 'a'.repeat(64),
    contractDigest: contract.digest,
    mappingVersion: contract.mappingVersion,
    architectureVersion: contract.architectureVersion,
    configurationDigest: 'b'.repeat(64),
    lockfileDigest: 'c'.repeat(64)
  }
  snapshot.head = '3'.repeat(40)
  snapshot.files = [
    { path: contract.testFile, size: 100, digest: 'a'.repeat(64) }
  ]
  snapshot.digest = hash(JSON.stringify(snapshot.files))
  const report = {
    success: true,
    numTotalTests: 6,
    numPassedTests: 6,
    numFailedTests: 0,
    numRuntimeErrorTestSuites: 0,
    testResults: [
      {
        name: path.join(snapshot.sourceRoot, contract.testFile),
        status: 'passed',
        assertionResults: contract.cases.map((c) => ({
          fullName: c.testName,
          status: 'passed',
          failureMessages: []
        }))
      }
    ]
  }
  const runner = {
    code: 0,
    version: '3.2.7',
    environment: {
      node: '24.13.0',
      platform: 'linux',
      architecture: 'x64',
      vitest: '3.2.7'
    },
    identity: {
      sourceDigest: snapshot.digest,
      contractDigest: contract.digest,
      mappingVersion: contract.mappingVersion,
      architectureVersion: contract.architectureVersion,
      configurationDigest: snapshot.configurationDigest,
      scenario: 'baseline',
      flowIds
    }
  }
  const expected = {
    repository: 'karote00/asyra',
    base: '1'.repeat(40),
    head: '2'.repeat(40),
    integration: '3'.repeat(40),
    runId: '123',
    attempt: 1,
    sourceDigest: snapshot.digest,
    configurationDigest: snapshot.configurationDigest,
    lockfileDigest: snapshot.lockfileDigest,
    policyDigest: 'd'.repeat(64)
  }
  const envelope = {
    format: 1,
    ...expected,
    provider: 'github-actions',
    providerConclusion: 'success',
    snapshot,
    runner,
    report: JSON.stringify(report),
    observedAt: '2026-09-07T15:00:00Z'
  }
  envelope.runner.reportDigest = hash(envelope.report)
  return { accepted: contract, candidate: contract, expected, envelope }
}
const assess = (f) => assessCI(f.accepted, f.candidate, f.expected, f.envelope)
test('aggregate assesses every supported flow and exposes absent external protection separately', () => {
  const result = assess(fixture())
  assert.equal(result.verificationStatus, 'passed')
  assert.equal(result.deliveryStatus, 'blocked')
  assert.equal(result.evidence.cases.length, 6)
  assert.equal(result.evidence.flows.length, 2)
  assert.match(result.blockers.join(' '), /required-check/)
})
test('provider green cannot mask real failing or skipped observations', () => {
  for (const status of ['failed', 'skipped']) {
    const f = fixture(),
      report = JSON.parse(f.envelope.report)
    report.testResults[0].assertionResults[0].status = status
    f.envelope.report = JSON.stringify(report)
    f.envelope.runner.reportDigest = hash(f.envelope.report)
    const result = assess(f)
    assert.notEqual(result.verificationStatus, 'passed')
    if (status === 'failed')
      assert.equal(result.evidence.cases[0].status, 'failed')
    assert.equal(result.deliveryStatus, 'blocked')
  }
})
test('accepted base rejects silent obligation removal, renamed bindings and policy weakening', () => {
  for (const change of ['removal', 'binding', 'policy']) {
    const f = fixture()
    if (change === 'policy') f.envelope.policyDigest = 'e'.repeat(64)
    else {
      f.candidate = structuredClone(f.candidate)
      if (change === 'removal') f.candidate.cases.pop()
      else f.candidate.cases[0].testName = 'weakened test'
    }
    const result = assess(f)
    assert.equal(result.deliveryStatus, 'blocked')
    assert.notEqual(result.verificationStatus, 'passed')
    assert.ok(result.blockers.some((b) => /accepted|policy/.test(b)))
  }
})
test('wrong integration, source, base, actor run, artifact and incomplete evidence never pass', () => {
  for (const field of [
    'repository',
    'base',
    'head',
    'integration',
    'sourceDigest',
    'configurationDigest',
    'lockfileDigest',
    'runId',
    'attempt',
    'report'
  ]) {
    const f = fixture()
    f.envelope[field] = field === 'attempt' ? 2 : 'wrong'
    const result = assess(f)
    assert.notEqual(result.verificationStatus, 'passed', field)
    assert.equal(result.deliveryStatus, 'blocked', field)
  }
})
test('an externally observed required strict check must cover the executed integration revision', () => {
  const f = fixture()
  f.expected.protection = {
    required: true,
    strict: true,
    check: 'flow-contract-aggregate',
    integration: f.expected.integration,
    observedAt: '2026-09-07T15:00:00Z',
    verifierPolicyDigest: f.expected.policyDigest,
    source: 'github-required-workflow',
    sourceIdentity: 'organization-ruleset:123'
  }
  assert.equal(assess(f).deliveryStatus, 'eligible')
  f.expected.protection.integration = f.expected.head
  assert.equal(assess(f).deliveryStatus, 'blocked')
})
test('empty, malformed, cancelled and zero-match envelopes fail closed', () => {
  for (const edit of [
    (f) => {
      f.envelope = null
    },
    (f) => {
      f.envelope.runner.reason = 'cancelled'
    },
    (f) => {
      const report = JSON.parse(f.envelope.report)
      report.testResults[0].assertionResults = []
      f.envelope.report = JSON.stringify(report)
      f.envelope.runner.reportDigest = hash(f.envelope.report)
    }
  ]) {
    const f = fixture()
    edit(f)
    assert.notEqual(assess(f).verificationStatus, 'passed')
  }
})

test('source manifest tampering and unprotected verifier versions remain delivery blockers', () => {
  const f = fixture()
  f.envelope.snapshot.files = [
    { path: 'forged.ts', size: 1, digest: '0'.repeat(64) }
  ]
  assert.notEqual(assess(f).verificationStatus, 'passed')
  const g = fixture()
  g.expected.protection = {
    required: true,
    strict: true,
    check: 'flow-contract-aggregate',
    integration: g.expected.integration,
    observedAt: '2026-09-07T15:00:00Z'
  }
  assert.equal(assess(g).deliveryStatus, 'blocked')
})

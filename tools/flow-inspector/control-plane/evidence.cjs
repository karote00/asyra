/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')

function assessEvidence(
  contract,
  snapshot,
  runner,
  flowIds,
  scenario = 'baseline'
) {
  const expected = contract.cases.filter((item) =>
    flowIds.includes(item.flowId)
  )
  const issues = []
  const observations = new Map()
  const report = runner.report
  const object = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
  if (
    !expected.length ||
    new Set(flowIds).size !== flowIds.length ||
    flowIds.some((id) => !contract.flows.some((flow) => flow.id === id))
  )
    issues.push('Invalid or empty selected flow set')
  if (snapshot.contractDigest !== contract.digest)
    issues.push('Contract provenance mismatch')
  const identity = runner.identity
  const fingerprint = (value) =>
    typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
  if (
    !identity ||
    identity.sourceDigest !== snapshot.digest ||
    identity.contractDigest !== contract.digest ||
    identity.mappingVersion !== contract.mappingVersion ||
    snapshot.mappingVersion !== contract.mappingVersion ||
    identity.architectureVersion !== contract.architectureVersion ||
    snapshot.architectureVersion !== contract.architectureVersion ||
    identity.configurationDigest !== snapshot.configurationDigest ||
    !fingerprint(snapshot.digest) ||
    !fingerprint(snapshot.configurationDigest) ||
    identity.scenario !== scenario ||
    !contract.scenarios.some((item) => item.id === scenario) ||
    !Array.isArray(identity.flowIds) ||
    JSON.stringify(identity.flowIds) !== JSON.stringify(flowIds)
  )
    issues.push('Execution provenance mismatch')
  if (
    !runner.environment ||
    ['node', 'platform', 'architecture', 'vitest'].some(
      (key) =>
        typeof runner.environment[key] !== 'string' || !runner.environment[key]
    ) ||
    runner.environment.vitest !== runner.version
  )
    issues.push('Missing or inconsistent runner environment')
  if (!fingerprint(runner.reportDigest))
    issues.push('Missing report fingerprint')
  if (runner.reason) issues.push('Runner stopped: ' + runner.reason)
  if (runner.reportError)
    issues.push('Report unavailable: ' + runner.reportError)
  const allCases = new Map(contract.cases.map((item) => [item.testName, item]))
  let observedCount = 0
  let failedCount = 0
  let passedCount = 0
  if (
    !object(report) ||
    !Array.isArray(report.testResults) ||
    typeof report.success !== 'boolean'
  ) {
    issues.push('Malformed or missing report')
  } else {
    if (report.testResults.length !== 1)
      issues.push('Unexpected test suite inventory')
    for (const suite of report.testResults) {
      if (!object(suite) || !Array.isArray(suite.assertionResults)) {
        issues.push('Malformed suite')
        continue
      }
      if (suite.name !== path.join(snapshot.sourceRoot, contract.testFile))
        issues.push('Unexpected test source')
      if (!['passed', 'failed', 'pending'].includes(suite.status))
        issues.push('Unknown suite status')
      let suiteFailures = 0
      for (const assertion of suite.assertionResults) {
        observedCount++
        if (
          !object(assertion) ||
          !['passed', 'failed', 'pending', 'skipped', 'todo'].includes(
            assertion.status
          )
        ) {
          issues.push('Malformed assertion')
          continue
        }
        if (assertion.status === 'passed') passedCount++
        if (assertion.status === 'failed') {
          failedCount++
          suiteFailures++
        }
        const item = allCases.get(assertion.fullName)
        if (!item) {
          issues.push('Unexpected test: ' + String(assertion.fullName))
          continue
        }
        if (!flowIds.includes(item.flowId)) {
          if (!['pending', 'skipped', 'todo'].includes(assertion.status))
            issues.push('Unrequested test executed: ' + assertion.fullName)
          continue
        }
        const matches = observations.get(item.id) ?? []
        matches.push(assertion)
        observations.set(item.id, matches)
      }
      if (suite.status === 'failed' && !suiteFailures)
        issues.push('Suite failed without a required assertion failure')
      if (suiteFailures && suite.status !== 'failed')
        issues.push('Suite status masks failed assertions')
    }
    if (
      report.numTotalTests !== observedCount ||
      report.numFailedTests !== failedCount ||
      report.numPassedTests !== passedCount
    )
      issues.push('Runner summary disagrees with observations')
    if (report.numRuntimeErrorTestSuites > 0)
      issues.push('Runner reported runtime errors')
    if (!report.success && failedCount === 0)
      issues.push('Runner reported unsuccessful execution')
    if (report.success && failedCount > 0)
      issues.push('Runner success masks failed assertions')
  }
  if (runner.code !== 0 && failedCount === 0)
    issues.push('Unsuccessful runner exit')
  const cases = expected.map((item) => {
    const matches = observations.get(item.id) ?? []
    if (matches.length !== 1) {
      issues.push(
        (matches.length ? 'Duplicate' : 'Missing') + ' case: ' + item.id
      )
      return { ...item, status: 'unknown', failures: [] }
    }
    const observed = matches[0]
    if (!['passed', 'failed'].includes(observed.status))
      issues.push('Required case was not executed: ' + item.id)
    const failures = Array.isArray(observed.failureMessages)
      ? observed.failureMessages
          .filter((value) => typeof value === 'string')
          .map((value) => value.slice(0, 12000))
      : []
    return {
      ...item,
      status: ['passed', 'failed'].includes(observed.status)
        ? observed.status
        : 'unknown',
      failures
    }
  })
  // A failing assertion always rejects the gate even if a wrapper returned zero.
  if (failedCount > 0 && runner.code === 0)
    issues.push('Runner exit masked failed assertions')
  const statusFor = (items) => {
    if (items.some((item) => item.status === 'failed')) return 'failed'
    if (
      issues.length ||
      !items.length ||
      items.some((item) => item.status !== 'passed')
    )
      return 'unknown'
    return 'passed'
  }
  return {
    status: statusFor(cases),
    issues,
    expectedCount: expected.length,
    passedCount: cases.filter((item) => item.status === 'passed').length,
    cases,
    flows: flowIds.map((id) => ({
      id,
      status: statusFor(cases.filter((item) => item.flowId === id))
    }))
  }
}

function validateStoredEvidence(contract, record) {
  if (
    record.phase !== 'completed' ||
    record.snapshot?.contractDigest !== contract.digest
  )
    return
  if (
    record.format === 2 &&
    ['mappingVersion', 'architectureVersion'].some(
      (key) => record.snapshot[key] !== contract[key]
    )
  )
    throw new Error(
      'Stored evidence provenance disagrees with the current contract'
    )
  const expected = contract.cases.filter((item) =>
    record.flowIds.includes(item.flowId)
  )
  const evidence = record.evidence
  const statusFor = (items) => {
    if (items.some((item) => item.status === 'failed')) return 'failed'
    if (
      evidence.issues.length ||
      !items.length ||
      items.some((item) => item.status !== 'passed')
    )
      return 'unknown'
    return 'passed'
  }
  if (
    !expected.length ||
    new Set(record.flowIds).size !== record.flowIds.length ||
    record.flowIds.some(
      (id) => !contract.flows.some((flow) => flow.id === id)
    ) ||
    !evidence ||
    evidence.expectedCount !== expected.length ||
    evidence.cases.length !== expected.length ||
    expected.some(
      (item) =>
        evidence.cases.filter((observed) =>
          ['id', 'flowId', 'stepId', 'testName'].every(
            (key) => observed[key] === item[key]
          )
        ).length !== 1
    ) ||
    evidence.passedCount !==
      evidence.cases.filter((item) => item.status === 'passed').length ||
    evidence.flows.length !== record.flowIds.length ||
    record.flowIds.some(
      (id) =>
        evidence.flows.filter(
          (flow) =>
            flow.id === id &&
            flow.status ===
              statusFor(evidence.cases.filter((item) => item.flowId === id))
        ).length !== 1
    ) ||
    evidence.status !== statusFor(evidence.cases)
  )
    throw new Error(
      'Stored evidence inventory disagrees with the current contract'
    )
}

module.exports = { assessEvidence, validateStoredEvidence }

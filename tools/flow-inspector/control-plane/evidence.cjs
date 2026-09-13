/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const { isDeepStrictEqual } = require('node:util')
const sourceOwner = require('./snapshot.cjs')
const { validId } = require('./store.cjs')

const RUNTIME_EXECUTION_ISSUE = 'Runtime execution provenance mismatch'
function resolveSource(snapshot, admission, contract, executionContext) {
  const derived =
    Object.hasOwn(snapshot, 'executionSource') ||
    Object.hasOwn(admission ?? {}, 'executionSource')
  if (derived && !admission) {
    if (!contract)
      throw new Error(
        'Derived execution requires direct trusted source admission'
      )
    if (
      Object.hasOwn(snapshot, 'sourceRoot') &&
      snapshot.sourceRoot !== executionContext?.sourceRoot
    )
      throw new Error('Derived source location conflicts with trusted context')
    const admitted = sourceOwner.validateSourceSnapshot(
      snapshot,
      contract,
      snapshot.files,
      executionContext
    )
    return {
      runtime: admitted.runtimeSource,
      source: Object.freeze({
        sourceRoot: executionContext.sourceRoot,
        head: snapshot.head,
        sourceDigest: snapshot.digest,
        lockfileDigest: snapshot.lockfileDigest,
        contractDigest: snapshot.contractDigest,
        mappingVersion: snapshot.mappingVersion,
        architectureVersion: snapshot.architectureVersion,
        configurationDigest: snapshot.configurationDigest,
        runtimeSource: admitted.runtimeSource,
        verificationSource: admitted.verificationSource,
        executionSource: admitted.executionSource
      })
    }
  }
  if (derived) {
    const execution = admission.executionSource
    if (
      !Object.hasOwn(snapshot, 'executionSource') ||
      !Object.hasOwn(admission, 'executionSource') ||
      !execution ||
      execution.format !== 1 ||
      !admission.verificationSource ||
      !['runtimeSource', 'verificationSource', 'executionSource'].every(
        (key) =>
          snapshot[key] && isDeepStrictEqual(snapshot[key], admission[key])
      ) ||
      !contract ||
      snapshot.contractDigest !== contract.digest ||
      ['mappingVersion', 'architectureVersion'].some(
        (key) => snapshot[key] !== contract[key]
      ) ||
      [
        'contractDigest',
        'mappingVersion',
        'architectureVersion',
        'configurationDigest'
      ].some((key) => admission[key] !== snapshot[key]) ||
      execution.digest !== snapshot.configurationDigest ||
      execution.verificationSourceDigest !== admission.verificationSource.digest
    )
      throw new Error('Derived execution admission does not bind this snapshot')
  }
  if (!Object.hasOwn(snapshot, 'runtimeSource')) {
    if (admission)
      throw new Error('Runtime source admission lacks source identity')
    return { runtime: undefined, source: null }
  }
  if (!admission)
    return {
      runtime: sourceOwner.validateRuntimeSource(snapshot),
      source: null
    }
  const runtime = snapshot.runtimeSource
  const admitted = admission.runtimeSource
  const same =
    runtime &&
    admitted &&
    runtime.format === 1 &&
    Object.keys(runtime).length === 3 &&
    ['format', 'files', 'digest'].every((key) => Object.hasOwn(runtime, key)) &&
    runtime.digest === admitted.digest &&
    Array.isArray(runtime.files) &&
    Array.isArray(admitted.files) &&
    runtime.files.length === admitted.files.length &&
    runtime.files.every(
      (entry, index) =>
        entry &&
        Object.keys(entry).join(',') === 'path,size,digest' &&
        ['path', 'size', 'digest'].every(
          (key) => entry[key] === admitted.files[index][key]
        )
    )
  if (
    !same ||
    !validId(admission.attemptId) ||
    typeof admission.repository !== 'string' ||
    !path.isAbsolute(admission.repository) ||
    admission.head !== snapshot.head ||
    admission.sourceDigest !== snapshot.digest ||
    admitted.files.find((entry) => entry.path === 'yarn.lock')?.digest !==
      snapshot.lockfileDigest ||
    (snapshot.sourceRoot &&
      !snapshot.sourceRoot.startsWith(admission.repository + path.sep))
  )
    throw new Error('Runtime source admission does not bind this snapshot')
  return { runtime: admitted, source: null }
}
function runtimeExecutionMismatch(
  snapshot,
  identity,
  runtime,
  flowIds,
  scenario
) {
  return (
    !runtime ||
    !identity ||
    identity.runtimeSourceDigest !== runtime.digest ||
    identity.lockfileDigest !== snapshot.lockfileDigest ||
    identity.sourceDigest !== snapshot.digest ||
    identity.contractDigest !== snapshot.contractDigest ||
    identity.mappingVersion !== snapshot.mappingVersion ||
    identity.architectureVersion !== snapshot.architectureVersion ||
    identity.configurationDigest !== snapshot.configurationDigest ||
    identity.scenario !== scenario ||
    JSON.stringify(identity.flowIds) !== JSON.stringify(flowIds)
  )
}

function assessSourceEvidence(
  contract,
  snapshot,
  runner,
  flowIds,
  scenario = 'baseline',
  sourceAdmission,
  executionContext
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
  const hasRuntime =
    Object.hasOwn(snapshot, 'executionSource') ||
    Object.hasOwn(snapshot, 'runtimeSource') ||
    Object.hasOwn(identity ?? {}, 'runtimeSourceDigest') ||
    Boolean(sourceAdmission)
  let runtime
  let source = null
  if (hasRuntime) {
    try {
      ;({ runtime, source } = resolveSource(
        snapshot,
        sourceAdmission,
        contract,
        executionContext
      ))
    } catch {
      issues.push('Runtime source provenance mismatch')
    }
    if (
      runtimeExecutionMismatch(snapshot, identity, runtime, flowIds, scenario)
    )
      issues.push(RUNTIME_EXECUTION_ISSUE)
  }
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
  const evidence = {
    status: statusFor(cases),
    ...(hasRuntime ? { runtimeSourceDigest: runtime?.digest ?? null } : {}),
    issues,
    expectedCount: expected.length,
    passedCount: cases.filter((item) => item.status === 'passed').length,
    cases,
    flows: flowIds.map((id) => ({
      id,
      status: statusFor(cases.filter((item) => item.flowId === id))
    }))
  }
  return { evidence, source }
}

function assessEvidence(...args) {
  return assessSourceEvidence(...args).evidence
}

function validateStoredEvidence(contract, record, sourceAdmission) {
  const derived =
    Object.hasOwn(record.snapshot ?? {}, 'executionSource') ||
    Object.hasOwn(sourceAdmission ?? {}, 'executionSource')
  if (
    record.phase === 'completed' &&
    derived &&
    (!sourceAdmission || record.snapshot?.contractDigest !== contract.digest)
  )
    throw new Error('Stored derived execution admission is unavailable')
  if (
    record.phase !== 'completed' ||
    record.snapshot?.contractDigest !== contract.digest
  )
    return
  if (
    record.format >= 2 &&
    ['mappingVersion', 'architectureVersion'].some(
      (key) => record.snapshot[key] !== contract[key]
    )
  )
    throw new Error(
      'Stored evidence provenance disagrees with the current contract'
    )
  const hasRuntime =
    Object.hasOwn(record.snapshot, 'runtimeSource') ||
    Object.hasOwn(record.runner?.identity ?? {}, 'runtimeSourceDigest') ||
    Object.hasOwn(record.evidence ?? {}, 'runtimeSourceDigest') ||
    Boolean(sourceAdmission)
  if (hasRuntime) {
    const { runtime } = resolveSource(
      record.snapshot,
      sourceAdmission,
      contract
    )
    const mismatch = runtimeExecutionMismatch(
      record.snapshot,
      record.runner?.identity,
      runtime,
      record.flowIds,
      record.scenario
    )
    if (
      !runtime ||
      (sourceAdmission && sourceAdmission.attemptId !== record.id) ||
      record.evidence?.runtimeSourceDigest !== runtime.digest ||
      !Array.isArray(record.evidence?.issues) ||
      record.evidence.issues.includes(RUNTIME_EXECUTION_ISSUE) !== mismatch ||
      (mismatch && record.evidence.status === 'passed')
    )
      throw new Error('Stored runtime evidence provenance mismatch')
  }
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

module.exports = {
  assessEvidence,
  assessSourceEvidence,
  validateStoredEvidence
}

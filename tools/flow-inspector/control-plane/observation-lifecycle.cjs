/* eslint-disable @typescript-eslint/no-require-imports */
const { createHash } = require('node:crypto')
const { validId } = require('./store.cjs')
const recordDigest = (record) =>
  createHash('sha256').update(JSON.stringify(record)).digest('hex')
const identity = (item) =>
  JSON.stringify([item.file, item.projectName, item.testName])
const hash = (value) =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const exactKeys = (value, keys) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).every((key) => keys.includes(key))
const validIntent = (value) =>
  exactKeys(value, ['version', 'cases']) &&
  value.version === 1 &&
  Array.isArray(value.cases) &&
  value.cases.length > 0 &&
  value.cases.length <= 2000 &&
  value.cases.every(
    (item) =>
      exactKeys(item, ['file', 'testName', 'projectName']) &&
      ['file', 'testName', 'projectName'].every(
        (key) => typeof item[key] === 'string'
      ) &&
      item.file &&
      item.testName
  ) &&
  new Set(value.cases.map(identity)).size === value.cases.length
const validCorrection = (value) =>
  exactKeys(value, [
    'version',
    'predecessorId',
    'predecessorDigest',
    'reason'
  ]) &&
  value.version === 1 &&
  validId(value.predecessorId) &&
  hash(value.predecessorDigest) &&
  typeof value.reason === 'string' &&
  value.reason.trim().length > 0 &&
  value.reason.length <= 2000
const executionKeys = [
  'REPOSITORY',
  'BASE',
  'HEAD',
  'INTEGRATION',
  'RUN',
  'ATTEMPT'
]
function executionIdentity(record) {
  const environment = record.command?.environment ?? {}
  if (
    !executionKeys.some((key) =>
      Object.hasOwn(environment, 'FLOW_RESULT_' + key)
    )
  ) {
    return null
  }
  const value = Object.fromEntries(
    executionKeys.map((key) => [
      key.toLowerCase(),
      environment['FLOW_RESULT_' + key]
    ])
  )
  if (
    !Object.values(value).every(
      (part) => typeof part === 'string' && part.length
    ) ||
    !['base', 'head', 'integration'].every((key) =>
      /^[a-f0-9]{40}$/.test(value[key])
    ) ||
    !['run', 'attempt'].every((key) => /^[1-9][0-9]*$/.test(value[key]))
  ) {
    return false
  }
  return value
}
function sameExecution(a, b) {
  const left = executionIdentity(a),
    right = executionIdentity(b)
  if (left === false || right === false) {
    return false
  }
  if (left === null || right === null) {
    return left === right
  }
  return (
    ['repository', 'base', 'head', 'integration', 'run'].every(
      (key) => left[key] === right[key]
    ) && Number(right.attempt) >= Number(left.attempt)
  )
}
function matchesExecution(record, expected) {
  const actual = executionIdentity(record)
  if (!expected) {
    return actual === null
  }
  return Boolean(
    actual &&
    executionKeys.every(
      (key) => typeof expected[key.toLowerCase()] === 'string'
    ) &&
    executionKeys.every(
      (key) => actual[key.toLowerCase()] === expected[key.toLowerCase()]
    )
  )
}
// The runner error is necessary but insufficient: require a valid zero-case
// report shape and no other retained execution or source problem.
function discoveryFailure(record) {
  const report = record.report
  const noTests = (text) =>
    typeof text === 'string' && /^Error: No tests found\./.test(text)
  return (
    record.phase === 'completed' &&
    record.cases.length === 0 &&
    report?.config &&
    Array.isArray(report.suites) &&
    report.suites.length === 0 &&
    ['expected', 'unexpected', 'flaky', 'skipped'].every(
      (key) => report.stats?.[key] === 0
    ) &&
    report.errors?.length === 1 &&
    noTests(report.errors[0].message) &&
    record.issues.every(
      (text) => text === 'No Playwright cases recorded' || noTests(text)
    ) &&
    (record.executionFailureDetails ?? []).every((item) =>
      noTests(item.message)
    )
  )
}
function mappingScope(record) {
  if (!Array.isArray(record.contracts) || !record.contracts.length) {
    return null
  }
  if (
    !record.contracts.every(
      (c) => typeof c.manifestPath === 'string' && hash(c.digest)
    )
  ) {
    return null
  }
  return JSON.stringify(
    record.contracts
      .map((c) => [c.manifestPath, c.digest])
      .sort(([a], [b]) => a.localeCompare(b))
  )
}
function canSupersede(
  previous,
  next,
  correction = next?.correction,
  intent = next?.intent
) {
  if (
    !previous ||
    !next ||
    !validCorrection(correction) ||
    !validIntent(intent) ||
    previous.id !== correction.predecessorId ||
    previous.id === next.id ||
    recordDigest(previous) !== correction.predecessorDigest ||
    !discoveryFailure(previous)
  ) {
    return false
  }
  if (
    next.phase !== 'completed' ||
    !(Date.parse(previous.finishedAt) >= Date.parse(previous.startedAt)) ||
    !(Date.parse(next.startedAt) > Date.parse(previous.startedAt)) ||
    !(Date.parse(next.startedAt) >= Date.parse(previous.finishedAt)) ||
    !(Date.parse(next.finishedAt) >= Date.parse(next.startedAt)) ||
    !sameExecution(previous, next) ||
    !mappingScope(previous) ||
    mappingScope(previous) !== mappingScope(next)
  ) {
    return false
  }
  if (
    next.issues.length ||
    next.executionFailureDetails?.length ||
    !next.cases.length ||
    !next.cases.every(
      (c) =>
        c.resolution === 'mapped' && ['passed', 'failed'].includes(c.status)
    )
  ) {
    return false
  }
  const observed = new Set(next.cases.map(identity))
  if (
    observed.size !== next.cases.length ||
    !intent.cases.every((c) => observed.has(identity(c))) ||
    (next.intent &&
      (!validIntent(next.intent) ||
        !next.intent.cases.every((c) => observed.has(identity(c)))))
  ) {
    return false
  }
  if (
    previous.intent &&
    (!validIntent(previous.intent) ||
      !previous.intent.cases.every((c) =>
        intent.cases.some((candidate) => identity(candidate) === identity(c))
      ))
  ) {
    return false
  }
  return true
}
function resolveIntent(contracts, request) {
  if (
    !exactKeys(request, [
      'version',
      'manifestPath',
      'caseIds',
      'predecessorId',
      'reason'
    ]) ||
    request.version !== 1 ||
    (request.predecessorId !== undefined &&
      (!validId(request.predecessorId) ||
        typeof request.reason !== 'string' ||
        !request.reason.trim() ||
        request.reason.length > 2000)) ||
    !Array.isArray(request.caseIds) ||
    !request.caseIds.length ||
    new Set(request.caseIds).size !== request.caseIds.length
  ) {
    throw new Error('Invalid observation request')
  }
  const contract = contracts.find(
    (item) => item.manifestPath === request.manifestPath
  )
  if (!contract) {
    throw new Error('Observation request manifest is not admitted')
  }
  const intent = {
    version: 1,
    cases: request.caseIds.map((id) => {
      const item = contract.cases.find((candidate) => candidate.id === id)
      if (!item) {
        throw new Error('Observation request case is not admitted')
      }
      return {
        file: item.testFile ?? contract.testFile,
        testName: item.testName,
        projectName: item.projectName ?? ''
      }
    })
  }
  if (!validIntent(intent)) {
    throw new Error('Invalid observation intent')
  }
  return intent
}
function validAssociation(value) {
  return (
    exactKeys(value, [
      'version',
      'successorId',
      'successorDigest',
      'correction',
      'intent'
    ]) &&
    value.version === 1 &&
    validId(value.successorId) &&
    hash(value.successorDigest) &&
    validCorrection(value.correction) &&
    validIntent(value.intent)
  )
}
module.exports = {
  validAssociation,
  recordDigest,
  validIntent,
  validCorrection,
  executionIdentity,
  matchesExecution,
  sameExecution,
  discoveryFailure,
  canSupersede,
  resolveIntent
}

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { randomUUID, createHash } = require('node:crypto')
const { loadContract } = require('./contracts.cjs')
const { safePath } = require('./snapshot.cjs')
const { writeAtomic, validId } = require('./store.cjs')
const digest = (value) => createHash('sha256').update(value).digest('hex')
const FAILURE_DETAIL_FIELDS = [
  'name',
  'message',
  'stack',
  'expected',
  'actual',
  'diff'
]
const validFailureDetails = (value, execution = false) =>
  Array.isArray(value) &&
  value.every(
    (detail) =>
      detail &&
      typeof detail === 'object' &&
      !Array.isArray(detail) &&
      Object.entries(detail).every(
        ([key, text]) =>
          (FAILURE_DETAIL_FIELDS.includes(key) ||
            (execution &&
              ['file', 'projectName', 'suiteName'].includes(key))) &&
          typeof text === 'string'
      )
  )
const DEFAULT_MANIFESTS = [
  'packages/render-engine-pixi/navigation-flow-contracts.json',
  'packages/ai-agent-runtime/flow-contracts.json',
  'packages/render/navigation-flow-contracts.json',
  'apps/asyra-design/flow-contracts.json',
  'packages/factory/history-replay-flow-contracts.json',
  'packages/factory/flow-contracts.json',
  'apps/asyra-design/undo-redo-flow-contracts.json'
]
const observationDirectory = (root) =>
  safePath(root, 'tmp/flow-inspector/test-results')
const relative = (root, file) =>
  path.relative(root, path.resolve(root, file)).split(path.sep).join('/')
const identity = (item) =>
  JSON.stringify([item.file, item.projectName, item.testName])

function sourceFingerprint(root, contracts) {
  const inputs = new Set(['package.json', 'yarn.lock'])
  const add = (input) => {
    const file = safePath(root, input)
    if (!fs.existsSync(file))
      throw new Error('Missing mapped observation input: ' + input)
    if (fs.lstatSync(file).isSymbolicLink())
      throw new Error('Symlinked observation input: ' + input)
    if (fs.statSync(file).isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) add(input + '/' + name)
    } else inputs.add(input)
  }
  for (const contract of contracts) {
    for (const key of [
      'manifestPath',
      'architecturePath',
      'specPath',
      'testFile',
      'configFile'
    ])
      add(contract[key])
    for (const step of contract.runtimeScope.steps)
      for (const boundary of step.implementationBoundary)
        add(boundary.replace(/\/\*\*$/, ''))
  }
  const files = [...inputs].sort().map((file) => {
    const absolute = safePath(root, file)
    return {
      path: file,
      digest: fs.existsSync(absolute) ? digest(fs.readFileSync(absolute)) : null
    }
  })
  return { digest: digest(JSON.stringify(files)), files }
}
function beginObservation(root, options = {}) {
  const contracts = [],
    issues = []
  for (const manifest of options.manifestPaths ?? DEFAULT_MANIFESTS) {
    try {
      contracts.push(loadContract(root, undefined, manifest))
    } catch (error) {
      issues.push(manifest + ': ' + error.message)
    }
  }
  let head = null,
    source = null
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch {
    issues.push('Git revision unavailable')
  }
  try {
    source = sourceFingerprint(root, contracts)
  } catch (error) {
    issues.push('Source fingerprint unavailable: ' + error.message)
  }
  const context = {
    format: 1,
    id: randomUUID(),
    startedAt: new Date().toISOString(),
    head,
    source,
    contracts,
    issues,
    command: options.command ?? null
  }
  saveObservation(observationDirectory(root), {
    ...context,
    authority: 'observation-only',
    phase: 'running',
    cases: [],
    report: null
  })
  return context
}
function localizeReport(root, context, report, options = {}) {
  const issues = [...context.issues, ...(options.errors ?? []).map(String)]
  if (!report || !Array.isArray(report.testResults))
    issues.push('Missing or malformed test report')
  const executionFailureDetails = options.executionFailureDetails
  if (
    executionFailureDetails !== undefined &&
    !validFailureDetails(executionFailureDetails, true)
  )
    issues.push('Malformed execution failure details')
  const observations = []
  const suites = Array.isArray(report?.testResults) ? report.testResults : []
  for (const [index, suite] of suites.entries()) {
    if (
      !suite ||
      typeof suite.name !== 'string' ||
      !Array.isArray(suite.assertionResults)
    ) {
      issues.push('Malformed test suite')
      continue
    }
    if (suite.message) issues.push(suite.name + ': ' + suite.message)
    const projectName = options.projects?.[index] ?? ''
    for (const [
      assertionIndex,
      assertion
    ] of suite.assertionResults.entries()) {
      if (!assertion || typeof assertion.fullName !== 'string') {
        issues.push('Malformed test observation')
        continue
      }
      const status = [
        'passed',
        'failed',
        'skipped',
        'pending',
        'todo'
      ].includes(assertion.status)
        ? assertion.status
        : 'unknown'
      const failureDetails = options.failureDetails?.[index]?.[assertionIndex]
      if (failureDetails !== undefined && !validFailureDetails(failureDetails))
        issues.push('Malformed assertion details: ' + assertion.fullName)
      observations.push({
        ...(validFailureDetails(failureDetails)
          ? { failureDetails: structuredClone(failureDetails) }
          : {}),
        file: relative(root, suite.name),
        projectName,
        testName: assertion.fullName,
        status,
        failures: Array.isArray(assertion.failureMessages)
          ? assertion.failureMessages.map(String)
          : [],
        assertionLocation: assertion.location ?? null
      })
    }
    if (
      suite.status === 'failed' &&
      !suite.assertionResults.some((item) => item?.status === 'failed') &&
      !suite.message
    )
      issues.push(suite.name + ': Suite failed without an assertion result')
  }
  const counts = new Map()
  for (const item of observations)
    counts.set(identity(item), (counts.get(identity(item)) ?? 0) + 1)
  const cases = observations.map((item, index) => {
    const matches = context.contracts.flatMap((contract) =>
      contract.cases
        .filter(
          (candidate) =>
            contract.testFile === item.file &&
            candidate.testName === item.testName &&
            (candidate.projectName ?? '') === item.projectName
        )
        .map((candidate) => ({ contract, candidate }))
    )
    let resolution = 'unmapped'
    if (matches.length === 1) resolution = 'mapped'
    if (matches.length > 1 || counts.get(identity(item)) > 1)
      resolution = 'ambiguous'
    if (options.stale) resolution = 'stale'
    const locations =
      resolution !== 'mapped'
        ? []
        : matches.map(({ contract, candidate }) => {
            const step = contract.architectureDefinition.steps.find(
              (step) => step.id === candidate.stepId
            )
            return {
              targetId: contract.targetId,
              flowId: candidate.flowId,
              caseId: candidate.id,
              stepId: step.id,
              title: step.title,
              ownerPackage: step.ownerPackage,
              failureOwnerStepId: step.failureOwnerStepId,
              implementationPaths: candidate.implementationPaths ?? [],
              implementationBoundary: step.implementationBoundary,
              specPath: contract.specPath,
              specRefs: step.specRefs,
              contractDigest: contract.digest,
              architectureVersion: contract.architectureVersion
            }
          })
    return {
      ...item,
      id: context.id + ':' + index,
      runId: context.id,
      resolution,
      locations,
      reason:
        resolution === 'mapped'
          ? 'Declared responsibility; root cause not inferred'
          : 'Location unavailable: ' + resolution
    }
  })
  if (options.stale)
    issues.push('Mapped inputs changed during execution; locations are stale')
  if (
    report?.success === false &&
    !cases.some((item) => item?.status === 'failed') &&
    !issues.length
  )
    issues.push('Runner did not complete successfully')
  return {
    ...context,
    authority: 'observation-only',
    phase: 'completed',
    finishedAt: new Date().toISOString(),
    ...(validFailureDetails(executionFailureDetails, true)
      ? { executionFailureDetails: structuredClone(executionFailureDetails) }
      : {}),
    issues,
    cases,
    report
  }
}
function completeObservation(root, context, report, options = {}) {
  let stale = true
  try {
    stale =
      !context.source ||
      sourceFingerprint(root, context.contracts).digest !==
        context.source.digest
  } catch (error) {
    options = { ...options, errors: [...(options.errors ?? []), error.message] }
  }
  const result = localizeReport(root, context, report, { ...options, stale })
  saveObservation(observationDirectory(root), result)
  return result
}
function saveObservation(directory, record) {
  if (!validId(record.id)) throw new Error('Invalid observation id')
  fs.mkdirSync(directory, { recursive: true })
  const file = path.join(directory, record.id + '.json')
  if (fs.existsSync(file)) {
    const previous = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (previous.record.phase === 'completed')
      throw new Error('Completed observations are immutable')
  }
  const bytes = JSON.stringify(record)
  writeAtomic(file, { digest: digest(bytes), record })
}
const strings = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
function validCase(item, runId) {
  return (
    item &&
    typeof item.id === 'string' &&
    item.id.startsWith(runId + ':') &&
    item.runId === runId &&
    ['file', 'projectName', 'testName', 'reason'].every(
      (key) => typeof item[key] === 'string'
    ) &&
    ['passed', 'failed', 'skipped', 'pending', 'todo', 'unknown'].includes(
      item.status
    ) &&
    ['mapped', 'unmapped', 'ambiguous', 'stale'].includes(item.resolution) &&
    strings(item.failures) &&
    (!Object.hasOwn(item, 'failureDetails') ||
      validFailureDetails(item.failureDetails)) &&
    Array.isArray(item.locations) &&
    (item.resolution === 'mapped'
      ? item.locations.length === 1
      : item.locations.length === 0) &&
    item.locations.every(
      (location) =>
        location &&
        [
          'targetId',
          'flowId',
          'caseId',
          'stepId',
          'title',
          'ownerPackage',
          'failureOwnerStepId',
          'specPath',
          'contractDigest',
          'architectureVersion'
        ].every((key) => typeof location[key] === 'string') &&
        ['implementationPaths', 'implementationBoundary', 'specRefs'].every(
          (key) => strings(location[key])
        )
    )
  )
}
function createObservationReader(directory, options = {}) {
  const entries = new Map()
  const readFile = options.readFile ?? ((file) => fs.readFileSync(file, 'utf8'))
  const refresh = () => {
    const names = fs.existsSync(directory)
      ? fs
          .readdirSync(directory)
          .filter(
            (name) => validId(name.slice(0, -5)) && name.endsWith('.json')
          )
      : []
    const live = new Set(names)
    for (const name of entries.keys()) if (!live.has(name)) entries.delete(name)
    for (const name of names) {
      const file = path.join(directory, name),
        stat = fs.lstatSync(file)
      const signature = stat.mtimeMs + ':' + stat.ctimeMs + ':' + stat.size
      if (entries.get(name)?.signature === signature) continue
      try {
        if (!stat.isFile() || stat.size > 32 * 1024 * 1024)
          throw new Error('Invalid observation file')
        const envelope = JSON.parse(readFile(file)),
          record = envelope.record
        if (
          !record ||
          record.id + '.json' !== name ||
          record.format !== 1 ||
          record.authority !== 'observation-only' ||
          !['running', 'completed'].includes(record.phase) ||
          !Array.isArray(record.cases) ||
          !strings(record.issues) ||
          (Object.hasOwn(record, 'executionFailureDetails') &&
            !validFailureDetails(record.executionFailureDetails, true)) ||
          !record.cases.every((item) => validCase(item, record.id)) ||
          (record.command !== null &&
            (!record.command ||
              typeof record.command.cwd !== 'string' ||
              !strings(record.command.argv) ||
              (record.command.environment !== undefined &&
                (!record.command.environment ||
                  typeof record.command.environment !== 'object' ||
                  Array.isArray(record.command.environment) ||
                  !Object.values(record.command.environment).every(
                    (value) => typeof value === 'string'
                  ))))) ||
          !Number.isFinite(Date.parse(record.startedAt)) ||
          digest(JSON.stringify(record)) !== envelope.digest
        )
          throw new Error('Invalid observation record')
        entries.set(name, { signature, record })
      } catch (error) {
        entries.set(name, { signature, error: name + ': ' + error.message })
      }
    }
  }
  return {
    get(id) {
      if (!validId(id)) throw new Error('Invalid observation id')
      refresh()
      const entry = entries.get(id + '.json')
      if (!entry?.record)
        throw new Error(entry?.error ?? 'Observation not found')
      return structuredClone(entry.record)
    },
    list() {
      refresh()
      const records = [...entries.values()]
        .filter((entry) => entry.record)
        .map((entry) => entry.record)
        .sort(
          (a, b) =>
            a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id)
        )
      const current = new Map()
      const startedAt = new Map(
        records.map((record) => [record.id, record.startedAt])
      )
      for (const record of records) {
        const perRun = new Map()
        for (const item of record.cases) {
          const key = identity(item)
          if (!perRun.has(key)) perRun.set(key, [])
          perRun.get(key).push(item)
        }
        for (const [key, items] of perRun) {
          const previous = current.get(key)
          if (
            previous?.some(
              (item) => startedAt.get(item.runId) === record.startedAt
            )
          ) {
            current.set(key, [...previous, ...items])
            continue
          }
          const incomplete = items.some(
            (item) => !['passed', 'failed'].includes(item.status)
          )
          // A filtered invocation supplies skipped siblings, not recovery evidence.
          // An ambiguous group must settle completely before retiring its failures.
          if (
            incomplete &&
            previous?.some((item) => item.status === 'failed')
          ) {
            current.set(key, [
              ...previous.filter((item) => item.status === 'failed'),
              ...items
            ])
            continue
          }
          current.set(key, items)
        }
      }
      return structuredClone({
        runs: records
          .map(
            ({
              id,
              startedAt,
              finishedAt,
              phase,
              head,
              issues,
              cases,
              executionFailureDetails
            }) => ({
              id,
              startedAt,
              finishedAt,
              phase,
              head,
              issues,
              ...(executionFailureDetails === undefined
                ? {}
                : { executionFailureDetails }),
              failedCount: cases.filter((item) => item.status === 'failed')
                .length
            })
          )
          .reverse(),
        currentCases: [...current.values()].flat(),
        issues: [...entries.values()]
          .filter((entry) => entry.error)
          .map((entry) => entry.error)
      })
    }
  }
}
module.exports = {
  FAILURE_DETAIL_FIELDS,
  DEFAULT_MANIFESTS,
  observationDirectory,
  sourceFingerprint,
  beginObservation,
  localizeReport,
  completeObservation,
  saveObservation,
  createObservationReader
}

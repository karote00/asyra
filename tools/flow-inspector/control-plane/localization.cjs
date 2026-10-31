/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { randomUUID, createHash } = require('node:crypto')
const { loadContract } = require('./contracts.cjs')
const { safePath } = require('./snapshot.cjs')
const { writeAtomic, validId } = require('./store.cjs')
const lifecycle = require('./observation-lifecycle.cjs')
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
const validRetainedArtifacts = (value) =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      ['name', 'originalPath', 'retainedPath', 'digest'].every(
        (key) => typeof item[key] === 'string'
      ) &&
      /^[a-f0-9]{64}$/.test(item.digest) &&
      Number.isSafeInteger(item.size) &&
      item.size >= 0
  )
const DEFAULT_MANIFESTS = [
  'packages/preset/coverage-flow-contracts.json',
  'packages/preset/navigation-flow-contracts.json',
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

function fingerprintPaths(root, declaredInputs) {
  const inputs = new Set()
  const add = (input) => {
    if (inputs.has(input)) {
      return
    }
    const file = safePath(root, input)
    if (!fs.existsSync(file)) {
      throw new Error('Missing mapped observation input: ' + input)
    }
    if (fs.lstatSync(file).isSymbolicLink()) {
      throw new Error('Symlinked observation input: ' + input)
    }
    if (fs.statSync(file).isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) {
        add(input + '/' + name)
      }
    } else {
      inputs.add(input)
    }
  }
  declaredInputs.forEach(add)
  const files = [...inputs].sort().map((file) => {
    const absolute = safePath(root, file)
    return {
      path: file,
      digest: fs.existsSync(absolute) ? digest(fs.readFileSync(absolute)) : null
    }
  })
  return { digest: digest(JSON.stringify(files)), files }
}
function sourceFingerprint(root, contracts) {
  const inputs = ['package.json', 'yarn.lock']
  for (const contract of contracts) {
    for (const key of [
      'manifestPath',
      'architecturePath',
      'specPath',
      'testFile',
      'configFile'
    ]) {
      inputs.push(contract[key])
    }
    inputs.push(...(contract.observationInputs ?? []))
    for (const item of contract.cases) {
      if (item.testFile) {
        inputs.push(item.testFile)
      }
    }
    for (const step of contract.runtimeScope.steps) {
      for (const boundary of step.implementationBoundary) {
        inputs.push(boundary.replace(/\/\*\*$/, ''))
      }
    }
  }
  return fingerprintPaths(root, inputs)
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
  const request =
    options.request ??
    (process.env.FLOW_RESULT_REQUEST
      ? JSON.parse(
          fs.readFileSync(
            safePath(root, process.env.FLOW_RESULT_REQUEST),
            'utf8'
          )
        )
      : undefined)
  const intent = request ? lifecycle.resolveIntent(contracts, request) : null
  let correction
  if (request?.predecessorId) {
    const previous = createObservationReader(observationDirectory(root)).get(
      request.predecessorId
    )
    if (previous.phase !== 'completed') {
      throw new Error('Correction predecessor is incomplete')
    }
    correction = {
      version: 1,
      predecessorId: previous.id,
      predecessorDigest: lifecycle.recordDigest(previous),
      reason: request.reason
    }
    if (!lifecycle.validCorrection(correction)) {
      throw new Error('Invalid correction reason')
    }
  }
  const context = {
    ...(intent ? { intent } : {}),
    ...(correction ? { correction } : {}),
    format: 1,
    id: randomUUID(),
    startedAt: new Date().toISOString(),
    head,
    source,
    contracts,
    issues,
    ...(options.executionConfig
      ? { executionConfig: structuredClone(options.executionConfig) }
      : {}),
    command: options.command ?? null
  }
  if (process.env.FLOW_FILE_DIRECTORY) {
    context.flowWrite = require('../flow-files/producers.cjs').capture(
      process.env.FLOW_FILE_DIRECTORY
    )
    return context
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
  if (!report || !Array.isArray(report.testResults)) {
    issues.push('Missing or malformed test report')
  }
  const executionFailureDetails = options.executionFailureDetails
  if (
    executionFailureDetails !== undefined &&
    !validFailureDetails(executionFailureDetails, true)
  ) {
    issues.push('Malformed execution failure details')
  }
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
    if (suite.message) {
      issues.push(suite.name + ': ' + suite.message)
    }
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
      if (
        failureDetails !== undefined &&
        !validFailureDetails(failureDetails)
      ) {
        issues.push('Malformed assertion details: ' + assertion.fullName)
      }
      observations.push({
        ...(validFailureDetails(failureDetails)
          ? { failureDetails: structuredClone(failureDetails) }
          : {}),
        ...(typeof options.runnerDetails?.[index]?.[assertionIndex] === 'string'
          ? { runnerDetails: options.runnerDetails[index][assertionIndex] }
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
    ) {
      issues.push(suite.name + ': Suite failed without an assertion result')
    }
  }
  const counts = new Map()
  for (const item of observations) {
    counts.set(identity(item), (counts.get(identity(item)) ?? 0) + 1)
  }
  const cases = observations.map((item, index) => {
    const matches = context.contracts.flatMap((contract) =>
      contract.cases
        .filter(
          (candidate) =>
            (candidate.testFile ?? contract.testFile) === item.file &&
            candidate.testName === item.testName &&
            (candidate.projectName ?? '') === item.projectName
        )
        .map((candidate) => ({ contract, candidate }))
    )
    let resolution = 'unmapped'
    if (matches.length === 1) {
      resolution = 'mapped'
    }
    if (matches.length > 1 || counts.get(identity(item)) > 1) {
      resolution = 'ambiguous'
    }
    if (options.stale) {
      resolution = 'stale'
    }
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
  if (options.stale) {
    issues.push('Mapped inputs changed during execution; locations are stale')
  }
  if (
    report?.success === false &&
    !cases.some((item) => item?.status === 'failed') &&
    !issues.length
  ) {
    issues.push('Runner did not complete successfully')
  }
  return {
    ...context,
    authority: 'observation-only',
    phase: 'completed',
    finishedAt: new Date().toISOString(),
    ...(validFailureDetails(executionFailureDetails, true)
      ? { executionFailureDetails: structuredClone(executionFailureDetails) }
      : {}),
    issues,
    ...(validRetainedArtifacts(options.retainedArtifacts)
      ? { retainedArtifacts: structuredClone(options.retainedArtifacts) }
      : {}),
    cases,
    report: Object.hasOwn(options, 'originalReport')
      ? options.originalReport
      : report
  }
}
function completeObservation(root, context, report, options = {}) {
  let stale = true
  try {
    stale =
      options.stale === true ||
      !context.source ||
      sourceFingerprint(root, context.contracts).digest !==
        context.source.digest
  } catch (error) {
    options = { ...options, errors: [...(options.errors ?? []), error.message] }
  }
  let result = localizeReport(root, context, report, { ...options, stale })
  // Preserve the reader's existing bound, including its envelope and digest.
  const envelopeBytes = Buffer.byteLength(
    JSON.stringify({ digest: '0'.repeat(64), record: result }, null, 2) + '\n'
  )
  if (envelopeBytes > 32 * 1024 * 1024) {
    result = localizeReport(
      root,
      context,
      { success: false, testResults: [] },
      {
        stale: true,
        errors: [
          'Localized observation exceeds the 32 MiB storage limit; original producer output remains at its source.'
        ]
      }
    )
  }
  if (context.flowWrite) {
    require('../flow-files/producers.cjs').publish(
      result,
      context.flowWrite,
      root
    )
  } else {
    saveObservation(observationDirectory(root), result)
  }
  return result
}
function saveObservation(directory, record) {
  if (!validId(record.id)) {
    throw new Error('Invalid observation id')
  }
  fs.mkdirSync(directory, { recursive: true })
  const file = path.join(directory, record.id + '.json')
  if (fs.existsSync(file)) {
    const previous = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (previous.record.phase === 'completed') {
      throw new Error('Completed observations are immutable')
    }
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
    (!Object.hasOwn(item, 'runnerDetails') ||
      typeof item.runnerDetails === 'string') &&
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
// A recorded invocation is evidence scope, never permission to execute its argv.
function invocationScope(record) {
  if (
    !record.command?.argv.length ||
    !Array.isArray(record.contracts) ||
    !record.contracts.length ||
    !record.contracts.every(
      (c) =>
        typeof c?.manifestPath === 'string' && typeof c?.digest === 'string'
    )
  ) {
    return null
  }
  return JSON.stringify({
    cwd: record.command.cwd,
    argv: record.command.argv,
    environment: Object.entries(record.command.environment ?? {}).sort(
      ([a], [b]) => a.localeCompare(b)
    ),
    contracts: record.contracts
      .map((c) => [c.manifestPath, c.digest])
      .sort(([a], [b]) => a.localeCompare(b))
  })
}
function classifyWarnings(records, associations = []) {
  const cleanScopes = new Map()
  const groups = { current: [], history: [] }
  for (const record of [...records].reverse()) {
    const scope = invocationScope(record)
    const successors = cleanScopes.get(scope) ?? []
    const successor = successors.find((value) =>
      record.cases.every((item) => value.identities.has(identity(item)))
    )
    if (record.issues.length || record.executionFailureDetails?.length) {
      const explicit =
        records.find((next) => lifecycle.canSupersede(record, next)) ??
        associations
          .map((relation) => {
            const next = records.find(
              (value) =>
                value.id === relation.successorId &&
                lifecycle.recordDigest(value) === relation.successorDigest
            )
            return lifecycle.canSupersede(
              record,
              next,
              relation.correction,
              relation.intent
            )
              ? next
              : null
          })
          .find(Boolean)
      const retired =
        explicit ||
        (successor &&
          !lifecycle.discoveryFailure(record) &&
          (!record.intent ||
            record.intent.cases.every((item) =>
              successor.identities.has(identity(item))
            )) &&
          lifecycle.sameExecution(record, successor.record) &&
          record.phase === 'completed' &&
          successor.record.startedAt > record.startedAt &&
          Number.isFinite(Date.parse(record.finishedAt)) &&
          Date.parse(successor.record.startedAt) >=
            Date.parse(record.finishedAt) &&
          record.cases.every((item) =>
            successor.identities.has(identity(item))
          ))
      let replacementReason = null
      if (explicit) {
        replacementReason = 'Corrected invocation executed the intended cases'
      } else if (retired) {
        replacementReason = 'Later complete invocation covered the same scope'
      }
      const group = {
        runId: record.id,
        startedAt: record.startedAt,
        issues: record.issues,
        executionFailureDetails: record.executionFailureDetails ?? [],
        supersededBy: retired ? (explicit?.id ?? successor.record.id) : null,
        replacementReason
      }
      groups[retired ? 'history' : 'current'].push(group)
    }
    if (
      scope !== null &&
      record.phase === 'completed' &&
      !record.issues.length &&
      !record.executionFailureDetails?.length &&
      record.cases.length &&
      record.cases.every(
        (item) =>
          item.resolution === 'mapped' &&
          ['passed', 'failed'].includes(item.status)
      ) &&
      new Set(record.cases.map(identity)).size === record.cases.length
    ) {
      const identities = new Set(record.cases.map(identity))
      // Keep only coverage not already proven by a later clean invocation.
      if (
        !successors.some((value) =>
          [...identities].every((key) => value.identities.has(key))
        )
      ) {
        cleanScopes.set(scope, [...successors, { record, identities }])
      }
    }
  }
  return groups
}
function createObservationReader(directory, options = {}) {
  const entries = new Map()
  const relations = new Map()
  const artifacts = new Map()
  const readArtifact = options.readArtifact ?? ((file) => fs.readFileSync(file))
  const projectRecord = (entry) =>
    entry.artifactErrors?.length
      ? {
          ...entry.record,
          issues: [...entry.record.issues, ...entry.artifactErrors],
          cases: entry.record.cases.map((item) => ({
            ...item,
            resolution: 'stale',
            locations: []
          }))
        }
      : entry.record
  const refreshArtifacts = () => {
    const live = new Set()
    for (const entry of entries.values()) {
      entry.artifactErrors = []
      if (!entry.record) {
        continue
      }
      for (const artifact of entry.record.retainedArtifacts ?? []) {
        const key = artifact.retainedPath
        live.add(key)
        try {
          const prefix =
            'tmp/flow-inspector/test-results/' +
            entry.record.id +
            '/attachments/'
          if (
            !key.startsWith(prefix) ||
            !/^[0-9]+$/.test(key.slice(prefix.length))
          ) {
            throw new Error('Invalid retained artifact path')
          }
          const file = safePath(
            directory,
            entry.record.id + '/attachments/' + key.slice(prefix.length)
          )
          const stat = fs.lstatSync(file)
          const signature =
            stat.mtimeMs +
            ':' +
            stat.ctimeMs +
            ':' +
            stat.size +
            ':' +
            artifact.digest +
            ':' +
            artifact.size
          let checked = artifacts.get(key)
          if (checked?.signature !== signature) {
            let error = null
            if (
              !stat.isFile() ||
              stat.size !== artifact.size ||
              stat.size > 64 * 1024 * 1024
            ) {
              error = 'Invalid retained artifact size or type'
            } else if (digest(readArtifact(file)) !== artifact.digest) {
              error = 'Retained artifact digest mismatch'
            }
            checked = { signature, error }
            artifacts.set(key, checked)
          }
          if (checked.error) {
            throw new Error(checked.error)
          }
        } catch (error) {
          entry.artifactErrors.push(
            'Retained artifact unavailable: ' + key + ': ' + error.message
          )
        }
      }
    }
    for (const key of artifacts.keys()) {
      if (!live.has(key)) {
        artifacts.delete(key)
      }
    }
  }
  const readFile = options.readFile ?? ((file) => fs.readFileSync(file, 'utf8'))
  const refresh = () => {
    const relationDirectory = path.join(directory, 'corrections')
    const relationNames = fs.existsSync(relationDirectory)
      ? fs
          .readdirSync(relationDirectory)
          .filter((name) => !name.includes('.publish-'))
      : []
    for (const name of relations.keys()) {
      if (!relationNames.includes(name)) {
        relations.delete(name)
      }
    }
    for (const name of relationNames) {
      const file = path.join(relationDirectory, name)
      const stat = fs.lstatSync(file)
      const signature = stat.mtimeMs + ':' + stat.ctimeMs + ':' + stat.size
      if (relations.get(name)?.signature === signature) {
        continue
      }
      try {
        if (!stat.isFile() || stat.size > 1024 * 1024) {
          throw new Error('Invalid correction file')
        }
        const relation = JSON.parse(readFile(file))
        if (
          !lifecycle.validAssociation(relation) ||
          name !== relation.correction.predecessorId + '.json'
        ) {
          throw new Error('Invalid correction relation')
        }
        relations.set(name, { signature, relation })
      } catch (error) {
        relations.set(name, { signature, error: name + ': ' + error.message })
      }
    }
    const names = fs.existsSync(directory)
      ? fs
          .readdirSync(directory)
          .filter(
            (name) => validId(name.slice(0, -5)) && name.endsWith('.json')
          )
      : []
    const live = new Set(names)
    for (const name of entries.keys()) {
      if (!live.has(name)) {
        entries.delete(name)
      }
    }
    for (const name of names) {
      const file = path.join(directory, name),
        stat = fs.lstatSync(file)
      const signature = stat.mtimeMs + ':' + stat.ctimeMs + ':' + stat.size
      if (entries.get(name)?.signature === signature) {
        continue
      }
      try {
        if (!stat.isFile() || stat.size > 32 * 1024 * 1024) {
          throw new Error('Invalid observation file')
        }
        const envelope = JSON.parse(readFile(file)),
          record = envelope.record
        if (
          !record ||
          record.id + '.json' !== name ||
          record.format !== 1 ||
          record.authority !== 'observation-only' ||
          !['running', 'completed'].includes(record.phase) ||
          !Array.isArray(record.cases) ||
          (Object.hasOwn(record, 'retainedArtifacts') &&
            !validRetainedArtifacts(record.retainedArtifacts)) ||
          !strings(record.issues) ||
          (Object.hasOwn(record, 'executionFailureDetails') &&
            !validFailureDetails(record.executionFailureDetails, true)) ||
          !record.cases.every((item) => validCase(item, record.id)) ||
          (record.intent !== undefined &&
            !lifecycle.validIntent(record.intent)) ||
          (record.correction !== undefined &&
            !lifecycle.validCorrection(record.correction)) ||
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
        ) {
          throw new Error('Invalid observation record')
        }
        entries.set(name, { signature, record })
      } catch (error) {
        entries.set(name, { signature, error: name + ': ' + error.message })
      }
    }
    refreshArtifacts()
  }
  return {
    associations() {
      refresh()
      return structuredClone(
        [...relations.values()]
          .filter((entry) => entry.relation)
          .map((entry) => entry.relation)
      )
    },
    warningContext(id) {
      refresh()
      const records = [...entries.values()]
        .filter((entry) => entry.record)
        .map(projectRecord)
        .filter((record) =>
          lifecycle.matchesExecution(record, options.executionIdentity)
        )
        .sort(
          (a, b) =>
            a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id)
        )
      const groups = classifyWarnings(
        records,
        [...relations.values()]
          .filter((entry) => entry.relation)
          .map((entry) => entry.relation)
      )
      const selected = new Set(
        (records.find((record) => record.id === id)?.cases ?? []).map(identity)
      )
      const followsRecovery = (group) =>
        (
          records.find((record) => record.id === group.supersededBy)?.cases ??
          []
        ).some((item) => selected.has(identity(item)))
      const related = Object.entries(groups).flatMap(([status, values]) =>
        values
          .filter(
            (item) =>
              item.runId === id ||
              item.supersededBy === id ||
              followsRecovery(item)
          )
          .map((item) => ({
            status,
            runId: item.runId,
            supersededBy: item.supersededBy,
            replacementReason: item.replacementReason,
            evidenceUrl: '/api/test-results/' + item.runId
          }))
      )
      return { total: related.length, items: related.slice(0, 3) }
    },
    caseContext(id, caseId) {
      if (!validId(id)) {
        throw new Error('Invalid observation id')
      }
      refresh()
      const entry = entries.get(id + '.json')
      if (!entry?.record) {
        throw new Error(entry?.error ?? 'Observation not found')
      }
      const record = projectRecord(entry)
      const item = record.cases.find((value) => value.id === caseId)
      if (!item) {
        throw new Error('Observed case unavailable')
      }
      // Project before cloning: source inventories and raw reports are not summary inputs.
      return structuredClone({
        record: {
          id: record.id,
          startedAt: record.startedAt,
          head: record.head,
          source: { digest: record.source?.digest ?? null },
          command: record.command,
          contracts: record.contracts.map((c) => ({
            manifestPath: c.manifestPath,
            digest: c.digest
          }))
        },
        item: Object.fromEntries(
          [
            'id',
            'runId',
            'file',
            'testName',
            'projectName',
            'status',
            'resolution',
            'assertionLocation',
            'failures',
            'failureDetails',
            'locations'
          ]
            .filter((key) => Object.hasOwn(item, key))
            .map((key) => [key, item[key]])
        )
      })
    },
    get(id) {
      if (!validId(id)) {
        throw new Error('Invalid observation id')
      }
      refresh()
      const entry = entries.get(id + '.json')
      if (!entry?.record) {
        throw new Error(entry?.error ?? 'Observation not found')
      }
      return structuredClone(entry.record)
    },
    list({ caseIdentityOnly = false } = {}) {
      refresh()
      const records = [...entries.values()]
        .filter((entry) => entry.record)
        .map(projectRecord)
        .sort(
          (a, b) =>
            a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id)
        )
      const relationErrors = [...relations.values()]
        .filter((entry) => entry.relation)
        .flatMap(({ relation }) => {
          const previous = records.find(
            (record) => record.id === relation.correction.predecessorId
          )
          const next = records.find(
            (record) => record.id === relation.successorId
          )
          return next &&
            lifecycle.recordDigest(next) === relation.successorDigest &&
            lifecycle.canSupersede(
              previous,
              next,
              relation.correction,
              relation.intent
            )
            ? []
            : [
                'Correction ' +
                  relation.correction.predecessorId +
                  ': missing, changed or unsupported successor evidence'
              ]
        })
      const current = new Map()
      const startedAt = new Map(
        records.map((record) => [record.id, record.startedAt])
      )
      for (const record of records.filter((value) =>
        lifecycle.matchesExecution(value, options.executionIdentity)
      )) {
        const perRun = new Map()
        for (const item of record.cases) {
          const key = identity(item)
          if (!perRun.has(key)) {
            perRun.set(key, [])
          }
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
            (item) =>
              item.resolution === 'stale' ||
              !['passed', 'failed'].includes(item.status)
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
      if (caseIdentityOnly) {
        return structuredClone({
          currentCases: [...current.values()].flat().map((item) => ({
            id: item.id,
            runId: item.runId,
            file: item.file,
            testName: item.testName,
            projectName: item.projectName,
            status: item.status,
            resolution: item.resolution,
            contextUrl:
              '/api/node-context/' +
              item.runId +
              '/' +
              item.id.slice(item.runId.length + 1) +
              '/summary'
          }))
        })
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
        currentCases: [...current.values()].flat().map((item) => ({
          ...item,
          contextUrl:
            '/api/node-context/' +
            item.runId +
            '/' +
            item.id.slice(item.runId.length + 1) +
            '/summary'
        })),
        warningGroups: classifyWarnings(
          records.filter((value) =>
            lifecycle.matchesExecution(value, options.executionIdentity)
          ),
          [...relations.values()]
            .filter((entry) => entry.relation)
            .map((entry) => entry.relation)
        ),
        issues: [...entries.values(), ...relations.values()]
          .filter((entry) => entry.error)
          .map((entry) => entry.error)
          .concat(relationErrors)
      })
    }
  }
}
module.exports = {
  fingerprintPaths,
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

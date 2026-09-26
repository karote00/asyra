/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const inventory = Object.freeze(
  [
    {
      id: 'design.delete',
      producer: 'design',
      file: 'delete-element.spec.ts',
      title: 'Delete key removes the single selected element'
    },
    {
      id: 'design.collaboration-delete',
      producer: 'collaboration',
      file: 'collaboration.spec.ts',
      title:
        'two real Asyra Design windows converge while connected and catch up through reconnect bootstrap'
    },
    {
      id: 'design.group-delete',
      producer: 'collaboration',
      file: 'collaboration.spec.ts',
      title:
        'remote undo restores an exact nested Group with and without local tombstones'
    }
  ].map(Object.freeze)
)
const identityKeys = [
  'repository',
  'base',
  'head',
  'integration',
  'run',
  'attempt'
]
const hash = (value) => createHash('sha256').update(value).digest('hex')
function classify(observations, reportValid) {
  if (
    observations.some((o) =>
      o.results?.some((s) => ['failed', 'timedOut'].includes(s))
    )
  )
    return 'failed'
  if (!reportValid || observations.length !== 1) return 'unverified'
  const o = observations[0]
  return o.project === 'chromium' &&
    o.expected === 'passed' &&
    o.results.length === 1 &&
    o.results[0] === 'passed'
    ? 'passed'
    : 'unverified'
}
function collect(report, producer, identity) {
  if (!['design', 'collaboration'].includes(producer))
    throw new Error('Unknown workflow producer')
  const specs = []
  function walk(suites) {
    if (!Array.isArray(suites)) return
    for (const suite of suites) {
      if (!suite || typeof suite !== 'object') continue
      if (Array.isArray(suite.specs)) specs.push(...suite.specs)
      walk(suite.suites)
    }
  }
  walk(report?.suites)
  const reportValid = Boolean(
    report &&
    Array.isArray(report.suites) &&
    Array.isArray(report.errors) &&
    report.errors.length === 0
  )
  const cases = inventory
    .filter((c) => c.producer === producer)
    .map((c) => {
      const observations = specs
        .filter(
          (s) =>
            s &&
            [c.file, 'e2e/' + c.file].includes(s.file) &&
            s.title === c.title
        )
        .flatMap((s) => (Array.isArray(s.tests) ? s.tests : []))
        .map((t) => ({
          project: t.projectName === 'chromium' ? 'chromium' : 'unknown',
          expected: t.expectedStatus === 'passed' ? 'passed' : 'unknown',
          results: Array.isArray(t.results)
            ? t.results
                .map((r) =>
                  [
                    'passed',
                    'failed',
                    'timedOut',
                    'skipped',
                    'interrupted'
                  ].includes(r?.status)
                    ? r.status
                    : 'unknown'
                )
                .slice(0, 20)
            : []
        }))
        .slice(0, 20)
      return {
        id: c.id,
        status: classify(observations, reportValid),
        observations
      }
    })
  return {
    version: 1,
    producer,
    identity: Object.fromEntries(identityKeys.map((k) => [k, identity[k]])),
    reportDigest: hash(JSON.stringify(report ?? null)),
    reportValid,
    cases
  }
}
function aggregate(envelopes, identity, jobs, scopeEvidence) {
  const blockers = []
  const validIdentity =
    identityKeys.every(
      (k) => typeof identity[k] === 'string' && identity[k].length > 0
    ) &&
    ['base', 'head', 'integration'].every((k) =>
      /^[a-f0-9]{40}$/.test(identity[k])
    )
  if (!validIdentity)
    blockers.push('Expected execution identity is unavailable')
  const designSelected = jobs.designSelected === 'true'
  const scope = aggregateScope(scopeEvidence, identity, jobs)
  blockers.push(...scope.blockers)
  const cases = inventory.map((c) => {
    if (!designSelected)
      return {
        id: c.id,
        owner: 'apps/asyra-design',
        file: 'apps/asyra-design/e2e/' + c.file,
        title: c.title,
        status: 'not-selected'
      }
    const records = Array.isArray(envelopes)
      ? envelopes.filter((e) => e?.producer === c.producer)
      : []
    const e = records.length === 1 ? records[0] : null
    const expectedIds = inventory
      .filter((i) => i.producer === c.producer)
      .map((i) => i.id)
    const admitted =
      validIdentity &&
      e?.version === 1 &&
      typeof e.reportValid === 'boolean' &&
      /^[a-f0-9]{64}$/.test(e.reportDigest ?? '') &&
      identityKeys.every((k) => e.identity?.[k] === identity[k]) &&
      Array.isArray(e.cases) &&
      JSON.stringify(e.cases.map((o) => o?.id)) === JSON.stringify(expectedIds)
    const observed = admitted ? e.cases.find((o) => o.id === c.id) : null
    let status = 'unverified'
    if (
      observed &&
      Array.isArray(observed.observations) &&
      observed.observations.every((o) => o && Array.isArray(o.results))
    )
      status = classify(observed.observations, e.reportValid)
    if (!admitted)
      blockers.push(c.id + ': missing or invalid producer evidence')
    return {
      id: c.id,
      owner: 'apps/asyra-design/src/features/delete-element/index.ts',
      file: 'apps/asyra-design/e2e/' + c.file,
      title: c.title,
      status
    }
  })
  if (jobs.validate !== 'success')
    blockers.push('validate: prerequisite did not succeed')
  if (designSelected && jobs.e2e !== 'success')
    blockers.push('e2e: prerequisite did not succeed')
  if (!designSelected && jobs.e2e !== 'skipped')
    blockers.push('e2e: unselected producer did not remain skipped')
  let status = 'passed'
  if (cases.some((c) => c.status === 'failed') || scope.status === 'failed')
    status = 'failed'
  else if (
    blockers.length ||
    cases.some((c) => c.status !== 'passed' && c.status !== 'not-selected') ||
    scope.status !== 'passed'
  )
    status = 'unverified'
  return {
    version: 1,
    identity,
    status,
    cases,
    workspaceGroups: scope.workspaceGroups,
    producerResults: Object.fromEntries(
      [
        'validate',
        'workspaceValidation',
        'flowInspectorValidation',
        'frameworkRelease',
        'createAppReadiness',
        'e2e',
        'designForwarder',
        'collaborationForwarder'
      ].map((name) => [name, jobs[name] ?? 'missing'])
    ),
    blockers,
    acceptedBaselineChanged: false,
    protectedEvidence: false
  }
}
function aggregateScope(evidence, identity, jobs) {
  const blockers = []
  const validIdentity =
    identityKeys.every(
      (key) => typeof identity[key] === 'string' && identity[key].length > 0
    ) &&
    ['base', 'head', 'integration'].every((key) =>
      /^[a-f0-9]{40}$/.test(identity[key] ?? '')
    )
  const relationshipMap = evidence?.relationshipMap
  const matrix = relationshipMap?.workspaceMatrix
  const graph = relationshipMap?.workspaceGraph
  const unique = (values) => new Set(values).size === values.length
  const validMap =
    relationshipMap?.version === 1 &&
    Array.isArray(relationshipMap.workspaceRoots) &&
    relationshipMap.workspaceRoots.length > 0 &&
    relationshipMap.workspaceRoots.every(
      (root) => typeof root === 'string' && /^[a-z][a-z0-9-]*$/.test(root)
    ) &&
    new Set(relationshipMap.workspaceRoots).size ===
      relationshipMap.workspaceRoots.length &&
    relationshipMap.excludedRoots &&
    relationshipMap.excludedRoots['create-app'] === 'archive-readiness' &&
    Array.isArray(relationshipMap.documentationRoots) &&
    relationshipMap.documentationRoots.every((root) =>
      /^docs\/[a-z0-9][a-z0-9-]*$/.test(root)
    ) &&
    unique(relationshipMap.documentationRoots) &&
    Array.isArray(graph) &&
    Array.isArray(relationshipMap.dependencyEdges) &&
    Array.isArray(relationshipMap.changedWorkspaceNames) &&
    Array.isArray(relationshipMap.affectedWorkspaceNames) &&
    Array.isArray(matrix) &&
    typeof relationshipMap.sharedValidationRequired === 'boolean' &&
    relationshipMap.sharedValidationRequired &&
    typeof relationshipMap.frameworkReleaseRequired === 'boolean' &&
    Array.isArray(relationshipMap.frameworkDeclarationTasks) &&
    typeof relationshipMap.designE2ERequired === 'boolean' &&
    typeof relationshipMap.designE2EWorkspaceDirectory === 'string' &&
    relationshipMap.workspaceRoots.some((root) =>
      relationshipMap.designE2EWorkspaceDirectory.startsWith(root + '/')
    ) &&
    typeof relationshipMap.flowInspectorValidationWorkspaceDirectory ===
      'string' &&
    relationshipMap.workspaceRoots.some((root) =>
      relationshipMap.flowInspectorValidationWorkspaceDirectory.startsWith(
        root + '/'
      )
    ) &&
    typeof relationshipMap.flowInspectorValidationRequired === 'boolean' &&
    Array.isArray(relationshipMap.createAppPackages) &&
    relationshipMap.createAppPackages.every((directory) =>
      /^create-app\/[a-z0-9][a-z0-9-]*$/.test(directory)
    ) &&
    Array.isArray(relationshipMap.unknownPaths) &&
    relationshipMap.unknownPaths.length === 0
  const validGraph =
    validMap &&
    graph.every(
      (workspace) =>
        workspace &&
        typeof workspace.name === 'string' &&
        /^[a-z0-9][a-z0-9-]*$|^@[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/.test(
          workspace.name
        ) &&
        typeof workspace.directory === 'string' &&
        relationshipMap.workspaceRoots.some((root) =>
          workspace.directory.startsWith(root + '/')
        ) &&
        typeof workspace.group === 'string' &&
        typeof workspace.buildTask === 'string' &&
        typeof workspace.testTask === 'string' &&
        workspace.testTask === 'test:ci' &&
        Array.isArray(workspace.dependencies)
    ) &&
    unique(graph.map(({ name }) => name)) &&
    unique(graph.map(({ directory }) => directory))
  const graphByName = new Map(
    validGraph ? graph.map((workspace) => [workspace.name, workspace]) : []
  )
  const validMatrix =
    validGraph &&
    matrix.every((entry) => {
      const workspace = graphByName.get(entry?.name)
      return (
        workspace &&
        entry.directory === workspace.directory &&
        entry.buildTask === workspace.buildTask &&
        entry.testTask === workspace.testTask &&
        /^[a-f0-9]{16}$/.test(entry.artifactId ?? '') &&
        hash(entry.name).startsWith(entry.artifactId)
      )
    }) &&
    unique(matrix.map(({ name }) => name)) &&
    unique(matrix.map(({ artifactId }) => artifactId)) &&
    JSON.stringify(relationshipMap.affectedWorkspaceNames) ===
      JSON.stringify(matrix.map(({ name }) => name)) &&
    JSON.stringify(evidence?.workspaceMatrix) === JSON.stringify(matrix) &&
    JSON.stringify(evidence?.affectedWorkspaces) ===
      JSON.stringify(matrix.map(({ name }) => name))
  const expectedFrameworkPackages = validMatrix
    ? matrix
        .filter(({ directory }) => directory.startsWith('packages/'))
        .map(({ name }) => name)
    : []
  const expectedFrameworkDeclarationTasks = validGraph
    ? graph
        .filter(({ group }) => group === 'packages')
        .map(({ name, buildTask }) => ({ workspace: name, task: buildTask }))
    : []
  const admitted =
    validIdentity &&
    evidence?.version === 2 &&
    identityKeys.every((key) => evidence.identity?.[key] === identity[key]) &&
    validMap &&
    validMatrix &&
    evidence.relationshipMapDigest === hash(JSON.stringify(relationshipMap)) &&
    JSON.stringify(relationshipMap.frameworkDeclarationTasks) ===
      JSON.stringify(expectedFrameworkDeclarationTasks) &&
    JSON.stringify(evidence.frameworkPackages) ===
      JSON.stringify(expectedFrameworkPackages) &&
    evidence.frameworkReleaseRequired ===
      relationshipMap.frameworkReleaseRequired &&
    JSON.stringify(evidence.createAppPackages) ===
      JSON.stringify(relationshipMap.createAppPackages) &&
    evidence.designE2ERequired === relationshipMap.designE2ERequired &&
    relationshipMap.designE2ERequired ===
      matrix.some(
        ({ directory }) =>
          directory === relationshipMap.designE2EWorkspaceDirectory
      ) &&
    relationshipMap.designE2ERequired === (jobs.designSelected === 'true') &&
    relationshipMap.flowInspectorValidationRequired ===
      matrix.some(
        ({ directory }) =>
          directory ===
          relationshipMap.flowInspectorValidationWorkspaceDirectory
      ) &&
    JSON.stringify(relationshipMap.unknownPaths) === '[]' &&
    JSON.stringify(evidence.unknownPaths) === '[]'
  if (!admitted)
    blockers.push(
      'CI relationship map is missing, unknown, malformed, or belongs to another run attempt'
    )

  const selectedMatrix = validMatrix ? relationshipMap.workspaceMatrix : []
  const expectedNames = selectedMatrix.map(({ name }) => name)
  const resultRecords = Array.isArray(jobs.workspaceResults)
    ? jobs.workspaceResults
    : []
  const matrixResult = jobs.workspaceValidation
  if (selectedMatrix.length > 0 && matrixResult !== 'success')
    blockers.push(
      'workspace-validation: selected matrix did not succeed (' +
        (matrixResult || 'missing') +
        ')'
    )
  if (selectedMatrix.length === 0 && matrixResult !== 'skipped')
    blockers.push(
      'workspace-validation: unselected matrix did not remain skipped'
    )
  const flowInspectorSelected =
    admitted && relationshipMap.flowInspectorValidationRequired
  if (flowInspectorSelected && jobs.flowInspectorValidation !== 'success')
    blockers.push('flow-inspector-validation: selected checks did not succeed')
  if (!flowInspectorSelected && jobs.flowInspectorValidation !== 'skipped')
    blockers.push(
      'flow-inspector-validation: unselected check did not remain skipped'
    )

  const byWorkspace = new Map()
  for (const record of resultRecords) {
    if (!record || typeof record.workspace !== 'string') continue
    const entries = byWorkspace.get(record.workspace) ?? []
    entries.push(record)
    byWorkspace.set(record.workspace, entries)
  }
  for (const entry of selectedMatrix) {
    const records = byWorkspace.get(entry.name) ?? []
    if (records.length !== 1) {
      blockers.push(entry.name + ': missing or duplicate matrix result')
      continue
    }
    const record = records[0]
    const recordValid =
      admitted &&
      record.version === 1 &&
      identityKeys.every((key) => record.identity?.[key] === identity[key]) &&
      record.relationshipMapDigest === evidence.relationshipMapDigest &&
      record.directory === entry.directory &&
      record.buildTask === entry.buildTask &&
      record.testTask === entry.testTask &&
      record.status === 'success' &&
      record.buildStatus === 'success' &&
      record.testStatus === 'success' &&
      JSON.stringify(record.taskSequence) ===
        JSON.stringify([entry.buildTask, entry.testTask])
    if (!recordValid)
      blockers.push(entry.name + ': invalid or unsuccessful matrix result')
  }
  if (
    resultRecords.some((record) => !expectedNames.includes(record?.workspace))
  )
    blockers.push('workspace-validation: unexpected matrix result')

  const frameworkReleaseSelected =
    admitted && relationshipMap.frameworkReleaseRequired
  if (frameworkReleaseSelected && jobs.frameworkRelease !== 'success')
    blockers.push(
      'framework-release-readiness: selected release gate did not succeed'
    )
  if (!frameworkReleaseSelected && jobs.frameworkRelease !== 'skipped')
    blockers.push(
      'framework-release-readiness: unselected release gate did not remain skipped'
    )
  const createAppSelected =
    admitted && relationshipMap.createAppPackages.length > 0
  if (createAppSelected && jobs.createAppReadiness !== 'success')
    blockers.push(
      'create-app-readiness: selected package check did not succeed'
    )
  if (!createAppSelected && jobs.createAppReadiness !== 'skipped')
    blockers.push(
      'create-app-readiness: unselected package check did not remain skipped'
    )
  for (const name of ['designForwarder', 'collaborationForwarder'])
    if (jobs[name] !== 'success')
      blockers.push(name + ': required forwarder did not succeed')
  const failed =
    jobs.validate === 'failure' ||
    (selectedMatrix.length > 0 && matrixResult === 'failure') ||
    (flowInspectorSelected && jobs.flowInspectorValidation === 'failure') ||
    resultRecords.some(
      (record) =>
        record?.status === 'failed' ||
        record?.buildStatus === 'failure' ||
        record?.testStatus === 'failure'
    ) ||
    (frameworkReleaseSelected && jobs.frameworkRelease === 'failure') ||
    (createAppSelected && jobs.createAppReadiness === 'failure') ||
    jobs.designForwarder === 'failure' ||
    jobs.collaborationForwarder === 'failure'
  const passed = admitted && blockers.length === 0
  let status = 'unverified'
  if (passed) status = 'passed'
  else if (failed) status = 'failed'
  return {
    version: 1,
    identity,
    status,
    workspaceGroups: admitted
      ? [
          ...new Set(
            selectedMatrix.map(({ directory }) => directory.split('/')[0])
          )
        ].sort()
      : [],
    jobs,
    blockers
  }
}
function runtimeIdentity() {
  return Object.fromEntries(
    identityKeys.map((k) => [
      k,
      process.env['FLOW_RESULT_' + k.toUpperCase()] ?? ''
    ])
  )
}
function summary(result) {
  return [
    '## Flow CI - ' + result.status,
    '',
    'Observational results; no accepted baseline or protected delivery authorization.',
    '',
    '### Selected validation producers',
    '',
    '| Producer | Result |',
    '| --- | --- |',
    ...Object.entries(result.producerResults ?? {}).map(
      ([name, status]) => '| ' + name + ' | ' + status + ' |'
    ),
    '',
    '### Design evidence',
    '',
    '| Case | Result |',
    '| --- | --- |',
    ...result.cases.map((c) => '| ' + c.id + ' | ' + c.status + ' |'),
    '',
    ...result.blockers.map((b) => '- ' + b),
    ''
  ].join('\n')
}
if (require.main === module) {
  const [command, producer, reportPath] = process.argv.slice(2)
  if (command === 'collect') {
    let report = null
    try {
      if (fs.statSync(reportPath).size <= 32 * 1024 * 1024)
        report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
    } catch {
      /* Missing producer output remains unverified. */
    }
    const identity = runtimeIdentity()
    identity.integration = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8'
    }).trim()
    const envelope = collect(report, producer, identity)
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      'evidence=' + JSON.stringify(envelope) + '\n'
    )
  } else if (command === 'aggregate') {
    const envelopes = [
      'FLOW_DESIGN_EVIDENCE',
      'FLOW_COLLABORATION_EVIDENCE'
    ].map((k) => {
      try {
        return JSON.parse(process.env[k] ?? '')
      } catch {
        return null
      }
    })
    let scope = null
    try {
      scope = JSON.parse(process.env.FLOW_SCOPE_EVIDENCE ?? '')
    } catch {
      /* Missing scope evidence remains unverified. */
    }
    const jobs = {
      validate: process.env.FLOW_VALIDATE_RESULT,
      e2e: process.env.FLOW_E2E_RESULT,
      designSelected: process.env.FLOW_DESIGN_SELECTED,
      workspaceValidation: process.env.FLOW_WORKSPACE_VALIDATION_RESULT,
      flowInspectorValidation:
        process.env.FLOW_FLOW_INSPECTOR_VALIDATION_RESULT,
      frameworkRelease: process.env.FLOW_FRAMEWORK_RELEASE_RESULT,
      createAppReadiness: process.env.FLOW_CREATE_APP_READINESS_RESULT,
      designForwarder: process.env.FLOW_DESIGN_FORWARDER_RESULT,
      collaborationForwarder: process.env.FLOW_COLLABORATION_FORWARDER_RESULT
    }
    let workspaceResults = []
    const workspaceResultsDirectory = process.env.FLOW_WORKSPACE_RESULTS_DIR
    if (workspaceResultsDirectory) {
      try {
        workspaceResults = fs
          .readdirSync(workspaceResultsDirectory)
          .filter((file) => file.endsWith('.json'))
          .sort()
          .map((file) => {
            try {
              return JSON.parse(
                fs.readFileSync(
                  path.join(workspaceResultsDirectory, file),
                  'utf8'
                )
              )
            } catch {
              return null
            }
          })
      } catch {
        /* Missing matrix artifacts remain unverified. */
      }
    }
    jobs.workspaceValidation = process.env.FLOW_WORKSPACE_VALIDATION_RESULT
    jobs.workspaceResults = workspaceResults
    const result = aggregate(envelopes, runtimeIdentity(), jobs, scope)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary(result))
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = result.status === 'passed' ? 0 : 1
  } else throw new Error('Expected collect or aggregate')
}
module.exports = { collect, aggregate }

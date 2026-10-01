/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const { validRepositoryScriptSelection } = require('./ci-script-selection.cjs')
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
const e2eSuiteNames = [
  'collaboration',
  'flow-inspector-board',
  'functional',
  'render-contracts'
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
  const selectedSuites =
    scopeEvidence?.relationshipMap?.executionPlan?.checks?.e2e?.selected ?? []
  const scope = aggregateScope(scopeEvidence, identity, jobs)
  blockers.push(...scope.blockers)
  const cases = inventory.map((c) => {
    const ownerSuite = c.producer === 'design' ? 'functional' : 'collaboration'
    if (!selectedSuites.includes(ownerSuite))
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
  if (selectedSuites.length > 0 && jobs.e2e !== 'success')
    blockers.push('e2e: selected suite workflow did not succeed')
  if (selectedSuites.length === 0 && jobs.e2e !== 'skipped')
    blockers.push('e2e: unselected producer did not remain skipped')
  const suiteResults = jobs.e2eSuiteResults
  if (
    !suiteResults ||
    JSON.stringify(Object.keys(suiteResults).sort()) !==
      JSON.stringify(e2eSuiteNames.slice().sort())
  ) {
    blockers.push('e2e: suite result set is missing or unexpected')
  } else {
    for (const suite of e2eSuiteNames) {
      const result = suiteResults[suite]
      if (selectedSuites.includes(suite)) {
        if (result !== 'success')
          blockers.push(`e2e ${suite}: selected suite did not succeed`)
      } else if (
        selectedSuites.length === 0 &&
        jobs.e2e === 'skipped' &&
        (result === '' || result === undefined || result === 'skipped')
      ) {
        continue
      } else if (result !== 'skipped') {
        blockers.push(`e2e ${suite}: unselected suite did not remain skipped`)
      }
    }
  }
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
        'e2eSuiteResults',
        'frameworkDeclarations',
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
  const executionPlan = relationshipMap?.executionPlan
  const matrix = relationshipMap?.workspaceMatrix
  const graph = relationshipMap?.workspaceGraph
  const unique = (values) => new Set(values).size === values.length
  const validWorkspaceTests = (selection) =>
    selection &&
    ['full', 'related', 'not-selected'].includes(selection.mode) &&
    Array.isArray(selection.inputs) &&
    selection.inputs.every((file) => typeof file === 'string') &&
    typeof selection.reason === 'string' &&
    (selection.mode !== 'related' ||
      (selection.inputs.length > 0 &&
        selection.runner?.command === 'vitest' &&
        Array.isArray(selection.runner.args) &&
        selection.runner.args.every((arg) => typeof arg === 'string')))
  const lintSelection = executionPlan?.checks?.lint
  const repositoryScriptSelection = executionPlan?.checks?.repositoryScripts
  const namingSelection = executionPlan?.checks?.naming
  const frameworkDeclarationSelection =
    executionPlan?.checks?.frameworkDeclarations
  const e2eSelection = executionPlan?.checks?.e2e
  const validExecutionPlan =
    executionPlan?.version === 1 &&
    ['full', 'incremental'].includes(executionPlan.mode) &&
    Array.isArray(executionPlan.changedPaths) &&
    executionPlan.changedPaths.every((file) => typeof file === 'string') &&
    Array.isArray(executionPlan.unknownRelations) &&
    Array.isArray(executionPlan.checks?.workspaces) &&
    lintSelection &&
    ['full', 'files', 'not-selected'].includes(lintSelection.mode) &&
    Array.isArray(lintSelection.inputs) &&
    repositoryScriptSelection &&
    validRepositoryScriptSelection(repositoryScriptSelection) &&
    namingSelection &&
    ['full', 'not-selected'].includes(namingSelection.mode) &&
    namingSelection.command === 'lint:naming' &&
    Array.isArray(namingSelection.inputs) &&
    frameworkDeclarationSelection &&
    ['full', 'not-selected'].includes(frameworkDeclarationSelection.mode) &&
    Array.isArray(frameworkDeclarationSelection.tasks) &&
    e2eSelection &&
    Array.isArray(e2eSelection.selected) &&
    unique(e2eSelection.selected) &&
    Array.isArray(e2eSelection.notSelected) &&
    unique(e2eSelection.notSelected) &&
    [...e2eSelection.selected, ...e2eSelection.notSelected].every((name) =>
      e2eSuiteNames.includes(name)
    ) &&
    new Set([...e2eSelection.selected, ...e2eSelection.notSelected]).size ===
      e2eSuiteNames.length &&
    e2eSuiteNames.every(
      (name) =>
        e2eSelection.selected.includes(name) !==
        e2eSelection.notSelected.includes(name)
    ) &&
    (executionPlan.mode !== 'full' ||
      (lintSelection.mode === 'full' &&
        repositoryScriptSelection.mode === 'full' &&
        namingSelection.mode === 'full' &&
        frameworkDeclarationSelection.mode === 'full' &&
        executionPlan.checks.workspaces.every(
          (workspace) => workspace.tests?.mode === 'full'
        ) &&
        e2eSelection.selected.length === e2eSuiteNames.length))
  const validMap =
    relationshipMap?.version === 1 &&
    validExecutionPlan &&
    JSON.stringify(evidence?.executionPlan) === JSON.stringify(executionPlan) &&
    JSON.stringify(executionPlan.unknownRelations) ===
      JSON.stringify(relationshipMap.unknownPaths) &&
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
        ['lint', 'eslint'].includes(workspace.lintTask) &&
        [null, 'has:test'].includes(workspace.hasTestTask ?? null) &&
        (workspace.e2eTask === null || workspace.e2eTask === 'test:e2e:ci') &&
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
        entry.lintTask === workspace.lintTask &&
        (entry.hasTestTask ?? null) === (workspace.hasTestTask ?? null) &&
        (entry.e2eTask ?? null) === (workspace.e2eTask ?? null) &&
        ['full', 'not-selected'].includes(entry.lintSelection?.mode) &&
        ['full', 'related', 'not-selected'].includes(
          entry.e2eSelection?.mode
        ) &&
        entry.testTask === workspace.testTask &&
        validWorkspaceTests(entry.testSelection) &&
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
  const expectedFrameworkDeclarationTasks = validExecutionPlan
    ? frameworkDeclarationSelection.tasks
    : []
  const expectedWorkspacePlan = validMatrix
    ? matrix.map((entry) => {
        const planned = executionPlan.checks.workspaces.find(
          ({ workspace }) => workspace === entry.name
        )
        return (
          planned &&
          planned.directory === entry.directory &&
          planned.buildTask === entry.buildTask &&
          planned.lintTask === entry.lintTask &&
          planned.e2eTask === (entry.e2eTask ?? null) &&
          JSON.stringify(planned.lint) ===
            JSON.stringify(entry.lintSelection) &&
          JSON.stringify(planned.e2e) === JSON.stringify(entry.e2eSelection) &&
          planned.testTask === entry.testTask &&
          JSON.stringify(planned.tests) === JSON.stringify(entry.testSelection)
        )
      })
    : []
  const admitted =
    validIdentity &&
    evidence?.version === 2 &&
    identityKeys.every((key) => evidence.identity?.[key] === identity[key]) &&
    validMap &&
    validMatrix &&
    expectedWorkspacePlan.length === matrix.length &&
    expectedWorkspacePlan.every(Boolean) &&
    JSON.stringify(executionPlan.checks.workspaces) ===
      JSON.stringify(
        matrix.map((entry) =>
          executionPlan.checks.workspaces.find(
            ({ workspace }) => workspace === entry.name
          )
        )
      ) &&
    JSON.stringify(frameworkDeclarationSelection.tasks) ===
      JSON.stringify(relationshipMap.frameworkDeclarationTasks) &&
    evidence.relationshipMapDigest === hash(JSON.stringify(relationshipMap)) &&
    JSON.stringify(relationshipMap.frameworkDeclarationTasks) ===
      JSON.stringify(expectedFrameworkDeclarationTasks) &&
    JSON.stringify(evidence.frameworkPackages) ===
      JSON.stringify(expectedFrameworkPackages) &&
    JSON.stringify(jobs.executionPlan) === JSON.stringify(executionPlan) &&
    evidence.frameworkReleaseRequired ===
      relationshipMap.frameworkReleaseRequired &&
    JSON.stringify(evidence.createAppPackages) ===
      JSON.stringify(relationshipMap.createAppPackages) &&
    evidence.designE2ERequired === relationshipMap.designE2ERequired &&
    relationshipMap.designE2ERequired ===
      e2eSelection.selected.some((suite) => suite !== 'flow-inspector-board') &&
    relationshipMap.designE2ERequired === (jobs.designSelected === 'true') &&
    relationshipMap.flowInspectorValidationRequired ===
      (executionPlan.checks.controlPlane?.mode === 'full') &&
    (executionPlan.mode !== 'full' || matrix.length === graph.length) &&
    JSON.stringify(relationshipMap.unknownPaths) === '[]' &&
    JSON.stringify(evidence.unknownPaths) === '[]'
  if (!admitted)
    blockers.push(
      'CI relationship map is missing, unknown, malformed, or belongs to another run attempt'
    )

  const selectedCheckResults = jobs.selectedCheckResults
  const expectedCheckNames = ['lint', 'repositoryScripts', 'naming']
  const expectedExecutionPlanDigest = validExecutionPlan
    ? hash(JSON.stringify(executionPlan))
    : ''
  const checkResultsValid =
    admitted &&
    selectedCheckResults?.version === 1 &&
    identityKeys.every(
      (key) => selectedCheckResults.identity?.[key] === identity[key]
    ) &&
    selectedCheckResults.relationshipMapDigest ===
      evidence.relationshipMapDigest &&
    selectedCheckResults.executionPlanDigest === expectedExecutionPlanDigest &&
    selectedCheckResults.checks &&
    JSON.stringify(Object.keys(selectedCheckResults.checks).sort()) ===
      JSON.stringify(expectedCheckNames.slice().sort()) &&
    expectedCheckNames.every((name) => {
      const selection = executionPlan.checks[name]
      const result = selectedCheckResults.checks[name]
      if (
        !result ||
        result.mode !== selection.mode ||
        JSON.stringify(result.inputs) !== JSON.stringify(selection.inputs)
      )
        return false
      if (selection.mode === 'not-selected')
        return result.status === 'not-selected'
      if (name === 'repositoryScripts' && selection.mode === 'files')
        return (
          result.status === 'passed' &&
          JSON.stringify(result.executedTests) ===
            JSON.stringify(selection.tests)
        )
      if (name === 'lint') {
        if (
          result.status === 'not-selected' &&
          selection.mode === 'files' &&
          result.reason === 'no-applicable-files'
        )
          return (
            Array.isArray(result.executedFiles) &&
            result.executedFiles.length === 0
          )
        return (
          result.status === 'passed' &&
          Array.isArray(result.executedFiles) &&
          result.executedFiles.length > 0 &&
          (selection.mode !== 'files' ||
            result.executedFiles.every((file) =>
              selection.inputs.includes(file)
            ))
        )
      }
      return result.status === 'passed'
    })
  if (!checkResultsValid)
    blockers.push(
      'selected-checks: missing, stale, or mismatched execution results'
    )
  for (const name of [
    'securityAudit',
    'dependencyValidation',
    'turboValidation'
  ]) {
    const guard = executionPlan?.checks?.[name]
    if (
      !['full', 'not-selected'].includes(guard?.mode) ||
      !Array.isArray(guard?.inputs) ||
      jobs[name] !== (guard.mode === 'full' ? 'success' : 'skipped')
    )
      blockers.push(`${name}: missing, failed or unexpected selected guard`)
  }
  const artifactSelection = executionPlan?.checks?.productionArtifacts
  const artifactApps = artifactSelection?.apps
  const validArtifacts =
    Array.isArray(artifactApps) &&
    unique(artifactApps) &&
    artifactApps.every((app) =>
      ['asyra-design', 'asyra-sim', 'asyra-framework'].includes(app)
    ) &&
    JSON.stringify(artifactApps) ===
      JSON.stringify(relationshipMap?.productionApps)
  if (
    !validArtifacts ||
    jobs.productionArtifacts !== (artifactApps.length ? 'success' : 'skipped')
  )
    blockers.push(
      'production-artifacts: missing, failed or unexpected selected producer'
    )
  const declarationsSelected =
    executionPlan?.checks?.frameworkDeclarations?.mode === 'full'
  if (declarationsSelected && jobs.frameworkDeclarationResult !== 'success')
    blockers.push('framework-declarations: selected build did not succeed')
  if (!declarationsSelected && jobs.frameworkDeclarationResult !== 'skipped')
    blockers.push(
      'framework-declarations: unselected build did not remain skipped'
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
      record.lintTask === entry.lintTask &&
      JSON.stringify(record.lintSelection) ===
        JSON.stringify(entry.lintSelection) &&
      (record.e2eTask ?? null) === (entry.e2eTask ?? null) &&
      JSON.stringify(record.e2eSelection) ===
        JSON.stringify(entry.e2eSelection) &&
      record.testTask === entry.testTask &&
      (record.hasTestTask ?? null) === (entry.hasTestTask ?? null) &&
      JSON.stringify(record.testSelection) ===
        JSON.stringify(entry.testSelection) &&
      record.status === 'success' &&
      record.lintStatus ===
        (entry.lintSelection.mode === 'not-selected'
          ? 'not-selected'
          : 'success') &&
      record.buildStatus === 'success' &&
      record.testStatus ===
        (entry.testSelection.mode === 'not-selected'
          ? 'not-selected'
          : 'success') &&
      JSON.stringify(record.taskSequence) ===
        JSON.stringify([
          ...(entry.lintSelection.mode === 'not-selected'
            ? []
            : [entry.lintTask]),
          entry.buildTask,
          ...(entry.testSelection.mode === 'not-selected'
            ? []
            : [
                ...(entry.hasTestTask ? [entry.hasTestTask] : []),
                entry.testTask
              ]),
          ...(entry.e2eSelection.mode === 'not-selected' ? [] : [entry.e2eTask])
        ]) &&
      (entry.e2eSelection.mode === 'not-selected'
        ? record.e2eStatus === 'not-selected' && record.e2eResult === undefined
        : record.e2eStatus === 'passed' &&
          record.e2eResult?.mode === entry.e2eSelection.mode &&
          JSON.stringify(record.e2eResult.inputs) ===
            JSON.stringify(entry.e2eSelection.inputs) &&
          /^[a-f0-9]{64}$/.test(record.e2eResult.reportDigest ?? '') &&
          Number.isInteger(record.e2eResult.testCount) &&
          record.e2eResult.testCount > 0 &&
          record.e2eResult.passedCount === record.e2eResult.testCount &&
          record.e2eResult.failedCount === 0) &&
      (entry.testSelection.mode === 'not-selected'
        ? record.testResult === undefined
        : record.testResult?.mode === entry.testSelection.mode &&
          (entry.testSelection.mode !== 'related' ||
            JSON.stringify(record.testResult.inputs) ===
              JSON.stringify(entry.testSelection.inputs)))
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
    jobs.e2e === 'failure' ||
    Object.entries(jobs.e2eSuiteResults ?? {}).some(
      ([suite, result]) =>
        executionPlan?.checks?.e2e?.selected?.includes(suite) &&
        result === 'failure'
    ) ||
    Object.values(jobs.selectedCheckResults?.checks ?? {}).some(
      (result) => result?.status === 'failed'
    ) ||
    (declarationsSelected && jobs.frameworkDeclarationResult === 'failure') ||
    (selectedMatrix.length > 0 && matrixResult === 'failure') ||
    (flowInspectorSelected && jobs.flowInspectorValidation === 'failure') ||
    resultRecords.some(
      (record) =>
        record?.status === 'failed' ||
        record?.buildStatus === 'failure' ||
        record?.testStatus === 'failure' ||
        record?.e2eStatus === 'failure'
    ) ||
    jobs.productionArtifacts === 'failure' ||
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
    executionPlan: executionPlan ?? null,
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
    ...Object.entries(result.jobs?.selectedCheckResults?.checks ?? {}).map(
      ([name, check]) => '| ' + name + ' | ' + check.status + ' |'
    ),
    ...(result.jobs?.frameworkDeclarationResult
      ? [
          '| Framework declarations | ' +
            result.jobs.frameworkDeclarationResult +
            ' |'
        ]
      : []),
    ...Object.entries(result.jobs?.e2eSuiteResults ?? {}).map(
      ([name, status]) => '| E2E ' + name + ' | ' + (status || 'missing') + ' |'
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
      scope = JSON.parse(
        fs.readFileSync(process.env.FLOW_SCOPE_EVIDENCE_FILE ?? '', 'utf8')
      )
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
      productionArtifacts: process.env.FLOW_PRODUCTION_ARTIFACT_RESULT,
      securityAudit: process.env.FLOW_SECURITY_AUDIT_RESULT,
      dependencyValidation: process.env.FLOW_DEPENDENCY_VALIDATION_RESULT,
      turboValidation: process.env.FLOW_TURBO_VALIDATION_RESULT,
      createAppReadiness: process.env.FLOW_CREATE_APP_READINESS_RESULT,
      designForwarder: process.env.FLOW_DESIGN_FORWARDER_RESULT,
      collaborationForwarder: process.env.FLOW_COLLABORATION_FORWARDER_RESULT
    }
    jobs.executionPlan = scope?.relationshipMap?.executionPlan ?? null
    try {
      jobs.selectedCheckResults = JSON.parse(
        fs.readFileSync(
          process.env.FLOW_SELECTED_CHECK_RESULTS_FILE ?? '',
          'utf8'
        )
      )
    } catch {
      jobs.selectedCheckResults = null
    }
    jobs.frameworkDeclarationResult =
      process.env.FLOW_FRAMEWORK_DECLARATION_RESULT
    jobs.e2eSuiteResults = {
      functional: process.env.FLOW_E2E_FUNCTIONAL_RESULT,
      collaboration: process.env.FLOW_E2E_COLLABORATION_RESULT,
      'flow-inspector-board': process.env.FLOW_E2E_BOARD_RESULT,
      'render-contracts': process.env.FLOW_E2E_RENDER_CONTRACTS_RESULT
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

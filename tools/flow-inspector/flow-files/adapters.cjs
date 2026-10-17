/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path'),
  { randomUUID } = require('node:crypto')
const { stripVTControlCharacters } = require('node:util')
const { openProject } = require('./store.cjs')
const { admitProject } = require('./schema.cjs')
const { digest, nodeBinding, criterionBinding } = require('./policy.cjs')
const { dataPath } = require('./project.cjs')
const { fingerprintPaths } = require('../control-plane/localization.cjs')
function selector(root, value) {
  if (!value || !['vitest', 'playwright'].includes(value.producer)) return null
  let parsed
  try {
    parsed = JSON.parse(value.identity)
  } catch {
    throw new Error('Invalid portable selector JSON')
  }
  if (Array.isArray(parsed)) return null // Explicit Asyra architecture projection adapter owns arrays.
  if (
    !parsed ||
    Object.keys(parsed).sort().join(',') !== 'config,cwd,file,project,title' ||
    typeof parsed.title !== 'string' ||
    !parsed.title ||
    typeof parsed.project !== 'string'
  )
    throw new Error('Expected exact portable selector fields')
  dataPath(root, parsed.file)
  dataPath(root, parsed.config)
  if (parsed.cwd !== '.') dataPath(root, parsed.cwd)
  return { ...parsed, producer: value.producer }
}
function selection(project, filter = {}) {
  const store = openProject(project.directory),
    snapshot = store.snapshot()
  if (snapshot.evaluation.projectId !== project.projectId)
    throw new Error('Wrong project identity')
  const admitted = admitProject(snapshot.documents),
    cases = [],
    identities = new Set()
  for (const doc of snapshot.documents) {
    for (const node of [
      ...doc.definition.nodes,
      { id: 'integration', criteria: doc.definition.criteria, actions: [] }
    ]) {
      for (const criterion of node.criteria) {
        const selected = selector(project.root, criterion.selector)
        if (
          !selected ||
          Object.entries(filter).some(([k, v]) =>
            Array.isArray(v)
              ? !v.includes(
                  {
                    flowId: doc.flowId,
                    nodeId: node.id,
                    criterionId: criterion.id,
                    ...selected
                  }[k]
                )
              : {
                  flowId: doc.flowId,
                  nodeId: node.id,
                  criterionId: criterion.id,
                  ...selected
                }[k] !== v
          )
        )
          continue
        const key = digest(selected)
        if (identities.has(key)) throw new Error('Ambiguous portable selector')
        identities.add(key)
        const inputs = [
          ...new Set([
            selected.file,
            selected.config,
            ...(node.actions ?? [])
              .filter((a) => a.criterionIds.includes(criterion.id))
              .flatMap((a) => a.inputs)
          ])
        ].sort()
        inputs.forEach((input) => dataPath(project.root, input))
        cases.push({
          flowId: doc.flowId,
          nodeId: node.id,
          criterionId: criterion.id,
          selector: selected,
          identity: key,
          revision: doc.revision,
          binding: criterionBinding(
            admitted,
            doc.flowId,
            node.id,
            criterion.id
          ),
          inputs
        })
      }
    }
  }
  if (!cases.length)
    throw new Error('No portable criteria match the requested scope')
  return { cases, snapshot, store }
}
function capture(project, filter = {}) {
  const { cases } = selection(project, filter)
  // One fingerprint for the declared execution scope, not one recursive scan per case.
  const inputs = [...new Set(cases.flatMap((c) => c.inputs))].sort()
  return {
    schemaVersion: 1,
    projectId: project.projectId,
    executionId: randomUUID(),
    filter,
    cases,
    inputs,
    fingerprint: fingerprintPaths(project.root, inputs).digest
  }
}
function publish(project, receipt, records, diagnostic = '') {
  if (
    !receipt ||
    receipt.schemaVersion !== 1 ||
    receipt.projectId !== project.projectId ||
    typeof receipt.executionId !== 'string' ||
    !Array.isArray(records)
  )
    throw new Error('Invalid execution receipt')
  const { cases, snapshot, store } = selection(project, receipt.filter)
  if (
    digest(cases) !== digest(receipt.cases) ||
    digest([...new Set(cases.flatMap((c) => c.inputs))].sort()) !==
      digest(receipt.inputs)
  )
    throw new Error('Stale execution receipt or changed scope')
  const changed =
    fingerprintPaths(project.root, receipt.inputs).digest !==
    receipt.fingerprint
  const admitted = admitProject(snapshot.documents),
    results = []
  const known = new Set(cases.map((c) => c.identity))
  const unknown = records.filter(
    (r) => !known.has(digest(r.selector)) && r.status === 'failed'
  )
  for (const doc of snapshot.documents) {
    const own = cases.filter((c) => c.flowId === doc.flowId)
    if (!own.length) continue
    const values = [],
      warnings = []
    for (const c of own) {
      const matching = records.filter((r) => digest(r.selector) === c.identity)
      const complete =
        !changed &&
        matching.length === 1 &&
        ['passed', 'failed'].includes(matching[0].status) &&
        (!diagnostic || matching[0].status === 'failed')
      if (complete) {
        const record = matching[0],
          details = record.details ?? []
        if (
          !Array.isArray(details) ||
          details.some((d) => typeof d !== 'string')
        )
          throw new Error('Invalid execution diagnostics')
        values.push({
          nodeId: c.nodeId,
          criterionId: c.criterionId,
          kind: 'automated',
          status: record.status,
          binding: c.binding,
          actor: c.selector.producer,
          executionId: receipt.executionId,
          caseId: c.identity,
          summary: stripVTControlCharacters(
            record.summary || details.join('\n') || 'Test ' + record.status
          )
            .split('\n')
            .filter((line) => line.trim() && !/^\s*at\s/.test(line))
            .slice(0, 4)
            .join('\n')
            .slice(0, 600),
          details,
          at: new Date().toISOString()
        })
      } else {
        warnings.push({
          id: 'producer-' + c.identity.slice(0, 24),
          nodeId: c.nodeId,
          kind: 'producer',
          summary: changed
            ? 'Source changed during execution; result not adopted'
            : diagnostic ||
              (matching.length > 1
                ? 'Ambiguous test result'
                : 'No completed test result for the selected criterion'),
          criterionIds: [c.criterionId],
          executionId: receipt.executionId,
          binding: nodeBinding(admitted, doc.flowId, c.nodeId)
        })
      }
    }
    if (unknown.length)
      warnings.push({
        id: 'unmapped-' + digest(receipt.filter).slice(0, 24),
        nodeId: 'integration',
        kind: 'unmapped',
        summary:
          'Execution contains unmapped failures; update the explicit contract before resolving',
        details: unknown.flatMap((r) => r.details ?? []).slice(0, 10000),
        criterionIds: [],
        executionId: receipt.executionId,
        binding: nodeBinding(admitted, doc.flowId, 'integration')
      })
    const resolvedWarnings = doc.current.warnings
      .filter(
        (w) =>
          ['producer', 'discovery'].includes(w.kind) &&
          w.criterionIds.length &&
          w.criterionIds.every((id) =>
            values.some((v) => v.nodeId === w.nodeId && v.criterionId === id)
          )
      )
      .map((w) => w.id)
    results.push(
      store.update(doc.flowId, {
        expectedRevision: doc.revision,
        kind: 'producer',
        values,
        warnings,
        resolvedWarnings
      })
    )
  }
  return results
}
function relativeFile(project, file, cwd) {
  const absolute = path.isAbsolute(file)
    ? file
    : path.resolve(project.root, cwd, file)
  const relative = path
    .relative(project.root, absolute)
    .split(path.sep)
    .join('/')
  dataPath(project.root, relative)
  return relative
}
function normalize(project, report, scope) {
  const { producer, config, cwd } = scope
  const records = []
  if (producer === 'vitest') {
    if (!report || !Array.isArray(report.testResults))
      throw new Error('Invalid Vitest JSON report')
    for (const file of report.testResults) {
      if (!Array.isArray(file.assertionResults))
        throw new Error('Invalid Vitest file result')
      for (const result of file.assertionResults)
        records.push({
          selector: {
            producer,
            config,
            cwd,
            file: relativeFile(project, file.name, cwd),
            title: result.fullName,
            project: file.projectName ?? scope.project
          },
          status: result.status,
          details: result.failureMessages ?? []
        })
    }
  } else if (producer === 'playwright') {
    if (!report || !Array.isArray(report.suites) || !report.config?.rootDir)
      throw new Error('Invalid Playwright JSON report')
    const walk = (suite, titles) => {
      for (const spec of suite.specs ?? [])
        for (const test of spec.tests ?? []) {
          const results = test.results ?? []
          records.push({
            selector: {
              producer,
              config,
              cwd,
              file: relativeFile(
                project,
                path.resolve(report.config.rootDir, spec.file),
                cwd
              ),
              title: [...titles, spec.title].join(' '),
              project: test.projectName ?? ''
            },
            status: results.some((r) =>
              ['failed', 'timedOut'].includes(r.status)
            )
              ? 'failed'
              : results.at(-1)?.status,
            details: results.flatMap((r) =>
              (r.errors ?? []).map((e) => e.message ?? String(e))
            )
          })
        }
      for (const child of suite.suites ?? [])
        walk(child, [...titles, child.title])
    }
    for (const suite of report.suites) walk(suite, [])
  } else throw new Error('Unsupported runner')
  return records
}
function reportDiagnostic(report, records) {
  if (report.errors?.length)
    return (
      'Runner reported execution errors: ' +
      report.errors
        .map((e) => e.message || String(e))
        .join('\n')
        .slice(0, 1000)
    )
  if (
    report.numFailedTestSuites >
      records.filter((r) => r.status === 'failed').length ||
    (report.success === false && !records.some((r) => r.status === 'failed'))
  )
    return 'Runner reported an incomplete or failed suite outside completed assertions'
  return ''
}
module.exports = {
  selector,
  selection,
  capture,
  publish,
  normalize,
  reportDiagnostic
}

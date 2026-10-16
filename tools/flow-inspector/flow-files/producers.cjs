/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'),
  path = require('node:path')
const { digest, nodeBinding } = require('./policy.cjs')
const { admitProject } = require('./schema.cjs')
const { openProject } = require('./store.cjs')
const artifacts = require('./artifacts.cjs')
const criterionId = (contract, candidate) =>
  'case-' + digest([contract.manifestPath, candidate.id]).slice(0, 24)
function fromContracts(contracts, projectId) {
  const docs = new Map()
  for (const contract of contracts) {
    let doc = docs.get(contract.targetId)
    if (!doc) {
      doc = {
        schemaVersion: 1,
        projectId,
        flowId: contract.targetId,
        revision: 0,
        definition: {
          title: contract.architectureDefinition.target.title,
          purpose: contract.architectureDefinition.target.subtitle,
          nodes: contract.architectureDefinition.steps.map((s) => ({
            id: s.id,
            title: s.title,
            objective: s.purpose,
            owner: s.ownerPackage,
            required: true,
            applicable: true,
            dependsOn: [],
            criteria: [],
            specRefs: s.specRefs.map((ref) =>
              ref.startsWith('#') ? contract.specPath + ref : ref
            ),
            implementationRefs: s.implementationBoundary,
            actions: []
          })),
          criteria: [],
          architecture: structuredClone(contract.architectureDefinition)
        },
        current: {
          observations: [],
          notes: [],
          progress: [],
          sources: [],
          warnings: []
        }
      }
      docs.set(doc.flowId, doc)
    } else if (
      digest(doc.definition.architecture) !==
      digest(contract.architectureDefinition)
    )
      throw new Error('Conflicting architecture for target')
    for (const candidate of contract.cases) {
      const node = doc.definition.nodes.find((n) => n.id === candidate.stepId),
        id = criterionId(contract, candidate)
      if (node.criteria.some((c) => c.id === id)) continue
      node.criteria.push({
        id,
        title: candidate.testName,
        kind: 'automated',
        selector: {
          producer: contract.runner,
          identity: JSON.stringify([
            candidate.testFile ?? contract.testFile,
            candidate.testName,
            candidate.projectName ?? ''
          ])
        }
      })
      node.actions.push({
        id,
        label: candidate.testName,
        kind: 'command',
        argv: [
          'node',
          'tools/flow-inspector/flow-files/producer-cli.cjs',
          contract.manifestPath,
          candidate.id,
          candidate.projectName ?? ''
        ],
        cwd: '.',
        inputs: [
          ...new Set([
            'package.json',
            'yarn.lock',
            contract.manifestPath,
            contract.architecturePath,
            contract.specPath,
            contract.configFile,
            candidate.testFile ?? contract.testFile,
            ...(contract.observationInputs ?? []),
            ...contract.runtimeScope.steps.flatMap((step) =>
              step.implementationBoundary.map((boundary) =>
                boundary.replace(/\/\*\*$/, '')
              )
            )
          ])
        ],
        criterionIds: [id]
      })
    }
  }
  for (const doc of docs.values())
    for (const node of doc.definition.nodes)
      if (!node.criteria.length)
        node.criteria.push({
          id: 'manual-acceptance',
          title: 'Verify declared responsibility',
          kind: 'manual'
        })
  const result = [...docs.values()]
  admitProject(result)
  return result
}
function capture(directory) {
  const snapshot = openProject(directory).snapshot(),
    project = admitProject(snapshot.documents)
  return {
    directory: path.resolve(directory),
    flows: Object.fromEntries(
      snapshot.documents.map((doc) => [
        doc.flowId,
        {
          revision: doc.revision,
          bindings: Object.fromEntries(
            [...doc.definition.nodes.map((n) => n.id), 'integration'].map(
              (id) => [id, nodeBinding(project, doc.flowId, id)]
            )
          )
        }
      ])
    )
  }
}
function participatingCases(record) {
  const intended = record.intent?.cases
  return record.cases.filter(
    (item) =>
      !(
        intended?.length &&
        ['skipped', 'pending', 'todo'].includes(item.status) &&
        !intended.some(
          (selection) =>
            selection.file === item.file &&
            selection.testName === item.testName &&
            selection.projectName === item.projectName
        )
      )
  )
}
function updatesFor(record, documents, bindingFor) {
  const updates = new Map(
    documents.map((doc) => [doc.flowId, { values: [], warnings: [] }])
  )
  for (const item of record.cases) {
    if (
      item.resolution !== 'mapped' ||
      item.locations.length !== 1 ||
      !['passed', 'failed'].includes(item.status)
    )
      continue
    const location = item.locations[0],
      contract = record.contracts.find(
        (c) => c.digest === location.contractDigest
      ),
      candidate = contract?.cases.find((c) => c.id === location.caseId)
    if (!candidate) continue
    const doc = documents.find((d) => d.flowId === location.targetId),
      node = doc?.definition.nodes.find((n) => n.id === location.stepId),
      id = criterionId(contract, candidate)
    if (!node?.criteria.some((c) => c.id === id))
      throw new Error('Flow definition does not contain mapped criterion')
    if (
      digest(doc.definition.architecture) !==
      digest(contract.architectureDefinition)
    )
      throw new Error(
        'Mapped result architecture differs from current flow contract'
      )
    const criterion = node.criteria.find((c) => c.id === id)
    if (
      criterion.selector?.producer !== contract.runner ||
      criterion.selector?.identity !==
        JSON.stringify([
          candidate.testFile ?? contract.testFile,
          candidate.testName,
          candidate.projectName ?? ''
        ])
    )
      throw new Error(
        'Mapped result selector differs from current flow contract'
      )
    updates.get(doc.flowId).values.push({
      nodeId: node.id,
      criterionId: id,
      kind: 'automated',
      status: item.status,
      binding: bindingFor(doc.flowId, node.id),
      actor: contract.runner,
      executionId: process.env.FLOW_EXECUTION_ID ?? record.id,
      caseId: JSON.stringify([item.file, item.testName, item.projectName]),
      summary: item.failures[0] ?? item.status,
      details: [
        ...(item.failures ?? []),
        ...(item.failureDetails ?? []).map((d) => JSON.stringify(d))
      ],
      attachments: record.flowAttachments ?? [],
      at: record.finishedAt ?? record.startedAt
    })
  }
  const unresolved = participatingCases(record).filter(
    (i) =>
      i.resolution !== 'mapped' ||
      i.locations.length !== 1 ||
      !['passed', 'failed'].includes(i.status)
  )
  if (
    record.issues.length ||
    record.executionFailureDetails?.length ||
    unresolved.length
  ) {
    const intended = record.intent?.cases ?? []
    const scopes = new Map()
    let unknown = !intended.length
    for (const identity of intended) {
      const matches = record.contracts.flatMap((contract) =>
        contract.cases
          .filter(
            (candidate) =>
              (candidate.testFile ?? contract.testFile) === identity.file &&
              candidate.testName === identity.testName &&
              (candidate.projectName ?? '') === identity.projectName
          )
          .map((candidate) => ({ contract, candidate }))
      )
      if (matches.length !== 1) {
        unknown = true
        continue
      }
      const { contract, candidate } = matches[0],
        key = contract.targetId + '/' + candidate.stepId
      if (!scopes.has(key))
        scopes.set(key, {
          flow: contract.targetId,
          node: candidate.stepId,
          criteria: []
        })
      scopes.get(key).criteria.push(criterionId(contract, candidate))
    }
    const summary = [
      ...record.issues,
      ...(record.executionFailureDetails ?? []).map((detail) =>
        JSON.stringify(detail)
      ),
      ...unresolved.map((i) =>
        [
          i.testName + ': ' + i.resolution + ' - ' + i.status,
          ...(i.failures ?? []),
          ...(i.failureDetails ?? []).map((detail) => JSON.stringify(detail))
        ].join('\n')
      )
    ].join('\n')
    if (unknown) {
      for (const doc of documents.filter((d) =>
        record.contracts.some((c) => c.targetId === d.flowId)
      ))
        scopes.set(doc.flowId + '/integration', {
          flow: doc.flowId,
          node: 'integration',
          criteria: []
        })
    }
    for (const scope of scopes.values()) {
      updates.get(scope.flow)?.warnings.push({
        id:
          'producer-' +
          digest([
            scope.node,
            scope.criteria.sort(),
            record.contracts.map((c) => c.manifestPath).sort()
          ]).slice(0, 24),
        nodeId: scope.node,
        kind: 'producer',
        summary,
        criterionIds: [...new Set(scope.criteria)],
        executionId: record.id,
        binding: bindingFor(scope.flow, scope.node)
      })
    }
  }

  return updates
}
function publish(record, captured, root) {
  const store = openProject(captured.directory),
    snapshot = store.snapshot()
  for (const doc of snapshot.documents)
    if (
      record.contracts.some((c) => c.targetId === doc.flowId) &&
      captured.flows[doc.flowId]?.revision !== doc.revision
    )
      throw new Error('Document revision conflict')
  const retained = record.retainedArtifacts?.length
    ? artifacts.retain(captured.directory, root, record.retainedArtifacts)
    : []
  const updates = updatesFor(
    { ...record, flowAttachments: retained },
    snapshot.documents,
    (flow, id) => captured.flows[flow]?.bindings[id] ?? ''
  )
  try {
    for (const [flow, update] of updates) {
      if (!update.values.length && !update.warnings.length) continue
      store.update(flow, {
        expectedRevision: captured.flows[flow]?.revision,
        kind: 'producer',
        values: update.values,
        resolvedWarnings: update.warnings.length
          ? []
          : snapshot.documents
              .find((doc) => doc.flowId === flow)
              .current.warnings.filter(
                (w) =>
                  ['producer', 'discovery'].includes(w.kind) &&
                  w.criterionIds.length &&
                  w.criterionIds.every((id) =>
                    update.values.some(
                      (o) => o.nodeId === w.nodeId && o.criterionId === id
                    )
                  )
              )
              .map((w) => w.id),
        warnings: update.warnings
      })
    }
    return store.snapshot().evaluation
  } finally {
    artifacts.prune(
      captured.directory,
      retained.map((a) => a.path),
      store.snapshot().documents
    )
  }
}
function migrate(root, directory, contracts, projectId) {
  if (fs.existsSync(directory) && fs.readdirSync(directory).length)
    throw new Error('Migration destination must be empty')
  const localization = require('../control-plane/localization.cjs'),
    reader = localization.createObservationReader(
      localization.observationDirectory(root)
    ),
    current = reader.list()
  if (current.issues.length)
    throw new Error(
      'Old current projection is invalid: ' + current.issues.join('; ')
    )
  const documents = fromContracts(contracts, projectId),
    project = admitProject(documents)
  const bindings = new Map(
    documents.map((d) => [
      d.flowId,
      Object.fromEntries(
        [...d.definition.nodes.map((n) => n.id), 'integration'].map((id) => [
          id,
          nodeBinding(project, d.flowId, id)
        ])
      )
    ])
  )
  const records = current.runs.map((r) => reader.get(r.id)),
    selectedIds = new Set(current.currentCases.map((c) => c.id))
  const pendingArtifacts = []
  for (const record of records) {
    const warning = current.warningGroups.current.find(
      (g) => g.runId === record.id
    )
    const selected = record.cases.filter((c) => selectedIds.has(c.id))
    if (
      selected.length &&
      record.source &&
      localization.sourceFingerprint(root, record.contracts).digest !==
        record.source.digest
    )
      throw new Error(
        'Current source differs from retained evidence; rerun before projection'
      )
    if (selected.length && record.retainedArtifacts?.length)
      pendingArtifacts.push(record)
    const filtered = {
      ...record,
      cases: selected,
      issues: warning?.issues ?? [],
      executionFailureDetails: warning?.executionFailureDetails ?? []
    }
    const updates = updatesFor(
      filtered,
      documents,
      (flow, node) => bindings.get(flow)[node]
    )
    for (const doc of documents) {
      const update = updates.get(doc.flowId)
      for (const value of update.values) {
        const old = doc.current.observations.find(
          (o) =>
            o.nodeId === value.nodeId && o.criterionId === value.criterionId
        )
        if (old)
          throw new Error(
            'Ambiguous old current evidence requires explicit resolution'
          )
        doc.current.observations.push(value)
      }
      doc.current.warnings.push(...update.warnings)
    }
  }
  admitProject(documents)
  fs.mkdirSync(directory, { recursive: true })
  for (const record of pendingArtifacts) {
    const retained = artifacts.retain(directory, root, record.retainedArtifacts)
    for (const doc of documents)
      for (const observation of doc.current.observations)
        if (observation.executionId === record.id)
          observation.attachments = retained
  }
  admitProject(documents)
  for (const doc of documents)
    fs.writeFileSync(
      path.join(directory, doc.flowId + '.flow.json'),
      JSON.stringify(doc, null, 2) + '\n',
      { flag: 'wx' }
    )
  return openProject(directory).snapshot()
}
module.exports = {
  fromContracts,
  capture,
  publish,
  migrate,
  criterionId,
  participatingCases
}

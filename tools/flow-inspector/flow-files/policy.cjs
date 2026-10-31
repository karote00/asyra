/* eslint-disable @typescript-eslint/no-require-imports */
const { createHash } = require('node:crypto')
const stable = (value) => {
  if (Array.isArray(value)) {
    return value.map(stable)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, stable(value[k])])
    )
  }
  return value
}
const digest = (value) =>
  createHash('sha256')
    .update(JSON.stringify(stable(value)))
    .digest('hex')
function bindings(project) {
  const signatures = new Map()
  function get(flowId, nodeId) {
    const key = flowId + '/' + nodeId
    if (signatures.has(key)) {
      return signatures.get(key)
    }
    const doc = project.flows.get(flowId)
    if (!doc) {
      throw new Error('Unknown flow')
    }
    let definition, dependencies
    if (nodeId === 'integration') {
      definition = doc.definition.criteria
      dependencies = doc.definition.nodes
        .filter((n) => n.required)
        .map((n) => ({ flowId, nodeId: n.id }))
    } else {
      const entry = project.nodes.get(key)
      if (!entry) {
        throw new Error('Unknown node')
      }
      const architecture = doc.definition.architecture
      definition = {
        ...entry.node,
        architecture: architecture
          ? {
              step: architecture.steps.find((s) => s.id === nodeId),
              routes: architecture.routes.filter(
                (r) => r.from === nodeId || r.to === nodeId
              ),
              artifacts: architecture.artifacts.filter(
                (a) =>
                  a.ownerStepId === nodeId || a.consumerStepIds.includes(nodeId)
              ),
              invariants: architecture.invariants.filter((i) =>
                i.stepIds.includes(nodeId)
              ),
              acceptanceContracts: architecture.acceptanceContracts.filter(
                (c) => c.stepIds.includes(nodeId)
              )
            }
          : null
      }
      dependencies = entry.node.dependsOn
    }
    const upstream = dependencies.map((ref) => {
      const other = project.flows.get(ref.flowId)
      return {
        ref,
        binding: get(ref.flowId, ref.nodeId),
        observations: other.current.observations.filter(
          (o) => o.nodeId === ref.nodeId
        ),
        warnings: other.current.warnings.filter((o) => o.nodeId === ref.nodeId)
      }
    })
    const result = digest({
      projectId: doc.projectId,
      flowId,
      nodeId,
      definition,
      source:
        doc.current.sources.find((s) => s.nodeId === nodeId)?.revision ?? null,
      upstream
    })
    signatures.set(key, result)
    return result
  }
  return get
}
const nodeBinding = (project, flowId, nodeId) =>
  bindings(project)(flowId, nodeId)
function criterionBinding(project, flowId, nodeId, criterionId, base) {
  const signature = base ?? nodeBinding(project, flowId, nodeId)
  const doc = project.flows.get(flowId)
  const criteria =
    project.nodes.get(flowId + '/' + nodeId)?.node.criteria ??
    doc.definition.criteria
  const criterion = criteria.find((c) => c.id === criterionId)
  if (!criterion) {
    throw new Error('Unknown criterion')
  }
  if (
    criterion.kind !== 'manual' ||
    !criteria.some((c) => c.kind === 'automated')
  ) {
    return signature
  }
  return digest({
    signature,
    automated: doc.current.observations.filter(
      (o) => o.nodeId === nodeId && o.kind === 'automated'
    )
  })
}
function evaluateProject(project) {
  const binding = bindings(project),
    evaluated = new Map()
  function evaluate(flowId, nodeId) {
    const key = flowId + '/' + nodeId
    if (evaluated.has(key)) {
      return evaluated.get(key)
    }
    const doc = project.flows.get(flowId),
      node = project.nodes.get(key)?.node
    const criteria = node?.criteria ?? doc.definition.criteria
    const signature = binding(flowId, nodeId)
    const dependencies =
      node?.dependsOn ??
      doc.definition.nodes
        .filter((n) => n.required)
        .map((n) => ({ flowId, nodeId: n.id }))
    const upstream = dependencies.map((ref) => evaluate(ref.flowId, ref.nodeId))
    const observations = doc.current.observations.filter(
      (o) => o.nodeId === nodeId
    )
    const warnings = doc.current.warnings.filter((o) => o.nodeId === nodeId)
    const results = criteria.map((c) => {
      const observed = observations.find((o) => o.criterionId === c.id)
      const expectedBinding = criterionBinding(
        project,
        flowId,
        nodeId,
        c.id,
        signature
      )
      let status = 'missing'
      if (observed) {
        status = observed.status
        if (observed.binding !== expectedBinding) {
          status = 'stale'
        }
      }
      return {
        ...c,
        binding: expectedBinding,
        status,
        satisfied: status === 'passed' || status === 'accepted',
        observation: observed ?? null
      }
    })
    const progress = doc.current.progress.find((p) => p.nodeId === nodeId)
    const blockers = [
      ...(progress?.status === 'blocked'
        ? [progress.reason ?? 'Task is explicitly blocked']
        : []),
      ...(node?.applicable === null
        ? ['Applicability requires a decision']
        : []),
      ...upstream
        .filter(
          (n) =>
            n.status !== 'done' &&
            !(nodeId === 'integration' && n.status === 'excluded')
        )
        .map((n) => 'Prerequisite ' + n.id + ' - ' + n.status)
    ]
    const blocked =
      progress?.status === 'blocked' ||
      (node && node.applicable === null) ||
      upstream.some(
        (n) =>
          n.status !== 'done' &&
          !(nodeId === 'integration' && n.status === 'excluded')
      )
    let evidence = 'passing'
    if (results.some((c) => c.status === 'missing')) {
      evidence = 'missing'
    }
    if (results.some((c) => ['incomplete', 'reopened'].includes(c.status))) {
      evidence = 'incomplete'
    }
    if (results.some((c) => c.status === 'stale')) {
      evidence = 'stale'
    }
    if (results.some((c) => ['failed', 'rejected'].includes(c.status))) {
      evidence = 'failing'
    }
    if (warnings.length && evidence !== 'failing') {
      evidence = 'incomplete'
    }
    let status =
      doc.current.progress.find((p) => p.nodeId === nodeId)?.status ??
      'not-started'
    if (results.every((c) => c.satisfied) && !warnings.length && !blocked) {
      status = 'done'
    } else if (evidence === 'failing') {
      status = 'failed'
    } else if (evidence === 'stale') {
      status = 'stale'
    } else if (results.some((c) => c.kind === 'manual' && !c.satisfied)) {
      status = 'awaiting-manual'
    }
    if ((blocked || warnings.length) && evidence !== 'failing') {
      status = 'blocked'
    }
    if (node?.applicable === false) {
      status = 'excluded'
    }
    const result = {
      id: nodeId,
      title: node?.title ?? 'Feature integration',
      status,
      evidence,
      binding: signature,
      criteria: results,
      context: {
        projectId: doc.projectId,
        flowId,
        nodeId,
        revision: doc.revision,
        binding: signature,
        status,
        blockers,
        failureOwner:
          doc.definition.architecture?.steps.find((s) => s.id === nodeId)
            ?.failureOwnerStepId ?? nodeId,
        errors: results
          .filter((c) => !c.satisfied)
          .sort(
            (a, b) =>
              Number(!['failed', 'rejected'].includes(a.status)) -
              Number(!['failed', 'rejected'].includes(b.status))
          )
          .map((c) => ({
            criterionId: c.id,
            status: c.status,
            summary: c.observation?.summary ?? 'No current evidence',
            details: c.observation?.details ?? []
          })),
        warnings,
        observations,
        specRefs: node?.specRefs ?? [],
        implementationRefs: node?.implementationRefs ?? [],
        actions: node?.actions ?? [],
        criteria: results.map((c) => ({
          id: c.id,
          kind: c.kind,
          status: c.status,
          binding: c.binding,
          actor: c.observation?.actor ?? null,
          executionId: c.observation?.executionId ?? null,
          caseId: c.observation?.caseId ?? null
        })),
        manualCriteria: results
          .filter((c) => c.kind === 'manual')
          .map((c) => c.id),
        notes: doc.current.notes.filter((n) => n.nodeId === nodeId)
      }
    }
    evaluated.set(key, result)
    return result
  }
  const flows = project.documents.map((doc) => {
    const nodes = doc.definition.nodes.map((n) => evaluate(doc.flowId, n.id)),
      integration = evaluate(doc.flowId, 'integration')
    let status = integration.status
    if (status !== 'done' && status !== 'failed') {
      const required = nodes.filter(
        (n) => doc.definition.nodes.find((d) => d.id === n.id).required
      )
      if (required.some((n) => n.status === 'failed')) {
        status = 'failed'
      } else if (required.some((n) => n.status === 'stale')) {
        status = 'stale'
      } else if (required.some((n) => n.status === 'blocked')) {
        status = 'blocked'
      } else if (required.some((n) => n.status === 'awaiting-manual')) {
        status = 'awaiting-manual'
      }
    }
    return {
      id: doc.flowId,
      title: doc.definition.title,
      revision: doc.revision,
      status,
      nodes,
      integration
    }
  })
  return { projectId: project.documents[0].projectId, flows }
}
// Classify only the required dependency closure. A manual exemption never masks
// missing automated evidence, explicit blockers, warnings or rejected decisions.
function gateSummary(snapshot, manualPolicy = 'required') {
  if (!['required', 'nonblocking'].includes(manualPolicy)) {
    throw new Error('Unknown manual policy')
  }
  const evaluated = new Map(),
    definitions = new Map()
  for (const flow of snapshot.evaluation.flows) {
    for (const node of [...flow.nodes, flow.integration]) {
      evaluated.set(flow.id + '/' + node.id, node)
    }
  }
  for (const doc of snapshot.documents) {
    for (const node of doc.definition.nodes) {
      definitions.set(doc.flowId + '/' + node.id, { doc, node })
    }
  }
  let pending = false,
    unsatisfied = false
  const visited = new Set()
  function visit(flowId, nodeId, integration = false) {
    const key = flowId + '/' + nodeId
    const result = evaluated.get(key)
    const entry = definitions.get(key)
    if (!result) {
      throw new Error('Missing evaluated node')
    }
    if (result.status === 'excluded') {
      if (!integration) {
        unsatisfied = true
      }
      return
    }
    if (visited.has(key)) {
      return
    }
    visited.add(key)
    const doc = snapshot.documents.find((d) => d.flowId === flowId)
    if (
      result.context.warnings.length ||
      entry?.node.applicable === null ||
      doc.current.progress.some(
        (p) => p.nodeId === nodeId && p.status === 'blocked'
      )
    ) {
      unsatisfied = true
    }
    for (const criterion of result.criteria) {
      if (criterion.satisfied) {
        continue
      }
      if (
        criterion.kind === 'manual' &&
        ['missing', 'reopened'].includes(criterion.status)
      ) {
        pending = true
      } else {
        unsatisfied = true
      }
    }
    for (const dependency of entry?.node.dependsOn ?? []) {
      visit(dependency.flowId, dependency.nodeId)
    }
  }
  for (const doc of snapshot.documents) {
    visit(doc.flowId, 'integration')
    for (const node of doc.definition.nodes.filter((n) => n.required)) {
      visit(doc.flowId, node.id, true)
    }
  }
  let status = pending ? 'awaiting-manual' : 'satisfied'
  let exitCode = pending && manualPolicy === 'required' ? 3 : 0
  if (unsatisfied) {
    status = 'unsatisfied'
    exitCode = 1
  }
  return {
    projectId: snapshot.evaluation.projectId,
    status,
    manualPolicy,
    exitCode,
    flows: snapshot.evaluation.flows.map(({ id, status }) => ({ id, status }))
  }
}
module.exports = {
  digest,
  nodeBinding,
  criterionBinding,
  evaluateProject,
  gateSummary
}

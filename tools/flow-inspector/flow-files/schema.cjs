/* eslint-disable @typescript-eslint/no-require-imports */
const schema = require('./flow.schema.json')
const fail = (location, message) => {
  throw new Error(location + ': ' + message)
}
const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
function validate(value, rule = schema, location = '$') {
  if (rule.$ref)
    return validate(value, schema.$defs[rule.$ref.split('/').pop()], location)
  if (Object.hasOwn(rule, 'const') && value !== rule.const)
    fail(location, 'Unsupported value')
  if (rule.enum && !rule.enum.includes(value))
    fail(location, 'Unsupported value')
  if (rule.type) {
    const valid = [].concat(rule.type).some((type) => {
      if (type === 'null') return value === null
      if (type === 'array') return Array.isArray(value)
      if (type === 'object') return isObject(value)
      if (type === 'integer') return Number.isSafeInteger(value)
      return typeof value === type
    })
    if (!valid) fail(location, 'Invalid type')
  }
  if (
    typeof value === 'number' &&
    rule.minimum !== undefined &&
    value < rule.minimum
  )
    fail(location, 'Below minimum')
  if (typeof value === 'string') {
    if (
      (rule.minLength && value.trim().length < rule.minLength) ||
      value.length > (rule.maxLength ?? Infinity)
    )
      fail(location, 'Invalid length')
    if (rule.pattern && !new RegExp(rule.pattern).test(value))
      fail(location, 'Invalid format')
  }
  if (Array.isArray(value)) {
    if (value.length > (rule.maxItems ?? Infinity))
      fail(location, 'Too many entries')
    if (rule.items)
      value.forEach((item, index) =>
        validate(item, rule.items, location + '[' + index + ']')
      )
  }
  if (isObject(value)) {
    for (const key of rule.required ?? [])
      if (!Object.hasOwn(value, key))
        fail(location + '.' + key, 'Required field')
    for (const [key, item] of Object.entries(value)) {
      if (Object.hasOwn(rule.properties ?? {}, key))
        validate(item, rule.properties[key], location + '.' + key)
      else if (rule.additionalProperties === false)
        fail(location + '.' + key, 'Unknown field')
    }
  }
  return value
}
function unique(items, key, location) {
  const seen = new Set()
  for (const item of items) {
    const id = key(item)
    if (seen.has(id)) fail(location, 'Duplicate identity ' + id)
    seen.add(id)
  }
}
function architecture(value, nodes, location) {
  const required = [
    'schema',
    'target',
    'authority',
    'links',
    'lanes',
    'steps',
    'routes',
    'artifacts',
    'invariants',
    'acceptanceContracts'
  ]
  if (
    !isObject(value) ||
    required.some((k) => !Object.hasOwn(value, k)) ||
    Object.keys(value).some((k) => !required.includes(k))
  )
    fail(location, 'Invalid architecture fields')
  if (value.schema?.id !== 'flow-inspector' || value.schema.version !== 2)
    fail(location, 'Unsupported architecture')
  for (const key of required.slice(3)) {
    if (!Array.isArray(value[key])) fail(location + '.' + key, 'Expected array')
    unique(value[key], (x) => x.id, location + '.' + key)
  }
  const stepIds = new Set(value.steps.map((s) => s.id)),
    laneIds = new Set(value.lanes.map((s) => s.id)),
    artifactIds = new Set(value.artifacts.map((a) => a.id))
  const has = (set, id) => {
    if (!set.has(id)) fail(location, 'Unresolved architecture reference ' + id)
  }
  if (stepIds.size !== nodes.length)
    fail(location, 'Architecture steps must match task nodes')
  nodes.forEach((n) => has(stepIds, n.id))
  for (const step of value.steps) {
    for (const field of [
      'id',
      'title',
      'ownerPackage',
      'purpose',
      'failureOwnerStepId',
      'laneId'
    ])
      if (typeof step[field] !== 'string' || !step[field].trim())
        fail(location, 'Missing step ' + field)
    if (!Number.isFinite(step.order)) fail(location, 'Invalid step order')
    for (const field of [
      'inputs',
      'outputs',
      'conditions',
      'bypasses',
      'allowedContributors',
      'forbiddenContributors',
      'cacheDimensions',
      'implementationBoundary',
      'specRefs'
    ])
      if (
        !Array.isArray(step[field]) ||
        step[field].some((v) => typeof v !== 'string')
      )
        fail(location, 'Invalid step ' + field)
    has(stepIds, step.failureOwnerStepId)
    has(laneIds, step.laneId)
    step.outputs.forEach((id) => has(artifactIds, id))
    step.inputs
      .filter((id) => id.startsWith('artifact:'))
      .forEach((id) => has(artifactIds, id))
  }
  for (const route of value.routes) {
    has(stepIds, route.from)
    if (route.to !== undefined) has(stepIds, route.to)
    if (!Array.isArray(route.producedArtifacts))
      fail(location, 'Missing route artifacts')
    route.producedArtifacts.forEach((id) => {
      has(artifactIds, id)
      const artifact = value.artifacts.find((a) => a.id === id)
      if (
        artifact.ownerStepId !== route.from ||
        (route.to && !artifact.consumerStepIds.includes(route.to))
      )
        fail(location, 'Invalid route artifact ownership')
    })
  }
  for (const artifact of value.artifacts) {
    has(stepIds, artifact.ownerStepId)
    if (!Array.isArray(artifact.consumerStepIds))
      fail(location, 'Missing artifact consumers')
    if (
      !value.steps
        .find((s) => s.id === artifact.ownerStepId)
        .outputs.includes(artifact.id)
    )
      fail(location, 'Artifact missing owner output')
    if (!artifact.terminal && !artifact.consumerStepIds.length)
      fail(location, 'Artifact missing consumer')
    artifact.consumerStepIds.forEach((id) => {
      has(stepIds, id)
      if (!value.steps.find((s) => s.id === id).inputs.includes(artifact.id))
        fail(location, 'Artifact missing consumer input')
    })
  }
  for (const item of [...value.invariants, ...value.acceptanceContracts]) {
    if (!Array.isArray(item.stepIds))
      fail(location, 'Missing contract step references')
    item.stepIds.forEach((id) => has(stepIds, id))
    ;(item.artifactIds ?? []).forEach((id) => has(artifactIds, id))
  }
}
function admitProject(documents) {
  if (!Array.isArray(documents) || !documents.length || documents.length > 1000)
    fail('$', 'Expected nonempty bounded project')
  documents.forEach((d, i) => validate(d, schema, 'files[' + i + ']'))
  unique(documents, (d) => d.flowId, 'flows')
  if (new Set(documents.map((d) => d.projectId)).size !== 1)
    fail('$', 'Mixed project identities')
  const nodes = new Map(),
    flows = new Map()
  for (const doc of documents) {
    flows.set(doc.flowId, doc)
    const base = doc.flowId
    if (!doc.definition.nodes.length) fail(base, 'Empty flow')
    unique(doc.definition.nodes, (n) => n.id, base + '.nodes')
    unique(doc.definition.criteria, (c) => c.id, base + '.criteria')
    for (const node of doc.definition.nodes) {
      if (node.id === 'integration') fail(base, 'Reserved node identity')
      if (!node.criteria.length) fail(base + '.' + node.id, 'Empty acceptance')
      unique(node.criteria, (c) => c.id, base + '.' + node.id + '.criteria')
      unique(node.actions, (a) => a.id, base + '.actions')
      unique(
        node.dependsOn,
        (r) => r.flowId + '/' + r.nodeId,
        base + '.dependsOn'
      )
      for (const action of node.actions) {
        if (
          !action.criterionIds.length ||
          action.criterionIds.some(
            (id) => !node.criteria.some((c) => c.id === id)
          )
        )
          fail(base, 'Invalid action criteria')
        if (
          action.kind === 'command' &&
          (!action.argv?.length || !action.argv[0]?.trim() || !action.cwd)
        )
          fail(base, 'Command requires argv and cwd')
        if (action.kind === 'external' && (!action.instructions || action.argv))
          fail(base, 'External action requires instructions without argv')
      }
      nodes.set(base + '/' + node.id, { doc, node })
    }
    if (
      doc.definition.architecture?.target.id &&
      doc.definition.architecture.target.id !== doc.flowId
    )
      fail(base, 'Architecture target must match flow identity')
    if (doc.definition.architecture)
      architecture(
        doc.definition.architecture,
        doc.definition.nodes,
        base + '.architecture'
      )
    unique(
      doc.current.observations,
      (o) => o.nodeId + '/' + o.criterionId,
      base + '.observations'
    )
    unique(doc.current.notes, (n) => n.id, base + '.notes')
    unique(doc.current.sources, (n) => n.nodeId, base + '.sources')
    unique(doc.current.progress, (n) => n.nodeId, base + '.progress')
    unique(doc.current.warnings, (n) => n.id, base + '.warnings')
    for (const entry of [
      ...doc.current.observations,
      ...doc.current.notes,
      ...doc.current.sources,
      ...doc.current.progress,
      ...doc.current.warnings
    ]) {
      const node = doc.definition.nodes.find((n) => n.id === entry.nodeId)
      if (!node && entry.nodeId !== 'integration')
        fail(base, 'Unknown node reference ' + entry.nodeId)
      const criteria = node?.criteria ?? doc.definition.criteria
      if (entry.criterionId) {
        const c = criteria.find((c) => c.id === entry.criterionId)
        if (!c || c.kind !== entry.kind)
          fail(base, 'Invalid criterion kind or identity')
        const statuses =
          entry.kind === 'manual'
            ? ['accepted', 'rejected', 'reopened']
            : ['passed', 'failed', 'incomplete']
        if (!statuses.includes(entry.status))
          fail(base, 'Invalid criterion outcome kind')
        if (entry.kind === 'automated' && (!entry.executionId || !entry.caseId))
          fail(base, 'Missing automated execution identity')
      }
      if (entry.criterionIds?.some((id) => !criteria.some((c) => c.id === id)))
        fail(base, 'Unknown warning criterion')
    }
  }
  const active = new Set(),
    done = new Set()
  const visit = (key) => {
    if (active.has(key)) fail(key, 'Dependency cycle')
    if (done.has(key)) return
    if (!nodes.has(key)) fail(key, 'Unresolved node reference')
    active.add(key)
    nodes
      .get(key)
      .node.dependsOn.forEach((r) => visit(r.flowId + '/' + r.nodeId))
    active.delete(key)
    done.add(key)
  }
  for (const key of nodes.keys()) visit(key)
  return { documents, flows, nodes }
}
module.exports = { validate, admitProject }

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { validId, writeAtomic } = require('./store.cjs')
const { canonicalFile } = require('./agent-contract.cjs')
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const { sha256, safePath } = require('./snapshot.cjs')
const TARGET_POLICY = freeze({
  format: 1,
  capability: 'manage-flow-target',
  maxWorks: 50
})
const requireValue = (ok, message) => {
  if (!ok) throw new Error('Flow target: ' + message)
}
const object = (value, keys) =>
  requireValue(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).every((key) => keys.includes(key)),
    'invalid fields'
  )
const text = (value, max = 2000) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sameSet = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((x) => b.includes(x))
function validateAllocation(state, binding, previousWorks = []) {
  object(state, ['objective', 'works', 'pending'])
  requireValue(text(state.objective), 'objective required')
  requireValue(
    Array.isArray(state.works) && state.works.length <= TARGET_POLICY.maxWorks,
    'invalid work inventory'
  )
  requireValue(Array.isArray(state.pending), 'pending coverage required')
  const workIds = new Set(),
    assigned = new Set()
  const obligations = new Map(binding.obligations.map((c) => [c.id, c]))
  for (const work of state.works) {
    object(work, [
      'id',
      'title',
      'stepId',
      'obligationIds',
      'scope',
      'allowedFiles',
      'prerequisites',
      'taskIds'
    ])
    requireValue(
      validId(work.id) && !workIds.has(work.id),
      'invalid or duplicate work identity'
    )
    workIds.add(work.id)
    requireValue(
      text(work.title, 200) && text(work.scope),
      'title and scope required'
    )
    const step = binding.steps.find((s) => s.id === work.stepId)
    requireValue(step, 'unknown step')
    requireValue(
      Array.isArray(work.obligationIds) && work.obligationIds.length,
      'obligations required'
    )
    for (const id of work.obligationIds) {
      requireValue(obligations.has(id), 'unknown obligation')
      requireValue(
        obligations.get(id).stepId === work.stepId,
        'obligation step mismatch'
      )
      requireValue(!assigned.has(id), 'responsibility overlap')
      assigned.add(id)
    }
    requireValue(
      Array.isArray(work.allowedFiles) &&
        work.allowedFiles.length > 0 &&
        work.allowedFiles.length <= 10 &&
        new Set(work.allowedFiles).size === work.allowedFiles.length,
      'file scope required'
    )
    for (const file of work.allowedFiles)
      requireValue(
        canonicalFile(file) &&
          /^packages\/factory\/src\/.+\.ts$/.test(file) &&
          !file.includes('/__tests__/') &&
          step.implementationBoundary.some(
            (b) =>
              b === file ||
              (b.endsWith('/**') && file.startsWith(b.slice(0, -2)))
          ),
        'file outside supported runtime scope'
      )
    requireValue(Array.isArray(work.prerequisites), 'prerequisites required')
    requireValue(
      Array.isArray(work.taskIds) &&
        new Set(work.taskIds).size === work.taskIds.length &&
        work.taskIds.every(validId),
      'invalid task links'
    )
    const old = previousWorks.find((w) => w.id === work.id)
    if (old) {
      const promise = (value) =>
        Object.fromEntries(
          Object.entries(value).filter(([key]) => key !== 'taskIds')
        )
      requireValue(
        same(promise(old), promise(work)),
        'work commitment is immutable; use a new work identity'
      )
    }
  }
  for (const id of state.pending) {
    requireValue(obligations.has(id), 'unknown pending obligation')
    requireValue(!assigned.has(id), 'responsibility overlap')
    assigned.add(id)
  }
  requireValue(
    assigned.size === obligations.size,
    'incomplete obligation coverage'
  )
  const byId = new Map(state.works.map((w) => [w.id, w]))
  for (const work of state.works) {
    const seen = new Set()
    for (const dep of work.prerequisites) {
      object(dep, ['workId', 'handoff'])
      requireValue(
        byId.has(dep.workId) && text(dep.handoff) && !seen.has(dep.workId),
        'invalid prerequisite or handoff'
      )
      seen.add(dep.workId)
    }
  }
  const visited = new Set(),
    visiting = new Set()
  const visit = (id) => {
    requireValue(!visiting.has(id), 'dependency cycle')
    if (visited.has(id)) return
    visiting.add(id)
    byId.get(id).prerequisites.forEach((dep) => visit(dep.workId))
    visiting.delete(id)
    visited.add(id)
  }
  workIds.forEach(visit)
}
function createTargetOwner({
  repositoryRoot,
  directory,
  getContracts,
  getBaseline,
  getTask,
  getReview
}) {
  const file = path.join(directory, 'targets.json')
  let records = []
  // The service owns the enclosing store lock; this owner never opens another store.
  if (fs.existsSync(file)) {
    requireValue(!fs.lstatSync(file).isSymbolicLink(), 'symlinked state')
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'))
    requireValue(
      saved.format === TARGET_POLICY.format && Array.isArray(saved.records),
      'invalid retained format'
    )
    records = saved.records
    const ids = new Set(),
      requests = new Set()
    for (const record of records) {
      requireValue(
        validId(record.id) && !ids.has(record.id) && record.history?.length,
        'invalid retained target'
      )
      ids.add(record.id)
      const contract = getContracts().find(
        (c) => c.digest === record.targetRevision
      )
      const flow = contract?.flows.find((f) => f.id === record.flowId)
      requireValue(
        flow &&
          same(
            record.obligations,
            contract.cases.filter((c) => c.flowId === flow.id)
          ) &&
          same(record.steps, flow.steps),
        'retained target revision mismatch'
      )
      let previousWorks = []
      record.history.forEach((entry, index) => {
        requireValue(
          entry.revision === index + 1 &&
            validId(entry.request.requestId) &&
            !requests.has(entry.request.requestId) &&
            text(entry.actor) &&
            text(entry.request.reason) &&
            Number.isFinite(Date.parse(entry.at)),
          'invalid retained decision'
        )
        requireValue(
          entry.fingerprint ===
            sha256(
              JSON.stringify({ request: entry.request, actor: entry.actor })
            ) && entry.stateDigest === sha256(JSON.stringify(entry.state)),
          'retained decision conflict'
        )
        requests.add(entry.request.requestId)
        validateAllocation(entry.state, record, previousWorks)
        previousWorks = [...previousWorks, ...entry.state.works]
      })
    }
  }
  records = freeze(records)
  const find = (id) => {
    const record = records.find((r) => r.id === id)
    requireValue(record, 'target not found')
    return record
  }
  const decisionResult = (record, entry) =>
    freeze({ id: record.id, revision: entry.revision, decision: entry })
  const projections = new Map()
  const projectRevision = (record) => {
    const previous = projections.get(record.id)
    const links = new Map(previous?.links)
    const entries = previous ? [record.history.at(-1)] : record.history
    for (const entry of entries)
      for (const work of entry.state.works)
        for (const taskId of work.taskIds) links.set(taskId, work.id)
    const works = freeze(
      record.history.at(-1).state.works.map((w) => ({
        ...w,
        status: w.prerequisites.length ? 'blocked' : 'pending',
        prerequisites: w.prerequisites.map((dep) => ({
          ...dep,
          status: 'unconfirmed'
        }))
      }))
    )
    projections.set(record.id, { links, works })
  }
  records.forEach(projectRevision)
  const owner = {
    list: () =>
      records.map((r) => ({
        id: r.id,
        flowId: r.flowId,
        targetRevision: r.targetRevision,
        revision: r.history.length,
        objective: r.history.at(-1).state.objective,
        status: 'pending'
      })),
    get(id) {
      const record = find(id),
        state = record.history.at(-1).state
      const { links, works } = projections.get(id)
      const tasks = [...links].map(([taskId, workId]) => ({
        workId,
        task: getTask(taskId) ?? null,
        review: getReview(taskId)
      }))
      return freeze({
        ...record,
        ...state,
        revision: record.history.length,
        status: 'pending',
        limitation:
          'Strict all-flow candidate verification remains required. Integration assessment and baseline acceptance are not implemented for targets.',
        baselineCurrent: same(record.acceptedBaseline, getBaseline()),
        works,
        tasks: structuredClone(tasks)
      })
    },
    decide(input, actor) {
      requireValue(text(actor, 200), 'actor required')
      object(input, [
        'action',
        'targetId',
        'requestId',
        'expectedRevision',
        'reason',
        'flowId',
        'targetRevision',
        'acceptedBaseline',
        'objective',
        'works',
        'pending',
        'workId',
        'taskId'
      ])
      const request = structuredClone(input)
      requireValue(
        validId(request.requestId) && text(request.reason, 1000),
        'request identity and reason required'
      )
      const fingerprint = sha256(JSON.stringify({ request, actor }))
      for (const r of records)
        for (const entry of r.history)
          if (entry.request.requestId === request.requestId) {
            requireValue(entry.fingerprint === fingerprint, 'request conflict')
            return decisionResult(r, entry)
          }
      requireValue(
        ['create', 'revise', 'link'].includes(request.action),
        'unknown action'
      )
      const create = request.action === 'create'
      let record, state
      if (create) {
        requireValue(
          request.expectedRevision === 0 &&
            !request.targetId &&
            !request.workId &&
            !request.taskId,
          'invalid creation revision'
        )
        requireValue(
          same(request.acceptedBaseline, getBaseline()),
          'stale accepted baseline'
        )
        const contract = getContracts().find(
          (c) => c.digest === request.targetRevision
        )
        requireValue(contract, 'unknown target revision')
        const flow = contract.flows.find((f) => f.id === request.flowId)
        requireValue(flow, 'unknown flow')
        record = {
          format: TARGET_POLICY.format,
          id: request.requestId,
          flowId: flow.id,
          targetRevision: contract.digest,
          acceptedBaseline: request.acceptedBaseline,
          obligations: contract.cases.filter((c) => c.flowId === flow.id),
          steps: flow.steps,
          history: []
        }
      } else {
        record = find(request.targetId)
        requireValue(
          request.expectedRevision === record.history.length,
          'stale target revision'
        )
        requireValue(
          !request.flowId &&
            !request.targetRevision &&
            !request.acceptedBaseline,
          'target binding is immutable'
        )
      }
      const previousWorks = record.history.flatMap((e) => e.state.works)
      if (request.action !== 'link') {
        requireValue(
          !request.workId && !request.taskId,
          'unexpected link fields'
        )
        requireValue(Array.isArray(request.works), 'work inventory required')
        state = {
          objective: request.objective,
          pending: request.pending,
          works: request.works.map((w) => {
            requireValue(
              !Object.hasOwn(w, 'taskIds'),
              'task links require an explicit link decision'
            )
            const old = [...previousWorks].reverse().find((p) => p.id === w.id)
            return { ...w, taskIds: old?.taskIds ?? [] }
          })
        }
      } else {
        requireValue(
          request.works === undefined &&
            request.pending === undefined &&
            request.objective === undefined,
          'unexpected scope fields'
        )
        state = structuredClone(record.history.at(-1).state)
        const work = state.works.find((w) => w.id === request.workId)
        requireValue(work && validId(request.taskId), 'unknown work or task')
        const linked = getTask(request.taskId),
          task = linked?.task
        requireValue(task, 'task not found')
        requireValue(
          same(record.acceptedBaseline, getBaseline()) &&
            task.revision === record.acceptedBaseline.revision &&
            task.contractDigest === record.acceptedBaseline.contractDigest,
          'task baseline mismatch'
        )
        requireValue(
          task.stepId === work.stepId &&
            task.objective === work.scope &&
            sameSet(task.allowedFiles, work.allowedFiles),
          'task scope mismatch'
        )
        requireValue(
          same(
            task.step,
            record.steps.find((s) => s.id === work.stepId)
          ),
          'task step contract mismatch; target architecture requires a separate admitted task'
        )
        requireValue(
          work.obligationIds.every((id) => {
            const promised = record.obligations.find((c) => c.id === id)
            return task.obligations.some((c) => same(c, promised))
          }),
          'task obligation mismatch; strict candidate admission cannot serve this target revision'
        )
        for (const other of records)
          for (const entry of other.history)
            for (const item of entry.state.works)
              if (item.taskIds.includes(request.taskId))
                requireValue(
                  other.id === record.id && item.id === work.id,
                  'task already belongs to another commitment'
                )
        requireValue(
          !work.taskIds.includes(request.taskId),
          'task already linked; replay the original request'
        )
        work.taskIds.push(request.taskId)
      }
      validateAllocation(state, record, previousWorks)
      if (request.action !== 'link')
        for (const work of state.works)
          for (const runtimeFile of work.allowedFiles) {
            let exists = false
            try {
              exists = fs
                .statSync(safePath(repositoryRoot, runtimeFile))
                .isFile()
            } catch {
              /* rejected below */
            }
            requireValue(exists, 'runtime file missing or unsafe')
          }
      const entry = {
        stateDigest: sha256(JSON.stringify(state)),
        revision: record.history.length + 1,
        request,
        actor,
        at: new Date().toISOString(),
        fingerprint,
        state
      }
      const next = { ...record, history: [...record.history, entry] }
      const updated = create
        ? [...records, next]
        : records.map((r) => (r.id === record.id ? next : r))
      writeAtomic(file, { format: TARGET_POLICY.format, records: updated })
      records = freeze(updated)
      projectRevision(find(next.id))
      return decisionResult(find(next.id), find(next.id).history.at(-1))
    }
  }
  return owner
}
module.exports = { createTargetOwner, TARGET_POLICY }

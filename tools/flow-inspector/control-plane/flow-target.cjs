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
  getReview,
  getSource = () => null,
  getVersionReview = () => null
}) {
  const resolveVerification = (reviewId, targetRevision) => {
    const digest = (value) =>
      typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
    requireValue(digest(reviewId), 'invalid target version review identity')
    const review = getVersionReview(reviewId)
    const candidate = review?.candidate
    const reference = candidate?.verificationSource
    requireValue(
      review?.id === reviewId &&
        digest(review.candidateDigest) &&
        candidate?.contract?.digest === targetRevision &&
        reference &&
        typeof reference === 'object' &&
        reference.descriptor?.contractDigest === targetRevision &&
        digest(reference.descriptor?.digest),
      'target verification review or candidate is unavailable or conflicting'
    )
    return freeze({ reviewId, candidateDigest: review.candidateDigest })
  }
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
      const selectedReview = record.history[0].request?.targetReviewId
      requireValue(
        Object.hasOwn(record, 'targetVerification') ===
          Object.hasOwn(record.history[0].request ?? {}, 'targetReviewId'),
        'retained target verification pin was changed'
      )
      if (Object.hasOwn(record, 'targetVerification')) {
        const pin = record.targetVerification
        requireValue(
          pin &&
            Object.keys(pin).length === 2 &&
            pin.reviewId === selectedReview &&
            record.history
              .slice(1)
              .every(
                (entry) => !Object.hasOwn(entry.request, 'targetReviewId')
              ),
          'invalid retained target verification pin'
        )
        const resolved = resolveVerification(
          pin.reviewId,
          record.targetRevision
        )
        requireValue(
          pin.candidateDigest === resolved.candidateDigest,
          'retained target verification review changed'
        )
      }
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
        if (entry.admission) {
          requireValue(
            entry.admissionDigest === sha256(JSON.stringify(entry.admission)) &&
              entry.request.action === 'admit' &&
              entry.admission.id === entry.request.requestId &&
              entry.admission.taskId === entry.request.taskId &&
              entry.admission.workId === entry.request.workId &&
              entry.admission.actor === entry.actor &&
              entry.admission.repositoryRoot === repositoryRoot &&
              /^[a-f0-9]{64}$/.test(entry.admission.source?.digest ?? '') &&
              /^[a-f0-9]{40}$/.test(entry.admission.source?.head ?? '') &&
              entry.state.works.some(
                (w) =>
                  w.id === entry.admission.workId &&
                  w.taskIds.includes(entry.admission.taskId)
              ),
            'invalid retained work admission'
          )
        }
        for (const older of record.history.slice(0, index))
          if (older.admission)
            requireValue(
              entry.state.works.some((w) => w.id === older.admission.workId),
              'admitted commitment cannot be removed'
            )
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
  const taskBindings = new Map()
  const projectRevision = (record) => {
    const previous = projections.get(record.id)
    const links = new Map(previous?.links)
    const entries = previous ? [record.history.at(-1)] : record.history
    for (const entry of entries)
      for (const work of entry.state.works)
        for (const taskId of work.taskIds) {
          links.set(taskId, work.id)
          const old = taskBindings.get(taskId)
          requireValue(
            !old || (old.targetId === record.id && old.workId === work.id),
            'task belongs to another commitment'
          )
          taskBindings.set(taskId, {
            ...old,
            targetId: record.id,
            workId: work.id
          })
        }
    for (const entry of entries)
      if (entry.admission) {
        const old = taskBindings.get(entry.admission.taskId)
        requireValue(
          !old.admission || old.admission.id === entry.admission.id,
          'task admission already reserved'
        )
        taskBindings.set(entry.admission.taskId, {
          ...old,
          admission: entry.admission
        })
      }
    const works = freeze(
      record.history.at(-1).state.works.map((w) => ({
        ...w,
        status: w.prerequisites.length ? 'blocked' : 'pending',
        assessment: { status: 'pending', attempts: [] },
        prerequisites: w.prerequisites.map((dep) => ({
          ...dep,
          status: 'unconfirmed'
        }))
      }))
    )
    projections.set(record.id, { links, works })
  }
  records.forEach(projectRevision)
  const matchTask = (record, work, task) => {
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
      'task step contract mismatch'
    )
    requireValue(
      work.obligationIds.every((id) =>
        task.obligations.some((c) =>
          same(
            c,
            record.obligations.find((p) => p.id === id)
          )
        )
      ),
      'task obligation mismatch'
    )
  }
  const owner = {
    checkTask(task, snapshot = null) {
      const binding = taskBindings.get(task.requestId)
      if (!binding && !task.workBinding) return null
      requireValue(
        binding?.admission,
        'work admission required before execution'
      )
      const { admission } = binding
      const record = find(binding.targetId)
      const work = record.history
        .at(-1)
        .state.works.find((w) => w.id === binding.workId)
      requireValue(work, 'admitted commitment missing')
      requireValue(
        task.actor === admission.actor,
        'work admission actor mismatch'
      )
      const expectedBinding = {
        targetId: record.id,
        workId: work.id,
        admissionId: admission.id
      }
      requireValue(
        (!task.workBinding && admission.legacyTask) ||
          (task.workBinding &&
            Object.entries(expectedBinding).every(
              ([key, value]) => task.workBinding[key] === value
            )),
        'work admission identity mismatch'
      )
      requireValue(
        !work.prerequisites.length,
        'unconfirmed prerequisite blocks execution'
      )
      matchTask(record, work, task)
      if (snapshot)
        requireValue(
          snapshot.digest === admission.source.digest &&
            snapshot.head === admission.source.head &&
            snapshot.contractDigest === task.contractDigest,
          'work admission source mismatch'
        )
      return admission
    },
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
        taskId,
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
        works: tasks.length
          ? works.map((work) => {
              const assessments = tasks
                .filter(
                  (item) =>
                    item.workId === work.id &&
                    taskBindings.get(item.taskId)?.admission
                )
                .map((item) => {
                  const task = item.task,
                    attempt = task?.attempts.at(-1)
                  let status = 'pending'
                  if (attempt) status = task.verificationStatus
                  if (!['passed', 'failed', 'pending'].includes(status))
                    status = 'unknown'
                  return {
                    status,
                    taskId: item.taskId,
                    attemptId: attempt?.id ?? null,
                    sourceDigest: attempt?.verdict?.sourceDigest ?? null
                  }
                })
              let status = 'pending'
              if (
                assessments.length &&
                assessments.every((a) => a.status === 'passed')
              )
                status = 'passed'
              if (assessments.some((a) => a.status === 'unknown'))
                status = 'unknown'
              if (assessments.some((a) => a.status === 'failed'))
                status = 'failed'
              if (
                status === 'passed' &&
                !same(record.acceptedBaseline, getBaseline())
              )
                status = 'stale'
              return { ...work, assessment: { status, attempts: assessments } }
            })
          : works,
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
        'targetReviewId',
        'acceptedBaseline',
        'objective',
        'works',
        'pending',
        'workId',
        'taskId',
        'sourceAttemptId'
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
        ['create', 'revise', 'link', 'admit'].includes(request.action),
        'unknown action'
      )
      requireValue(
        request.action === 'admit' || request.sourceAttemptId === undefined,
        'source only allowed for admission'
      )
      const create = request.action === 'create'
      requireValue(
        create || !Object.hasOwn(request, 'targetReviewId'),
        'target verification review is immutable after creation'
      )
      let record, state, admission
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
          ...(Object.hasOwn(request, 'targetReviewId')
            ? {
                targetVerification: resolveVerification(
                  request.targetReviewId,
                  contract.digest
                )
              }
            : {}),
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
      if (!['link', 'admit'].includes(request.action)) {
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
        if (request.action === 'admit') {
          requireValue(
            !work.prerequisites.length,
            'unconfirmed prerequisite blocks admission'
          )
          requireValue(
            !taskBindings.get(request.taskId)?.admission,
            'task admission already reserved'
          )
          const source = getSource(request.sourceAttemptId)
          requireValue(
            source?.format === 2 &&
              source.phase === 'completed' &&
              source.scenario === 'baseline' &&
              (source.mode === undefined || source.mode === 'verify') &&
              source.contractDigest ===
                record.acceptedBaseline.contractDigest &&
              source.mappingRevision === record.acceptedBaseline.revision &&
              source.snapshot?.contractDigest === source.contractDigest &&
              source.evidence?.status === 'passed' &&
              !source.evidence.issues.length &&
              /^[a-f0-9]{40}$/.test(source.snapshot.head) &&
              /^[a-f0-9]{64}$/.test(source.snapshot.digest),
            'ineligible baseline source proof'
          )
          const accepted = getContracts().find(
            (c) => c.digest === record.acceptedBaseline.contractDigest
          )
          requireValue(
            accepted &&
              accepted.cases.every(
                (c) =>
                  source.evidence.cases.filter(
                    (v) => v.id === c.id && v.status === 'passed'
                  ).length === 1
              ),
            'incomplete baseline source proof'
          )
          requireValue(
            same(record.acceptedBaseline, getBaseline()),
            'stale accepted source baseline'
          )
          const oldTask = getTask(request.taskId)
          if (oldTask) {
            matchTask(record, work, oldTask.task)
            requireValue(
              oldTask.actor === actor &&
                oldTask.snapshot.digest === source.snapshot.digest &&
                oldTask.snapshot.head === source.snapshot.head,
              'retained task source or actor mismatch'
            )
          }
          admission = {
            id: request.requestId,
            taskId: request.taskId,
            workId: work.id,
            actor,
            repositoryRoot,
            source: {
              digest: source.snapshot.digest,
              head: source.snapshot.head
            },
            legacyTask: !!oldTask
          }
        } else {
          requireValue(
            request.sourceAttemptId === undefined,
            'source only allowed for admission'
          )
          const linked = getTask(request.taskId),
            task = linked?.task
          requireValue(task, 'task not found')
          matchTask(record, work, task)
        }
        for (const other of records)
          for (const entry of other.history)
            for (const item of entry.state.works)
              if (item.taskIds.includes(request.taskId))
                requireValue(
                  other.id === record.id && item.id === work.id,
                  'task already belongs to another commitment'
                )
        requireValue(
          admission || !work.taskIds.includes(request.taskId),
          'task already linked; replay the original request'
        )
        if (!work.taskIds.includes(request.taskId))
          work.taskIds.push(request.taskId)
      }
      for (const entry of record.history)
        if (entry.admission)
          requireValue(
            state.works.some((w) => w.id === entry.admission.workId),
            'admitted commitment cannot be removed'
          )
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
        ...(admission
          ? { admission, admissionDigest: sha256(JSON.stringify(admission)) }
          : {}),
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

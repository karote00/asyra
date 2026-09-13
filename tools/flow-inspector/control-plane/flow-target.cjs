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
  getAssessment = () => null,
  getAssessmentSource = () => null,
  deferAssessmentValidation = false,
  getVersionReview = () => null,
  getAcceptedVersion
}) {
  const resolveAcceptedVersion = (contractDigest, revision) => {
    requireValue(
      typeof getAcceptedVersion === 'function',
      'accepted version resolver unavailable'
    )
    const version = getAcceptedVersion(revision)
    requireValue(
      version &&
        Object.keys(version).length === 2 &&
        Object.hasOwn(version, 'revision') &&
        Object.hasOwn(version, 'contractDigest') &&
        Number.isInteger(version.revision) &&
        version.revision > 0 &&
        (revision === undefined || version.revision === revision) &&
        /^[a-f0-9]{64}$/.test(version.contractDigest ?? '') &&
        version.contractDigest === contractDigest,
      'accepted version identity unavailable or conflicting'
    )
    return freeze({
      revision: version.revision,
      contractDigest: version.contractDigest
    })
  }
  const resolveVerification = (reviewId, targetRevision, requireAvailable) => {
    const digest = (value) =>
      typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
    requireValue(digest(reviewId), 'invalid target version review identity')
    const review = getVersionReview(reviewId, { requireAvailable })
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
  const assessmentSource = (
    record,
    work,
    assessmentId,
    actor,
    current,
    allocationRevision,
    available = false
  ) => {
    requireValue(validId(assessmentId), 'assessment identity required')
    const assessment = getAssessment(assessmentId)
    const workResult = assessment?.result?.works?.filter(
      (item) => item.id === work.id
    )
    const source = assessment?.runtime
    requireValue(
      assessment?.id === assessmentId &&
        assessment.actor === actor &&
        assessment.phase === 'completed' &&
        assessment.request?.targetId === record.id &&
        assessment.request.allocationRevision === allocationRevision &&
        assessment.request.allocationRevision ===
          assessment.result?.allocationRevision &&
        assessment.result.targetId === record.id &&
        same(assessment.result.acceptedBaseline, record.acceptedBaseline) &&
        Object.hasOwn(assessment.pins ?? {}, 'acceptedVersion') ===
          Object.hasOwn(record, 'acceptedVersion') &&
        (!Object.hasOwn(record, 'acceptedVersion') ||
          same(assessment.pins.acceptedVersion, record.acceptedVersion)) &&
        Object.hasOwn(assessment.pins ?? {}, 'targetVerification') ===
          Object.hasOwn(record, 'targetVerification') &&
        (!Object.hasOwn(record, 'targetVerification') ||
          same(
            assessment.pins.targetVerification,
            record.targetVerification
          )) &&
        (!current || assessment.projection?.current === true) &&
        assessment.result.accepted?.status === 'passed' &&
        workResult?.length === 1 &&
        workResult[0].targetId === record.id &&
        workResult[0].allocationRevision ===
          assessment.request.allocationRevision &&
        workResult[0].status === 'passed' &&
        workResult[0].prerequisites?.status === 'passed',
      'assessment does not satisfy this work and its prerequisites'
    )
    requireValue(
      source &&
        source.attemptId === assessment.request.sourceAttemptId &&
        Object.hasOwn(source, 'taskId') ===
          Object.hasOwn(assessment.request, 'sourceTaskId') &&
        (!Object.hasOwn(source, 'taskId') ||
          source.taskId === assessment.request.sourceTaskId) &&
        source.repository === repositoryRoot &&
        /^[a-f0-9]{40}$/.test(source.head ?? '') &&
        /^[a-f0-9]{64}$/.test(source.sourceDigest ?? '') &&
        /^[a-f0-9]{64}$/.test(source.runtimeSourceDigest ?? '') &&
        assessment.result.source?.repository === source.repository &&
        assessment.result.source?.head === source.head &&
        assessment.result.source?.runtimeSourceDigest ===
          source.runtimeSourceDigest,
      'assessment source identity is unavailable or conflicting'
    )
    if (available)
      requireValue(
        same(getAssessmentSource(assessmentId), source),
        'assessment source authority is unavailable or conflicting'
      )
    return source
  }
  const validateAssessmentAdmissionSource = (admission, source) =>
    requireValue(
      same(admission.source, {
        digest: source.sourceDigest,
        head: source.head
      }),
      'assessment admission source mismatch'
    )
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
      requireValue(
        record.history
          .slice(1)
          .every((entry) => !Object.hasOwn(entry, 'acceptedVersion')),
        'accepted version is only allowed in the creation entry'
      )
      const acceptedPin = record.acceptedVersion
      const creationPin = record.history[0].acceptedVersion
      requireValue(
        Object.hasOwn(record, 'acceptedVersion') ===
          Object.hasOwn(record.history[0], 'acceptedVersion'),
        'accepted version pin was changed'
      )
      if (Object.hasOwn(record, 'acceptedVersion')) {
        requireValue(
          acceptedPin &&
            creationPin &&
            Object.keys(acceptedPin).length === 2 &&
            Object.hasOwn(acceptedPin, 'revision') &&
            Object.hasOwn(acceptedPin, 'contractDigest') &&
            Number.isInteger(acceptedPin.revision) &&
            acceptedPin.revision > 0 &&
            Object.keys(creationPin).length === 2 &&
            Object.hasOwn(creationPin, 'revision') &&
            Object.hasOwn(creationPin, 'contractDigest') &&
            acceptedPin.revision === creationPin.revision &&
            acceptedPin.contractDigest === creationPin.contractDigest,
          'accepted version creation pin mismatch'
        )
        const resolvedVersion = resolveAcceptedVersion(
          record.acceptedBaseline?.contractDigest,
          acceptedPin.revision
        )
        requireValue(
          acceptedPin.revision === resolvedVersion.revision &&
            acceptedPin.contractDigest === resolvedVersion.contractDigest,
          'accepted version pin differs from retained version'
        )
      }
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
          record.targetRevision,
          false
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
          const work = entry.state.works.find(
            (item) => item.id === entry.admission.workId
          )
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
              work?.taskIds.includes(entry.admission.taskId) &&
              (work.prerequisites.length
                ? validId(entry.admission.assessmentId) &&
                  Number.isInteger(entry.admission.allocationRevision) &&
                  entry.admission.allocationRevision > 0 &&
                  entry.admission.allocationRevision === entry.revision - 1 &&
                  entry.request.assessmentId === entry.admission.assessmentId &&
                  entry.request.sourceAttemptId === undefined
                : entry.admission.assessmentId === undefined &&
                  entry.admission.allocationRevision === undefined &&
                  entry.request.assessmentId === undefined),
            'invalid retained work admission'
          )
          if (work.prerequisites.length && !deferAssessmentValidation) {
            const source = assessmentSource(
              record,
              work,
              entry.admission.assessmentId,
              entry.actor,
              false,
              entry.admission.allocationRevision
            )
            validateAssessmentAdmissionSource(entry.admission, source)
          }
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
      record.history.at(-1).state.works.map((w) => {
        const assessed = record.history.some(
          (entry) =>
            entry.admission?.workId === w.id && entry.admission.assessmentId
        )
        return {
          ...w,
          status: w.prerequisites.length && !assessed ? 'blocked' : 'pending',
          assessment: { status: 'pending', attempts: [] },
          prerequisites: w.prerequisites.map((dep) => ({
            ...dep,
            status: assessed ? 'passed' : 'unconfirmed'
          }))
        }
      })
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
      if (work.prerequisites.length) {
        const source = assessmentSource(
          record,
          work,
          admission.assessmentId,
          admission.actor,
          false,
          admission.allocationRevision,
          true
        )
        validateAssessmentAdmissionSource(admission, source)
      }
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
          'Strict all-flow candidate verification remains required. Source-bound integration assessment is available through the assessment service. Explicit target baseline acceptance is not implemented.',
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
        'sourceAttemptId',
        'assessmentId'
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
        request.action === 'admit' ||
          (request.sourceAttemptId === undefined &&
            request.assessmentId === undefined),
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
                  contract.digest,
                  true
                )
              }
            : {}),
          ...(getAcceptedVersion !== undefined
            ? {
                acceptedVersion: resolveAcceptedVersion(
                  request.acceptedBaseline.contractDigest
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
            !taskBindings.get(request.taskId)?.admission,
            'task admission already reserved'
          )
          let sourceIdentity
          if (work.prerequisites.length) {
            requireValue(
              request.sourceAttemptId === undefined,
              'dependent prerequisite admission cannot select a baseline source'
            )
            const source = assessmentSource(
              record,
              work,
              request.assessmentId,
              actor,
              true,
              request.expectedRevision,
              true
            )
            sourceIdentity = { digest: source.sourceDigest, head: source.head }
          } else {
            requireValue(
              request.assessmentId === undefined,
              'independent admission cannot select a target assessment'
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
            sourceIdentity = {
              digest: source.snapshot.digest,
              head: source.snapshot.head
            }
          }
          requireValue(
            same(record.acceptedBaseline, getBaseline()),
            'stale accepted source baseline'
          )
          const oldTask = getTask(request.taskId)
          if (oldTask) {
            matchTask(record, work, oldTask.task)
            requireValue(
              oldTask.actor === actor &&
                oldTask.snapshot.digest === sourceIdentity.digest &&
                oldTask.snapshot.head === sourceIdentity.head,
              'retained task source or actor mismatch'
            )
          }
          admission = {
            id: request.requestId,
            taskId: request.taskId,
            workId: work.id,
            actor,
            repositoryRoot,
            source: sourceIdentity,
            ...(work.prerequisites.length
              ? {
                  assessmentId: request.assessmentId,
                  allocationRevision: request.expectedRevision
                }
              : {}),
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
        ...(create && Object.hasOwn(record, 'acceptedVersion')
          ? { acceptedVersion: record.acceptedVersion }
          : {}),
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
  owner.validateAssessmentAdmissions = () => {
    for (const record of records)
      for (const entry of record.history) {
        const admission = entry.admission
        if (!admission?.assessmentId) continue
        const work = entry.state.works.find(
          (item) => item.id === admission.workId
        )
        const source = assessmentSource(
          record,
          work,
          admission.assessmentId,
          admission.actor,
          false,
          admission.allocationRevision
        )
        validateAssessmentAdmissionSource(admission, source)
      }
  }
  return owner
}
module.exports = { createTargetOwner, TARGET_POLICY }

/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const fs = require('node:fs')
const { randomUUID } = require('node:crypto')
const { admitContract, loadContract, mappingDiff } = require('./contracts.cjs')
const { captureSource, safePath, sha256 } = require('./snapshot.cjs')
const { runVerification } = require('./runner.cjs')
const evidenceOwner = require('./evidence.cjs')
const { openStore, validId, writeAtomic } = require('./store.cjs')
const {
  createHistory,
  compareVersion,
  decideVersion
} = require('./evolution.cjs')
const { prepareCIContext } = require('./ci-context.cjs')
const { assessCI } = require('./ci-evidence.cjs')
const { createTaskOwner } = require('./agent-task.cjs')
const { createReviewOwner, REVIEW_POLICY } = require('./pr-review.cjs')
const { createTargetOwner, TARGET_POLICY } = require('./flow-target.cjs')
const { TASK_POLICY } = require('./agent-contract.cjs')
const { containmentAvailable } = require('./agent-verifier.cjs')

const LOCAL_ACTOR = Object.freeze({
  id: 'local-developer',
  capabilities: Object.freeze([
    'verify',
    'cancel',
    'prepare-mapping',
    'decide-mapping',
    'preview-contract',
    'prepare-contract',
    'decide-contract',
    'retire-contract',
    'ci',
    'ingest-ci',
    'update-work',
    'delegate-task',
    'control-task',
    REVIEW_POLICY.capability,
    TARGET_POLICY.capability
  ])
})
class ActionError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
const authorize = (actor, capability) => {
  if (
    !actor ||
    typeof actor.id !== 'string' ||
    !actor.id.trim() ||
    !Array.isArray(actor.capabilities) ||
    !actor.capabilities.includes(capability)
  )
    throw new ActionError(403, 'Action is not authorized')
}

function createService(
  repositoryRoot,
  {
    directory = path.join(repositoryRoot, 'tmp/flow-inspector/runs'),
    runner = runVerification,
    capture = captureSource,
    timeoutMs = 30000,
    acceptedBase = 'origin/main',
    ciAdmission = null,
    agentOptions = {},
    deliveryAdapter = null
  } = {}
) {
  ciAdmission = ciAdmission ? structuredClone(ciAdmission) : null
  let contract = loadContract(repositoryRoot)
  safePath(repositoryRoot, path.relative(repositoryRoot, directory))
  const store = openStore(directory)
  try {
    if (!store.mapping())
      store.saveMapping({
        format: 1,
        revision: 1,
        accepted: contract,
        reviews: []
      })
    const accepted = store.mapping().accepted
    contract = accepted.architectureDefinition
      ? admitContract(accepted.definition, accepted.architectureDefinition)
      : loadContract(repositoryRoot, accepted.definition)
    if (contract.digest !== accepted.digest)
      throw new Error(
        'Accepted architecture changed; a new contract activation is required'
      )
    for (const record of store.list())
      evidenceOwner.validateStoredEvidence(contract, record)
    if (!store.mapping().evolution) {
      const contentDigest = sha256(
        fs.readFileSync(safePath(repositoryRoot, contract.testFile))
      )
      store.saveMapping({
        ...store.mapping(),
        evolution: {
          history: createHistory({
            contract,
            selectors: contract.cases.map((item) => ({
              caseId: item.id,
              file: contract.testFile,
              testName: item.testName,
              contentDigest
            }))
          }),
          reviews: []
        }
      })
    }
    const history = store.mapping().evolution.history
    for (const version of history.versions) {
      const restored = admitContract(
        version.contract.definition,
        version.contract.architectureDefinition
      )
      if (restored.digest !== version.contract.digest)
        throw new Error('Invalid retained contract version')
    }
    for (const delivery of store.mapping().ciDeliveries ?? []) {
      const version = history.versions.find(
        (item) => item.contract.digest === delivery.contractDigest
      )?.contract
      if (
        !version ||
        sha256(JSON.stringify(delivery.envelope)) !== delivery.fingerprint ||
        !delivery.admission
      )
        throw new Error('Invalid retained CI source identity')
      const assessed = assessCI(
        delivery.admission.accepted,
        version,
        delivery.admission.expected,
        delivery.envelope
      )
      if (JSON.stringify(assessed) !== JSON.stringify(delivery.result))
        throw new Error('Retained CI result differs from raw evidence')
    }
    if (history.versions.at(-1).contract.digest !== contract.digest)
      throw new Error('Accepted version history differs from mapping')
  } catch (error) {
    store.close()
    throw error
  }
  const projectContract = () =>
    Object.fromEntries(
      Object.entries(contract).filter(
        ([key]) => !['definition', 'architectureDefinition'].includes(key)
      )
    )
  let publicContract = projectContract()
  let active = null
  let tasks
  let reviews
  let closed = false
  const pending = new Map()
  let sharedSnapshot
  let publicEvolution
  let publicCI
  let publicWork
  const immutable = (value) => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(immutable)
      Object.freeze(value)
    }
    return value
  }
  const projectDelivery = (value) =>
    Object.fromEntries(
      Object.entries(value).filter(
        ([key]) => !['envelope', 'admission'].includes(key)
      )
    )
  const refreshShared = () => {
    const mapping = store.mapping(),
      evolution = mapping.evolution
    publicEvolution = {
      revision: evolution.history.revision,
      versions: evolution.history.versions.map((version, index) => ({
        revision: index + 1,
        contractDigest: version.contract.digest,
        verificationStatus: version.verificationStatus
      })),
      decisions: evolution.history.decisions,
      reviews: evolution.reviews.map(({ candidate, ...review }) => ({
        ...review,
        candidateDigest: candidate.contract.digest
      }))
    }
    publicWork = [...new Set(contract.cases.map((item) => item.stepId))].map(
      (stepId) => {
        const saved = mapping.work?.[stepId]
        return saved?.contractDigest === contract.digest
          ? saved
          : { stepId, status: 'untracked' }
      }
    )
    let workStatus = 'untracked'
    if (publicWork.some((item) => item.status === 'not-started'))
      workStatus = 'not-started'
    if (publicWork.some((item) => item.status === 'in-progress'))
      workStatus = 'in-progress'
    if (publicWork.some((item) => item.status === 'blocked'))
      workStatus = 'blocked'
    if (
      publicWork.length &&
      publicWork.every((item) => item.status === 'complete')
    )
      workStatus = 'reported-complete'
    const deliveries = mapping.ciDeliveries ?? []
    publicCI = {
      deliveries: deliveries.map(projectDelivery)
    }
    const imported = deliveries.at(-1)
    const remote =
      imported?.contractDigest === contract.digest &&
      imported.mappingRevision === mapping.revision
        ? imported.result
        : null
    const latest = store
      .list()
      .find(
        (record) =>
          record.phase === 'completed' &&
          record.scenario === 'baseline' &&
          record.mode !== 'candidate' &&
          record.mappingRevision === store.mapping().revision &&
          record.contractDigest === contract.digest
      )
    const currentEvidence = remote?.evidence ?? latest?.evidence
    const verificationStatus =
      remote?.verificationStatus ??
      latest?.ci?.verificationStatus ??
      latest?.evidence?.status ??
      'unknown'
    const value = {
      format: 1,
      observedAt: new Date().toISOString(),
      scope:
        contract.flows.length +
        ' Factory flows - ' +
        contract.cases.length +
        ' declared obligations',
      baseline: remote?.baseline ??
        latest?.ci?.baseline ?? {
          kind: 'local-captured-source',
          head: latest?.snapshot?.head ?? null,
          sourceDigest: latest?.snapshot?.digest ?? null,
          contractDigest: contract.digest
        },
      workStatus,
      remainingWork: publicWork.filter((item) => item.status !== 'complete'),
      executionStatus: active ? 'running' : (latest?.phase ?? 'not-started'),
      verificationStatus,
      deliveryStatus:
        remote?.deliveryStatus ?? latest?.ci?.deliveryStatus ?? 'not-assessed',
      blockers: remote?.blockers ??
        latest?.ci?.blockers ??
        latest?.evidence?.issues ?? ['No accepted baseline evidence'],
      goals: contract.flows.map((flow) => ({ id: flow.id, goal: flow.goal })),
      remaining: contract.cases.filter(
        (item) =>
          verificationStatus === 'unknown' ||
          !currentEvidence?.cases.some(
            (c) => c.id === item.id && c.status === 'passed'
          )
      ),
      confirmedFailures:
        currentEvidence?.cases.filter((item) => item.status === 'failed') ?? [],
      potentialImpact: contract.flows.map((flow) => flow.id),
      attemptId: latest?.id ?? null
    }
    sharedSnapshot = immutable({
      ...value,
      fingerprint: sha256(JSON.stringify(value))
    })
  }
  refreshShared()
  const event = (name) => ({ event: name, at: new Date().toISOString() })
  const update = (id, patch, eventName) => {
    const previous = store.get(id)
    const next = {
      ...previous,
      ...patch,
      audit: [...previous.audit, event(eventName)]
    }
    if (next.phase === 'completed')
      evidenceOwner.validateStoredEvidence(contract, next)
    store.save(next)
    return store.get(id)
  }
  const publicRecord = (record) => {
    if (!record) throw new ActionError(404, 'Attempt not found')
    const matchesCurrentContract =
      record.mode !== 'candidate' &&
      record.snapshot?.contractDigest === contract.digest &&
      (record.format !== 2 ||
        record.mappingRevision === store.mapping().revision)
    return {
      ...record,
      matchesCurrentContract,
      workStatus: 'untracked',
      deliveryStatus: record.ci?.deliveryStatus ?? 'not-assessed'
    }
  }
  const requireIdle = (reviewAction = false) => {
    if (!reviewAction && reviews?.active())
      throw new ActionError(409, 'A delivery review is active')
    if (closed) throw new ActionError(409, 'Service is closing')
    if (active || tasks?.activeId())
      throw new ActionError(409, 'An attempt or task is already running')
  }
  const objectRequest = (request, keys) => {
    if (
      !request ||
      typeof request !== 'object' ||
      Array.isArray(request) ||
      Object.keys(request).some((key) => !keys.includes(key))
    )
      throw new ActionError(400, 'Invalid action request')
  }
  const publicReview = (review) => {
    const { candidate, ...result } = review
    return {
      ...result,
      candidateDigest: candidate.digest,
      candidateMappingVersion: candidate.mappingVersion
    }
  }
  let targets
  try {
    tasks = createTaskOwner(repositoryRoot, {
      ...agentOptions,
      checkWork: (task, snapshot) => targets.checkTask(task, snapshot),
      directory: path.join(directory, 'tasks'),
      getBaseline: () => ({ contract, revision: store.mapping().revision }),
      requireIdle: () => {
        if (reviews?.active())
          throw new ActionError(409, 'A delivery review is active')
        if (closed || active)
          throw new ActionError(
            409,
            'An attempt is running or service is closing'
          )
      }
    })
  } catch (error) {
    store.close()
    throw error
  }
  try {
    reviews = createReviewOwner(repositoryRoot, {
      directory: path.join(directory, 'reviews'),
      getTask: (id) => tasks.get(id),
      getBaseline: () => ({ contract, revision: store.mapping().revision }),
      changes: (id) => tasks.changes(id),
      candidateDirectory: (id) => {
        if (!validId(id)) throw new ActionError(400, 'Invalid task identity')
        return path.join(directory, 'tasks', id, 'candidate')
      },
      adapter: deliveryAdapter
    })
  } catch (error) {
    store.close()
    throw error
  }
  const targetContracts = () => {
    const evolution = store.mapping().evolution
    return [
      ...new Map(
        [
          ...evolution.history.versions.map((v) => v.contract),
          ...evolution.reviews.map((r) => r.candidate.contract)
        ].map((c) => [c.digest, c])
      ).values()
    ]
  }
  try {
    targets = createTargetOwner({
      repositoryRoot,
      directory,
      getContracts: targetContracts,
      getBaseline: () => ({
        revision: store.mapping().revision,
        contractDigest: contract.digest
      }),
      getTask: (id) => {
        try {
          return tasks.get(id)
        } catch (error) {
          if (error.message === 'Task not found') return null
          throw error
        }
      },
      getSource: (id) => store.get(id),
      getReview: (id) => reviews.get(id)
    })
  } catch (error) {
    store.close()
    throw error
  }
  const taskResult = (operation) => {
    try {
      return operation()
    } catch (error) {
      throw new ActionError(409, error.message)
    }
  }
  return {
    targets: () => ({
      records: targets.list(),
      catalog: targetContracts().map((c) => ({
        revision: c.digest,
        flows: c.flows,
        obligations: c.cases
      }))
    }),
    getTarget: (id) => taskResult(() => targets.get(id)),
    decideTarget(request, actor) {
      authorize(actor, TARGET_POLICY.capability)
      requireIdle()
      return taskResult(() => targets.decide(request, actor.id))
    },
    getReview: (id) =>
      taskResult(() => {
        tasks.get(id)
        return reviews.get(id)
      }),
    async reviewTask(id, request, actor) {
      authorize(actor, REVIEW_POLICY.capability)
      objectRequest(request, ['action', 'previewDigest', 'confirm'])
      if (
        request.action !== 'confirm' &&
        (request.confirm !== undefined || request.previewDigest !== undefined)
      )
        throw new ActionError(400, 'Invalid review action request')
      requireIdle(true)
      try {
        if (request.action === 'prepare')
          return await reviews.prepare(id, actor.id)
        if (request.action === 'confirm')
          return await reviews.confirm(id, request, actor.id)
        if (request.action === 'refresh')
          return await reviews.refresh(id, actor.id)
        throw new ActionError(400, 'Unknown review action')
      } catch (error) {
        throw new ActionError(error.status ?? 409, error.message)
      }
    },
    startTask(request, actor) {
      authorize(actor, 'delegate-task')
      return taskResult(() => tasks.start(request, actor.id))
    },
    getTask: (id) => taskResult(() => tasks.get(id)),
    waitTask: (id) => tasks.wait(id),
    taskChanges: (id) => taskResult(() => tasks.changes(id)),
    async controlTask(id, request, actor) {
      if (reviews?.active())
        throw new ActionError(409, 'A delivery review is active')
      authorize(actor, 'control-task')
      objectRequest(request, ['action', 'scenario'])
      if (request.action === 'resume') {
        taskResult(() => tasks.resume(id, request.scenario, actor.id))
        return tasks.get(id)
      }
      if (request.scenario !== undefined)
        throw new ActionError(400, 'Scenario is only valid for resume')
      try {
        return await tasks.stop(id, request.action, actor.id)
      } catch (error) {
        throw new ActionError(409, error.message)
      }
    },
    contract: () => contract,
    shared: () => sharedSnapshot,
    setWork(request, actor) {
      authorize(actor, 'update-work')
      objectRequest(request, ['stepId', 'status', 'reason'])
      requireIdle()
      if (
        !contract.cases.some((item) => item.stepId === request.stepId) ||
        !['not-started', 'in-progress', 'complete', 'blocked'].includes(
          request.status
        ) ||
        typeof request.reason !== 'string' ||
        !request.reason.trim() ||
        request.reason.length > 1000
      )
        throw new ActionError(
          400,
          'Known step, work status and reason are required'
        )
      const state = store.mapping(),
        previous = state.work?.[request.stepId]
      const work = {
        stepId: request.stepId,
        status: request.status,
        reason: request.reason,
        actor: actor.id,
        at: new Date().toISOString(),
        contractDigest: contract.digest
      }
      store.saveMapping({
        ...state,
        work: { ...state.work, [request.stepId]: work },
        workAudit: [
          ...(state.workAudit ?? []),
          { ...work, before: previous?.status ?? 'untracked' }
        ]
      })
      refreshShared()
      return store.mapping().work[request.stepId]
    },
    ingestCI(request, actor) {
      authorize(actor, 'ingest-ci')
      objectRequest(request, ['envelope'])
      requireIdle()
      if (!ciAdmission?.expected)
        throw new ActionError(
          409,
          'No independently admitted CI run is configured'
        )
      const envelope = structuredClone(request.envelope)
      const expected = ciAdmission.expected
      if (
        !envelope ||
        envelope.runId !== expected.runId ||
        envelope.attempt !== expected.attempt
      )
        throw new ActionError(
          409,
          'CI delivery is not the currently admitted run attempt'
        )
      if (!/^[1-9][0-9]*$/.test(expected.runId))
        throw new ActionError(400, 'Registered CI run id must be numeric')
      const bytes = JSON.stringify(envelope)
      if (Buffer.byteLength(bytes) > 2097152)
        throw new ActionError(413, 'CI envelope exceeds size limit')
      const fingerprint = sha256(bytes),
        state = store.mapping(),
        deliveries = state.ciDeliveries ?? []
      const previous = deliveries.find(
        (item) =>
          item.runId === expected.runId && item.attempt === expected.attempt
      )
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new ActionError(
            409,
            'CI delivery conflicts with retained evidence'
          )
        return projectDelivery(previous)
      }
      if (
        deliveries.some(
          (item) =>
            item.runId === expected.runId && item.attempt > expected.attempt
        )
      )
        throw new ActionError(409, 'CI delivery attempt is stale')
      if (
        deliveries.some(
          (item) =>
            item.result.baseline.repository === expected.repository &&
            item.result.baseline.integration === expected.integration &&
            /^[1-9][0-9]*$/.test(item.runId) &&
            BigInt(item.runId) > BigInt(expected.runId)
        )
      )
        throw new ActionError(409, 'CI delivery run is stale')
      const accepted = ciAdmission.accepted ?? contract
      const result = assessCI(accepted, contract, expected, envelope)
      const delivery = {
        id: randomUUID(),
        runId: expected.runId,
        attempt: expected.attempt,
        contractDigest: contract.digest,
        admission: { expected, accepted },
        mappingRevision: state.revision,
        fingerprint,
        result,
        envelope,
        actor: actor.id,
        audit: [{ event: 'ci-ingested', at: new Date().toISOString() }]
      }
      store.saveMapping({ ...state, ciDeliveries: [...deliveries, delivery] })
      refreshShared()
      return projectDelivery(delivery)
    },
    readCIArtifact(id, name) {
      const delivery = store
        .mapping()
        .ciDeliveries?.find((item) => item.id === id)
      if (!delivery || !['report', 'envelope'].includes(name))
        throw new ActionError(404, 'CI artifact not found')
      const bytes = JSON.stringify(delivery.envelope)
      if (sha256(bytes) !== delivery.fingerprint)
        throw new ActionError(409, 'CI artifact fingerprint mismatch')
      return Buffer.from(name === 'report' ? delivery.envelope.report : bytes)
    },
    prepareEvolution(request, actor) {
      authorize(actor, 'prepare-contract')
      objectRequest(request, ['attemptId', 'relations'])
      requireIdle()
      const record = store.get(request.attemptId)
      if (
        !record ||
        record.mode !== 'candidate' ||
        record.phase !== 'completed'
      )
        throw new ActionError(409, 'A completed candidate proof is required')
      const candidateContract = loadContract(repositoryRoot)
      if (record.contractDigest !== candidateContract.digest)
        throw new ActionError(409, 'Candidate changed since preview')
      const report = JSON.parse(this.readArtifact(record.id, 'report'))
      const files = JSON.parse(this.readArtifact(record.id, 'source-manifest'))
      const contentDigest = files.find(
        (file) => file.path === candidateContract.testFile
      )?.digest
      const selectors = report.testResults
        .flatMap((suite) => suite.assertionResults)
        .filter((item) => ['passed', 'failed'].includes(item.status))
        .map((item) => ({
          caseId:
            candidateContract.cases.find((c) => c.testName === item.fullName)
              ?.id ?? 'unknown-' + sha256(item.fullName),
          testName: item.fullName,
          file: candidateContract.testFile,
          contentDigest
        }))
      const candidate = { contract: candidateContract, selectors }
      const state = store.mapping(),
        evolution = state.evolution
      const review = compareVersion(evolution.history, candidate, {
        relations: request.relations ?? []
      })
      const existing = evolution.reviews.find((item) => item.id === review.id)
      if (existing) return existing
      const retained = {
        ...review,
        candidate,
        attemptId: record.id,
        status: 'pending'
      }
      store.saveMapping({
        ...state,
        evolution: { ...evolution, reviews: [...evolution.reviews, retained] }
      })
      refreshShared()
      return retained
    },
    decideEvolution(request, actor) {
      authorize(actor, 'decide-contract')
      objectRequest(request, ['id', 'decision', 'reason', 'retirement'])
      requireIdle()
      const state = store.mapping(),
        evolution = state.evolution
      const review = evolution.reviews.find((item) => item.id === request.id)
      if (!review) throw new ActionError(404, 'Contract review not found')
      if (request.decision === 'accept') {
        const current = loadContract(repositoryRoot)
        const digest = sha256(
          fs.readFileSync(safePath(repositoryRoot, current.testFile))
        )
        if (
          current.digest !== review.candidate.contract.digest ||
          review.candidate.selectors.some((s) => s.contentDigest !== digest)
        )
          throw new ActionError(409, 'Candidate changed after review')
      }
      const decision = {
        decision: request.decision,
        reason: request.reason,
        retirement: request.retirement ?? []
      }
      const history = decideVersion(
        evolution.history,
        review,
        review.candidate,
        decision,
        actor
      )
      if (history === evolution.history) return review
      const accepted = history.versions.at(-1).contract
      store.saveMapping({
        ...state,
        revision: state.revision + Number(request.decision === 'accept'),
        accepted,
        evolution: {
          history,
          reviews: evolution.reviews.map((item) =>
            item.id === review.id ? { ...item, status: request.decision } : item
          )
        }
      })
      contract = accepted
      publicContract = projectContract()
      refreshShared()
      return store
        .mapping()
        .evolution.reviews.find((item) => item.id === review.id)
    },
    prepareMapping(request, actor) {
      authorize(actor, 'prepare-mapping')
      objectRequest(request, [])
      requireIdle()
      const candidate = loadContract(repositoryRoot)
      const changes = mappingDiff(contract, candidate)
      if (!changes.length) return { status: 'unchanged', changes: [] }
      const state = store.mapping()
      const existing = state.reviews.find(
        (review) =>
          review.status === 'pending' &&
          review.baseRevision === state.revision &&
          review.candidate.digest === candidate.digest
      )
      if (existing) return publicReview(existing)
      const review = {
        id: randomUUID(),
        status: 'pending',
        baseRevision: state.revision,
        baseDigest: contract.digest,
        candidate,
        changes,
        actor: actor.id,
        preparedAt: new Date().toISOString()
      }
      store.saveMapping({ ...state, reviews: [...state.reviews, review] })
      return publicReview(review)
    },
    decideMapping(request, actor) {
      authorize(actor, 'decide-mapping')
      objectRequest(request, ['id', 'decision', 'reason'])
      requireIdle()
      if (
        !validId(request.id) ||
        !['accept', 'reject'].includes(request.decision) ||
        typeof request.reason !== 'string' ||
        !request.reason.trim() ||
        request.reason.length > 1000
      )
        throw new ActionError(
          400,
          'A review identity, decision and reason are required'
        )
      const state = store.mapping()
      const review = state.reviews.find((item) => item.id === request.id)
      if (!review) throw new ActionError(404, 'Mapping review not found')
      const status = request.decision === 'accept' ? 'accepted' : 'rejected'
      if (review.status !== 'pending') {
        if (
          review.status === status &&
          review.reason === request.reason &&
          review.decidedBy === actor.id
        )
          return publicReview(review)
        throw new ActionError(409, 'Mapping review is already decided')
      }
      let accepted = contract
      if (status === 'accepted') {
        if (
          review.baseRevision !== state.revision ||
          review.baseDigest !== contract.digest
        )
          throw new ActionError(409, 'Mapping review base is stale')
        accepted = loadContract(repositoryRoot)
        if (accepted.digest !== review.candidate.digest)
          throw new ActionError(409, 'Mapping candidate changed after review')
        mappingDiff(contract, accepted)
        for (const record of store.list())
          evidenceOwner.validateStoredEvidence(accepted, record)
      }
      const decided = {
        ...review,
        status,
        decidedBy: actor.id,
        decidedAt: new Date().toISOString(),
        reason: request.reason
      }
      let evolution = state.evolution
      if (status === 'accepted') {
        const contentDigest = sha256(
          fs.readFileSync(safePath(repositoryRoot, accepted.testFile))
        )
        const candidate = {
          contract: accepted,
          selectors: accepted.cases.map((item) => ({
            caseId: item.id,
            file: accepted.testFile,
            testName: item.testName,
            contentDigest
          }))
        }
        const revision = compareVersion(evolution.history, candidate)
        evolution = {
          ...evolution,
          history: decideVersion(
            evolution.history,
            revision,
            candidate,
            { decision: 'accept', reason: request.reason },
            { id: actor.id, capabilities: ['decide-contract'] }
          )
        }
      }
      store.saveMapping({
        ...state,
        evolution,
        format: 1,
        revision: state.revision + Number(status === 'accepted'),
        accepted,
        reviews: state.reviews.map((item) =>
          item.id === review.id ? decided : item
        )
      })
      contract = accepted
      publicContract = projectContract()
      refreshShared()
      return publicReview(decided)
    },
    state() {
      const runs = store
        .list(20)
        .map(publicRecord)
        .map((record) => ({
          id: record.id,
          phase: record.phase,
          scenario: record.scenario,
          flowIds: record.flowIds,
          startedAt: record.startedAt,
          finishedAt: record.finishedAt,
          status: record.evidence?.status ?? 'unknown',
          digest: record.snapshot?.digest ?? null
        }))
      return {
        targets: targets.list(),
        reviewPolicy: reviews.policy(),
        tasks: {
          available: containmentAvailable(),
          providerAuthorization:
            agentOptions.providerComplete && agentOptions.providerAuthorization
              ? Object.fromEntries(
                  [
                    'id',
                    'actor',
                    'adapter',
                    'model',
                    'billing',
                    'maxRequests',
                    'expiresAt'
                  ].map((key) => [key, agentOptions.providerAuthorization[key]])
                )
              : null,
          policy: TASK_POLICY,
          activeId: tasks.activeId(),
          records: tasks
            .list()
            .slice(0, 20)
            .map((record) => ({
              id: record.id,
              stepId: record.task.stepId,
              objective: record.task.objective,
              phase: record.phase,
              usage: record.usage,
              providerRequests: record.providerRequests ?? [],
              verificationStatus: record.verificationStatus,
              workStatus: record.workStatus,
              deliveryStatus: record.deliveryStatus,
              reviewRevision: reviews.get(record.id)?.audit.length ?? 0,
              attemptCount: record.attempts.length
            }))
        },
        contract: publicContract,
        shared: sharedSnapshot,
        evolution: publicEvolution,
        ci: publicCI,
        work: publicWork,
        activeRunId: active?.id ?? null,
        runs,
        mapping: {
          revision: store.mapping().revision,
          acceptedVersion: contract.mappingVersion,
          reviews: store
            .mapping()
            .reviews.slice(-10)
            .reverse()
            .map(publicReview)
        }
      }
    },
    get: (id) => publicRecord(store.get(id)),
    readArtifact(id, name) {
      const record = publicRecord(store.get(id))
      const artifacts = {
        report: { file: 'vitest.json', digest: record.runner?.reportDigest },
        'ci-envelope': {
          file: 'ci-envelope.json',
          digest: record.ciEnvelopeDigest
        },
        'source-manifest': {
          file: 'source-manifest.json',
          digest: record.snapshot?.digest
        }
      }
      const artifact = artifacts[name]
      if (!artifact?.digest)
        throw new ActionError(404, 'Artifact is unavailable')
      const file = safePath(
        repositoryRoot,
        path.relative(repositoryRoot, path.join(directory, id, artifact.file))
      )
      if (!fs.existsSync(file) || !fs.statSync(file).isFile())
        throw new ActionError(404, 'Artifact is unavailable')
      if (fs.statSync(file).size > 2097152)
        throw new ActionError(413, 'Artifact exceeds size limit')
      const bytes = fs.readFileSync(file)
      if (sha256(bytes) !== artifact.digest)
        throw new ActionError(
          409,
          'Artifact fingerprint differs from retained evidence'
        )
      return bytes
    },
    start(request, actor) {
      authorize(actor, 'verify')
      if (closed) throw new ActionError(409, 'Service is closing')
      if (
        !request ||
        typeof request !== 'object' ||
        Array.isArray(request) ||
        Object.keys(request).some(
          (key) => !['scenario', 'flowIds', 'requestId', 'mode'].includes(key)
        )
      )
        throw new ActionError(400, 'Invalid verification request')
      const mode = request.mode ?? 'verify'
      if (!['verify', 'candidate', 'ci', 'ci-demo'].includes(mode))
        throw new ActionError(400, 'Unknown execution mode')
      if (mode === 'candidate') authorize(actor, 'preview-contract')
      if (mode === 'ci' || mode === 'ci-demo') authorize(actor, 'ci')
      const requestedContract =
        mode === 'candidate' ? loadContract(repositoryRoot) : contract
      const scenario = request.scenario ?? 'baseline'
      if (!requestedContract.scenarios.some((item) => item.id === scenario))
        throw new ActionError(400, 'Unknown scenario')
      const requestedFlows =
        request.flowIds ?? requestedContract.flows.map((flow) => flow.id)
      const flowIds = Array.isArray(requestedFlows)
        ? [...requestedFlows]
        : requestedFlows
      if (
        !Array.isArray(flowIds) ||
        !flowIds.length ||
        flowIds.length > requestedContract.flows.length ||
        new Set(flowIds).size !== flowIds.length ||
        flowIds.some(
          (id) => !requestedContract.flows.some((flow) => flow.id === id)
        )
      )
        throw new ActionError(
          400,
          'Unknown, duplicate, or empty flow selection'
        )
      if (
        (mode === 'ci' || mode === 'ci-demo') &&
        (flowIds.length !== requestedContract.flows.length ||
          (mode === 'ci' && scenario !== 'baseline') ||
          (mode === 'ci-demo' && scenario === 'baseline'))
      )
        throw new ActionError(
          400,
          'CI requires all supported flows and baseline scenario'
        )
      if (request.requestId !== undefined && !validId(request.requestId))
        throw new ActionError(400, 'Invalid request identity')
      if (request.requestId && store.get(request.requestId)) {
        const previous = store.get(request.requestId)
        if (
          (previous.mode ?? 'verify') !== mode ||
          previous.actor !== actor.id ||
          previous.scenario !== scenario ||
          JSON.stringify(previous.flowIds) !== JSON.stringify(flowIds)
        )
          throw new ActionError(
            409,
            'Request identity conflicts with an existing attempt'
          )
        return previous.id
      }
      requireIdle()
      const current =
        mode === 'candidate' ? requestedContract : loadContract(repositoryRoot)
      if (mode !== 'candidate' && current.digest !== contract.digest)
        throw new ActionError(
          409,
          'Working mapping differs from the accepted contract; prepare a mapping review before verification'
        )
      const id = request.requestId ?? randomUUID()
      const controller = new AbortController()
      const record = {
        format: 2,
        mode,
        mappingRevision: store.mapping().revision,
        contractDigest: current.digest,
        id,
        actor: actor.id,
        phase: 'running',
        scenario,
        flowIds,
        startedAt: new Date().toISOString(),
        audit: [event('admitted')]
      }
      store.save(record)
      active = { id, controller }
      refreshShared()
      const completion = Promise.resolve().then(async () => {
        try {
          const runDirectory = path.join(directory, id)
          const snapshot = capture(repositoryRoot, runDirectory, current)
          const ciContext =
            mode === 'ci' || mode === 'ci-demo'
              ? prepareCIContext(repositoryRoot, acceptedBase, snapshot, {
                  runId: process.env.GITHUB_RUN_ID ?? id,
                  attempt: Number(process.env.GITHUB_RUN_ATTEMPT ?? 1),
                  head: process.env.FLOW_CI_HEAD
                })
              : null
          const identity = Object.fromEntries(
            Object.entries(snapshot).filter(
              ([key]) => !['sourceRoot', 'files'].includes(key)
            )
          )
          update(id, { snapshot: identity }, 'source-captured')
          const result = await runner({
            repositoryRoot,
            runDirectory,
            snapshot,
            contract: current,
            scenario,
            flowIds,
            signal: controller.signal,
            timeoutMs,
            onSpawn: (pid) => update(id, { runnerPid: pid }, 'runner-started')
          })
          const evidence = evidenceOwner.assessEvidence(
            current,
            snapshot,
            result,
            flowIds,
            scenario
          )
          let ciFields = {}
          if (ciContext) {
            const report = fs.existsSync(result.reportPath ?? '')
              ? fs.readFileSync(result.reportPath, 'utf8')
              : ''
            const envelope = {
              format: 1,
              ...ciContext.expected,
              provider:
                process.env.GITHUB_ACTIONS === 'true'
                  ? 'github-actions'
                  : 'local-ci-trial',
              policyDigest: ciContext.candidatePolicyDigest,
              observedAt: new Date().toISOString(),
              snapshot,
              runner: { ...result, report: undefined, reportPath: undefined },
              report
            }
            const ci = assessCI(
              ciContext.accepted,
              current,
              ciContext.expected,
              envelope
            )
            ci.blockers.push(...ciContext.policyIssues)
            if (ciContext.policyIssues.length) {
              ci.deliveryStatus = 'blocked'
              if (ci.verificationStatus === 'passed')
                ci.verificationStatus = 'unknown'
            }
            const envelopePath = path.join(runDirectory, 'ci-envelope.json')
            writeAtomic(envelopePath, envelope)
            ciFields = {
              ci,
              ciEnvelopeDigest: sha256(fs.readFileSync(envelopePath))
            }
          }
          let phase = 'completed'
          if (result.reason === 'cancelled') phase = 'cancelled'
          else if (result.reason === 'timeout') phase = 'timed-out'
          else if (result.reason || result.reportError) phase = 'error'
          update(
            id,
            {
              phase,
              ...ciFields,
              finishedAt: new Date().toISOString(),
              evidence,
              runner: {
                code: result.code,
                reason: result.reason,
                version: result.version,
                environment: result.environment,
                identity: result.identity,
                reportDigest: result.reportDigest,
                output: result.output,
                reportPath: path.relative(
                  repositoryRoot,
                  result.reportPath ?? runDirectory
                )
              },
              artifactDirectory: path.relative(repositoryRoot, runDirectory)
            },
            'runner-settled'
          )
        } catch (error) {
          update(
            id,
            {
              phase: 'error',
              finishedAt: new Date().toISOString(),
              error: error.message
            },
            'attempt-error'
          )
        } finally {
          if (active?.id === id) active = null
          refreshShared()
        }
        return store.get(id)
      })
      pending.set(id, completion)
      completion.finally(() => pending.delete(id)).catch(() => undefined)
      return id
    },
    async wait(id) {
      if (pending.has(id)) await pending.get(id)
      return publicRecord(store.get(id))
    },
    async cancel(id, actor) {
      authorize(actor, 'cancel')
      if (!active || active.id !== id)
        throw new ActionError(409, 'Attempt is not active')
      update(id, {}, 'cancel-requested')
      active.controller.abort()
      return pending.get(id)
    },
    async close() {
      closed = true
      try {
        await reviews.close()
        await tasks.close()
        if (active) {
          const id = active.id
          active.controller.abort()
          await pending.get(id)
        }
      } finally {
        store.close()
      }
    }
  }
}
module.exports = { createService, LOCAL_ACTOR, ActionError }

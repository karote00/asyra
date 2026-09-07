/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const fs = require('node:fs')
const { randomUUID } = require('node:crypto')
const { loadContract, mappingDiff } = require('./contracts.cjs')
const { captureSource, safePath, sha256 } = require('./snapshot.cjs')
const { runVerification } = require('./runner.cjs')
const evidenceOwner = require('./evidence.cjs')
const { openStore, validId } = require('./store.cjs')

const LOCAL_ACTOR = Object.freeze({
  id: 'local-developer',
  capabilities: Object.freeze([
    'verify',
    'cancel',
    'prepare-mapping',
    'decide-mapping'
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
    timeoutMs = 30000
  } = {}
) {
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
    contract = loadContract(repositoryRoot, accepted.definition)
    if (contract.digest !== accepted.digest)
      throw new Error(
        'Accepted architecture changed; a new contract activation is required'
      )
    for (const record of store.list())
      evidenceOwner.validateStoredEvidence(contract, record)
  } catch (error) {
    store.close()
    throw error
  }
  const projectContract = () =>
    Object.fromEntries(
      Object.entries(contract).filter(([key]) => key !== 'definition')
    )
  let publicContract = projectContract()
  let active = null
  let closed = false
  const pending = new Map()
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
      record.snapshot?.contractDigest === contract.digest
    return {
      ...record,
      matchesCurrentContract,
      workStatus: 'untracked',
      deliveryStatus: 'not-assessed'
    }
  }
  const requireIdle = () => {
    if (closed) throw new ActionError(409, 'Service is closing')
    if (active) throw new ActionError(409, 'An attempt is already running')
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
  return {
    contract: () => contract,
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
      store.saveMapping({
        format: 1,
        revision: state.revision + Number(status === 'accepted'),
        accepted,
        reviews: state.reviews.map((item) =>
          item.id === review.id ? decided : item
        )
      })
      contract = accepted
      publicContract = projectContract()
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
        contract: publicContract,
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
          (key) => !['scenario', 'flowIds', 'requestId'].includes(key)
        )
      )
        throw new ActionError(400, 'Invalid verification request')
      const scenario = request.scenario ?? 'baseline'
      if (!contract.scenarios.some((item) => item.id === scenario))
        throw new ActionError(400, 'Unknown scenario')
      const requestedFlows =
        request.flowIds ?? contract.flows.map((flow) => flow.id)
      const flowIds = Array.isArray(requestedFlows)
        ? [...requestedFlows]
        : requestedFlows
      if (
        !Array.isArray(flowIds) ||
        !flowIds.length ||
        flowIds.length > contract.flows.length ||
        new Set(flowIds).size !== flowIds.length ||
        flowIds.some((id) => !contract.flows.some((flow) => flow.id === id))
      )
        throw new ActionError(
          400,
          'Unknown, duplicate, or empty flow selection'
        )
      if (request.requestId !== undefined && !validId(request.requestId))
        throw new ActionError(400, 'Invalid request identity')
      if (request.requestId && store.get(request.requestId)) {
        const previous = store.get(request.requestId)
        if (
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
      const current = loadContract(repositoryRoot)
      if (current.digest !== contract.digest)
        throw new ActionError(
          409,
          'Working mapping differs from the accepted contract; prepare a mapping review before verification'
        )
      const id = request.requestId ?? randomUUID()
      const controller = new AbortController()
      const record = {
        format: 2,
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
      const completion = Promise.resolve().then(async () => {
        try {
          const runDirectory = path.join(directory, id)
          const snapshot = capture(repositoryRoot, runDirectory, current)
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
          let phase = 'completed'
          if (result.reason === 'cancelled') phase = 'cancelled'
          else if (result.reason === 'timeout') phase = 'timed-out'
          else if (result.reason || result.reportError) phase = 'error'
          update(
            id,
            {
              phase,
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
        }
        return store.get(id)
      })
      pending.set(id, completion)
      completion.finally(() => pending.delete(id)).catch(() => undefined)
      return id
    },
    async wait(id) {
      if (pending.has(id)) return pending.get(id)
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

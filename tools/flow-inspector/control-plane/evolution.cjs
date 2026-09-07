/* eslint-disable @typescript-eslint/no-require-imports */
const { createHash } = require('node:crypto')
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')
const fingerprint = (value) =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const requireValue = (condition, message) => {
  if (!condition) throw new Error('Contract evolution: ' + message)
}
const authorized = (actor, capability) =>
  requireValue(
    typeof actor?.id === 'string' &&
      actor.id.trim() &&
      actor.capabilities?.includes(capability),
    'action is not authorized'
  )
function validateVersion(version) {
  requireValue(
    fingerprint(version?.contract?.digest) &&
      Array.isArray(version.contract.cases) &&
      version.contract.cases.length &&
      Array.isArray(version.selectors),
    'invalid version'
  )
  const identities = new Set()
  for (const item of version.selectors) {
    requireValue(
      typeof item?.caseId === 'string' &&
        item.caseId &&
        !identities.has(item.caseId) &&
        typeof item.file === 'string' &&
        item.file &&
        !item.file.startsWith('/') &&
        !item.file.split('/').includes('..') &&
        typeof item.testName === 'string' &&
        item.testName.trim() &&
        fingerprint(item.contentDigest),
      'invalid or duplicate selector'
    )
    identities.add(item.caseId)
  }
}
function createHistory(version) {
  validateVersion(version)
  return freeze({
    format: 1,
    revision: 1,
    versions: [{ ...structuredClone(version), verificationStatus: 'unknown' }],
    decisions: []
  })
}
function compareVersion(history, candidate, { relations = [] } = {}) {
  validateVersion(candidate)
  const base = history.versions.at(-1)
  const before = new Map(base.contract.cases.map((c) => [c.id, c]))
  const after = new Map(candidate.contract.cases.map((c) => [c.id, c]))
  const previous = new Map(base.selectors.map((s) => [s.caseId, s]))
  const observed = new Map(candidate.selectors.map((s) => [s.caseId, s]))
  const changes = [],
    blockers = []
  for (const item of candidate.contract.cases) {
    const observation = observed.get(item.id)
    if (!observation || observation.testName !== item.testName)
      blockers.push({ kind: 'missing-selector', caseId: item.id })
    const old = before.get(item.id),
      selector = previous.get(item.id)
    if (!old)
      changes.push({
        kind: 'addition',
        caseId: item.id,
        before: null,
        after: item
      })
    else {
      if (old.testName !== item.testName)
        changes.push({
          kind: 'rename',
          caseId: item.id,
          before: old.testName,
          after: item.testName
        })
      if (selector && observation && selector.file !== observation.file)
        changes.push({
          kind: 'move',
          caseId: item.id,
          before: selector.file,
          after: observation.file
        })
      if (
        selector &&
        observation &&
        selector.contentDigest !== observation.contentDigest
      )
        changes.push({
          kind: 'content-change',
          caseId: item.id,
          before: selector.contentDigest,
          after: observation.contentDigest
        })
      if (old.stepId !== item.stepId || old.flowId !== item.flowId)
        changes.push({
          kind: 'content-change',
          caseId: item.id,
          before: old,
          after: item
        })
    }
  }
  for (const item of base.contract.cases)
    if (!after.has(item.id))
      changes.push({
        kind: 'deletion',
        caseId: item.id,
        before: item,
        after: null
      })
  for (const observation of candidate.selectors)
    if (!after.has(observation.caseId))
      blockers.push({ kind: 'unknown-evidence', caseId: observation.caseId })
  requireValue(Array.isArray(relations), 'invalid successor relations')
  const related = new Set()
  for (const relation of relations) {
    const { kind, before: predecessors, after: successors } = relation
    requireValue(
      ['split', 'merge'].includes(kind) &&
        Array.isArray(predecessors) &&
        Array.isArray(successors) &&
        predecessors.length &&
        successors.length &&
        new Set(predecessors).size === predecessors.length &&
        new Set(successors).size === successors.length &&
        predecessors.every((id) => before.has(id)) &&
        successors.every((id) => after.has(id)) &&
        (kind !== 'split' ||
          (predecessors.length === 1 && successors.length > 1)) &&
        (kind !== 'merge' ||
          (predecessors.length > 1 && successors.length === 1)),
      'invalid successor relation'
    )
    for (const id of predecessors) {
      requireValue(!related.has(id), 'conflicting successor relation')
      related.add(id)
    }
    changes.push(structuredClone(relation))
  }
  if (base.contract.digest !== candidate.contract.digest)
    changes.push({
      kind: 'content-change',
      before: base.contract.digest,
      after: candidate.contract.digest,
      affectedFlowIds: [
        ...new Set(
          [...base.contract.flows, ...candidate.contract.flows].map((f) => f.id)
        )
      ]
    })
  const result = {
    baseRevision: history.revision,
    baseDigest: hash(base),
    candidateDigest: hash(candidate),
    changes,
    blockers,
    relations: structuredClone(relations),
    invalidatesEvidence: changes.length > 0
  }
  return freeze({ ...result, id: hash(result) })
}
function decideVersion(history, review, candidate, request, actor) {
  authorized(actor, 'decide-contract')
  requireValue(
    ['accept', 'reject'].includes(request?.decision) &&
      typeof request.reason === 'string' &&
      request.reason.trim() &&
      request.reason.length <= 1000,
    'decision and reason are required'
  )
  const retirement = request.retirement ?? []
  requireValue(
    Array.isArray(retirement) &&
      new Set(retirement).size === retirement.length &&
      retirement.every((id) => typeof id === 'string'),
    'invalid retirement request'
  )
  const identity = hash({ reviewId: review.id, actor: actor.id, ...request })
  const decided = history.decisions.find((d) => d.reviewId === review.id)
  if (decided) {
    requireValue(decided.identity === identity, 'review already decided')
    return history
  }
  requireValue(
    history.revision === review.baseRevision &&
      hash(history.versions.at(-1)) === review.baseDigest,
    'review base is stale'
  )
  requireValue(
    hash(candidate) === review.candidateDigest,
    'candidate changed after review'
  )
  const verified = compareVersion(history, candidate, {
    relations: review.relations
  })
  requireValue(
    verified.id === review.id,
    'review content differs from owner comparison'
  )
  const accept = request.decision === 'accept'
  if (accept) {
    requireValue(!review.blockers.length, 'unresolved selector or evidence')
    const removed = review.changes
      .filter((c) => c.kind === 'deletion')
      .map((c) => c.caseId)
    requireValue(
      removed.length === retirement.length &&
        removed.every((id) => retirement.includes(id)),
      'explicit exact retirement set is required'
    )
    if (retirement.length) authorized(actor, 'retire-contract')
  } else requireValue(!retirement.length, 'rejection cannot retire obligations')
  const decision = {
    reviewId: review.id,
    identity,
    actor: actor.id,
    reason: request.reason,
    decision: request.decision,
    retirement: [...retirement],
    at: new Date().toISOString(),
    baseRevision: review.baseRevision,
    candidateDigest: review.candidateDigest,
    changes: review.changes
  }
  return freeze({
    format: 1,
    revision: history.revision + Number(accept),
    versions: accept
      ? [
          ...history.versions,
          { ...structuredClone(candidate), verificationStatus: 'unknown' }
        ]
      : history.versions,
    decisions: [...history.decisions, decision]
  })
}
module.exports = { createHistory, compareVersion, decideVersion }

/* eslint-disable @typescript-eslint/no-require-imports */
const { createHash } = require('node:crypto')
const path = require('node:path')
const { validId } = require('./store.cjs')
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
const targetAcceptanceRequestIdentity = (actorId, request) =>
  hash({
    actor: actorId,
    requestId: request.requestId,
    targetId: request.targetId,
    assessmentId: request.assessmentId,
    reason: request.reason,
    retirement: request.retirement
  })
function validateVerificationReference(version) {
  if (!Object.hasOwn(version, 'verificationSource')) return
  const reference = version.verificationSource
  const descriptor = reference?.descriptor
  const contract = version.contract
  const roles = {
    manifest: contract.manifestPath,
    architecture: contract.architecturePath,
    spec: contract.specPath,
    test: contract.testFile,
    configuration: contract.configFile
  }
  const shape = (value, keys) =>
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  requireValue(
    shape(reference, [
      'attemptId',
      'repository',
      'head',
      'sourceDigest',
      'configurationDigest',
      'descriptor'
    ]) &&
      validId(reference.attemptId) &&
      typeof reference.repository === 'string' &&
      path.isAbsolute(reference.repository) &&
      typeof reference.head === 'string' &&
      reference.head.trim() &&
      fingerprint(reference.sourceDigest) &&
      fingerprint(reference.configurationDigest),
    'invalid verification source reference'
  )
  requireValue(
    shape(descriptor, [
      'format',
      'contractDigest',
      'mappingVersion',
      'architectureVersion',
      'roles',
      'files',
      'digest'
    ]) &&
      descriptor.format === 1 &&
      descriptor.contractDigest === contract.digest &&
      descriptor.mappingVersion === contract.mappingVersion &&
      descriptor.architectureVersion === contract.architectureVersion &&
      fingerprint(descriptor.digest) &&
      shape(descriptor.roles, Object.keys(roles)) &&
      Object.entries(roles).every(
        ([role, file]) => descriptor.roles[role] === file
      ) &&
      new Set(Object.values(roles)).size === 5 &&
      Object.values(roles).every(
        (file) =>
          typeof file === 'string' &&
          !file.includes('\\') &&
          !file.includes('\0') &&
          file.split('/').every((part) => part && part !== '.' && part !== '..')
      ) &&
      Array.isArray(descriptor.files) &&
      descriptor.files.length === 5,
    'verification descriptor disagrees with admitted contract'
  )
  const paths = Object.values(roles).sort()
  requireValue(
    descriptor.files.every(
      (file, index) =>
        shape(file, ['path', 'size', 'digest']) &&
        file.path === paths[index] &&
        Number.isSafeInteger(file.size) &&
        file.size >= 0 &&
        fingerprint(file.digest)
    ),
    'invalid verification role entries'
  )
  const testDigest = descriptor.files.find(
    (file) => file.path === roles.test
  ).digest
  requireValue(
    version.selectors.every(
      (selector) =>
        selector.file === roles.test && selector.contentDigest === testDigest
    ),
    'verification selector does not bind captured test bytes'
  )
}
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
  validateVerificationReference(version)
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
  if (base.verificationSource && !candidate.verificationSource)
    blockers.push({ kind: 'missing-verification-source' })
  const verificationIdentity = (version) =>
    version.verificationSource
      ? {
          descriptorDigest: version.verificationSource.descriptor.digest,
          configurationDigest: version.verificationSource.configurationDigest
        }
      : null
  const beforeVerification = verificationIdentity(base),
    afterVerification = verificationIdentity(candidate)
  if (JSON.stringify(beforeVerification) !== JSON.stringify(afterVerification))
    changes.push({
      kind: 'content-change',
      subject: 'verification-source',
      before: beforeVerification,
      after: afterVerification,
      affectedFlowIds: [
        ...new Set(
          [...base.contract.flows, ...candidate.contract.flows].map(
            (flow) => flow.id
          )
        )
      ]
    })
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
function decideVersion(
  history,
  review,
  candidate,
  request,
  actor,
  options = {}
) {
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
  requireValue(
    !(accept && options.targetPinned && !options.targetAcceptance),
    'target-pinned review requires an exact target assessment'
  )
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
    changes: review.changes,
    ...(options.targetAcceptance
      ? {
          requestIdentity: options.requestIdentity,
          targetAcceptance: structuredClone(options.targetAcceptance)
        }
      : {})
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

function acceptTargetBaseline(
  history,
  review,
  candidate,
  assessment,
  request,
  actor
) {
  authorized(actor, 'decide-contract')
  const keys = ['requestId', 'targetId', 'assessmentId', 'reason', 'retirement']
  requireValue(
    request &&
      typeof request === 'object' &&
      !Array.isArray(request) &&
      Object.keys(request).length === keys.length &&
      keys.every((key) => Object.hasOwn(request, key)) &&
      validId(request.requestId) &&
      validId(request.targetId) &&
      validId(request.assessmentId) &&
      typeof request.reason === 'string' &&
      request.reason.trim() &&
      request.reason.length <= 1000 &&
      Array.isArray(request.retirement) &&
      new Set(request.retirement).size === request.retirement.length &&
      request.retirement.every((id) => typeof id === 'string'),
    'invalid target acceptance request'
  )
  if (request.retirement.length) authorized(actor, 'retire-contract')
  const requestIdentity = targetAcceptanceRequestIdentity(actor.id, request)
  const replay = history.decisions.find(
    (item) => item.targetAcceptance?.requestId === request.requestId
  )
  if (replay) {
    requireValue(
      replay.requestIdentity === requestIdentity,
      'target acceptance request identity conflicts'
    )
    return history
  }
  const projection = assessment?.projection
  const pin = assessment?.pins
  const source = projection?.source
  const sameIdentity = (value) =>
    value?.targetId === request.targetId &&
    value.allocationRevision === projection.allocationRevision &&
    JSON.stringify(value.acceptedBaseline) ===
      JSON.stringify(projection.acceptedBaseline) &&
    JSON.stringify(value.source) === JSON.stringify(source)
  const completeResult = (value) =>
    sameIdentity(value) &&
    value.contractDigest === candidate.contract.digest &&
    value.status === 'passed' &&
    Array.isArray(value.requiredObligationIds) &&
    value.requiredObligationIds.length > 0 &&
    new Set(value.requiredObligationIds).size ===
      value.requiredObligationIds.length &&
    Array.isArray(value.cases) &&
    value.cases.length === value.requiredObligationIds.length &&
    value.requiredObligationIds.every(
      (id) =>
        value.cases.filter((item) => item.id === id && item.status === 'passed')
          .length === 1
    ) &&
    Array.isArray(value.blockers) &&
    value.blockers.length === 0
  requireValue(
    assessment?.id === request.assessmentId &&
      assessment.actor === actor.id &&
      assessment.phase === 'completed' &&
      projection?.format === 2 &&
      projection.current === true &&
      projection.eligible === true &&
      projection.targetId === request.targetId &&
      Number.isInteger(projection.allocationRevision) &&
      projection.allocationRevision > 0 &&
      projection.acceptedBaseline?.contractDigest ===
        history.versions.at(-1).contract.digest &&
      pin?.acceptedVersion?.revision === history.revision &&
      pin.acceptedVersion.contractDigest ===
        history.versions.at(-1).contract.digest &&
      pin?.targetVerification?.reviewId === review.id &&
      pin.targetVerification.candidateDigest === review.candidateDigest &&
      review.candidateDigest === hash(candidate) &&
      projection.targetContract?.contractDigest === candidate.contract.digest &&
      completeResult(projection.targetContract) &&
      sameIdentity(projection.accepted) &&
      projection.accepted.status === 'passed' &&
      Array.isArray(projection.works) &&
      projection.works.length > 0 &&
      projection.works.every(
        (work) =>
          sameIdentity(work) &&
          work.status === 'passed' &&
          work.prerequisites?.status === 'passed'
      ) &&
      sameIdentity(projection.integration) &&
      projection.integration.contractDigest === candidate.contract.digest &&
      projection.integration.status === 'passed' &&
      Array.isArray(projection.integration.pending) &&
      projection.integration.pending.length === 0 &&
      typeof source?.repository === 'string' &&
      source.repository.trim() &&
      (source.head === null ||
        (typeof source.head === 'string' && source.head.trim())) &&
      fingerprint(source.runtimeSourceDigest),
    'target assessment is incomplete, stale or mismatched'
  )
  const targetAcceptance = {
    format: 1,
    requestId: request.requestId,
    targetId: request.targetId,
    assessmentId: request.assessmentId,
    allocationRevision: projection.allocationRevision,
    acceptedBaseline: projection.acceptedBaseline,
    acceptedVersion: pin.acceptedVersion,
    targetVerification: pin.targetVerification,
    contractDigest: candidate.contract.digest,
    source,
    resultingMappingRevision: projection.acceptedBaseline.revision + 1,
    resultingVersionRevision: history.revision + 1
  }
  return decideVersion(
    history,
    review,
    candidate,
    {
      decision: 'accept',
      reason: request.reason,
      retirement: request.retirement
    },
    actor,
    { targetPinned: true, targetAcceptance, requestIdentity }
  )
}

function validateTargetAcceptanceDecision(
  history,
  review,
  candidate,
  assessment,
  decision
) {
  const reference = decision?.targetAcceptance
  const result = assessment?.result
  const keys = [
    'format',
    'requestId',
    'targetId',
    'assessmentId',
    'allocationRevision',
    'acceptedBaseline',
    'acceptedVersion',
    'targetVerification',
    'contractDigest',
    'source',
    'resultingMappingRevision',
    'resultingVersionRevision'
  ]
  const sameIdentity = (value) =>
    value?.targetId === reference.targetId &&
    value.allocationRevision === reference.allocationRevision &&
    JSON.stringify(value.acceptedBaseline) ===
      JSON.stringify(result.acceptedBaseline) &&
    JSON.stringify(value.source) === JSON.stringify(reference.source)
  requireValue(
    decision?.decision === 'accept' &&
      reference &&
      typeof reference === 'object' &&
      !Array.isArray(reference) &&
      Object.keys(reference).length === keys.length &&
      keys.every((key) => Object.hasOwn(reference, key)) &&
      reference.format === 1 &&
      validId(reference.requestId) &&
      validId(reference.targetId) &&
      validId(reference.assessmentId) &&
      Number.isInteger(reference.allocationRevision) &&
      reference.allocationRevision > 0 &&
      Number.isInteger(reference.resultingMappingRevision) &&
      reference.resultingMappingRevision ===
        reference.acceptedBaseline?.revision + 1 &&
      Number.isInteger(reference.resultingVersionRevision) &&
      reference.resultingVersionRevision ===
        reference.acceptedVersion?.revision + 1 &&
      history.versions[reference.acceptedVersion.revision - 1]?.contract
        .digest === reference.acceptedVersion.contractDigest &&
      history.versions[reference.resultingVersionRevision - 1]?.contract
        .digest === candidate?.contract?.digest &&
      reference.contractDigest === candidate.contract.digest &&
      typeof reference.source?.repository === 'string' &&
      path.isAbsolute(reference.source.repository) &&
      (reference.source.head === null ||
        (typeof reference.source.head === 'string' &&
          reference.source.head.trim())) &&
      fingerprint(reference.source.runtimeSourceDigest) &&
      review?.id === decision.reviewId &&
      review.baseRevision === reference.acceptedVersion.revision &&
      review.candidateDigest ===
        reference.targetVerification?.candidateDigest &&
      reference.targetVerification.reviewId === review.id &&
      decision.baseRevision === review.baseRevision &&
      decision.candidateDigest === review.candidateDigest &&
      typeof decision.reason === 'string' &&
      decision.reason.trim() &&
      decision.reason.length <= 1000 &&
      Array.isArray(decision.retirement) &&
      new Set(decision.retirement).size === decision.retirement.length &&
      decision.retirement.every((id) => typeof id === 'string') &&
      decision.requestIdentity ===
        targetAcceptanceRequestIdentity(decision.actor, {
          requestId: reference.requestId,
          targetId: reference.targetId,
          assessmentId: reference.assessmentId,
          reason: decision.reason,
          retirement: decision.retirement
        }) &&
      assessment?.id === reference.assessmentId &&
      assessment.actor === decision.actor &&
      assessment.phase === 'completed' &&
      result?.format === 2 &&
      result.targetId === reference.targetId &&
      result.allocationRevision === reference.allocationRevision &&
      JSON.stringify(result.acceptedBaseline) ===
        JSON.stringify(reference.acceptedBaseline) &&
      JSON.stringify(result.source) === JSON.stringify(reference.source) &&
      JSON.stringify(assessment.pins?.acceptedVersion) ===
        JSON.stringify(reference.acceptedVersion) &&
      JSON.stringify(assessment.pins?.targetVerification) ===
        JSON.stringify(reference.targetVerification) &&
      result.targetContract?.contractDigest === candidate.contract.digest &&
      result.targetContract.status === 'passed' &&
      Array.isArray(result.targetContract.requiredObligationIds) &&
      result.targetContract.requiredObligationIds.length > 0 &&
      Array.isArray(result.targetContract.cases) &&
      result.targetContract.cases.length ===
        result.targetContract.requiredObligationIds.length &&
      result.targetContract.requiredObligationIds.every(
        (id) =>
          result.targetContract.cases.filter(
            (item) => item.id === id && item.status === 'passed'
          ).length === 1
      ) &&
      Array.isArray(result.targetContract.blockers) &&
      result.targetContract.blockers.length === 0 &&
      sameIdentity(result.accepted) &&
      result.accepted.status === 'passed' &&
      Array.isArray(result.works) &&
      result.works.length > 0 &&
      result.works.every(
        (work) =>
          sameIdentity(work) &&
          work.status === 'passed' &&
          work.prerequisites?.status === 'passed'
      ) &&
      sameIdentity(result.integration) &&
      result.integration.contractDigest === candidate.contract.digest &&
      result.integration.status === 'passed' &&
      Array.isArray(result.integration.pending) &&
      result.integration.pending.length === 0,
    'invalid retained target acceptance authority'
  )
  return true
}

module.exports = {
  createHistory,
  compareVersion,
  decideVersion,
  acceptTargetBaseline,
  validateTargetAcceptanceDecision
}

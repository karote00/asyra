const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const statusFor = (statuses, blockers = [], absent = 'unknown') => {
  if (statuses.includes('failed')) return 'failed'
  if (blockers.length || statuses.includes('unknown')) return 'unknown'
  if (statuses.includes('pending')) return 'pending'
  return statuses.length ? 'passed' : absent
}

function projectTargetAssessmentCurrentness(result, current) {
  const staleReasons = []
  if (
    current?.targetId !== result.targetId ||
    current?.allocationRevision !== result.allocationRevision
  )
    staleReasons.push('Target allocation changed')
  if (
    current?.acceptedBaseline?.revision !== result.acceptedBaseline.revision ||
    current?.acceptedBaseline?.contractDigest !==
      result.acceptedBaseline.contractDigest
  )
    staleReasons.push('Accepted baseline changed')
  if (
    ['repository', 'head', 'runtimeSourceDigest'].some(
      (key) => current?.source?.[key] !== result.source[key]
    )
  )
    staleReasons.push('Integration source changed')
  return Object.freeze({
    ...result,
    current: staleReasons.length === 0,
    staleReasons: Object.freeze(staleReasons),
    eligible:
      staleReasons.length === 0 && result.integration.status === 'passed'
  })
}

function assessTargetSource(input) {
  const {
    target,
    allocationRevision,
    acceptedContract,
    targetContract,
    acceptedVerificationSourceDigest,
    targetVerificationSourceDigest,
    sourceAdmission,
    proofRequests,
    current
  } = input
  const entry = target?.history?.filter(
    (item) => item.revision === allocationRevision
  )
  const flow = targetContract?.flows?.find((item) => item.id === target?.flowId)
  if (
    entry?.length !== 1 ||
    !flow ||
    target.targetRevision !== targetContract.digest ||
    target.acceptedBaseline?.contractDigest !== acceptedContract?.digest ||
    !same(
      target.obligations,
      targetContract.cases.filter((item) => item.flowId === target.flowId)
    ) ||
    ![acceptedVerificationSourceDigest, targetVerificationSourceDigest].every(
      (digest) => typeof digest === 'string' && /^[a-f0-9]{64}$/.test(digest)
    ) ||
    !sourceAdmission?.runtimeSource ||
    !Array.isArray(proofRequests)
  )
    throw new Error('Target assessment: invalid selected owner artifacts')
  const state = entry[0].state
  const source = {
    repository: sourceAdmission.repository,
    head: sourceAdmission.head,
    runtimeSourceDigest: sourceAdmission.runtimeSource.digest
  }
  const identity = {
    targetId: target.id,
    allocationRevision,
    acceptedBaseline: target.acceptedBaseline,
    source
  }
  const observations = new Map()
  const requested = new Set()
  const requestIds = new Map()
  for (const request of proofRequests)
    requestIds.set(request.id, (requestIds.get(request.id) ?? 0) + 1)
  const contracts = new Map(
    [acceptedContract, targetContract].map((contract) => [
      contract.digest,
      contract
    ])
  )
  const verificationIdentities = new Set([
    acceptedContract.digest + ':' + acceptedVerificationSourceDigest,
    targetContract.digest + ':' + targetVerificationSourceDigest
  ])
  const globalBlockers = []
  for (const request of proofRequests) {
    const contract = contracts.get(request.contractDigest)
    const proofIdentity =
      request.contractDigest + ':' + request.verificationSourceDigest
    if (
      !contract ||
      !verificationIdentities.has(proofIdentity) ||
      !Array.isArray(request.flowIds) ||
      !request.flowIds.length ||
      new Set(request.flowIds).size !== request.flowIds.length ||
      request.flowIds.some(
        (id) => !contract.flows.some((item) => item.id === id)
      )
    ) {
      globalBlockers.push('Unresolved producer contract or flow inventory')
      continue
    }
    request.flowIds.forEach((id) => requested.add(proofIdentity + ':' + id))
    const expected = contract.cases.filter((item) =>
      request.flowIds.includes(item.flowId)
    )
    const { record, sourceAdmission: admitted } = request
    const snapshot = record?.snapshot
    const evidence = record?.evidence
    const runner = record?.runner?.identity
    const bound =
      record?.phase === 'completed' &&
      admitted?.verificationSource?.digest ===
        request.verificationSourceDigest &&
      snapshot?.verificationSource?.digest ===
        request.verificationSourceDigest &&
      admitted.contractDigest === contract.digest &&
      admitted.mappingVersion === contract.mappingVersion &&
      admitted.architectureVersion === contract.architectureVersion &&
      admitted.configurationDigest === snapshot.configurationDigest &&
      record.id === request.id &&
      admitted?.attemptId === request.id &&
      admitted.repository === source.repository &&
      admitted.head === source.head &&
      admitted.runtimeSource?.format === 1 &&
      admitted.runtimeSource.digest === source.runtimeSourceDigest &&
      snapshot?.head === admitted.head &&
      snapshot?.digest === admitted.sourceDigest &&
      snapshot?.runtimeSource?.digest === admitted.runtimeSource.digest &&
      evidence?.runtimeSourceDigest === admitted.runtimeSource.digest &&
      runner?.runtimeSourceDigest === admitted.runtimeSource.digest &&
      runner?.sourceDigest === snapshot.digest &&
      runner?.lockfileDigest === snapshot.lockfileDigest &&
      snapshot.contractDigest === contract.digest &&
      runner.contractDigest === contract.digest &&
      snapshot.mappingVersion === contract.mappingVersion &&
      runner.mappingVersion === contract.mappingVersion &&
      snapshot.architectureVersion === contract.architectureVersion &&
      runner.architectureVersion === contract.architectureVersion &&
      runner.configurationDigest === snapshot.configurationDigest &&
      same(record.flowIds, request.flowIds) &&
      same(runner.flowIds, request.flowIds) &&
      record.scenario === 'baseline' &&
      runner.scenario === record.scenario &&
      Array.isArray(evidence?.cases) &&
      Array.isArray(evidence?.issues)
    const completeInventory =
      bound &&
      evidence.cases.length === expected.length &&
      expected.every(
        (item) =>
          evidence.cases.filter(
            (observed) =>
              observed.id === item.id &&
              observed.flowId === item.flowId &&
              observed.stepId === item.stepId
          ).length === 1
      )
    for (const item of expected) {
      const key = proofIdentity + ':' + item.id
      const found = bound
        ? evidence.cases.filter(
            (observed) =>
              observed.id === item.id &&
              observed.flowId === item.flowId &&
              observed.stepId === item.stepId
          )
        : []
      const blockers = []
      if (!completeInventory)
        blockers.push('Incomplete producer observation inventory')
      if (!bound)
        blockers.push(
          'Producer is missing, unsettled or has mismatched provenance'
        )
      if (found.length !== 1)
        blockers.push('Missing or duplicate obligation observation')
      if (requestIds.get(request.id) !== 1)
        blockers.push('Duplicate producer request')
      if (bound && evidence.issues.length) blockers.push(...evidence.issues)
      const statuses = found.map((observed) =>
        ['passed', 'failed', 'pending'].includes(observed.status)
          ? observed.status
          : 'unknown'
      )
      const previous = observations.get(key) ?? []
      previous.push({
        status: statusFor(statuses, blockers),
        blockers,
        evidence: {
          attemptId: request.id,
          sourceDigest: snapshot?.digest ?? null,
          contractDigest: contract.digest,
          verificationSourceDigest: request.verificationSourceDigest,
          obligationId: item.id
        }
      })
      observations.set(key, previous)
    }
  }
  function assessCases(
    contract,
    cases,
    verificationSourceDigest,
    absent = 'unknown'
  ) {
    const proofIdentity = contract.digest + ':' + verificationSourceDigest
    const blockers = [...globalBlockers]
    const results = cases.map((item) => {
      const found = observations.get(proofIdentity + ':' + item.id) ?? []
      const reasons = found.flatMap((value) => value.blockers)
      if (found.length > 1)
        reasons.push('Multiple producers for one obligation')
      const missing = requested.has(proofIdentity + ':' + item.flowId)
        ? 'unknown'
        : absent
      if (!found.length && missing === 'unknown')
        reasons.push('Required proof is unavailable')
      blockers.push(...reasons)
      return {
        id: item.id,
        status: statusFor(
          found.map((value) => value.status),
          reasons,
          missing
        ),
        blockers: reasons,
        evidence: found.map((value) => value.evidence)
      }
    })
    return {
      ...identity,
      contractDigest: contract.digest,
      verificationSourceDigest,
      requiredObligationIds: cases.map((item) => item.id),
      cases: results,
      blockers: [...new Set(blockers)],
      status: statusFor(
        results.map((item) => item.status),
        blockers,
        absent
      )
    }
  }
  const accepted = assessCases(
    acceptedContract,
    acceptedContract.cases,
    acceptedVerificationSourceDigest
  )
  const worksById = new Map(state.works.map((work) => [work.id, work]))
  const ownById = new Map(
    state.works.map((work) => {
      const cases = target.obligations.filter((item) =>
        work.obligationIds.includes(item.id)
      )
      const own = assessCases(
        targetContract,
        cases,
        targetVerificationSourceDigest,
        'pending'
      )
      if (
        !cases.length ||
        cases.length !== work.obligationIds.length ||
        cases.some((item) => item.stepId !== work.stepId)
      )
        own.blockers.push('Invalid obligation promise for work: ' + work.id)
      if (
        work.obligationIds.some(
          (id) =>
            state.pending.includes(id) ||
            state.works.filter((other) => other.obligationIds.includes(id))
              .length !== 1
        )
      )
        own.blockers.push(
          'Overlapping obligation ownership for work: ' + work.id
        )
      own.status = statusFor(
        own.cases.map((item) => item.status),
        own.blockers,
        'pending'
      )
      return [work.id, own]
    })
  )
  const visiting = new Set()
  const completed = new Map()
  const assessWork = (work) => {
    if (completed.has(work.id)) return completed.get(work.id)
    if (visiting.has(work.id)) return { status: 'unknown' }
    visiting.add(work.id)
    const blockers = []
    const statuses = []
    const unavailable = []
    const routes = []
    for (const dep of work.prerequisites) {
      const upstream = worksById.get(dep.workId)
      if (!upstream || visiting.has(dep.workId)) {
        blockers.push('Unresolved or cyclic prerequisite work: ' + dep.workId)
        continue
      }
      const upstreamResult = assessWork(upstream)
      statuses.push(upstreamResult.status)
      if (upstreamResult.status !== 'passed')
        unavailable.push(
          'Prerequisite work ' + upstream.id + ' is ' + upstreamResult.status
        )
      if (
        !flow.handoffs.some(
          (route) => route.from === upstream.stepId && route.to === work.stepId
        )
      )
        blockers.push(
          'Prerequisite work ' +
            upstream.id +
            ' has no admitted architecture route to ' +
            work.stepId
        )
    }
    const incoming = targetContract.architectureDefinition.routes.filter(
      (route) => route.to === work.stepId && route.producedArtifacts.length
    )
    for (const route of incoming) {
      const admitted = flow.handoffs.filter((item) => item.id === route.id)
      if (
        admitted.length !== 1 ||
        !admitted[0].caseIds?.length ||
        !['required', 'bypassed'].includes(admitted[0].decision) ||
        (admitted[0].decision === 'bypassed' && !admitted[0].reason?.trim())
      ) {
        blockers.push('Missing or unresolved case-backed handoff: ' + route.id)
        continue
      }
      const handoff = admitted[0]
      const cases = target.obligations.filter((item) =>
        handoff.caseIds.includes(item.id)
      )
      if (cases.length !== handoff.caseIds.length)
        blockers.push('Unresolved handoff proving case: ' + route.id)
      const proof = assessCases(
        targetContract,
        cases,
        targetVerificationSourceDigest,
        'pending'
      )
      routes.push({
        routeId: route.id,
        decision: handoff.decision,
        reason: handoff.reason,
        proof
      })
      statuses.push(proof.status)
      if (proof.status !== 'passed')
        unavailable.push('Handoff ' + route.id + ' is ' + proof.status)
    }
    const own = ownById.get(work.id)
    const prerequisites = {
      ...identity,
      contractDigest: targetContract.digest,
      routes,
      blockers: [...blockers, ...unavailable],
      status:
        statuses.length || blockers.length
          ? statusFor(statuses, blockers)
          : 'passed'
    }
    const result = {
      id: work.id,
      ...identity,
      own,
      prerequisites,
      status: statusFor([own.status, prerequisites.status, accepted.status])
    }
    visiting.delete(work.id)
    completed.set(work.id, result)
    return result
  }
  const works = state.works.map(assessWork)
  const integration = assessCases(
    targetContract,
    target.obligations,
    targetVerificationSourceDigest,
    'pending'
  )
  const allocated = [
    ...state.pending,
    ...state.works.flatMap((work) => work.obligationIds)
  ]
  if (
    allocated.length !== target.obligations.length ||
    target.obligations.some(
      (item) => allocated.filter((id) => id === item.id).length !== 1
    )
  )
    integration.blockers.push('Incomplete or contradictory frozen allocation')
  integration.pending = [...state.pending]
  integration.status = statusFor(
    [
      integration.status,
      accepted.status,
      ...works.map((work) => work.status),
      ...(state.pending.length ? ['pending'] : [])
    ],
    integration.blockers
  )
  return projectTargetAssessmentCurrentness(
    freeze(
      structuredClone({ format: 1, ...identity, accepted, works, integration })
    ),
    current
  )
}

module.exports = { assessTargetSource, projectTargetAssessmentCurrentness }

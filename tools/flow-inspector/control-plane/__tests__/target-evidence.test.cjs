/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const sourceOwner = require('../snapshot.cjs')
const evidenceOwner = require('../evidence.cjs')
const { loadContract } = require('../contracts.cjs')
const { runVerification } = require('../runner.cjs')
const { createTargetOwner } = require('../flow-target.cjs')
const { assessTargetSource } = require('../target-evidence.cjs')
const root = path.resolve(__dirname, '../../../..')
let directory,
  repository,
  acceptedContract,
  targetContract,
  acceptedProof,
  targetProof,
  targetFailure,
  sameContractProof,
  sameContractFailure

test.before(async () => {
  const parent = path.join(root, 'tmp/flow-inspector/target-evidence-tests')
  fs.mkdirSync(parent, { recursive: true })
  directory = fs.mkdtempSync(path.join(parent, 'run-'))
  const initial = sourceOwner.captureSource(
    root,
    path.join(directory, 'initial'),
    loadContract(root)
  )
  repository = path.join(directory, 'repository')
  fs.cpSync(initial.sourceRoot, repository, { recursive: true })
  async function produce(label, expectedStatus = 'passed') {
    const contract = loadContract(repository)
    const id = randomUUID()
    const runDirectory = path.join(repository, '.proofs', label)
    const snapshot = sourceOwner.captureSource(
      repository,
      runDirectory,
      contract
    )
    const flowIds = contract.flows.map((flow) => flow.id)
    const runner = await runVerification({
      repositoryRoot: root,
      runDirectory,
      snapshot,
      contract,
      flowIds,
      scenario: 'baseline',
      timeoutMs: 15000
    })
    const sourceAdmission = Object.freeze({
      attemptId: id,
      repository,
      head: snapshot.head,
      sourceDigest: snapshot.digest,
      ...sourceOwner.validateSourceSnapshot(snapshot, contract),
      contractDigest: contract.digest,
      mappingVersion: contract.mappingVersion,
      architectureVersion: contract.architectureVersion,
      configurationDigest: snapshot.configurationDigest
    })
    const evidence = evidenceOwner.assessEvidence(
      contract,
      snapshot,
      runner,
      flowIds,
      'baseline',
      sourceAdmission
    )
    assert.equal(
      evidence.status,
      expectedStatus,
      JSON.stringify(evidence.issues)
    )
    const record = {
      id,
      phase: 'completed',
      snapshot,
      runner,
      evidence,
      flowIds,
      scenario: 'baseline'
    }
    evidenceOwner.validateStoredEvidence(contract, record, sourceAdmission)
    return {
      contract,
      request: {
        id,
        contractDigest: contract.digest,
        verificationSourceDigest: sourceAdmission.verificationSource.digest,
        flowIds,
        record,
        sourceAdmission
      }
    }
  }
  const accepted = await produce('accepted')
  acceptedContract = accepted.contract
  acceptedProof = accepted.request
  const config = path.join(repository, acceptedContract.configFile)
  fs.chmodSync(config, 0o600)
  fs.appendFileSync(config, '\n// Reviewed configuration variant\n')
  sameContractProof = (await produce('same-contract-configuration')).request
  const sameAssertions = path.join(repository, acceptedContract.testFile)
  const sameOriginal = fs.readFileSync(sameAssertions, 'utf8')
  fs.chmodSync(sameAssertions, 0o600)
  fs.writeFileSync(
    sameAssertions,
    sameOriginal.replace(
      'expect(deferred.history).toBe(1)',
      'expect(deferred.history).toBe(2)'
    )
  )
  sameContractFailure = (await produce('same-contract-failure', 'failed'))
    .request
  fs.writeFileSync(sameAssertions, sameOriginal)
  const manifest = path.join(repository, acceptedContract.manifestPath)
  const definition = JSON.parse(fs.readFileSync(manifest, 'utf8'))
  definition.flows[0].title += ' - Developing'
  fs.chmodSync(manifest, 0o600)
  fs.writeFileSync(manifest, JSON.stringify(definition))
  const target = await produce('target')
  targetContract = target.contract
  targetProof = target.request
  const assertions = path.join(repository, targetContract.testFile)
  const original = fs.readFileSync(assertions, 'utf8')
  const changed = original.replace(
    'expect(deferred.history).toBe(1)',
    'expect(deferred.history).toBe(2)'
  )
  assert.notEqual(changed, original)
  fs.chmodSync(assertions, 0o600)
  fs.writeFileSync(assertions, changed)
  targetFailure = (await produce('target-failure', 'failed')).request
  fs.writeFileSync(assertions, original)
  assert.deepEqual(
    targetFailure.record.evidence.cases
      .filter((item) => item.status === 'failed')
      .map((item) => item.id),
    ['deferred.outcome']
  )
  assert.equal(
    targetFailure.sourceAdmission.runtimeSource.digest,
    acceptedProof.sourceAdmission.runtimeSource.digest
  )
  assert.notEqual(targetContract.digest, acceptedContract.digest)
  assert.notEqual(
    targetProof.record.snapshot.digest,
    acceptedProof.record.snapshot.digest
  )
  assert.equal(
    targetProof.sourceAdmission.runtimeSource.digest,
    acceptedProof.sourceAdmission.runtimeSource.digest
  )
})
test.after(() => {
  if (directory) fs.rmSync(directory, { recursive: true, force: true })
})

function input({
  partial = false,
  sameContract = false,
  prerequisites = true,
  flowIndex = 0
} = {}) {
  const contract = sameContract ? acceptedContract : targetContract
  const proof = sameContract ? acceptedProof : targetProof
  const baseline = { revision: 1, contractDigest: acceptedContract.digest }
  const flow = contract.flows[flowIndex]
  const obligations = contract.cases.filter((item) => item.flowId === flow.id)
  const works = obligations.slice(0, partial ? 1 : undefined).map((item) => ({
    id: randomUUID(),
    title: item.id,
    stepId: item.stepId,
    obligationIds: [item.id],
    scope: 'Implement ' + item.id,
    allowedFiles: ['packages/factory/src/data-transact.ts'],
    prerequisites: []
  }))
  if (prerequisites && works.length > 1)
    works[1].prerequisites.push({
      workId: works[0].id,
      handoff: 'Use the admitted journal handoff'
    })
  const targetDirectory = path.join(repository, '.targets', randomUUID())
  fs.mkdirSync(targetDirectory, { recursive: true })
  const owner = createTargetOwner({
    repositoryRoot: repository,
    directory: targetDirectory,
    getContracts: () => [contract],
    getBaseline: () => baseline,
    getTask: () => null,
    getReview: () => null
  })
  const id = randomUUID()
  owner.decide(
    {
      action: 'create',
      requestId: id,
      expectedRevision: 0,
      reason: 'Source assessment case',
      flowId: flow.id,
      targetRevision: contract.digest,
      acceptedBaseline: baseline,
      objective: 'Integrate source-bound obligations',
      works,
      pending: partial ? obligations.slice(1).map((item) => item.id) : []
    },
    'test owner'
  )
  const sourceAdmission = proof.sourceAdmission
  return {
    target: owner.get(id),
    allocationRevision: 1,
    acceptedContract,
    targetContract: contract,
    acceptedVerificationSourceDigest: acceptedProof.verificationSourceDigest,
    targetVerificationSourceDigest: proof.verificationSourceDigest,
    sourceAdmission,
    proofRequests: sameContract
      ? [acceptedProof]
      : [acceptedProof, targetProof],
    current: {
      targetId: id,
      allocationRevision: 1,
      acceptedBaseline: baseline,
      source: {
        repository,
        head: sourceAdmission.head,
        runtimeSourceDigest: sourceAdmission.runtimeSource.digest
      }
    }
  }
}
const clone = (value) => structuredClone(value)

test('real distinct-contract producers prove exact accepted preservation, bounded commitments and eligible integration without mutating owners', () => {
  const value = input()
  const before = JSON.stringify(value)
  const result = assessTargetSource(value)
  assert.equal(result.accepted.status, 'passed')
  assert.equal(
    result.works.every((work) => work.status === 'passed'),
    true
  )
  assert.equal(result.integration.status, 'passed')
  assert.equal(result.eligible, true)
  assert.equal(result.current, true)
  assert.equal(result.accepted.contractDigest, acceptedContract.digest)
  assert.equal(result.integration.contractDigest, targetContract.digest)
  assert.equal(
    result.source.runtimeSourceDigest,
    targetProof.sourceAdmission.runtimeSource.digest
  )
  assert.equal(JSON.stringify(value), before)
  assert.ok(Object.isFrozen(result))
  assert.ok(Object.isFrozen(result.works))
  assert.ok(Object.isFrozen(result.works[0].own))
})

test('explicit pending allocation keeps integration pending while a source-proven independent promise passes', () => {
  const result = assessTargetSource(input({ partial: true }))
  assert.equal(result.works[0].status, 'passed')
  assert.equal(result.integration.status, 'pending')
  assert.equal(result.integration.pending.length, 2)
  assert.equal(result.eligible, false)
})

test('one producer can serve identical accepted and target contracts without becoming duplicate evidence', () => {
  assert.equal(assessTargetSource(input({ sameContract: true })).eligible, true)
})

test('unrequested work is pending but requested missing, running and error producers are unknown', () => {
  const value = input()
  value.proofRequests = [acceptedProof]
  const unrequested = assessTargetSource(value)
  assert.equal(unrequested.works[0].own.status, 'pending')
  assert.ok(unrequested.works.every((work) => work.status === 'pending'))
  assert.ok(
    unrequested.works.every((work) => work.prerequisites.status === 'pending')
  )
  for (const phase of [null, 'running', 'error']) {
    value.proofRequests = [
      acceptedProof,
      {
        id: targetProof.id,
        contractDigest: targetContract.digest,
        flowIds: targetProof.flowIds,
        ...(phase ? { record: { id: targetProof.id, phase } } : {})
      }
    ]
    const result = assessTargetSource(value)
    assert.equal(result.works[0].own.status, 'unknown')
    assert.equal(result.eligible, false)
  }
  value.proofRequests = []
  assert.equal(assessTargetSource(value).accepted.status, 'unknown')
})

test('an unrelated unassigned target failure does not replace a bounded work result with aggregate failure', () => {
  const value = clone(input({ partial: true }))
  value.proofRequests[1] = targetFailure
  value.targetVerificationSourceDigest = targetFailure.verificationSourceDigest
  const result = assessTargetSource(value)
  assert.equal(result.works[0].status, 'passed')
  assert.equal(result.integration.status, 'failed')
  assert.equal(result.eligible, false)
})

test('accepted regression blocks otherwise passing work and survives duplicate evidence', () => {
  const value = clone(input())
  value.proofRequests[0].record.evidence.cases[0].status = 'failed'
  value.proofRequests[0].record.evidence.status = 'failed'
  let result = assessTargetSource(value)
  assert.equal(result.accepted.status, 'failed')
  assert.equal(result.works[0].own.status, 'passed')
  assert.notEqual(result.works[0].status, 'passed')
  value.proofRequests.push(acceptedProof)
  result = assessTargetSource(value)
  assert.equal(result.accepted.status, 'failed')
  assert.equal(result.eligible, false)
  assert.ok(result.accepted.blockers.length)
})

test('duplicate producers, missing observations and mixed source or contract identities cannot pass', () => {
  const cases = [
    (v) => v.proofRequests.push(clone(targetProof)),
    (v) => v.proofRequests[1].record.evidence.cases.pop(),
    (v) => {
      v.proofRequests[1].sourceAdmission.repository += '-other'
    },
    (v) => {
      v.proofRequests[1].sourceAdmission.head = 'other-head'
    },
    (v) => {
      v.proofRequests[1].sourceAdmission.runtimeSource.digest = 'a'.repeat(64)
    },
    (v) => {
      v.proofRequests[1].sourceAdmission.sourceDigest = 'b'.repeat(64)
    },
    (v) => {
      v.proofRequests[1].record.snapshot.contractDigest =
        acceptedContract.digest
    },
    (v) => {
      v.proofRequests[1].sourceAdmission.attemptId = randomUUID()
    },
    (v) => {
      delete v.proofRequests[1].record.snapshot.runtimeSource
    },
    (v) => {
      v.proofRequests[1].record.evidence.issues.push('Unsettled producer')
    }
  ]
  for (const corrupt of cases) {
    const value = clone(input())
    corrupt(value)
    const result = assessTargetSource(value)
    assert.equal(result.eligible, false)
    assert.notEqual(result.integration.status, 'passed')
  }
})

test('handoffs require admitted route evidence and prerequisite promises, including bypass reasons', () => {
  const mutations = [
    (v) => {
      v.targetContract.flows[0].handoffs = []
    },
    (v) => {
      v.targetContract.flows[0].handoffs[1].caseIds = []
    },
    (v) => {
      Object.assign(v.targetContract.flows[0].handoffs[1], {
        decision: 'bypassed',
        reason: ''
      })
    },
    (v) => {
      v.target.history[0].state.works[1].prerequisites[0].workId = randomUUID()
    },
    (v) => {
      v.proofRequests[1].record.evidence.cases[0].status = 'failed'
    }
  ]
  for (const mutate of mutations) {
    const value = clone(input())
    mutate(value)
    const result = assessTargetSource(value)
    assert.notEqual(result.works[1].prerequisites.status, 'passed')
    assert.notEqual(result.works[1].status, 'passed')
    assert.equal(result.eligible, false)
  }
})

test('current source, allocation and accepted-base changes stale eligibility without rewriting historical verdicts', () => {
  for (const mutate of [
    (v) => {
      v.current.allocationRevision++
    },
    (v) => {
      v.current.acceptedBaseline.revision++
    },
    (v) => {
      v.current.source.runtimeSourceDigest = 'a'.repeat(64)
    }
  ]) {
    const value = clone(input())
    mutate(value)
    const result = assessTargetSource(value)
    assert.equal(result.integration.status, 'passed')
    assert.equal(result.current, false)
    assert.equal(result.eligible, false)
    assert.ok(result.staleReasons.length)
  }
})

test('assessment consumes completed owner artifacts without file reads, source validation, evidence revalidation or raw reassessment', (t) => {
  const value = input()
  const forbidden = () => {
    throw new Error('Repeated upstream work')
  }
  const reads = t.mock.method(fs, 'readFileSync', forbidden)
  const source = t.mock.method(sourceOwner, 'validateRuntimeSource', forbidden)
  const combined = t.mock.method(
    sourceOwner,
    'validateSourceSnapshot',
    forbidden
  )
  const raw = t.mock.method(evidenceOwner, 'assessEvidence', forbidden)
  const retained = t.mock.method(
    evidenceOwner,
    'validateStoredEvidence',
    forbidden
  )
  assert.equal(assessTargetSource(value).eligible, true)
  for (const method of [reads, source, combined, raw, retained])
    assert.equal(method.mock.callCount(), 0)
})

test('a real admitted bypass requires and consumes its current proving case', () => {
  const result = assessTargetSource(input({ flowIndex: 1 }))
  assert.equal(result.eligible, true)
  const bypass = result.works
    .flatMap((work) => work.prerequisites.routes)
    .find((route) => route.decision === 'bypassed')
  assert.ok(bypass.reason)
  assert.equal(bypass.proof.status, 'passed')
})

test('cyclic or overlapping commitments cannot become completed work', () => {
  for (const corrupt of [
    (v) =>
      v.target.history[0].state.works[0].prerequisites.push({
        workId: v.target.history[0].state.works[1].id,
        handoff: 'Cycle'
      }),
    (v) =>
      v.target.history[0].state.works[1].obligationIds.push(
        v.target.history[0].state.works[0].obligationIds[0]
      )
  ]) {
    const value = clone(input())
    corrupt(value)
    const result = assessTargetSource(value)
    assert.equal(result.eligible, false)
    assert.notEqual(result.works[1].status, 'passed')
  }
})

test('integration failure cannot be replaced by individual green history and later recovery does not rewrite it', () => {
  const value = clone(input())
  const previous = assessTargetSource(value)
  value.proofRequests[1] = targetFailure
  value.targetVerificationSourceDigest = targetFailure.verificationSourceDigest
  const failed = assessTargetSource(value)
  const retained = JSON.stringify(failed)
  assert.equal(failed.integration.status, 'failed')
  assert.equal(failed.works[0].own.status, 'passed')
  assert.equal(failed.eligible, false)
  assert.equal(previous.integration.status, 'passed')
  assert.equal(assessTargetSource(input()).eligible, true)
  assert.equal(JSON.stringify(failed), retained)
})

test('unavailable prerequisite identifies its work while leaving the consumer own promise distinct', () => {
  const value = clone(input())
  value.proofRequests[1].record.evidence.cases[0].status = 'unknown'
  const result = assessTargetSource(value)
  assert.equal(result.works[1].own.status, 'passed')
  assert.notEqual(result.works[1].prerequisites.status, 'passed')
  assert.ok(
    result.works[1].prerequisites.blockers.some((reason) =>
      reason.includes(result.works[0].id)
    )
  )
})

test('missing frozen allocation coverage and ambiguous selection cannot grant eligibility', () => {
  const value = clone(input())
  value.target.history[0].state.works.pop()
  assert.equal(assessTargetSource(value).eligible, false)
  value.allocationRevision = 99
  assert.throws(() => assessTargetSource(value), /selected owner artifacts/)
})

test('currentness compares identity values independently of object insertion order', () => {
  const value = input()
  value.current.source = {
    runtimeSourceDigest: value.current.source.runtimeSourceDigest,
    head: value.current.source.head,
    repository: value.current.source.repository
  }
  value.current.acceptedBaseline = {
    contractDigest: value.current.acceptedBaseline.contractDigest,
    revision: value.current.acceptedBaseline.revision
  }
  assert.equal(assessTargetSource(value).eligible, true)
})

test('same-contract distinct admitted verification bytes preserve separate accepted and target proof roles', () => {
  for (const proof of [sameContractProof, sameContractFailure]) {
    const value = input({ sameContract: true })
    assert.equal(proof.contractDigest, acceptedProof.contractDigest)
    assert.notEqual(
      proof.verificationSourceDigest,
      acceptedProof.verificationSourceDigest
    )
    assert.equal(
      proof.sourceAdmission.runtimeSource.digest,
      acceptedProof.sourceAdmission.runtimeSource.digest
    )
    value.targetVerificationSourceDigest = proof.verificationSourceDigest
    value.proofRequests = [acceptedProof, proof]
    const result = assessTargetSource(value)
    assert.equal(result.accepted.status, 'passed')
    assert.equal(
      result.integration.status,
      proof === sameContractProof ? 'passed' : 'failed'
    )
    assert.equal(
      result.accepted.verificationSourceDigest,
      acceptedProof.verificationSourceDigest
    )
    assert.equal(
      result.integration.verificationSourceDigest,
      proof.verificationSourceDigest
    )
    assert.equal(result.eligible, proof === sameContractProof)
  }
})

test('verification identity absence and forged descriptor or configuration binding cannot grant assessment authority', () => {
  for (const mutate of [
    (v) => delete v.acceptedVerificationSourceDigest,
    (v) => delete v.targetVerificationSourceDigest
  ]) {
    const value = clone(input())
    mutate(value)
    assert.throws(
      () => assessTargetSource(value),
      /invalid selected owner artifacts/
    )
  }
  for (const mutate of [
    (v) => delete v.proofRequests[1].verificationSourceDigest,
    (v) => delete v.proofRequests[1].sourceAdmission.verificationSource,
    (v) =>
      (v.proofRequests[1].sourceAdmission.verificationSource.digest =
        '0'.repeat(64)),
    (v) =>
      (v.proofRequests[1].record.snapshot.verificationSource.digest =
        '0'.repeat(64)),
    (v) =>
      (v.proofRequests[1].sourceAdmission.configurationDigest = '0'.repeat(64)),
    (v) => (v.proofRequests[1].sourceAdmission.contractDigest = '0'.repeat(64)),
    (v) => (v.proofRequests[1].sourceAdmission.mappingVersion = 'other'),
    (v) => (v.proofRequests[1].sourceAdmission.architectureVersion = 'other')
  ]) {
    const value = clone(input())
    mutate(value)
    assert.equal(assessTargetSource(value).eligible, false)
  }
})

/* eslint-disable @typescript-eslint/no-require-imports */
const { createHash } = require('node:crypto')
const { assessEvidence } = require('./evidence.cjs')
const hash = (value) => createHash('sha256').update(value).digest('hex')
const identityFields = Object.freeze([
  'repository',
  'base',
  'head',
  'integration',
  'runId',
  'attempt',
  'sourceDigest',
  'configurationDigest',
  'lockfileDigest',
  'policyDigest'
])
const CHECK_NAME = 'flow-contract-aggregate'
function assessCI(accepted, candidate, expected, envelope) {
  const blockers = []
  let evidence = {
    status: 'unknown',
    issues: [],
    cases: [],
    flows: [],
    expectedCount: accepted.cases.length,
    passedCount: 0
  }
  const reject = (message) => blockers.push(message)
  if (
    !accepted.cases.length ||
    accepted.digest !== candidate.digest ||
    JSON.stringify(accepted.cases) !== JSON.stringify(candidate.cases) ||
    JSON.stringify(accepted.flows) !== JSON.stringify(candidate.flows)
  )
    reject(
      'Candidate differs from accepted supported obligations; explicit base revision is required'
    )
  const object = (value) =>
    value && typeof value === 'object' && !Array.isArray(value)
  if (
    !object(envelope) ||
    envelope.format !== 1 ||
    !['github-actions', 'local-ci-trial'].includes(envelope.provider)
  ) {
    reject('Missing or unsupported CI envelope')
  } else {
    for (const key of identityFields) {
      if (expected[key] === undefined || envelope[key] !== expected[key])
        reject('CI provenance or gate policy mismatch: ' + key)
    }
    if (
      !['base', 'head', 'integration'].every((key) =>
        /^[a-f0-9]{40}$/.test(expected[key] ?? '')
      ) ||
      ![
        'sourceDigest',
        'configurationDigest',
        'lockfileDigest',
        'policyDigest'
      ].every((key) => /^[a-f0-9]{64}$/.test(expected[key] ?? '')) ||
      !Number.isSafeInteger(expected.attempt) ||
      expected.attempt < 1 ||
      !Number.isFinite(Date.parse(envelope.observedAt))
    )
      reject('Invalid expected CI identity or observation time')
    const snapshot = envelope.snapshot
    if (
      !object(snapshot) ||
      snapshot.digest !== expected.sourceDigest ||
      snapshot.configurationDigest !== expected.configurationDigest ||
      snapshot.lockfileDigest !== expected.lockfileDigest
    )
      reject('Captured source provenance differs from integration inventory')
    if (
      !Array.isArray(snapshot?.files) ||
      !snapshot.files.length ||
      new Set(snapshot.files.map((file) => file?.path)).size !==
        snapshot.files.length ||
      snapshot.files.some(
        (file) =>
          typeof file?.path !== 'string' ||
          file.path.startsWith('/') ||
          file.path.split('/').includes('..') ||
          !Number.isSafeInteger(file.size) ||
          file.size < 0 ||
          !/^[a-f0-9]{64}$/.test(file.digest ?? '')
      ) ||
      hash(JSON.stringify(snapshot.files)) !== expected.sourceDigest ||
      snapshot.head !== expected.integration
    )
      reject(
        'Source manifest fingerprint or integration identity is inconsistent'
      )
    if (
      typeof envelope.report !== 'string' ||
      Buffer.byteLength(envelope.report) > 2097152 ||
      !object(envelope.runner) ||
      hash(envelope.report) !== envelope.runner.reportDigest
    ) {
      reject('Raw report artifact fingerprint is missing or inconsistent')
    } else if (object(snapshot)) {
      try {
        evidence = assessEvidence(
          accepted,
          snapshot,
          { ...envelope.runner, report: JSON.parse(envelope.report) },
          accepted.flows.map((f) => f.id),
          'baseline'
        )
      } catch {
        reject('Malformed raw CI evidence')
      }
    }
  }
  // Preserve real assertion failures even when unrelated provenance blocks delivery.
  let verificationStatus = evidence.status
  if (blockers.length && verificationStatus === 'passed')
    verificationStatus = 'unknown'
  if (evidence.status !== 'passed')
    reject('Required all-flow case evidence is not passing')
  if (envelope?.provider === 'local-ci-trial')
    reject('Local CI trial is not an externally executed delivery check')
  const protection = expected.protection
  if (
    !protection?.required ||
    !protection.strict ||
    protection.check !== CHECK_NAME ||
    protection.integration !== expected.integration ||
    protection.verifierPolicyDigest !== expected.policyDigest ||
    !['github-required-workflow', 'github-app'].includes(protection.source) ||
    typeof protection.sourceIdentity !== 'string' ||
    !protection.sourceIdentity.trim() ||
    !Number.isFinite(Date.parse(protection.observedAt))
  )
    reject(
      'External required-check and strict integration protection is unverified'
    )
  return {
    verificationStatus,
    deliveryStatus: blockers.length ? 'blocked' : 'eligible',
    blockers,
    evidence,
    baseline: {
      repository: expected.repository,
      base: expected.base,
      head: expected.head,
      integration: expected.integration
    },
    observedAt: envelope?.observedAt ?? null,
    check: CHECK_NAME
  }
}
module.exports = { assessCI, CHECK_NAME, identityFields }

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { isDeepStrictEqual } = require('node:util')
const { safePath, sha256 } = require('./snapshot.cjs')
const { validId, writeAtomic } = require('./store.cjs')
const { freeze, canonicalFile } = require('./agent-contract.cjs')
const REVIEW_POLICY = freeze({
  format: 1,
  states: [
    'preview',
    'submitting',
    'uncertain',
    'blocked',
    'submitted-for-review'
  ],
  capability: 'review-pr'
})
const need = (condition, message) => {
  if (!condition) throw new Error('PR review: ' + message)
}
const gitDigest = (bytes) =>
  createHash('sha1')
    .update('blob ' + bytes.length + '\0')
    .update(bytes)
    .digest('hex')
const METADATA_POLICY = freeze({
  version: 1,
  packageName: '@asyra/factory',
  manifestPath: 'packages/factory/package.json',
  sourcePrefix: 'packages/factory/src/',
  releaseType: 'patch'
})
function metadataPolicy(ownership) {
  const match = /^@asyra\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(
    ownership?.packageName ?? ''
  )
  const manifestPath = match && 'packages/' + match[1] + '/package.json'
  need(
    match &&
      ownership.path === manifestPath &&
      /^[a-f0-9]{64}$/.test(ownership.digest ?? ''),
    'invalid metadata package ownership'
  )
  return {
    version: METADATA_POLICY.version,
    packageName: ownership.packageName,
    manifestPath,
    sourcePrefix: 'packages/' + match[1] + '/src/',
    releaseType: METADATA_POLICY.releaseType
  }
}
function scopedSelection(selection) {
  need(
    selection &&
      typeof selection === 'object' &&
      !Array.isArray(selection) &&
      Object.keys(selection).length === 2 &&
      ['attemptId', 'assessmentId'].every((key) =>
        Object.hasOwn(selection, key)
      ),
    'invalid scoped review selection'
  )
  const captured = Object.freeze({
    attemptId: selection.attemptId,
    assessmentId: selection.assessmentId
  })
  need(
    validId(captured.attemptId) && validId(captured.assessmentId),
    'invalid scoped review selection'
  )
  return captured
}
function scopedPayload(scope) {
  // Retained review identity shape, not source admission or case assessment.
  const object = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
  const keys = (value, fields) =>
    object(value) && fields.every((key) => Object.hasOwn(value, key))
  const shape = (value, fields) =>
    keys(value, fields) && Object.keys(value).length === fields.length
  const digest = (value) =>
    typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
  const version = (value) =>
    shape(value, ['revision', 'contractDigest']) &&
    Number.isInteger(value.revision) &&
    value.revision > 0 &&
    digest(value.contractDigest)
  const runtimeFields = [
    'taskId',
    'attemptId',
    'repository',
    'head',
    'sourceDigest',
    'runtimeSourceDigest',
    'configurationDigest',
    'verificationSourceDigest',
    'executionSourceDigest',
    'contractDigest',
    'mappingVersion',
    'architectureVersion',
    'lockfileDigest'
  ]
  const authorityFields = [
    'runtimeAuthorityFormat',
    'runtimeAuthorityDigest',
    'contractScopeDigest'
  ]
  const runtimeScoped = authorityFields.some((key) =>
    Object.hasOwn(scope?.runtime ?? {}, key)
  )
  const reference = (value) =>
    shape(value, [
      'attemptId',
      'repository',
      'head',
      'sourceDigest',
      'configurationDigest',
      'descriptor'
    ]) &&
    validId(value.attemptId) &&
    typeof value.repository === 'string' &&
    value.repository.length > 0 &&
    (value.head === null || typeof value.head === 'string') &&
    digest(value.sourceDigest) &&
    digest(value.configurationDigest) &&
    shape(value.descriptor, [
      'format',
      'contractDigest',
      'mappingVersion',
      'architectureVersion',
      'roles',
      'files',
      'digest'
    ]) &&
    value.descriptor.format === 1 &&
    ['contractDigest', 'mappingVersion', 'architectureVersion', 'digest'].every(
      (key) => digest(value.descriptor[key])
    ) &&
    shape(value.descriptor.roles, [
      'manifest',
      'architecture',
      'spec',
      'test',
      'configuration'
    ]) &&
    Object.values(value.descriptor.roles).every(
      (value) => typeof value === 'string' && value.length > 0
    ) &&
    Array.isArray(value.descriptor.files) &&
    value.descriptor.files.length === 5 &&
    new Set(Object.values(value.descriptor.roles)).size === 5 &&
    Object.values(value.descriptor.roles).every(
      (rolePath) =>
        value.descriptor.files.filter((file) => file.path === rolePath)
          .length === 1
    ) &&
    value.descriptor.files.find(
      (file) => file.path === value.descriptor.roles.configuration
    )?.digest === value.configurationDigest &&
    value.descriptor.files.every(
      (file) =>
        shape(file, ['path', 'size', 'digest']) &&
        typeof file.path === 'string' &&
        Number.isSafeInteger(file.size) &&
        file.size >= 0 &&
        digest(file.digest)
    )
  const ids = ['assessmentId', 'taskId', 'attemptId', 'targetId', 'workId']
  const objects = [
    'workBinding',
    'acceptedBaseline',
    'acceptedVersion',
    'targetVerification',
    'roles',
    'runtime',
    'work',
    'integration'
  ]
  need(
    shape(scope, [...ids, ...objects, 'allocationRevision', 'producers']) &&
      ids.every((key) => validId(scope[key])) &&
      objects.every((key) => object(scope[key])) &&
      Number.isInteger(scope.allocationRevision) &&
      scope.allocationRevision > 0 &&
      shape(scope.workBinding, ['targetId', 'workId', 'admissionId']) &&
      validId(scope.workBinding.admissionId) &&
      scope.workBinding.targetId === scope.targetId &&
      scope.workBinding.workId === scope.workId &&
      version(scope.acceptedBaseline) &&
      version(scope.acceptedVersion) &&
      scope.acceptedVersion.contractDigest ===
        scope.acceptedBaseline.contractDigest &&
      shape(scope.targetVerification, ['reviewId', 'candidateDigest']) &&
      digest(scope.targetVerification.reviewId) &&
      digest(scope.targetVerification.candidateDigest) &&
      shape(scope.runtime, [
        ...runtimeFields,
        ...(runtimeScoped ? authorityFields : [])
      ]) &&
      scope.runtime.taskId === scope.taskId &&
      scope.runtime.attemptId === scope.attemptId &&
      typeof scope.runtime.repository === 'string' &&
      scope.runtime.repository.length > 0 &&
      (scope.runtime.head === null || typeof scope.runtime.head === 'string') &&
      [
        'sourceDigest',
        'runtimeSourceDigest',
        'configurationDigest',
        'verificationSourceDigest',
        'executionSourceDigest',
        'contractDigest',
        'mappingVersion',
        'architectureVersion',
        'lockfileDigest'
      ].every((key) => digest(scope.runtime[key])) &&
      scope.runtime.configurationDigest ===
        scope.runtime.executionSourceDigest &&
      (!runtimeScoped ||
        (scope.runtime.runtimeAuthorityFormat === 1 &&
          digest(scope.runtime.runtimeAuthorityDigest) &&
          digest(scope.runtime.contractScopeDigest))) &&
      scope.runtime.contractDigest === scope.acceptedBaseline.contractDigest &&
      shape(scope.roles, ['accepted', 'target']) &&
      ['accepted', 'target'].every((role) => {
        const item = scope.roles[role]
        return (
          shape(item, [
            'contractDigest',
            'verificationSourceDigest',
            'reference',
            'slotId'
          ]) &&
          validId(item.slotId) &&
          reference(item.reference) &&
          item.contractDigest === item.reference.descriptor.contractDigest &&
          item.verificationSourceDigest === item.reference.descriptor.digest
        )
      }) &&
      keys(scope.work, [
        'id',
        'targetId',
        'allocationRevision',
        'acceptedBaseline',
        'source',
        'own',
        'prerequisites',
        'status'
      ]) &&
      scope.work.id === scope.workId &&
      scope.work.targetId === scope.targetId &&
      scope.work.allocationRevision === scope.allocationRevision &&
      scope.work.status === 'passed' &&
      object(scope.work.own) &&
      object(scope.work.prerequisites) &&
      shape(scope.work.source, ['repository', 'head', 'runtimeSourceDigest']) &&
      scope.work.source.repository === scope.runtime.repository &&
      scope.work.source.head === scope.runtime.head &&
      scope.work.source.runtimeSourceDigest ===
        scope.runtime.runtimeSourceDigest &&
      isDeepStrictEqual(scope.work.acceptedBaseline, scope.acceptedBaseline) &&
      keys(scope.integration, ['status', 'cases', 'pending']) &&
      Array.isArray(scope.integration.cases) &&
      Array.isArray(scope.integration.pending) &&
      ['passed', 'failed', 'unknown', 'pending'].includes(
        scope.integration.status
      ) &&
      Array.isArray(scope.producers) &&
      scope.producers.length > 0 &&
      new Set(scope.producers.map((item) => item.id)).size ===
        scope.producers.length &&
      scope.producers.every(
        (item) =>
          shape(item, [
            'id',
            'roles',
            'contractDigest',
            'verificationSourceDigest',
            'reference',
            'sourceDigest',
            'configurationDigest',
            'runtimeSourceDigest',
            'executionSourceDigest',
            ...(runtimeScoped ? authorityFields : [])
          ]) &&
          validId(item.id) &&
          Array.isArray(item.roles) &&
          item.roles.length > 0 &&
          isDeepStrictEqual(
            item.roles,
            ['accepted', 'target'].filter(
              (role) => scope.roles[role].slotId === item.id
            )
          ) &&
          new Set(item.roles).size === item.roles.length &&
          item.roles.every(
            (role) =>
              ['accepted', 'target'].includes(role) &&
              scope.roles[role].slotId === item.id &&
              scope.roles[role].contractDigest === item.contractDigest &&
              scope.roles[role].verificationSourceDigest ===
                item.verificationSourceDigest
          ) &&
          reference(item.reference) &&
          isDeepStrictEqual(
            item.reference,
            scope.roles[item.roles[0]].reference
          ) &&
          item.reference.descriptor.digest === item.verificationSourceDigest &&
          [
            'sourceDigest',
            'configurationDigest',
            'runtimeSourceDigest',
            'executionSourceDigest'
          ].every((key) => digest(item[key])) &&
          item.runtimeSourceDigest === scope.runtime.runtimeSourceDigest &&
          (!runtimeScoped ||
            (item.runtimeAuthorityFormat ===
              scope.runtime.runtimeAuthorityFormat &&
              item.runtimeAuthorityDigest ===
                scope.runtime.runtimeAuthorityDigest &&
              item.contractScopeDigest ===
                scope.runtime.contractScopeDigest)) &&
          item.configurationDigest === item.executionSourceDigest
      ) &&
      ['accepted', 'target'].every(
        (role) =>
          scope.producers.filter((item) => item.roles.includes(role)).length ===
          1
      ),
    'invalid scoped review handoff identity'
  )
  return scope
}
function reviewFormat(record) {
  need(
    record.format === 1 || record.format === 2,
    'invalid retained delivery format'
  )
  if (record.format === 2) {
    const scope = scopedPayload(record.preview?.scopedWork)
    need(
      scope.taskId === record.taskId &&
        scope.attemptId === record.preview.attemptId &&
        ['passed', 'failed', 'unknown'].includes(
          record.preview.candidateVerification
        ),
      'invalid scoped preview identity'
    )
  } else
    need(
      !Object.hasOwn(record.preview ?? {}, 'scopedWork'),
      'scoped review requires format 2'
    )
}
function prepareMetadata(input) {
  const ownership = input.packageOwnership
  const policy = metadataPolicy(ownership)
  need(
    validId(input.taskId) && validId(input.attemptId),
    'invalid metadata package ownership'
  )
  need(
    input.changes.every(
      (c) =>
        canonicalFile(c.path) &&
        c.path.startsWith(policy.sourcePrefix) &&
        c.path.endsWith('.ts') &&
        !c.path.includes('/__tests__/')
    ),
    'invalid metadata source ownership'
  )
  const summary =
    input.adapter === 'demonstration'
      ? 'Deterministic demonstration - retain a ' +
        policy.packageName +
        ' runtime candidate for human review.'
      : 'Retain a locally verified ' +
        policy.packageName +
        ' runtime candidate for human review.'
  const content =
    '---\n"' +
    policy.packageName +
    '": ' +
    policy.releaseType +
    '\n---\n\n' +
    summary +
    '\n'
  return {
    policyVersion: policy.version,
    packageName: policy.packageName,
    releaseType: policy.releaseType,
    ownership,
    path:
      '.changeset/flow-review-' + input.taskId + '-' + input.attemptId + '.md',
    content,
    digest: sha256(content),
    reason:
      'Changed runtime source belongs to the captured public ' +
      policy.packageName +
      ' package; the fixed delivery policy records patch release intent.',
    validation: {
      status: 'passed',
      scope: 'delivery metadata only - not source verification'
    }
  }
}
function validateMetadata(preview) {
  need(preview.metadata, 'metadata missing - prepare a fresh preview')
  need(
    JSON.stringify(preview.metadata) ===
      JSON.stringify(prepareMetadata(preview)),
    'metadata changed - prepare a fresh preview'
  )
  need(
    JSON.stringify(preview.deliveryFiles) ===
      JSON.stringify([
        ...preview.changes.map((c) => c.path),
        preview.metadata.path
      ]),
    'metadata delivery inventory changed'
  )
  return preview.metadata
}
function sourceDifference(changes) {
  return changes
    .map((change) => {
      const before = change.before.split('\n'),
        after = change.after.split('\n')
      let start = 0,
        endBefore = before.length,
        endAfter = after.length
      while (
        start < endBefore &&
        start < endAfter &&
        before[start] === after[start]
      )
        start++
      while (
        endBefore > start &&
        endAfter > start &&
        before[endBefore - 1] === after[endAfter - 1]
      ) {
        endBefore--
        endAfter--
      }
      const first = Math.max(0, start - 3)
      return [
        change.path,
        'Before - from line ' + (first + 1),
        before.slice(first, endBefore + 3).join('\n'),
        'After - from line ' + (first + 1),
        after.slice(first, endAfter + 3).join('\n')
      ].join('\n')
    })
    .join('\n\n')
}
function preparePreview(input, remote, adapter) {
  const id = input.taskId
  const metadata = prepareMetadata(input)
  const title =
    (input.scopedWork ? 'Review bounded work - ' : 'Review candidate - ') +
    input.stepId
  return {
    ...input,
    metadata,
    deliveryFiles: [...input.changes.map((c) => c.path), metadata.path],
    sourceDiff: sourceDifference(input.changes),
    repository: adapter.repository,
    base: adapter.base,
    ...remote,
    branch: 'codex/flow-review/' + id + '/' + input.attemptId,
    title,
    draft: false,
    body: [
      'Bounded candidate review for ' + input.stepId + '.',
      '',
      'Task: ' + id,
      'Attempt: ' + input.attemptId,
      'Source HEAD: ' + input.sourceHead,
      'Source digest: ' + input.sourceDigest,
      'Candidate digest: ' + input.candidateDigest,
      'Local report digest: ' + input.reportDigest,
      '',
      'Source adapter: ' +
        input.adapter +
        (input.scopedWork
          ? '. Bounded work verification passed.'
          : '. Local verification passed the retained obligations.'),
      ...(input.scopedWork
        ? [
            'Assessment: ' + input.scopedWork.assessmentId,
            'Work: ' + input.scopedWork.workId,
            'Candidate verification: ' + input.candidateVerification,
            'Target integration: ' + input.scopedWork.integration.status
          ]
        : []),
      'This is not independently protected verification. PR creation and GitHub checks do not accept the local baseline.',
      'Trusted delivery metadata: ' +
        input.packageOwnership.packageName +
        ' patch Changeset; metadata validation is separate from local source verification.',
      'Source provenance: ' +
        (input.adapter === 'demonstration'
          ? 'deterministic demonstration, not model output.'
          : 'retained local candidate.'),
      'Review the exact source changes. Merge, release and publication are separate human actions.'
    ].join('\n')
  }
}
function createReviewOwner(
  repositoryRoot,
  {
    directory,
    getTask,
    getBaseline,
    changes,
    candidateDirectory,
    adapter,
    getScopedWork
  }
) {
  safePath(repositoryRoot, path.relative(repositoryRoot, directory))
  fs.mkdirSync(directory, { recursive: true })
  const records = new Map(),
    pending = new Map()
  const fileFor = (id) => {
    need(validId(id), 'invalid task identity')
    return safePath(directory, id + '.json')
  }
  const save = (record, event) => {
    const next = freeze(
      structuredClone({
        ...record,
        audit: [
          ...record.audit,
          { event, at: new Date().toISOString(), actor: record.actor }
        ]
      })
    )
    writeAtomic(fileFor(record.taskId), next)
    records.set(record.taskId, next)
    return next
  }
  for (const file of fs.readdirSync(directory)) {
    if (!file.endsWith('.json')) continue
    const value = JSON.parse(fs.readFileSync(safePath(directory, file), 'utf8'))
    reviewFormat(value)
    need(
      (value.format === 1 || value.format === 2) &&
        file === value.taskId + '.json' &&
        REVIEW_POLICY.states.includes(value.state) &&
        Array.isArray(value.audit) &&
        value.previewDigest === sha256(JSON.stringify(value.preview)),
      'invalid retained delivery'
    )
    records.set(value.taskId, freeze(value))
    if (value.state === 'submitting')
      save(
        { ...value, state: 'uncertain', error: 'interrupted' },
        'interrupted-effect'
      )
  }
  const get = (id) => records.get(id) ?? null
  const authorize = (id, actor) => {
    const task = getTask(id)
    need(actor && task.actor === actor, 'actor is not authorized')
    need(adapter, 'integration is disabled')
    return task
  }
  function inputs(id, actor, selection = null) {
    const task = authorize(id, actor),
      baseline = getBaseline(),
      attempt = task.attempts.at(-1)
    const scopedWork = selection
      ? scopedPayload(
          getScopedWork?.(
            id,
            selection.attemptId,
            selection.assessmentId,
            actor
          )
        )
      : null
    if (scopedWork)
      need(
        scopedWork.taskId === id &&
          scopedWork.attemptId === attempt?.id &&
          scopedWork.attemptId === selection.attemptId &&
          scopedWork.assessmentId === selection.assessmentId,
        'scoped review identity mismatch'
      )
    need(
      !task.revoked &&
        task.phase !== 'running' &&
        (scopedWork ||
          (task.verificationStatus === 'passed' &&
            task.workStatus === 'needs-review')) &&
        attempt?.phase === 'completed',
      'candidate must be settled and verified'
    )
    need(
      task.task.contractDigest === baseline.contract.digest &&
        task.task.revision === baseline.revision,
      'accepted baseline is stale'
    )
    const verdict = attempt.verdict
    need(
      verdict?.evidence &&
        (scopedWork || verdict.evidence.status === 'passed') &&
        verdict.files &&
        verdict.sourceDigest ===
          (scopedWork
            ? scopedWork.runtime.sourceDigest
            : sha256(JSON.stringify(verdict.files))),
      'missing candidate verdict'
    )
    const expected = task.task.obligations.map((c) => c.id).sort()
    need(
      JSON.stringify(verdict.evidence.cases.map((c) => c.id).sort()) ===
        JSON.stringify(expected) &&
        (scopedWork ||
          verdict.evidence.cases.every((c) => c.status === 'passed')),
      'incomplete local evidence'
    )
    const checkedBytes = new Map()
    const read = (root, file, digest) => {
      const absolute = safePath(root, file)
      const cached = checkedBytes.get(absolute)
      if (cached) {
        need(cached.digest === digest, 'conflicting source fingerprint')
        return cached.bytes
      }
      const stat = fs.lstatSync(absolute)
      need(stat.isFile() && stat.size <= 4 * 1024 * 1024, 'invalid source file')
      const bytes = fs.readFileSync(absolute)
      need(sha256(bytes) === digest, 'source fingerprint changed')
      checkedBytes.set(absolute, { digest, bytes })
      return bytes
    }
    const reportRoot = scopedWork
      ? safePath(
          path.dirname(candidateDirectory(id)),
          'verification/' + attempt.id
        )
      : path.dirname(verdict.runner.reportPath)
    if (scopedWork)
      need(
        verdict.runner.reportPath === safePath(reportRoot, 'vitest.json'),
        'scoped report location mismatch'
      )
    safePath(
      repositoryRoot,
      path.relative(repositoryRoot, verdict.runner.reportPath)
    )
    read(
      reportRoot,
      path.basename(verdict.runner.reportPath),
      verdict.runner.reportDigest
    )
    for (const item of verdict.files)
      read(path.join(reportRoot, 'source'), item.path, item.digest)
    const authority = task.snapshot.runtimeAuthority
    const ownerPackage = task.task.step?.ownerPackage
    const scopedAuthority = authority
      ? authority.packages?.filter((item) => item.name === ownerPackage)
      : []
    if (authority) {
      need(
        authority.format === 1 &&
          /^[a-f0-9]{64}$/.test(authority.digest ?? '') &&
          /^[a-f0-9]{64}$/.test(authority.contractScopeDigest ?? '') &&
          scopedAuthority.length === 1 &&
          (!scopedWork ||
            (scopedWork.runtime.runtimeAuthorityFormat === authority.format &&
              scopedWork.runtime.runtimeAuthorityDigest === authority.digest &&
              scopedWork.runtime.contractScopeDigest ===
                authority.contractScopeDigest)),
        'invalid runtime package authority'
      )
    } else
      need(
        !scopedWork ||
          !Object.hasOwn(scopedWork.runtime, 'runtimeAuthorityDigest'),
        'runtime package authority is missing'
      )
    const selectedPackage = authority
      ? scopedAuthority[0]
      : {
          name: METADATA_POLICY.packageName,
          manifestPath: METADATA_POLICY.manifestPath,
          repositoryDirectory: 'packages/factory',
          manifestDigest: task.snapshot.files.find(
            (item) => item.path === METADATA_POLICY.manifestPath
          )?.digest
        }
    const selectedPolicy = metadataPolicy({
      path: selectedPackage.manifestPath,
      packageName: selectedPackage.name,
      digest: selectedPackage.manifestDigest
    })
    const manifests = task.snapshot.files.filter(
      (item) => item.path === selectedPolicy.manifestPath
    )
    need(manifests.length === 1, 'missing or ambiguous package ownership')
    const manifest = manifests[0]
    let packageInfo
    try {
      packageInfo = JSON.parse(
        read(task.snapshot.sourceRoot, manifest.path, manifest.digest)
      )
    } catch {
      throw new Error('PR review: invalid package ownership manifest')
    }
    need(
      packageInfo.name === selectedPolicy.packageName &&
        packageInfo.private !== true &&
        manifest.digest === selectedPackage.manifestDigest,
      'unsupported package ownership'
    )
    need(
      !task.snapshot.files.some(
        (item) =>
          item.path.startsWith(selectedPolicy.sourcePrefix) &&
          item.path.endsWith('/package.json')
      ),
      'ambiguous nested package ownership'
    )
    const packageOwnership = {
      path: manifest.path,
      packageName: packageInfo.name,
      digest: manifest.digest
    }
    const files = task.snapshot.files.map((item) => ({
      ...item,
      gitDigest: gitDigest(
        read(task.snapshot.sourceRoot, item.path, item.digest)
      )
    }))
    const diff = changes(id)
    need(
      diff.length > 0 && diff.length <= task.task.allowedFiles.length,
      'missing candidate changes'
    )
    const verified = new Map(
      verdict.files.map((item) => [item.path, item.digest])
    )
    for (const change of diff) {
      need(
        canonicalFile(change.path) &&
          task.task.allowedFiles.includes(change.path) &&
          change.path.startsWith(selectedPolicy.sourcePrefix) &&
          change.path.endsWith('.ts') &&
          !change.path.includes('/__tests__/'),
        'outside allowed source difference'
      )
      need(
        sha256(change.before) === change.beforeDigest &&
          sha256(change.after) === change.afterDigest &&
          change.beforeDigest !== change.afterDigest,
        'source fingerprint changed'
      )
      need(
        files.find((item) => item.path === change.path)?.digest ===
          change.beforeDigest &&
          verified.get(change.path) === change.afterDigest,
        'candidate verification differs'
      )
    }
    for (const item of files)
      need(
        verified.get(item.path) ===
          (diff.find((c) => c.path === item.path)?.afterDigest ?? item.digest),
        'unauthorized verified source difference'
      )
    const candidateRoot = candidateDirectory(id),
      actual = []
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const absolute = safePath(
          candidateRoot,
          path.relative(candidateRoot, path.join(dir, entry.name))
        )
        need(!entry.isSymbolicLink(), 'candidate symlink')
        if (entry.isDirectory()) walk(absolute)
        else {
          need(entry.isFile(), 'invalid candidate entry')
          actual.push(path.relative(candidateRoot, absolute))
        }
      }
    }
    walk(candidateRoot)
    need(
      JSON.stringify(actual.sort()) ===
        JSON.stringify([...task.task.allowedFiles].sort()),
      'extra or missing candidate file'
    )
    for (const item of actual) read(candidateRoot, item, verified.get(item))
    return {
      ...(scopedWork
        ? { scopedWork, candidateVerification: task.verificationStatus }
        : {}),
      taskId: id,
      attemptId: attempt.id,
      stepId: task.task.stepId,
      revision: task.task.revision,
      contractDigest: task.task.contractDigest,
      sourceHead: task.snapshot.head,
      sourceDigest: task.snapshot.digest,
      candidateDigest: verdict.sourceDigest,
      reportDigest: verdict.runner.reportDigest,
      adapter: task.task.adapter,
      packageOwnership,
      files,
      changes: diff
    }
  }
  const serial = (id, kind, operation) => {
    if (pending.has(id)) {
      need(pending.get(id).kind === kind, 'a different review action is active')
      return pending.get(id).promise
    }
    need(!pending.size, 'another delivery review is active')
    const promise = Promise.resolve()
      .then(operation)
      .finally(() => pending.delete(id))
    pending.set(id, { kind, promise })
    return promise
  }
  const prepare = async (id, actor, selection = null) => {
    authorize(id, actor)
    return serial(
      id,
      selection
        ? 'prepare-scoped:' + selection.attemptId + ':' + selection.assessmentId
        : 'prepare',
      async () => {
        const input = inputs(id, actor, selection),
          previous = get(id)
        if (previous && previous.state !== 'preview') {
          need(
            previous.preview.attemptId === input.attemptId,
            'delivery belongs to another attempt'
          )
          need(
            JSON.stringify(previous.preview.scopedWork ?? null) ===
              JSON.stringify(input.scopedWork ?? null),
            'delivery belongs to another scope'
          )
          return previous
        }
        const prepared = preparePreview(input, {}, adapter)
        const remote = await adapter.inspect(prepared)
        const preview = { ...prepared, ...remote }
        const previewDigest = sha256(JSON.stringify(preview))
        if (previous?.previewDigest === previewDigest) return previous
        return save(
          {
            format: selection ? 2 : 1,
            taskId: id,
            actor,
            state: 'preview',
            preview,
            previewDigest,
            observation: null,
            audit: previous?.audit ?? []
          },
          'preview-prepared'
        )
      }
    )
  }
  return {
    get,
    active: () => pending.size > 0,
    policy: () =>
      adapter ? { repository: adapter.repository, base: adapter.base } : null,
    prepare: (id, actor) => prepare(id, actor),
    prepareScoped(id, selection, actor) {
      return prepare(id, actor, scopedSelection(selection))
    },
    async confirm(id, request, actor) {
      authorize(id, actor)
      const record = get(id)
      need(request?.confirm === true, 'explicit confirmation required')
      need(
        record && request.previewDigest === record.previewDigest,
        'exact preview required'
      )
      return serial(id, 'confirm:' + request.previewDigest, async () => {
        let current = get(id)
        if (current.state === 'submitted-for-review') return current
        need(
          current.state !== 'uncertain',
          'uncertain effect requires reconciliation'
        )
        need(
          current.preview.draft === false,
          'PR type changed - prepare a fresh preview'
        )
        reviewFormat(current)
        validateMetadata(current.preview)
        const selection =
          current.format === 2
            ? scopedSelection({
                attemptId: current.preview.scopedWork.attemptId,
                assessmentId: current.preview.scopedWork.assessmentId
              })
            : null
        const input = inputs(id, actor, selection)
        need(
          input.attemptId === current.preview.attemptId,
          'candidate attempt changed'
        )
        for (const key of Object.keys(input))
          need(
            JSON.stringify(input[key]) === JSON.stringify(current.preview[key]),
            'preview source changed'
          )
        need(
          adapter.repository === current.preview.repository &&
            adapter.base === current.preview.base,
          'delivery policy changed'
        )
        const prepared = preparePreview(input, {}, adapter)
        const remote = await adapter.inspect(prepared)
        need(
          remote.baseSha === current.preview.baseSha &&
            remote.baseTree === current.preview.baseTree,
          'remote base advanced'
        )
        need(
          JSON.stringify({ ...prepared, ...remote }) ===
            JSON.stringify(current.preview),
          'complete preview changed - prepare a fresh preview'
        )
        current = save(
          { ...current, state: 'submitting', error: null },
          'human-confirmed'
        )
        try {
          const observation = await adapter.deliver(
            current.preview,
            async (effect, fields = {}) => {
              current = save(
                { ...current, ...fields, effect },
                effect + '-intent'
              )
            },
            current
          )
          need(observation?.number, 'missing PR observation')
          return save(
            { ...current, state: 'submitted-for-review', observation },
            'review-submitted'
          )
        } catch (error) {
          return save(
            {
              ...current,
              state: error.noEffect === true ? 'blocked' : 'uncertain',
              error: [
                'authentication',
                'permission',
                'rate-limit',
                'conflict'
              ].includes(error.code)
                ? error.code
                : 'transport-unknown'
            },
            'delivery-unsettled'
          )
        }
      })
    },
    async refresh(id, actor) {
      authorize(id, actor)
      return serial(id, 'refresh', async () => {
        authorize(id, actor)
        let current = get(id)
        need(current, 'no delivery record')
        // Clear current checks before I/O; a failed read cannot preserve current green.
        current = save(
          {
            ...current,
            observation: current.observation
              ? { ...current.observation, checks: null, stale: true }
              : null
          },
          'refresh-requested'
        )
        try {
          const observation = await adapter.observe(current.preview, current)
          return save(
            {
              ...current,
              observation: observation ?? current.observation,
              state: observation?.number
                ? 'submitted-for-review'
                : current.state,
              error: observation ? null : 'remote-outcome-unconfirmed'
            },
            'review-observed'
          )
        } catch {
          return save(
            { ...current, error: 'refresh-unavailable' },
            'refresh-failed'
          )
        }
      })
    },
    async close() {
      await Promise.allSettled(
        [...pending.values()].map((value) => value.promise)
      )
    }
  }
}
module.exports = {
  createReviewOwner,
  REVIEW_POLICY,
  METADATA_POLICY,
  prepareMetadata,
  validateMetadata,
  gitDigest
}

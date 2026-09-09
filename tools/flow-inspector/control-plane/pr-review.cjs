/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
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
function createReviewOwner(
  repositoryRoot,
  { directory, getTask, getBaseline, changes, candidateDirectory, adapter }
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
    need(
      value.format === 1 &&
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
  function inputs(id, actor) {
    const task = authorize(id, actor),
      baseline = getBaseline(),
      attempt = task.attempts.at(-1)
    need(
      !task.revoked &&
        task.phase !== 'running' &&
        task.verificationStatus === 'passed' &&
        task.workStatus === 'needs-review' &&
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
      verdict?.evidence?.status === 'passed' &&
        verdict.files &&
        verdict.sourceDigest === sha256(JSON.stringify(verdict.files)),
      'missing candidate verdict'
    )
    const expected = task.task.obligations.map((c) => c.id).sort()
    need(
      JSON.stringify(verdict.evidence.cases.map((c) => c.id).sort()) ===
        JSON.stringify(expected) &&
        verdict.evidence.cases.every((c) => c.status === 'passed'),
      'incomplete local evidence'
    )
    const read = (root, file, digest) => {
      const absolute = safePath(root, file),
        stat = fs.lstatSync(absolute)
      need(stat.isFile() && stat.size <= 4 * 1024 * 1024, 'invalid source file')
      const bytes = fs.readFileSync(absolute)
      need(sha256(bytes) === digest, 'source fingerprint changed')
      return bytes
    }
    const reportRoot = path.dirname(verdict.runner.reportPath)
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
          /^packages\/factory\/src\/.+\.ts$/.test(change.path) &&
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
  return {
    get,
    active: () => pending.size > 0,
    policy: () =>
      adapter ? { repository: adapter.repository, base: adapter.base } : null,
    async prepare(id, actor) {
      authorize(id, actor)
      return serial(id, 'prepare', async () => {
        const input = inputs(id, actor),
          previous = get(id)
        if (previous && previous.state !== 'preview') {
          need(
            previous.preview.attemptId === input.attemptId,
            'delivery belongs to another attempt'
          )
          return previous
        }
        const remote = await adapter.inspect(input)
        const title = 'Review candidate - ' + input.stepId
        const preview = {
          ...input,
          sourceDiff: sourceDifference(input.changes),
          repository: adapter.repository,
          base: adapter.base,
          ...remote,
          branch: 'codex/flow-review/' + id + '/' + input.attemptId,
          title,
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
              '. Local verification passed the retained obligations.',
            'This is not independently protected verification. Draft PR creation and GitHub checks do not accept the local baseline.',
            'Review the exact source changes. Merge, release and publication are separate human actions.'
          ].join('\n')
        }
        const previewDigest = sha256(JSON.stringify(preview))
        if (previous?.previewDigest === previewDigest) return previous
        return save(
          {
            format: 1,
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
      })
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
        const input = inputs(id, actor)
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
        const remote = await adapter.inspect(input)
        need(
          remote.baseSha === current.preview.baseSha &&
            remote.baseTree === current.preview.baseTree,
          'remote base advanced'
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
module.exports = { createReviewOwner, REVIEW_POLICY, gitDigest }

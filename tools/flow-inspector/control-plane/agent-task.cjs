/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const {
  admitTask,
  TASK_POLICY,
  canonicalFile,
  freeze
} = require('./agent-contract.cjs')
const { demonstrationAdapter } = require('./agent-adapter.cjs')
const { loadContract } = require('./contracts.cjs')
const { assessEvidence } = require('./evidence.cjs')
const { captureSource, safePath, sha256 } = require('./snapshot.cjs')
const {
  verifyCandidate,
  containmentAvailable
} = require('./agent-verifier.cjs')
const { validId, writeAtomic } = require('./store.cjs')
const phases = [
  'running',
  'completed',
  'denied',
  'limited',
  'cancelled',
  'stopped',
  'handed-off',
  'revoked',
  'timed-out',
  'interrupted',
  'failed'
]
function createTaskOwner(
  repositoryRoot,
  {
    directory,
    getBaseline,
    capture = captureSource,
    verify = verifyCandidate,
    adapterFactory = demonstrationAdapter,
    available = containmentAvailable,
    requireIdle = () => undefined,
    onChange = () => undefined
  }
) {
  safePath(repositoryRoot, path.relative(repositoryRoot, directory))
  fs.mkdirSync(directory, { recursive: true })
  const records = new Map()
  let ordered = []
  let active = null
  let closed = false
  const event = (name, actor) => ({
    event: name,
    actor,
    at: new Date().toISOString()
  })
  const taskDirectory = (id) => {
    if (!validId(id)) throw new Error('Invalid task identity')
    return safePath(
      repositoryRoot,
      path.relative(repositoryRoot, path.join(directory, id))
    )
  }
  function save(record, name, actor = record.actor) {
    const next = { ...record, audit: [...record.audit, event(name, actor)] }
    writeAtomic(path.join(taskDirectory(record.id), 'task.json'), next)
    const frozen = freeze(structuredClone(next))
    records.set(record.id, frozen)
    onChange()
    return frozen
  }
  for (const id of fs.readdirSync(directory)) {
    if (!validId(id)) continue
    const file = safePath(taskDirectory(id), 'task.json')
    if (!fs.existsSync(file)) continue
    const record = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (
      record.format !== 1 ||
      record.id !== id ||
      !phases.includes(record.phase) ||
      !Array.isArray(record.audit) ||
      !record.audit.length ||
      !record.task ||
      !record.snapshot ||
      !Array.isArray(record.attempts) ||
      record.deliveryStatus !== 'not-delivered'
    )
      throw new Error('Invalid persisted task')
    for (const key of ['elapsedMs', 'toolCalls', 'attempts'])
      if (
        !Number.isSafeInteger(record.usage?.[key]) ||
        record.usage[key] < 0 ||
        record.usage[key] > record.task.budgets[key]
      )
        throw new Error('Invalid cumulative task budget')
    if (
      record.task.requestId !== id ||
      record.actor !== record.task.actor ||
      sha256(JSON.stringify(record.task)) !== record.fingerprint ||
      record.attempts.length !== record.usage.attempts ||
      record.usage.tokens !== null ||
      record.usage.cost !== null
    )
      throw new Error('Invalid task identity or fingerprint')
    if (
      (record.workStatus === 'needs-review') !==
      (record.verificationStatus === 'passed')
    )
      throw new Error('Invalid task work and evidence relationship')
    if (record.verificationStatus === 'passed') {
      const verdict = record.attempts.at(-1)?.verdict
      if (
        !verdict?.runner?.reportPath ||
        !verdict.files ||
        verdict.sourceDigest !== sha256(JSON.stringify(verdict.files))
      )
        throw new Error('Invalid task verification evidence')
      const reportFile = safePath(
        taskDirectory(id),
        path.relative(taskDirectory(id), verdict.runner.reportPath)
      )
      const reportBytes = fs.readFileSync(reportFile)
      if (sha256(reportBytes) !== verdict.runner.reportDigest)
        throw new Error('Task report fingerprint changed')
      const retainedContract = loadContract(record.snapshot.sourceRoot)
      const candidate = {
        ...record.snapshot,
        files: verdict.files,
        sourceRoot: path.join(path.dirname(reportFile), 'source'),
        configurationDigest:
          verdict.configurationDigest ?? record.snapshot.configurationDigest,
        digest: verdict.sourceDigest
      }
      const assessed = assessEvidence(
        retainedContract,
        candidate,
        { ...verdict.runner, report: JSON.parse(reportBytes) },
        record.task.flowIds,
        'baseline'
      )
      if (
        assessed.status !== 'passed' ||
        JSON.stringify(assessed) !== JSON.stringify(verdict.evidence)
      )
        throw new Error('Invalid retained candidate evidence')
    }
    if (record.phase === 'running') {
      if (Number.isInteger(record.runnerPid) && record.runnerPid > 0) {
        try {
          process.kill(record.runnerPid, 0)
          throw new Error('Interrupted task runner is still settling')
        } catch (error) {
          if (error.code !== 'ESRCH') throw error
        }
      }
      record.phase = 'interrupted'
      record.usage.elapsedMs = Math.min(
        record.task.budgets.elapsedMs,
        record.usage.elapsedMs + (record.reservedMs ?? 0)
      )
      record.reservedMs = 0
      record.verificationStatus = 'unknown'
      record.workStatus = 'incomplete'
      save(record, 'interrupted-on-restart')
    } else records.set(id, freeze(record))
    ordered.push(id)
  }
  ordered.sort((a, b) =>
    records.get(b).startedAt.localeCompare(records.get(a).startedAt)
  )
  const get = (id) => {
    const record = records.get(id)
    if (!record) throw new Error('Task not found')
    return record
  }
  const checkBaseline = (record) => {
    const current = getBaseline()
    if (
      record.task.contractDigest !== current.contract.digest ||
      record.task.revision !== current.revision
    )
      throw new Error('Task accepted baseline is stale')
    return current.contract
  }
  const checkBudget = (record) => {
    for (const key of ['elapsedMs', 'toolCalls', 'attempts'])
      if (record.usage[key] >= record.task.budgets[key])
        throw new Error('Task budget exhausted: ' + key)
  }
  const authorizeTask = (record, actor) => {
    if (!actor || actor !== record.actor)
      throw new Error('Task actor is not authorized')
    if (record.revoked) throw new Error('Task capability was revoked')
  }
  const idle = () => {
    if (closed) throw new Error('Task owner is closed')
    if (active) throw new Error('A task is already running')
    requireIdle()
    if (!available())
      throw new Error('OS containment unavailable; task execution denied')
  }
  const readCandidate = (record, file) => {
    if (!canonicalFile(file) || !record.task.allowedFiles.includes(file))
      throw new Error('File outside task scope')
    const absolute = safePath(taskDirectory(record.id), 'candidate/' + file)
    const stat = fs.lstatSync(absolute)
    if (!stat.isFile() || stat.size > TASK_POLICY.maxFileBytes)
      throw new Error('Invalid or oversized candidate file')
    const bytes = fs.readFileSync(absolute)
    return {
      absolute,
      bytes,
      digest: sha256(bytes),
      content: bytes.toString('utf8')
    }
  }
  function launch(id, scenario, actor) {
    let record = get(id)
    authorizeTask(record, actor)
    const contract = checkBaseline(record)
    checkBudget(record)
    const remaining = record.task.budgets.elapsedMs - record.usage.elapsedMs
    const started = Date.now()
    const attemptId = randomUUID()
    const controller = new AbortController()
    let reason = null
    let timer
    const stop = (why) => {
      if (!reason) reason = why
      controller.abort()
    }
    active = { id, stop, promise: null }
    record = save(
      {
        ...record,
        phase: 'running',
        verificationStatus: 'unknown',
        workStatus: 'incomplete',
        reservedMs: remaining,
        usage: { ...record.usage, attempts: record.usage.attempts + 1 },
        attempts: [
          ...record.attempts,
          {
            id: attemptId,
            scenario,
            startedAt: new Date().toISOString(),
            phase: 'running'
          }
        ]
      },
      'attempt-started',
      actor
    )
    const baseElapsed = record.usage.elapsedMs
    const chargeTime = (value) => ({
      ...value,
      usage: {
        ...value.usage,
        elapsedMs: Math.min(
          value.task.budgets.elapsedMs,
          baseElapsed + Math.max(0, Date.now() - started)
        )
      }
    })
    const promise = Promise.resolve().then(async () => {
      let observation = null
      let progressed = false
      let verdict = null
      let failure = null
      let verifying = false
      const aborted = new Promise((resolve) => {
        if (controller.signal.aborted) resolve(null)
        else
          controller.signal.addEventListener('abort', () => resolve(null), {
            once: true
          })
      })
      timer = setTimeout(() => stop('timed-out'), remaining)
      try {
        const adapter = adapterFactory(record.task, scenario, contract)
        while (!controller.signal.aborted) {
          record = get(id)
          if (record.usage.toolCalls >= record.task.budgets.toolCalls) {
            reason = 'limited'
            break
          }
          const operation = await Promise.race([
            adapter.next(observation),
            aborted
          ])
          if (controller.signal.aborted) break
          record = save(
            chargeTime({
              ...get(id),
              usage: {
                ...get(id).usage,
                toolCalls: get(id).usage.toolCalls + 1
              }
            }),
            'operation-admitted'
          )
          if (record.usage.elapsedMs >= record.task.budgets.elapsedMs) {
            reason = 'timed-out'
            break
          }
          if (
            !operation ||
            typeof operation !== 'object' ||
            Array.isArray(operation) ||
            Buffer.byteLength(JSON.stringify(operation)) >
              TASK_POLICY.maxOutputBytes ||
            !TASK_POLICY.operations.includes(operation.tool)
          )
            throw new Error('Unsupported or oversized agent operation')
          if (operation.tool === 'finish') {
            if (Object.keys(operation).length !== 1)
              throw new Error('Invalid finish operation')
            if (!progressed)
              throw new Error('Agent produced no source progress')
            verifying = true
            verdict = await verify({
              repositoryRoot,
              directory: taskDirectory(id),
              contract,
              snapshot: record.snapshot,
              candidateRoot: path.join(taskDirectory(id), 'candidate'),
              allowedFiles: record.task.allowedFiles,
              attemptId,
              signal: controller.signal,
              timeoutMs: Math.max(
                1,
                record.task.budgets.elapsedMs - record.usage.elapsedMs
              ),
              onSpawn: (pid) =>
                save({ ...get(id), runnerPid: pid }, 'verification-started')
            })
            if (!controller.signal.aborted) reason = 'completed'
            break
          }
          const expectedKeys =
            operation.tool === 'read'
              ? ['tool', 'path']
              : ['tool', 'path', 'digest', 'before', 'after']
          if (Object.keys(operation).some((key) => !expectedKeys.includes(key)))
            throw new Error('Unknown operation field')
          const source = readCandidate(record, operation.path)
          if (operation.tool === 'read') {
            observation = { content: source.content, digest: source.digest }
            continue
          }
          if (
            operation.digest !== source.digest ||
            typeof operation.before !== 'string' ||
            !operation.before ||
            typeof operation.after !== 'string' ||
            source.content.split(operation.before).length !== 2
          )
            throw new Error('Stale digest or ambiguous replacement')
          const content = source.content.replace(
            operation.before,
            () => operation.after
          )
          if (
            Buffer.byteLength(content) > TASK_POLICY.maxFileBytes ||
            content === source.content
          )
            throw new Error('Oversized or unchanged candidate')
          fs.writeFileSync(source.absolute, content, { flag: 'w', mode: 0o600 })
          const afterDigest = sha256(content)
          const changes = record.changes.filter(
            (value) => value.path !== operation.path
          )
          const baseline = record.snapshot.files.find(
            (value) => value.path === operation.path
          )
          changes.push({
            path: operation.path,
            beforeDigest: baseline.digest,
            afterDigest
          })
          record = save(chargeTime({ ...get(id), changes }), 'source-changed')
          progressed = true
          observation = { digest: afterDigest }
        }
      } catch (error) {
        failure = error.message
        if (!reason) reason = verifying ? 'failed' : 'denied'
      } finally {
        clearTimeout(timer)
        const current = chargeTime(get(id))
        const phase = reason ?? 'failed'
        const verificationStatus =
          phase === 'completed'
            ? (verdict?.evidence?.status ?? 'unknown')
            : 'unknown'
        const attempts = current.attempts.map((attempt) =>
          attempt.id === attemptId
            ? {
                ...attempt,
                phase,
                finishedAt: new Date().toISOString(),
                verdict,
                error: failure
              }
            : attempt
        )
        save(
          {
            ...current,
            phase,
            reservedMs: 0,
            runnerPid: null,
            attempts,
            verificationStatus,
            workStatus:
              verificationStatus === 'passed' ? 'needs-review' : 'incomplete',
            error: failure
          },
          phase
        )
        active = null
      }
      return get(id)
    })
    active.promise = promise
    return id
  }
  return {
    activeId: () => active?.id ?? null,
    get,
    list: () => ordered.map((id) => get(id)),
    start(request, actor) {
      const current = getBaseline()
      const task = admitTask(request, current.contract, current.revision, actor)
      const fingerprint = sha256(JSON.stringify(task))
      if (records.has(task.requestId)) {
        if (get(task.requestId).fingerprint !== fingerprint)
          throw new Error('Task request identity conflict')
        return task.requestId
      }
      idle()
      const id = task.requestId
      const taskRoot = taskDirectory(id)
      fs.mkdirSync(taskRoot)
      const snapshot = capture(repositoryRoot, taskRoot, current.contract)
      for (const file of task.allowedFiles) {
        if (!snapshot.files.some((entry) => entry.path === file))
          throw new Error('Allowed source file is absent from snapshot')
        const input = safePath(snapshot.sourceRoot, file)
        if (fs.statSync(input).size > TASK_POLICY.maxFileBytes)
          throw new Error('Source file exceeds task limit')
        const destination = safePath(taskRoot, 'candidate/' + file)
        fs.mkdirSync(path.dirname(destination), { recursive: true })
        fs.writeFileSync(destination, fs.readFileSync(input), {
          flag: 'wx',
          mode: 0o600
        })
      }
      const record = {
        format: 1,
        id,
        actor,
        task,
        fingerprint,
        snapshot,
        startedAt: new Date().toISOString(),
        phase: 'stopped',
        revoked: false,
        usage: task.usage,
        reservedMs: 0,
        changes: [],
        attempts: [],
        audit: [],
        verificationStatus: 'unknown',
        workStatus: 'incomplete',
        deliveryStatus: 'not-delivered'
      }
      ordered.unshift(id)
      save(record, 'task-admitted')
      return launch(id, task.scenario, actor)
    },
    resume(id, scenario, actor) {
      const record = get(id)
      authorizeTask(record, actor)
      checkBaseline(record)
      checkBudget(record)
      if (!TASK_POLICY.scenarios.includes(scenario))
        throw new Error('Unknown demonstration')
      idle()
      for (const file of record.snapshot.files) {
        const bytes = fs.readFileSync(
          safePath(record.snapshot.sourceRoot, file.path)
        )
        if (sha256(bytes) !== file.digest)
          throw new Error('Captured baseline source changed')
      }
      for (const file of record.task.allowedFiles) {
        const current = readCandidate(record, file)
        const expected =
          record.changes.find((value) => value.path === file)?.afterDigest ??
          record.snapshot.files.find((value) => value.path === file).digest
        if (current.digest !== expected)
          throw new Error(
            'Candidate source changed outside task; human review required'
          )
      }
      return launch(id, scenario, actor)
    },
    async wait(id) {
      if (active?.id === id) await active.promise
      return get(id)
    },
    async stop(id, action, actor) {
      const record = get(id)
      if (record.actor !== actor)
        throw new Error('Task actor is not authorized')
      const phase = {
        cancel: 'cancelled',
        stop: 'stopped',
        handoff: 'handed-off',
        revoke: 'revoked'
      }[action]
      if (!phase) throw new Error('Unknown task stop action')
      if (active?.id === id) {
        active.stop(phase)
        await active.promise
      }
      return save(
        { ...get(id), phase, revoked: record.revoked || action === 'revoke' },
        action,
        actor
      )
    },
    changes(id) {
      const record = get(id)
      return record.changes.map((change) => {
        const after = readCandidate(record, change.path)
        if (after.digest !== change.afterDigest)
          throw new Error('Candidate source fingerprint changed')
        const before = fs.readFileSync(
          safePath(record.snapshot.sourceRoot, change.path),
          'utf8'
        )
        if (sha256(before) !== change.beforeDigest)
          throw new Error('Baseline fingerprint changed')
        return { ...change, before, after: after.content }
      })
    },
    async close() {
      closed = true
      if (active) {
        active.stop('interrupted')
        await active.promise
      }
    }
  }
}
module.exports = { createTaskOwner }

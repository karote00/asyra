import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatVersion, getCase, reviewCriteria } from './catalog.mjs'

export const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const oraclePath = path.join(
  repositoryRoot,
  'scripts/agent-evals/__tests__/behavior-oracle.mjs'
)
const maximumBytes = 1024 * 1024
const outputFiles = ['PLAN.json', 'HANDOFF.md']
const hash = (value) => createHash('sha256').update(value).digest('hex')
const digest = (value) => hash(JSON.stringify(value))
const read = (file) => {
  insideRepository(file)
  if (!lstatSync(file).isFile() || lstatSync(file).size > maximumBytes)
    throw new Error(`Invalid or excessive file: ${file}`)
  return readFileSync(file, 'utf8')
}
const json = (file) => JSON.parse(read(file))
const save = (file, value) =>
  writeFileSync(insideRepository(file), JSON.stringify(value, null, 2) + '\n', {
    flag: 'wx'
  })

function insideRepository(target) {
  const absolute = path.resolve(target)
  const relative = path.relative(repositoryRoot, absolute)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error('Path must be inside the repository')
  let current = repositoryRoot
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part)
    if (existsSync(current) && lstatSync(current).isSymbolicLink())
      throw new Error(`Symlink is not allowed: ${current}`)
  }
  return absolute
}

function snapshot(workspace) {
  const files = {}
  let bytes = 0
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name)
    )) {
      const absolute = path.join(directory, entry.name)
      if (entry.isSymbolicLink())
        throw new Error('Candidate symlinks are not allowed')
      if (entry.isDirectory()) visit(absolute)
      else if (entry.isFile()) {
        const content = read(absolute)
        bytes += Buffer.byteLength(content)
        if (bytes > maximumBytes || Object.keys(files).length >= 128)
          throw new Error('Candidate exceeds snapshot limits')
        files[path.relative(workspace, absolute).split(path.sep).join('/')] =
          hash(content)
      } else throw new Error('Candidate contains a special file')
    }
  }
  visit(workspace)
  return { files, digest: digest(files) }
}

function suiteDigest(files) {
  return digest(
    Object.fromEntries(
      Object.entries(files).map(([file, content]) => [file, hash(content)])
    )
  )
}

function captureSuite(entry, contents = new Map()) {
  const files = [
    'AGENTS.md',
    'docs/ai/workflows/agent-task.md',
    'scripts/agent-evals/catalog.mjs',
    'scripts/agent-evals/engine.mjs',
    'scripts/agent-evals/cli.mjs',
    'scripts/agent-evals/__tests__/behavior-oracle.mjs',
    ...entry.references
  ]
  const captured = Object.fromEntries(
    files.map((file) => {
      if (!contents.has(file))
        contents.set(file, read(path.join(repositoryRoot, file)))
      return [file, contents.get(file)]
    })
  )
  return { files: captured, digest: suiteDigest(captured) }
}

function execute(workspace, args, allowOracle = false) {
  const permissions = ['--permission', `--allow-fs-read=${workspace}`]
  if (allowOracle) permissions.push(`--allow-fs-read=${oraclePath}`)
  const result = spawnSync(process.execPath, [...permissions, ...args], {
    cwd: workspace,
    env: { LANG: 'C', TMPDIR: workspace },
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 64 * 1024,
    killSignal: 'SIGKILL'
  })
  return {
    command: [process.execPath, ...permissions, ...args],
    pid: result.pid,
    exitCode: result.status,
    signal: result.signal,
    error: result.error?.code ?? null,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(0, 64 * 1024)
  }
}

function runTests(workspace, entry) {
  if (!entry.testFiles.length) return null
  return execute(workspace, [
    '--test',
    '--test-isolation=none',
    '--test-concurrency=1',
    ...entry.testFiles
  ])
}

function sameSet(left, right) {
  return (
    Array.isArray(left) &&
    left.length === right.length &&
    new Set(left).size === left.length &&
    right.every((item) => left.includes(item))
  )
}

function validPlan(plan, entry) {
  return (
    !!plan &&
    plan.workflow === entry.workflow &&
    plan.owner === entry.owner &&
    sameSet(plan.scope, entry.allowedFiles) &&
    Array.isArray(plan.references) &&
    entry.references.every((file) => plan.references.includes(file))
  )
}

export function createRunner(
  root = path.join(repositoryRoot, 'tmp/agent-evals')
) {
  root = insideRepository(root)
  function directory(id) {
    if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(id))
      throw new Error(
        'Run ID must contain lowercase letters, digits, or hyphens (1-64 characters)'
      )
    return insideRepository(path.join(root, id))
  }
  function load(id, requireCurrent = true, contents = new Map()) {
    const run = directory(id)
    const state = json(insideRepository(path.join(run, 'run.json')))
    if (state.formatVersion !== formatVersion)
      throw new Error('Unsupported run version')
    const retainedSuite = json(path.join(run, 'suite.json'))
    if (state.suite !== suiteDigest(retainedSuite))
      throw new Error('Retained suite bytes do not match the run fingerprint')
    let entry = null
    try {
      entry = getCase(state.caseId)
    } catch {
      /* Removed cases remain historical evidence. */
    }
    const currentSuite =
      !!entry && state.suite === captureSuite(entry, contents).digest
    if (requireCurrent && !currentSuite)
      throw new Error('Suite or referenced contract changed; prepare a new run')
    const workspace = insideRepository(path.join(run, 'workspace'))
    return { run, state, entry, workspace, currentSuite }
  }
  function prepare(caseId, id, actor, mode) {
    const entry = getCase(caseId)
    if (typeof actor !== 'string' || !actor.trim() || actor.length > 200)
      throw new Error('Actor is required (at most 200 characters)')
    if (!['agent', 'replay'].includes(mode))
      throw new Error('Mode must be agent or replay')
    const run = directory(id)
    mkdirSync(root, { recursive: true })
    mkdirSync(run) // Exclusive: never overwrite a retained run.
    const workspace = path.join(run, 'workspace')
    mkdirSync(workspace)
    mkdirSync(path.join(run, 'evaluations'))
    mkdirSync(path.join(run, 'reviews'))
    const instructions =
      'Follow the repository AGENTS.md and docs/ai/workflows/agent-task.md. Work only inside this fixture workspace. Read PROMPT.md in the parent directory. Do not edit this file or parent artifacts.\n'
    for (const [file, content] of Object.entries({
      ...entry.files,
      'AGENTS.md': instructions
    })) {
      const absolute = path.join(workspace, file)
      mkdirSync(path.dirname(absolute), { recursive: true })
      writeFileSync(absolute, content, { flag: 'wx' })
    }
    const baseline = snapshot(workspace)
    const baselineTests = runTests(workspace, entry)
    if (baselineTests && baselineTests.exitCode !== 0)
      throw new Error(
        'Case baseline tests failed; retain this directory for diagnosis'
      )
    const source = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      timeout: 2000
    })
    if (source.status !== 0)
      throw new Error('Cannot identify repository revision')
    const suite = captureSuite(entry)
    save(path.join(run, 'suite.json'), suite.files)
    const state = {
      formatVersion,
      caseId,
      actor,
      mode,
      sourceCommit: source.stdout.trim(),
      suite: suite.digest,
      createdAt: new Date().toISOString(),
      node: process.version,
      baseline,
      baselineTests
    }
    save(path.join(run, 'run.json'), state)
    writeFileSync(
      path.join(run, 'PROMPT.md'),
      `# ${entry.title}\n\n${entry.prompt}\n\nRepository: ${repositoryRoot}\nCandidate workspace: ${workspace}\n\nAllowed task files: ${entry.allowedFiles.join(', ')}. Also create PLAN.json and HANDOFF.md.\n\nBefore editing task files, write PLAN.json with workflow, owner, references (repository-relative paths), and scope (the allowed task files, excluding PLAN.json and HANDOFF.md). Use the repository task workflow to make these decisions, then run the admit command to freeze that plan before implementation.\n\nFor bug fixes, use the runner's regression command after adding the failing test and before the runtime fix. Final evaluation uses the runner's evaluate command. Record actual evidence in HANDOFF.md. An independent reviewer completes semantic review.\n`,
      { flag: 'wx' }
    )
    return { run, workspace, prompt: path.join(run, 'PROMPT.md'), state }
  }
  function admit(id) {
    const { run, state, entry, workspace } = load(id)
    const current = snapshot(workspace)
    const plan = json(path.join(workspace, 'PLAN.json'))
    if (!validPlan(plan, entry))
      throw new Error(
        'Plan does not match the case owner, workflow, references, or scope'
      )
    const original = { ...current.files }
    delete original['PLAN.json']
    if (digest(original) !== state.baseline.digest)
      throw new Error('Admit the plan before editing task files')
    const admission = {
      plan: current.files['PLAN.json'],
      suite: state.suite,
      createdAt: new Date().toISOString()
    }
    save(path.join(run, 'admission.json'), admission)
    return admission
  }
  function admissionMatches(run, state, current) {
    try {
      const admission = json(path.join(run, 'admission.json'))
      return (
        admission.suite === state.suite &&
        admission.plan === current.files['PLAN.json']
      )
    } catch {
      return false
    }
  }
  function regression(id) {
    const { run, state, entry, workspace } = load(id)
    if (entry.workflow !== 'bugfix')
      throw new Error('Only bugfix cases use a regression checkpoint')
    const before = snapshot(workspace)
    if (!admissionMatches(run, state, before))
      throw new Error('Admit an unchanged plan before recording a regression')
    if (
      !entry.runtimeFiles.every(
        (file) => before.files[file] === state.baseline.files[file]
      )
    )
      throw new Error('Runtime changed before the regression checkpoint')
    if (
      !entry.testFiles.some(
        (file) => before.files[file] !== state.baseline.files[file]
      )
    )
      throw new Error('Add a formal regression before recording it')
    const tests = runTests(workspace, entry)
    if (snapshot(workspace).digest !== before.digest)
      throw new Error('Candidate changed during verification')
    if (
      tests.exitCode !== 1 ||
      !tests.output.includes('ERR_ASSERTION') ||
      tests.error ||
      tests.signal
    )
      throw new Error(
        'Regression must fail with an assertion, not a syntax error, timeout, or crash'
      )
    const evidence = {
      snapshot: before,
      tests,
      createdAt: new Date().toISOString()
    }
    save(path.join(run, 'regression.json'), evidence)
    return evidence
  }
  function evaluate(id) {
    const { run, state, entry, workspace } = load(id)
    const before = snapshot(workspace)
    const changed = [
      ...new Set([
        ...Object.keys(state.baseline.files),
        ...Object.keys(before.files)
      ])
    ]
      .filter((file) => state.baseline.files[file] !== before.files[file])
      .sort()
    let plan = null
    try {
      plan = json(path.join(workspace, 'PLAN.json'))
    } catch {
      /* Invalid plan becomes a failed check. */
    }
    const checks = []
    const check = (name, layer, pass, detail) =>
      checks.push({ name, layer, pass, detail })
    check(
      'routing',
      'skills',
      validPlan(plan, entry),
      'Expected workflow, canonical owner, scope, and source-of-truth references'
    )
    check(
      'admission',
      'architecture',
      admissionMatches(run, state, before),
      'Plan was admitted before task edits and remains unchanged'
    )
    check(
      'scope',
      'architecture',
      changed.every((file) =>
        [...entry.allowedFiles, ...outputFiles].includes(file)
      ),
      `Changed files: ${changed.join(', ')}`
    )
    check(
      'progress',
      'verification',
      entry.allowedFiles.some((file) => changed.includes(file)),
      'At least one task file must change'
    )
    check(
      'handoff',
      'skills',
      !!before.files['HANDOFF.md'] &&
        read(path.join(workspace, 'HANDOFF.md')).trim().length > 0,
      'A written handoff must accompany evidence'
    )
    const tests = runTests(workspace, entry)
    if (tests)
      check(
        'formal-tests',
        'verification',
        tests.exitCode === 0 && !tests.error && !tests.signal,
        'Candidate formal tests must pass'
      )
    if (entry.workflow === 'feature')
      check(
        'added-tests',
        'verification',
        entry.testFiles.some(
          (file) => before.files[file] !== state.baseline.files[file]
        ),
        'New behavior needs changed formal tests'
      )
    if (entry.workflow === 'bugfix') {
      let red = null
      try {
        red = json(path.join(run, 'regression.json'))
      } catch {
        /* Missing evidence fails below. */
      }
      check(
        'test-first',
        'verification',
        !!red &&
          red.tests.exitCode === 1 &&
          entry.runtimeFiles.every(
            (file) => red.snapshot.files[file] === state.baseline.files[file]
          ) &&
          entry.testFiles.every(
            (file) => red.snapshot.files[file] === before.files[file]
          ) &&
          entry.testFiles.some(
            (file) => red.snapshot.files[file] !== state.baseline.files[file]
          ),
        'Retain the same failing regression tests across the runtime correction'
      )
    }
    const oracle = execute(workspace, [oraclePath, entry.id, workspace], true)
    check(
      'behavior',
      'verification',
      oracle.exitCode === 0 && !oracle.error && !oracle.signal,
      'Repository-owned behavioral oracle must pass'
    )
    if (snapshot(workspace).digest !== before.digest)
      throw new Error('Candidate changed during verification')
    const evaluationId = `${Date.now()}-${randomUUID()}`
    const evaluation = {
      formatVersion,
      evaluationId,
      caseId: entry.id,
      actor: state.actor,
      mode: state.mode,
      sourceCommit: state.sourceCommit,
      suite: state.suite,
      node: process.version,
      snapshot: before,
      checks,
      reviewCriteria,
      tests,
      oracle,
      createdAt: new Date().toISOString()
    }
    save(path.join(run, 'evaluations', `${evaluationId}.json`), evaluation)
    const template = {
      evaluationId,
      snapshot: before.digest,
      reviewer: '',
      criteria: Object.fromEntries(
        Object.entries(reviewCriteria).map(([key, value]) => [
          key,
          { pass: null, reason: '', question: value.question }
        ])
      )
    }
    save(path.join(run, 'reviews', `${evaluationId}.template.json`), template)
    return {
      ...evaluation,
      status: checks.every((item) => item.pass) ? 'needs-review' : 'failed',
      reviewTemplate: path.join(run, 'reviews', `${evaluationId}.template.json`)
    }
  }
  function latest(id, contents = new Map()) {
    const { run, state, workspace, currentSuite } = load(id, false, contents)
    const names = readdirSync(path.join(run, 'evaluations'))
      .filter((name) => /^[0-9]+-[a-f0-9-]+\.json$/.test(name))
      .sort()
    if (!names.length) throw new Error('Evaluate the run first')
    const evaluation = json(
      insideRepository(path.join(run, 'evaluations', names.at(-1)))
    )
    if (
      evaluation.suite !== state.suite ||
      evaluation.caseId !== state.caseId ||
      evaluation.snapshot.digest !== snapshot(workspace).digest
    )
      throw new Error('Evaluation is stale; evaluate the current candidate')
    return { run, state, evaluation, currentSuite }
  }
  function review(id, input) {
    const { run, state, evaluation, currentSuite } = latest(id)
    if (!currentSuite)
      throw new Error('Suite or referenced contract changed; prepare a new run')
    if (
      input.evaluationId !== evaluation.evaluationId ||
      input.snapshot !== evaluation.snapshot.digest
    )
      throw new Error(
        'Review must reference the latest exact evaluation and snapshot'
      )
    if (
      typeof input.reviewer !== 'string' ||
      !input.reviewer.trim() ||
      input.reviewer === state.actor
    )
      throw new Error('A distinct named reviewer is required')
    if (!evaluation.checks.every((item) => item.pass))
      throw new Error('Resolve automatic failures before semantic review')
    for (const key of Object.keys(evaluation.reviewCriteria)) {
      const item = input.criteria?.[key]
      if (
        typeof item?.pass !== 'boolean' ||
        typeof item.reason !== 'string' ||
        !item.reason.trim()
      )
        throw new Error(
          `Review needs a decision and evidence reason for ${key}`
        )
    }
    const accepted = { ...input, createdAt: new Date().toISOString() }
    save(path.join(run, 'reviews', `${evaluation.evaluationId}.json`), accepted)
    return report(id)
  }
  function report(id, contents = new Map()) {
    const { run, evaluation, currentSuite } = latest(id, contents)
    const reviewPath = insideRepository(
      path.join(run, 'reviews', `${evaluation.evaluationId}.json`)
    )
    const reviewed = existsSync(reviewPath) ? json(reviewPath) : null
    const failures = evaluation.checks
      .filter((item) => !item.pass)
      .map(({ name, layer, detail }) => ({ name, layer, detail }))
    if (reviewed)
      for (const [name, criterion] of Object.entries(
        evaluation.reviewCriteria
      )) {
        if (!reviewed.criteria[name].pass)
          failures.push({
            name,
            layer: criterion.layer,
            detail: reviewed.criteria[name].reason
          })
      }
    let status = 'needs-review'
    if (failures.length) status = 'failed'
    else if (reviewed) status = 'passed'
    return {
      run: id,
      caseId: evaluation.caseId,
      mode: evaluation.mode,
      actor: evaluation.actor,
      evaluationId: evaluation.evaluationId,
      suite: evaluation.suite,
      currentSuite,
      snapshot: evaluation.snapshot.digest,
      status,
      failures,
      reviewer: reviewed?.reviewer ?? null
    }
  }
  function summarize(ids) {
    if (!ids.length || new Set(ids).size !== ids.length)
      throw new Error('Provide distinct run IDs')
    const contents = new Map() // One operation owns shared contract reads; never retained across calls.
    const reports = ids.map((id) => report(id, contents))
    const groups = new Map()
    for (const item of reports) {
      const key = `${item.mode}:${item.caseId}:${item.suite}`
      if (!groups.has(key))
        groups.set(key, {
          mode: item.mode,
          caseId: item.caseId,
          suite: item.suite,
          currentSuite: item.currentSuite,
          total: 0,
          passed: 0,
          failed: 0,
          pending: 0,
          failures: {}
        })
      const group = groups.get(key)
      group.total += 1
      if (item.status === 'passed') group.passed += 1
      else if (item.status === 'failed') group.failed += 1
      else group.pending += 1
      for (const failure of item.failures) {
        const label = `${failure.layer}:${failure.name}`
        group.failures[label] = (group.failures[label] ?? 0) + 1
      }
    }
    return { groups: [...groups.values()], reports }
  }
  return {
    prepare,
    admit,
    regression,
    evaluate,
    review,
    report,
    summarize,
    readReview: (file) => json(insideRepository(file))
  }
}

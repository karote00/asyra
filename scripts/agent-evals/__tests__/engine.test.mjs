import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { cases, getCase, reviewCriteria } from '../catalog.mjs'
import { createRunner, repositoryRoot } from '../engine.mjs'

function setup(t) {
  const parent = path.join(repositoryRoot, 'tmp/agent-eval-tests')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(path.join(parent, 'run-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return { root, runner: createRunner(root) }
}

function write(workspace, file, text) {
  writeFileSync(path.join(workspace, file), text)
}

function plan(runner, prepared, id) {
  const entry = getCase(prepared.state.caseId)
  write(
    prepared.workspace,
    'PLAN.json',
    JSON.stringify({
      workflow: entry.workflow,
      owner: entry.owner,
      references: entry.references,
      scope: entry.allowedFiles
    })
  )
  runner.admit(id)
}

const regressionTest =
  "import assert from 'node:assert/strict'\nimport test from 'node:test'\nimport { contains } from '../src/range.mjs'\ntest('inclusive boundaries and exterior', () => {\n  assert.equal(contains({min: 1, max: 3}, 1), true)\n  assert.equal(contains({min: 1, max: 3}, 3), true)\n  assert.equal(contains({min: 2, max: 2}, 2), true)\n  assert.equal(contains({min: 1, max: 3}, 4), false)\n})\n"

function correctCandidate(runner, prepared, id) {
  const { workspace, state } = prepared
  if (state.caseId === 'docs-routing') {
    write(
      workspace,
      'docs/delivery.md',
      getCase(state.caseId).files['docs/delivery.md'] +
        '\nA request to create a pull request authorizes the minimum source-branch push needed for that PR.\n'
    )
  } else if (state.caseId === 'bugfix-range') {
    write(workspace, '__tests__/range.test.mjs', regressionTest)
    runner.regression(id)
    write(
      workspace,
      'src/range.mjs',
      'export function contains(range, value) {\n  return value >= range.min && value <= range.max\n}\n'
    )
  } else {
    write(
      workspace,
      'src/view.mjs',
      'export function displayName(item, metadata) {\n  if (!metadata) return item.name\n  return `${item.name} - ${metadata}`\n}\n'
    )
    write(
      workspace,
      '__tests__/view.test.mjs',
      getCase(state.caseId).files['__tests__/view.test.mjs'] +
        "test('metadata is a view projection', () => {\n  const item = Object.freeze({name: 'User / Name'})\n  assert.equal(displayName(item, 'v2'), 'User / Name - v2')\n  assert.equal(displayName(item, ''), 'User / Name')\n  assert.equal(item.name, 'User / Name')\n})\n"
    )
  }
  write(
    workspace,
    'HANDOFF.md',
    'Deterministic evaluator replay. The task files were changed at their declared owner. Formal tests and the external oracle verify behavior; semantic review remains pending. This is not an observed model success.\n'
  )
}

function reviewInput(evaluation) {
  return {
    evaluationId: evaluation.evaluationId,
    snapshot: evaluation.snapshot.digest,
    reviewer: 'replay-review-fixture',
    criteria: Object.fromEntries(
      Object.keys(reviewCriteria).map((key) => [
        key,
        {
          pass: true,
          reason:
            'Deterministic review fixture exercises report admission; it is not a human or model performance observation.'
        }
      ])
    )
  }
}

for (const entry of cases) {
  test(`${entry.id}: real baseline, correction, pending semantic review, and retained report`, (t) => {
    const { runner } = setup(t)
    const prepared = runner.prepare(entry.id, 'trial', 'replay-actor', 'replay')
    if (prepared.state.baselineTests)
      assert.equal(prepared.state.baselineTests.exitCode, 0)
    plan(runner, prepared, 'trial')
    correctCandidate(runner, prepared, 'trial')
    const evaluation = runner.evaluate('trial')
    assert.equal(
      evaluation.status,
      'needs-review',
      JSON.stringify(evaluation.checks)
    )
    assert.equal(evaluation.oracle.exitCode, 0, evaluation.oracle.output)
    assert.equal(runner.report('trial').status, 'needs-review')
    assert.equal(
      runner.review('trial', reviewInput(evaluation)).status,
      'passed'
    )
    const summary = runner.summarize(['trial'])
    assert.equal(summary.groups[0].mode, 'replay')
    assert.equal(summary.groups[0].passed, 1)
    assert.throws(
      () => runner.prepare(entry.id, 'trial', 'actor', 'replay'),
      /EEXIST/
    )
  })
}

test('task edits cannot be retroactively admitted; wrong owner and later plan changes fail', (t) => {
  const { runner } = setup(t)
  const prepared = runner.prepare('docs-routing', 'trial', 'actor', 'replay')
  const entry = getCase('docs-routing')
  const value = {
    workflow: entry.workflow,
    owner: 'policy.json',
    references: entry.references,
    scope: entry.allowedFiles
  }
  write(prepared.workspace, 'PLAN.json', JSON.stringify(value))
  assert.throws(() => runner.admit('trial'), /Plan does not match/)
  value.owner = entry.owner
  write(prepared.workspace, 'PLAN.json', JSON.stringify(value))
  write(prepared.workspace, 'docs/delivery.md', 'Changed too early')
  assert.throws(() => runner.admit('trial'), /before editing/)
  write(prepared.workspace, 'docs/delivery.md', entry.files['docs/delivery.md'])
  runner.admit('trial')
  write(
    prepared.workspace,
    'PLAN.json',
    JSON.stringify({ ...value, owner: 'policy.json' })
  )
  const failures = runner
    .evaluate('trial')
    .checks.filter((item) => !item.pass)
    .map((item) => item.name)
  assert.ok(failures.includes('routing'))
  assert.ok(failures.includes('admission'))
})

test('out-of-scope changes fail even when a valid behavior oracle passes', (t) => {
  const { runner } = setup(t)
  const prepared = runner.prepare(
    'feature-ownership',
    'trial',
    'actor',
    'replay'
  )
  plan(runner, prepared, 'trial')
  correctCandidate(runner, prepared, 'trial')
  write(
    prepared.workspace,
    'src/model.mjs',
    getCase('feature-ownership').files['src/model.mjs'] +
      '// Unnecessary canonical owner edit\n'
  )
  const evaluation = runner.evaluate('trial')
  assert.equal(evaluation.oracle.exitCode, 0)
  assert.equal(evaluation.status, 'failed')
  assert.ok(
    runner
      .report('trial')
      .failures.some(
        (item) => item.layer === 'architecture' && item.name === 'scope'
      )
  )
})

test('unchanged weak candidate tests cannot conceal the endpoint bug', (t) => {
  const { runner } = setup(t)
  const prepared = runner.prepare('bugfix-range', 'trial', 'actor', 'replay')
  plan(runner, prepared, 'trial')
  const evaluation = runner.evaluate('trial')
  assert.equal(evaluation.tests.exitCode, 0)
  assert.equal(evaluation.oracle.exitCode, 1)
  assert.equal(evaluation.status, 'failed')
  assert.throws(() => runner.regression('trial'), /Add a formal regression/)
})

test('regression evidence requires an assertion failure before implementation and unchanged final tests', (t) => {
  const { runner } = setup(t)
  const prepared = runner.prepare('bugfix-range', 'trial', 'actor', 'replay')
  plan(runner, prepared, 'trial')
  write(prepared.workspace, '__tests__/range.test.mjs', 'syntax error !')
  assert.throws(() => runner.regression('trial'), /must fail with an assertion/)
  correctCandidate(runner, prepared, 'trial')
  assert.throws(() => runner.regression('trial'), /Runtime changed/)
  write(
    prepared.workspace,
    '__tests__/range.test.mjs',
    getCase('bugfix-range').files['__tests__/range.test.mjs']
  )
  assert.equal(
    runner.evaluate('trial').checks.find((item) => item.name === 'test-first')
      .pass,
    false
  )
})

test('review cannot approve failures, self-review, missing reasons, or stale evidence', (t) => {
  const { runner } = setup(t)
  const prepared = runner.prepare('docs-routing', 'trial', 'actor', 'replay')
  plan(runner, prepared, 'trial')
  let evaluation = runner.evaluate('trial')
  assert.throws(
    () => runner.review('trial', reviewInput(evaluation)),
    /automatic failures/
  )
  correctCandidate(runner, prepared, 'trial')
  evaluation = runner.evaluate('trial')
  assert.throws(
    () =>
      runner.review('trial', { ...reviewInput(evaluation), reviewer: 'actor' }),
    /distinct/
  )
  const incomplete = reviewInput(evaluation)
  incomplete.criteria.reasoning.reason = ''
  assert.throws(() => runner.review('trial', incomplete), /evidence reason/)
  const rejected = reviewInput(evaluation)
  rejected.criteria.intent.pass = false
  rejected.criteria.intent.reason = 'The reviewer rejects the semantics.'
  assert.equal(runner.review('trial', rejected).status, 'failed')
  assert.equal(
    runner.summarize(['trial']).groups[0].failures['skills:intent'],
    1
  )
  assert.throws(() => runner.review('trial', rejected), /EEXIST/)
  write(prepared.workspace, 'HANDOFF.md', 'Changed after review')
  assert.throws(() => runner.report('trial'), /stale/)
})

test('invalid run identities, versions, duplicate aggregate samples, and symlinks are rejected', (t) => {
  const { root, runner } = setup(t)
  assert.throws(
    () => createRunner('/tmp/outside-project'),
    /inside the repository/
  )
  assert.throws(
    () => runner.prepare('docs-routing', '../escape', 'actor', 'replay'),
    /Run ID/
  )
  assert.throws(
    () => runner.prepare('docs-routing', 'trial', 'actor', 'unknown'),
    /Mode/
  )
  const prepared = runner.prepare('docs-routing', 'trial', 'actor', 'replay')
  symlinkSync(
    path.join(repositoryRoot, 'package.json'),
    path.join(prepared.workspace, 'outside.json')
  )
  assert.throws(() => runner.evaluate('trial'), /symlinks/)
  assert.throws(() => runner.summarize(['trial', 'trial']), /distinct/)
  writeFileSync(
    path.join(root, 'trial/run.json'),
    JSON.stringify({ ...prepared.state, formatVersion: 999 })
  )
  assert.throws(() => runner.evaluate('trial'), /Unsupported run version/)
})

test('candidate processes cannot write external files and terminate at the fixed time limit', (t) => {
  const { root, runner } = setup(t)
  const prepared = runner.prepare(
    'feature-ownership',
    'trial',
    'actor',
    'replay'
  )
  plan(runner, prepared, 'trial')
  const marker = path.join(root, 'unauthorized.txt')
  write(
    prepared.workspace,
    'src/view.mjs',
    `import {writeFileSync} from 'node:fs'\nwriteFileSync(${JSON.stringify(marker)}, 'bad')\nexport function displayName(item) { return item.name }\n`
  )
  const denied = runner.evaluate('trial')
  assert.match(denied.oracle.output, /ERR_ACCESS_DENIED/)
  assert.throws(() => readFileSync(marker), /ENOENT/)
  write(
    prepared.workspace,
    'src/view.mjs',
    'while (true) {}\nexport function displayName(item) { return item.name }\n'
  )
  const timed = runner.evaluate('trial')
  assert.equal(timed.tests.error, 'ETIMEDOUT')
  assert.equal(timed.oracle.error, 'ETIMEDOUT')
  assert.equal(timed.status, 'failed')
})

test('CLI lists cases and refuses unknown commands without dispatching a model', () => {
  const cli = path.join(repositoryRoot, 'scripts/agent-evals/cli.mjs')
  const listed = spawnSync(process.execPath, [cli, 'list'], {
    encoding: 'utf8'
  })
  assert.equal(listed.status, 0)
  assert.deepEqual(
    JSON.parse(listed.stdout).map((entry) => entry.id),
    cases.map((entry) => entry.id)
  )
  const unknown = spawnSync(process.execPath, [cli, 'unknown'], {
    encoding: 'utf8'
  })
  assert.equal(unknown.status, 1)
  assert.match(unknown.stderr, /Usage:/)
})

test('retained suite bytes keep reviewed historical runs comparable without certifying a new suite', (t) => {
  const { runner } = setup(t)
  const prepared = runner.prepare('docs-routing', 'trial', 'actor', 'replay')
  plan(runner, prepared, 'trial')
  correctCandidate(runner, prepared, 'trial')
  const evaluation = runner.evaluate('trial')
  runner.review('trial', reviewInput(evaluation))
  assert.equal(runner.report('trial').currentSuite, true)
  const saved = JSON.parse(
    readFileSync(path.join(prepared.run, 'suite.json'), 'utf8')
  )
  // Reconstruct a historical run whose retained contract differs from today's.
  saved['AGENTS.md'] += '\nHistorical instruction revision.\n'
  const hash = (value) => createHash('sha256').update(value).digest('hex')
  const oldSuite = hash(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(saved).map(([file, content]) => [file, hash(content)])
      )
    )
  )
  writeFileSync(path.join(prepared.run, 'suite.json'), JSON.stringify(saved))
  writeFileSync(
    path.join(prepared.run, 'run.json'),
    JSON.stringify({ ...prepared.state, suite: oldSuite })
  )
  writeFileSync(
    path.join(prepared.run, 'evaluations', `${evaluation.evaluationId}.json`),
    JSON.stringify({ ...evaluation, suite: oldSuite })
  )
  const historical = runner.report('trial')
  assert.equal(historical.status, 'passed')
  assert.equal(historical.currentSuite, false)
  assert.equal(runner.summarize(['trial']).groups[0].suite, oldSuite)
  assert.throws(
    () => runner.evaluate('trial'),
    /Suite or referenced contract changed/
  )
})

test('summary keeps pending agent runs out of replay success counts', (t) => {
  const { runner } = setup(t)
  for (const mode of ['agent', 'replay']) {
    const prepared = runner.prepare('docs-routing', mode, `${mode}-actor`, mode)
    plan(runner, prepared, mode)
    correctCandidate(runner, prepared, mode)
    const evaluation = runner.evaluate(mode)
    if (mode === 'replay') runner.review(mode, reviewInput(evaluation))
  }
  const groups = runner.summarize(['agent', 'replay']).groups
  assert.equal(groups.length, 2)
  assert.equal(groups.find((group) => group.mode === 'agent').pending, 1)
  assert.equal(groups.find((group) => group.mode === 'agent').passed, 0)
  assert.equal(groups.find((group) => group.mode === 'replay').passed, 1)
})

test('summary reads shared contract sources once per invocation and refreshes on the next invocation', (t) => {
  const { runner } = setup(t)
  for (const id of ['first', 'second']) {
    const prepared = runner.prepare('docs-routing', id, 'actor', 'replay')
    plan(runner, prepared, id)
    correctCandidate(runner, prepared, id)
    runner.evaluate(id)
  }
  const original = fs.readFileSync
  let contractReads = 0
  const spy = t.mock.method(fs, 'readFileSync', (file, ...args) => {
    if (file === path.join(repositoryRoot, 'AGENTS.md')) contractReads += 1
    return original(file, ...args)
  })
  syncBuiltinESMExports()
  try {
    assert.equal(runner.summarize(['first', 'second']).groups[0].pending, 2)
    assert.equal(contractReads, 1)
    runner.summarize(['first', 'second'])
    assert.equal(contractReads, 2)
  } finally {
    spy.mock.restore()
    syncBuiltinESMExports()
  }
})

test('CLI completes the evidence and review protocol with explicit pending and failed exit codes', (t) => {
  const id = `cli-${Date.now()}`
  const cli = path.join(repositoryRoot, 'scripts/agent-evals/cli.mjs')
  const invoke = (...args) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: repositoryRoot,
      encoding: 'utf8'
    })
  const preparedResult = invoke(
    'prepare',
    'docs-routing',
    id,
    'cli-replay',
    'replay'
  )
  assert.equal(preparedResult.status, 0, preparedResult.stderr)
  const prepared = JSON.parse(preparedResult.stdout)
  t.after(() => rmSync(prepared.run, { recursive: true, force: true }))
  const entry = getCase('docs-routing')
  write(
    prepared.workspace,
    'PLAN.json',
    JSON.stringify({
      workflow: entry.workflow,
      owner: entry.owner,
      references: entry.references,
      scope: entry.allowedFiles
    })
  )
  assert.equal(invoke('admit', id).status, 0)
  assert.equal(invoke('evaluate', id).status, 1)
  correctCandidate(
    createRunner(),
    { ...prepared, state: { caseId: entry.id } },
    id
  )
  const evaluated = invoke('evaluate', id)
  assert.equal(evaluated.status, 2, evaluated.stderr)
  const evaluation = JSON.parse(evaluated.stdout)
  writeFileSync(
    evaluation.reviewTemplate,
    JSON.stringify(reviewInput(evaluation))
  )
  assert.equal(invoke('review', id, evaluation.reviewTemplate).status, 0)
  assert.equal(JSON.parse(invoke('report', id).stdout).status, 'passed')
  assert.equal(invoke('summary', id).status, 0)
})

test('formal eval suite is part of the existing repository CI test entry', () => {
  const { scripts } = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  assert.equal(
    scripts['test:agent-evals'],
    'node --test scripts/agent-evals/__tests__/engine.test.mjs'
  )
  assert.ok(
    scripts['test:scripts']
      .split(' ')
      .includes('scripts/agent-evals/__tests__/engine.test.mjs')
  )
  assert.ok(scripts['test:ci'].includes('yarn test:scripts'))
})

test('historical reviews are interpreted using the rubric retained by their evaluation', (t) => {
  const { runner } = setup(t)
  const prepared = runner.prepare('docs-routing', 'trial', 'actor', 'replay')
  plan(runner, prepared, 'trial')
  correctCandidate(runner, prepared, 'trial')
  const evaluation = runner.evaluate('trial')
  assert.deepEqual(evaluation.reviewCriteria, reviewCriteria)
  runner.review('trial', reviewInput(evaluation))
  const oldCriteria = {
    historical: { layer: 'architecture', question: 'Prior owner contract' }
  }
  writeFileSync(
    path.join(prepared.run, 'evaluations', `${evaluation.evaluationId}.json`),
    JSON.stringify({ ...evaluation, reviewCriteria: oldCriteria })
  )
  writeFileSync(
    path.join(prepared.run, 'reviews', `${evaluation.evaluationId}.json`),
    JSON.stringify({
      ...reviewInput(evaluation),
      criteria: {
        historical: { pass: false, reason: 'Prior ownership obligation failed' }
      }
    })
  )
  assert.deepEqual(runner.report('trial').failures, [
    {
      name: 'historical',
      layer: 'architecture',
      detail: 'Prior ownership obligation failed'
    }
  ])
})

function experimentDefinition() {
  return {
    formatVersion: 1,
    hypothesis: 'Explicit owner lookup reduces ownership mistakes.',
    failureEvidence:
      'Synthetic replay for evaluator tests; not a real task incident.',
    change: {
      layer: 'skills',
      description:
        'Compare the existing instructions with an owner lookup reminder.',
      files: ['docs/ai/workflows/agent-task.md']
    },
    configurations: {
      baseline: 'Replay - existing instructions',
      candidate: 'Replay - owner lookup reminder'
    },
    mode: 'replay',
    samplesPerCase: 1,
    development: ['docs-routing'],
    holdout: ['feature-ownership']
  }
}

function experimentTrial(
  runner,
  variant,
  caseId,
  outcome = 'passed',
  suffix = ''
) {
  const id = `${variant}-${caseId}${suffix}`
  const prepared = runner.trial(
    'experiment',
    variant,
    caseId,
    id,
    'replay-actor'
  )
  plan(runner, prepared, id)
  if (outcome !== 'failed') correctCandidate(runner, prepared, id)
  const evaluation = runner.evaluate(id)
  if (outcome === 'passed') runner.review(id, reviewInput(evaluation))
  return { prepared, evaluation, id }
}

test('a rejected first trial does not freeze a candidate configuration', (t) => {
  const { root, runner } = setup(t)
  runner.experiment('experiment', experimentDefinition())
  const candidate = path.join(root, '.experiments/experiment/candidate.json')
  assert.throws(
    () =>
      runner.trial(
        'experiment',
        'candidate',
        'feature-ownership',
        'early',
        'actor'
      ),
    /Complete all development/
  )
  assert.equal(fs.existsSync(candidate), false)
  assert.throws(
    () =>
      runner.trial('experiment', 'candidate', 'docs-routing', 'invalid', ''),
    /Actor is required/
  )
  assert.equal(fs.existsSync(candidate), false)
})

test('experiment freezes configuration, keeps failures, separates holdout, and reports regressions despite development gains', (t) => {
  const { root, runner } = setup(t)
  const definition = experimentDefinition()
  runner.experiment('experiment', definition)
  definition.hypothesis = 'Caller mutation must not rewrite the record'
  assert.throws(() => runner.experiment('experiment', definition), /EEXIST/)
  assert.equal(runner.compare('experiment').outcome, 'incomplete')
  assert.throws(
    () =>
      runner.trial(
        'experiment',
        'baseline',
        'feature-ownership',
        'early',
        'actor'
      ),
    /Complete all development/
  )
  experimentTrial(runner, 'baseline', 'docs-routing', 'failed')
  experimentTrial(runner, 'candidate', 'docs-routing')
  assert.throws(
    () =>
      runner.trial(
        'experiment',
        'baseline',
        'docs-routing',
        'replacement',
        'actor'
      ),
    /budget is full/
  )
  experimentTrial(runner, 'baseline', 'feature-ownership')
  experimentTrial(runner, 'candidate', 'feature-ownership', 'failed')
  const result = runner.compare('experiment')
  assert.equal(result.outcome, 'regressed')
  assert.equal(result.groups[0].outcome, 'improved')
  assert.equal(result.groups[0].passRateDelta, 1)
  assert.equal(result.groups[1].outcome, 'regressed')
  assert.equal(result.groups[1].passRateDelta, -1)
  assert.equal(result.groups[1].candidate.failed, 1)
  assert.match(result.definition.failureEvidence, /Synthetic replay/)
  assert.match(result.interpretation, /not observed agent quality/)
  assert.notEqual(result.definition.hypothesis, definition.hypothesis)
  assert.equal(
    JSON.parse(readFileSync(result.artifact, 'utf8')).outcome,
    'regressed'
  )
  assert.ok(result.artifact.startsWith(root))
  assert.notEqual(runner.compare('experiment').artifact, result.artifact)
})

test('experiment reports missing, unevaluated and unreviewed samples without a success delta', (t) => {
  const { runner } = setup(t)
  runner.experiment('experiment', experimentDefinition())
  let result = runner.compare('experiment')
  assert.equal(result.groups[0].baseline.missing, 1)
  runner.trial(
    'experiment',
    'baseline',
    'docs-routing',
    'baseline-docs-routing',
    'actor'
  )
  experimentTrial(runner, 'candidate', 'docs-routing', 'needs-review')
  result = runner.compare('experiment')
  assert.equal(result.groups[0].baseline.pending, 1)
  assert.equal(result.groups[0].baseline.attempts, 0)
  assert.equal(result.groups[0].candidate.pending, 1)
  assert.equal(result.groups[0].candidate.passed, 0)
  assert.equal(result.groups[0].passRateDelta, null)
  assert.throws(
    () =>
      runner.trial(
        'experiment',
        'candidate',
        'feature-ownership',
        'holdout',
        'actor'
      ),
    /evidence or semantic review is pending/
  )
})

test('balanced samples count distinct runs once and expose descriptive improvement', (t) => {
  const { runner } = setup(t)
  runner.experiment('experiment', {
    ...experimentDefinition(),
    samplesPerCase: 2
  })
  for (const suffix of ['-1', '-2']) {
    experimentTrial(runner, 'baseline', 'docs-routing', 'failed', suffix)
    experimentTrial(runner, 'candidate', 'docs-routing', 'passed', suffix)
  }
  for (const suffix of ['-1', '-2']) {
    experimentTrial(runner, 'baseline', 'feature-ownership', 'passed', suffix)
    experimentTrial(runner, 'candidate', 'feature-ownership', 'passed', suffix)
  }
  const result = runner.compare('experiment')
  assert.equal(result.outcome, 'improved')
  assert.equal(result.reports.length, 8)
  assert.equal(new Set(result.reports.map((report) => report.run)).size, 8)
  assert.deepEqual(result.groups[0].baseline, {
    planned: 2,
    passed: 0,
    failed: 2,
    pending: 0,
    missing: 0,
    attempts: 2
  })
  assert.equal(result.groups[0].candidate.passed, 2)
  assert.equal(result.groups[0].passRateDelta, 1)
  assert.equal(result.groups[1].passRateDelta, 0)
})

test('experiment rejects invalid versions, missing hypotheses, mixed partitions and non-instruction changes', (t) => {
  const { runner } = setup(t)
  const invalid = (patch, pattern) =>
    assert.throws(
      () =>
        runner.experiment('invalid', { ...experimentDefinition(), ...patch }),
      pattern
    )
  invalid({ formatVersion: 999 }, /Unsupported experiment/)
  invalid({ hypothesis: '' }, /hypothesis/)
  invalid({ failureEvidence: '' }, /failureEvidence/)
  invalid({ configurations: {} }, /configuration/)
  invalid({ mode: 'automatic' }, /Mode/)
  invalid({ samplesPerCase: 0 }, /Samples/)
  invalid({ samplesPerCase: 1.5 }, /Samples/)
  invalid({ samplesPerCase: 21 }, /Samples/)
  invalid({ holdout: [] }, /holdout/)
  invalid({ holdout: ['docs-routing'] }, /distinct/)
  invalid({ holdout: ['unknown'] }, /Unknown case/)
  invalid(
    { change: { layer: 'unknown', description: 'x', files: [] } },
    /layer/
  )
  invalid(
    {
      change: {
        layer: 'evals',
        description: 'x',
        files: ['scripts/agent-evals/catalog.mjs']
      }
    },
    /new benchmark/
  )
  runner.experiment('experiment', experimentDefinition())
  assert.throws(
    () => runner.trial('experiment', 'unknown', 'docs-routing', 'x', 'actor'),
    /Variant/
  )
  assert.throws(
    () => runner.trial('experiment', 'baseline', 'bugfix-range', 'x', 'actor'),
    /outside/
  )
  runner.prepare('docs-routing', 'existing', 'actor', 'replay')
  assert.throws(
    () =>
      runner.trial(
        'experiment',
        'baseline',
        'docs-routing',
        'existing',
        'actor'
      ),
    /EEXIST/
  )
})

test('experiment compares declared instruction changes, freezes candidate content, and rejects changed evaluators', (t) => {
  const { runner } = setup(t)
  runner.experiment('experiment', experimentDefinition())
  experimentTrial(runner, 'baseline', 'docs-routing')
  const source = 'docs/ai/workflows/agent-task.md'
  let changed = source
  let suffix = '\nCandidate instruction reminder.\n'
  const original = fs.readFileSync
  const spy = t.mock.method(fs, 'readFileSync', (file, ...args) => {
    const value = original(file, ...args)
    if (file === path.join(repositoryRoot, changed)) return value + suffix
    return value
  })
  syncBuiltinESMExports()
  try {
    experimentTrial(runner, 'candidate', 'docs-routing')
    const result = runner.compare('experiment')
    assert.deepEqual(result.changedFiles, [source])
    assert.equal(
      result.reports.find((report) => report.variant === 'baseline')
        .currentSuite,
      false
    )
    assert.equal(result.groups[0].outcome, 'unchanged')
    assert.throws(
      () =>
        runner.trial(
          'experiment',
          'baseline',
          'feature-ownership',
          'wrong-baseline',
          'actor'
        ),
      /Undeclared suite/
    )
    suffix = '\nSecond candidate instruction revision.\n'
    assert.throws(
      () =>
        runner.trial(
          'experiment',
          'candidate',
          'feature-ownership',
          'retuned',
          'actor'
        ),
      /Undeclared suite/
    )
    changed = 'scripts/agent-evals/__tests__/behavior-oracle.mjs'
    assert.throws(
      () =>
        runner.trial(
          'experiment',
          'candidate',
          'feature-ownership',
          'weakened-oracle',
          'actor'
        ),
      /Undeclared suite/
    )
  } finally {
    spy.mock.restore()
    syncBuiltinESMExports()
  }
})

test('comparison validates each candidate snapshot once, shares source reads, and refreshes evidence on the next call', (t) => {
  const { runner } = setup(t)
  runner.experiment('experiment', experimentDefinition())
  experimentTrial(runner, 'baseline', 'docs-routing')
  experimentTrial(runner, 'candidate', 'docs-routing')
  experimentTrial(runner, 'baseline', 'feature-ownership')
  const candidate = experimentTrial(runner, 'candidate', 'feature-ownership')
  const original = fs.readFileSync
  let sharedReads = 0
  let candidateReads = 0
  const spy = t.mock.method(fs, 'readFileSync', (file, ...args) => {
    if (file === path.join(repositoryRoot, 'AGENTS.md')) sharedReads += 1
    if (file === path.join(candidate.prepared.workspace, 'src/view.mjs'))
      candidateReads += 1
    return original(file, ...args)
  })
  syncBuiltinESMExports()
  try {
    assert.equal(runner.compare('experiment').outcome, 'unchanged')
    assert.equal(sharedReads, 1)
    assert.equal(candidateReads, 1)
    runner.compare('experiment')
    assert.equal(sharedReads, 2)
    assert.equal(candidateReads, 2)
    write(candidate.prepared.workspace, 'HANDOFF.md', 'Unverified later edit')
    assert.throws(() => runner.compare('experiment'), /stale/)
    runner.evaluate(candidate.id)
    const refreshed = runner.compare('experiment')
    assert.equal(refreshed.outcome, 'incomplete')
    assert.equal(refreshed.groups[1].candidate.pending, 1)
    assert.equal(refreshed.groups[1].candidate.attempts, 2)
  } finally {
    spy.mock.restore()
    syncBuiltinESMExports()
  }
})

test('development results cannot be revised after holdout release', (t) => {
  const { runner } = setup(t)
  runner.experiment('experiment', experimentDefinition())
  const baseline = experimentTrial(runner, 'baseline', 'docs-routing')
  experimentTrial(runner, 'candidate', 'docs-routing')
  experimentTrial(runner, 'baseline', 'feature-ownership')
  const reevaluated = runner.evaluate(baseline.id)
  runner.review(baseline.id, reviewInput(reevaluated))
  assert.throws(() => runner.compare('experiment'), /changed after holdout/)
  assert.throws(
    () =>
      runner.trial(
        'experiment',
        'candidate',
        'feature-ownership',
        'late',
        'actor'
      ),
    /changed after holdout/
  )
})

test('CLI creates frozen experiments and reports incomplete comparisons without dispatch or retries', (t) => {
  const id = `experiment-cli-${Date.now()}`
  const cli = path.join(repositoryRoot, 'scripts/agent-evals/cli.mjs')
  const { root } = setup(t)
  const definition = path.join(root, 'definition.json')
  writeFileSync(definition, JSON.stringify(experimentDefinition()))
  const invoke = (...args) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: repositoryRoot,
      encoding: 'utf8'
    })
  t.after(() =>
    rmSync(path.join(repositoryRoot, 'tmp/agent-evals/.experiments', id), {
      recursive: true,
      force: true
    })
  )
  t.after(() =>
    rmSync(path.join(repositoryRoot, 'tmp/agent-evals', id), {
      recursive: true,
      force: true
    })
  )
  assert.equal(invoke('experiment', id, definition).status, 0)
  const compared = invoke('compare', id)
  assert.equal(compared.status, 2, compared.stderr)
  assert.equal(JSON.parse(compared.stdout).outcome, 'incomplete')
  const prepared = invoke(
    'trial',
    id,
    'baseline',
    'docs-routing',
    id,
    'replay-actor'
  )
  assert.equal(prepared.status, 0, prepared.stderr)
  assert.equal(JSON.parse(prepared.stdout).state.mode, 'replay')
  assert.equal(invoke('trial', id).status, 1)
  const runner = createRunner()
  runner.evaluate(id) // This failed baseline remains in the comparison.
  for (const [variant, caseId, outcome] of [
    ['candidate', 'docs-routing', 'passed'],
    ['baseline', 'feature-ownership', 'passed'],
    ['candidate', 'feature-ownership', 'failed']
  ]) {
    const runId = `${id}-${variant}-${caseId}`
    t.after(() =>
      rmSync(path.join(repositoryRoot, 'tmp/agent-evals', runId), {
        recursive: true,
        force: true
      })
    )
    const trialResult = invoke(
      'trial',
      id,
      variant,
      caseId,
      runId,
      'replay-actor'
    )
    assert.equal(trialResult.status, 0, trialResult.stderr)
    const trial = JSON.parse(trialResult.stdout)
    plan(runner, trial, runId)
    if (outcome === 'passed') correctCandidate(runner, trial, runId)
    const evaluation = runner.evaluate(runId)
    if (outcome === 'passed') runner.review(runId, reviewInput(evaluation))
  }
  const regressed = invoke('compare', id)
  assert.equal(regressed.status, 1, regressed.stderr)
  assert.equal(JSON.parse(regressed.stdout).outcome, 'regressed')
})

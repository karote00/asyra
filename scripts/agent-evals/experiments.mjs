import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { getCase } from './catalog.mjs'

// Experiment records have their own version; existing run evidence stays v1.
const experimentVersion = 1
const variants = ['baseline', 'candidate']
const splits = ['development', 'holdout']
const terminal = (report) => ['passed', 'failed'].includes(report.status)

function requireText(value, name) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4000)
    throw new Error(`${name} needs nonempty text (at most 4000 characters)`)
}

function validate(definition) {
  if (definition?.formatVersion !== experimentVersion)
    throw new Error('Unsupported experiment version')
  for (const key of ['hypothesis', 'failureEvidence'])
    requireText(definition[key], key)
  for (const variant of variants)
    requireText(
      definition.configurations?.[variant],
      `${variant} configuration`
    )
  requireText(definition.change?.description, 'Change description')
  if (
    !['skills', 'architecture', 'verification', 'evals'].includes(
      definition.change.layer
    )
  )
    throw new Error('Unknown improvement layer')
  if (!['agent', 'replay'].includes(definition.mode))
    throw new Error('Mode must be agent or replay')
  if (
    !Number.isInteger(definition.samplesPerCase) ||
    definition.samplesPerCase < 1 ||
    definition.samplesPerCase > 20
  )
    throw new Error('Samples per case must be an integer from 1 to 20')
  const caseIds = splits.flatMap((split) => {
    if (!Array.isArray(definition[split]) || !definition[split].length)
      throw new Error(`Provide ${split} cases`)
    return definition[split]
  })
  if (new Set(caseIds).size !== caseIds.length)
    throw new Error('Development and holdout cases must be distinct')
  const entries = caseIds.map(getCase)
  const instructionFiles = new Set([
    'AGENTS.md',
    'docs/ai/workflows/agent-task.md',
    ...entries.flatMap((entry) => entry.references)
  ])
  const files = definition.change.files
  if (
    !Array.isArray(files) ||
    new Set(files).size !== files.length ||
    files.some((file) => !instructionFiles.has(file))
  )
    throw new Error(
      'Change files must be distinct captured instruction paths; evaluator changes require a new benchmark'
    )
  return caseIds
}

export function createExperiments({
  root,
  directory,
  read,
  save,
  safePath,
  capture,
  prepare,
  observe
}) {
  function location(id) {
    // Reuse the run owner's ID validation, with a separate storage namespace.
    const name = path.basename(directory(id))
    return safePath(path.join(root, '.experiments', name))
  }
  const file = (id, name) => safePath(path.join(location(id), name))
  function load(id) {
    const experiment = read(file(id, 'experiment.json'))
    validate(experiment.definition)
    return experiment
  }
  function captureAll(caseIds) {
    const contents = new Map()
    return Object.fromEntries(
      caseIds.map((caseId) => [caseId, capture(getCase(caseId), contents)])
    )
  }
  function trials(id) {
    return readdirSync(file(id, 'trials'))
      .sort()
      .map((name) => read(file(id, `trials/${name}`)))
  }
  function observations(records) {
    const reports = observe(records.map((record) => record.run))
    return reports.map((report, index) => {
      const record = records[index]
      if (
        report.caseId !== record.caseId ||
        report.mode !== record.mode ||
        report.suite !== record.suite
      )
        throw new Error('Trial identity no longer matches its admitted run')
      return {
        ...report,
        variant: record.variant,
        split: record.split,
        sample: record.sample
      }
    })
  }
  function experiment(id, definition) {
    const caseIds = validate(definition)
    const suites = captureAll(caseIds)
    const record = { definition, suites, createdAt: new Date().toISOString() }
    const target = location(id)
    mkdirSync(path.dirname(target), { recursive: true })
    mkdirSync(target) // Exclusive, including partially prepared experiments.
    mkdirSync(file(id, 'trials'))
    mkdirSync(file(id, 'comparisons'))
    save(file(id, 'experiment.json'), record)
    return {
      experiment: id,
      definition,
      createdAt: record.createdAt,
      artifact: file(id, 'experiment.json')
    }
  }
  function checkSuites(current, expected, allowedFiles = []) {
    for (const [caseId, suite] of Object.entries(current)) {
      const previous = expected[caseId]
      if (
        !previous ||
        Object.keys(suite.files).length !==
          Object.keys(previous.files).length ||
        Object.entries(suite.files).some(
          ([name, content]) =>
            !allowedFiles.includes(name) && previous.files[name] !== content
        )
      )
        throw new Error(
          'Undeclared suite change; start a new experiment or benchmark'
        )
    }
  }
  function developmentEvidence(id, definition, records) {
    const development = records.filter(
      (record) => record.split === 'development'
    )
    const expected =
      definition.development.length *
      variants.length *
      definition.samplesPerCase
    if (development.length !== expected)
      throw new Error(
        'Complete all development samples before releasing holdout cases'
      )
    const reports = observations(development)
    if (!reports.every(terminal))
      throw new Error('Development evidence or semantic review is pending')
    const evidence = reports.map(({ run, evaluationId, snapshot, status }) => ({
      run,
      evaluationId,
      snapshot,
      status
    }))
    const checkpoint = file(id, 'holdout.json')
    if (existsSync(checkpoint)) {
      if (
        JSON.stringify(read(checkpoint).development) !==
        JSON.stringify(evidence)
      )
        throw new Error(
          'Development evidence changed after holdout release; start a new experiment'
        )
    } else {
      save(checkpoint, {
        development: evidence,
        createdAt: new Date().toISOString()
      })
    }
  }
  function trial(id, variant, caseId, run, actor) {
    const { definition, suites } = load(id)
    if (!variants.includes(variant))
      throw new Error('Variant must be baseline or candidate')
    const split = splits.find((name) => definition[name].includes(caseId))
    if (!split) throw new Error('Case is outside the frozen experiment')
    const records = trials(id)
    const sample =
      records.filter(
        (record) => record.variant === variant && record.caseId === caseId
      ).length + 1
    if (sample > definition.samplesPerCase)
      throw new Error('Sample budget is full; do not replace failed samples')
    if (records.some((record) => record.run === run))
      throw new Error('Run already belongs to this experiment')
    const current = captureAll([
      ...definition.development,
      ...definition.holdout
    ])
    let expected = suites
    let candidateToSave = null
    if (variant === 'candidate') {
      const candidate = file(id, 'candidate.json')
      if (existsSync(candidate)) expected = read(candidate)
      else {
        checkSuites(current, suites, definition.change.files)
        candidateToSave = candidate
        expected = current
      }
    }
    checkSuites(current, expected)
    if (split === 'holdout') developmentEvidence(id, definition, records)
    // Only fresh runs enter an experiment; existing answers cannot be imported.
    const prepared = prepare(caseId, run, actor, definition.mode)
    if (prepared.state.suite !== current[caseId].digest)
      throw new Error(
        'Suite changed while preparing trial; retain evidence and start a new experiment'
      )
    if (candidateToSave) save(candidateToSave, current)
    save(file(id, `trials/${run}.json`), {
      run,
      caseId,
      variant,
      split,
      sample,
      mode: definition.mode,
      suite: prepared.state.suite,
      configuration: definition.configurations[variant]
    })
    return {
      experiment: id,
      variant,
      split,
      sample,
      configuration: definition.configurations[variant],
      ...prepared
    }
  }
  function compare(id) {
    const { definition, suites } = load(id)
    const records = trials(id)
    const reports = observations(records)
    if (existsSync(file(id, 'holdout.json'))) {
      // Reuse this comparison's validated reports; no second report/snapshot pass.
      const development = reports
        .filter((report) => report.split === 'development')
        .map(({ run, evaluationId, snapshot, status }) => ({
          run,
          evaluationId,
          snapshot,
          status
        }))
      if (
        JSON.stringify(read(file(id, 'holdout.json')).development) !==
        JSON.stringify(development)
      )
        throw new Error(
          'Development evidence changed after holdout release; start a new experiment'
        )
    }
    const groups = splits.flatMap((split) =>
      definition[split].map((caseId) => {
        const counts = Object.fromEntries(
          variants.map((variant) => {
            const samples = reports.filter(
              (report) => report.variant === variant && report.caseId === caseId
            )
            return [
              variant,
              {
                planned: definition.samplesPerCase,
                passed: samples.filter((report) => report.status === 'passed')
                  .length,
                failed: samples.filter((report) => report.status === 'failed')
                  .length,
                pending: samples.filter((report) => !terminal(report)).length,
                missing: definition.samplesPerCase - samples.length,
                attempts: samples.reduce(
                  (total, report) => total + report.attempts,
                  0
                )
              }
            ]
          })
        )
        const complete = Object.values(counts).every(
          (count) => !count.pending && !count.missing
        )
        let outcome = 'incomplete'
        const difference = counts.candidate.passed - counts.baseline.passed
        if (complete) {
          outcome = 'unchanged'
          if (difference > 0) outcome = 'improved'
          if (difference < 0) outcome = 'regressed'
        }
        return {
          split,
          caseId,
          ...counts,
          outcome,
          passRateDelta: complete
            ? difference / definition.samplesPerCase
            : null
        }
      })
    )
    let outcome = 'unchanged'
    if (groups.some((group) => group.outcome === 'improved'))
      outcome = 'improved'
    if (groups.some((group) => group.outcome === 'regressed'))
      outcome = 'regressed'
    if (groups.some((group) => group.outcome === 'incomplete'))
      outcome = 'incomplete'
    const candidatePath = file(id, 'candidate.json')
    const candidate = existsSync(candidatePath) ? read(candidatePath) : null
    const changedFiles = [
      ...new Set(
        Object.entries(candidate ?? {}).flatMap(([caseId, suite]) =>
          Object.entries(suite.files)
            .filter(([name, content]) => suites[caseId].files[name] !== content)
            .map(([name]) => name)
        )
      )
    ].sort()
    const comparison = {
      formatVersion: experimentVersion,
      experiment: id,
      definition,
      changedFiles,
      outcome,
      groups,
      reports,
      interpretation:
        definition.mode === 'replay'
          ? 'Evaluator replay only; not observed agent quality'
          : 'Descriptive samples; not statistical proof or causal attribution',
      createdAt: new Date().toISOString()
    }
    const artifact = file(id, `comparisons/${Date.now()}-${randomUUID()}.json`)
    save(artifact, comparison)
    return { ...comparison, artifact }
  }
  return { experiment, trial, compare }
}

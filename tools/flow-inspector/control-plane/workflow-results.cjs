/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const inventory = Object.freeze(
  [
    {
      id: 'design.delete',
      producer: 'design',
      file: 'delete-element.spec.ts',
      title: 'Delete key removes the single selected element'
    },
    {
      id: 'design.collaboration-delete',
      producer: 'collaboration',
      file: 'collaboration.spec.ts',
      title:
        'two real Asyra Design windows converge while connected and catch up through reconnect bootstrap'
    },
    {
      id: 'design.group-delete',
      producer: 'collaboration',
      file: 'collaboration.spec.ts',
      title:
        'remote undo restores an exact nested Group with and without local tombstones'
    }
  ].map(Object.freeze)
)
const identityKeys = [
  'repository',
  'base',
  'head',
  'integration',
  'run',
  'attempt'
]
const hash = (value) => createHash('sha256').update(value).digest('hex')
function classify(observations, reportValid) {
  if (
    observations.some((o) =>
      o.results?.some((s) => ['failed', 'timedOut'].includes(s))
    )
  )
    return 'failed'
  if (!reportValid || observations.length !== 1) return 'unverified'
  const o = observations[0]
  return o.project === 'chromium' &&
    o.expected === 'passed' &&
    o.results.length === 1 &&
    o.results[0] === 'passed'
    ? 'passed'
    : 'unverified'
}
function collect(report, producer, identity) {
  if (!['design', 'collaboration'].includes(producer))
    throw new Error('Unknown workflow producer')
  const specs = []
  function walk(suites) {
    if (!Array.isArray(suites)) return
    for (const suite of suites) {
      if (!suite || typeof suite !== 'object') continue
      if (Array.isArray(suite.specs)) specs.push(...suite.specs)
      walk(suite.suites)
    }
  }
  walk(report?.suites)
  const reportValid = Boolean(
    report &&
    Array.isArray(report.suites) &&
    Array.isArray(report.errors) &&
    report.errors.length === 0
  )
  const cases = inventory
    .filter((c) => c.producer === producer)
    .map((c) => {
      const observations = specs
        .filter(
          (s) =>
            s &&
            [c.file, 'e2e/' + c.file].includes(s.file) &&
            s.title === c.title
        )
        .flatMap((s) => (Array.isArray(s.tests) ? s.tests : []))
        .map((t) => ({
          project: t.projectName === 'chromium' ? 'chromium' : 'unknown',
          expected: t.expectedStatus === 'passed' ? 'passed' : 'unknown',
          results: Array.isArray(t.results)
            ? t.results
                .map((r) =>
                  [
                    'passed',
                    'failed',
                    'timedOut',
                    'skipped',
                    'interrupted'
                  ].includes(r?.status)
                    ? r.status
                    : 'unknown'
                )
                .slice(0, 20)
            : []
        }))
        .slice(0, 20)
      return {
        id: c.id,
        status: classify(observations, reportValid),
        observations
      }
    })
  return {
    version: 1,
    producer,
    identity: Object.fromEntries(identityKeys.map((k) => [k, identity[k]])),
    reportDigest: hash(JSON.stringify(report ?? null)),
    reportValid,
    cases
  }
}
function aggregate(envelopes, identity, jobs, scopeEvidence) {
  const blockers = []
  const validIdentity =
    identityKeys.every(
      (k) => typeof identity[k] === 'string' && identity[k].length > 0
    ) &&
    ['base', 'head', 'integration'].every((k) =>
      /^[a-f0-9]{40}$/.test(identity[k])
    )
  if (!validIdentity)
    blockers.push('Expected execution identity is unavailable')
  const designSelected = jobs.designSelected === 'true'
  const cases = inventory.map((c) => {
    if (!designSelected)
      return {
        id: c.id,
        owner: 'apps/asyra-design',
        file: 'apps/asyra-design/e2e/' + c.file,
        title: c.title,
        status: 'not-selected'
      }
    const records = Array.isArray(envelopes)
      ? envelopes.filter((e) => e?.producer === c.producer)
      : []
    const e = records.length === 1 ? records[0] : null
    const expectedIds = inventory
      .filter((i) => i.producer === c.producer)
      .map((i) => i.id)
    const admitted =
      validIdentity &&
      e?.version === 1 &&
      typeof e.reportValid === 'boolean' &&
      /^[a-f0-9]{64}$/.test(e.reportDigest ?? '') &&
      identityKeys.every((k) => e.identity?.[k] === identity[k]) &&
      Array.isArray(e.cases) &&
      JSON.stringify(e.cases.map((o) => o?.id)) === JSON.stringify(expectedIds)
    const observed = admitted ? e.cases.find((o) => o.id === c.id) : null
    let status = 'unverified'
    if (
      observed &&
      Array.isArray(observed.observations) &&
      observed.observations.every((o) => o && Array.isArray(o.results))
    )
      status = classify(observed.observations, e.reportValid)
    if (!admitted)
      blockers.push(c.id + ': missing or invalid producer evidence')
    return {
      id: c.id,
      owner: 'apps/asyra-design/src/features/delete-element/index.ts',
      file: 'apps/asyra-design/e2e/' + c.file,
      title: c.title,
      status
    }
  })
  if (jobs.validate !== 'success')
    blockers.push('validate: prerequisite did not succeed')
  if (designSelected && jobs.e2e !== 'success')
    blockers.push('e2e: prerequisite did not succeed')
  if (!designSelected && jobs.e2e !== 'skipped')
    blockers.push('e2e: unselected producer did not remain skipped')
  const scope = aggregateScope(scopeEvidence, identity, jobs)
  blockers.push(...scope.blockers)
  let status = 'passed'
  if (cases.some((c) => c.status === 'failed') || scope.status === 'failed')
    status = 'failed'
  else if (
    blockers.length ||
    cases.some((c) => c.status !== 'passed' && c.status !== 'not-selected') ||
    scope.status !== 'passed'
  )
    status = 'unverified'
  return {
    version: 1,
    identity,
    status,
    cases,
    categories: scope.categories,
    producerResults: Object.fromEntries(
      [
        'validate',
        'framework',
        'design',
        'sim',
        'website',
        'tools',
        'frameworkRelease',
        'createAppReadiness',
        'e2e',
        'designForwarder',
        'collaborationForwarder'
      ].map((name) => [name, jobs[name] ?? 'missing'])
    ),
    blockers,
    acceptedBaselineChanged: false,
    protectedEvidence: false
  }
}
function aggregateScope(evidence, identity, jobs) {
  const blockers = []
  const validIdentity =
    identityKeys.every(
      (key) => typeof identity[key] === 'string' && identity[key].length > 0
    ) &&
    ['base', 'head', 'integration'].every((key) =>
      /^[a-f0-9]{40}$/.test(identity[key] ?? '')
    )
  const admitted =
    validIdentity &&
    evidence?.version === 1 &&
    identityKeys.every((key) => evidence.identity?.[key] === identity[key]) &&
    Array.isArray(evidence.categories) &&
    evidence.categories.length > 0 &&
    evidence.categories.every((category) =>
      ['framework', 'design', 'sim', 'website', 'tools'].includes(category)
    ) &&
    new Set(evidence.categories).size === evidence.categories.length &&
    evidence.workspacesByCategory &&
    Array.isArray(evidence.frameworkPackages) &&
    evidence.frameworkPackages.every(
      (name) => typeof name === 'string' && name.startsWith('@asyra/')
    ) &&
    new Set(evidence.frameworkPackages).size ===
      evidence.frameworkPackages.length &&
    typeof evidence.frameworkReleaseRequired === 'boolean' &&
    (evidence.frameworkPackages.length === 0 ||
      evidence.frameworkReleaseRequired) &&
    Array.isArray(evidence.createAppPackages) &&
    evidence.createAppPackages.every((directory) =>
      /^create-app\/[a-z0-9][a-z0-9-]*$/.test(directory)
    ) &&
    new Set(evidence.createAppPackages).size ===
      evidence.createAppPackages.length &&
    ['framework', 'design', 'sim', 'website', 'tools'].every((category) =>
      Array.isArray(evidence.workspacesByCategory[category])
    ) &&
    Array.isArray(evidence.unknownPaths) &&
    evidence.unknownPaths.length === 0
  if (!admitted)
    blockers.push(
      'CI scope evidence is missing, unknown, or belongs to another run attempt'
    )
  const categories = ['framework', 'design', 'sim', 'website', 'tools']
  for (const category of categories) {
    const result = jobs[category]
    const expected =
      admitted &&
      evidence.categories.includes(category) &&
      evidence.workspacesByCategory[category].length > 0
    if (expected && result !== 'success')
      blockers.push(
        category +
          ': selected validation did not succeed (' +
          (result || 'missing') +
          ')'
      )
    if (!expected && result !== 'skipped')
      blockers.push(category + ': unselected validation did not remain skipped')
  }
  const frameworkReleaseSelected = admitted && evidence.frameworkReleaseRequired
  if (frameworkReleaseSelected && jobs.frameworkRelease !== 'success')
    blockers.push(
      'framework-release-readiness: selected release gate did not succeed'
    )
  if (!frameworkReleaseSelected && jobs.frameworkRelease !== 'skipped')
    blockers.push(
      'framework-release-readiness: unselected release gate did not remain skipped'
    )
  const createAppSelected = admitted && evidence.createAppPackages.length > 0
  if (createAppSelected && jobs.createAppReadiness !== 'success')
    blockers.push(
      'create-app-readiness: selected package check did not succeed'
    )
  if (!createAppSelected && jobs.createAppReadiness !== 'skipped')
    blockers.push(
      'create-app-readiness: unselected package check did not remain skipped'
    )
  for (const name of ['designForwarder', 'collaborationForwarder'])
    if (jobs[name] !== 'success')
      blockers.push(name + ': required forwarder did not succeed')
  const failed =
    jobs.validate === 'failure' ||
    (admitted &&
      evidence.categories.some(
        (category) =>
          evidence.workspacesByCategory[category].length > 0 &&
          jobs[category] === 'failure'
      )) ||
    (frameworkReleaseSelected && jobs.frameworkRelease === 'failure') ||
    (createAppSelected && jobs.createAppReadiness === 'failure') ||
    jobs.designForwarder === 'failure' ||
    jobs.collaborationForwarder === 'failure'
  const passed = admitted && blockers.length === 0
  let status = 'unverified'
  if (passed) status = 'passed'
  else if (failed) status = 'failed'
  return {
    version: 1,
    identity,
    status,
    categories: admitted ? evidence.categories : [],
    jobs,
    blockers
  }
}
function runtimeIdentity() {
  return Object.fromEntries(
    identityKeys.map((k) => [
      k,
      process.env['FLOW_RESULT_' + k.toUpperCase()] ?? ''
    ])
  )
}
function summary(result) {
  return [
    '## Flow CI - ' + result.status,
    '',
    'Observational results; no accepted baseline or protected delivery authorization.',
    '',
    '### Selected validation producers',
    '',
    '| Producer | Result |',
    '| --- | --- |',
    ...Object.entries(result.producerResults ?? {}).map(
      ([name, status]) => '| ' + name + ' | ' + status + ' |'
    ),
    '',
    '### Design evidence',
    '',
    '| Case | Result |',
    '| --- | --- |',
    ...result.cases.map((c) => '| ' + c.id + ' | ' + c.status + ' |'),
    '',
    ...result.blockers.map((b) => '- ' + b),
    ''
  ].join('\n')
}
if (require.main === module) {
  const [command, producer, reportPath] = process.argv.slice(2)
  if (command === 'collect') {
    let report = null
    try {
      if (fs.statSync(reportPath).size <= 32 * 1024 * 1024)
        report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
    } catch {
      /* Missing producer output remains unverified. */
    }
    const identity = runtimeIdentity()
    identity.integration = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8'
    }).trim()
    const envelope = collect(report, producer, identity)
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      'evidence=' + JSON.stringify(envelope) + '\n'
    )
  } else if (command === 'aggregate') {
    const envelopes = [
      'FLOW_DESIGN_EVIDENCE',
      'FLOW_COLLABORATION_EVIDENCE'
    ].map((k) => {
      try {
        return JSON.parse(process.env[k] ?? '')
      } catch {
        return null
      }
    })
    let scope = null
    try {
      scope = JSON.parse(process.env.FLOW_SCOPE_EVIDENCE ?? '')
    } catch {
      /* Missing scope evidence remains unverified. */
    }
    const jobs = {
      validate: process.env.FLOW_VALIDATE_RESULT,
      e2e: process.env.FLOW_E2E_RESULT,
      designSelected: process.env.FLOW_DESIGN_SELECTED,
      framework: process.env.FLOW_SCOPE_FRAMEWORK_RESULT,
      design: process.env.FLOW_SCOPE_DESIGN_RESULT,
      sim: process.env.FLOW_SCOPE_SIM_RESULT,
      website: process.env.FLOW_SCOPE_WEBSITE_RESULT,
      tools: process.env.FLOW_SCOPE_TOOLS_RESULT,
      frameworkRelease: process.env.FLOW_FRAMEWORK_RELEASE_RESULT,
      createAppReadiness: process.env.FLOW_CREATE_APP_READINESS_RESULT,
      designForwarder: process.env.FLOW_DESIGN_FORWARDER_RESULT,
      collaborationForwarder: process.env.FLOW_COLLABORATION_FORWARDER_RESULT
    }
    const result = aggregate(envelopes, runtimeIdentity(), jobs, scope)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary(result))
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = result.status === 'passed' ? 0 : 1
  } else throw new Error('Expected collect or aggregate')
}
module.exports = { collect, aggregate }

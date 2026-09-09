/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
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
function aggregate(envelopes, identity, jobs) {
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
  const cases = inventory.map((c) => {
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
  for (const name of ['validate', 'e2e'])
    if (jobs[name] !== 'success')
      blockers.push(name + ': prerequisite did not succeed')
  let status = 'passed'
  if (cases.some((c) => c.status === 'failed')) status = 'failed'
  else if (blockers.length || cases.some((c) => c.status !== 'passed'))
    status = 'unverified'
  return {
    version: 1,
    identity,
    status,
    cases,
    blockers,
    acceptedBaselineChanged: false,
    protectedEvidence: false
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
    const envelope = collect(report, producer, runtimeIdentity())
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
    const result = aggregate(envelopes, runtimeIdentity(), {
      validate: process.env.FLOW_VALIDATE_RESULT,
      e2e: process.env.FLOW_E2E_RESULT
    })
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary(result))
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = result.status === 'passed' ? 0 : 1
  } else throw new Error('Expected collect or aggregate')
}
module.exports = { collect, aggregate }

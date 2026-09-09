/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { collect, aggregate } = require('../workflow-results.cjs')
const identity = {
  repository: 'karote00/asyra',
  base: 'a'.repeat(40),
  head: 'b'.repeat(40),
  integration: 'c'.repeat(40),
  run: '123',
  attempt: '1'
}
const names = [
  ['delete-element.spec.ts', 'Delete key removes the single selected element'],
  [
    'collaboration.spec.ts',
    'two real Asyra Design windows converge while connected and catch up through reconnect bootstrap'
  ],
  [
    'collaboration.spec.ts',
    'remote undo restores an exact nested Group with and without local tombstones'
  ]
]
function report(indices) {
  return {
    errors: [],
    suites: [
      {
        suites: [
          {
            specs: indices.map((i) => ({
              file: names[i][0],
              title: names[i][1],
              tests: [
                {
                  projectName: 'chromium',
                  expectedStatus: 'passed',
                  results: [{ status: 'passed' }]
                }
              ]
            }))
          }
        ]
      }
    ]
  }
}
function envelopes() {
  return [
    collect(report([0]), 'design', identity),
    collect(report([1, 2]), 'collaboration', identity)
  ]
}
function assess(
  records = envelopes(),
  jobs = { validate: 'success', e2e: 'success' }
) {
  return aggregate(records, identity, jobs)
}
test('all exact Design cases pass only after successful dependencies', () => {
  const r = assess()
  assert.equal(r.status, 'passed')
  assert.equal(r.cases.length, 3)
})
test('a Delete assertion failure survives missing downstream observations and failed jobs', () => {
  const r = report([0])
  r.suites[0].suites[0].specs[0].tests[0].results[0].status = 'failed'
  const result = assess(
    [collect(r, 'design', identity), collect(null, 'collaboration', identity)],
    { validate: 'success', e2e: 'failure' }
  )
  assert.equal(result.status, 'failed')
  assert.equal(result.cases[0].status, 'failed')
  assert.equal(result.cases[1].status, 'unverified')
})
for (const status of ['skipped', 'interrupted', 'unknown'])
  test(status + ' cannot pass', () => {
    const r = report([0])
    r.suites[0].suites[0].specs[0].tests[0].results[0].status = status
    assert.notEqual(
      assess([collect(r, 'design', identity), envelopes()[1]]).status,
      'passed'
    )
  })
test('failed retry followed by pass remains failed', () => {
  const r = report([0])
  r.suites[0].suites[0].specs[0].tests[0].results = [
    { status: 'failed' },
    { status: 'passed' }
  ]
  assert.equal(collect(r, 'design', identity).cases[0].status, 'failed')
})
for (const variant of [
  'missing',
  'duplicate',
  'wrong-project',
  'expected-failure',
  'errors'
])
  test(variant + ' report is unverified', () => {
    const r = report([0])
    const specs = r.suites[0].suites[0].specs
    if (variant === 'missing') specs.length = 0
    if (variant === 'duplicate') specs.push(structuredClone(specs[0]))
    if (variant === 'wrong-project') specs[0].tests[0].projectName = 'firefox'
    if (variant === 'expected-failure')
      specs[0].tests[0].expectedStatus = 'failed'
    if (variant === 'errors')
      r.errors.push({ message: 'do not expose report text' })
    assert.equal(collect(r, 'design', identity).cases[0].status, 'unverified')
  })
for (const key of Object.keys(identity))
  test('mismatched ' + key + ' cannot pass', () => {
    const e = envelopes()
    e[0].identity[key] += 'x'
    assert.equal(assess(e).status, 'unverified')
  })
test('malformed envelope, removed or duplicated cases cannot weaken inventory', () => {
  for (const records of [[], [null], [{ producer: 'design' }]])
    assert.notEqual(assess(records).status, 'passed')
  const e = envelopes()
  e[0].cases = []
  assert.equal(assess(e).status, 'unverified')
  const d = envelopes()
  d.push(d[0])
  assert.equal(assess(d).status, 'unverified')
  const changed = envelopes()
  changed[0].cases[0].status = 'passed'
  changed[0].cases[0].observations[0].results = ['failed']
  assert.notEqual(assess(changed).status, 'passed')
})
test('dependency failure or cancellation blocks green even if selected cases passed', () => {
  for (const outcome of ['failure', 'cancelled', 'skipped', ''])
    assert.notEqual(
      assess(envelopes(), { validate: outcome, e2e: 'success' }).status,
      'passed'
    )
})
test('bounded output contains no raw report messages or stdout', () => {
  const r = report([0])
  r.secret = 'SENSITIVE_VALUE'
  r.errors = [{ message: 'SENSITIVE_VALUE' }]
  assert.ok(
    !JSON.stringify(collect(r, 'design', identity)).includes('SENSITIVE_VALUE')
  )
})
test('workflow waits on reusable producers and always collects after failed tests', () => {
  const root = path.resolve(__dirname, '../../../..')
  const main = fs.readFileSync(
    path.join(root, '.github/workflows/main.yml'),
    'utf8'
  )
  const e2e = fs.readFileSync(
    path.join(root, '.github/workflows/e2e.yml'),
    'utf8'
  )
  assert.match(
    main,
    /flow-ci:\s*\n\s*needs: \[validate, design-e2e\]\s*\n\s*if: \$\{\{ always\(\) && \(github.event_name != 'pull_request' \|\| github.event.pull_request.draft == false\) \}\}/
  )
  assert.match(main, /uses: \.\/.github\/workflows\/e2e.yml/)
  assert.match(e2e, /workflow_call:/)
  assert.doesNotMatch(e2e.split('permissions:')[0], /pull_request:/)
  assert.equal((e2e.match(/if: \$\{\{ always\(\) \}\}/g) || []).length, 2)
  assert.match(e2e, /workflow-results.cjs collect design/)
  assert.match(e2e, /workflow-results.cjs collect collaboration/)
})

test('CLI retains missing reports as unverified and exits nonzero on incomplete aggregation', () => {
  const { spawnSync } = require('node:child_process')
  const root = path.resolve(__dirname, '../../../..')
  const parent = path.join(root, 'tmp/flow-ci-tests')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'results-'))
  try {
    const output = path.join(directory, 'output')
    const summary = path.join(directory, 'summary')
    const env = {
      ...process.env,
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary,
      ...Object.fromEntries(
        Object.entries(identity).map(([k, v]) => [
          'FLOW_RESULT_' + k.toUpperCase(),
          v
        ])
      )
    }
    const cli = path.join(
      root,
      'tools/flow-inspector/control-plane/workflow-results.cjs'
    )
    const collected = spawnSync(
      process.execPath,
      [cli, 'collect', 'design', path.join(directory, 'missing.json')],
      { env, encoding: 'utf8' }
    )
    assert.equal(collected.status, 0)
    const evidence = JSON.parse(
      fs.readFileSync(output, 'utf8').trim().slice('evidence='.length)
    )
    assert.equal(evidence.cases[0].status, 'unverified')
    assert.equal(
      evidence.identity.integration,
      spawnSync('git', ['rev-parse', 'HEAD'], {
        cwd: root,
        encoding: 'utf8'
      }).stdout.trim()
    )
    const result = spawnSync(process.execPath, [cli, 'aggregate'], {
      env: {
        ...env,
        FLOW_DESIGN_EVIDENCE: JSON.stringify(evidence),
        FLOW_COLLABORATION_EVIDENCE: 'invalid',
        FLOW_VALIDATE_RESULT: 'success',
        FLOW_E2E_RESULT: 'failure'
      },
      encoding: 'utf8'
    })
    assert.equal(result.status, 1)
    assert.equal(JSON.parse(result.stdout).status, 'unverified')
    assert.match(
      fs.readFileSync(summary, 'utf8'),
      /design.delete \| unverified/
    )
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

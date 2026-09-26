/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { collect, aggregate } = require('../workflow-results.cjs')
const proofFlow = require('../../inspectors/flow-inspector-core-proof-flow-inspector.data.cjs')
const identity = {
  repository: 'karote00/asyra',
  base: 'a'.repeat(40),
  head: 'b'.repeat(40),
  integration: 'c'.repeat(40),
  run: '123',
  attempt: '1'
}
const designScopeEvidence = {
  version: 1,
  identity,
  categories: ['design'],
  createAppPackages: [],
  frameworkReleaseRequired: false,
  unknownPaths: [],
  workspacesByCategory: {
    framework: [],
    design: ['@asyra/asyra-design'],
    sim: [],
    website: [],
    tools: []
  },
  frameworkPackages: []
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
function assess(records = envelopes(), jobs = {}, scope = designScopeEvidence) {
  return aggregate(
    records,
    identity,
    {
      validate: 'success',
      e2e: 'success',
      designSelected: 'true',
      framework: 'skipped',
      design: 'success',
      sim: 'skipped',
      website: 'skipped',
      tools: 'skipped',
      frameworkRelease: 'skipped',
      designForwarder: 'success',
      collaborationForwarder: 'success',
      createAppReadiness: 'skipped',
      ...jobs
    },
    scope
  )
}
test('all exact Design cases pass only after successful dependencies', () => {
  const r = assess()
  assert.equal(r.status, 'passed')
  assert.equal(r.cases.length, 3)
})
test('selected CI scopes require success and unselected scopes must be skipped', () => {
  assert.equal(assess().status, 'passed')
  for (const result of ['failure', 'cancelled', 'skipped', ''])
    assert.equal(
      assess(envelopes(), { design: result }).status,
      result === 'failure' ? 'failed' : 'unverified'
    )
  assert.equal(assess(envelopes(), { sim: 'success' }).status, 'unverified')
})
test('a documented owner with no affected workspace requires the app job to stay skipped', () => {
  const documentationScope = {
    ...designScopeEvidence,
    workspacesByCategory: {
      ...designScopeEvidence.workspacesByCategory,
      design: []
    }
  }
  assert.equal(
    assess(
      envelopes(),
      { design: 'skipped', e2e: 'skipped', designSelected: 'false' },
      documentationScope
    ).status,
    'passed'
  )
  assert.equal(
    assess(envelopes(), { design: 'success' }, documentationScope).status,
    'unverified'
  )
})
test('Framework changes require the package release gate and actual consumers', () => {
  const frameworkScope = {
    ...designScopeEvidence,
    categories: ['framework', 'design'],
    workspacesByCategory: {
      ...designScopeEvidence.workspacesByCategory,
      framework: ['@asyra/core', '@asyra/fieldscope']
    },
    frameworkPackages: ['@asyra/core'],
    frameworkReleaseRequired: true
  }
  assert.equal(
    assess(
      envelopes(),
      { framework: 'success', frameworkRelease: 'success' },
      frameworkScope
    ).status,
    'passed'
  )
  assert.equal(
    assess(
      envelopes(),
      { framework: 'success', frameworkRelease: 'skipped' },
      frameworkScope
    ).status,
    'unverified'
  )
})

test('non-workspace release owners require their actual workflow gates', () => {
  const createAppScope = {
    ...designScopeEvidence,
    categories: ['framework'],
    workspacesByCategory: {
      framework: [],
      design: [],
      sim: [],
      website: [],
      tools: []
    },
    createAppPackages: ['create-app/asyra-design']
  }
  assert.equal(
    assess(
      envelopes(),
      {
        designSelected: 'false',
        e2e: 'skipped',
        design: 'skipped',
        createAppReadiness: 'success'
      },
      createAppScope
    ).status,
    'passed'
  )
  assert.equal(
    assess(
      envelopes(),
      { designSelected: 'false', e2e: 'skipped', design: 'skipped' },
      createAppScope
    ).status,
    'unverified'
  )

  const releaseToolScope = {
    ...createAppScope,
    createAppPackages: [],
    frameworkReleaseRequired: true
  }
  assert.equal(
    assess(
      envelopes(),
      {
        designSelected: 'false',
        e2e: 'skipped',
        design: 'skipped',
        frameworkRelease: 'success'
      },
      releaseToolScope
    ).status,
    'passed'
  )
  assert.equal(
    assess(
      envelopes(),
      { designSelected: 'false', e2e: 'skipped', design: 'skipped' },
      releaseToolScope
    ).status,
    'unverified'
  )
})

test('Changesets and root documentation pass only through shared validation', () => {
  const sharedScope = {
    ...designScopeEvidence,
    categories: ['framework', 'tools'],
    workspacesByCategory: {
      framework: [],
      design: [],
      sim: [],
      website: [],
      tools: []
    }
  }
  const sharedJobs = {
    designSelected: 'false',
    e2e: 'skipped',
    design: 'skipped'
  }
  assert.equal(assess(envelopes(), sharedJobs, sharedScope).status, 'passed')
  assert.equal(
    assess(envelopes(), { ...sharedJobs, validate: 'skipped' }, sharedScope)
      .status,
    'unverified'
  )
  const root = path.resolve(__dirname, '../../../..')
  const main = fs.readFileSync(
    path.join(root, '.github/workflows/main.yml'),
    'utf8'
  )
  assert.match(main, /run: yarn test:scripts/)
  assert.match(main, /run: yarn changeset:pr:check/)
})

test('formal path owners reach their selected gates through the final aggregate', async () => {
  const { classifyChanges, readWorkspaceManifests } =
    await import('../../../../scripts/ci-scope.mjs')
  const root = path.resolve(__dirname, '../../../..')
  const manifests = readWorkspaceManifests(root)
  const jobsFor = (scope, missingSelectedGate = false) => ({
    validate: 'success',
    e2e: 'skipped',
    designSelected: 'false',
    framework: 'skipped',
    design: 'skipped',
    sim: 'skipped',
    website: 'skipped',
    tools: 'skipped',
    frameworkRelease:
      scope.frameworkReleaseRequired && !missingSelectedGate
        ? 'success'
        : 'skipped',
    createAppReadiness:
      scope.createAppPackages.length > 0 && !missingSelectedGate
        ? 'success'
        : 'skipped',
    designForwarder: 'success',
    collaborationForwarder: 'success'
  })
  for (const changedPath of [
    '.changeset/example.md',
    'README.md',
    'create-app/asyra-design/package.json',
    'scripts/release-package-artifacts.js'
  ]) {
    const scope = {
      version: 1,
      identity,
      ...classifyChanges([changedPath], manifests)
    }
    assert.deepEqual(scope.unknownPaths, [], changedPath)
    assert.equal(
      aggregate([], identity, jobsFor(scope), scope).status,
      'passed',
      changedPath
    )
    if (scope.frameworkReleaseRequired || scope.createAppPackages.length > 0)
      assert.equal(
        aggregate([], identity, jobsFor(scope, true), scope).status,
        'unverified',
        changedPath + ' missing selected owner gate'
      )
  }
})

test('workflow wires non-workspace owners to their concrete readiness producers', () => {
  const root = path.resolve(__dirname, '../../../..')
  const main = fs.readFileSync(
    path.join(root, '.github/workflows/main.yml'),
    'utf8'
  )
  assert.match(
    main,
    /create_app_packages: \$\{\{ steps\.scope\.outputs\.create_app_packages \}\}/
  )
  assert.match(
    main,
    /framework_release_required: \$\{\{ steps\.scope\.outputs\.framework_release_required \}\}/
  )
  assert.match(
    main,
    /create_app_result: \$\{\{ steps\.create_app\.outcome \}\}/
  )
  assert.match(main, /id: create_app/)
  assert.match(main, /needs\.scope\.outputs\.create_app_packages != ''/)
  assert.match(main, /npm pack --dry-run --json/)
  assert.match(
    main,
    /needs\.scope\.outputs\.framework_release_required == 'true'/
  )
  assert.match(
    main,
    /FLOW_CREATE_APP_READINESS_RESULT: \$\{\{ needs\.shared-validation\.outputs\.create_app_result \}\}/
  )
  assert.match(main, /^ {2}shared-validation:/m)
  assert.match(main, /^ {2}validate:/m)
  assert.match(
    main,
    /validate:\s*\n\s*needs: \[scope, shared-validation, framework, design, sim, website, tools, framework-release-readiness, design-e2e, e2e-tests, collaboration-e2e-tests\]/
  )
})
test('Inspector fixes the complete scoped aggregate owner, route, and artifact contract', () => {
  const step = proofFlow.steps.find(
    (item) => item.id === 'aggregate-workflow-results'
  )
  const route = proofFlow.routes.find(
    (item) => item.id === 'aggregate-workflow-results-terminal'
  )
  const artifact = proofFlow.artifacts.find(
    (item) => item.id === 'artifact:workflow-result-summary'
  )
  assert.ok(step)
  assert.ok(route)
  assert.ok(artifact)
  for (const input of [
    'base/head changed paths and workspace manifests/dependency graph',
    'tracked Changesets and root documentation inputs',
    'run-scoped CI scope evidence',
    'completed shared validation and selected category producer outcomes',
    'Framework release-tool readiness and selected package release outcome',
    'non-workspace create-app package directories and conditional archive-step outcome',
    'Design E2E producer envelopes and required forwarder results',
    'GitHub repository, base, head, integration, run and attempt identity'
  ])
    assert.ok(step.inputs.includes(input), input)
  assert.ok(
    step.conditions.some((condition) =>
      /docs-only.*shared validation.*applicable document-owner check/iu.test(
        condition
      )
    )
  )
  assert.ok(
    step.conditions.some((condition) =>
      /unknown.*fail the total/iu.test(condition)
    )
  )
  assert.ok(
    step.conditions.some((condition) => /same.*run attempt/iu.test(condition))
  )
  assert.ok(
    step.conditions.some((condition) =>
      /rerun.*entire workflow/iu.test(condition)
    )
  )
  assert.ok(
    step.conditions.some((condition) =>
      /required.*forwarder.*success/iu.test(condition)
    )
  )
  assert.ok(
    step.conditions.some((condition) =>
      /Recognized \.changeset metadata and tracked root documents.*without selecting unrelated workspace suites/iu.test(
        condition
      )
    )
  )
  assert.ok(
    step.conditions.some((condition) =>
      /Framework release readiness.*release-validation owner inputs.*even when the changed input is not a workspace/iu.test(
        condition
      )
    )
  )
  assert.ok(
    step.conditions.some((condition) =>
      /create-app CLI packages are outside the workspace graph.*npm pack archive check inside shared validation/iu.test(
        condition
      )
    )
  )
  assert.ok(
    step.conditions.some((condition) =>
      /existing required validate GitHub check as the one canonical aggregate.*shared-validation/iu.test(
        condition
      )
    )
  )
  assert.ok(
    step.allowedContributors.some((item) =>
      /Git diff.*workspace package manifests/iu.test(item)
    )
  )
  assert.ok(step.implementationBoundary.includes('scripts/ci-scope.mjs'))
  assert.ok(
    step.implementationBoundary.includes('scripts/__tests__/ci-scope.test.mjs')
  )
  assert.ok(
    step.implementationBoundary.includes(
      'tools/flow-inspector/inspectors/flow-inspector-core-proof-flow-inspector.data.cjs'
    )
  )
  assert.ok(
    step.implementationBoundary.includes(
      'tools/flow-inspector/workspace/workspace-bundle.data.js'
    )
  )
  assert.equal(step.failureOwnerStepId, 'aggregate-workflow-results')
  assert.match(route.predicate, /scope classification/iu)
  assert.deepEqual(route.producedArtifacts, [
    'artifact:workflow-result-summary'
  ])
  assert.equal(artifact.ownerStepId, 'aggregate-workflow-results')
})
test('missing, unknown, duplicate, or stale-attempt scope evidence cannot pass', () => {
  const evidence = {
    version: 1,
    identity,
    categories: ['design'],
    unknownPaths: [],
    workspacesByCategory: {
      framework: [],
      design: ['@asyra/asyra-design'],
      sim: [],
      website: [],
      tools: []
    },
    frameworkPackages: []
  }
  const jobs = {
    framework: 'skipped',
    design: 'success',
    sim: 'skipped',
    website: 'skipped',
    tools: 'skipped'
  }
  assert.equal(assess(envelopes(), jobs, null).status, 'unverified')
  assert.equal(
    assess(envelopes(), jobs, { ...evidence, unknownPaths: ['unmapped'] })
      .status,
    'unverified'
  )
  assert.equal(
    assess(envelopes(), jobs, { ...evidence, categories: ['design', 'design'] })
      .status,
    'unverified'
  )
  assert.equal(
    assess(envelopes(), jobs, {
      ...evidence,
      identity: { ...identity, attempt: '2' }
    }).status,
    'unverified'
  )
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
    /validate:\s*\n\s*needs: \[scope, shared-validation, framework, design, sim, website, tools, framework-release-readiness, design-e2e, e2e-tests, collaboration-e2e-tests\]/
  )
  assert.match(main, /workflow-results\.cjs aggregate/)
  assert.doesNotMatch(main, /workflow-results\.cjs aggregate-scope/)
  assert.equal(
    (main.match(/workflow-results\.cjs aggregate(?:\s|$)/g) || []).length,
    1
  )
  assert.doesNotMatch(main, /^ {2}flow-ci:/m)
  assert.match(
    main,
    /FLOW_VALIDATE_RESULT: \$\{\{ needs\.shared-validation\.result \}\}/
  )
  assert.match(main, /uses: \.\/.github\/workflows\/e2e.yml/)
  assert.match(e2e, /workflow_call:/)
  assert.doesNotMatch(e2e.split('permissions:')[0], /pull_request:/)
  assert.equal((e2e.match(/if: \$\{\{ always\(\) \}\}/g) || []).length, 2)
  assert.match(e2e, /workflow-results.cjs collect design/)
  assert.match(e2e, /workflow-results.cjs collect collaboration/)
})

test('existing required E2E check names succeed for producers or declared skips', () => {
  const { spawnSync } = require('node:child_process')
  const root = path.resolve(__dirname, '../../../..')
  const main = fs.readFileSync(
    path.join(root, '.github/workflows/main.yml'),
    'utf8'
  )
  const e2e = fs.readFileSync(
    path.join(root, '.github/workflows/e2e.yml'),
    'utf8'
  )
  for (const [job, output] of [
    ['e2e-tests', 'design-result'],
    ['collaboration-e2e-tests', 'collaboration-result']
  ]) {
    assert.ok(
      e2e.includes(output + ':\n        value: ${{ jobs.' + job + '.result }}')
    )
    const block = main.match(
      new RegExp(
        '^  ' + job + ':\\n([\\s\\S]*?)(?=^  [a-z]|$(?![\\s\\S]))',
        'm'
      )
    )?.[1]
    assert.ok(block, 'missing existing required check: ' + job)
    assert.match(block, /needs: \[scope, design-e2e\]/)
    assert.match(block, /always\(\).*github.event.pull_request.draft == false/)
    assert.ok(
      block.includes(
        'FLOW_PRODUCER_RESULT: ${{ needs.design-e2e.outputs.' + output + ' }}'
      )
    )
    const command = block.match(/run: \|\n([\s\S]*?)(?=\n\n|$)/)?.[1]
    assert.ok(command)
    for (const [selected, workflowResult, result, expected] of [
      ['true', 'success', 'success', true],
      ['true', 'success', 'failure', false],
      ['true', 'skipped', 'success', false],
      ['false', 'skipped', '', true],
      ['false', 'success', 'success', false]
    ]) {
      const script = command
        .split('\n')
        .map((line) => line.replace(/^ {10}/, ''))
        .join('\n')
      const run = spawnSync('bash', ['-c', script], {
        env: {
          PATH: process.env.PATH,
          FLOW_PRODUCER_RESULT: result,
          DESIGN_SELECTED: selected,
          DESIGN_E2E_WORKFLOW_RESULT: workflowResult
        }
      })
      assert.equal(
        run.status === 0,
        expected,
        job + ': ' + selected + '/' + workflowResult + '/' + result
      )
    }
  }
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
    const currentIdentity = {
      ...identity,
      integration: evidence.identity.integration
    }
    const currentScope = {
      ...designScopeEvidence,
      identity: currentIdentity
    }
    const completeRun = {
      ...env,
      FLOW_RESULT_INTEGRATION: currentIdentity.integration,
      FLOW_SCOPE_EVIDENCE: JSON.stringify(currentScope),
      FLOW_SCOPE_FRAMEWORK_RESULT: 'skipped',
      FLOW_SCOPE_DESIGN_RESULT: 'success',
      FLOW_SCOPE_SIM_RESULT: 'skipped',
      FLOW_SCOPE_WEBSITE_RESULT: 'skipped',
      FLOW_SCOPE_TOOLS_RESULT: 'skipped',
      FLOW_FRAMEWORK_RELEASE_RESULT: 'skipped',
      FLOW_CREATE_APP_READINESS_RESULT: 'skipped',
      FLOW_DESIGN_FORWARDER_RESULT: 'success',
      FLOW_COLLABORATION_FORWARDER_RESULT: 'success',
      FLOW_VALIDATE_RESULT: 'success',
      FLOW_E2E_RESULT: 'success',
      FLOW_DESIGN_SELECTED: 'true',
      FLOW_DESIGN_EVIDENCE: JSON.stringify(
        collect(report([0]), 'design', currentIdentity)
      ),
      FLOW_COLLABORATION_EVIDENCE: JSON.stringify(
        collect(report([1, 2]), 'collaboration', currentIdentity)
      )
    }
    const complete = spawnSync(process.execPath, [cli, 'aggregate'], {
      env: completeRun,
      encoding: 'utf8'
    })
    assert.equal(complete.status, 0)
    assert.equal(JSON.parse(complete.stdout).status, 'passed')
    const selectedCreateAppRun = {
      ...completeRun,
      FLOW_SCOPE_EVIDENCE: JSON.stringify({
        ...currentScope,
        createAppPackages: ['create-app/asyra-design']
      })
    }
    for (const [outcome, expectedStatus] of [
      ['success', 'passed'],
      ['skipped', 'unverified'],
      ['failure', 'failed']
    ]) {
      const aggregated = spawnSync(process.execPath, [cli, 'aggregate'], {
        env: {
          ...selectedCreateAppRun,
          FLOW_CREATE_APP_READINESS_RESULT: outcome
        },
        encoding: 'utf8'
      })
      assert.equal(
        JSON.parse(aggregated.stdout).status,
        expectedStatus,
        `create-app step outcome ${outcome} must reach the workflow aggregate: ${aggregated.stdout}`
      )
      assert.equal(aggregated.status, expectedStatus === 'passed' ? 0 : 1)
    }
    const staleAttempt = spawnSync(process.execPath, [cli, 'aggregate'], {
      env: { ...completeRun, FLOW_RESULT_ATTEMPT: '2' },
      encoding: 'utf8'
    })
    assert.equal(staleAttempt.status, 1)
    assert.equal(JSON.parse(staleAttempt.stdout).status, 'unverified')
    const result = spawnSync(process.execPath, [cli, 'aggregate'], {
      env: {
        ...env,
        FLOW_DESIGN_EVIDENCE: JSON.stringify(evidence),
        FLOW_COLLABORATION_EVIDENCE: 'invalid',
        FLOW_VALIDATE_RESULT: 'success',
        FLOW_E2E_RESULT: 'failure',
        FLOW_DESIGN_SELECTED: 'true'
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

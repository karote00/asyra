/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { collect, aggregate } = require('../workflow-results.cjs')
const proofFlow = require('../../inspectors/flow-inspector-core-proof-flow-inspector.data.cjs')
const { createHash } = require('node:crypto')
const identity = {
  repository: 'karote00/asyra',
  base: 'a'.repeat(40),
  head: 'b'.repeat(40),
  integration: 'c'.repeat(40),
  run: '123',
  attempt: '1'
}
function workspaceEntry(
  name,
  directory,
  buildTask = `build:${directory.split('/').at(-1)}`
) {
  return {
    name,
    directory,
    buildTask,
    testTask: 'test:ci',
    artifactId: createHash('sha256').update(name).digest('hex').slice(0, 16)
  }
}
function makeScope({
  identity: scopeIdentity = identity,
  workspaceMatrix = [
    workspaceEntry('@asyra/asyra-design', 'apps/asyra-design')
  ],
  createAppPackages = [],
  frameworkReleaseRequired = false,
  unknownPaths = []
} = {}) {
  const graph = workspaceMatrix.map((entry) => ({
    ...entry,
    group: entry.directory.split('/')[0],
    dependencies: []
  }))
  const relationshipMap = {
    version: 1,
    workspaceRoots: ['apps', 'packages', 'tools'],
    documentationRoots: [],
    excludedRoots: { 'create-app': 'archive-readiness' },
    workspaceGraph: graph,
    dependencyEdges: [],
    frameworkDeclarationTasks: graph
      .filter(({ group }) => group === 'packages')
      .map(({ name, buildTask }) => ({ workspace: name, task: buildTask })),
    changedWorkspaceNames: workspaceMatrix.map(({ name }) => name),
    affectedWorkspaceNames: workspaceMatrix.map(({ name }) => name),
    workspaceMatrix,
    sharedValidationRequired: true,
    frameworkReleaseRequired,
    createAppPackages,
    designE2EWorkspaceDirectory: 'apps/asyra-design',
    flowInspectorValidationWorkspaceDirectory: 'tools/flow-inspector',
    flowInspectorValidationRequired: workspaceMatrix.some(
      ({ directory }) => directory === 'tools/flow-inspector'
    ),
    designE2ERequired: workspaceMatrix.some(
      ({ directory }) => directory === 'apps/asyra-design'
    ),
    unknownPaths
  }
  return {
    version: 2,
    identity: scopeIdentity,
    relationshipMap,
    relationshipMapDigest: createHash('sha256')
      .update(JSON.stringify(relationshipMap))
      .digest('hex'),
    affectedWorkspaces: workspaceMatrix.map(({ name }) => name),
    workspaceMatrix,
    frameworkPackages: workspaceMatrix
      .filter(({ directory }) => directory.startsWith('packages/'))
      .map(({ name }) => name),
    createAppPackages,
    frameworkReleaseRequired,
    designE2ERequired: relationshipMap.designE2ERequired,
    unknownPaths
  }
}
const designScopeEvidence = makeScope()
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
function workspaceResult(entry, scope, result = {}) {
  return {
    version: 1,
    identity: scope.identity,
    relationshipMapDigest: scope.relationshipMapDigest,
    workspace: entry.name,
    directory: entry.directory,
    buildTask: entry.buildTask,
    testTask: entry.testTask,
    buildStatus: 'success',
    testStatus: 'success',
    taskSequence: [entry.buildTask, entry.testTask],
    status: 'success',
    ...result
  }
}
function assess(records = envelopes(), jobs = {}, scope = designScopeEvidence) {
  const selectedScope = scope ?? designScopeEvidence
  const matrixResults = selectedScope.relationshipMap.workspaceMatrix.map(
    (entry) => workspaceResult(entry, selectedScope)
  )
  return aggregate(
    records,
    identity,
    {
      validate: 'success',
      e2e: selectedScope.relationshipMap.designE2ERequired
        ? 'success'
        : 'skipped',
      designSelected: selectedScope.relationshipMap.designE2ERequired
        ? 'true'
        : 'false',
      workspaceValidation: 'success',
      flowInspectorValidation: selectedScope.relationshipMap
        .flowInspectorValidationRequired
        ? 'success'
        : 'skipped',
      workspaceResults: matrixResults,
      frameworkRelease: 'skipped',
      designForwarder: 'success',
      collaborationForwarder: 'success',
      createAppReadiness: 'skipped',
      ...jobs
    },
    selectedScope
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
      assess(envelopes(), { workspaceValidation: result }).status,
      result === 'failure' ? 'failed' : 'unverified'
    )
  assert.equal(
    assess(envelopes(), { workspaceResults: [] }).status,
    'unverified'
  )
})
test('a documented owner with no affected workspace requires the app job to stay skipped', () => {
  const documentationScope = makeScope({ workspaceMatrix: [] })
  assert.equal(
    assess(
      envelopes(),
      {
        workspaceValidation: 'skipped',
        workspaceResults: [],
        e2e: 'skipped',
        designSelected: 'false'
      },
      documentationScope
    ).status,
    'passed'
  )
  assert.equal(
    assess(
      envelopes(),
      {
        workspaceValidation: 'success',
        designSelected: 'false',
        e2e: 'skipped'
      },
      documentationScope
    ).status,
    'unverified'
  )
})
test('Framework changes require the package release gate and actual consumers', () => {
  const frameworkScope = makeScope({
    workspaceMatrix: [
      workspaceEntry('@asyra/core', 'packages/core'),
      workspaceEntry('@asyra/fieldscope', 'apps/fieldscope')
    ],
    frameworkReleaseRequired: true
  })
  assert.equal(
    assess(envelopes(), { frameworkRelease: 'success' }, frameworkScope).status,
    'passed'
  )
  assert.equal(
    assess(envelopes(), { frameworkRelease: 'skipped' }, frameworkScope).status,
    'unverified'
  )
})

test('non-workspace release owners require their actual workflow gates', () => {
  const createAppScope = makeScope({
    workspaceMatrix: [],
    createAppPackages: ['create-app/asyra-design']
  })
  assert.equal(
    assess(
      envelopes(),
      {
        designSelected: 'false',
        e2e: 'skipped',
        workspaceValidation: 'skipped',
        createAppReadiness: 'success'
      },
      createAppScope
    ).status,
    'passed'
  )
  assert.equal(
    assess(
      envelopes(),
      {
        designSelected: 'false',
        e2e: 'skipped',
        workspaceValidation: 'skipped'
      },
      createAppScope
    ).status,
    'unverified'
  )

  const releaseToolScope = {
    ...makeScope({ workspaceMatrix: [], frameworkReleaseRequired: true })
  }
  assert.equal(
    assess(
      envelopes(),
      {
        designSelected: 'false',
        e2e: 'skipped',
        workspaceValidation: 'skipped',
        frameworkRelease: 'success'
      },
      releaseToolScope
    ).status,
    'passed'
  )
  assert.equal(
    assess(
      envelopes(),
      {
        designSelected: 'false',
        e2e: 'skipped',
        workspaceValidation: 'skipped'
      },
      releaseToolScope
    ).status,
    'unverified'
  )
})

test('Changesets and root documentation pass only through shared validation', () => {
  const sharedScope = makeScope({ workspaceMatrix: [] })
  const sharedJobs = {
    designSelected: 'false',
    e2e: 'skipped',
    workspaceValidation: 'skipped',
    workspaceResults: []
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
  const { classifyChanges, readCreateAppManifests, readWorkspaceManifests } =
    await import('../../../../scripts/ci-scope.mjs')
  const root = path.resolve(__dirname, '../../../..')
  const manifests = readWorkspaceManifests(root)
  const createAppManifests = readCreateAppManifests(root)
  const jobsFor = (scope, missingSelectedGate = false) => {
    const selected = scope.relationshipMap.workspaceMatrix
    const designSelected = scope.relationshipMap.designE2ERequired
    return Object.fromEntries([
      ['validate', 'success'],
      ['e2e', designSelected ? 'success' : 'skipped'],
      ['designSelected', designSelected ? 'true' : 'false'],
      ['workspaceValidation', selected.length ? 'success' : 'skipped'],
      [
        'flowInspectorValidation',
        scope.relationshipMap.flowInspectorValidationRequired &&
        !missingSelectedGate
          ? 'success'
          : 'skipped'
      ],
      [
        'workspaceResults',
        selected.map((entry) => workspaceResult(entry, scope))
      ],
      [
        'frameworkRelease',
        scope.frameworkReleaseRequired && !missingSelectedGate
          ? 'success'
          : 'skipped'
      ],
      [
        'createAppReadiness',
        scope.createAppPackages.length > 0 && !missingSelectedGate
          ? 'success'
          : 'skipped'
      ],
      ['designForwarder', 'success'],
      ['collaborationForwarder', 'success']
    ])
  }
  for (const changedPath of [
    '.changeset/example.md',
    '.github/dependabot.yml',
    '.github/pull_request_template.md',
    '.github/app-production-environment.json',
    'README.md',
    'create-app/asyra-design/package.json',
    'scripts/release-package-artifacts.js',
    'turbo.base.json',
    'docs/ai/apps/fieldscope/PLANS.md'
  ]) {
    const scope = {
      version: 2,
      identity,
      ...classifyChanges(
        [changedPath],
        manifests,
        manifests,
        createAppManifests
      )
    }
    assert.deepEqual(scope.unknownPaths, [], changedPath)
    const result = aggregate(envelopes(), identity, jobsFor(scope), scope)
    assert.equal(result.status, 'passed', changedPath)
    assert.equal(result.producerResults.validate, 'success', changedPath)
    assert.equal(
      result.producerResults.workspaceValidation,
      scope.workspaceMatrix.length > 0 ? 'success' : 'skipped',
      changedPath
    )
    if (scope.frameworkReleaseRequired || scope.createAppPackages.length > 0)
      assert.equal(
        aggregate(envelopes(), identity, jobsFor(scope, true), scope).status,
        'unverified',
        changedPath + ' missing selected owner gate'
      )
  }
})

test('dynamic workspace matrix requires exact run-bound build and test evidence', () => {
  const workspace = workspaceEntry(
    '@fixture/unnamed-consumer',
    'apps/unnamed-consumer'
  )
  const scope = makeScope({ workspaceMatrix: [workspace] })
  const record = (buildStatus = 'success', testStatus = 'success') =>
    workspaceResult(workspace, scope, {
      buildStatus,
      testStatus,
      status:
        buildStatus === 'failure' || testStatus === 'failure'
          ? 'failed'
          : 'success',
      taskSequence:
        buildStatus === 'failure'
          ? [workspace.buildTask]
          : [workspace.buildTask, workspace.testTask]
    })
  const jobs = {
    validate: 'success',
    e2e: 'skipped',
    designSelected: 'false',
    frameworkRelease: 'skipped',
    createAppReadiness: 'skipped',
    flowInspectorValidation: 'skipped',
    designForwarder: 'success',
    collaborationForwarder: 'success',
    workspaceValidation: 'success',
    workspaceResults: [record()]
  }

  assert.equal(aggregate([], identity, jobs, scope).status, 'passed')
  const omittedMatrixScope = {
    ...scope,
    relationshipMap: {
      ...scope.relationshipMap,
      workspaceMatrix: []
    }
  }
  assert.equal(
    aggregate(
      [],
      identity,
      {
        ...jobs,
        workspaceValidation: 'skipped',
        workspaceResults: []
      },
      omittedMatrixScope
    ).status,
    'unverified'
  )
  assert.equal(
    aggregate([], identity, { ...jobs, workspaceResults: [] }, scope).status,
    'unverified'
  )
  assert.equal(
    aggregate(
      [],
      identity,
      {
        ...jobs,
        workspaceResults: [
          { ...record(), relationshipMapDigest: '0'.repeat(64) }
        ]
      },
      scope
    ).status,
    'unverified'
  )
  assert.equal(
    aggregate(
      [],
      identity,
      {
        ...jobs,
        workspaceResults: [
          {
            ...record(),
            taskSequence: [workspace.testTask, workspace.buildTask]
          }
        ]
      },
      scope
    ).status,
    'unverified'
  )
  assert.equal(
    aggregate(
      [],
      identity,
      { ...jobs, workspaceResults: [record(), record()] },
      scope
    ).status,
    'unverified'
  )
  assert.equal(
    aggregate(
      [],
      identity,
      { ...jobs, workspaceResults: [record('failure', 'skipped')] },
      scope
    ).status,
    'failed'
  )
  assert.equal(
    aggregate(
      [],
      identity,
      { ...jobs, workspaceResults: [record('success', 'failure')] },
      scope
    ).status,
    'failed'
  )
  assert.equal(
    aggregate(
      [],
      identity,
      {
        ...jobs,
        workspaceValidation: 'skipped',
        workspaceResults: [record()]
      },
      scope
    ).status,
    'unverified'
  )
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
    /validate:\s*\n\s*needs:\s*(?:\[\s*)?scope,\s*shared-validation,\s*workspace-validation,\s*flow-inspector-validation,\s*framework-release-readiness,\s*design-e2e,\s*e2e-tests,\s*collaboration-e2e-tests(?:\s*\])?/
  )
  assert.match(
    main,
    /matrix:\s*\n\s*workspace: \$\{\{ fromJson\(needs\.scope\.outputs\.workspace_matrix\) \}\}/
  )
  assert.match(main, /actions\/upload-artifact@/)
  assert.match(main, /actions\/download-artifact@/)
  for (const removedJob of ['framework', 'design', 'sim', 'website', 'tools'])
    assert.doesNotMatch(main, new RegExp(`^  ${removedJob}:`, 'm'))
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
    'base/head changed paths and discovered apps/packages/tools workspace manifests/dependency graph',
    'tracked Changesets and root documentation inputs',
    'versioned CI relationship policy and discovered documentation roots',
    'run-scoped CI scope evidence',
    'completed shared validation and dynamic per-workspace build/test result records',
    'selected Flow Inspector validation outcome',
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
      /Public documentation selects its configured site workspace.*other discovered documentation roots require shared validation/iu.test(
        condition
      )
    )
  )
  assert.ok(
    step.conditions.some((condition) =>
      /union of base and head dependency edges.*deletions and renames preserve old consumers/iu.test(
        condition
      )
    )
  )
  assert.ok(
    step.conditions.some((condition) =>
      /create-app CLI packages remain outside the workspace graph.*conditional npm pack archive check/iu.test(
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
      /Git diff.*workspace manifests and base\/head dependency edges/iu.test(
        item
      )
    )
  )
  assert.ok(step.implementationBoundary.includes('scripts/ci-scope.mjs'))
  assert.ok(
    step.implementationBoundary.includes('scripts/ci-relationships.json')
  )
  assert.ok(
    step.implementationBoundary.includes('scripts/run-workspace-checks.mjs')
  )
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
  const evidence = makeScope()
  const jobs = {
    workspaceValidation: 'success',
    workspaceResults: evidence.workspaceMatrix.map((entry) =>
      workspaceResult(entry, evidence)
    )
  }
  assert.equal(
    aggregate(
      envelopes(),
      identity,
      {
        validate: 'success',
        e2e: 'success',
        designSelected: 'true',
        frameworkRelease: 'skipped',
        createAppReadiness: 'skipped',
        flowInspectorValidation: 'skipped',
        designForwarder: 'success',
        collaborationForwarder: 'success',
        ...jobs
      },
      null
    ).status,
    'unverified'
  )
  assert.equal(
    assess(envelopes(), jobs, makeScope({ unknownPaths: ['unmapped'] })).status,
    'unverified'
  )
  const duplicateEntry = structuredClone(evidence.workspaceMatrix[0])
  const duplicateScope = makeScope({
    workspaceMatrix: [...evidence.workspaceMatrix, duplicateEntry]
  })
  assert.equal(assess(envelopes(), jobs, duplicateScope).status, 'unverified')
  const staleScope = makeScope({
    identity: { ...identity, attempt: '2' }
  })
  assert.equal(assess(envelopes(), jobs, staleScope).status, 'unverified')
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
    /validate:\s*\n\s*needs:\s*(?:\[\s*)?scope,\s*shared-validation,\s*workspace-validation,\s*flow-inspector-validation,\s*framework-release-readiness,\s*design-e2e,\s*e2e-tests,\s*collaboration-e2e-tests(?:\s*\])?/
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
    const workspaceResultsDirectory = path.join(directory, 'workspace-results')
    fs.mkdirSync(workspaceResultsDirectory)
    const designWorkspace = currentScope.workspaceMatrix[0]
    fs.writeFileSync(
      path.join(
        workspaceResultsDirectory,
        `${designWorkspace.artifactId}.json`
      ),
      JSON.stringify(workspaceResult(designWorkspace, currentScope))
    )
    const completeRun = {
      ...env,
      FLOW_RESULT_INTEGRATION: currentIdentity.integration,
      FLOW_SCOPE_EVIDENCE: JSON.stringify(currentScope),
      FLOW_WORKSPACE_VALIDATION_RESULT: 'success',
      FLOW_WORKSPACE_RESULTS_DIR: workspaceResultsDirectory,
      FLOW_FRAMEWORK_RELEASE_RESULT: 'skipped',
      FLOW_CREATE_APP_READINESS_RESULT: 'skipped',
      FLOW_FLOW_INSPECTOR_VALIDATION_RESULT: 'skipped',
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
    for (const [outcome, expectedStatus] of [
      ['success', 'passed'],
      ['skipped', 'unverified'],
      ['failure', 'failed']
    ]) {
      const selectedCreateAppScope = makeScope({
        identity: currentIdentity,
        createAppPackages: ['create-app/asyra-design']
      })
      fs.writeFileSync(
        path.join(
          workspaceResultsDirectory,
          `${designWorkspace.artifactId}.json`
        ),
        JSON.stringify(workspaceResult(designWorkspace, selectedCreateAppScope))
      )
      const aggregated = spawnSync(process.execPath, [cli, 'aggregate'], {
        env: {
          ...completeRun,
          FLOW_SCOPE_EVIDENCE: JSON.stringify(selectedCreateAppScope),
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

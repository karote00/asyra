;(function () {
  const specPath = 'docs/ai/workflows/local-affected-validation.md'
  const inspectorPath =
    'tools/flow-inspector/inspectors/local-affected-validation-flow-inspector.data.cjs'
  const collect = {
    id: 'collect',
    order: 1,
    laneId: 'local',
    title: 'Collect local inputs',
    ownerPackage: 'Repository local validation',
    purpose: 'git-input-owner',
    inputs: ['explicit base or origin/main', 'HEAD, index and working files'],
    outputs: ['artifact:local-inputs'],
    conditions: [
      'Resolve commits and union committed, staged, unstaged and untracked paths',
      'Retain removals and fingerprint without file contents'
    ],
    bypasses: ['An unchanged checkout has an explicit empty path set'],
    allowedContributors: ['Git read commands', 'filesystem input fingerprints'],
    forbiddenContributors: [
      'remote operations',
      'ignored environment contents',
      'dependency classification'
    ],
    implementationBoundary: [
      'scripts/local-validation.mjs',
      'scripts/__tests__/local-validation.test.mjs'
    ],
    specRefs: ['#local-inputs'],
    failureOwnerStepId: 'collect',
    cacheDimensions: []
  }
  const select = {
    id: 'select',
    order: 2,
    laneId: 'local',
    title: 'Select affected owners',
    ownerPackage: 'Repository CI scope',
    purpose: 'shared-impact-owner',
    inputs: [
      'artifact:local-inputs',
      'current and base workspace manifests',
      'CI relationship map'
    ],
    outputs: ['artifact:local-plan'],
    conditions: [
      'Reuse the CI classifier and related/full-owner contracts',
      'Select registered supervised owner tests and profiles from one source graph; unknown edges broaden selection',
      'Unknown relations and missing local command contracts are unresolved'
    ],
    bypasses: ['Not-defined E2E and unselected owners are explicit'],
    allowedContributors: [
      'ci-scope.mjs',
      'ci-relationships.json',
      'local input adapter'
    ],
    forbiddenContributors: [
      'local-only duplicate of the CI dependency graph',
      'workspace name whitelist',
      'execution during preview'
    ],
    implementationBoundary: [
      'scripts/local-validation.mjs',
      'scripts/ci-relationships.json',
      'scripts/ci-scope.mjs',
      'scripts/test-impact.mjs',
      'scripts/__tests__/test-impact.test.mjs',
      'scripts/__tests__/ci-scope.test.mjs',
      'scripts/__tests__/local-validation.test.mjs'
    ],
    specRefs: ['#shared-selection'],
    failureOwnerStepId: 'select',
    cacheDimensions: []
  }
  const execute = {
    id: 'execute',
    order: 3,
    laneId: 'local',
    title: 'Run owned local checks',
    ownerPackage: 'Repository local validation',
    purpose: 'local-process-owner',
    inputs: ['artifact:local-plan', 'explicit run flag'],
    outputs: ['artifact:local-result'],
    conditions: [
      'Run the selected live security audit before builds and stop on audit failure',
      'Retain CI build prerequisites and owner test guards',
      'Execute selected profile files through the same supervised owner and require exact selection receipts',
      'Require actual selected results and nonzero test evidence',
      'Stop owned children on cancellation and reject changed source identity'
    ],
    bypasses: [
      'Preview never creates child check processes',
      'Unselected security audits do not query the registry'
    ],
    allowedContributors: [
      'existing CI check runners',
      'selected security:audit registry query',
      'declared owner E2E commands',
      'owned process/log storage'
    ],
    forbiddenContributors: [
      'remote CI claims',
      'global process cleanup',
      'successful missing or zero-test results'
    ],
    implementationBoundary: [
      'scripts/local-validation.mjs',
      'scripts/local-validation-runner.mjs',
      'scripts/run-workspace-checks.mjs',
      'tools/flow-inspector/control-plane/workflow-results.cjs',
      'tools/flow-inspector/control-plane/__tests__/workflow-results.test.cjs',
      'apps/fieldscope/scripts/run-profile-groups.py',
      'apps/fieldscope/scripts/run-e2e-ci.mjs',
      'apps/fieldscope/scripts/e2e-ci-groups.mjs',
      '.github/workflows/main.yml',
      '.github/workflows/fieldscope-profile.yml',
      'scripts/__tests__/local-validation.test.mjs',
      'scripts/__tests__/local-validation-runner.test.mjs',
      'package.json'
    ],
    specRefs: ['#owned-execution'],
    failureOwnerStepId: 'execute',
    cacheDimensions: []
  }
  const artifact = (id, owner, consumers) => ({
    id,
    title: id.slice(9),
    ownerStepId: owner,
    consumerStepIds: consumers,
    terminal: consumers.length === 0,
    description:
      'Detached local validation contract; no product state or remote authority.'
  })
  const data = {
    schema: { id: 'flow-inspector', version: 2 },
    target: {
      id: 'local-affected-validation',
      kind: 'feature',
      title: 'Local Affected Validation',
      subtitle: 'Shared CI selection with owned local execution'
    },
    authority: {
      specPath,
      inspectorPath,
      semanticOwner: 'Repository local validation',
      inspectorOwner: 'Repository local validation'
    },
    links: [],
    lanes: [{ id: 'local', title: 'Local validation', order: 1 }],
    steps: [collect, select, execute],
    artifacts: [
      artifact('artifact:local-inputs', 'collect', ['select']),
      artifact('artifact:local-plan', 'select', ['execute']),
      artifact('artifact:local-result', 'execute', [])
    ],
    routes: [
      {
        id: 'inputs-to-selection',
        from: 'collect',
        to: 'select',
        kind: 'handoff',
        producedArtifacts: ['artifact:local-inputs'],
        predicate: 'Git inputs resolved'
      },
      {
        id: 'plan-to-execution',
        from: 'select',
        to: 'execute',
        kind: 'handoff',
        producedArtifacts: ['artifact:local-plan'],
        predicate: 'Explicit run and all obligations resolved'
      },
      {
        id: 'result',
        from: 'execute',
        to: null,
        kind: 'handoff',
        producedArtifacts: ['artifact:local-result'],
        predicate: 'Preserve passed, failed, cancelled and unverified outcomes'
      }
    ],
    invariants: [],
    acceptanceContracts: []
  }
  const freeze = (value) => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze)
      Object.freeze(value)
    }
  }
  freeze(data)
  globalThis.FLOW_INSPECTOR_DATA = data
  if (typeof module !== 'undefined') module.exports = data
})()

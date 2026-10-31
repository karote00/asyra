import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

const policy = JSON.parse(
  fs.readFileSync(new URL('./ci-relationships.json', import.meta.url), 'utf8')
)

export function readValidationPlan(evidence) {
  const map = evidence.relationshipMap
  const digest = createHash('sha256').update(JSON.stringify(map)).digest('hex')
  if (digest !== evidence.relationshipMapDigest) {
    throw new Error('Validation relationship digest does not match')
  }
  const e2eSuites = map.executionPlan.checks.e2e.selected.map((id) => ({
    id,
    command:
      policy.e2eSuites.find((suite) => suite.id === id)?.localCommand ?? null
  }))

  return {
    relationshipMap: map,
    relationshipMapDigest: digest,
    executionPlan: map.executionPlan,
    workspaceMatrix: map.workspaceMatrix,
    profileFiles: map.fieldscopeProfileFiles,
    profileCommand: map.fieldscopeProfileCommand,
    e2eSuites,
    unresolved: [
      ...map.executionPlan.unknownRelations,
      ...e2eSuites
        .filter(({ command }) => !command)
        .map(({ id }) => `No local E2E command contract: ${id}`)
    ]
  }
}

// Both local execution and CI adapters consume this ordered inventory. Workspace,
// profile and browser owners retain their own supervision and result contracts.
export function validationCheckCommands(
  plan,
  outputDirectory,
  repositoryRoot,
  executionIdentity
) {
  if (plan.unresolved.length) {
    throw new Error(
      `Unresolved local obligations: ${plan.unresolved.join(', ')}`
    )
  }
  const checks = plan.executionPlan.checks
  const commands = []
  const add = (id, executable, args, env = {}, evidence = { type: 'exit' }) =>
    commands.push({ id, executable, args, env, evidence })
  const identity = {
    ...Object.fromEntries(
      Object.entries(executionIdentity).map(([key, value]) => [
        `CI_SCOPE_${key.toUpperCase()}`,
        value
      ])
    ),
    CI_RELATIONSHIP_MAP_DIGEST: plan.relationshipMapDigest
  }
  for (const [name, id, command] of [
    ['securityAudit', 'security-audit', 'security:audit'],
    ['dependencyValidation', 'dependencies', 'deps:validate'],
    ['turboValidation', 'build-graph', 'gen:turbo:check']
  ]) {
    if (checks[name].mode !== 'not-selected') {
      add(id, 'yarn', [command])
    }
  }
  if (
    checks.frameworkDeclarations.mode !== 'not-selected' &&
    checks.frameworkDeclarations.tasks.length
  ) {
    add('declarations', 'yarn', [
      'turbo',
      'run',
      ...new Set(checks.frameworkDeclarations.tasks.map(({ task }) => task)),
      '--concurrency=2'
    ])
  }
  if (
    ['lint', 'repositoryScripts', 'naming'].some(
      (name) => checks[name].mode !== 'not-selected'
    )
  ) {
    const resultPath = path.join(outputDirectory, 'shared.json')
    add(
      'shared',
      process.execPath,
      ['scripts/run-ci-checks.mjs'],
      {
        ...identity,
        CI_SCOPE_EVIDENCE_FILE: path.join(
          outputDirectory,
          'scope-evidence.json'
        ),
        CI_CHECK_RESULTS_FILE: resultPath
      },
      { type: 'shared', path: resultPath }
    )
  }
  for (const workspace of plan.workspaceMatrix) {
    const directory = path.join(outputDirectory, 'workspaces')
    add(
      workspace.name,
      process.execPath,
      ['scripts/run-workspace-checks.mjs'],
      {
        ...identity,
        CI_SCOPE_EVIDENCE_FILE: path.join(
          outputDirectory,
          'scope-evidence.json'
        ),
        CI_WORKSPACE_MATRIX_ITEM: JSON.stringify(workspace),
        WORKSPACE_CHECK_RESULTS_DIRECTORY: directory
      },
      {
        type: 'workspace',
        path: path.join(directory, `${workspace.artifactId}.json`),
        workspace: workspace.name
      }
    )
  }
  if (plan.profileFiles?.length) {
    add('fieldscope-profiles', plan.profileCommand[0], [
      ...plan.profileCommand.slice(1),
      ...plan.profileFiles.flatMap((file) => ['--file', file])
    ])
  }
  if (checks.controlPlane.mode !== 'not-selected') {
    const directory = 'tools/flow-inspector/control-plane/__tests__'
    const files = fs
      .readdirSync(path.join(repositoryRoot, directory))
      .filter((name) => name.endsWith('.test.cjs') && !name.startsWith('board'))
      .sort()
      .map((name) => `${directory}/${name}`)
    if (!files.length) {
      throw new Error('Selected control-plane tests are missing')
    }
    add(
      'control-plane-tests',
      process.execPath,
      ['--test', '--test-concurrency=1', '--test-reporter=tap', ...files],
      {},
      { type: 'tap' }
    )
  }
  for (const { id, command } of plan.e2eSuites) {
    const reportPath = path.join(outputDirectory, `${id}.json`)
    add(
      `e2e-${id}`,
      command.executable,
      command.args,
      {
        ...command.env,
        ...(command.evidence === 'playwright'
          ? { PLAYWRIGHT_JSON_OUTPUT_FILE: reportPath }
          : {})
      },
      { type: command.evidence, path: reportPath }
    )
  }

  return commands
}

function main() {
  const evidenceFile = process.env.CI_SCOPE_EVIDENCE_FILE
  const evidence = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'))
  const keys = ['repository', 'base', 'head', 'integration', 'run', 'attempt']
  if (
    evidence.version !== 2 ||
    keys.some(
      (key) =>
        !process.env[`CI_SCOPE_${key.toUpperCase()}`] ||
        evidence.identity?.[key] !==
          process.env[`CI_SCOPE_${key.toUpperCase()}`]
    ) ||
    evidence.relationshipMapDigest !== process.env.CI_RELATIONSHIP_MAP_DIGEST
  ) {
    throw new Error(
      'Validation evidence does not match the expected execution identity'
    )
  }
  const commands = validationCheckCommands(
    readValidationPlan(evidence),
    path.dirname(evidenceFile),
    process.cwd(),
    evidence.identity
  )
  const [option, id, ...extra] = process.argv.slice(2)
  const command = commands.find((entry) => entry.id === id)
  if (option !== '--check' || extra.length || !command) {
    throw new Error('Choose an admitted validation check with --check <id>')
  }
  execFileSync(command.executable, command.args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...command.env,
      CI_SCOPE_EVIDENCE_FILE: evidenceFile,
      ...(process.env.CI_CHECK_RESULTS_FILE
        ? { CI_CHECK_RESULTS_FILE: process.env.CI_CHECK_RESULTS_FILE }
        : {}),
      ...(process.env.WORKSPACE_CHECK_RESULTS_DIRECTORY
        ? {
            WORKSPACE_CHECK_RESULTS_DIRECTORY:
              process.env.WORKSPACE_CHECK_RESULTS_DIRECTORY
          }
        : {}),
      ...(process.env.CI_WORKSPACE_MATRIX_ITEM
        ? { CI_WORKSPACE_MATRIX_ITEM: process.env.CI_WORKSPACE_MATRIX_ITEM }
        : {})
    }
  })
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
}

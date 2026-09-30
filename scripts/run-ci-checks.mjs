import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { ESLint } from 'eslint'
import scriptSelection from '../tools/flow-inspector/control-plane/ci-script-selection.cjs'

const relationshipPolicy = JSON.parse(
  fs.readFileSync(new URL('./ci-relationships.json', import.meta.url), 'utf8')
)
const registeredTests = new Set(relationshipPolicy.registeredScriptTests)
const serialBuildTests = new Set(
  relationshipPolicy.repositoryScriptGroups.buildExecution.tests
)

const checkNames = ['lint', 'repositoryScripts', 'naming']

function validateExecutionPlan(plan) {
  if (
    !plan ||
    plan.version !== 1 ||
    !['full', 'incremental'].includes(plan.mode) ||
    !Array.isArray(plan.changedPaths) ||
    !Array.isArray(plan.unknownRelations) ||
    !plan.checks ||
    !checkNames.every((name) => plan.checks[name]) ||
    !Array.isArray(plan.checks.workspaces) ||
    !Array.isArray(plan.checks.e2e?.selected) ||
    !Array.isArray(plan.checks.e2e?.notSelected)
  )
    throw new Error('CI execution plan is missing or malformed')
  if (plan.unknownRelations.length)
    throw new Error('CI execution plan contains unknown relationships')
  const lint = plan.checks.lint
  if (
    !['full', 'files', 'not-selected'].includes(lint.mode) ||
    !Array.isArray(lint.inputs)
  )
    throw new Error('CI lint selection is missing or malformed')
  if (
    !scriptSelection.validRepositoryScriptSelection(
      plan.checks.repositoryScripts,
      registeredTests
    )
  )
    throw new Error('CI repository script selection is missing or malformed')
  for (const name of ['naming']) {
    const selection = plan.checks[name]
    if (
      !['full', 'not-selected'].includes(selection.mode) ||
      !Array.isArray(selection.inputs)
    )
      throw new Error(`CI ${name} selection is missing or malformed`)
  }
  if (
    plan.checks.repositoryScripts.command !== 'test:scripts' ||
    plan.checks.naming.command !== 'lint:naming'
  )
    throw new Error('CI script selection names an unsupported command')
  return plan
}

async function resolveLintFiles(selection, repositoryRoot, eslint) {
  if (selection.mode === 'full') return ['.']
  if (selection.mode === 'not-selected') return []
  const selected = []
  for (const relativePath of selection.inputs) {
    const absolutePath = path.resolve(repositoryRoot, relativePath)
    if (!fs.existsSync(absolutePath)) continue
    if (await eslint.isPathIgnored(absolutePath)) continue
    if (await eslint.calculateConfigForFile(absolutePath))
      selected.push(absolutePath)
  }
  return [...new Set(selected)].sort()
}

async function runLint(selection, repositoryRoot) {
  const eslint = new ESLint({ cwd: repositoryRoot })
  const files = await resolveLintFiles(selection, repositoryRoot, eslint)
  if (files.length === 0)
    return {
      status: 'not-selected',
      executedFiles: [],
      reason: 'no-applicable-files'
    }
  const results = await eslint.lintFiles(files)
  const formatter = await eslint.loadFormatter('stylish')
  const output = formatter.format(results)
  if (output) process.stdout.write(output)
  const errors = results.reduce((total, result) => total + result.errorCount, 0)
  return {
    status: errors ? 'failed' : 'passed',
    executedFiles: results.map(({ filePath }) =>
      path.relative(repositoryRoot, filePath).split(path.sep).join('/')
    ),
    errorCount: errors
  }
}

function runYarnScript(script) {
  execFileSync('yarn', [script], { stdio: 'inherit' })
  return { status: 'passed' }
}

function runRepositoryScripts(selection, execute = execFileSync) {
  if (
    !scriptSelection.validRepositoryScriptSelection(selection, registeredTests)
  )
    throw new Error('CI repository script selection is missing or malformed')
  if (selection.mode === 'files') {
    const parallel = selection.tests.filter(
      (file) => !serialBuildTests.has(file)
    )
    const serial = selection.tests.filter((file) => serialBuildTests.has(file))
    if (parallel.length)
      execute(process.execPath, ['--test', ...parallel], { stdio: 'inherit' })
    if (serial.length)
      execute(process.execPath, ['--test', '--test-concurrency=1', ...serial], {
        stdio: 'inherit'
      })
    return { status: 'passed', executedTests: selection.tests }
  }
  execute('yarn', [selection.command], { stdio: 'inherit' })
  return { status: 'passed' }
}

async function executeSelectedChecks(plan, runners) {
  validateExecutionPlan(plan)
  const checks = {}
  for (const name of checkNames) {
    const selection = plan.checks[name]
    if (selection.mode === 'not-selected') {
      checks[name] = {
        status: 'not-selected',
        mode: selection.mode,
        inputs: selection.inputs,
        reason: selection.reason
      }
      continue
    }
    try {
      const outcome = await runners[name](selection)
      checks[name] = {
        status: outcome?.status ?? 'passed',
        mode: selection.mode,
        inputs: selection.inputs,
        ...(outcome ?? {})
      }
    } catch (error) {
      checks[name] = {
        status: 'failed',
        mode: selection.mode,
        inputs: selection.inputs,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
  return {
    version: 1,
    identity: runners.identity ?? {},
    relationshipMapDigest: runners.relationshipMapDigest ?? '',
    executionPlanDigest: crypto
      .createHash('sha256')
      .update(JSON.stringify(plan))
      .digest('hex'),
    checks
  }
}

async function main() {
  const repositoryRoot = process.cwd()
  const plan = JSON.parse(process.env.CI_EXECUTION_PLAN ?? '')
  const identity = {
    repository: process.env.CI_SCOPE_REPOSITORY ?? '',
    base: process.env.CI_SCOPE_BASE ?? '',
    head: process.env.CI_SCOPE_HEAD ?? '',
    integration: process.env.CI_SCOPE_INTEGRATION ?? '',
    run: process.env.CI_SCOPE_RUN ?? '',
    attempt: process.env.CI_SCOPE_ATTEMPT ?? ''
  }
  const relationshipMapDigest = process.env.CI_RELATIONSHIP_MAP_DIGEST ?? ''
  if (
    Object.values(identity).some((value) => !value) ||
    !/^[a-f0-9]{64}$/.test(relationshipMapDigest)
  )
    throw new Error('CI check execution identity is incomplete')

  const result = await executeSelectedChecks(plan, {
    identity,
    relationshipMapDigest,
    lint: (selection) => runLint(selection, repositoryRoot),
    repositoryScripts: (selection) => runRepositoryScripts(selection),
    naming: (selection) => runYarnScript(selection.command)
  })
  result.identity = identity
  result.relationshipMapDigest = relationshipMapDigest
  const serialized = JSON.stringify(result)
  if (process.env.CI_CHECK_RESULTS_FILE)
    fs.writeFileSync(process.env.CI_CHECK_RESULTS_FILE, `${serialized}\n`)
  else if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `result=${serialized}\n`)
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        '## Selected CI checks',
        '',
        '| Check | Status | Mode | Reason |',
        '| --- | --- | --- | --- |',
        ...Object.entries(result.checks).map(
          ([name, check]) =>
            `| ${name} | ${check.status} | ${check.mode} | ${check.reason ?? ''} |`
        ),
        ''
      ].join('\n')
    )
  console.log(serialized)
  if (Object.values(result.checks).some(({ status }) => status === 'failed'))
    process.exitCode = 1
}

export {
  executeSelectedChecks,
  resolveLintFiles,
  validateExecutionPlan,
  runRepositoryScripts
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
)
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })

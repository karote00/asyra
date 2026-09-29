import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { ESLint } from 'eslint'

const workspaceNamePattern = /^(?:@[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9-]*$/
const workspaceDirectoryPattern =
  /^(?:apps|packages|tools)\/[a-z0-9][a-z0-9-]*$/

function validateWorkspaceEntry(workspace) {
  if (
    !workspace ||
    !workspaceNamePattern.test(workspace.name ?? '') ||
    !workspaceDirectoryPattern.test(workspace.directory ?? '') ||
    !/^[a-z0-9]+$/.test(workspace.artifactId ?? '') ||
    !/^build(?::[a-z0-9-]+)?$|^react:build$/.test(workspace.buildTask ?? '') ||
    !['lint', 'eslint'].includes(workspace.lintTask) ||
    !['full', 'not-selected'].includes(workspace.lintSelection?.mode) ||
    typeof workspace.lintSelection?.reason !== 'string' ||
    !Array.isArray(workspace.lintSelection?.inputs) ||
    workspace.testTask !== 'test:ci' ||
    !['full', 'related', 'not-selected'].includes(
      workspace.testSelection?.mode
    ) ||
    typeof workspace.testSelection?.reason !== 'string' ||
    !Array.isArray(workspace.testSelection?.inputs) ||
    (workspace.testSelection.mode === 'related' &&
      (workspace.testSelection.inputs.length === 0 ||
        workspace.testSelection.runner?.command !== 'vitest' ||
        !Array.isArray(workspace.testSelection.runner.args))) ||
    (workspace.e2eTask !== null &&
      workspace.e2eTask !== undefined &&
      workspace.e2eTask !== 'test:e2e:ci') ||
    !['full', 'related', 'not-selected'].includes(
      workspace.e2eSelection?.mode
    ) ||
    ![null, 'has:test'].includes(workspace.hasTestTask ?? null) ||
    typeof workspace.e2eSelection?.reason !== 'string' ||
    !Array.isArray(workspace.e2eSelection?.inputs) ||
    (workspace.e2eTask &&
      workspace.e2eSelection.mode !== 'not-selected' &&
      workspace.e2eSelection.mode === 'related' &&
      (workspace.e2eSelection.inputs.length === 0 ||
        workspace.e2eSelection.runner?.command !== 'playwright')) ||
    (!workspace.e2eTask && workspace.e2eSelection.mode !== 'not-selected')
  )
    throw new Error('Invalid workspace matrix entry')
  const expectedArtifactId = crypto
    .createHash('sha256')
    .update(workspace.name)
    .digest('hex')
    .slice(0, 16)
  if (workspace.artifactId !== expectedArtifactId)
    throw new Error(
      'Workspace matrix artifact identity does not match its name'
    )
  return workspace
}

function runtimeIdentity(environment) {
  return {
    repository: environment.CI_SCOPE_REPOSITORY ?? '',
    base: environment.CI_SCOPE_BASE ?? '',
    head: environment.CI_SCOPE_HEAD ?? '',
    integration: environment.CI_SCOPE_INTEGRATION ?? '',
    run: environment.CI_SCOPE_RUN ?? '',
    attempt: environment.CI_SCOPE_ATTEMPT ?? ''
  }
}

async function executeWorkspaceChecks(
  workspace,
  { identity, relationshipMapDigest, runTask }
) {
  validateWorkspaceEntry(workspace)
  if (typeof runTask !== 'function')
    throw new Error('Workspace task runner is required')
  const record = {
    version: 1,
    identity,
    relationshipMapDigest,
    workspace: workspace.name,
    directory: workspace.directory,
    lintTask: workspace.lintTask,
    lintSelection: workspace.lintSelection,
    buildTask: workspace.buildTask,
    testTask: workspace.testTask,
    hasTestTask: workspace.hasTestTask ?? null,
    testSelection: workspace.testSelection,
    buildStatus: 'pending',
    testStatus: 'pending',
    e2eTask: workspace.e2eTask ?? null,
    e2eSelection: workspace.e2eSelection,
    e2eStatus: 'pending',
    taskSequence: [],
    status: 'pending'
  }
  try {
    if (workspace.lintSelection.mode === 'not-selected') {
      record.lintStatus = 'not-selected'
    } else {
      record.taskSequence.push(workspace.lintTask)
      record.lintResult = await runTask(
        workspace.name,
        workspace.lintTask,
        workspace.lintSelection
      )
      record.lintStatus = 'success'
    }
  } catch {
    record.lintStatus = 'failure'
    record.buildStatus = 'skipped'
    record.testStatus = 'skipped'
    record.e2eStatus = 'skipped'
    record.status = 'failed'
    return record
  }
  try {
    record.taskSequence.push(workspace.buildTask)
    await runTask(workspace.name, workspace.buildTask)
    record.buildStatus = 'success'
  } catch {
    record.buildStatus = 'failure'
    record.testStatus = 'skipped'
    record.e2eStatus = 'skipped'
    record.status = 'failed'
    return record
  }
  try {
    if (workspace.testSelection.mode === 'not-selected') {
      record.testStatus = 'not-selected'
    } else {
      if (workspace.hasTestTask === 'has:test') {
        record.taskSequence.push('has:test')
        try {
          await runTask(workspace.name, 'has:test')
        } catch {
          record.testStatus = 'zero-tests'
          record.testResult = { status: 'zero-tests' }
          record.e2eStatus = 'skipped'
          record.status = 'failed'
          return record
        }
      }
      record.taskSequence.push(workspace.testTask)
      record.testResult = await runTask(
        workspace.name,
        workspace.testTask,
        workspace.testSelection
      )
      record.testStatus = 'success'
    }
  } catch {
    record.testStatus = 'failure'
    record.status = 'failed'
    record.e2eStatus = 'skipped'
    return record
  }
  try {
    if (workspace.e2eSelection.mode === 'not-selected') {
      record.e2eStatus = 'not-selected'
    } else {
      if (!workspace.e2eTask) throw new Error('Selected E2E task is missing')
      record.taskSequence.push(workspace.e2eTask)
      const result = await runTask(
        workspace.name,
        workspace.e2eTask,
        workspace.e2eSelection,
        { identity, artifactId: workspace.artifactId }
      )
      record.e2eResult = result
      record.e2eStatus = result?.testCount > 0 ? 'passed' : 'zero-tests'
      if (record.e2eStatus === 'zero-tests') record.status = 'failed'
    }
    if (record.status === 'pending') record.status = 'success'
  } catch {
    record.e2eStatus = 'failure'
    record.status = 'failed'
  }
  return record
}

function writeWorkspaceResult(record, artifactId, repositoryRoot) {
  const directory = path.join(repositoryRoot, '.ci-workspace-results')
  fs.mkdirSync(directory, { recursive: true })
  const destination = path.join(directory, `${artifactId}.json`)
  fs.writeFileSync(destination, JSON.stringify(record) + '\n')
  return destination
}

async function main() {
  const workspace = validateWorkspaceEntry(
    JSON.parse(process.env.CI_WORKSPACE_MATRIX_ITEM ?? '')
  )
  const relationshipMapDigest = process.env.CI_RELATIONSHIP_MAP_DIGEST ?? ''
  if (!/^[a-f0-9]{64}$/.test(relationshipMapDigest))
    throw new Error('Workspace relationship map digest is unavailable')
  const identity = runtimeIdentity(process.env)
  if (
    Object.values(identity).some((value) => !value) ||
    !['base', 'head', 'integration'].every((key) =>
      /^[a-f0-9]{40}$/.test(identity[key])
    )
  )
    throw new Error('Workspace validation identity is incomplete')
  const repositoryRoot = process.cwd()
  const record = await executeWorkspaceChecks(workspace, {
    identity,
    relationshipMapDigest,
    runTask: async (name, task, selection, e2eContext) => {
      if (task === 'eslint') {
        const eslint = new ESLint({ cwd: repositoryRoot })
        const results = await eslint.lintFiles(workspace.directory)
        const output = (await eslint.loadFormatter('stylish')).format(results)
        if (output) process.stdout.write(output)
        if (results.some(({ errorCount }) => errorCount > 0))
          throw new Error('Workspace lint failed')
        return {
          mode: 'full',
          executedFiles: results.map(({ filePath }) =>
            path.relative(repositoryRoot, filePath).split(path.sep).join('/')
          )
        }
      }
      if (task === 'lint') {
        execFileSync('yarn', ['workspace', name, 'lint'], {
          cwd: repositoryRoot,
          stdio: 'inherit'
        })
        return { mode: 'full' }
      }
      if (task === 'has:test') {
        execFileSync('yarn', ['workspace', name, 'has:test'], {
          cwd: repositoryRoot,
          stdio: 'ignore'
        })
        return { mode: 'preflight' }
      }
      if (task === 'test:ci' && selection.mode === 'related') {
        const files = selection.inputs.map((file) =>
          path.resolve(repositoryRoot, file)
        )
        execFileSync(
          'yarn',
          [
            'workspace',
            name,
            'vitest',
            'related',
            '--run',
            ...selection.runner.args,
            '--passWithNoTests=false',
            ...files
          ],
          { cwd: repositoryRoot, stdio: 'inherit' }
        )
        return { mode: 'related', inputs: selection.inputs }
      }
      if (task === 'test:e2e:ci') {
        const resultDirectory = path.join(
          repositoryRoot,
          '.ci-workspace-results'
        )
        fs.mkdirSync(resultDirectory, { recursive: true })
        const reportPath = path.join(
          resultDirectory,
          `${e2eContext.artifactId}.playwright.json`
        )
        let reportReadSuccessfully = false
        try {
          execFileSync(
            'yarn',
            [
              'workspace',
              name,
              task,
              ...(selection.mode === 'related' ? selection.inputs : [])
            ],
            {
              cwd: repositoryRoot,
              stdio: 'inherit',
              env: {
                ...process.env,
                PLAYWRIGHT_JSON_OUTPUT_FILE: reportPath
              }
            }
          )
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
          reportReadSuccessfully = true
          const observations = playwrightObservations(report)
          const digest = crypto
            .createHash('sha256')
            .update(JSON.stringify(report))
            .digest('hex')
          return {
            mode: selection.mode,
            inputs: selection.inputs,
            reportDigest: digest,
            testCount: observations.testCount,
            passedCount: observations.passedCount,
            failedCount: observations.failedCount
          }
        } finally {
          if (reportReadSuccessfully) fs.rmSync(reportPath, { force: true })
          else
            console.error(`Preserving failed Playwright report: ${reportPath}`)
        }
      }
      execFileSync(
        'yarn',
        ['turbo', 'run', task, `--filter=${name}`, '--concurrency=2'],
        { cwd: repositoryRoot, stdio: 'inherit' }
      )
      return { mode: 'full' }
    }
  })
  writeWorkspaceResult(record, workspace.artifactId, repositoryRoot)
  console.log(JSON.stringify(record))
  if (record.status !== 'success') process.exitCode = 1
}

function playwrightObservations(report) {
  let testCount = 0
  let passedCount = 0
  let failedCount = 0
  const visit = (suites) => {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? [])
        for (const test of spec.tests ?? [])
          for (const result of test.results ?? []) {
            if (result.status === 'passed') {
              testCount++
              passedCount++
            } else if (['failed', 'timedOut'].includes(result.status)) {
              testCount++
              failedCount++
            }
          }
      visit(suite.suites)
    }
  }
  visit(report?.suites)
  if (report?.errors?.length) failedCount += report.errors.length
  return { testCount, passedCount, failedCount }
}

export { executeWorkspaceChecks, validateWorkspaceEntry }

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
)
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })

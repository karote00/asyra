import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

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
    workspace.testTask !== 'test:ci'
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
    buildTask: workspace.buildTask,
    testTask: workspace.testTask,
    buildStatus: 'pending',
    testStatus: 'pending',
    taskSequence: [],
    status: 'pending'
  }
  try {
    record.taskSequence.push(workspace.buildTask)
    await runTask(workspace.name, workspace.buildTask)
    record.buildStatus = 'success'
  } catch {
    record.buildStatus = 'failure'
    record.testStatus = 'skipped'
    record.status = 'failed'
    return record
  }
  try {
    record.taskSequence.push(workspace.testTask)
    await runTask(workspace.name, workspace.testTask)
    record.testStatus = 'success'
    record.status = 'success'
  } catch {
    record.testStatus = 'failure'
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
    runTask: (name, task) =>
      execFileSync(
        'yarn',
        ['turbo', 'run', task, `--filter=${name}`, '--concurrency=2'],
        { cwd: repositoryRoot, stdio: 'inherit' }
      )
  })
  writeWorkspaceResult(record, workspace.artifactId, repositoryRoot)
  console.log(JSON.stringify(record))
  if (record.status !== 'success') process.exitCode = 1
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

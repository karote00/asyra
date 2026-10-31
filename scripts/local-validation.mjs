import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { runLocalChecks } from './local-validation-runner.mjs'
import {
  readValidationPlan,
  validationCheckCommands
} from './validation-checks.mjs'
import {
  classifyChanges,
  readWorkspaceManifests,
  readWorkspaceManifestsAtCommit,
  readCreateAppManifests,
  readCreateAppManifestsAtCommit,
  readDocumentationDirectories,
  readDocumentationDirectoriesAtCommit
} from './ci-scope.mjs'

const fingerprint = (value) => createHash('sha256').update(value).digest('hex')

function readGit(repositoryRoot, args) {
  try {
    return execFileSync('git', args, {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024
    })
  } catch {
    throw new Error(`Git input could not be resolved: ${args[0]}`)
  }
}

function fileFingerprint(repositoryRoot, relativePath) {
  const absolutePath = path.resolve(repositoryRoot, relativePath)
  if (!absolutePath.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new Error('Git input escapes the repository')
  }
  let stat
  try {
    stat = fs.lstatSync(absolutePath)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
    return { path: relativePath, kind: 'missing' }
  }
  const mode = stat.mode & 0o777
  if (stat.isSymbolicLink()) {
    return {
      path: relativePath,
      kind: 'symlink',
      mode,
      digest: fingerprint(fs.readlinkSync(absolutePath))
    }
  }
  if (!stat.isFile()) {
    throw new Error(`Unsupported local input kind: ${relativePath}`)
  }
  return {
    path: relativePath,
    kind: 'file',
    mode,
    digest: fingerprint(fs.readFileSync(absolutePath))
  }
}

export function collectLocalInputs({
  repositoryRoot = process.cwd(),
  base
} = {}) {
  repositoryRoot = path.resolve(repositoryRoot)
  const git = (...args) => readGit(repositoryRoot, args)
  const headRevision = git('rev-parse', '--verify', 'HEAD^{commit}').trim()
  const baseRevision = base
    ? git(
        'rev-parse',
        '--verify',
        '--end-of-options',
        `${base}^{commit}`
      ).trim()
    : git('merge-base', headRevision, 'refs/remotes/origin/main').trim()
  const sources = [
    git(
      'diff',
      '--name-only',
      '-z',
      '--no-renames',
      baseRevision,
      headRevision,
      '--'
    ),
    git('diff', '--cached', '--name-only', '-z', '--no-renames', '--'),
    git('diff', '--name-only', '-z', '--no-renames', '--'),
    git('ls-files', '--others', '--exclude-standard', '-z')
  ]
  const changedPaths = [
    ...new Set(sources.flatMap((source) => source.split('\0').filter(Boolean)))
  ].sort()
  const files = changedPaths.map((name) =>
    fileFingerprint(repositoryRoot, name)
  )
  // Index contents can change while the working files and path set stay equal.
  const indexDigest = fingerprint(git('ls-files', '--stage', '-z'))
  const inputs = {
    baseRevision,
    headRevision,
    indexDigest,
    changedPaths,
    files
  }
  return { ...inputs, identity: fingerprint(JSON.stringify(inputs)) }
}

export function selectLocalValidation({
  repositoryRoot = process.cwd(),
  inputs,
  full = false
}) {
  const scope = classifyChanges(
    inputs.changedPaths,
    readWorkspaceManifests(repositoryRoot),
    readWorkspaceManifestsAtCommit(inputs.baseRevision, repositoryRoot),
    readCreateAppManifests(repositoryRoot),
    readCreateAppManifestsAtCommit(inputs.baseRevision, repositoryRoot),
    readDocumentationDirectories(repositoryRoot),
    readDocumentationDirectoriesAtCommit(inputs.baseRevision, repositoryRoot),
    { fullValidation: full, baseRevision: inputs.baseRevision, repositoryRoot }
  )
  const selected = readValidationPlan(scope)
  return {
    ...selected,
    version: 1,
    authority: 'local',
    inputs,
    e2eOwners: selected.workspaceMatrix.map(
      ({ name, e2eTask, e2eSelection }) => ({
        workspace: name,
        status: e2eTask ? e2eSelection.mode : 'not-defined'
      })
    )
  }
}

function localExecutionIdentity(plan, outputDirectory) {
  return {
    repository: 'local',
    base: plan.inputs.baseRevision,
    head: plan.inputs.headRevision,
    integration: plan.inputs.headRevision,
    run: path.basename(outputDirectory),
    attempt: '1'
  }
}

export function writeLocalValidationEvidence(plan, commands, outputDirectory) {
  fs.mkdirSync(outputDirectory, { recursive: true, mode: 0o700 })
  fs.writeFileSync(
    path.join(outputDirectory, 'plan.json'),
    JSON.stringify({ ...plan, commands }, null, 2) + '\n',
    { mode: 0o600 }
  )
  fs.writeFileSync(
    path.join(outputDirectory, 'scope-evidence.json'),
    JSON.stringify(
      {
        version: 2,
        identity: localExecutionIdentity(plan, outputDirectory),
        relationshipMapDigest: plan.relationshipMapDigest,
        relationshipMap: plan.relationshipMap,
        executionPlan: plan.executionPlan
      },
      null,
      2
    ) + '\n',
    { mode: 0o600 }
  )
}

export function localCheckCommands(
  plan,
  outputDirectory,
  repositoryRoot = process.cwd()
) {
  return validationCheckCommands(
    plan,
    outputDirectory,
    repositoryRoot,
    localExecutionIdentity(plan, outputDirectory)
  )
}

async function main() {
  const options = { run: false, full: false, json: false, base: undefined }
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index++) {
    const argument = args[index]
    if (argument === '--help') {
      console.log(
        'yarn validate:local [--base <ref>] [--full] [--json] [--run]\nPreview local affected checks; --run executes them and records evidence under tmp/local-validation/.'
      )
      return
    }
    if (['--run', '--full', '--json'].includes(argument)) {
      options[argument.slice(2)] = true
    } else if (
      argument === '--base' &&
      args[index + 1] &&
      !args[index + 1].startsWith('--')
    ) {
      options.base = args[++index]
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`)
    }
  }
  const repositoryRoot = process.cwd()
  const inputs = collectLocalInputs({ repositoryRoot, base: options.base })
  const plan = selectLocalValidation({
    repositoryRoot,
    inputs,
    full: options.full
  })
  const outputDirectory = path.join(
    repositoryRoot,
    'tmp/local-validation',
    randomUUID()
  )
  const commands = localCheckCommands(plan, outputDirectory, repositoryRoot)
  if (options.json) {
    console.log(JSON.stringify({ ...plan, commands }, null, 2))
  } else {
    console.log(
      `Local validation - ${inputs.changedPaths.length} changed paths, ${plan.workspaceMatrix.length} workspaces, ${commands.length} checks`
    )
    for (const command of commands) {
      console.log(
        `  ${command.id}: ${command.executable} ${command.args.join(' ')}`
      )
    }
    for (const owner of plan.e2eOwners) {
      console.log(`  ${owner.workspace} E2E: ${owner.status}`)
    }
    console.log(
      'Local lint/tests/E2E only; remote CI, release and publication evidence remain separate.'
    )
  }
  if (!options.run) {
    return
  }
  writeLocalValidationEvidence(plan, commands, outputDirectory)
  const controller = new globalThis.AbortController()
  const cancel = () => controller.abort()
  process.on('SIGINT', cancel)
  process.on('SIGTERM', cancel)
  let result
  try {
    result = await runLocalChecks({
      repositoryRoot,
      outputDirectory,
      commands,
      signal: controller.signal,
      onProgress: (message) => console.log(message),
      verifyInputs: () =>
        collectLocalInputs({ repositoryRoot, base: inputs.baseRevision })
          .identity === inputs.identity
    })
  } finally {
    process.off('SIGINT', cancel)
    process.off('SIGTERM', cancel)
  }
  console.log(`Local validation ${result.status}. Evidence: ${outputDirectory}`)
  if (result.status !== 'passed') {
    process.exitCode = result.status === 'cancelled' ? 130 : 1
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}

#!/usr/bin/env node

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createReleaseValidationWorkspace,
  removeReleaseValidationWorkspace
} from './release-validation-workspace.js'
import {
  createReleaseValidationBaseEnvironment,
  createReleaseValidationEnvironment
} from './release-validation-environment.js'
import { FRAMEWORK_VALIDATION_POINTER } from './framework-release-artifacts.js'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const validationParent = path.join(repositoryRoot, 'tmp')

const args = process.argv.slice(2)
let appName
let frameworkOnly = false
let printPlan = false
let preserveWorkspace = false

for (const arg of args) {
  if (arg.startsWith('--prod=')) appName = arg.split('=')[1]
  else if (arg === '--framework') frameworkOnly = true
  else if (arg === '--preserve') preserveWorkspace = true
  else if (arg === '--plan') printPlan = true
  else {
    console.error(`Unknown argument: ${arg}`)
    process.exit(1)
  }
}

if (Boolean(appName) === frameworkOnly) {
  console.error('Specify exactly one of --framework or --prod=<app-name>')
  process.exit(1)
}

if (preserveWorkspace && !frameworkOnly) {
  console.error('--preserve is available only with --framework')
  process.exit(1)
}

if (appName && !/^[a-z0-9][a-z0-9-]*$/.test(appName)) {
  console.error(`Invalid app name: ${appName}`)
  process.exit(1)
}

const commands = [
  'yarn install --immutable',
  'yarn security:audit',
  'yarn gen:turbo:check',
  'yarn clean',
  'yarn react:build',
  'yarn lint:ci',
  'yarn test:ci',
  'yarn deps:validate',
  ...(!frameworkOnly
    ? [
        'yarn workspace @asyra/asyra-design test:e2e:collaboration',
        `yarn release:app:check --prod=${appName}`,
        `yarn release:app:build --prod=${appName} --prebuilt`
      ]
    : [])
]
const collaborationValidationCommand =
  'yarn workspace @asyra/asyra-design test:e2e:collaboration'

if (printPlan) {
  process.stdout.write(`${JSON.stringify(commands, null, 2)}\n`)
  process.exit(0)
}

const findAvailablePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Unable to allocate release validation port'))
        return
      }

      const { port } = address
      server.close((error) => {
        if (error) reject(error)
        else resolve(port)
      })
    })
  })

let validationRoot
let keepValidationWorkspace = false
const cleanup = () => {
  if (!validationRoot || keepValidationWorkspace) return
  removeReleaseValidationWorkspace(validationRoot, validationParent)
  validationRoot = undefined
}

process.once('exit', cleanup)
for (const [signal, exitCode] of [
  ['SIGINT', 130],
  ['SIGTERM', 143]
]) {
  process.once(signal, () => {
    cleanup()
    process.exit(exitCode)
  })
}

try {
  const validationPointerPath = path.join(
    repositoryRoot,
    FRAMEWORK_VALIDATION_POINTER
  )
  let sourceCommitSha
  if (preserveWorkspace) {
    const sourceChanges = execSync(
      'git status --porcelain --untracked-files=all',
      {
        cwd: repositoryRoot,
        encoding: 'utf8'
      }
    ).trim()
    if (sourceChanges) {
      throw new Error(
        'Preserved Framework validation requires a clean source checkout'
      )
    }
    if (fs.existsSync(validationPointerPath)) {
      throw new Error(
        `Framework validation handoff already exists: ${FRAMEWORK_VALIDATION_POINTER}`
      )
    }
    sourceCommitSha = execSync('git rev-parse HEAD', {
      cwd: repositoryRoot,
      encoding: 'utf8'
    }).trim()
  }
  validationRoot = createReleaseValidationWorkspace({
    sourceRoot: repositoryRoot,
    validationParent
  })
  const appPort = await findAvailablePort()
  const collaborationPort = await findAvailablePort()
  const validationEnvironment = createReleaseValidationEnvironment({
    appPort,
    collaborationPort
  })
  const baseValidationEnvironment = createReleaseValidationBaseEnvironment()

  console.log(`Release validation workspace: ${validationRoot}`)
  for (const command of commands) {
    console.log(`\n> ${command}`)
    execSync(command, {
      cwd: validationRoot,
      env:
        command === collaborationValidationCommand
          ? validationEnvironment
          : baseValidationEnvironment,
      stdio: 'inherit'
    })
  }

  if (preserveWorkspace) {
    fs.writeFileSync(
      validationPointerPath,
      `${JSON.stringify(
        { validationRoot, sourceCommitSha, status: 'PASS' },
        null,
        2
      )}\n`
    )
    keepValidationWorkspace = true
    console.log(`Preserved Framework validation workspace: ${validationRoot}`)
  }

  console.log('\nRelease validation passed')
} finally {
  cleanup()
}

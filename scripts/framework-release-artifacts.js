#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_RELEASE_ARTIFACT_DIRECTORY,
  validateFrameworkReleasePackageArtifacts
} from './release-package-artifacts.js'

export const FRAMEWORK_VALIDATION_POINTER =
  'tmp/framework-release-validation.json'
export const FRAMEWORK_ARTIFACT_HANDOFF = 'framework-release-handoff.json'

const expectedConsumerPhases = ['install', 'typecheck', 'build', 'test']

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const sha512Integrity = (filePath) =>
  `sha512-${createHash('sha512').update(fs.readFileSync(filePath)).digest('base64')}`

const validatePackageEvidence = (packages, consumerEvidence) => {
  if (
    consumerEvidence?.status !== 'READY' ||
    !Array.isArray(consumerEvidence.phases) ||
    expectedConsumerPhases.some(
      (phase) => !consumerEvidence.phases.includes(phase)
    )
  ) {
    throw new Error('Framework packed consumer gate did not pass')
  }
  const actualIntegrity = Object.fromEntries(
    packages.map(({ name, integrity }) => [name, integrity])
  )
  if (
    JSON.stringify(actualIntegrity) !==
    JSON.stringify(consumerEvidence.artifactIntegrities)
  ) {
    throw new Error(
      'Framework packed consumer evidence does not match the packed artifacts'
    )
  }
}

const normalizeArtifactPackages = (packages) => {
  const seen = new Set()
  return packages.map((record) => {
    const name = record.packageName ?? record.name
    if (typeof name !== 'string' || !name.startsWith('@asyra/')) {
      throw new Error('Framework artifact package identity is invalid')
    }
    if (seen.has(name)) {
      throw new Error(`Duplicate Framework artifact ${name}`)
    }
    seen.add(name)
    return {
      name,
      version: record.version,
      tarball: path.basename(record.tarballPath),
      integrity: sha512Integrity(record.tarballPath)
    }
  })
}

export const createFrameworkReleaseArtifactManifest = ({
  sourceCommitSha,
  packages,
  consumerEvidence
}) => {
  if (!/^[a-f0-9]{40}$/u.test(sourceCommitSha ?? '')) {
    throw new Error('Framework artifact source commit is invalid')
  }
  if (!Array.isArray(packages) || packages.length === 0) {
    throw new Error('Framework artifact set is empty')
  }
  const normalizedPackages = normalizeArtifactPackages(packages)
  validatePackageEvidence(normalizedPackages, consumerEvidence)
  return {
    schemaVersion: 1,
    status: 'READY',
    sourceCommitSha,
    packages: normalizedPackages,
    consumer: {
      status: consumerEvidence.status,
      phases: [...consumerEvidence.phases],
      artifactIntegrities: consumerEvidence.artifactIntegrities
    }
  }
}

export const validateFrameworkReleaseArtifactManifest = ({
  manifest,
  currentCommitSha,
  packages,
  consumerEvidence
}) => {
  if (
    manifest?.schemaVersion !== 1 ||
    manifest.status !== 'READY' ||
    manifest.sourceCommitSha !== currentCommitSha
  ) {
    throw new Error(
      'Framework artifact source commit changed or handoff is invalid'
    )
  }
  const handoffPackages = manifest.packages ?? []
  if (handoffPackages.length !== packages.length) {
    throw new Error('Framework artifact set changed after validation')
  }
  for (const [index, record] of packages.entries()) {
    const name = record.packageName ?? record.name
    const prior = handoffPackages[index]
    if (
      prior?.name !== name ||
      prior.version !== record.version ||
      prior.tarball !== path.basename(record.tarballPath)
    ) {
      throw new Error('Framework artifact set changed after validation')
    }
    if (prior.integrity !== sha512Integrity(record.tarballPath)) {
      throw new Error(`Framework artifact integrity changed for ${name}`)
    }
  }
  const currentManifest = createFrameworkReleaseArtifactManifest({
    sourceCommitSha: currentCommitSha,
    packages,
    consumerEvidence
  })
  for (const [index, artifact] of currentManifest.packages.entries()) {
    if (JSON.stringify(manifest.packages[index]) !== JSON.stringify(artifact)) {
      throw new Error(
        `Framework artifact integrity changed for ${artifact.name}`
      )
    }
  }
  if (
    JSON.stringify(manifest.consumer) !==
    JSON.stringify(currentManifest.consumer)
  ) {
    throw new Error(
      'Framework packed consumer evidence changed after validation'
    )
  }
  return currentManifest
}

const run = (command, cwd) => {
  console.log(`\n> ${command}`)
  execSync(command, { cwd, stdio: 'inherit' })
}

const resolveValidationWorkspace = (repositoryRoot) => {
  const pointerPath = path.join(repositoryRoot, FRAMEWORK_VALIDATION_POINTER)
  const pointer = readJson(pointerPath)
  const validationRoot = path.resolve(pointer.validationRoot)
  const temporaryRoot = path.join(repositoryRoot, 'tmp')
  if (
    path.dirname(validationRoot) !== temporaryRoot ||
    !path.basename(validationRoot).startsWith('release-validation-')
  ) {
    throw new Error(
      'Framework validation workspace pointer is outside project tmp'
    )
  }
  return { pointer, pointerPath, validationRoot }
}

const prepareArtifacts = (repositoryRoot) => {
  const { pointer, validationRoot } = resolveValidationWorkspace(repositoryRoot)
  const sourceCommitSha = execSync('git rev-parse HEAD', {
    cwd: repositoryRoot,
    encoding: 'utf8'
  }).trim()
  if (sourceCommitSha !== pointer.sourceCommitSha) {
    throw new Error('Source commit changed after Framework validation')
  }

  run('yarn bump:workspace --env=release', validationRoot)
  run('yarn release:ranges:check', validationRoot)
  run(
    `yarn release:packages --prebuilt --out=${DEFAULT_RELEASE_ARTIFACT_DIRECTORY}`,
    validationRoot
  )
  run('yarn release:consumer', validationRoot)

  const artifactDirectory = path.join(
    validationRoot,
    DEFAULT_RELEASE_ARTIFACT_DIRECTORY
  )
  const validated = validateFrameworkReleasePackageArtifacts({
    repositoryRoot: validationRoot,
    artifactDirectory: DEFAULT_RELEASE_ARTIFACT_DIRECTORY
  })
  const consumerEvidence = readJson(
    path.join(
      validationRoot,
      'tmp/framework-release-evidence/clean-consumer.json'
    )
  )
  const manifest = createFrameworkReleaseArtifactManifest({
    sourceCommitSha,
    packages: validated.packages,
    consumerEvidence
  })
  fs.writeFileSync(
    path.join(artifactDirectory, FRAMEWORK_ARTIFACT_HANDOFF),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
  process.stdout.write(
    `Framework artifact handoff READY: ${manifest.packages.length} packed packages from ${sourceCommitSha}\n`
  )
}

const cleanupArtifacts = (repositoryRoot) => {
  const { pointerPath, validationRoot } =
    resolveValidationWorkspace(repositoryRoot)
  fs.rmSync(validationRoot, { recursive: true, force: true })
  fs.rmSync(pointerPath, { force: true })
  process.stdout.write('Framework release validation workspace cleaned\n')
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
  )
  const args = process.argv.slice(2)
  if (
    args.length !== 1 ||
    !['--prepare', '--cleanup', '--plan'].includes(args[0])
  ) {
    throw new Error('Specify exactly one of --prepare, --cleanup, or --plan')
  }
  if (args[0] === '--plan') {
    process.stdout.write(
      `${JSON.stringify(
        [
          'yarn bump:workspace --env=release',
          'yarn release:ranges:check',
          `yarn release:packages --prebuilt --out=${DEFAULT_RELEASE_ARTIFACT_DIRECTORY}`,
          'yarn release:consumer'
        ],
        null,
        2
      )}\n`
    )
  } else if (args[0] === '--prepare') {
    prepareArtifacts(repositoryRoot)
  } else {
    cleanupArtifacts(repositoryRoot)
  }
}

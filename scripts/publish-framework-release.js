#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  FRAMEWORK_RELEASE_PACKAGE_NAMES,
  readFrameworkReleaseSource
} from './framework-release-packages.js'
import {
  FRAMEWORK_ARTIFACT_HANDOFF,
  FRAMEWORK_VALIDATION_POINTER,
  validateFrameworkReleaseArtifactManifest
} from './framework-release-artifacts.js'
import {
  DEFAULT_RELEASE_ARTIFACT_DIRECTORY,
  packageArtifactIntegrity,
  validateFrameworkReleasePackageArtifacts
} from './release-package-artifacts.js'

const runCommandDefault = (command, args, { cwd, encoding = 'utf8' } = {}) =>
  execFileSync(command, args, { cwd, encoding, stdio: 'pipe' })

export const createFrameworkPublishOrder = ({ packages }) => {
  const byName = new Map(packages.map((record) => [record.name, record]))
  const ordered = []
  const visiting = new Set()
  const visited = new Set()
  const visit = (record) => {
    if (visited.has(record.name)) return
    if (visiting.has(record.name)) {
      throw new Error(`Framework release dependency cycle at ${record.name}`)
    }
    visiting.add(record.name)
    const dependencyNames = new Set([
      ...Object.keys(record.dependencies ?? {}),
      ...Object.keys(record.peerDependencies ?? {})
    ])
    for (const dependencyName of dependencyNames) {
      const dependency = byName.get(dependencyName)
      if (dependency) visit(dependency)
    }
    visiting.delete(record.name)
    visited.add(record.name)
    ordered.push(record)
  }
  packages.forEach(visit)
  return ordered
}

const isNotFound = (error) => {
  const errorText = `${error?.stderr ?? ''}\n${error?.message ?? ''}`
  return error?.code === 'E404' || /\bE404\b/u.test(errorText)
}

const assertPackageSet = (packages, allowedPackageNames) => {
  const names = packages.map(({ name }) => name)
  const duplicateNames = names.filter(
    (name, index) => names.indexOf(name) !== index
  )
  if (duplicateNames.length) {
    throw new Error(`Duplicate Framework release package: ${duplicateNames[0]}`)
  }
  const unexpected = names.filter((name) => !allowedPackageNames.includes(name))
  if (unexpected.length) {
    throw new Error(`${unexpected[0]} is outside the Framework allowlist`)
  }
  const missing = allowedPackageNames.filter((name) => !names.includes(name))
  if (missing.length) {
    throw new Error(
      `Framework release package set is incomplete: ${missing.join(', ')}`
    )
  }
}

export const publishFrameworkReleasePackages = ({
  repositoryRoot,
  sourceCommitSha,
  packages,
  artifacts,
  allowedPackageNames = FRAMEWORK_RELEASE_PACKAGE_NAMES,
  validateArtifacts,
  runCommand = runCommandDefault
}) => {
  const resolvedRoot = path.resolve(repositoryRoot)
  if (!/^[a-f0-9]{40}$/u.test(sourceCommitSha ?? '')) {
    throw new Error('Framework release source commit is invalid')
  }
  assertPackageSet(packages, allowedPackageNames)
  if (validateArtifacts) validateArtifacts()

  const artifactByName = new Map(
    artifacts.map((artifact) => [artifact.name, artifact])
  )
  if (artifactByName.size !== packages.length) {
    throw new Error(
      'Framework release artifact set does not match the package set'
    )
  }
  const releasePackages = packages.map((pkg) => {
    const artifact = artifactByName.get(pkg.name)
    if (
      !artifact ||
      artifact.version !== pkg.version ||
      !fs.existsSync(artifact.tarballPath) ||
      packageArtifactIntegrity(artifact.tarballPath) !== artifact.integrity
    ) {
      throw new Error(
        `Validated artifact is missing or changed for ${pkg.name}`
      )
    }
    return { ...pkg, artifact }
  })
  const ordered = createFrameworkPublishOrder({ packages: releasePackages })

  const currentCommit = runCommand('git', ['rev-parse', 'HEAD'], {
    cwd: resolvedRoot
  }).trim()
  if (currentCommit !== sourceCommitSha) {
    throw new Error('Framework source commit changed after artifact validation')
  }

  const registryVersions = new Map()
  for (const pkg of ordered) {
    const spec = `${pkg.name}@${pkg.version}`
    try {
      const version = runCommand('npm', ['view', spec, 'version'], {
        cwd: resolvedRoot
      }).trim()
      if (version !== pkg.version) {
        throw new Error(
          `Registry returned unexpected version ${version} for ${spec}`
        )
      }
      registryVersions.set(spec, version)
    } catch (error) {
      if (!isNotFound(error)) throw error
      registryVersions.set(spec, '')
    }
  }

  const publishCandidates = ordered.filter(
    (pkg) => !registryVersions.get(`${pkg.name}@${pkg.version}`)
  )
  const tagBySpec = new Map()
  for (const pkg of publishCandidates) {
    const spec = `${pkg.name}@${pkg.version}`
    const existingTag = runCommand('git', ['tag', '--list', spec], {
      cwd: resolvedRoot
    }).trim()
    if (existingTag) {
      throw new Error(
        `Release tag already exists for unpublished version ${spec}`
      )
    }
    tagBySpec.set(spec, spec)
  }

  const published = []
  const skipped = ordered.filter((pkg) =>
    registryVersions.get(`${pkg.name}@${pkg.version}`)
  )
  for (const pkg of publishCandidates) {
    const spec = `${pkg.name}@${pkg.version}`
    runCommand(
      'npm',
      ['publish', pkg.artifact.tarballPath, '--access', 'public'],
      {
        cwd: resolvedRoot
      }
    )
    runCommand('git', ['tag', tagBySpec.get(spec), sourceCommitSha], {
      cwd: resolvedRoot
    })
    published.push({ name: pkg.name, version: pkg.version })
  }
  return {
    skipped: skipped.map(({ name, version }) => ({ name, version })),
    published
  }
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const readValidatedRelease = ({ repositoryRoot, pointerPath }) => {
  const pointer = readJson(pointerPath)
  const validationRoot = path.resolve(pointer.validationRoot)
  const temporaryRoot = path.join(repositoryRoot, 'tmp')
  if (
    pointer.status !== 'PASS' ||
    path.dirname(validationRoot) !== temporaryRoot ||
    !path.basename(validationRoot).startsWith('release-validation-')
  ) {
    throw new Error('Framework validation workspace pointer is invalid')
  }
  const sourceCommitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  }).trim()
  if (sourceCommitSha !== pointer.sourceCommitSha) {
    throw new Error('Source commit changed after Framework validation')
  }

  const source = readFrameworkReleaseSource({ repositoryRoot: validationRoot })
  const validated = validateFrameworkReleasePackageArtifacts({
    repositoryRoot: validationRoot,
    artifactDirectory: DEFAULT_RELEASE_ARTIFACT_DIRECTORY
  })
  const consumerEvidencePath = path.join(
    validationRoot,
    'tmp/framework-release-evidence/clean-consumer.json'
  )
  const consumerEvidence = readJson(consumerEvidencePath)
  const handoffPath = path.join(
    validationRoot,
    DEFAULT_RELEASE_ARTIFACT_DIRECTORY,
    FRAMEWORK_ARTIFACT_HANDOFF
  )
  const handoff = readJson(handoffPath)
  const packages = source.packages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    dependencies: pkg.dependencies
  }))
  validateFrameworkReleaseArtifactManifest({
    manifest: handoff,
    currentCommitSha: sourceCommitSha,
    packages: validated.packages,
    consumerEvidence
  })
  const artifacts = validated.packages.map((pkg) => ({
    name: pkg.packageName,
    version: pkg.version,
    tarballPath: pkg.tarballPath,
    integrity: pkg.integrity
  }))
  const expectedArtifacts = new Map(artifacts.map((item) => [item.name, item]))
  for (const pkg of packages) {
    const artifact = expectedArtifacts.get(pkg.name)
    if (!artifact || artifact.version !== pkg.version) {
      throw new Error(
        `Packed artifact does not match ${pkg.name}@${pkg.version}`
      )
    }
  }
  return { sourceCommitSha, packages, artifacts }
}

export const publishFrameworkRelease = ({
  repositoryRoot,
  validationPointer = FRAMEWORK_VALIDATION_POINTER,
  runCommand = runCommandDefault
}) => {
  const resolvedRoot = path.resolve(repositoryRoot)
  const pointerPath = path.resolve(resolvedRoot, validationPointer)
  if (
    path.dirname(pointerPath) !== path.join(resolvedRoot, 'tmp') ||
    path.basename(pointerPath) !== path.basename(FRAMEWORK_VALIDATION_POINTER)
  ) {
    throw new Error(
      'Framework validation pointer must be the project tmp handoff'
    )
  }
  const { sourceCommitSha, packages, artifacts } = readValidatedRelease({
    repositoryRoot: resolvedRoot,
    pointerPath
  })
  return publishFrameworkReleasePackages({
    repositoryRoot: resolvedRoot,
    sourceCommitSha,
    packages,
    artifacts,
    validateArtifacts: () => {
      const pointer = readJson(pointerPath)
      const validationRoot = path.resolve(pointer.validationRoot)
      const evidence = readJson(
        path.join(
          validationRoot,
          'tmp/framework-release-evidence/clean-consumer.json'
        )
      )
      if (evidence.status !== 'READY') {
        throw new Error('Framework packed consumer gate did not pass')
      }
    },
    runCommand
  })
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  const args = process.argv.slice(2)
  const validationArgument = args.find((arg) => arg.startsWith('--validation='))
  const validationPointer = validationArgument?.slice('--validation='.length)
  if (args.includes('--plan')) {
    process.stdout.write(
      `${JSON.stringify({ validation: FRAMEWORK_VALIDATION_POINTER }, null, 2)}\n`
    )
    process.exit(0)
  }
  if (!validationPointer || args.some((arg) => arg !== validationArgument)) {
    console.error(`Must specify --validation=${FRAMEWORK_VALIDATION_POINTER}`)
    process.exit(1)
  }
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
  )
  publishFrameworkRelease({ repositoryRoot, validationPointer })
}

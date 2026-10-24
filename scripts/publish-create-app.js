#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createAppReleasePaths } from './create-app-release-artifacts.mjs'
import {
  readGuidance,
  admitGuidance,
  registryCurrent,
  artifactIntegrity,
  recordGuidanceResult,
  runReleaseCommand
} from './release-guidance.mjs'

export function publishCreateApp({
  root,
  product,
  runCommand = runReleaseCommand
}) {
  const paths = createAppReleasePaths(root, product)
  const guidance = readGuidance(paths.evidence)
  const manifest = JSON.parse(
    fs.readFileSync(path.join(paths.directory, 'package.json'), 'utf8')
  )
  assert.ok(
    manifest.name?.startsWith('create-') && !manifest.private && manifest.bin,
    'Expected a public create-app CLI manifest'
  )
  const recorded = guidance.deliveries?.[0]?.artifact
  assert.ok(
    recorded?.tarball && path.basename(recorded.tarball) === recorded.tarball,
    'Missing packed create-app artifact'
  )
  const tarball = path.join(paths.artifactDirectory, recorded.tarball)
  const artifact = {
    id: manifest.name,
    version: manifest.version,
    integrity: artifactIntegrity(tarball),
    tarball: recorded.tarball
  }
  const sourceSha = runCommand('git', ['rev-parse', 'HEAD'], {
    cwd: root
  }).trim()
  const current = registryCurrent(root, artifact, runCommand)
  admitGuidance({
    root,
    owner: `create-app/${product}`,
    sourceSha,
    generatedRoots: [`create-app/${product}/template`],
    deliveries: [{ id: manifest.name, roots: paths.roots, artifact }],
    evidence: guidance,
    current: [current]
  })
  const resultFile = `${paths.evidence}.result.json`
  // Exact-version checks also cover retries after a dist-tag moves independently.
  let existing
  try {
    existing = JSON.parse(
      runCommand(
        'npm',
        [
          'view',
          `${manifest.name}@${manifest.version}`,
          'dist.integrity',
          '--json',
          '--cache',
          path.join(root, 'tmp/npm-cache')
        ],
        { cwd: root }
      )
    )
  } catch (error) {
    if (
      error.code !== 'E404' &&
      !/\bE404\b/.test(`${error.stderr} ${error.message}`)
    )
      throw error
  }
  if (existing) {
    assert.equal(
      existing,
      artifact.integrity,
      'Registry artifact differs from validated create-app tarball'
    )
    return recordGuidanceResult(
      resultFile,
      guidance,
      manifest.name,
      'skipped-existing',
      { version: manifest.version }
    )
  }
  const tag = `${manifest.name}@${manifest.version}`
  assert.equal(
    runCommand('git', ['tag', '--list', tag], { cwd: root }).trim(),
    '',
    'Release tag already exists for unpublished CLI'
  )
  try {
    runCommand(
      'npm',
      [
        'publish',
        tarball,
        '--access',
        'public',
        '--cache',
        path.join(root, 'tmp/npm-cache')
      ],
      { cwd: root }
    )
  } catch (error) {
    recordGuidanceResult(resultFile, guidance, manifest.name, 'failed', {
      phase: 'publish',
      availability: 'unknown; recheck registry before retry'
    })
    throw error
  }
  const result = recordGuidanceResult(
    resultFile,
    guidance,
    manifest.name,
    'published',
    { version: manifest.version, integrity: artifact.integrity }
  )
  runCommand('git', ['tag', tag, sourceSha], { cwd: root })
  return result
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const product = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--prod='))
    ?.slice(7)
  publishCreateApp({ root: path.resolve(import.meta.dirname, '..'), product })
}

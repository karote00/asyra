import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  createFrameworkReleaseArtifactManifest,
  validateFrameworkReleaseArtifactManifest
} from '../framework-release-artifacts.js'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)

const withFixture = (run) => {
  fs.mkdirSync(path.join(repositoryRoot, 'tmp'), { recursive: true })
  const root = fs.mkdtempSync(
    path.join(repositoryRoot, 'tmp', 'framework-release-artifacts-fixture-')
  )
  try {
    run(root)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

const integrityOf = (filePath) =>
  `sha512-${createHash('sha512').update(fs.readFileSync(filePath)).digest('base64')}`

const createInputs = (root) => {
  const packages = [
    { name: '@asyra/core', version: '3.2.1' },
    { name: '@asyra/utils', version: '3.2.0' }
  ].map((pkg) => {
    const packageRoot = path.join(root, 'packages', pkg.name.split('/')[1])
    const staleDist = path.join(packageRoot, 'dist', 'index.js')
    fs.mkdirSync(path.dirname(staleDist), { recursive: true })
    fs.writeFileSync(staleDist, 'stale source checkout build')
    const tarballPath = path.join(
      root,
      'artifacts',
      `${pkg.name.split('/')[1]}-${pkg.version}.tgz`
    )
    fs.mkdirSync(path.dirname(tarballPath), { recursive: true })
    fs.writeFileSync(tarballPath, `isolated validated artifact ${pkg.name}`)
    return { ...pkg, tarballPath, integrity: integrityOf(tarballPath) }
  })
  const consumerEvidence = {
    status: 'READY',
    phases: ['install', 'typecheck', 'build', 'test'],
    artifactIntegrities: Object.fromEntries(
      packages.map(({ name, integrity }) => [name, integrity])
    )
  }
  return { packages, consumerEvidence }
}

test('artifact handoff binds packed artifacts and clean-consumer evidence to the source commit', () => {
  withFixture((root) => {
    const { packages, consumerEvidence } = createInputs(root)
    const sourceCommitSha = '1'.repeat(40)
    const manifest = createFrameworkReleaseArtifactManifest({
      sourceCommitSha,
      packages,
      consumerEvidence
    })

    assert.equal(manifest.status, 'READY')
    assert.equal(manifest.packages.length, packages.length)
    assert.doesNotThrow(() =>
      validateFrameworkReleaseArtifactManifest({
        manifest,
        currentCommitSha: sourceCommitSha,
        packages,
        consumerEvidence
      })
    )
  })
})

test('artifact handoff rejects another HEAD, stale dist, changed tarball, missing package, or failed consumer', () => {
  withFixture((root) => {
    const { packages, consumerEvidence } = createInputs(root)
    const manifest = createFrameworkReleaseArtifactManifest({
      sourceCommitSha: '2'.repeat(40),
      packages,
      consumerEvidence
    })

    assert.throws(
      () =>
        validateFrameworkReleaseArtifactManifest({
          manifest,
          currentCommitSha: '3'.repeat(40),
          packages,
          consumerEvidence
        }),
      /source commit changed/u
    )
    assert.throws(
      () =>
        validateFrameworkReleaseArtifactManifest({
          manifest,
          currentCommitSha: '2'.repeat(40),
          packages: packages.slice(0, 1),
          consumerEvidence
        }),
      /artifact set changed/u
    )

    fs.writeFileSync(packages[0].tarballPath, 'stale artifact substituted')
    assert.throws(
      () =>
        validateFrameworkReleaseArtifactManifest({
          manifest,
          currentCommitSha: '2'.repeat(40),
          packages,
          consumerEvidence
        }),
      /artifact integrity changed/u
    )
    assert.throws(
      () =>
        createFrameworkReleaseArtifactManifest({
          sourceCommitSha: '2'.repeat(40),
          packages,
          consumerEvidence: { ...consumerEvidence, status: 'FAILED' }
        }),
      /packed consumer gate did not pass/u
    )
  })
})

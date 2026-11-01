import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { validateFrameworkReleaseRecords } from '../release-records.js'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)

const readManifest = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'))

const versionFamilyOf = (version) => version.split('.').slice(0, 2).join('.')

const identityOf = ({ name, version }) => ({ name, version })

test('release inventory does not require documentation or completed plans', (t) => {
  const parent = path.join(repositoryRoot, 'tmp')

  fs.mkdirSync(parent, { recursive: true })
  const fixture = fs.mkdtempSync(path.join(parent, 'release-records-'))

  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }))
  const files = execFileSync('git', ['ls-files', '-z'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  })
    .split('\0')
    .filter(
      (file) =>
        file === 'package.json' ||
        /^(?:packages|apps|create-app)\/[^/]+\/package\.json$/u.test(file) ||
        file.startsWith('.changeset/')
    )

  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(fixture, file)), { recursive: true })
    fs.copyFileSync(path.join(repositoryRoot, file), path.join(fixture, file))
  }

  assert.equal(
    validateFrameworkReleaseRecords({ repositoryRoot: fixture }).status,
    'PASS'
  )
})

const compareVersions = (left, right) => {
  const leftParts = left.split('.').map(Number)
  const rightParts = right.split('.').map(Number)

  for (let index = 0; index < leftParts.length; index += 1) {
    const difference = leftParts[index] - rightParts[index]

    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

test('release records derive Framework and excluded-owner versions from manifests', () => {
  const result = validateFrameworkReleaseRecords({ repositoryRoot })
  const pendingChangesets = fs
    .readdirSync(path.join(repositoryRoot, '.changeset'))
    .filter((entry) => entry.endsWith('.md') && entry !== 'README.md')
    .sort()

  assert.equal(result.status, 'PASS')
  assert.equal(result.packages.length, 19)
  assert.deepEqual(
    result.packageVersions,
    Object.fromEntries(
      result.packages.map((record) => [
        record.name,
        readManifest(
          `packages/${record.name.slice('@asyra/'.length)}/package.json`
        ).version
      ])
    )
  )
  assert.deepEqual(
    new Set(result.packages.map((record) => versionFamilyOf(record.version))),
    new Set([result.releaseFamily])
  )
  assert.deepEqual(
    result.releaseVersions,
    [...new Set(Object.values(result.packageVersions))].sort(compareVersions)
  )
  assert.deepEqual(result.excludedVersions, {
    root: identityOf(readManifest('package.json')),
    privateApp: identityOf(readManifest('apps/asyra-design/package.json')),
    createApp: identityOf(readManifest('create-app/asyra-design/package.json'))
  })
  assert.deepEqual(result.pendingChangesets, pendingChangesets)
  assert.equal(result.releaseDecision, 'PENDING')
  assert.equal(result.publicationAuthorized, false)
})

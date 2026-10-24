import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { initializeGuidance } from './fixtures/release-guidance.mjs'
import { publishFrameworkReleasePackages } from '../publish-framework-release.js'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const packageSet = () => [
  {
    name: '@asyra/core',
    version: '1.4.2',
    dependencies: { '@asyra/utils': '1.4.2' }
  },
  { name: '@asyra/factory', version: '2.1.3', dependencies: {} },
  { name: '@asyra/utils', version: '1.4.2', dependencies: {} }
]

const artifactSet = (artifactDirectory) =>
  packageSet().map(({ name, version }) => ({
    name,
    version,
    tarballPath: path.join(
      artifactDirectory,
      `${name.split('/')[1]}-${version}.tgz`
    ),
    integrity: ''
  }))

const createFixture = () => {
  fs.mkdirSync(path.join(repositoryRoot, 'tmp'), { recursive: true })
  const root = fs.mkdtempSync(
    path.join(repositoryRoot, 'tmp', 'framework-publisher-fixture-')
  )
  const packages = packageSet()
  for (const pkg of packages) {
    const directory = path.join(root, 'packages', pkg.name.split('/')[1])
    fs.mkdirSync(path.join(directory, 'dist'), { recursive: true })
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(pkg))
    fs.writeFileSync(path.join(directory, 'dist', 'index.js'), 'stale build')
  }
  const artifacts = path.join(root, 'artifacts')
  fs.mkdirSync(artifacts, { recursive: true })
  const artifactsList = artifactSet(artifacts)
  for (const artifact of artifactsList) {
    fs.writeFileSync(artifact.tarballPath, `validated ${artifact.name}`)
    artifact.integrity = `sha512-${createHash('sha512')
      .update(fs.readFileSync(artifact.tarballPath))
      .digest('base64')}`
  }
  return {
    root,
    packages,
    artifacts,
    artifactsList,
    ...initializeGuidance(root, packages, artifactsList)
  }
}

const withFixture = async (run) => {
  const fixture = createFixture()
  try {
    await run(fixture)
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true })
  }
}

test('publisher skips exact existing versions and publishes only missing validated tarballs', async () => {
  await withFixture(({ root, packages, artifactsList, sourceSha }) => {
    const commands = []
    const result = publishFrameworkReleasePackages({
      repositoryRoot: root,
      sourceCommitSha: sourceSha,
      packages,
      artifacts: artifactsList,
      allowedPackageNames: packages.map(({ name }) => name),
      runCommand(command, args) {
        commands.push([command, ...args])
        if (command === 'git' && args[0] === 'rev-parse') return sourceSha
        if (command === 'npm' && args[0] === 'view') {
          if (args[1].endsWith('@latest'))
            return JSON.stringify({
              version: '1.0.0',
              'dist.integrity': 'previous-integrity',
              gitHead: JSON.parse(
                fs.readFileSync(
                  path.join(root, 'tmp/framework-release-guidance.json'),
                  'utf8'
                )
              ).deliveries[0].baseline.sourceSha
            })
          if (args[1] === '@asyra/core@1.4.2')
            return JSON.stringify({
              version: '1.4.2',
              'dist.integrity': artifactsList.find(
                (pkg) => pkg.name === '@asyra/core'
              ).integrity
            })
          const error = new Error('missing exact version')
          error.code = 'E404'
          throw error
        }
        return ''
      }
    })

    assert.deepEqual(
      result.skipped.map(({ name }) => name),
      ['@asyra/core']
    )
    assert.deepEqual(
      result.published.map(({ name }) => name),
      ['@asyra/utils', '@asyra/factory']
    )
    const publishCommands = commands.filter(
      ([command, action]) => command === 'npm' && action === 'publish'
    )
    const lastRegistryQuery = commands.findLastIndex(
      ([command, action]) => command === 'npm' && action === 'view'
    )
    const firstPublish = commands.findIndex(
      ([command, action]) => command === 'npm' && action === 'publish'
    )
    assert.equal(publishCommands.length, 2)
    assert.ok(lastRegistryQuery < firstPublish)
    assert.ok(publishCommands.every((args) => args[2].endsWith('.tgz')))
    assert.ok(
      commands.some(
        ([command, action, tag]) =>
          command === 'git' && action === 'tag' && tag === '@asyra/utils@1.4.2'
      )
    )
    assert.equal(
      commands.some(
        ([command, action, tag]) =>
          command === 'git' && action === 'tag' && tag === '@asyra/core@1.4.2'
      ),
      false
    )
  })
})

test('publisher queries every exact version before publishing and stops on non-404 registry errors', async () => {
  await withFixture(({ root, packages, artifactsList, sourceSha }) => {
    const commands = []
    assert.throws(
      () =>
        publishFrameworkReleasePackages({
          repositoryRoot: root,
          sourceCommitSha: sourceSha,
          packages,
          artifacts: artifactsList,
          allowedPackageNames: packages.map(({ name }) => name),
          runCommand(command, args) {
            commands.push([command, ...args])
            if (command === 'git' && args[0] === 'rev-parse') return sourceSha
            if (command === 'npm' && args[0] === 'view') {
              if (args[1].endsWith('@latest'))
                return JSON.stringify({
                  version: '1.0.0',
                  'dist.integrity': 'previous-integrity',
                  gitHead: JSON.parse(
                    fs.readFileSync(
                      path.join(root, 'tmp/framework-release-guidance.json'),
                      'utf8'
                    )
                  ).deliveries[0].baseline.sourceSha
                })
              if (args[1] === '@asyra/factory@2.1.3') {
                const error = new Error('registry unavailable')
                error.code = 'EAI_AGAIN'
                throw error
              }
              const error = new Error('missing exact version')
              error.code = 'E404'
              throw error
            }
            return ''
          }
        }),
      /registry unavailable/u
    )
    assert.equal(
      commands.some(
        ([command, action]) => command === 'npm' && action === 'publish'
      ),
      false
    )
    assert.equal(
      commands.some(
        ([command, action]) => command === 'git' && action === 'tag'
      ),
      false
    )
  })
})

test('publisher refuses packages outside the Framework allowlist before registry or publish calls', async () => {
  await withFixture(({ root, packages, artifactsList }) => {
    const commands = []
    assert.throws(
      () =>
        publishFrameworkReleasePackages({
          repositoryRoot: root,
          sourceCommitSha: 'c'.repeat(40),
          packages: [
            ...packages,
            {
              name: '@asyra/flow-inspector',
              version: '3.0.0',
              dependencies: {}
            }
          ],
          artifacts: artifactsList,
          allowedPackageNames: packages.map(({ name }) => name),
          runCommand(command, args) {
            commands.push([command, ...args])
            return ''
          }
        }),
      /outside the Framework allowlist/u
    )
    assert.deepEqual(commands, [])
  })
})

test('a failed artifact or packed-consumer gate prevents every publish and tag', async () => {
  await withFixture(({ root, packages, artifactsList }) => {
    const commands = []
    assert.throws(
      () =>
        publishFrameworkReleasePackages({
          repositoryRoot: root,
          sourceCommitSha: 'd'.repeat(40),
          packages,
          artifacts: artifactsList,
          allowedPackageNames: packages.map(({ name }) => name),
          validateArtifacts() {
            throw new Error('packed consumer failed')
          },
          runCommand(command, args) {
            commands.push([command, ...args])
            if (command === 'git' && args[0] === 'rev-parse')
              return 'd'.repeat(40)
            return ''
          }
        }),
      /packed consumer failed/u
    )
    assert.deepEqual(commands, [])
  })
})

test('direct publisher blocks missing release guidance before any publish or tag', async () => {
  await withFixture(({ root, packages, artifactsList, sourceSha }) => {
    fs.rmSync(path.join(root, 'tmp/framework-release-guidance.json'))
    const mutations = []
    assert.throws(
      () =>
        publishFrameworkReleasePackages({
          repositoryRoot: root,
          sourceCommitSha: sourceSha,
          packages,
          artifacts: artifactsList,
          allowedPackageNames: packages.map(({ name }) => name),
          runCommand(command, args) {
            if (command === 'git' && args[0] === 'rev-parse') return sourceSha
            if (command === 'npm' && args[0] === 'view') {
              if (args[1].endsWith('@latest'))
                return JSON.stringify({
                  version: '1.0.0',
                  'dist.integrity': 'previous-integrity',
                  gitHead: JSON.parse(
                    fs.readFileSync(
                      path.join(root, 'tmp/framework-release-guidance.json'),
                      'utf8'
                    )
                  ).deliveries[0].baseline.sourceSha
                })
              const error = new Error('E404')
              error.code = 'E404'
              throw error
            }
            if (
              args[0] === 'publish' ||
              (args[0] === 'tag' && args[1] !== '--list')
            )
              mutations.push(args)
            return ''
          }
        }),
      /guidance/i
    )
    assert.deepEqual(mutations, [])
  })
})

test('partial publish retains per-package outcomes and retries the original guidance', async () => {
  await withFixture(
    ({ root, packages, artifactsList, sourceSha, evidence }) => {
      const registry = new Map()
      const mutations = []
      let fail = true
      const runCommand = (command, args) => {
        if (command === 'git' && args[0] === 'rev-parse') return sourceSha
        if (command === 'npm' && args[0] === 'view') {
          const name = args[1].slice(0, args[1].lastIndexOf('@'))
          const artifact = artifactsList.find((item) => item.name === name)
          if (registry.has(name))
            return JSON.stringify({
              version: artifact.version,
              'dist.integrity': artifact.integrity
            })
          if (args[1].endsWith('@latest'))
            return JSON.stringify({
              version: '1.0.0',
              'dist.integrity': 'previous-integrity',
              gitHead: JSON.parse(
                fs.readFileSync(
                  path.join(root, 'tmp/framework-release-guidance.json'),
                  'utf8'
                )
              ).deliveries[0].baseline.sourceSha
            })
          const error = new Error('E404')
          error.code = 'E404'
          throw error
        }
        if (command === 'npm' && args[0] === 'publish') {
          const artifact = artifactsList.find(
            (item) => item.tarballPath === args[1]
          )
          mutations.push(artifact.name)
          if (fail && artifact.name === '@asyra/core')
            throw new Error('Registry write interrupted')
          registry.set(artifact.name, true)
        }
        return ''
      }
      const inputs = {
        repositoryRoot: root,
        sourceCommitSha: sourceSha,
        packages,
        artifacts: artifactsList,
        allowedPackageNames: packages.map(({ name }) => name),
        runCommand
      }
      assert.throws(
        () => publishFrameworkReleasePackages(inputs),
        /Registry write interrupted/
      )
      const recordPath = fs
        .readdirSync(path.join(root, 'tmp'))
        .find((file) =>
          file.startsWith('framework-release-guidance-result.json.')
        )
      const result = JSON.parse(
        fs.readFileSync(path.join(root, 'tmp', recordPath), 'utf8')
      )
      assert.equal(result.outcomes['@asyra/utils'].status, 'published')
      assert.equal(result.outcomes['@asyra/core'].status, 'failed')
      assert.equal(result.outcomes['@asyra/factory'], undefined)
      fail = false
      const retry = publishFrameworkReleasePackages(inputs)
      assert.deepEqual(retry.skipped, [
        { name: '@asyra/utils', version: '1.4.2' }
      ])
      assert.equal(
        mutations.filter((name) => name === '@asyra/utils').length,
        1
      )
      assert.deepEqual(
        JSON.parse(
          fs.readFileSync(
            path.join(root, 'tmp/framework-release-guidance.json'),
            'utf8'
          )
        ),
        evidence
      )
    }
  )
})

test('Framework verification recording requires actual matching registry-consumer evidence', async () => {
  const { recordFrameworkGuidance } =
    await import('../framework-release-artifacts.js')
  await withFixture(({ root, packages, artifactsList }) => {
    const runCommand = (command, args) => {
      const name = args[1].slice(0, args[1].lastIndexOf('@'))
      const artifact = artifactsList.find((item) => item.name === name)
      return JSON.stringify({
        version: artifact.version,
        'dist.integrity': artifact.integrity
      })
    }
    assert.throws(
      () => recordFrameworkGuidance({ repositoryRoot: root, runCommand }),
      /ENOENT/
    )
    const directory = path.join(root, 'tmp/framework-release-evidence')
    fs.mkdirSync(directory)
    const consumer = {
      status: 'READY',
      phases: ['install', 'typecheck', 'build', 'test'],
      packages: packages.map(({ name, version }) => ({
        name,
        version,
        resolution: 'npm',
        checksum: 'verified-lock-checksum'
      }))
    }
    const file = path.join(directory, 'registry-only-consumer.json')
    fs.writeFileSync(file, JSON.stringify({ ...consumer, phases: ['install'] }))
    assert.throws(
      () => recordFrameworkGuidance({ repositoryRoot: root, runCommand }),
      /missing or incomplete/
    )
    assert.ok(
      !fs
        .readdirSync(path.join(root, 'tmp'))
        .some((name) => name.startsWith('framework-release-guidance-result'))
    )
    fs.writeFileSync(file, JSON.stringify(consumer))
    recordFrameworkGuidance({ repositoryRoot: root, runCommand })
    const resultFile = fs
      .readdirSync(path.join(root, 'tmp'))
      .find((name) => name.startsWith('framework-release-guidance-result'))
    const result = JSON.parse(
      fs.readFileSync(path.join(root, 'tmp', resultFile), 'utf8')
    )
    assert.ok(
      Object.values(result.outcomes).every(
        (outcome) => outcome.status === 'verified'
      )
    )
  })
})

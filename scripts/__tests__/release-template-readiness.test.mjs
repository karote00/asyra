import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test, { after, before } from 'node:test'
import { fileURLToPath } from 'node:url'

import { readFrameworkReleaseSource } from '../framework-release-packages.js'
import {
  DEFAULT_TEMPLATE_CONSUMER_DIRECTORY,
  assertTemplateFrameworkVersionsMatch,
  prepareGeneratedTemplateConsumer,
  resolveTemplateConsumerDirectory,
  validateGeneratedTemplateContract,
  validateRegistryInstalledGeneratedApp,
  verifyGeneratedTemplate
} from '../release-template-readiness.js'

test('template release readiness rejects dependencies outside the frozen Framework set', () => {
  assert.doesNotThrow(() =>
    assertTemplateFrameworkVersionsMatch(
      { '@asyra/collaboration': '1.2.4' },
      new Map([['@asyra/collaboration', { version: '1.2.4' }]])
    )
  )
  assert.throws(
    () =>
      assertTemplateFrameworkVersionsMatch(
        { '@asyra/collaboration': '1.2.3' },
        new Map([['@asyra/collaboration', { version: '1.2.4' }]])
      ),
    /must use frozen version 1\.2\.4, found 1\.2\.3/u
  )
})

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)
let artifactFixture
let artifactDirectory

const exportedPaths = (exportsValue) => {
  if (typeof exportsValue === 'string') return [exportsValue]
  if (!exportsValue || typeof exportsValue !== 'object') return []
  return Object.values(exportsValue).flatMap(exportedPaths)
}

const tarballNameFor = ({ name, version }) =>
  `${name.slice(1).replace('/', '-')}-${version}.tgz`

const writeFile = (filePath, source) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, source)
}

const createPackedArtifactFixture = () => {
  const source = readFrameworkReleaseSource({ repositoryRoot })
  const packageVersions = Object.fromEntries(
    source.packages.map((record) => [record.name, record.version])
  )
  const rootLicense = fs.readFileSync(
    path.join(repositoryRoot, 'LICENSE'),
    'utf8'
  )
  const temporaryRoot = path.join(repositoryRoot, 'tmp')
  fs.mkdirSync(temporaryRoot, { recursive: true })
  const fixtureRoot = fs.mkdtempSync(
    path.join(temporaryRoot, 'framework-release-package-fixture-')
  )
  const artifactDirectory = fs.mkdtempSync(
    path.join(temporaryRoot, 'framework-release-artifacts-fixture-')
  )

  fs.mkdirSync(artifactDirectory, { recursive: true })

  for (const record of source.packages) {
    const packageRoot = path.join(fixtureRoot, record.directory, 'package')
    const manifest = JSON.parse(
      fs.readFileSync(path.join(repositoryRoot, record.manifestPath), 'utf8')
    )
    delete manifest.devDependencies
    delete manifest.scripts
    for (const dependencyField of [
      'dependencies',
      'peerDependencies',
      'optionalDependencies'
    ]) {
      if (!manifest[dependencyField]) continue
      for (const [dependencyName, version] of Object.entries(
        manifest[dependencyField]
      )) {
        if (packageVersions[dependencyName] && version === 'workspace:*') {
          manifest[dependencyField][dependencyName] =
            packageVersions[dependencyName]
        }
      }
    }
    writeFile(
      path.join(packageRoot, 'package.json'),
      `${JSON.stringify(manifest, null, 2)}\n`
    )
    writeFile(path.join(packageRoot, 'LICENSE'), rootLicense)

    const publicPaths = [
      manifest.main,
      manifest.module,
      manifest.types,
      ...exportedPaths(manifest.exports)
    ].filter(Boolean)
    for (const publicPath of publicPaths) {
      const source =
        publicPath.endsWith('.d.ts') || publicPath.endsWith('.d.mts')
          ? 'export {}\n'
          : 'export {}\n'
      writeFile(
        path.join(packageRoot, publicPath.replace(/^\.\//u, '')),
        source
      )
    }

    execFileSync(
      'tar',
      [
        '-czf',
        path.join(
          artifactDirectory,
          tarballNameFor({ name: record.name, version: record.version })
        ),
        '-C',
        path.join(fixtureRoot, record.directory),
        'package'
      ],
      { stdio: 'ignore' }
    )
  }

  return { artifactDirectory, fixtureRoot }
}

before(() => {
  artifactFixture = createPackedArtifactFixture()
  artifactDirectory = artifactFixture.artifactDirectory
})

after(() => {
  if (!artifactFixture) return
  fs.rmSync(artifactFixture.artifactDirectory, { recursive: true, force: true })
  fs.rmSync(artifactFixture.fixtureRoot, { recursive: true, force: true })
})

test('packed artifact fixture never deletes the shared release artifact owner', () => {
  const sharedArtifactDirectory = path.join(
    repositoryRoot,
    'tmp',
    'framework-release-artifacts'
  )
  const sentinelPath = path.join(
    sharedArtifactDirectory,
    `fixture-preservation-${randomUUID()}.txt`
  )
  fs.mkdirSync(sharedArtifactDirectory, { recursive: true })
  fs.writeFileSync(sentinelPath, 'preserve shared artifacts\n', { flag: 'wx' })

  try {
    const isolatedFixture = createPackedArtifactFixture()
    try {
      assert.notEqual(
        isolatedFixture.artifactDirectory,
        sharedArtifactDirectory
      )
    } finally {
      fs.rmSync(isolatedFixture.artifactDirectory, {
        recursive: true,
        force: true
      })
      fs.rmSync(isolatedFixture.fixtureRoot, { recursive: true, force: true })
    }
    assert.equal(
      fs.readFileSync(sentinelPath, 'utf8'),
      'preserve shared artifacts\n'
    )
  } finally {
    fs.rmSync(sentinelPath)
  }
})

test('generated template consumer path is constrained to one project tmp child', () => {
  assert.equal(
    resolveTemplateConsumerDirectory({ repositoryRoot }),
    path.join(repositoryRoot, DEFAULT_TEMPLATE_CONSUMER_DIRECTORY)
  )
  assert.throws(
    () =>
      resolveTemplateConsumerDirectory({
        repositoryRoot,
        consumerDirectory: 'create-app/asyra-design/template'
      }),
    /direct child of project tmp/
  )
})

test('generated template uses only frozen public framework entrypoints', () => {
  const contract = validateGeneratedTemplateContract({
    repositoryRoot,
    appName: 'asyra-design'
  })

  assert.ok(contract.importCount > 0)
  assert.deepEqual(contract.importedPackageNames, [
    '@asyra/ai-agent-runtime',
    '@asyra/collaboration',
    '@asyra/core',
    '@asyra/design-system',
    '@asyra/factory',
    '@asyra/feature-system',
    '@asyra/input-system',
    '@asyra/preset',
    '@asyra/reactive-events',
    '@asyra/ui-context',
    '@asyra/utils'
  ])
  assert.deepEqual(contract.packageNames, [
    '@asyra/ai-agent-runtime',
    '@asyra/collaboration',
    '@asyra/core',
    '@asyra/design-system',
    '@asyra/factory',
    '@asyra/feature-system',
    '@asyra/input-system',
    '@asyra/preset',
    '@asyra/reactive-events',
    '@asyra/render',
    '@asyra/ui-context',
    '@asyra/utils'
  ])

  const starterContract = validateGeneratedTemplateContract({
    repositoryRoot,
    appName: 'starter-app'
  })
  assert.ok(starterContract.importCount > 0)
  assert.deepEqual(starterContract.importedPackageNames, [
    '@asyra/core',
    '@asyra/preset',
    '@asyra/utils'
  ])
  assert.deepEqual(starterContract.packageNames, [
    '@asyra/core',
    '@asyra/preset',
    '@asyra/utils'
  ])
  assert.equal(
    fs
      .readFileSync(
        path.join(starterContract.templateDirectory, 'vitest.config.ts'),
        'utf8'
      )
      .includes('../../packages'),
    false
  )
})

test('generated template replaces framework resolution with packed artifacts', () => {
  const consumerDirectory = path.join(
    repositoryRoot,
    'tmp',
    'framework-template-preparation-test'
  )
  try {
    const prepared = prepareGeneratedTemplateConsumer({
      repositoryRoot,
      appName: 'asyra-design',
      consumerDirectory,
      artifactDirectory
    })

    for (const packageName of prepared.contract.packageNames) {
      const version = prepared.contract.packageVersions[packageName]
      const dependency =
        prepared.manifest.dependencies?.[packageName] ??
        prepared.manifest.devDependencies?.[packageName]
      const artifactDirectoryName = path.basename(artifactDirectory)
      assert.match(
        dependency,
        new RegExp(
          `^file:\\.\\./${artifactDirectoryName.replace(
            /[.*+?^${}()|[\]\\]/gu,
            '\\$&'
          )}/.*-${version.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\.tgz$`,
          'u'
        )
      )
    }
    assert.equal(Object.keys(prepared.manifest.resolutions).length, 19)
    assert.equal(
      fs.readFileSync(path.join(consumerDirectory, '.yarnrc.yml'), 'utf8'),
      'nodeLinker: node-modules\nenableTransparentWorkspaces: false\n'
    )
  } finally {
    fs.rmSync(consumerDirectory, { recursive: true, force: true })
  }
})

test('registry-installed generated app preserves exact public framework resolution', () => {
  fs.mkdirSync(path.join(repositoryRoot, 'tmp'), { recursive: true })
  const generatedAppDirectory = fs.mkdtempSync(
    path.join(repositoryRoot, 'tmp', 'registry-generated-app-test-')
  )
  const contract = validateGeneratedTemplateContract({
    repositoryRoot,
    appName: 'asyra-design'
  })

  try {
    fs.cpSync(contract.templateDirectory, generatedAppDirectory, {
      recursive: true
    })
    const lockEntries = []
    for (const [name, version] of Object.entries(contract.packageVersions)) {
      const packageDirectory = path.join(
        generatedAppDirectory,
        'node_modules',
        ...name.split('/')
      )
      fs.mkdirSync(packageDirectory, { recursive: true })
      fs.writeFileSync(
        path.join(packageDirectory, 'package.json'),
        `${JSON.stringify({ name, version })}\n`
      )
      lockEntries.push(
        `"${name}@npm:${version}":\n  version: ${version}\n  resolution: "${name}@npm:${version}"\n  checksum: test/${name}\n  languageName: node\n  linkType: hard\n`
      )
    }
    fs.writeFileSync(
      path.join(generatedAppDirectory, 'yarn.lock'),
      lockEntries.join('\n')
    )

    const evidence = validateRegistryInstalledGeneratedApp({
      repositoryRoot,
      appName: 'asyra-design',
      generatedAppDirectory
    })

    assert.deepEqual(
      evidence.packages.map(({ name }) => name),
      contract.packageNames
    )
    assert.equal(
      evidence.packages.every(
        ({ name, version, resolution, checksum }) =>
          version === contract.packageVersions[name] &&
          resolution === 'npm' &&
          checksum.startsWith('test/')
      ),
      true
    )

    const manifestPath = path.join(generatedAppDirectory, 'package.json')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    manifest.dependencies['@asyra/core'] = 'file:../core.tgz'
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    assert.throws(
      () =>
        validateRegistryInstalledGeneratedApp({
          repositoryRoot,
          appName: 'asyra-design',
          generatedAppDirectory
        }),
      /public registry dependency contract/
    )
  } finally {
    fs.rmSync(generatedAppDirectory, { recursive: true, force: true })
  }
})

test('generated template runner owns install, compile, build, test, smoke, and cleanup', async () => {
  const consumerDirectory = path.join(
    repositoryRoot,
    'tmp',
    'framework-template-runner-test'
  )
  const evidenceDirectory = path.join(
    repositoryRoot,
    'tmp',
    'framework-template-evidence-test'
  )
  const contract = validateGeneratedTemplateContract({
    repositoryRoot,
    appName: 'asyra-design'
  })
  const commands = []
  let smokeDirectory

  const evidence = await verifyGeneratedTemplate({
    repositoryRoot,
    appName: 'asyra-design',
    artifactDirectory,
    consumerDirectory,
    evidenceDirectory,
    allowUnsupportedNode: true,
    runCommand: (command, args, options) => {
      commands.push({ command: [command, ...args], env: options.env })
      if (args[0] !== 'install') return
      const manifest = JSON.parse(
        fs.readFileSync(path.join(options.cwd, 'package.json'), 'utf8')
      )
      Object.keys({
        ...manifest.dependencies,
        ...manifest.devDependencies
      })
        .filter((name) => name.startsWith('@asyra/'))
        .forEach((name) => {
          const packageDirectory = path.join(
            options.cwd,
            'node_modules',
            ...name.split('/')
          )
          fs.mkdirSync(packageDirectory, { recursive: true })
          fs.writeFileSync(
            path.join(packageDirectory, 'package.json'),
            `${JSON.stringify({
              name,
              version: contract.packageVersions[name]
            })}\n`
          )
        })
    },
    runStartupSmoke: async ({ consumerDirectory: smokeConsumer }) => {
      smokeDirectory = smokeConsumer
    }
  })

  assert.deepEqual(
    commands.map(({ command }) => command),
    [
      ['yarn', 'install', '--no-immutable'],
      ['yarn', 'typecheck'],
      ['yarn', 'eslint', '.'],
      ['yarn', 'react:build'],
      ['yarn', 'test']
    ]
  )
  assert.equal(
    commands.every(
      ({ env }) =>
        env.APP_URL === 'http://127.0.0.1:4173' &&
        env.VITE_COLLABORATION_WS_URL === ' '
    ),
    true
  )
  assert.equal(smokeDirectory, consumerDirectory)
  assert.equal(fs.existsSync(consumerDirectory), false)
  assert.equal(evidence.status, 'DIAGNOSTIC')
  assert.deepEqual(evidence.phases, [
    'install',
    'typecheck',
    'lint',
    'build',
    'test',
    'startup-smoke'
  ])

  fs.rmSync(evidenceDirectory, { recursive: true, force: true })
})

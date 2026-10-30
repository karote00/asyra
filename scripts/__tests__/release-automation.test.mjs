import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)

const readPlan = (script, args = []) => {
  const result = spawnSync(process.execPath, [script, ...args, '--plan'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return JSON.parse(result.stdout)
}

test('development and release artifact checks have separate entrypoints', () => {
  const { scripts } = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  assert.equal(
    scripts['test:release-artifacts'],
    'node --test scripts/__tests__/release-template-artifacts.test.mjs'
  )
  assert.doesNotMatch(scripts['test:scripts'], /release-template-artifacts/)
  const plan = readPlan('scripts/release-validate.js', ['--prod=asyra-design'])
  assert.ok(plan.includes('yarn test:release-artifacts'))
  assert.ok(
    plan.indexOf('yarn test:release-artifacts') >
      plan.indexOf('yarn release:app:check --prod=asyra-design')
  )
})

test('full release keeps Framework and create-app publication in ordered stages', () => {
  const plan = readPlan('scripts/release-full.js', ['--prod=asyra-design'])

  assert.deepEqual(plan, {
    framework: ['yarn release:framework'],
    createApp: ['yarn release:create-app --prod=asyra-design']
  })
})

test('Framework release publishes only validated Framework package artifacts', () => {
  const plan = readPlan('scripts/release-framework.js')

  assert.deepEqual(plan, {
    prepare: [
      'yarn release:validate --framework --preserve',
      'node scripts/framework-release-artifacts.js --prepare'
    ],
    publish: [
      'node scripts/publish-framework-release.js --validation=tmp/framework-release-validation.json'
    ],
    verify: [
      'yarn release:consumer:registry',
      'node scripts/framework-release-artifacts.js --record',
      'node scripts/framework-release-artifacts.js --cleanup'
    ]
  })
})

test('create-app release verifies the Framework registry and publishes only its CLI', () => {
  const plan = readPlan('scripts/release-create-app.js', [
    '--prod=asyra-design'
  ])

  assert.deepEqual(plan, {
    prepare: [
      'yarn release:consumer:registry',
      'yarn release:app --prod=asyra-design',
      'yarn release:validate --prod=asyra-design',
      'node scripts/create-app-release-artifacts.mjs --prod=asyra-design'
    ],
    publish: ['node scripts/publish-create-app.js --prod=asyra-design']
  })
})

test('release publishers enforce separate Framework allowlist and CLI roots', () => {
  const frameworkPublisher = readFileSync(
    path.join(repositoryRoot, 'scripts/publish-framework-release.js'),
    'utf8'
  )
  const createAppPublisher = readFileSync(
    path.join(repositoryRoot, 'scripts/publish-create-app.js'),
    'utf8'
  )
  const releaseRecords = readFileSync(
    path.join(repositoryRoot, 'scripts/release-records.js'),
    'utf8'
  )

  assert.match(frameworkPublisher, /FRAMEWORK_RELEASE_PACKAGE_NAMES/)
  assert.match(releaseRecords, /FRAMEWORK_RELEASE_PACKAGE_NAMES/)
  assert.match(frameworkPublisher, /pkg\.artifact\.tarballPath/u)
  assert.match(frameworkPublisher, /'view',\s*spec,\s*'version'/u)
  assert.doesNotMatch(
    frameworkPublisher,
    /release-records\/framework\/current\.json/
  )
  assert.doesNotMatch(frameworkPublisher, /create-app/)
  assert.match(createAppPublisher, /createAppReleasePaths\(root, product\)/)
  assert.doesNotMatch(createAppPublisher, /FRAMEWORK_RELEASE_PACKAGE_NAMES/)
})

test('release validation covers build, tests, dependencies, collaboration, and generated template', () => {
  const plan = readPlan('scripts/release-validate.js', ['--prod=asyra-design'])

  assert.deepEqual(plan, [
    'yarn install --immutable',
    'yarn security:audit',
    'yarn gen:turbo:check',
    'yarn clean',
    'yarn react:build',
    'yarn lint',
    'yarn test:workspaces:ci',
    'yarn deps:validate',
    'yarn workspace @asyra/asyra-design test:e2e:collaboration',
    'yarn release:app:check --prod=asyra-design',
    'yarn test:release-artifacts',
    'yarn release:app:build --prod=asyra-design --prebuilt'
  ])
})

test('Framework validation is app-independent and does not generate or build app templates', () => {
  const plan = readPlan('scripts/release-validate.js', ['--framework'])

  assert.deepEqual(plan, [
    'yarn install --immutable',
    'yarn security:audit',
    'yarn gen:turbo:check',
    'yarn clean',
    'yarn react:build',
    'yarn lint',
    'yarn test:workspaces:ci',
    'yarn deps:validate'
  ])
  assert.doesNotMatch(plan.join('\n'), /release:app|test:e2e:collaboration/u)
})

test('Framework release validation can preserve its successful isolated build for packing', () => {
  const plan = readPlan('scripts/release-validate.js', [
    '--framework',
    '--preserve'
  ])

  assert.deepEqual(plan, [
    'yarn install --immutable',
    'yarn security:audit',
    'yarn gen:turbo:check',
    'yarn clean',
    'yarn react:build',
    'yarn lint',
    'yarn test:workspaces:ci',
    'yarn deps:validate'
  ])
})

test('public release gates high-severity dependency advisories', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  const workflow = readFileSync(
    path.join(repositoryRoot, '.github/workflows/main.yml'),
    'utf8'
  )

  assert.equal(
    manifest.scripts['security:audit'],
    'yarn npm audit --all --recursive --severity high'
  )
  assert.match(
    workflow,
    /- name: Audit high-severity dependencies\s+id: security_audit\s+if: \$\{\{ fromJSON\(needs.scope.outputs.execution_plan\).checks.securityAudit.mode == 'full' \}\}\s+run: yarn security:audit/u
  )
})

test('generated template smoke build resolves tooling through its synchronized canonical app', () => {
  const buildReleaseTemplate = readFileSync(
    path.join(repositoryRoot, 'scripts/build-release-template.js'),
    'utf8'
  )

  assert.match(
    buildReleaseTemplate,
    /const sourceRoot = path\.resolve\(repositoryRoot, releaseConfig\.src\)/
  )
  assert.match(
    buildReleaseTemplate,
    /const sourceConfigPath = path\.join\(sourceRoot, 'vite\.config\.ts'\)/
  )
  assert.match(
    buildReleaseTemplate,
    /'build',\s+templateRoot,\s+'--config',\s+sourceConfigPath/
  )
})

test('release template exposes a non-mutating synchronization check', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  const releaseTemplate = readFileSync(
    path.join(repositoryRoot, 'scripts/release-template.js'),
    'utf8'
  )

  assert.equal(
    manifest.scripts['release:app:check'],
    'node scripts/release-template.js --check'
  )
  assert.match(
    releaseTemplate,
    /const DEST_DIR = CHECK \? CHECK_DIRECTORY : CONFIGURED_DEST_DIR/
  )
  assert.match(
    releaseTemplate,
    /if \(CHECK\) \{\s+process\.on\('exit', \(\) => \{\s+fse\.removeSync\(CHECK_DIRECTORY\)/
  )
})

test('general README checks do not force a selected app template to synchronize', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  const command = manifest.scripts['docs:readme:check']

  assert.match(command, /docs:readme:packages:check/u)
  assert.match(command, /docs:readme:validate/u)
  assert.match(command, /docs:public:check/u)
  assert.doesNotMatch(command, /release:app:check|--prod=/u)
})

test('release template cleanup handles ignored files and directories', () => {
  const releaseTemplate = readFileSync(
    path.join(repositoryRoot, 'scripts/release-template.js'),
    'utf8'
  )
  assert.match(releaseTemplate, /\{\s+nodir: true,\s+dot: true\s+\}/)
  assert.match(releaseTemplate, /\{\s+onlyDirectories: true,\s+dot: true\s+\}/)
  assert.match(
    releaseTemplate,
    /const isIgnoredComparisonDirectory = \(name\) =>/
  )
  assert.match(releaseTemplate, /\/\^\\\..\+-data\$\/u\.test\(name\)/)
})

test('Asyra Design release template retains only active drawing fixtures', () => {
  const config = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'release-configs/asyra-design.json'),
      'utf8'
    )
  )
  assert.equal(config.cleanFiles.includes('visual-review-records'), true)

  for (const requiredPath of [
    'test-data/ai-drawing/__tests__/action-batch-interceptor.test.ts',
    'test-data/ai-drawing/detailed-tabby.ts',
    'test-data/ai-drawing/maximum-tabby-polygon.svg'
  ]) {
    assert.equal(
      existsSync(path.join(repositoryRoot, 'apps/asyra-design', requiredPath)),
      true,
      requiredPath
    )
  }
})

test('Asyra Design keeps the large CRDT fixture out of the generated template', () => {
  const config = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'release-configs/asyra-design.json'),
      'utf8'
    )
  )
  const canonicalFixture = path.join(
    repositoryRoot,
    'apps/asyra-design/samples/crdt-7076/action-batch.json'
  )
  assert.equal(existsSync(canonicalFixture), true)
  assert.deepEqual(config.removeScripts, [
    'generate:crdt-7076-document',
    'test:e2e:crdt-7076',
    'test:e2e:collaboration',
    'prepare:e2e:endpoint-performance',
    'test:e2e:crdt-endpoint-performance',
    'test:e2e:ai-attribution:16',
    'test:e2e:ai-attribution:16-reduced-motion',
    'test:e2e:ai-attribution:1280',
    'test:e2e:ai-attribution:maximum',
    'test:e2e:ai-crdt-activity:16',
    'test:e2e:ai-crdt-attribution:1280',
    'test:e2e:ai-crdt-attribution:320',
    'test:e2e:ai-crdt-video'
  ])
  assert.deepEqual(config.removeScriptArguments, {
    'test:server-response-harness': [
      'server/__tests__/action-batch.test.ts',
      'test-data/ai-drawing/__tests__/action-batch-interceptor.test.ts',
      'src/ai/__tests__/detailed-tabby.test.ts',
      'server/__tests__/basic-api-contracts.test.ts'
    ],
    'test:local': [
      '__tests__/prepared-server-response-artifacts.test.mjs',
      '__tests__/playwright-config.test.mjs',
      'src/common-apis/element/__tests__/vector-parent-creation.test.ts'
    ]
  })
  assert.equal(
    existsSync(
      path.join(
        repositoryRoot,
        'apps/asyra-design/test-data/ai-drawing/maximum-tabby-polygon.svg'
      )
    ),
    true
  )
})

test('Asyra Design canonical source excludes retired CRA and duplicate template artifacts', () => {
  const manifest = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'apps/asyra-design/package.json'),
      'utf8'
    )
  )
  const config = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'release-configs/asyra-design.json'),
      'utf8'
    )
  )

  assert.equal(manifest.dependencies?.['web-vitals'], undefined)
  assert.equal(manifest.dependencies?.['react-scripts'], undefined)
  assert.equal(config.readme, undefined)
  assert.equal(config.exampleEnvironment, undefined)

  for (const retiredPath of [
    'TEMPLATE.md',
    'e2e/.gitkeep',
    'public/logo512.png',
    'public/manifest.json',
    'src/logo.svg',
    'src/react-app-env.d.ts',
    'src/reportWebVitals.ts'
  ]) {
    assert.equal(
      existsSync(path.join(repositoryRoot, 'apps/asyra-design', retiredPath)),
      false,
      retiredPath
    )
  }

  assert.equal(
    existsSync(
      path.join(repositoryRoot, 'apps/asyra-design/src/animation/index.tsx')
    ),
    true,
    'the reserved animation source must remain available'
  )
})

test('canonical app environment remains private with a public example', () => {
  const trackedEnvironment = spawnSync(
    'git',
    ['ls-files', '--', 'apps/asyra-design/.env'],
    { cwd: repositoryRoot, encoding: 'utf8' }
  )
  assert.equal(trackedEnvironment.status, 0)
  assert.equal(trackedEnvironment.stdout.trim(), '')
  assert.equal(
    existsSync(path.join(repositoryRoot, 'apps/asyra-design', '.env.example')),
    true
  )
})

test('repository ignores private environment files without hiding examples', () => {
  for (const privateEnvironmentPath of [
    '.env',
    '.env.local',
    'packages/core/.env',
    'apps/asyra-framework-site/.env.production'
  ]) {
    const result = spawnSync(
      'git',
      ['check-ignore', '--no-index', '--quiet', privateEnvironmentPath],
      {
        cwd: repositoryRoot,
        encoding: 'utf8'
      }
    )

    assert.equal(
      result.status,
      0,
      `${privateEnvironmentPath} must be ignored by the repository root`
    )
  }

  for (const exampleEnvironmentPath of [
    '.env.example',
    'packages/core/.env.example'
  ]) {
    const result = spawnSync(
      'git',
      ['check-ignore', '--no-index', '--quiet', exampleEnvironmentPath],
      {
        cwd: repositoryRoot,
        encoding: 'utf8'
      }
    )

    assert.equal(
      result.status,
      1,
      `${exampleEnvironmentPath} must remain available as documentation`
    )
  }
})

test('each app and its create-app package share one release version', () => {
  const createAppManifest = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'create-app/asyra-design/package.json'),
      'utf8'
    )
  )
  const appManifest = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'apps/asyra-design/package.json'),
      'utf8'
    )
  )

  assert.equal(createAppManifest.version, appManifest.version)
})

test('Framework site and root share one release version', () => {
  const rootManifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  const siteManifest = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'apps/asyra-framework-site/package.json'),
      'utf8'
    )
  )

  assert.equal(siteManifest.version, rootManifest.version)
})

test('create-app package metadata matches the supported public CLI contract', () => {
  const manifest = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'create-app/asyra-design/package.json'),
      'utf8'
    )
  )

  assert.equal(
    manifest.description,
    'Create a ready-to-use Asyra Design canvas and visual editor app'
  )
  assert.equal(manifest.license, 'MIT')
  assert.deepEqual(manifest.engines, { node: '24.x' })
  assert.equal(manifest.packageManager, 'yarn@4.3.1')
  assert.deepEqual(manifest.repository, {
    type: 'git',
    url: 'git+https://github.com/karote00/asyra.git',
    directory: 'create-app/asyra-design'
  })
  assert.equal(manifest.homepage, 'https://asyra-framework.pages.dev')
  assert.ok(manifest.keywords.includes('canvas-editor'))
  assert.ok(manifest.keywords.includes('visual-editor'))
})

test('root and Core metadata identify the searchable product category', () => {
  const rootManifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  const coreManifest = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'packages/core/package.json'),
      'utf8'
    )
  )

  assert.equal(
    rootManifest.description,
    'Composable framework for canvas-based, visual, and domain-driven products.'
  )
  assert.equal(
    coreManifest.description,
    'Public composition core for canvas-based, visual, and domain-driven Asyra products'
  )
  for (const keyword of [
    'canvas-framework',
    'canvas-editor',
    'visual-editor',
    'whiteboard',
    'bim',
    'undo-redo'
  ]) {
    assert.ok(rootManifest.keywords.includes(keyword), keyword)
    assert.ok(coreManifest.keywords.includes(keyword), keyword)
  }
  assert.deepEqual(coreManifest.repository, {
    type: 'git',
    url: 'git+https://github.com/karote00/asyra.git',
    directory: 'packages/core'
  })
  assert.equal(coreManifest.homepage, 'https://asyra-framework.pages.dev')
})

test('every public Framework package identifies its repository location', () => {
  const packagesRoot = path.join(repositoryRoot, 'packages')

  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }

    const manifestPath = path.join(packagesRoot, entry.name, 'package.json')
    if (!existsSync(manifestPath)) {
      continue
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (manifest.private === true) {
      continue
    }

    assert.deepEqual(
      manifest.repository,
      {
        type: 'git',
        url: 'git+https://github.com/karote00/asyra.git',
        directory: `packages/${entry.name}`
      },
      manifest.name
    )
    assert.equal(
      manifest.homepage,
      'https://asyra-framework.pages.dev',
      manifest.name
    )
  }
})

test('Asyra Design keeps build and test tooling out of production dependencies', () => {
  const manifest = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'apps/asyra-design/package.json'),
      'utf8'
    )
  )
  const developmentOnlyPackages = [
    '@testing-library/dom',
    '@testing-library/react',
    '@testing-library/user-event',
    '@types/node',
    'typescript'
  ]

  for (const packageName of developmentOnlyPackages) {
    assert.equal(manifest.dependencies?.[packageName], undefined, packageName)
    assert.equal(
      typeof manifest.devDependencies?.[packageName],
      'string',
      packageName
    )
  }

  for (const retiredPackage of ['@testing-library/jest-dom', '@types/jest']) {
    assert.equal(manifest.dependencies?.[retiredPackage], undefined)
    assert.equal(manifest.devDependencies?.[retiredPackage], undefined)
  }
  const retiredSetupPath = path.join(
    repositoryRoot,
    'apps/asyra-design/src/setupTests.ts'
  )
  assert.equal(existsSync(retiredSetupPath), false)
})

test('template generation pins the selected Framework set and detects fixture drift', () => {
  const fixtureRoot = mkdtempSync(
    path.join(repositoryRoot, 'tmp', 'release-template-generator-fixture-')
  )
  const appName = 'fixture-app'
  const appSource = path.join(fixtureRoot, 'apps', appName)
  const template = path.join(fixtureRoot, 'create-app', appName, 'template')
  const generatorPath = path.join(repositoryRoot, 'scripts/release-template.js')

  try {
    writeFileSync(
      path.join(fixtureRoot, 'package.json'),
      JSON.stringify({ devDependencies: { prettier: '3.2.5' } })
    )
    mkdirSync(path.join(fixtureRoot, 'release-configs'), { recursive: true })
    writeFileSync(
      path.join(fixtureRoot, 'release-configs', `${appName}.json`),
      JSON.stringify({
        src: `apps/${appName}`,
        dest: `create-app/${appName}/template`
      })
    )
    mkdirSync(path.join(fixtureRoot, 'packages', 'core'), { recursive: true })
    writeFileSync(
      path.join(fixtureRoot, 'packages', 'core', 'package.json'),
      JSON.stringify({ name: '@asyra/core', version: '1.2.4' })
    )
    mkdirSync(appSource, { recursive: true })
    writeFileSync(
      path.join(appSource, 'package.json'),
      JSON.stringify({
        name: appName,
        dependencies: { '@asyra/core': 'workspace:*' },
        scripts: { start: 'vite dev' }
      })
    )
    writeFileSync(path.join(appSource, 'README.md'), '# Fixture app\n')
    writeFileSync(
      path.join(appSource, '.env.example'),
      'APP_URL=http://localhost\n'
    )

    const runGenerator = (check = false) =>
      spawnSync(
        process.execPath,
        [generatorPath, `--prod=${appName}`, ...(check ? ['--check'] : [])],
        { cwd: fixtureRoot, encoding: 'utf8' }
      )

    const generated = runGenerator()
    assert.equal(generated.status, 0, generated.stderr || generated.stdout)

    const manifestPath = path.join(template, 'package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    assert.equal(manifest.dependencies['@asyra/core'], '1.2.4')
    assert.deepEqual(manifest.engines, { node: '24.x' })
    assert.equal(manifest.packageManager, 'yarn@4.3.1')
    assert.equal(manifest.scripts.start, 'vite dev')
    assert.doesNotMatch(
      JSON.stringify(manifest),
      /workspace:|(?:link|portal):/u
    )

    const frameworkManifestPath = path.join(
      fixtureRoot,
      'packages',
      'core',
      'package.json'
    )
    const frameworkManifest = JSON.parse(
      readFileSync(frameworkManifestPath, 'utf8')
    )
    frameworkManifest.version = '1.2.5'
    writeFileSync(
      frameworkManifestPath,
      `${JSON.stringify(frameworkManifest, null, 2)}\n`
    )
    const priorStageManifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    assert.equal(priorStageManifest.dependencies['@asyra/core'], '1.2.4')
    assert.match(
      priorStageManifest.dependencies['@asyra/core'],
      /^\d+\.\d+\.\d+$/u
    )
    assert.deepEqual(priorStageManifest.engines, { node: '24.x' })
    assert.equal(priorStageManifest.packageManager, 'yarn@4.3.1')
    assert.equal(priorStageManifest.scripts.start, 'vite dev')
    assert.doesNotMatch(
      JSON.stringify(priorStageManifest),
      /workspace:|(?:link|portal):/u
    )

    const priorStageCheck = runGenerator(true)
    assert.notEqual(priorStageCheck.status, 0)
    assert.match(
      priorStageCheck.stderr + priorStageCheck.stdout,
      /Generated template is stale/u
    )

    const synchronized = runGenerator()
    assert.equal(
      synchronized.status,
      0,
      synchronized.stderr || synchronized.stdout
    )
    assert.equal(
      JSON.parse(readFileSync(manifestPath, 'utf8')).dependencies[
        '@asyra/core'
      ],
      '1.2.5'
    )
    const synchronizedCheck = runGenerator(true)
    assert.equal(
      synchronizedCheck.status,
      0,
      synchronizedCheck.stderr || synchronizedCheck.stdout
    )

    manifest.dependencies['@asyra/core'] = '1.2.3'
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    const stale = runGenerator(true)
    assert.notEqual(stale.status, 0)
    assert.match(stale.stderr + stale.stdout, /Generated template is stale/u)
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
})

test('canonical Asyra Design source uses workspace Framework dependencies during development', () => {
  const manifest = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'apps/asyra-design/package.json'),
      'utf8'
    )
  )
  const frameworkDependencies = Object.entries(
    manifest.dependencies ?? {}
  ).filter(([packageName]) => packageName.startsWith('@asyra/'))

  assert.ok(frameworkDependencies.length > 0)
  for (const [packageName, version] of frameworkDependencies) {
    assert.equal(version, 'workspace:*', packageName)
  }
  assert.equal(
    manifest.scripts?.typecheck,
    'tsc -p tsconfig.typecheck.json && tsc -p tsconfig.ai-server.json && tsc -p tsconfig.flow-proof.json'
  )

  const typecheckConfig = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, 'apps/asyra-design/tsconfig.typecheck.json'),
      'utf8'
    )
  )
  assert.equal(typecheckConfig.extends, './tsconfig.json')
  assert.ok(typecheckConfig.exclude.includes('src/**/__tests__/**'))
  assert.ok(typecheckConfig.exclude.includes('src/**/*.test.*'))
})

test('create-app installs once and hands the selected package manager a runnable start command', () => {
  const cli = readFileSync(
    path.join(repositoryRoot, 'create-app/asyra-design/bin/index.js'),
    'utf8'
  )

  assert.doesNotMatch(cli, /console\.log\('\x20{2}yarn dev'\)/)
  assert.match(cli, /yarn:\s*'yarn start'/)
  assert.match(cli, /npm:\s*'npm run start'/)
  assert.match(cli, /pnpm:\s*'pnpm start'/)
  assert.match(cli, /yarn:\s*'yarn install'/)
  assert.match(cli, /npm:\s*'npm install'/)
  assert.match(cli, /pnpm:\s*'pnpm install'/)
  assert.match(
    cli,
    /packageManager === 'yarn'[\s\S]*\.yarnrc\.yml[\s\S]*nodeLinker: node-modules/
  )
  assert.match(cli, /http:\/\/localhost:3000\/\?fileId=my-design/)

  const readme = readFileSync(
    path.join(repositoryRoot, 'create-app/asyra-design/README.md'),
    'utf8'
  )
  assert.match(readme, /Node\.js 24\.x/)
  assert.doesNotMatch(readme, /yarn install/)
  assert.doesNotMatch(readme, /npm install/)
  assert.doesNotMatch(readme, /pnpm install/)
  assert.match(readme, /yarn start/)
  assert.match(readme, /npm run start/)
  assert.match(readme, /pnpm start/)
  assert.match(readme, /http:\/\/localhost:3000\/\?fileId=my-design/)
  assert.doesNotMatch(readme, /react:start/)
})

test('create-app supports deterministic package-manager selection and rejects unsafe targets', () => {
  const cliPath = path.join(
    repositoryRoot,
    'create-app/asyra-design/bin/index.js'
  )
  const cli = readFileSync(cliPath, 'utf8')

  assert.match(cli, /--package-manager/)
  assert.match(cli, /yarn.*npm.*pnpm/s)
  assert.match(cli, /yarn:\s*\['install', '--no-immutable'\]/)
  assert.match(cli, /pnpm:\s*\['install', '--no-frozen-lockfile'\]/)

  mkdirSync(path.join(repositoryRoot, 'tmp'), { recursive: true })
  const testRoot = mkdtempSync(
    path.join(repositoryRoot, 'tmp', 'create-app-target-test-')
  )
  const invocationRoot = path.join(testRoot, 'invocation')
  mkdirSync(invocationRoot)

  try {
    const createPrefixedTarget = spawnSync(
      process.execPath,
      [cliPath, 'create-valid-app', '--package-manager=unsupported'],
      {
        cwd: invocationRoot,
        encoding: 'utf8'
      }
    )

    assert.notEqual(createPrefixedTarget.status, 0)
    assert.match(
      `${createPrefixedTarget.stderr}${createPrefixedTarget.stdout}`,
      /unsupported package manager/i,
      'a legitimate create-* project name must remain the target argument'
    )

    const result = spawnSync(
      process.execPath,
      [cliPath, '../escaped', '--package-manager=yarn'],
      {
        cwd: invocationRoot,
        encoding: 'utf8'
      }
    )

    assert.notEqual(result.status, 0)
    assert.match(`${result.stderr}${result.stdout}`, /project name.*directory/i)
    assert.equal(existsSync(path.join(testRoot, 'escaped')), false)
  } finally {
    rmSync(testRoot, { recursive: true, force: true })
  }
})

test('release validation copies only repository source into an isolated workspace', async () => {
  const { createReleaseValidationWorkspace, removeReleaseValidationWorkspace } =
    await import('../release-validation-workspace.js')
  mkdirSync(path.join(repositoryRoot, 'tmp'), { recursive: true })
  const testRoot = mkdtempSync(
    path.join(repositoryRoot, 'tmp', 'release-validation-test-')
  )
  const sourceRoot = path.join(testRoot, 'source')
  const validationParent = path.join(testRoot, 'validation')

  mkdirSync(path.join(sourceRoot, 'src'), { recursive: true })
  mkdirSync(path.join(sourceRoot, 'dist'), { recursive: true })
  mkdirSync(path.join(sourceRoot, 'node_modules'), { recursive: true })
  mkdirSync(path.join(sourceRoot, '.git'), { recursive: true })
  mkdirSync(path.join(sourceRoot, 'tmp'), { recursive: true })
  writeFileSync(path.join(sourceRoot, 'package.json'), '{}')
  writeFileSync(path.join(sourceRoot, 'src', 'index.js'), 'export {}')
  writeFileSync(path.join(sourceRoot, 'dist', 'index.js'), 'export {}')
  writeFileSync(path.join(sourceRoot, 'node_modules', 'package.json'), '{}')
  writeFileSync(path.join(sourceRoot, '.git', 'HEAD'), 'ref: main')
  writeFileSync(path.join(sourceRoot, 'tmp', 'artifact'), 'temporary')
  writeFileSync(path.join(sourceRoot, '.env'), 'SECRET=local')
  writeFileSync(path.join(sourceRoot, '.env.local'), 'SECRET=local')
  writeFileSync(path.join(sourceRoot, '.env.example'), 'PUBLIC=example')

  let validationRoot
  try {
    validationRoot = createReleaseValidationWorkspace({
      sourceRoot,
      validationParent
    })

    assert.notEqual(validationRoot, sourceRoot)
    assert.equal(existsSync(path.join(validationRoot, 'package.json')), true)
    assert.equal(existsSync(path.join(validationRoot, 'src', 'index.js')), true)
    assert.equal(existsSync(path.join(validationRoot, '.env')), true)
    assert.equal(existsSync(path.join(validationRoot, '.env.example')), true)
    assert.equal(existsSync(path.join(validationRoot, '.git')), true)
    assert.equal(
      spawnSync('git', ['rev-parse', '--show-toplevel'], {
        cwd: validationRoot,
        encoding: 'utf8'
      }).stdout.trim(),
      validationRoot
    )
    assert.equal(
      spawnSync('git', ['rev-parse', '--verify', 'HEAD'], {
        cwd: validationRoot,
        encoding: 'utf8'
      }).status,
      0
    )
    assert.equal(
      spawnSync('git', ['status', '--porcelain'], {
        cwd: validationRoot,
        encoding: 'utf8'
      }).stdout,
      ''
    )
    for (const excludedPath of ['dist', 'node_modules', 'tmp', '.env.local']) {
      assert.equal(existsSync(path.join(validationRoot, excludedPath)), false)
    }

    removeReleaseValidationWorkspace(validationRoot, validationParent)
    assert.equal(existsSync(validationRoot), false)
    validationRoot = undefined
  } finally {
    if (validationRoot) {
      removeReleaseValidationWorkspace(validationRoot, validationParent)
    }
    rmSync(testRoot, { recursive: true, force: true })
  }
})

test('release validation supplies matching app and collaboration endpoints', async () => {
  const {
    createReleaseValidationBaseEnvironment,
    createReleaseValidationEnvironment
  } = await import('../release-validation-environment.js')

  const ambientEnvironment = {
    RELEASE_TOKEN: 'preserved',
    APP_URL: 'http://127.0.0.1:9997',
    COLLABORATION_WS_PORT: '9998',
    VITE_COLLABORATION_WS_URL: 'ws://127.0.0.1:9998/collaboration'
  }

  assert.deepEqual(
    createReleaseValidationBaseEnvironment({
      environment: ambientEnvironment
    }),
    { RELEASE_TOKEN: 'preserved' }
  )

  assert.deepEqual(
    createReleaseValidationEnvironment({
      appPort: 4317,
      collaborationPort: 5109,
      environment: ambientEnvironment
    }),
    {
      RELEASE_TOKEN: 'preserved',
      APP_URL: 'http://127.0.0.1:4317',
      COLLABORATION_WS_PORT: '5109',
      VITE_COLLABORATION_WS_URL: 'ws://127.0.0.1:5109/collaboration'
    }
  )
})

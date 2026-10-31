import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repositoryRoot = path.resolve(import.meta.dirname, '../..')
const read = (file) => readFileSync(path.join(repositoryRoot, file), 'utf8')
const templateRoot = 'create-app/asyra-design/template'
const readTemplate = (file) => read(`${templateRoot}/${file}`)
const templateExists = (file) =>
  existsSync(path.join(repositoryRoot, templateRoot, file))

test('generated apps have no retired provider dependency', () => {
  const files = execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
      '--',
      'create-app'
    ],
    { cwd: repositoryRoot, encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean)

  for (const file of new Set(files)) {
    if (
      !/^create-app\/[^/]+\/template\//.test(file) ||
      !existsSync(path.join(repositoryRoot, file)) ||
      /\/(__tests__|docs)\/|CHANGELOG\.md$|\.lock$|\.(png|jpg|jpeg|webp|svg|woff2?|pdf|zip)$/i.test(
        file
      )
    ) {
      continue
    }
    assert.doesNotMatch(file, /vercel/i)
    if (
      /\.(?:[cm]?js|tsx?|json|ya?ml|md)$|(?:^|\/)\.env\.example$|\.gitignore$/.test(
        file
      )
    ) {
      assert.doesNotMatch(read(file), /vercel|npx skills (?:add|update)/i, file)
    }
  }
})

test('generated Design delivery policy stays synchronized with its App owner', () => {
  assert.equal(
    readTemplate('public/_headers'),
    read('apps/asyra-design/public/_headers')
  )
  for (const file of [
    'app-local-naming.test.mjs',
    'debug-global-boundary.test.mjs'
  ]) {
    assert.equal(
      readTemplate(`__tests__/${file}`),
      read(`apps/asyra-design/__tests__/${file}`)
    )
  }
})

test('generated app exposes reproducible standalone lint tooling', () => {
  const root = JSON.parse(read('package.json'))
  const manifest = JSON.parse(readTemplate('package.json'))

  assert.equal(manifest.scripts.lint, 'eslint .')
  assert.equal(manifest.devDependencies.prettier, root.devDependencies.prettier)
  assert.match(
    readTemplate('eslint.config.js'),
    /files: \['\*\*\/\*\.\{ts,tsx\}'\]/u
  )
})

test('release template excludes local runtime data directories', () => {
  const config = JSON.parse(read('release-configs/asyra-design.json'))

  assert.deepEqual(config.cleanFiles, [
    'node_modules',
    'yarn.lock',
    'package-lock.json',
    'pnpm-lock.yaml',
    '.pnp.cjs',
    '.pnp.loader.mjs',
    '.DS_Store',
    '.env*',
    '.*-data',
    '.turbo',
    'coverage',
    'dist',
    'playwright-report',
    'test-results',
    'visual-review-records',
    'samples/crdt-7076',
    'test-data/ai-drawing',
    'e2e/crdt-7076-render.spec.ts',
    'e2e/action-batch-interceptor.ts',
    'e2e/ai-drawing-performance.spec.ts',
    'e2e/collaboration-ai-agent-video.spec.ts',
    'e2e/collaboration.spec.ts',
    'e2e/conversational-ai.spec.ts',
    'e2e/crdt-endpoint-performance.spec.ts',
    'e2e/prepared-server-response-artifacts.mjs',
    'scripts/generate-crdt-7076-document.ts',
    '__tests__/prepared-server-response-artifacts.test.mjs',
    '__tests__/playwright-config.test.mjs',
    'server/__tests__/action-batch.test.ts',
    'src/ai/__tests__/detailed-tabby.test.ts',
    'src/common-apis/element/__tests__/vector-parent-creation.test.ts',
    'e2e/ai-conversation-flow.spec.ts',
    'server/__tests__/basic-api-contracts.test.ts',
    'flow-contracts.json',
    'server/__tests__/execution-flow.config.ts',
    'server/__tests__/execution-flow-proof.test.ts'
  ])
})

test('Asyra Design release template retains only active drawing fixtures', () => {
  for (const file of [
    'visual-review-records',
    'test-data/ai-drawing/detailed-tabby-cat-only-white-background.png',
    'test-data/ai-drawing/detailed-tabby-polygon.svg'
  ]) {
    assert.equal(templateExists(file), false, file)
  }
})

test('Asyra Design keeps the large CRDT fixture out of the generated template', () => {
  const config = JSON.parse(read('release-configs/asyra-design.json'))
  for (const file of [
    'samples/crdt-7076',
    'test-data/ai-drawing',
    'e2e/crdt-7076-render.spec.ts',
    'e2e/action-batch-interceptor.ts',
    'e2e/ai-drawing-performance.spec.ts',
    'e2e/collaboration-ai-agent-video.spec.ts',
    'e2e/collaboration.spec.ts',
    'e2e/conversational-ai.spec.ts',
    'e2e/crdt-endpoint-performance.spec.ts',
    'e2e/prepared-server-response-artifacts.mjs',
    'scripts/generate-crdt-7076-document.ts',
    '__tests__/prepared-server-response-artifacts.test.mjs',
    '__tests__/playwright-config.test.mjs',
    'server/__tests__/action-batch.test.ts',
    'src/ai/__tests__/detailed-tabby.test.ts',
    'src/common-apis/element/__tests__/vector-parent-creation.test.ts'
  ]) {
    assert.equal(templateExists(file), false, file)
  }
  const manifest = JSON.parse(readTemplate('package.json'))
  for (const argument of Object.values(config.removeScriptArguments).flat()) {
    assert.doesNotMatch(
      Object.values(manifest.scripts).join('\n'),
      new RegExp(argument.replaceAll('/', String.raw`\/`), 'u')
    )
  }
})

test('generated template excludes retired CRA and duplicate artifacts', () => {
  for (const file of [
    'TEMPLATE.md',
    'e2e/.gitkeep',
    'public/logo512.png',
    'public/manifest.json',
    'src/logo.svg',
    'src/react-app-env.d.ts',
    'src/reportWebVitals.ts'
  ]) {
    assert.equal(templateExists(file), false, file)
  }
})

test('generated template contains required public files and no repository-only state', () => {
  assert.equal(readTemplate('LICENSE'), read('create-app/asyra-design/LICENSE'))
  assert.equal(templateExists('.env'), false)
  assert.equal(templateExists('.env.example'), true)
  assert.equal(
    readTemplate('.env.example'),
    read('apps/asyra-design/.env.example')
  )
  for (const file of [
    '.turbo',
    'coverage',
    'dist',
    'playwright-report',
    'test-results'
  ]) {
    assert.equal(templateExists(file), false, file)
  }
})

test('packed create-app inventory excludes repository-only generated state', () => {
  const result = spawnSync(
    'npm',
    ['pack', './create-app/asyra-design', '--dry-run', '--json'],
    {
      cwd: repositoryRoot,
      encoding: 'utf8'
    }
  )

  assert.equal(result.status, 0, result.stderr || result.stdout)
  const [pack] = JSON.parse(result.stdout)
  const paths = pack.files.map(({ path: file }) => file)
  for (const file of [
    'README.md',
    'LICENSE',
    'bin/index.js',
    'template/LICENSE'
  ]) {
    assert.ok(paths.includes(file))
  }
  for (const segment of [
    '.turbo/',
    'coverage/',
    'dist/',
    'playwright-report/',
    'test-results/'
  ]) {
    assert.equal(
      paths.some((file) => file.includes(segment)),
      false,
      segment
    )
  }
})

test('generated template manifest is standalone on the supported release runtime', () => {
  const root = JSON.parse(read('package.json'))
  const manifest = JSON.parse(readTemplate('package.json'))

  assert.deepEqual(manifest.engines, { node: '24.x' })
  assert.equal(manifest.packageManager, 'yarn@4.3.1')
  assert.equal(manifest.scripts?.start, 'vite dev')
  assert.equal(manifest.scripts?.['react:start'], undefined)
  assert.equal(manifest.devDependencies.prettier, root.devDependencies.prettier)
  assert.doesNotMatch(
    JSON.stringify(manifest.scripts ?? {}),
    /(?:\.\.\/){2}|--cwd\s+\.\.\/\.\./
  )
  assert.doesNotMatch(JSON.stringify(manifest), /workspace:|(?:link|portal):/)
  for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
    if (name.startsWith('@asyra/')) {
      assert.match(version, /^\d+\.\d+\.\d+$/u, name)
    }
  }
  const environment = readTemplate('.env.example')
  assert.match(environment, /^APP_URL=http:\/\/localhost:3000$/m)
  assert.match(environment, /^COLLABORATION_WS_HOST=127\.0\.0\.1$/m)
  assert.match(environment, /^COLLABORATION_WS_PORT=4101$/m)
  assert.match(
    environment,
    /^VITE_COLLABORATION_WS_URL=ws:\/\/127\.0\.0\.1:4101\/collaboration$/m
  )
  assert.doesNotMatch(environment, /(?:SECRET|TOKEN|PASSWORD|API_KEY)=/i)
})

test('generated template documents its verified standalone commands and opt-ins', () => {
  const generated = readTemplate('README.md')

  assert.equal(
    generated,
    read('apps/asyra-design/README.md').replaceAll('../../LICENSE', 'LICENSE')
  )
  assert.match(generated, /Node\.js 24\.x/)
  for (const command of [
    'yarn install',
    'yarn react:build',
    'yarn test',
    'yarn start'
  ]) {
    assert.match(generated, new RegExp(command.replace(' ', String.raw`\s+`)))
  }
  assert.match(generated, /Preset/)
  assert.match(generated, /migration/i)
  assert.match(generated, /Group/)
  assert.match(generated, /Without `.env`.*local-only mode/is)
  assert.match(generated, /no Collaboration or server connection/i)
  assert.match(generated, /Collaboration offline state.*durable outbox/is)
  assert.match(generated, /reconciles them after reconnection/i)
  assert.match(generated, /local editing remains available/i)
  assert.doesNotMatch(generated, /Collaboration is disabled/i)
  assert.match(generated, /opt in to AI/i)
})

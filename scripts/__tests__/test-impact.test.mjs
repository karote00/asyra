import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { selectTestImpact, requiresTestParser } from '../test-impact.mjs'

const root = process.cwd()
const directory = 'apps/fieldscope'
const select = (...inputs) => selectTestImpact(root, directory, inputs)
test('UI inputs do not select numerical profiles', () => {
  const result = select('apps/fieldscope/src/ui/walking-runtime-selector.tsx')
  assert.equal(result.profiles.length, 0)
})
test('crop changes select source consumers but not pure trigonometry', () => {
  const result = select('apps/fieldscope/src/domain/crop-models.ts')
  assert.ok(
    result.profiles.some((f) =>
      f.endsWith('crop-models.source.profile.test.ts')
    )
  )
  assert.ok(
    result.profiles.some((f) =>
      f.endsWith('scene-demand.source.profile.test.ts')
    )
  )
  assert.ok(
    !result.profiles.some((f) =>
      f.endsWith('kinematic-trigonometry.profile.test.ts')
    )
  )
})
test('walking fixtures select their transitive profile consumers', () => {
  const result = select(
    'apps/fieldscope/src/simulation/__tests__/walking-motion-test-fixtures.ts'
  )
  assert.ok(
    result.profiles.some((f) =>
      f.endsWith('walking-motion-admission.profile.test.ts')
    )
  )
  assert.ok(
    !result.profiles.some((f) =>
      f.endsWith('crop-models.source.profile.test.ts')
    )
  )
})
test('upstream, unknown and deleted inputs retain the full inventory', () => {
  const full = select('packages/core/src/core.ts')
  assert.ok(full.profiles.length > 0)
  for (const input of [
    'apps/fieldscope/src/deleted.ts',
    'apps/fieldscope/vitest.config.ts'
  ])
    assert.deepEqual(select(input).profiles, full.profiles)
})
test('new tests and cyclic imports are discovered without a name list', (t) => {
  fs.mkdirSync(path.join(root, 'tmp/fieldscope-routing'), { recursive: true })
  const folder = fs.mkdtempSync(
    path.join(root, 'tmp/fieldscope-routing/graph-')
  )
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }))
  fs.mkdirSync(path.join(folder, 'src/__tests__'), { recursive: true })
  fs.writeFileSync(path.join(folder, 'src/a.ts'), "export * from './b'")
  fs.writeFileSync(path.join(folder, 'src/b.ts'), "export * from './a'")
  fs.writeFileSync(
    path.join(folder, 'src/__tests__/new.profile.test.ts'),
    "import '../a'"
  )
  const dir = path.relative(root, folder)
  const selected = selectTestImpact(root, dir, [`${dir}/src/b.ts`])
  assert.deepEqual(selected.profiles, ['src/__tests__/new.profile.test.ts'])
  assert.equal(selected.work.parsedFiles, 3)
  assert.equal(selected.work.traversedFiles, 3)
})

test('resource edits and upstream dependencies retain profiles, E2E is separately owned', () => {
  const full = select('apps/fieldscope/src/domain/data.json')
  assert.ok(full.profiles.length > 0)
  assert.ok(full.ordinary.length > 0)
})

test('unresolved imports conservatively select their consumers without losing cycles', (t) => {
  fs.mkdirSync(path.join(root, 'tmp/fieldscope-routing'), { recursive: true })
  const folder = fs.mkdtempSync(
    path.join(root, 'tmp/fieldscope-routing/unknown-')
  )
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }))
  fs.mkdirSync(path.join(folder, 'src/__tests__'), { recursive: true })
  fs.writeFileSync(path.join(folder, 'src/change.ts'), 'export const x = 1')
  fs.writeFileSync(
    path.join(folder, 'src/loader.ts'),
    'export const load = (file: string) => import(file)'
  )
  fs.writeFileSync(
    path.join(folder, 'src/__tests__/consumer.profile.test.ts'),
    "import '../loader'"
  )
  const dir = path.relative(root, folder)
  const selected = selectTestImpact(root, dir, [`${dir}/src/change.ts`])
  assert.deepEqual(selected.profiles, [
    'src/__tests__/consumer.profile.test.ts'
  ])
  assert.equal(selected.reason, 'source-graph-with-conservative-edges')
})

test('pre-install classification needs the parser only for registered source changes', () => {
  assert.equal(
    requiresTestParser(
      ['apps/fieldscope/src/ui/workbench.tsx'],
      ['apps/fieldscope']
    ),
    true
  )
  for (const file of [
    'packages/core/src/core.ts',
    'docs/ai/plan.md',
    'apps/other/src/index.ts',
    'apps/fieldscope/e2e/panels.spec.ts'
  ])
    assert.equal(requiresTestParser([file], ['apps/fieldscope']), false)
})

test('proven upstream sources enter at package imports and preserve transitive owner consumers', (t) => {
  const parent = path.join(root, 'tmp/fieldscope-routing')
  fs.mkdirSync(parent, { recursive: true })
  const folder = fs.mkdtempSync(path.join(parent, 'upstream-'))
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }))
  const files = {
    'package/package.json': JSON.stringify({
      name: '@example/renderer',
      exports: {
        '.': {
          types: './build/deep/index.d.ts',
          import: './build/deep/index.js'
        },
        './colors': './build/deep/index.js',
        './math': './build/deep/math.js'
      }
    }),
    'package/tsconfig.json': JSON.stringify({
      compilerOptions: {
        rootDir: './src',
        outDir: './build/deep',
        declaration: true
      },
      include: ['src']
    }),
    'package/src/paint.ts': 'export const paint = 1',
    'package/src/index.ts':
      "export * from './paint.js'; export * from '@example/preset'",
    'package/src/math.ts': 'export const number = 1',
    'facade/package.json': JSON.stringify({
      name: '@example/preset',
      exports: './dist/index.js'
    }),
    'facade/tsconfig.json': JSON.stringify({
      compilerOptions: {
        rootDir: './src',
        outDir: './dist'
      },
      include: ['src']
    }),
    'facade/src/index.ts': "export * from '@example/renderer'",
    'app/src/view.ts': "export * from '@example/renderer/colors'",
    'app/src/bridge.ts': "export * from './view'",
    'app/src/pure.ts':
      "import type { View } from './bridge'; import { number } from '@example/renderer/math'; export const value = number",
    'app/src/unrelated.ts': 'export const local = 1',
    'app/src/__tests__/unrelated.profile.test.ts': "import '../unrelated'",
    'app/src/unknown.ts': 'export const load = (name: string) => import(name)',
    'app/src/__tests__/render.profile.test.ts': "import '../bridge'",
    'app/src/__tests__/facade.test.ts': "import '@example/preset'",
    'app/src/__tests__/math.profile.test.ts': "import '../pure'",
    'app/src/__tests__/unknown.test.ts': "import '../unknown'"
  }
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(folder, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
  const dir = path.relative(root, path.join(folder, 'app'))
  const input = path.relative(root, path.join(folder, 'package/src/paint.ts'))
  const upstream = {
    sourcePaths: new Set([input]),
    workspaces: new Map(
      ['package', 'facade'].map((directory) => {
        const name =
          directory === 'package' ? '@example/renderer' : '@example/preset'
        return [
          name,
          { name, directory: path.relative(root, path.join(folder, directory)) }
        ]
      })
    )
  }
  const selected = selectTestImpact(root, dir, [input], false, upstream)
  assert.deepEqual(selected.profiles, ['src/__tests__/render.profile.test.ts'])
  assert.deepEqual(selected.ordinary, [
    'src/__tests__/facade.test.ts',
    'src/__tests__/unknown.test.ts'
  ])
  assert.equal(selected.work.parsedFiles, 14)
  const mixed = selectTestImpact(
    root,
    dir,
    [input, `${dir}/src/pure.ts`],
    false,
    upstream
  )
  assert.deepEqual(mixed.profiles, [
    'src/__tests__/math.profile.test.ts',
    'src/__tests__/render.profile.test.ts'
  ])
  assert.equal(
    selectTestImpact(root, dir, [input], false).reason,
    'full-owner-input'
  )
  fs.writeFileSync(
    path.join(folder, 'facade/src/index.ts'),
    "export * from '@example/renderer/missing'"
  )
  assert.ok(
    selectTestImpact(root, dir, [input], false, upstream).ordinary.includes(
      'src/__tests__/facade.test.ts'
    )
  )
  fs.writeFileSync(
    path.join(folder, 'package/tsconfig.json'),
    JSON.stringify({
      compilerOptions: { paths: { 'internal/*': ['./src/*'] } },
      include: ['src']
    })
  )
  assert.ok(
    selectTestImpact(root, dir, [input], false, upstream).profiles.includes(
      'src/__tests__/math.profile.test.ts'
    )
  )
  fs.rmSync(path.resolve(root, input))
  const removed = selectTestImpact(root, dir, [input], false, upstream)
  assert.equal(removed.reason, 'source-graph-with-conservative-edges')
  assert.deepEqual(removed.profiles, [
    'src/__tests__/math.profile.test.ts',
    'src/__tests__/render.profile.test.ts'
  ])
  assert.deepEqual(removed.ordinary, [
    'src/__tests__/facade.test.ts',
    'src/__tests__/unknown.test.ts'
  ])
})

test('pre-install parser admission includes discovered upstream workspace source paths', () => {
  assert.equal(
    requiresTestParser(
      ['packages/renderer/src/paint.ts'],
      ['apps/consumer'],
      ['packages/renderer']
    ),
    true
  )
  assert.equal(
    requiresTestParser(
      ['packages/renderer/package.json'],
      ['apps/consumer'],
      ['packages/renderer']
    ),
    false
  )
})

test('named type-only imports do not execute upstream sources', (t) => {
  const parent = path.join(root, 'tmp/fieldscope-routing')
  fs.mkdirSync(parent, { recursive: true })
  const folder = fs.mkdtempSync(path.join(parent, 'named-type-'))
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }))
  const dir = path.relative(root, folder)
  fs.mkdirSync(path.join(folder, 'src/__tests__'), { recursive: true })
  fs.writeFileSync(
    path.join(folder, 'src/value.ts'),
    'export interface Value {}'
  )
  fs.writeFileSync(
    path.join(folder, 'src/__tests__/type.test.ts'),
    "import { type Value } from '../value'"
  )
  const input = `${dir}/src/value.ts`
  const result = selectTestImpact(root, dir, [input], false, {
    sourcePaths: new Set([input])
  })
  assert.deepEqual(result.ordinary, [])
  assert.deepEqual(selectTestImpact(root, dir, [input]).ordinary, [
    'src/__tests__/type.test.ts'
  ])
  fs.writeFileSync(
    path.join(folder, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { verbatimModuleSyntax: true } })
  )
  assert.deepEqual(
    selectTestImpact(root, dir, [input], false, {
      sourcePaths: new Set([input])
    }).ordinary,
    ['src/__tests__/type.test.ts']
  )
})

test('declared browser proof inputs retain dependencies without unrelated upstream work', (t) => {
  const parent = path.join(root, 'tmp/fieldscope-routing')
  fs.mkdirSync(parent, { recursive: true })
  const folder = fs.mkdtempSync(path.join(parent, 'proof-inputs-'))
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }))
  const dir = path.relative(root, folder)
  fs.mkdirSync(path.join(folder, 'src'), { recursive: true })
  fs.writeFileSync(path.join(folder, 'src/math.ts'), 'export const x = 1')
  fs.writeFileSync(path.join(folder, 'src/render.ts'), 'export const y = 2')
  const options = {
    targets: [{ file: 'e2e/math.spec.ts', inputs: ['src/math.ts'] }]
  }
  assert.deepEqual(
    selectTestImpact(root, dir, [`${dir}/src/render.ts`], false, options)
      .ordinary,
    []
  )
  assert.deepEqual(
    selectTestImpact(root, dir, [`${dir}/src/math.ts`], false, options)
      .ordinary,
    ['e2e/math.spec.ts']
  )
  assert.deepEqual(
    selectTestImpact(root, dir, [`${dir}/missing.json`], false, options)
      .ordinary,
    ['e2e/math.spec.ts']
  )
  fs.writeFileSync(
    path.join(folder, 'src/math.ts'),
    'export const x = (p: string) => import(p)'
  )
  assert.deepEqual(
    selectTestImpact(root, dir, [`${dir}/src/render.ts`], false, options)
      .ordinary,
    ['e2e/math.spec.ts']
  )
})

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

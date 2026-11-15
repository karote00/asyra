import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const { scripts } = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8')
)

const selected = (script, environment) =>
  script
    .split(' && ')
    .map((command) => command.trim().split(/\s+/))
    .filter(
      (tokens) =>
        tokens[0] === 'vitest' &&
        tokens[1] === 'run' &&
        tokens[tokens.indexOf('--environment') + 1] === environment
    )
    .flat()

test('every explicit test file in App verification scripts exists', () => {
  const missing = Object.entries(scripts)
    .filter(([name]) => /^(test|verify|typecheck|lint)(:|$)/.test(name))
    .flatMap(([name, command]) =>
      [
        ...command.matchAll(
          /(?:[\w.-]+\/)*[\w.-]+\.(?:test|spec)\.[cm]?[jt]sx?\b/g
        )
      ]
        .map(([file]) => file)
        .filter((file) => !existsSync(resolve(import.meta.dirname, '..', file)))
        .map((file) => ({ script: name, file }))
    )

  assert.deepEqual(
    missing,
    [],
    'Missing selectors must not become partial green runs'
  )
})

test('ordinary verification selects the repaired hover, overlay and hierarchy handoffs', () => {
  const files = selected(scripts['test:local'], 'jsdom')

  for (const file of [
    'src/config/__tests__/tool-shortcuts.test.ts',
    'src/features/delete-element/__tests__/index.test.ts',
    'src/render-layers/__tests__/area-selection-render-layer.test.ts',
    'src/controllers/__tests__/canvas-hierarchy-target.test.ts',
    'src/controllers/__tests__/canvas-hierarchy-projection.integration.test.ts'
  ]) {
    assert.ok(files.includes(file), `Missing owner regression: ${file}`)
  }
})

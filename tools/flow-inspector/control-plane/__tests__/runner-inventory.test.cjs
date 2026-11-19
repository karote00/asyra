/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { collectRunnerCases } = require('../runner-inventory.cjs')
const root = path.resolve(__dirname, '../../../..')
const file = 'feature/owner.test.ts'
const options = { root, cwd: root, files: [file], project: '' }

test('Vitest collection retains expanded titles independently of result status', () => {
  assert.deepEqual(
    collectRunnerCases(
      'vitest',
      [
        { file: path.join(root, file), titlePath: ['suite', 'value 1'] },
        { file: path.join(root, file), titlePath: ['suite', 'value 2'] }
      ],
      options
    ),
    [
      { file, title: 'suite value 1' },
      { file, title: 'suite value 2' }
    ]
  )
})

test('Node collection uses registrations including dynamic subtests, not pass events', () => {
  const declarations = [
    { name: 'suite', type: 'suite', testId: 1, parentId: 0 },
    { name: 'parent', type: 'test', testId: 2, parentId: 1 },
    { name: 'child', type: 'test', testId: 3, parentId: 2 }
  ].map((data) => ({
    type: 'test:enqueue',
    data: { ...data, entryFile: path.join(root, file) }
  }))

  assert.deepEqual(collectRunnerCases('node', declarations, options), [
    { file, title: 'suite parent' },
    { file, title: 'suite parent child' }
  ])
  assert.throws(
    () => collectRunnerCases('node', declarations.slice(1), options),
    /parent/
  )
  assert.throws(
    () =>
      collectRunnerCases('node', [...declarations, declarations[1]], options),
    /Duplicate/
  )
})

test('Playwright collection preserves nested suites and project selection without executing tests', () => {
  const value = {
    config: { rootDir: root },
    errors: [],
    suites: [
      {
        title: file,
        specs: [],
        suites: [
          {
            title: 'nested',
            specs: [
              {
                title: 'case',
                file,
                tests: [{ projectName: 'chromium', results: [] }]
              }
            ]
          }
        ]
      }
    ]
  }

  assert.deepEqual(
    collectRunnerCases('playwright', value, {
      ...options,
      project: 'chromium'
    }),
    [{ file, title: 'nested case' }]
  )
  assert.throws(
    () => collectRunnerCases('playwright', value, options),
    /project/
  )
  value.errors.push({ message: 'import failed' })
  assert.throws(
    () =>
      collectRunnerCases('playwright', value, {
        ...options,
        project: 'chromium'
      }),
    /errors/
  )
})

for (const [name, value] of [
  ['empty', []],
  [
    'duplicate',
    [
      { file, titlePath: ['same'] },
      { file, titlePath: ['same'] }
    ]
  ],
  ['foreign file', [{ file: 'other.test.ts', titlePath: ['case'] }]],
  ['missing title', [{ file }]],
  ['lossy display title', [{ file, name: 'suite > test' }]],
  ['foreign project', [{ file, titlePath: ['case'], projectName: 'other' }]]
]) {
  test('collection rejects ' + name, () => {
    assert.throws(() => collectRunnerCases('vitest', value, options))
  })
}

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import * as prettier from 'prettier'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const filePath = path.join(repositoryRoot, 'scripts/readability-example.ts')
const prettierOptions = JSON.parse(
  readFileSync(path.join(repositoryRoot, '.prettierrc'), 'utf8')
)
const readabilityRules = new Set([
  'curly',
  'no-nested-ternary',
  '@stylistic/padding-line-between-statements',
  '@stylistic/lines-between-class-members',
  'readability/object-function-spacing'
])
const eslint = new ESLint({ cwd: repositoryRoot })
const fixer = new ESLint({ cwd: repositoryRoot, fix: true })

async function lint(source, instance = eslint, target = filePath) {
  const [result] = await instance.lintText(source, { filePath: target })

  assert.equal(result.fatalErrorCount, 0)

  return result
}

function messages(result) {
  return result.messages.filter((message) =>
    readabilityRules.has(message.ruleId)
  )
}

const invalidCases = [
  ['single-line if', 'if (ready) run()\n', 'curly'],
  ['single-line else', 'if (ready) { run() } else stop()\n', 'curly'],
  ['single-line loop', 'for (const item of items) run(item)\n', 'curly'],
  ['return paragraph', 'function read() {\n  run()\n  return 1\n}\n'],
  ['after if', 'if (ready) {\n  run()\n}\nstop()\n'],
  [
    'after declaration group',
    'const first = 1\nlet second = 2\nrun(first, second)\n'
  ],
  ['between functions', 'function first() {}\nfunction second() {}\n'],
  [
    'between arrow functions',
    'const first = () => 1\nconst second = () => 2\n'
  ],
  [
    'between function expressions',
    'const first = function () {}\nconst second = function () {}\n'
  ],
  [
    'exported arrow functions',
    'export const first = () => 1\nexport const second = () => 2\n'
  ],
  [
    'exported functions',
    'export function first() {}\nexport function second() {}\n'
  ],
  ['between scopes', '{\n  run()\n}\n{\n  stop()\n}\n'],
  ['after loop', 'while (ready) {\n  run()\n}\nstop()\n'],
  ['after try', 'try {\n  run()\n} finally {\n  stop()\n}\nfinish()\n'],
  [
    'class methods',
    'class Reader {\n  first() {}\n  second() {}\n}\n',
    '@stylistic/lines-between-class-members'
  ],
  [
    'nested ternary',
    'const value = ready ? 1 : busy ? 2 : 3\n',
    'no-nested-ternary'
  ],
  [
    'object methods',
    'const actions = {\n  first() {},\n  second() {}\n}\n',
    'readability/object-function-spacing'
  ],
  [
    'object arrow functions',
    'const actions = {\n  first: () => 1,\n  second: () => 2\n}\n',
    'readability/object-function-spacing'
  ],
  [
    'object function expressions',
    'const actions = {\n  first: function () {},\n  second: function () {}\n}\n',
    'readability/object-function-spacing'
  ],
  [
    'object function and data',
    'const actions = {\n  first() {},\n  value: 1\n}\n',
    'readability/object-function-spacing'
  ],
  [
    'object data and function',
    'const actions = {\n  value: 1,\n  first() {}\n}\n',
    'readability/object-function-spacing'
  ],
  [
    'object spread and function',
    'const actions = {\n  ...base,\n  first() {}\n}\n',
    'readability/object-function-spacing'
  ],
  [
    'comment is not a blank line',
    'const actions = {\n  first() {},\n  // Second action.\n  second() {}\n}\n',
    'readability/object-function-spacing'
  ],
  [
    'blank line inside comment is not padding',
    'const actions = {\n  first() {},\n  /* Second\n\n     action. */\n  second() {}\n}\n',
    'readability/object-function-spacing'
  ]
]

for (const [
  name,
  source,
  rule = '@stylistic/padding-line-between-statements'
] of invalidCases) {
  test(`readability rejects ${name}`, async () => {
    const result = await lint(source)

    assert.ok(
      result.messages.some(
        (message) => message.ruleId === rule && message.severity === 2
      ),
      JSON.stringify(result.messages)
    )
  })
}

const validCases = [
  [
    'class overload group',
    'class Reader {\n  read(value: string): string\n  read(value: number): number\n  read(value: string | number) {\n    return value\n  }\n}\n'
  ],
  [
    'exported overload group',
    'export function read(value: string): string\nexport function read(value: number): number\nexport function read(value: string | number) {\n  return value\n}\n'
  ],

  ['first-statement return', 'function read() {\n  return 1\n}\n'],
  [
    'declaration group',
    'const first = 1\nlet second = 2\n\nrun(first, second)\n'
  ],
  [
    'if else chain',
    'if (ready) {\n  run()\n} else if (busy) {\n  wait()\n} else {\n  stop()\n}\n'
  ],
  [
    'try catch finally',
    'try {\n  run()\n} catch {\n  stop()\n} finally {\n  finish()\n}\n'
  ],
  ['data-only object', 'const values = {\n  first: 1,\n  second: 2\n}\n'],
  ['single object function', 'const actions = { first: () => 1 }\n'],
  [
    'separated object functions',
    'const actions = {\n  first() {},\n\n  // Second action.\n  second() {}\n}\n'
  ],
  [
    'overload group',
    'function read(value: string): string\nfunction read(value: number): number\nfunction read(value: string | number) {\n  return value\n}\n'
  ],
  ['single ternary', 'const value = ready ? 1 : 2\n'],
  ['short circuit order', 'const value = first() || second() || third()\n']
]

for (const [name, source] of validCases) {
  test(`readability accepts ${name}`, async () => {
    assert.deepEqual(messages(await lint(source)), [])
  })
}

const fixCases = [
  [
    'comment before comma',
    'const actions = {\n  first() {} /* First action. */,\n  second() {}\n}\n'
  ],
  [
    'comma on following line',
    'const actions = {\n  first() {}\n  , second() {}\n}\n'
  ],
  [
    'multiline trailing comment',
    'const actions = {\n  first() {}, /* First\n    action. */\n  second() {}\n}\n'
  ],
  [
    'directive comment',
    'const actions = {\n  first() {},\n  // eslint-disable-next-line no-console\n  second() { console.log(1) }\n}\n'
  ],

  ...invalidCases.filter(([, , rule]) => rule !== 'no-nested-ternary'),
  ['inline object', 'const actions = { first: () => 1, second: () => 2 }\n'],
  [
    'trailing comment',
    'const actions = {\n  first() {}, // Keep this with first.\n  // Keep this with second.\n  second() {}\n}\n'
  ],
  [
    'async and generator methods',
    'const actions = {\n  async first() {},\n  *second() {}\n}\n'
  ],
  [
    'accessors',
    'const actions = {\n  get value() { return 1 },\n  set value(next) { run(next) }\n}\n'
  ],
  ['CRLF', 'const actions = {\r\n  first() {},\r\n  second() {}\r\n}\r\n']
]

for (const [name, source] of fixCases) {
  test(`autofix and Prettier converge for ${name}`, async () => {
    const result = await lint(source, fixer)
    const fixed = result.output ?? source
    const formatted = await prettier.format(fixed, {
      ...prettierOptions,
      filepath: filePath
    })

    assert.deepEqual(messages(result), [])
    assert.equal(formatted, fixed)
    assert.deepEqual(messages(await lint(formatted)), [])
    assert.equal((await lint(formatted, fixer)).output, undefined)
  })
}

test('object spacing preserves comment ownership and runtime behavior', async () => {
  const source = `const actions = {
  first() { return 1 }, // First action.
  // Second action.
  second: () => 2
}
return actions.first() + actions.second()
`
  const result = await lint(
    source,
    fixer,
    path.join(repositoryRoot, 'scripts/readability-example.cjs')
  )
  const fixed = result.output ?? source

  assert.match(fixed, /\}, \/\/ First action\.\n\n {2}\/\/ Second action\./u)
  assert.equal(new Function(source)(), new Function(fixed)())
})

test('root config applies readability rules to maintained JS and TS sources', async () => {
  for (const relativePath of [
    'eslint.config.js',
    'scripts/readability-example.mjs',
    'tools/example/index.cjs',
    'packages/utils/src/readability-example.ts',
    'apps/starter-app/src/readability-example.tsx'
  ]) {
    const result = await lint(
      'if (ready) run()\n',
      eslint,
      path.join(repositoryRoot, relativePath)
    )

    assert.ok(result.messages.some((message) => message.ruleId === 'curly'))
  }
})

test('readability tests are part of the permanent script test command', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )

  assert.ok(
    manifest.scripts['test:scripts'].includes(
      'scripts/__tests__/eslint-readability.test.mjs'
    )
  )
})

test('spacing rules preserve frozen evidence and still check current sources', async () => {
  const source = 'function read() {\n  const value = 1\n  return value\n}\n'
  const frozen = await lint(
    source,
    fixer,
    path.join(
      repositoryRoot,
      'apps/asyra-fieldscope/src/domain/__tests__/fixtures/pre-p5b-source/example.ts'
    )
  )

  assert.deepEqual(messages(frozen), [])
  assert.equal(frozen.output, undefined)
  assert.ok(messages(await lint(source)).length > 0)
})

test('CI selects readability tests and full lint when the shared rule module changes', async () => {
  const { classifyChanges, readWorkspaceManifests } =
    await import('../ci-scope.mjs')
  const manifests = readWorkspaceManifests(repositoryRoot)

  for (const input of ['eslint.config.js', 'scripts/eslint-readability.mjs']) {
    const scope = classifyChanges([input], manifests)
    const checks = scope.relationshipMap.executionPlan.checks

    assert.equal(checks.lint.mode, 'full')
    assert.ok(
      checks.repositoryScripts.tests.includes(
        'scripts/__tests__/eslint-readability.test.mjs'
      )
    )
  }
})

test('brace autofix requires manual review of next-line lint directives', async () => {
  const source = `const items = [1]

if (ready)
  // eslint-disable-next-line @typescript-eslint/prefer-for-of -- Keep indexed iteration.
  for (let index = 0; index < items.length; index++) consume(items[index])
`
  const before = await lint(source)
  const after = await lint(source, fixer)

  assert.equal(
    before.messages.some(
      (message) => message.ruleId === '@typescript-eslint/prefer-for-of'
    ),
    false
  )
  // Characterize the upstream fixer limitation; this is not a safe-fix guarantee.
  assert.ok(
    after.messages.some(
      (message) => message.ruleId === '@typescript-eslint/prefer-for-of'
    )
  )
  assert.equal(after.output.includes('eslint-disable-next-line'), false)
})

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const { completeReportIssues } = require('../runner-report.cjs')
const path = require('node:path')
const root = path.resolve(__dirname, '../../../..')
// Required files are declared independently of either runner selection or results.
const requiredFiles = ['feature/request.test.ts', 'feature/consumer.test.ts']

const requiredCases = requiredFiles.flatMap((file) =>
  ['preserves the owner contract', 'preserves the recovery contract'].map(
    (title) => ({ file, title })
  )
)

const report = () => ({
  success: true,
  testResults: requiredFiles.map((file) => ({
    name: path.join(root, file),
    assertionResults: [
      { fullName: 'preserves the owner contract', status: 'passed' },
      { fullName: 'preserves the recovery contract', status: 'passed' }
    ]
  }))
})

const inspect = (value) =>
  completeReportIssues(value, { root, requiredFiles, requiredCases })

test('complete runner evidence admits all independently required files', () => {
  assert.deepEqual(inspect(report()), [])
})

for (const [field, value] of [
  ['numFailedTestSuites', 1],
  ['numFailedTestSuites', -1],
  ['numFailedTestSuites', '0'],
  ['numFailedTestSuites', 0.5],
  ['numPendingTestSuites', 1]
]) {
  test(`complete evidence rejects contradictory suite summary ${field}=${value}`, () => {
    const valueReport = report()

    valueReport[field] = value
    assert.notDeepEqual(inspect(valueReport), [])
  })
}

test('complete evidence accepts zero failed and pending suites with passing cases', () => {
  const value = report()

  value.numFailedTestSuites = 0
  value.numPendingTestSuites = 0
  assert.deepEqual(inspect(value), [])
})
for (const [name, corrupt, reason] of [
  [
    'omitted case inside a nonempty file with self-consistent totals',
    (r) => {
      r.testResults[0].assertionResults.pop()
      r.numTotalTests = 3
      r.numPassedTests = 3
    },
    /Missing required test case/
  ],
  [
    'uncollected case substituted for a required case',
    (r) => {
      r.testResults[0].assertionResults[1].fullName = 'uncollected'
    },
    /Unexpected test case/
  ],
  [
    'missing required owner',
    (r) => r.testResults.pop(),
    /Missing required test file/
  ],
  [
    'empty owner',
    (r) => {
      r.testResults[1].assertionResults = []
    },
    /No executed assertions/
  ],
  [
    'unknown owner',
    (r) => {
      r.testResults[1].name = path.join(root, 'unexpected.test.ts')
    },
    /Unexpected test file/
  ],
  [
    'duplicate complete file observation',
    (r) => r.testResults.push(structuredClone(r.testResults[0])),
    /Duplicate assertion/
  ],
  [
    'duplicate assertion',
    (r) =>
      r.testResults[0].assertionResults.push(
        structuredClone(r.testResults[0].assertionResults[0])
      ),
    /Duplicate assertion/
  ],
  [
    'pending assertion',
    (r) => {
      r.testResults[0].assertionResults[0].status = 'pending'
    },
    /Unsuccessful assertion/
  ],
  [
    'todo assertion',
    (r) => {
      r.testResults[0].assertionResults[0].status = 'todo'
    },
    /Unsuccessful assertion/
  ],
  [
    'failed assertion hidden by success',
    (r) => {
      r.testResults[0].assertionResults[0].status = 'failed'
    },
    /Unsuccessful assertion/
  ],
  [
    'missing assertion identity',
    (r) => {
      delete r.testResults[0].assertionResults[0].fullName
    },
    /Malformed assertion/
  ],
  [
    'missing completion',
    (r) => {
      delete r.success
    },
    /Missing successful runner completion/
  ],
  [
    'runtime error',
    (r) => {
      r.numRuntimeErrorTestSuites = 1
    },
    /runtime errors/
  ]
]) {
  test('whole-feature evidence rejects ' + name, () => {
    const value = report()

    corrupt(value)
    assert.match(inspect(value).join('\n'), reason)
  })
}

test('a runner cannot redefine completeness by submitting an empty required scope', () => {
  assert.throws(
    () => completeReportIssues(report(), { root, requiredFiles: [] }),
    /required file scope/
  )
})

test('whole-run admission accepts distinct case rows from the formal Playwright normalizer', () => {
  const { normalizeReport } = require('../playwright-results.cjs')
  const file = 'apps/asyra-design/e2e/ai-conversation-flow.spec.ts'
  const original = {
    config: {
      rootDir: path.join(root, 'apps/asyra-design/e2e'),
      configFile: path.join(root, 'apps/asyra-design/playwright.config.ts')
    },
    stats: { startTime: '2026-01-01T00:00:01.000Z' },
    errors: [],
    suites: [
      {
        title: file,
        specs: ['first handoff', 'second handoff'].map((title, index) => ({
          id: 'case-' + index,
          title,
          file: 'ai-conversation-flow.spec.ts',
          line: index + 1,
          column: 1,
          tests: [
            {
              projectName: 'chromium',
              expectedStatus: 'passed',
              status: 'expected',
              results: [
                { status: 'passed', retry: 0, errors: [], attachments: [] }
              ]
            }
          ]
        }))
      }
    ]
  }
  const normalized = normalizeReport(
    root,
    {
      startedAt: '2026-01-01T00:00:00.000Z',
      contracts: [
        { configFile: 'apps/asyra-design/playwright.config.ts', cases: [] }
      ]
    },
    original
  )

  assert.deepEqual(normalized.options.errors, [])
  assert.deepEqual(
    completeReportIssues(normalized.report, {
      root,
      requiredFiles: [file],
      requiredCases: [
        { file, title: 'first handoff' },
        { file, title: 'second handoff' }
      ]
    }),
    []
  )
  normalized.report.testResults.push(
    globalThis.structuredClone(normalized.report.testResults[0])
  )
  assert.match(
    completeReportIssues(normalized.report, {
      root,
      requiredFiles: [file],
      requiredCases: [
        { file, title: 'first handoff' },
        { file, title: 'second handoff' }
      ]
    }).join('\n'),
    /Duplicate assertion/
  )
})

for (const cases of [
  undefined,
  [],
  requiredCases.slice(0, 1),
  [...requiredCases, requiredCases[0]]
]) {
  test(
    'whole-run admission rejects missing or invalid independent case inventory ' +
      JSON.stringify(cases),
    () => {
      assert.throws(
        () =>
          completeReportIssues(report(), {
            root,
            requiredFiles,
            requiredCases: cases
          }),
        /required case/
      )
    }
  )
}

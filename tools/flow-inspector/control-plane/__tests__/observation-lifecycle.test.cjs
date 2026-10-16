/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const {
  canSupersede,
  recordDigest,
  executionIdentity,
  matchesExecution
} = require('../observation-lifecycle.cjs')
function pair() {
  const item = {
    file: 'case.test.ts',
    testName: 'case',
    projectName: 'chromium'
  }
  const previous = {
    id: randomUUID(),
    phase: 'completed',
    startedAt: '2026-01-01T00:00:00Z',
    finishedAt: '2026-01-01T00:00:01Z',
    cases: [],
    issues: ['No Playwright cases recorded'],
    contracts: [{ manifestPath: 'manifest.json', digest: 'a'.repeat(64) }],
    report: {
      config: {},
      suites: [],
      stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 0 },
      errors: [{ message: 'Error: No tests found.' }]
    },
    intent: { version: 1, cases: [item] }
  }
  const next = {
    ...previous,
    id: randomUUID(),
    startedAt: '2026-01-01T00:00:02Z',
    finishedAt: '2026-01-01T00:00:03Z',
    issues: [],
    report: null,
    cases: [{ ...item, status: 'passed', resolution: 'mapped' }],
    correction: {
      version: 1,
      predecessorId: previous.id,
      predecessorDigest: recordDigest(previous),
      reason: 'Correct selector'
    }
  }
  return { previous, next }
}
test('discovery recovery is distinct from assertion recovery and rejects uncertain successors', () => {
  for (const status of ['passed', 'failed']) {
    const { previous, next } = pair()
    next.cases[0].status = status
    assert.equal(canSupersede(previous, next), true)
  }
  for (const mutate of [
    (p, n) => {
      n.cases = []
    },
    (p, n) => {
      n.cases[0].status = 'skipped'
    },
    (p, n) => {
      n.cases[0].resolution = 'stale'
    },
    (p, n) => {
      n.phase = 'running'
    },
    (p, n) => {
      n.startedAt = p.startedAt
    },
    (p, n) => {
      n.id = p.id
    },
    (p, n) => {
      n.issues = ['canceled']
    },
    (p, n) => {
      n.correction.predecessorDigest = 'b'.repeat(64)
    },
    (p, n) => {
      n.cases[0].projectName = 'firefox'
    },
    (p, n) => {
      n.cases[0].testName = 'unrelated'
    },
    (p, n) => {
      n.contracts = [{ manifestPath: 'other', digest: 'b'.repeat(64) }]
    },
    (p, n) => {
      n.cases.push({ ...n.cases[0] })
    },
    (p, n) => {
      p.intent.cases.push({ ...p.intent.cases[0], testName: 'sibling' })
      n.intent = {
        version: 1,
        cases: [
          {
            file: n.cases[0].file,
            testName: n.cases[0].testName,
            projectName: n.cases[0].projectName
          }
        ]
      }
      n.correction.predecessorDigest = recordDigest(p)
    },
    (p, n) => {
      p.issues.push('unrelated setup error')
      n.correction.predecessorDigest = recordDigest(p)
    },
    (p, n) => {
      n.command = { environment: { FLOW_RESULT_REPOSITORY: 'another' } }
    }
  ]) {
    const { previous, next } = pair()
    mutate(previous, next)
    assert.equal(canSupersede(previous, next), false, mutate.toString())
  }
})
test('CI identity is explicit and cannot enter local current evidence', () => {
  const { next } = pair()
  assert.equal(matchesExecution(next), true)
  next.command = {
    environment: {
      FLOW_RESULT_REPOSITORY: 'org/repo',
      FLOW_RESULT_BASE: 'a'.repeat(40),
      FLOW_RESULT_HEAD: 'b'.repeat(40),
      FLOW_RESULT_INTEGRATION: 'c'.repeat(40),
      FLOW_RESULT_RUN: '1',
      FLOW_RESULT_ATTEMPT: '2'
    }
  }
  const identity = executionIdentity(next)
  assert.equal(matchesExecution(next), false)
  assert.equal(matchesExecution(next, identity), true)
  assert.equal(
    matchesExecution(next, { ...identity, head: 'd'.repeat(40) }),
    false
  )
})
test('post-hoc correction cannot narrow the successor declared execution intent', () => {
  const { previous, next } = pair()
  const relationIntent = structuredClone(next.intent)
  next.intent = {
    version: 1,
    cases: [
      ...relationIntent.cases,
      { ...relationIntent.cases[0], testName: 'unexecuted sibling' }
    ]
  }
  assert.equal(
    canSupersede(previous, next, next.correction, relationIntent),
    false
  )
})

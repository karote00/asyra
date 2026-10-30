/* global structuredClone */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
function fixture() {
  const root = fileURLToPath(new URL('../../../../../', import.meta.url))
  fs.mkdirSync(path.join(root, 'tmp'), { recursive: true })
  const directory = fs.mkdtempSync(path.join(root, 'tmp/attribution-test-'))
  const records = path.join(directory, 'records')
  fs.mkdirSync(records)
  const rows = [
    {
      event: 'ai_request_started',
      schemaVersion: 2,
      sequence: 0,
      requestId: 'drawing',
      sourceRequestId: 'source',
      provider: 'local-codex',
      purpose: 'drawing',
      startedAt: '2026-10-21T00:00:00Z',
      model: 'gpt-6-astra',
      effort: 'medium'
    },
    {
      event: 'ai_request_usage',
      schemaVersion: 2,
      sequence: 1,
      requestId: 'drawing',
      outcome: 'completed',
      durationMs: 20
    }
  ]
  fs.writeFileSync(
    path.join(records, 'drawing.jsonl'),
    rows.map((r) => JSON.stringify(r)).join('\n')
  )
  const run = {
    id: 'fixture',
    sentAt: '2026-10-21T00:00:00Z',
    elapsedMs: 30,
    outcome: 'success',
    sourceRequestIds: ['source'],
    recordingDirectory: records,
    expectedModel: { model: 'gpt-6-astra', effort: 'medium' },
    evidence: Object.fromEntries(
      [
        'final-view',
        'persistence',
        'checkpoint',
        'recording',
        'reload',
        'source-verification',
        'cleanup-browser',
        'cleanup-browser-server'
      ].map((key) => [key, { status: 'complete' }])
    )
  }
  const bytes = JSON.stringify(run)
  fs.writeFileSync(path.join(directory, 'run.json'), bytes)
  fs.writeFileSync(
    path.join(directory, 'facts.json'),
    JSON.stringify({ result: 'partial', 'a/b': { '~': false } })
  )
  const reference = {
    root: '.',
    path: 'facts.json',
    sha256: digest(fs.readFileSync(path.join(directory, 'facts.json'))),
    pointer: '/result'
  }
  const assessment = {
    version: 1,
    runSha256: digest(bytes),
    reviewer: { name: 'Test analyst', mode: 'self-review' },
    changes: [
      {
        id: 'receipt',
        component: 'tool',
        description: 'Explicit receipt',
        method: 'single-run',
        proposedEffect: 'helped',
        observation: 'A partial result remains visible.',
        support: [reference],
        counterevidence: [],
        limitations: [
          'No control run; transport completion does not prove owner success.'
        ],
        lesson: {
          cue: 'Partial receipt',
          observation:
            'Inspect the child outcomes before reporting completion.',
          reviewed: true
        }
      }
    ]
  }
  const output = path.join(directory, 'analysis.json')
  return {
    directory,
    assessment,
    reference,
    output,
    invoke(value = assessment, args) {
      if (value) {
        fs.writeFileSync(
          path.join(directory, 'assessment.json'),
          JSON.stringify(value)
        )
      }
      return spawnSync(
        process.execPath,
        [
          fileURLToPath(new URL('../analyze.mjs', import.meta.url)),
          directory,
          ...(args ??
            (value
              ? ['--assessment', path.join(directory, 'assessment.json')]
              : []))
        ],
        { encoding: 'utf8' }
      )
    },
    read: () => JSON.parse(fs.readFileSync(output)),
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true })
  }
}

test('CLI binds descriptive change attribution and report lessons without asserting causal improvement', () => {
  const f = fixture()
  try {
    assert.equal(f.invoke().status, 0)
    const report = f.read().attribution
    assert.equal(report.changes[0].effect, 'confounded')
    assert.equal(report.changes[0].proposedEffect, 'helped')
    assert.equal(report.changes[0].support[0].value, 'partial')
    assert.equal(report.changes[0].experience.decision, 'retain')
    assert.equal(report.changes[0].experience.scope, 'observed-only')
    assert.deepEqual(report.reviewer, f.assessment.reviewer)
    assert.equal(f.read().streams[0].providerOutcome, 'completed')
  } finally {
    f.cleanup()
  }
})
test('CLI absence means not-assessed and NO_ENTRY; unexpected options are errors', () => {
  const f = fixture()
  try {
    assert.equal(f.invoke(null).status, 0)
    assert.equal(f.read().attribution.status, 'not-assessed')
    assert.equal(f.read().attribution.experience.decision, 'NO_ENTRY')
    assert.notEqual(f.invoke(null, ['--invented']).status, 0)
  } finally {
    f.cleanup()
  }
})
test('CLI refuses stale, forged and malformed evidence before replacing existing analysis', () => {
  const f = fixture()
  try {
    for (const mutate of [
      (a) => {
        a.runSha256 = '0'.repeat(64)
      },
      (a) => {
        a.changes[0].support[0].sha256 = '0'.repeat(64)
      },
      (a) => {
        a.changes[0].support[0].pointer = '/missing'
      },
      (a) => {
        a.changes[0].support[0].path = '../run.json'
      },
      (a) => {
        a.changes[0].counterevidence = [{ ...f.reference, pointer: '/missing' }]
      },
      (a) => {
        a.changes.push(structuredClone(a.changes[0]))
      },
      (a) => {
        a.changes[0].proposedEffect = 'unknown'
      },
      (a) => {
        a.changes[0].extra = 'ignored contract'
      },
      (a) => {
        a.changes[0].support[0].lines = [1, 1]
      },
      (a) => {
        a.reviewer.mode = 'independent-model'
      }
    ]) {
      const a = structuredClone(f.assessment)
      mutate(a)
      fs.writeFileSync(f.output, 'preserved')
      assert.notEqual(f.invoke(a).status, 0)
      assert.equal(fs.readFileSync(f.output, 'utf8'), 'preserved')
    }
  } finally {
    f.cleanup()
  }
})
test('CLI supports escaped JSON pointers, line references and explicit counterevidence', () => {
  const f = fixture()
  try {
    const c = f.assessment.changes[0]
    c.support[0].pointer = '/a~1b/~0'
    c.counterevidence = [
      {
        root: 'records',
        path: 'drawing.jsonl',
        sha256: digest(
          fs.readFileSync(path.join(f.directory, 'records/drawing.jsonl'))
        ),
        lines: [2, 2]
      }
    ]
    assert.equal(f.invoke().status, 0)
    assert.equal(f.read().attribution.changes[0].support[0].value, false)
    assert.equal(
      f.read().attribution.changes[0].experience.counterevidence.length,
      1
    )
    c.counterevidence[0].lines = [2, 3]
    assert.notEqual(f.invoke().status, 0)
  } finally {
    f.cleanup()
  }
})
test('CLI does not retain unsupported, unreviewed, unbounded or unexercised lessons', () => {
  const f = fixture()
  try {
    for (const mutate of [
      (c) => {
        c.support = []
      },
      (c) => {
        c.limitations = []
      },
      (c) => {
        c.lesson.reviewed = false
      },
      (c) => {
        delete c.lesson
      },
      (c) => {
        c.proposedEffect = 'not-exercised'
      }
    ]) {
      const a = structuredClone(f.assessment)
      mutate(a.changes[0])
      assert.equal(f.invoke(a).status, 0)
      assert.equal(
        f.read().attribution.changes[0].experience.decision,
        'NO_ENTRY'
      )
    }
  } finally {
    f.cleanup()
  }
})
test('CLI rejects symlink escape even with a matching digest', () => {
  const f = fixture()
  try {
    fs.symlinkSync('../facts.json', path.join(f.directory, 'records/link.json'))
    Object.assign(f.assessment.changes[0].support[0], {
      root: 'records',
      path: 'link.json'
    })
    assert.notEqual(f.invoke().status, 0)
  } finally {
    f.cleanup()
  }
})
test('deterministic observations remain tool-scoped; historical and Knowledge claims cannot inherit test success', () => {
  const f = fixture()
  try {
    const c = f.assessment.changes[0]
    c.method = 'deterministic-regression'
    assert.equal(f.invoke().status, 0)
    assert.equal(f.read().attribution.changes[0].effect, 'helped')
    c.component = 'knowledge'
    assert.notEqual(f.invoke().status, 0)
    c.method = 'historical-comparison'
    assert.equal(f.invoke().status, 0)
    assert.equal(f.read().attribution.changes[0].effect, 'confounded')
  } finally {
    f.cleanup()
  }
})

/* global structuredClone, Response */
import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeCalls, verifyPreservation, readPayload } from '../analyze.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { URL, fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

test('analysis refuses incomplete capture rather than emitting a successful report', () => {
  const root = fileURLToPath(new URL('../../../../../..', import.meta.url))
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/knowledge-capture-test-')
  )
  try {
    fs.mkdirSync(path.join(directory, 'apps/asyra-design/tmp/ai-executions'), {
      recursive: true
    })
    for (const run of [
      { outcome: 'success' },
      {
        sentAt: '2026-10-18T10:00:00Z',
        elapsedMs: 2000,
        outcome: 'success',
        failure: 'save capture failed'
      },
      {
        sentAt: '2026-10-18T10:00:00Z',
        elapsedMs: 2000,
        outcome: 'success',
        evidence: {
          persistence: { status: 'failed', error: 'Handle unavailable' },
          recording: { status: 'complete' },
          'read-only-recovery': { status: 'complete' }
        }
      },
      {
        sentAt: '2026-10-18T10:00:00Z',
        elapsedMs: 2000,
        outcome: 'success',
        cleanupStopFailure: 'Browser termination failed'
      }
    ]) {
      fs.writeFileSync(path.join(directory, 'run.json'), JSON.stringify(run))
      const result = spawnSync(
        process.execPath,
        [fileURLToPath(new URL('../analyze.mjs', import.meta.url)), directory],
        { cwd: directory }
      )
      assert.notEqual(result.status, 0, 'incomplete capture must fail analysis')
      assert.equal(fs.existsSync(path.join(directory, 'analysis.json')), false)
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('knowledge observations require matching actual completed tool calls', () => {
  const start = {
    stage: 'tool_started',
    tool: 'read_knowledge',
    callId: 'read',
    elapsedMs: 5
  }
  assert.equal(summarizeCalls([start]).knowledgeCalls.length, 0)
  const result = summarizeCalls([
    start,
    { stage: 'tool_completed', callId: 'other', elapsedMs: 10 },
    { stage: 'tool_completed', callId: 'read', elapsedMs: 12 }
  ])
  assert.equal(result.knowledgeCalls.length, 1)
  assert.equal(result.knowledgeCalls[0].elapsedMs, 7)
  assert.equal(result.incomplete.length, 0)
})
test('precision evidence rejects recreated IDs, collateral edits and extra target changes', () => {
  const before = {
    elements: Object.fromEntries(
      ['a', 'b', 'c'].map((id) => [
        id,
        { id, props: { dimension: id + '-dim' } }
      ])
    ),
    document: {
      props: Object.fromEntries(
        ['a', 'b', 'c'].map((id) => [id + '-dim', { width: 80, height: 60 }])
      )
    }
  }
  const after = structuredClone(before)
  after.document.props['b-dim'].width = 140
  assert.deepEqual(
    verifyPreservation(before, after, ['a', 'b', 'c'], 'width', 140),
    { unchanged: true, targetCorrect: true, sameIds: true }
  )
  after.document.props['c-dim'].width = 90
  assert.equal(
    verifyPreservation(before, after, ['a', 'b', 'c'], 'width', 140).unchanged,
    false
  )
  after.document.props['b-dim'].height = 61
  assert.equal(
    verifyPreservation(before, after, ['a', 'b', 'c'], 'width', 140)
      .targetCorrect,
    false
  )
  delete after.elements.b
  after.elements.d = { width: 140 }
  assert.equal(
    verifyPreservation(before, after, ['a', 'b', 'c'], 'width', 140).sameIds,
    false
  )
})

import {
  qualityScenario,
  withoutAdvice,
  withAdviceFixture
} from '../quality.mjs'

test('content arms use identical prompts and ablation preserves metadata only', () => {
  const spec = JSON.parse(
    fs.readFileSync(new URL('../quality-cases.json', import.meta.url))
  )
  const selected = qualityScenario(spec, 'documentation-actions')
  assert.equal(selected.deadlineMs, 600000)
  assert.deepEqual(selected.modules, ['design.docs-page'])
  const original =
    '---\n{"description":"Example","references":["colors"]}\n---\nActual advice'
  assert.equal(
    withoutAdvice(original).split('---')[1],
    original.split('---')[1]
  )
  assert.equal(withoutAdvice(original).includes('Actual advice'), false)
  assert.throws(() => qualityScenario(spec, 'missing'))
})

test('content fixture restores original bytes after failed execution', async () => {
  const root = fileURLToPath(new URL('../../../../../..', import.meta.url))
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/knowledge-fixture-test-')
  )
  const file = path.join(directory, 'module.md')
  const original = '---\n{"description":"Example"}\n---\nOriginal advice\n'
  fs.writeFileSync(file, original)
  try {
    await assert.rejects(
      withAdviceFixture([file], true, async () => {
        assert.equal(
          fs.readFileSync(file, 'utf8').includes('Original advice'),
          false
        )
        throw new Error('runner failed')
      }),
      /runner failed/
    )
    assert.equal(fs.readFileSync(file, 'utf8'), original)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

import { captureCheckpoint } from '../checkpoint.mjs'

test('streamed checkpoint evidence requires the exact persistence receipt and canonical document', async () => {
  const root = fileURLToPath(new URL('../../../../../..', import.meta.url))
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/knowledge-checkpoint-test-')
  )
  const filename = path.join(directory, 'checkpoint.json')
  const receipt = { sequence: 4, durableSequence: 4, documentGeneration: 2 }
  const body = {
    documentGeneration: 2,
    durableSequence: 4,
    checkpoint: { version: '1.0.0', sceneTree: {}, props: {} }
  }
  let captureIndex = 0
  const run = (value, status = 200) =>
    captureCheckpoint({
      url: 'http://127.0.0.1/checkpoint',
      filename: `${filename}-${captureIndex++}`,
      receipt,
      request: async () => new Response(JSON.stringify(value), { status })
    })
  try {
    assert.equal((await run(body)).durableSequence, 4)
    await assert.rejects(run(body, 500), /HTTP 500/)
    await assert.rejects(run({ ...body, durableSequence: 3 }), /receipt/)
    await assert.rejects(run({ ...body, documentGeneration: 1 }), /receipt/)
    await assert.rejects(run({ ...body, checkpoint: {} }), /canonical/)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

import { verifyQualitySnapshot } from '../quality.mjs'

test('quality receipt rejects missing, extra and duplicated editable text and wrong dimensions', () => {
  const snapshot = {
    elements: {
      root: { parentId: 'workspace', props: { dimension: 'size' } },
      title: { type: 'text', props: { typography: 'copy' } }
    },
    document: {
      props: {
        size: { width: 640, height: 480 },
        copy: { text: 'Hello\nworld' }
      }
    }
  }
  const expected = { width: 640, height: 480, text: ['Hello world'] }
  assert.deepEqual(verifyQualitySnapshot(snapshot, expected), {
    exactText: true,
    exactDimensions: true
  })
  snapshot.elements.extra = { type: 'text', props: { typography: 'copy' } }
  assert.equal(verifyQualitySnapshot(snapshot, expected).exactText, false)
  delete snapshot.elements.extra
  snapshot.document.props.copy.text = 'Other text'
  assert.equal(verifyQualitySnapshot(snapshot, expected).exactText, false)
  delete snapshot.document.props.copy
  assert.equal(verifyQualitySnapshot(snapshot, expected).exactText, false)
  snapshot.document.props.size.width = 641
  assert.equal(verifyQualitySnapshot(snapshot, expected).exactDimensions, false)
})

test('analysis requires exact request records, complete Runtime evidence and every required capture stage', () => {
  const root = fileURLToPath(new URL('../../../../../', import.meta.url))
  fs.mkdirSync(path.join(root, 'tmp'), { recursive: true })
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/knowledge-analysis-review-')
  )
  const records = path.join(directory, 'records')
  const defaultRecords = path.join(
    directory,
    'apps/asyra-design/tmp/ai-executions'
  )
  fs.mkdirSync(records)
  fs.mkdirSync(defaultRecords, { recursive: true })
  const entry = (id, source = 'wanted-source') => [
    {
      event: 'ai_request_started',
      schemaVersion: 2,
      sequence: 0,
      requestId: id,
      sourceRequestId: source,
      provider: 'local-codex',
      purpose: 'drawing',
      startedAt: '2026-10-18T10:00:00Z',
      model: 'gpt-6-astra',
      effort: 'medium'
    },
    {
      event: 'ai_request_usage',
      schemaVersion: 2,
      sequence: 1,
      requestId: id,
      outcome: 'completed',
      durationMs: 20
    }
  ]
  const write = (folder, name, rows) =>
    fs.writeFileSync(
      path.join(folder, name + '.jsonl'),
      rows.map((r) => JSON.stringify(r)).join('\n')
    )
  const base = {
    sentAt: '2026-10-18T10:00:00Z',
    elapsedMs: 30,
    outcome: 'success',
    sourceRequestIds: ['wanted-source'],
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
  const invoke = (run) => {
    fs.rmSync(path.join(directory, 'analysis.json'), { force: true })
    fs.writeFileSync(path.join(directory, 'run.json'), JSON.stringify(run))
    return spawnSync(
      process.execPath,
      [fileURLToPath(new URL('../analyze.mjs', import.meta.url)), directory],
      { cwd: directory, encoding: 'utf8' }
    )
  }
  try {
    // Put a concurrent unrelated request in both locations; time proximity is not identity.
    write(defaultRecords, 'unrelated', entry('unrelated', 'another-source'))
    write(records, 'unrelated', entry('unrelated', 'another-source'))
    assert.notEqual(
      invoke(base).status,
      0,
      'missing matching request cannot produce a report'
    )
    write(records, 'wanted', entry('wanted'))
    const passed = invoke(base)
    assert.equal(passed.status, 0, passed.stderr)
    assert.deepEqual(
      JSON.parse(
        fs.readFileSync(path.join(directory, 'analysis.json'))
      ).streams.map((s) => s.file),
      ['wanted.jsonl']
    )
    assert.notEqual(
      invoke({ ...base, sourceRequestIds: ['wanted-source', 'wanted-source'] })
        .status,
      0,
      'one recording cannot satisfy two observed attempts'
    )
    write(records, 'copy', entry('wanted'))
    assert.notEqual(
      invoke(base).status,
      0,
      'duplicate recording identity cannot count twice'
    )
    fs.rmSync(path.join(records, 'copy.jsonl'))
    write(records, 'retry', entry('retry'))
    const repeated = invoke({
      ...base,
      sourceRequestIds: ['wanted-source', 'wanted-source']
    })
    assert.equal(repeated.status, 0, repeated.stderr)
    fs.rmSync(path.join(records, 'retry.jsonl'))
    const nested = entry('nested', 'wanted')
    nested[0].purpose = 'review'
    write(records, 'nested', nested)
    const withNested = invoke(base)
    assert.equal(withNested.status, 0, withNested.stderr)
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(directory, 'analysis.json')))
        .streams.map((stream) => stream.requestId)
        .sort(),
      ['nested', 'wanted']
    )
    fs.rmSync(path.join(records, 'nested.jsonl'))
    const missingStage = structuredClone(base)
    delete missingStage.evidence.reload
    assert.notEqual(invoke(missingStage).status, 0)
    assert.notEqual(invoke({ ...base, sourceRequestIds: [] }).status, 0)
    write(records, 'wanted', entry('wanted').slice(0, 1))
    assert.notEqual(
      invoke(base).status,
      0,
      'unterminated request must remain incomplete'
    )
    const gap = entry('wanted')
    gap[1].sequence = 2
    write(records, 'wanted', gap)
    assert.notEqual(
      invoke(base).status,
      0,
      'sequence gap must not be treated as complete'
    )
    const failedProvider = entry('wanted')
    failedProvider[1].outcome = 'failed'
    write(records, 'wanted', failedProvider)
    assert.notEqual(
      invoke(base).status,
      0,
      'UI success cannot override a failed provider request'
    )
    write(records, 'wanted', entry('wanted'))
    assert.notEqual(
      invoke({ ...base, outcome: 'cancelled' }).status,
      0,
      'complete capture is not successful generation'
    )
    const wrongModel = entry('wanted')
    wrongModel[0].model = 'other-model'
    write(records, 'wanted', wrongModel)
    assert.notEqual(invoke(base).status, 0)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('payload evidence refuses missing, corrupted and escaped content', () => {
  const root = fileURLToPath(new URL('../../../../../', import.meta.url))
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/knowledge-payload-review-')
  )
  try {
    assert.throws(
      () => readPayload(directory, { path: 'missing.json', sha256: 'missing' }),
      /ENOENT/
    )
    fs.writeFileSync(path.join(directory, 'payload.json'), '{}')
    assert.throws(
      () => readPayload(directory, { path: 'payload.json', sha256: 'wrong' }),
      /digest mismatch/
    )
    assert.throws(
      () => readPayload(directory, { path: '../other.json', sha256: 'wrong' }),
      /escapes/
    )
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

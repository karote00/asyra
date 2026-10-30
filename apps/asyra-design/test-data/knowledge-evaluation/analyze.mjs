/* global console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { parseExecutionRecord } from '@asyra/ai-agent-runtime'
import { observeKnowledgeUse } from './representation.mjs'
import { assessRecordedChanges } from './assessment.mjs'
import { restorePublicActivity } from './public-activity.mjs'

export function summarizeCalls(rows) {
  const starts = new Map()
  const calls = []
  for (const row of rows) {
    if (row.stage === 'tool_started') {
      starts.set(row.callId, row)
    }
    if (!['tool_completed', 'tool_failed'].includes(row.stage)) {
      continue
    }
    const start = starts.get(row.callId)
    if (!start) {
      continue
    }
    calls.push({
      tool: start.tool,
      callId: row.callId,
      elapsedMs: row.elapsedMs - start.elapsedMs,
      input: start.diagnostic?.input?.payload ?? null,
      output: row.diagnostic?.output?.payload ?? null,
      status: row.diagnostic?.output?.execution?.status ?? row.stage
    })
    starts.delete(row.callId)
  }
  return {
    calls,
    incomplete: [...starts.values()].map((row) => ({
      tool: row.tool,
      callId: row.callId
    })),
    knowledgeCalls: calls.filter((row) =>
      ['discover_knowledge', 'read_knowledge'].includes(row.tool)
    )
  }
}

const stable = (value) => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stable).join(',') + ']'
  }
  return (
    '{' +
    Object.keys(value)
      .sort()
      .map((key) => JSON.stringify(key) + ':' + stable(value[key]))
      .join(',') +
    '}'
  )
}
const elementState = (snapshot, id) => {
  const element = snapshot.elements[id]
  if (!element) {
    return null
  }
  const props = {}
  const visit = (value) => {
    if (
      typeof value === 'string' &&
      snapshot.document.props[value] &&
      !props[value]
    ) {
      props[value] = snapshot.document.props[value]
      Object.values(props[value]).forEach(visit)
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(visit)
    }
  }
  visit(element.props)
  return { element, props }
}
export function verifyPreservation(before, after, seed, field, expected) {
  if (!Array.isArray(seed) || seed.length !== 3) {
    throw new Error('Expected three seeded IDs')
  }
  const [left, target, right] = seed
  const unchanged = [left, right].every(
    (id) => stable(elementState(before, id)) === stable(elementState(after, id))
  )
  const expectedState = JSON.parse(JSON.stringify(elementState(before, target)))
  const result = elementState(after, target)
  if (!expectedState || !result) {
    return { unchanged, targetCorrect: false, sameIds: false }
  }
  const dimensionId = expectedState.element.props.dimension
  if (!expectedState.props[dimensionId]) {
    throw new Error('Missing canonical dimension')
  }
  expectedState.props[dimensionId][field] = expected
  return {
    unchanged,
    targetCorrect: stable(expectedState) === stable(result),
    sameIds:
      stable(Object.keys(before.elements).sort()) ===
      stable(Object.keys(after.elements).sort())
  }
}

export function readPayload(directory, reference) {
  if (!reference) {
    return null
  }
  const filename = path.resolve(directory, reference.path)
  if (!filename.startsWith(path.resolve(directory) + path.sep)) {
    throw new Error('Payload escapes evidence directory')
  }
  const bytes = fs.readFileSync(filename)
  if (createHash('sha256').update(bytes).digest('hex') !== reference.sha256) {
    throw new Error('Payload digest mismatch')
  }
  return JSON.parse(bytes)
}

/** Resolve exact native reply images; never recapture or fetch replacement pixels. */
export function restoreToolImages(directory, rows) {
  const expected = new Map()
  for (const row of rows) {
    if (row.stage === 'tool_completed' && row.evidence?.imageCount > 0) {
      expected.set(row.callId, row.evidence.imageCount)
    }
  }
  const root = fs.realpathSync(directory)
  const images = []
  const identities = new Set()
  for (const row of rows) {
    if (row.stage !== 'asset_retained' || !row.evidence?.callId) {
      continue
    }
    const { callId, contentIndex, mediaType, status, asset } = row.evidence
    const key = JSON.stringify([callId, contentIndex])
    if (
      status !== 'submitted' ||
      !Number.isSafeInteger(contentIndex) ||
      contentIndex < 1 ||
      contentIndex > (expected.get(callId) ?? 0) ||
      identities.has(key) ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(mediaType)
    ) {
      throw new Error('Invalid or duplicate image delivery identity')
    }
    identities.add(key)
    if (
      asset?.status !== 'queued' ||
      typeof asset.path !== 'string' ||
      !Number.isSafeInteger(asset.bytes) ||
      asset.bytes < 1
    ) {
      throw new Error('Submitted image asset was not retained')
    }
    const target = fs.realpathSync(path.resolve(root, asset.path))
    if (!target.startsWith(root + path.sep)) {
      throw new Error('Image asset escapes evidence directory')
    }
    const bytes = fs.readFileSync(target)
    if (
      bytes.length !== asset.bytes ||
      createHash('sha256').update(bytes).digest('hex') !== asset.sha256
    ) {
      throw new Error('Image asset digest or size mismatch')
    }
    images.push({
      callId,
      contentIndex,
      mediaType,
      path: asset.path,
      bytes: asset.bytes,
      sha256: asset.sha256
    })
  }
  for (const [callId, count] of expected) {
    if (
      !Number.isSafeInteger(count) ||
      images.filter((image) => image.callId === callId).length !== count
    ) {
      throw new Error('Incomplete submitted image evidence: ' + callId)
    }
  }
  return images
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const activityOnly = args.length === 2 && args[1] === '--activities'
  if (
    !args[0] ||
    (!activityOnly &&
      (![1, 3].includes(args.length) ||
        (args.length === 3 && args[1] !== '--assessment')))
  ) {
    throw new Error(
      'Usage: analyze.mjs <run-directory> [--activities | --assessment <assessment.json>]'
    )
  }
  const directory = path.resolve(args[0])
  const run = JSON.parse(fs.readFileSync(path.join(directory, 'run.json')))
  if (
    !Array.isArray(run.sourceRequestIds) ||
    !run.sourceRequestIds.length ||
    run.sourceRequestIds.some((id) => typeof id !== 'string' || !id) ||
    typeof run.recordingDirectory !== 'string'
  ) {
    throw new Error('Missing execution source identities')
  }
  if (
    !activityOnly &&
    (!Array.isArray(run.sourceRequestIds) ||
      run.sourceRequestIds.length === 0 ||
      run.sourceRequestIds.some((id) => typeof id !== 'string' || !id) ||
      typeof run.recordingDirectory !== 'string' ||
      [
        'final-view',
        'persistence',
        'checkpoint',
        'recording',
        'reload',
        'source-verification',
        'cleanup-browser',
        'cleanup-browser-server'
      ].some((name) => run.evidence?.[name]?.status !== 'complete') ||
      run.failure ||
      run.stopFailure ||
      run.cleanupStopFailure ||
      Object.values(run.evidence ?? {}).some(
        (stage) => stage.status !== 'complete'
      ) ||
      !Number.isFinite(Date.parse(run.sentAt)) ||
      !Number.isFinite(run.elapsedMs) ||
      run.elapsedMs < 0 ||
      !['success', 'no-change'].includes(run.outcome))
  ) {
    throw new Error(
      'Incomplete evaluation capture; retain raw evidence without a quality report'
    )
  }
  const nativeBoundaries = run.nativeBoundaryEvidence
    ? readPayload(directory, run.nativeBoundaryEvidence)
    : undefined
  const recordingDirectory = path.resolve(run.recordingDirectory)
  const streams = []
  const expectedAttempts = new Map()
  for (const id of run.sourceRequestIds) {
    expectedAttempts.set(id, (expectedAttempts.get(id) ?? 0) + 1)
  }
  const matchedAttempts = new Map()
  const records = []
  for (const file of fs
    .readdirSync(recordingDirectory)
    .filter((name) => name.endsWith('.jsonl'))) {
    const text = fs.readFileSync(path.join(recordingDirectory, file), 'utf8')
    let first
    try {
      first = JSON.parse(text.split('\n', 1)[0])
    } catch {
      continue
    }
    if (first?.provider === 'local-codex') {
      records.push({ file, text, first })
    }
  }
  // Follow the canonical source-request edges, never nearby timestamps. Keep
  // nested provider calls visible without counting them as browser attempts.
  const reachable = new Set(run.sourceRequestIds)
  for (;;) {
    const before = reachable.size
    for (const { first } of records) {
      if (
        reachable.has(first.sourceRequestId) &&
        typeof first.requestId === 'string'
      ) {
        reachable.add(first.requestId)
      }
    }
    if (before === reachable.size) {
      break
    }
  }
  const seen = new Set()
  for (const { file, text, first } of records) {
    if (!reachable.has(first.sourceRequestId)) {
      continue
    }
    const parsed = parseExecutionRecord(text)
    if (!activityOnly && !parsed.complete) {
      throw new Error(
        `Incomplete execution record ${file}: ${parsed.issues.join('; ')}`
      )
    }
    if (
      !activityOnly &&
      expectedAttempts.has(first.sourceRequestId) &&
      first.purpose === 'drawing' &&
      parsed.outcome !== 'completed'
    ) {
      throw new Error(`Drawing request did not complete successfully: ${file}`)
    }
    if (
      !run.expectedModel ||
      first.model !== run.expectedModel.model ||
      first.effort !== run.expectedModel.effort
    ) {
      throw new Error(`Execution configuration mismatch: ${file}`)
    }
    if (seen.has(parsed.requestId)) {
      throw new Error(
        `Duplicate execution record identity: ${parsed.requestId}`
      )
    }
    seen.add(parsed.requestId)
    if (
      expectedAttempts.has(first.sourceRequestId) &&
      first.purpose === 'drawing'
    ) {
      matchedAttempts.set(
        first.sourceRequestId,
        (matchedAttempts.get(first.sourceRequestId) ?? 0) + 1
      )
    }
    const rows = parsed.records
    const summary = summarizeCalls(rows)
    if (!activityOnly) {
      for (const call of summary.calls) {
        call.inputValue = readPayload(recordingDirectory, call.input)
        call.outputValue = readPayload(recordingDirectory, call.output)
        call.payloadAvailability = {
          input: call.input !== null,
          output: call.output !== null
        }
      }
    }
    const nativeStream = nativeBoundaries?.streams.find(
      (stream) => stream.requestId === parsed.requestId
    )
    if (
      nativeStream &&
      (nativeStream.startedAt !== first.startedAt ||
        nativeStream.sourceRequestId !== first.sourceRequestId)
    ) {
      throw new Error('Native diagnostic stream provenance mismatch')
    }
    streams.push({
      nativeDiagnostics: nativeStream ?? {
        status: 'unavailable',
        reason: 'not-captured'
      },
      file,
      requestId: parsed.requestId,
      sourceRequestId: first.sourceRequestId,
      recordComplete: parsed.complete,
      recordIssues: parsed.issues,
      activityTimeline: restorePublicActivity(
        rows,
        (ref) => readPayload(recordingDirectory, ref),
        nativeStream?.diagnostics.length === 1
          ? nativeStream.diagnostics[0]
          : undefined
      ),
      providerOutcome: parsed.outcome,
      purpose: first.purpose,
      model: first.model,
      effort: first.effort,
      ...summary,
      images: activityOnly ? [] : restoreToolImages(recordingDirectory, rows),
      knowledgeUse: observeKnowledgeUse(summary.calls)
    })
  }
  for (const [id, count] of expectedAttempts) {
    if (matchedAttempts.get(id) !== count) {
      throw new Error(`Missing or unexpected exact request attempts: ${id}`)
    }
  }
  const analysis = {
    id: run.id,
    outcome: run.outcome,
    elapsedMs: run.elapsedMs,
    firstContentMs: run.firstContentMs,
    streams
  }
  if (!activityOnly && run.seed) {
    const before = JSON.parse(
        fs.readFileSync(path.join(directory, 'before.json'))
      ),
      after = JSON.parse(fs.readFileSync(path.join(directory, 'after.json')))
    analysis.preservation = verifyPreservation(
      before,
      after,
      run.seed,
      run.arm === 'transfer' ? 'height' : 'width',
      run.arm === 'transfer' ? 110 : 140
    )
  }
  if (!activityOnly) {
    analysis.attribution = assessRecordedChanges(directory, args[2])
  }
  fs.writeFileSync(
    path.join(
      directory,
      activityOnly ? 'activity-analysis.json' : 'analysis.json'
    ),
    JSON.stringify(analysis, null, 2)
  )
  console.log(
    JSON.stringify({
      id: analysis.id,
      outcome: analysis.outcome,
      elapsedMs: analysis.elapsedMs,
      streams: streams.map((s) => ({
        model: s.model,
        effort: s.effort,
        calls: s.calls.length,
        incomplete: s.incomplete,
        knowledge: s.knowledgeCalls.map((c) => c.tool)
      })),
      preservation: analysis.preservation
    })
  )
}

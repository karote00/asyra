import { AiActionNames } from '../src/constants/ai-actions'
import { AiDesignToolIds } from '../src/constants/ai-design'
import type { ExecutionRecord } from './local-ai-records'
import { parseExecutionRecord } from './local-ai-records'

type ParsedExecution = ReturnType<typeof parseExecutionRecord>
const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const count = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null
const text = (value: unknown) => (typeof value === 'string' ? value : null)
// The writer summarizes arrays as {count, items, truncated}; only fully retained
// arrays can be recovered. Never reconstruct omitted members.
const retainedValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(retainedValue)
  if (value === null || typeof value !== 'object') return value
  const entry = object(value)
  if (
    entry.truncated === false &&
    Array.isArray(entry.items) &&
    Number.isSafeInteger(entry.count) &&
    entry.count === entry.items.length &&
    Object.keys(entry).every((key) =>
      ['count', 'items', 'truncated'].includes(key)
    )
  )
    return entry.items.map(retainedValue)
  return Object.fromEntries(
    Object.entries(entry).map(([key, child]) => [key, retainedValue(child)])
  )
}
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`)
      .join(',')}}`
  return JSON.stringify(value) ?? 'null'
}
const omitted = (value: unknown): boolean => {
  if (typeof value === 'string')
    return /\[(?:truncated|.*omitted|evidence budget exhausted)\]/.test(value)
  if (Array.isArray(value)) return value.some(omitted)
  if (value !== null && typeof value === 'object')
    return (
      object(value).truncated === true || Object.values(value).some(omitted)
    )
  return false
}

export interface ExecutionFinding {
  requestId: string | null
  sequence: number | null
  callId: string | null
  relatedCallIds?: string[]
  kind:
    | 'tool-failure'
    | 'incomplete-step'
    | 'protocol-rejection'
    | 'unavailable-result'
    | 'repeat-query-candidate'
  confidence: 'observed' | 'candidate'
  observation: string
  possibleRemedy: string
}

/** A read-only projection; timings rank investigation targets, not product quality. */
export const evaluateExecution = (
  run: ParsedExecution,
  options: { feedback?: string } = {}
) => {
  const findings: ExecutionFinding[] = []
  const byCall = new Map<string, ExecutionRecord[]>()
  for (const entry of run.records) {
    if (typeof entry.callId === 'string') {
      const entries = byCall.get(entry.callId) ?? []
      entries.push(entry)
      byCall.set(entry.callId, entries)
    }
    if (entry.stage === 'protocol_rejected')
      findings.push({
        requestId: run.requestId,
        sequence: entry.sequence ?? null,
        callId: text(entry.callId),
        kind: 'protocol-rejection',
        confidence: 'observed',
        observation: 'The provider emitted a rejected protocol item.',
        possibleRemedy:
          'Inspect this sequence and its declared protocol contract.'
      })
  }
  const exactReads = new Map<string, string>()
  const readTools = new Set<string>([
    AiActionNames.READ_DESIGN_CONTEXT,
    AiDesignToolIds.DESCRIBE_DESIGN_APIS
  ])
  const toolCalls = run.steps
    .filter((step) => step.kind !== 'provider')
    .map((step) => {
      const events = byCall.get(step.callId) ?? []
      const start = events.find(
        (entry) => entry.stage === `${step.kind}_started`
      )
      const finish = events.find(
        (entry) =>
          entry.stage === `${step.kind}_completed` ||
          entry.stage === `${step.kind}_failed`
      )
      const evidence = object(finish?.evidence)
      const args = object(retainedValue(object(start?.evidence).arguments))
      const result = object(evidence.result)
      const identity = {
        requestId: run.requestId,
        sequence: start?.sequence ?? null,
        callId: step.callId
      }
      if (step.status === 'completed' && result.available === false)
        findings.push({
          ...identity,
          kind: 'unavailable-result',
          confidence: 'observed',
          observation:
            'The tool returned no usable result although its transport call completed.',
          possibleRemedy:
            'Inspect the retained recovery advice and subsequent calls; do not count transport completion as successful work.'
        })
      if (step.status !== 'completed')
        findings.push({
          ...identity,
          kind: step.status === 'failed' ? 'tool-failure' : 'incomplete-step',
          confidence: 'observed',
          observation:
            step.status === 'failed'
              ? 'The tool call failed; this does not establish whether recovery succeeded later.'
              : 'No terminal record exists for this call.',
          possibleRemedy:
            step.status === 'failed'
              ? 'Inspect the recorded code and subsequent recovery calls.'
              : 'Check interruption or missing diagnostics before drawing conclusions.'
        })
      const revision = result.revision ?? args.revision
      if (
        step.status === 'completed' &&
        step.tool &&
        readTools.has(step.tool) &&
        (typeof revision === 'string' || typeof revision === 'number') &&
        Object.keys(args).length > 0 &&
        !omitted(args) &&
        !omitted(start?.evidence) &&
        !omitted(finish?.evidence)
      ) {
        const key = stable({ tool: step.tool, args, revision })
        const previous = exactReads.get(key)
        if (previous)
          findings.push({
            ...identity,
            kind: 'repeat-query-candidate',
            confidence: 'candidate',
            relatedCallIds: [previous],
            observation:
              'Identical retained read selectors at the same recorded revision; not proof of waste.',
            possibleRemedy:
              'Check consumer purpose and retained output before adding exact-result reuse.'
          })
        else exactReads.set(key, step.callId)
      }
      return {
        ...identity,
        tool: step.tool,
        status: step.status,
        durationMs:
          step.startedMs !== null && step.endedMs !== null
            ? step.endedMs - step.startedMs
            : null,
        queueMs: count(evidence.queueMs),
        executionMs: count(evidence.executionMs),
        responseTextBytes: count(evidence.responseTextBytes),
        code: text(evidence.code),
        ownerTiming: object(result.timing)
      }
    })
  const reviewCalls = run.steps
    .filter(
      (step) =>
        step.tool === AiDesignToolIds.RECORD_DESIGN_REVIEW &&
        step.status === 'completed'
    )
    .map((step) => {
      const events = byCall.get(step.callId) ?? []
      const start = events.find((entry) => entry.stage === 'tool_started')
      const end = events.find((entry) => entry.stage === 'tool_completed')
      return {
        callId: step.callId,
        sequence: start?.sequence ?? null,
        args: object(retainedValue(object(start?.evidence).arguments)),
        result: object(object(end?.evidence).result)
      }
    })
  const plan = reviewCalls.findLast((call) => call.args.phase === 'plan')
  const visual = reviewCalls.findLast(
    (call) =>
      call.args.phase === 'visual' &&
      Array.isArray(call.args.checks) &&
      !omitted(call.args)
  )
  const settlement = run.records.findLast(
    (entry) => entry.event === 'ai_request_usage'
  )
  return {
    requestId: run.requestId,
    metadata: run.metadata,
    complete: run.complete,
    outcome: run.outcome,
    issues: run.issues,
    timing: run.timing,
    usage: settlement?.tokens ?? null,
    usageStatus: settlement?.usageStatus ?? 'unavailable',
    transport: settlement?.transport ?? null,
    findings,
    toolCalls,
    modelReview: {
      status: visual ? 'recorded' : 'unavailable',
      certifiesVisuals: false,
      callId: visual?.callId ?? null,
      sequence: visual?.sequence ?? null,
      criteria: plan?.args.criteria ?? null,
      detailRequired: plan?.args.detailRequired ?? null,
      inspectionIds: visual?.args.inspectionIds ?? null,
      checks: visual?.args.checks ?? null,
      accepted: visual?.result.accepted ?? null
    },
    userFeedback: options.feedback ?? null
  }
}

export const createExecutionPeriodReport = (
  records: ParsedExecution[],
  options: {
    from?: string
    to?: string
    now?: Date
    feedback?: Record<string, string>
  } = {}
) => {
  const to =
    options.to === undefined
      ? (options.now ?? new Date()).getTime()
      : Date.parse(options.to)
  const from =
    options.from === undefined
      ? to - 7 * 24 * 60 * 60 * 1000
      : Date.parse(options.from)
  if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to)
    throw new Error('Invalid period: require finite from < to.')
  const identities = new Map<string, number>()
  for (const run of records)
    if (run.requestId)
      identities.set(run.requestId, (identities.get(run.requestId) ?? 0) + 1)
  const excluded: { requestId: string | null; reason: string }[] = []
  const duplicateIds = new Set<string>()
  const runs: ReturnType<typeof evaluateExecution>[] = []
  let outsidePeriod = 0
  for (const run of records) {
    if (!run.requestId) {
      excluded.push({ requestId: null, reason: 'unknown-request' })
      continue
    }
    if ((identities.get(run.requestId) ?? 0) > 1) {
      if (!duplicateIds.has(run.requestId))
        excluded.push({ requestId: run.requestId, reason: 'duplicate-request' })
      duplicateIds.add(run.requestId)
      continue
    }
    const startedAt = Date.parse(String(run.metadata.startedAt ?? ''))
    if (!Number.isFinite(startedAt)) {
      excluded.push({ requestId: run.requestId, reason: 'unknown-date' })
      continue
    }
    if (startedAt < from || startedAt >= to) {
      outsidePeriod++
      continue
    }
    runs.push(
      evaluateExecution(run, { feedback: options.feedback?.[run.requestId] })
    )
  }
  const groups = new Map<
    string,
    { configuration: Record<string, string | null>; requestIds: string[] }
  >()
  for (const run of runs) {
    const configuration = Object.fromEntries(
      ['provider', 'model', 'effort', 'sourceRevision'].map((key) => [
        key,
        text(run.metadata[key])
      ])
    )
    const key = stable(configuration)
    const group = groups.get(key) ?? { configuration, requestIds: [] }
    if (run.requestId) group.requestIds.push(run.requestId)
    groups.set(key, group)
  }
  const frequencies = new Map<
    string,
    { kind: string; occurrences: number; requestIds: Set<string> }
  >()
  for (const run of runs)
    for (const finding of run.findings) {
      const entry = frequencies.get(finding.kind) ?? {
        kind: finding.kind,
        occurrences: 0,
        requestIds: new Set<string>()
      }
      entry.occurrences++
      if (run.requestId) entry.requestIds.add(run.requestId)
      frequencies.set(finding.kind, entry)
    }
  return {
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    runs,
    groups: [...groups.values()],
    excluded,
    outsidePeriod,
    partialRuns: runs.filter((run) => !run.complete).length,
    frequencies: [...frequencies.values()].map((entry) => ({
      ...entry,
      requestIds: [...entry.requestIds]
    })),
    limitations: [
      'Unattributed time is not measured model reasoning time.',
      'Wire bytes are not model context or token usage.',
      'Model reviews are opinions; product success needs visual and user evidence.',
      'Configuration groups do not establish equivalent tasks or causal speed improvements.'
    ]
  }
}

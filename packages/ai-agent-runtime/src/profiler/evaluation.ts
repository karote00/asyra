const lastMatching = <T>(
  items: readonly T[],
  predicate: (value: T) => boolean
): T | undefined => {
  for (let index = items.length - 1; index >= 0; index--)
    if (predicate(items[index])) return items[index]
  return undefined
}

export interface ExecutionReportPolicy {
  readTools?: readonly string[]
  reviewTool?: string
  validateEvidenceTool?: string
}

import type { ExecutionRecord } from './records.js'
import { parseExecutionRecord } from './records.js'

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

// Report query identity, never mutation values or arbitrary retained evidence.
// Array summary markers stay intact when the writer could not retain all items.
const selectorKeys = new Set([
  'operations',
  'name',
  'arguments',
  'names',
  'query',
  'scope',
  'bounds',
  'x',
  'y',
  'width',
  'height',
  'filter',
  'type',
  'ancestorId',
  'locked',
  'result',
  'parentId',
  'elementIds',
  'elementId',
  'fields',
  'field',
  'keys',
  'keyPrefix',
  'artifactId',
  'analysisId',
  'compositionId',
  'revision',
  'offset',
  'limit',
  'count',
  'items',
  'truncated'
])
const querySelectors = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(querySelectors)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => selectorKeys.has(key))
      .map(([key, child]) => [key, querySelectors(child)])
  )
}

export interface ExecutionFinding {
  requestId: string | null
  sequence: number | null
  callId: string | null
  relatedCallIds?: string[]
  repeatedFields?: string[]
  kind:
    | 'tool-failure'
    | 'incomplete-step'
    | 'protocol-rejection'
    | 'unavailable-result'
    | 'repeat-query-candidate'
    | 'input-echo-candidate'
  confidence: 'observed' | 'candidate'
  observation: string
  possibleRemedy: string
}

/** A read-only projection; timings rank investigation targets, not product quality. */
export const evaluateExecution = (
  run: ParsedExecution,
  options: { feedback?: string; policy?: ExecutionReportPolicy } = {}
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
  const readTools = new Set<string>(options.policy?.readTools ?? [])
  const toolCalls = run.steps
    .filter((step) => step.kind === 'tool' || step.kind === 'research')
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
      const result = object(retainedValue(evidence.result))
      const identity = {
        requestId: run.requestId,
        sequence: start?.sequence ?? null,
        callId: step.callId
      }
      const outcome = object(result.toolOutcome)
      if (
        step.status === 'completed' &&
        step.tool === options.policy?.reviewTool &&
        args.phase === 'plan'
      ) {
        const repeatedFields = [
          'method',
          'references',
          'criteria',
          'deferredDetails'
        ].filter((field) => {
          const input = args[field]
          const output = result[field]
          const nonempty =
            typeof input === 'string'
              ? input.trim().length > 0
              : input !== null &&
                typeof input === 'object' &&
                Object.keys(input).length > 0
          return (
            nonempty &&
            output !== undefined &&
            !omitted(input) &&
            !omitted(output) &&
            stable(input) === stable(output)
          )
        })
        if (repeatedFields.length)
          findings.push({
            ...identity,
            kind: 'input-echo-candidate',
            confidence: 'candidate',
            repeatedFields,
            observation:
              'Fully retained plan fields are repeated unchanged in the tool reply; necessity and latency impact are not established.',
            possibleRemedy:
              'Keep the review state at its owner and verify that an acknowledgement can replace echoed narrative without losing later review inputs.'
          })
      }
      if (
        step.status === 'completed' &&
        (result.available === false ||
          outcome.status === 'unavailable' ||
          outcome.status === 'partial')
      )
        findings.push({
          ...identity,
          kind: 'unavailable-result',
          confidence: 'observed',
          observation:
            'The tool did not return a fully usable result although its transport call completed.',
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
      // A completed transport is not evidence that its operation was usable.
      // Retain unknown for older/omitted replies instead of inventing success.
      let executionStatus:
        'usable' | 'partial' | 'rejected' | 'failed' | 'unknown' = 'unknown'
      if (outcome.status === 'partial' || result.status === 'partial')
        executionStatus = 'partial'
      else if (outcome.status === 'unavailable' || result.available === false) {
        executionStatus = 'failed'
        if (
          result.stage === 'admission' ||
          result.code === 'PREPARATION_REJECTED'
        )
          executionStatus = 'rejected'
      } else if (outcome.status === 'usable') executionStatus = 'usable'
      if (step.status === 'failed') executionStatus = 'failed'
      return {
        ...identity,
        execution: {
          status: executionStatus,
          stage: text(result.stage),
          code: text(result.code) ?? text(evidence.code),
          settlement: text(result.settlement),
          recoverable:
            typeof result.recoverable === 'boolean' ? result.recoverable : null
        },
        tool: step.tool,
        phase: text(args.phase),
        selectors: querySelectors(args),
        diagnostics: step.diagnostics ?? { input: null, output: null },
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
  const actions = run.steps
    .filter((step) => step.kind === 'action')
    .map((step) => ({
      callId: step.callId,
      tool: step.tool,
      status: step.status,
      exchangeStartedMs: step.startedMs,
      exchangeEndedMs: step.endedMs,
      handlerMs: count(
        object(
          object(object(step.diagnostics?.output).summary).actionObservation
        ).handlerMs
      ),
      diagnostics: step.diagnostics ?? {
        input: null,
        output: null,
        attribution: null
      }
    }))
  const reviewCalls = run.steps
    .filter(
      (step) =>
        step.tool === options.policy?.reviewTool && step.status === 'completed'
    )
    .map((step) => {
      const events = byCall.get(step.callId) ?? []
      const start = events.find((entry) => entry.stage === 'tool_started')
      const end = events.find((entry) => entry.stage === 'tool_completed')
      return {
        callId: step.callId,
        endedMs: step.endedMs,
        sequence: start?.sequence ?? null,
        args: object(retainedValue(object(start?.evidence).arguments)),
        result: object(object(end?.evidence).result)
      }
    })
  const plan = lastMatching(reviewCalls, (call) => call.args.phase === 'plan')
  const visual = lastMatching(
    reviewCalls,
    (call) =>
      call.args.phase === 'visual' &&
      Array.isArray(call.args.checks) &&
      !omitted(call.args)
  )
  const settlement = lastMatching(
    run.records,
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
    toolOutcomes: toolCalls.reduce(
      (counts, call) => {
        counts[call.execution.status]++
        return counts
      },
      { usable: 0, partial: 0, rejected: 0, failed: 0, unknown: 0 }
    ),
    actions,
    orchestration: {
      // A native turn can contain many model inferences. The current app-server
      // protocol exposes neither inference IDs nor exec -> child-call linkage.
      modelRoundCount: null,
      programChildLinks: 'unavailable' as const,
      reason:
        'Native app-server exposes turn/item/call IDs, not model inference IDs or program parent IDs. Tool counts and interval overlap cannot establish those relationships.',
      nativeTurnIds: [
        ...new Set(
          run.records.flatMap((entry) => {
            const id = text(object(entry.evidence).nativeTurnId)
            return id ? [id] : []
          })
        )
      ],
      programs: run.steps
        .filter(
          (step) =>
            step.kind === 'provider' &&
            ['exec', 'wait'].includes(step.tool ?? '')
        )
        .map((step) => ({
          callId: step.callId,
          tool: step.tool,
          startedMs: step.startedMs,
          endedMs: step.endedMs,
          status: step.status
        }))
    },
    modelReview: {
      status: visual ? 'recorded' : 'unavailable',
      current: Boolean(
        visual &&
        run.complete &&
        visual.endedMs !== null &&
        run.steps.every(
          (step) =>
            step.kind === 'provider' ||
            step.kind === 'lifecycle' ||
            (step.kind === 'action' &&
              step.tool === options.policy?.validateEvidenceTool &&
              step.status === 'completed' &&
              (byCall.get(step.callId) ?? []).some(
                (entry) =>
                  entry.stage === 'action_completed' &&
                  object(object(entry.evidence).result).current === true
              )) ||
            (step.endedMs !== null &&
              step.endedMs <= (visual.endedMs as number))
        )
      ),
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
    policy?: ExecutionReportPolicy
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
      evaluateExecution(run, {
        feedback: options.feedback?.[run.requestId],
        policy: options.policy
      })
    )
  }
  const groups = new Map<
    string,
    { configuration: Record<string, string | null>; requestIds: string[] }
  >()
  const configurationFor = (run: (typeof runs)[number]) =>
    Object.fromEntries(
      ['provider', 'model', 'effort', 'sourceRevision', 'purpose'].map(
        (key) => [key, text(run.metadata[key])]
      )
    )
  for (const run of runs) {
    const configuration = configurationFor(run)
    const key = stable(configuration)
    const group = groups.get(key) ?? { configuration, requestIds: [] }
    if (run.requestId) group.requestIds.push(run.requestId)
    groups.set(key, group)
  }
  const frequencies = new Map<
    string,
    { kind: string; occurrences: number; requestIds: Set<string> }
  >()
  const investigationTargets = new Map<
    string,
    {
      configuration: Record<string, string | null>
      tool: string | null
      phase: string | null
      code: string | null
      kind: ExecutionFinding['kind']
      confidence: ExecutionFinding['confidence']
      occurrences: number
      requestIds: Set<string>
      evidence: {
        requestId: string | null
        callId: string | null
        sequence: number | null
      }[]
      possibleRemedy: string
    }
  >()
  for (const run of runs) {
    const configuration = configurationFor(run)
    const calls = new Map(run.toolCalls.map((call) => [call.callId, call]))
    for (const finding of run.findings) {
      const call = finding.callId ? calls.get(finding.callId) : undefined
      const identity = {
        configuration,
        tool: call?.tool ?? null,
        phase: call?.phase ?? null,
        code: call?.code ?? null,
        kind: finding.kind,
        confidence: finding.confidence
      }
      const key = stable(identity)
      const target = investigationTargets.get(key) ?? {
        ...identity,
        occurrences: 0,
        requestIds: new Set<string>(),
        evidence: [],
        possibleRemedy: finding.possibleRemedy
      }
      target.occurrences++
      if (run.requestId) target.requestIds.add(run.requestId)
      target.evidence.push({
        requestId: finding.requestId,
        callId: finding.callId,
        sequence: finding.sequence
      })
      investigationTargets.set(key, target)
    }
  }
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
    investigationTargets: [...investigationTargets.values()].map((target) => ({
      ...target,
      requestIds: [...target.requestIds]
    })),
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

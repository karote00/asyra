import {
  partitionExecutionTime,
  summarizeCallDurations,
  summarizeAppCallGaps
} from './timing.js'

export interface ExecutionRecord {
  event: string
  schemaVersion: number
  requestId: string
  sequence: number
  [key: string]: unknown
}

export interface ExecutionRecordSink {
  write(record: ExecutionRecord): void
  writePayload?(
    requestId: string,
    callId: string,
    phase: 'input' | 'output',
    value: unknown
  ): {
    status: 'queued' | 'failed'
    path: string | null
    bytes?: number
    sha256?: string
    redactions?: string[]
    resourceIdentities?: { path: string; sha256: string }[]
    serializationMs?: number
  }
  writeAsset?(
    requestId: string,
    bytes: Uint8Array,
    mediaType: string
  ): {
    status: 'queued' | 'failed'
    path: string | null
    sha256?: string
    bytes?: number
    reused?: boolean
  }
  flush(): Promise<{
    status: 'saved' | 'failed' | 'empty'
    path: string | null
  }>
}

export interface ExecutionStep {
  callId: string
  kind: 'tool' | 'action' | 'research' | 'provider' | 'lifecycle'
  tool: string | null
  startedMs: number | null
  endedMs: number | null
  executionStartedMs?: number
  diagnostics?: { input?: unknown; output?: unknown; attribution?: unknown }
  status: 'incomplete' | 'completed' | 'failed'
  evidence: unknown[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const finiteTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

/** Pure diagnostic projection. Missing/invalid records remain visible to readers. */
export const parseExecutionRecord = (text: string) => {
  const issues: string[] = []
  const steps = new Map<string, ExecutionStep>()
  const records: ExecutionRecord[] = []
  let requestId: string | null = null
  let previousSequence = -1
  let outcome = 'incomplete'
  let durationMs = 0
  let terminal = false
  let metadata: Record<string, unknown> = {
    sourceRevision: null,
    sourceFingerprint: null,
    sourceIdentityStatus: 'unavailable'
  }
  text.split('\n').forEach((line, index) => {
    if (!line.trim()) return
    let entry: unknown
    try {
      entry = JSON.parse(line)
    } catch {
      issues.push(`Malformed record at line ${index + 1}`)
      return
    }
    if (
      !isRecord(entry) ||
      typeof entry.requestId !== 'string' ||
      ![1, 2].includes(Number(entry.schemaVersion)) ||
      typeof entry.event !== 'string'
    ) {
      issues.push(`Invalid record at line ${index + 1}`)
      return
    }
    if (requestId && requestId !== entry.requestId) {
      issues.push(`Mixed request at line ${index + 1}`)
      return
    }
    requestId = entry.requestId
    if (Number.isSafeInteger(entry.sequence)) {
      if ((entry.sequence as number) <= previousSequence)
        issues.push(`Unordered record at line ${index + 1}`)
      if (
        entry.schemaVersion === 2 &&
        (entry.sequence as number) > previousSequence + 1
      )
        issues.push(`Missing sequence before line ${index + 1}`)
      previousSequence = entry.sequence as number
    } else if (entry.schemaVersion === 2) {
      issues.push(`Missing sequence at line ${index + 1}`)
    }
    if (terminal) issues.push(`Record after settlement at line ${index + 1}`)
    records.push(entry as ExecutionRecord)
    if (entry.event === 'ai_request_started') {
      metadata = { ...metadata, ...entry }
      return
    }
    if (entry.event === 'ai_request_usage') {
      terminal = true
      if (
        typeof entry.recordingFailures === 'number' &&
        entry.recordingFailures > 0
      )
        issues.push(`Recording failed for ${entry.recordingFailures} events`)
      if (
        typeof entry.outcome === 'string' &&
        ['completed', 'failed', 'cancelled', 'timed_out'].includes(
          entry.outcome
        )
      )
        outcome = entry.outcome
      else issues.push('Invalid settlement outcome')
      if (finiteTime(entry.durationMs))
        durationMs = Math.max(durationMs, entry.durationMs)
      else issues.push('Missing duration')
      return
    }
    if (!finiteTime(entry.elapsedMs)) {
      issues.push(`Missing elapsed time at line ${index + 1}`)
      return
    }
    durationMs = Math.max(durationMs, entry.elapsedMs)
    if (typeof entry.stage !== 'string' || typeof entry.callId !== 'string')
      return
    const match =
      /^(tool|action|research|provider_request|provider_item|lifecycle)_(started|execution_started|completed|failed)$/.exec(
        entry.stage
      )
    if (!match) return
    const kind = match[1].startsWith('provider_')
      ? 'provider'
      : (match[1] as 'tool' | 'action' | 'research' | 'lifecycle')
    const key = `${kind}:${entry.callId}`
    let step = steps.get(key)
    if (!step) {
      step = {
        callId: entry.callId,
        kind,
        tool: typeof entry.tool === 'string' ? entry.tool : null,
        startedMs: null,
        endedMs: null,
        status: 'incomplete',
        evidence: []
      }
      steps.set(key, step)
    }
    step.evidence.push(entry.evidence)
    if (isRecord(entry.diagnostic))
      step.diagnostics = { ...step.diagnostics, ...entry.diagnostic }
    if (match[2] === 'execution_started')
      step.executionStartedMs = entry.elapsedMs
    if (match[2] === 'started') {
      if (step.startedMs !== null) issues.push(`Duplicate start for ${key}`)
      else step.startedMs = entry.elapsedMs
    } else if (match[2] === 'completed' || match[2] === 'failed') {
      if (step.startedMs === null) issues.push(`Missing start for ${key}`)
      if (step.endedMs !== null) issues.push(`Duplicate end for ${key}`)
      step.endedMs = entry.elapsedMs
      step.status = match[2]
      if (step.startedMs !== null && step.endedMs < step.startedMs)
        issues.push(`Reversed interval for ${key}`)
    }
  })
  let observedToolAndResearchMs = 0
  let end = 0
  const spans = [...steps.values()]
    .flatMap((step) => {
      if (
        step.kind === 'lifecycle' ||
        step.kind === 'provider' ||
        step.kind === 'action' ||
        step.startedMs === null
      )
        return []
      return [[step.startedMs, step.endedMs ?? durationMs]]
    })
    .sort((a, b) => a[0] - b[0])
  for (const [start, finish] of spans) {
    observedToolAndResearchMs += Math.max(
      0,
      Math.min(durationMs, finish) - Math.max(start, end)
    )
    end = Math.max(end, finish)
  }
  const breakdown = partitionExecutionTime([...steps.values()], durationMs)
  if (metadata.lifecycleVersion === 1) {
    const root = steps.get('lifecycle:request-lifecycle')
    if (!root || root.startedMs !== 0 || root.endedMs !== durationMs)
      issues.push('Missing or incomplete request lifecycle boundary')
    for (const step of steps.values())
      if (step.kind === 'lifecycle' && step.status === 'incomplete')
        issues.push(`Incomplete lifecycle span ${step.callId}`)
    if (breakdown.unattributedMs > 0)
      issues.push('Uncovered lifecycle interval')
  }
  for (const step of steps.values())
    if (step.kind !== 'lifecycle' && step.status === 'incomplete')
      issues.push(`Incomplete ${step.kind} span ${step.callId}`)
  return {
    requestId: requestId as string | null,
    outcome,
    metadata,
    records,
    issues,
    steps: [...steps.values()],
    complete:
      terminal &&
      issues.length === 0 &&
      [...steps.values()].every((step) => step.status !== 'incomplete'),
    timing: {
      durationMs,
      breakdown,
      owners: {
        providerMs:
          breakdown.childProviderMs +
          breakdown.researchMs +
          breakdown.nativeWaitMs +
          breakdown.providerOrchestrationEventMs +
          breakdown.providerReasoningEventMs +
          breakdown.providerResponseEventMs +
          breakdown.providerRequestMs +
          breakdown.providerWaitMs,
        toolMs:
          breakdown.toolExecutionMs +
          breakdown.toolQueueMs +
          breakdown.toolUnsplitMs,
        appMs: breakdown.appExchangeMs + breakdown.appOrchestrationMs,
        recordingGapMs: breakdown.unattributedMs
      },
      callDurations: summarizeCallDurations([...steps.values()], durationMs),
      appCallGaps: summarizeAppCallGaps([...steps.values()], durationMs),
      observedToolAndResearchMs,
      outsideToolAndResearchMs: Math.max(
        0,
        durationMs - observedToolAndResearchMs
      ),
      unattributedMs: breakdown.unattributedMs
    }
  }
}

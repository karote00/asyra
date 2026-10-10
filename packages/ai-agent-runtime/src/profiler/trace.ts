import type { parseExecutionRecord } from './records.js'

type ParsedExecution = ReturnType<typeof parseExecutionRecord>
interface TraceEvent {
  name: string
  cat: string
  ph: 'X' | 'i' | 'b' | 'e'
  ts: number
  dur?: number
  pid: number
  tid: string
  id?: string
  s?: 't'
  args: Record<string, unknown>
}

/** Portable Trace Event JSON. Timestamps measure receipt/execution boundaries,
 * never private model computation. Payloads remain separately retained references. */
export const exportExecutionTrace = (run: ParsedExecution) => {
  const traceEvents: TraceEvent[] = []
  for (const step of run.steps) {
    if (step.startedMs === null) continue
    const attribution = step.diagnostics?.attribution
    const details =
      attribution && typeof attribution === 'object' ? attribution : {}
    traceEvents.push({
      name: step.tool ?? step.callId,
      cat: step.kind,
      ph: step.endedMs === null ? 'b' : 'X',
      ts: step.startedMs * 1000,
      ...(step.endedMs === null
        ? { id: step.callId }
        : { dur: Math.max(0, step.endedMs - step.startedMs) * 1000 }),
      pid: 1,
      tid: step.kind,
      args: {
        callId: step.callId,
        status: step.status,
        ...details,
        diagnostics: step.diagnostics ?? null
      }
    })
  }
  for (const record of run.records) {
    if (
      typeof record.elapsedMs !== 'number' ||
      !Number.isFinite(record.elapsedMs)
    )
      continue
    traceEvents.push({
      name: String(record.stage ?? record.event),
      cat: 'observed-event',
      ph: 'i',
      s: 't',
      ts: record.elapsedMs * 1000,
      pid: 1,
      tid: 'events',
      args: {
        sequence: record.sequence,
        callId: record.callId ?? null,
        evidence: record.evidence ?? null
      }
    })
  }
  traceEvents.sort((a, b) => a.ts - b.ts)
  return {
    displayTimeUnit: 'ms',
    traceEvents,
    visibility: {
      transportEvents: run.records.filter(
        (record) => record.stage === 'transport_chunk'
      ).length,
      transportRecording:
        run.metadata.profilerVersion === 1
          ? 'enabled'
          : 'historical-unavailable',
      providerInternalActivity: 'unavailable',
      recordComplete: run.complete,
      issues: run.issues,
      ownershipGapMs: run.timing.unattributedMs,
      explanation:
        'Ownership spans account for delegation and waiting. Public event arrival does not measure hidden model reasoning, queueing or computation.'
    }
  }
}

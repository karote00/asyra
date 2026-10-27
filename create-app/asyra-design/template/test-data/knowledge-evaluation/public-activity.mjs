/** Recorded public arrivals and explicit offline boundaries; never inferred work. */
export function restorePublicActivity(rows, readPayload, nativeDiagnostics) {
  const activities = []
  const events = []
  const gaps = []
  for (const row of rows) {
    if (!Number.isFinite(row.elapsedMs)) continue
    const evidence = row.evidence ?? {}
    const event = {
      sequence: row.sequence,
      elapsedMs: row.elapsedMs,
      stage: row.stage ?? row.event,
      method: evidence.method ?? null,
      kind: evidence.kind ?? null,
      tool: row.tool ?? evidence.tool ?? null,
      callId: row.callId ?? evidence.callId ?? null,
      nativeTurnId: evidence.nativeTurnId ?? null
    }
    // Include transport and lifecycle metadata: a tool gap is not an event gap.
    events.push(event)
    if (evidence.phase !== 'public-activity') continue
    const ref = row.diagnostic?.output?.payload
    if (!ref?.path || ref.status !== 'queued') {
      activities.push({ ...event, status: ref?.status ?? 'unavailable' })
      continue
    }
    const value = readPayload(ref)
    if (
      value?.stage !== 'native-public-activity' ||
      value.method !== evidence.method ||
      value.nativeThreadId !== evidence.nativeThreadId ||
      value.nativeTurnId !== evidence.nativeTurnId ||
      (value.itemId !== null && value.itemId !== event.callId)
    )
      throw new Error('Public activity provenance mismatch')
    activities.push({ ...value, ...event, payload: ref })
  }
  if (nativeDiagnostics) {
    const threads = new Set(
      rows.map((row) => row.evidence?.nativeThreadId).filter(Boolean)
    )
    if (!threads.has(nativeDiagnostics.threadId))
      throw new Error('Native diagnostic provenance mismatch')
    for (const boundary of nativeDiagnostics.boundaries ?? []) {
      if (
        boundary.threadId !== nativeDiagnostics.threadId ||
        boundary.processId !== nativeDiagnostics.processId ||
        !Number.isFinite(boundary.elapsedMs) ||
        boundary.elapsedMs < 0 ||
        boundary.elapsedMs >
          nativeDiagnostics.endMs - nativeDiagnostics.startMs ||
        !/^[a-f0-9]{64}$/.test(boundary.bodySha256)
      )
        throw new Error('Native diagnostic provenance mismatch')
      events.push({ ...boundary })
    }
  }
  events.sort((a, b) => a.elapsedMs - b.elapsedMs)
  for (let index = 1; index < events.length; index++) {
    const startMs = events[index - 1].elapsedMs
    const endMs = events[index].elapsedMs
    if (endMs > startMs)
      gaps.push({
        startMs,
        endMs,
        durationMs: endMs - startMs,
        meaning: 'no-recorded-event',
        cause: null
      })
  }
  return {
    ...(nativeDiagnostics ? { nativeDiagnostics } : {}),
    activities,
    events,
    gaps,
    contentCoverage: activities.some(
      (value) => value.status === 'available' || value.status === 'empty'
    )
      ? 'recorded'
      : 'unavailable',
    timingMeaning: nativeDiagnostics
      ? 'public-arrival-and-native-wall-clock'
      : 'public-event-arrival',
    completionInferred: false
  }
}

import type { ExecutionStep } from './records.js'

/** Exclusive observed intervals; item spans never claim hidden model compute time. */
export const partitionExecutionTime = (
  steps: ExecutionStep[],
  durationMs: number
) => {
  const categories = [
    'childProviderMs',
    'appExchangeMs',
    'toolExecutionMs',
    'toolQueueMs',
    'toolUnsplitMs',
    'researchMs',
    'nativeWaitMs',
    'providerOrchestrationEventMs',
    'providerReasoningEventMs',
    'providerResponseEventMs',
    'providerRequestMs',
    'providerWaitMs',
    'appOrchestrationMs',
    'unattributedMs'
  ] as const
  type Category = (typeof categories)[number]
  const spans: { start: number; end: number; category: Category }[] = []
  for (const step of steps) {
    if (step.startedMs === null) continue
    const start = Math.min(durationMs, step.startedMs)
    const end = Math.min(durationMs, step.endedMs ?? durationMs)
    const evidence = step.evidence.filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === 'object'
    )
    const kind = evidence.find((item) => typeof item.kind === 'string')?.kind
    if (step.kind === 'lifecycle') {
      const ownership = evidence.find((item) => typeof item.owner === 'string')
      if (ownership?.owner === 'provider')
        spans.push({
          start,
          end,
          category: ownership.parentCallId
            ? 'childProviderMs'
            : 'providerWaitMs'
        })
      else if (ownership?.owner === 'app')
        spans.push({ start, end, category: 'appOrchestrationMs' })
    } else if (step.kind === 'action') {
      const internal = evidence.some(
        (item) =>
          item.executor === 'app-server' && item.timingScope === 'owner-handoff'
      )
      spans.push({
        start,
        end,
        category: internal ? 'toolExecutionMs' : 'appExchangeMs'
      })
    } else if (step.kind === 'tool') {
      if (step.executionStartedMs != null) {
        const boundary = Math.max(start, Math.min(end, step.executionStartedMs))
        spans.push(
          { start, end: boundary, category: 'toolQueueMs' },
          { start: boundary, end, category: 'toolExecutionMs' }
        )
      } else spans.push({ start, end, category: 'toolUnsplitMs' })
    } else {
      let category: Category = 'unattributedMs'
      if (evidence.some((item) => typeof item.method === 'string'))
        category = 'providerRequestMs'
      if (kind === 'agentMessage') category = 'providerResponseEventMs'
      if (kind === 'reasoning') category = 'providerReasoningEventMs'
      if (kind === 'sleep') category = 'nativeWaitMs'
      if (
        kind === 'functionCallOutput' &&
        ['exec', 'wait'].includes(step.tool ?? '')
      )
        category = 'providerOrchestrationEventMs'
      if (step.kind === 'research') category = 'researchMs'
      spans.push({ start, end, category })
    }
  }
  const events = spans
    .flatMap((span) => [
      { time: span.start, category: span.category, delta: 1 },
      { time: span.end, category: span.category, delta: -1 }
    ])
    .sort((a, b) => a.time - b.time)
  const totals = Object.fromEntries(
    categories.map((key) => [key, 0])
  ) as Record<Category, number>
  const active = new Map<Category, number>()
  let previous = 0
  const add = (end: number) => {
    const category =
      categories.find((key) => (active.get(key) ?? 0) > 0) ?? 'unattributedMs'
    totals[category] += Math.max(0, end - previous)
    previous = end
  }
  for (const event of events) {
    add(event.time)
    active.set(event.category, (active.get(event.category) ?? 0) + event.delta)
  }
  add(durationMs)
  return totals
}

/** Gaps between observable App calls, not inferred model thinking time. */
export const summarizeAppCallGaps = (
  steps: ExecutionStep[],
  durationMs: number
) => {
  const calls = steps
    .filter((step) => step.kind === 'tool' && step.startedMs !== null)
    .sort((a, b) => (a.startedMs ?? 0) - (b.startedMs ?? 0))
  const gaps: {
    startMs: number
    endMs: number
    durationMs: number
    beforeTool: string | null
    afterTool: string | null
  }[] = []
  let end = 0,
    beforeTool: string | null = null
  for (const call of calls) {
    const start = Math.min(durationMs, call.startedMs ?? 0)
    if (start > end)
      gaps.push({
        startMs: end,
        endMs: start,
        durationMs: start - end,
        beforeTool,
        afterTool: call.tool
      })
    const finish = Math.min(durationMs, call.endedMs ?? durationMs)
    if (finish > end) {
      end = finish
      beforeTool = call.tool
    }
  }
  if (end < durationMs)
    gaps.push({
      startMs: end,
      endMs: durationMs,
      durationMs: durationMs - end,
      beforeTool,
      afterTool: null
    })
  return gaps
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 10)
    .map((gap) => ({
      ...gap,
      breakdown: partitionExecutionTime(
        steps.flatMap((step) => {
          if (
            step.startedMs === null ||
            step.startedMs >= gap.endMs ||
            (step.endedMs ?? durationMs) <= gap.startMs
          )
            return []
          return [
            {
              ...step,
              startedMs: Math.max(0, step.startedMs - gap.startMs),
              endedMs: Math.min(
                gap.durationMs,
                (step.endedMs ?? durationMs) - gap.startMs
              ),
              ...(step.executionStartedMs === undefined
                ? {}
                : {
                    executionStartedMs: Math.max(
                      0,
                      step.executionStartedMs - gap.startMs
                    )
                  })
            }
          ]
        }),
        gap.durationMs
      )
    }))
}

/** Inclusive latency is not additive; own time removes the union of explicit children. */
export const summarizeCallDurations = (
  steps: ExecutionStep[],
  durationMs: number
) =>
  steps
    .filter((step) => step.kind === 'tool' || step.kind === 'action')
    .map((step) => {
      const start = step.startedMs ?? 0
      const end = step.endedMs ?? durationMs
      const children = steps
        .filter(
          (child) =>
            child.evidence.some(
              (value) =>
                !!value &&
                typeof value === 'object' &&
                (value as Record<string, unknown>).parentCallId === step.callId
            ) ||
            (
              child.diagnostics?.attribution as
                { parentCallId?: string } | undefined
            )?.parentCallId === step.callId
        )
        .flatMap((child) =>
          child.startedMs === null
            ? []
            : [
                [
                  Math.max(start, child.startedMs),
                  Math.min(end, child.endedMs ?? durationMs)
                ]
              ]
        )
        .sort((a, b) => a[0] - b[0])
      let previous = start,
        childMs = 0
      for (const [from, to] of children) {
        childMs += Math.max(0, to - Math.max(from, previous))
        previous = Math.max(previous, to)
      }
      return {
        callId: step.callId,
        kind: step.kind,
        tool: step.tool,
        inclusiveMs: Math.max(0, end - start),
        ownMs: Math.max(0, end - start - childMs)
      }
    })

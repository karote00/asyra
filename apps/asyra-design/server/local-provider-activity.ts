const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** Select only public activity fields; never persist raw reasoning or prompts. */
export const selectPublicActivity = (
  method: string,
  params: Record<string, unknown>
) => {
  const item = record(params.item) ? params.item : {}
  const itemId = params.itemId ?? item.id
  const base = {
    stage: 'native-public-activity',
    method,
    nativeThreadId: params.threadId,
    nativeTurnId: params.turnId,
    itemId: typeof itemId === 'string' ? itemId : null
  }
  const text = (value: unknown, key: 'text' | 'delta' | 'summary') => {
    if (value == null) {
      return { ...base, status: 'unavailable' }
    }
    if (key === 'summary') {
      if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
        return { ...base, status: 'malformed' }
      }
      return {
        ...base,
        status: value.length ? 'available' : 'empty',
        summary: value
      }
    }
    if (typeof value !== 'string') {
      return { ...base, status: 'malformed' }
    }
    return {
      ...base,
      status: value.length ? 'available' : 'empty',
      [key]: value
    }
  }
  if (method === 'turn/plan/updated') {
    if (!Array.isArray(params.plan)) {
      return { ...base, status: 'malformed' }
    }
    if (
      params.plan.some(
        (v) =>
          !record(v) ||
          typeof v.step !== 'string' ||
          !['pending', 'inProgress', 'completed'].includes(String(v.status))
      )
    ) {
      return { ...base, status: 'malformed' }
    }
    return {
      ...base,
      status: params.plan.length ? 'available' : 'empty',
      plan: params.plan.map((v) => ({ step: v.step, status: v.status })),
      ...(typeof params.explanation === 'string'
        ? { explanation: params.explanation }
        : {})
    }
  }
  if (method === 'item/agentMessage/delta' || method === 'item/plan/delta') {
    return text(params.delta, 'delta')
  }
  if (
    method === 'item/reasoning/summaryTextDelta' ||
    method === 'item/reasoning/summaryPartAdded'
  ) {
    if (
      !Number.isSafeInteger(params.summaryIndex) ||
      Number(params.summaryIndex) < 0
    ) {
      return { ...base, status: 'malformed' }
    }
    const content = method.endsWith('summaryPartAdded')
      ? { ...base, status: 'available' }
      : text(params.delta, 'delta')
    return { ...content, summaryIndex: params.summaryIndex }
  }
  if (method === 'item/completed') {
    if (item.type === 'reasoning') {
      return text(item.summary, 'summary')
    }
    if (item.type === 'agentMessage' || item.type === 'plan') {
      return {
        ...text(item.text, 'text'),
        kind: item.type,
        ...(typeof item.phase === 'string' ? { phase: item.phase } : {})
      }
    }
  }
}

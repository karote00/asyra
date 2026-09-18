export const summarize = (samples) => {
  const ordered = [...samples].sort((left, right) => left - right)
  const percentile = (ratio) => {
    if (ordered.length === 0) return 0
    // The bounded profile budgets p95 and max separately. Use the lower sample
    // quantile so one maximum sample does not make those two oracles identical.
    const index = Math.min(
      ordered.length - 1,
      Math.max(0, Math.floor((ordered.length - 1) * ratio))
    )
    return ordered[index]
  }

  return {
    count: ordered.length,
    totalMs: Number(
      ordered.reduce((total, sample) => total + sample, 0).toFixed(3)
    ),
    p50Ms: Number(percentile(0.5).toFixed(3)),
    p95Ms: Number(percentile(0.95).toFixed(3)),
    maxMs: Number((ordered.at(-1) ?? 0).toFixed(3))
  }
}

export const summarizeStrategyGeometry = (samples) => ({
  overall: summarize(samples),
  firstSampleMs: Number((samples[0] ?? 0).toFixed(3)),
  steadyState: summarize(samples.slice(1))
})

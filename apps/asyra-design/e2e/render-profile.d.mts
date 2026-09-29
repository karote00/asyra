export interface PhaseBudget {
  count: number
  totalMs: number
  p50Ms: number
  p95Ms: number
  maxMs: number
}
export function summarize(samples: number[]): PhaseBudget
export function summarizeStrategyGeometry(samples: number[]): {
  overall: PhaseBudget
  firstSampleMs: number
  steadyState: PhaseBudget
}

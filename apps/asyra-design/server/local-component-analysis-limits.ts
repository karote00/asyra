/** Request-owned analysis budgets, separate from mutating operation limits. */
export const LocalComponentAnalysisLimits = Object.freeze({
  pathsPerCall: 128,
  pathsPerJob: 16,
  pathsPerRequest: 128,
  callsPerRequest: 128,
  contourSummariesPerPath: 8,
  samplesPerPath: 8192,
  intersectionChecksPerPath: 100_000
})

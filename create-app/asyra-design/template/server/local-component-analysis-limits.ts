/** Per-call input/work limits and concurrent provider admission; no request-total quota. */
export const LocalComponentAnalysisLimits = Object.freeze({
  pathsPerCall: 128,
  pathsPerJob: 16,
  callsInFlight: 128,
  receiptIdsPerCall: 128,
  contourSummariesPerPath: 8,
  samplesPerPath: 8192,
  intersectionChecksPerPath: 100_000
})

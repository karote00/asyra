import type { evaluateExecution } from './evaluation.js'

type ExecutionReport = ReturnType<typeof evaluateExecution>
export interface AssessmentInput {
  sourceRequestId: string
  criteria: string[]
  purpose: 'process' | 'visual'
  [key: string]: unknown
}
export interface ExecutionAssessment {
  purpose: 'process' | 'visual'
  status: 'recorded' | 'reused' | 'unavailable' | 'failed'
  sourceRequestId: string | null
  assessmentRequestId: string | null
  durationMs: number
  reason?: string
  opinion?: unknown
  criteria: string[]
}
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const boundedText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 2000

/** One explicit assessment, after execution. No retry, mutation or per-call model loop. */
export const assessExecution = async (
  report: ExecutionReport,
  options: {
    purpose: 'process' | 'visual'
    criteria: string[]
    provider?: (
      summary: AssessmentInput
    ) => Promise<{ requestId: string; value: unknown }>
    now?: () => number
  }
): Promise<ExecutionAssessment> => {
  const result: ExecutionAssessment = {
    purpose: options.purpose,
    status: 'unavailable',
    sourceRequestId: report.requestId,
    assessmentRequestId: null,
    durationMs: 0,
    criteria: options.criteria
  }
  if (
    !report.requestId ||
    !options.criteria.length ||
    !options.criteria.every(boundedText)
  )
    return { ...result, reason: 'MISSING_ASSESSMENT_INPUT' }
  const review = report.modelReview
  if (
    options.purpose === 'visual' &&
    review.current &&
    Array.isArray(review.inspectionIds) &&
    review.inspectionIds.length &&
    Array.isArray(review.checks) &&
    options.criteria.every((criterion) =>
      (review.checks as unknown[]).some(
        (check) =>
          record(check) &&
          check.requirement === criterion &&
          ['pass', 'fail', 'unverified'].includes(String(check.status))
      )
    )
  )
    return { ...result, status: 'reused', opinion: review }
  if (!options.provider)
    return { ...result, reason: 'ASSESSMENT_PROVIDER_UNAVAILABLE' }

  // The report retains every call. The optional model receives an explicit
  // investigation subset, prioritizing unsuccessful work then long observed calls.
  const calls = [...report.toolCalls]
    .sort(
      (a, b) =>
        Number(b.status !== 'completed') - Number(a.status !== 'completed') ||
        (b.durationMs ?? 0) - (a.durationMs ?? 0)
    )
    .slice(0, 40)
  const includedIds = new Set(calls.map((call) => call.callId))
  const summary: AssessmentInput = {
    sourceRequestId: report.requestId,
    purpose: options.purpose,
    criteria: options.criteria,
    recordComplete: report.complete,
    outcome: report.outcome,
    timing: report.timing,
    usage: report.usage,
    calls: calls.map(({ selectors: _selectors, ...summary }) => summary),
    omittedCallCount: report.toolCalls.length - calls.length,
    findings: report.findings.filter(
      (finding) => finding.callId === null || includedIds.has(finding.callId)
    ),
    caveats: [
      'Unattributed time is not measured reasoning time.',
      'No images or original prompt are supplied. Visual correctness is unknown.',
      'Reported failure can have later successful recovery; do not infer causal failure from one call.',
      'This diagnostic subset is not the entire execution.'
    ]
  }
  const now = options.now ?? (() => performance.now())
  const started = now()
  try {
    const response = await options.provider(summary)
    result.assessmentRequestId = response.requestId
    const opinion = response.value
    if (
      !record(opinion) ||
      !boundedText(opinion.overall) ||
      !Array.isArray(opinion.findings) ||
      opinion.findings.length > 40 ||
      !opinion.findings.every(
        (finding) =>
          record(finding) &&
          (finding.callId === null ||
            (typeof finding.callId === 'string' &&
              includedIds.has(finding.callId))) &&
          ['good', 'needs-investigation', 'unknown'].includes(
            String(finding.assessment)
          ) &&
          boundedText(finding.observation) &&
          boundedText(finding.proposal)
      )
    )
      return {
        ...result,
        status: 'failed',
        durationMs: Math.max(0, now() - started),
        reason: 'INVALID_ASSESSMENT'
      }
    // Keep only the declared opinion fields, not arbitrary model-supplied payloads.
    return {
      ...result,
      status: 'recorded',
      durationMs: Math.max(0, now() - started),
      opinion: {
        overall: opinion.overall,
        findings: opinion.findings.map(
          ({ callId, assessment, observation, proposal }) => ({
            callId,
            assessment,
            observation,
            proposal
          })
        )
      }
    }
  } catch (error) {
    if (
      record(error) &&
      typeof error.requestId === 'string' &&
      /^[a-zA-Z0-9_-]{1,160}$/.test(error.requestId)
    )
      result.assessmentRequestId = error.requestId
    return {
      ...result,
      status: 'failed',
      durationMs: Math.max(0, now() - started),
      reason: 'ASSESSMENT_FAILED'
    }
  }
}

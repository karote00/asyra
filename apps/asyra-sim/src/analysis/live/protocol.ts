import type { ExperimentSnapshot } from '../contracts'
import type {
  MethodEvidence,
  MethodPairEvidence
} from '../../extensions/contracts'

export const LiveMessages = {
  OPEN: 'open',
  READY: 'ready',
  SAMPLE: 'sample',
  INTERVAL: 'interval',
  PROGRESS: 'progress',
  RESULT: 'result',
  ERROR: 'error',
  INTERVAL_RESULT: 'interval-result',
  INTERVAL_ERROR: 'interval-error'
} as const

export const LIVE_LIMITS = Object.freeze({
  samplePeriodMs: 50,
  sampleDurationMs: 500,
  maxIncompleteSampleContinuations: 2,
  startupDurationMs: 10_000,
  responseGraceMs: 250,
  maxRecordedSamples: 256,
  maxRecordedDiagnostics: 16,
  maxDiagnosticPairIds: 256,
  maxBackgroundIntervals: 16,
  maxBackgroundIntervalEvaluations: 64
})

export type LiveRequest =
  | { type: typeof LiveMessages.OPEN; snapshot: ExperimentSnapshot }
  | { type: typeof LiveMessages.SAMPLE; id: number; time: number }
  | {
      type: typeof LiveMessages.SAMPLE
      id: number
      time: number
      acceptedPairs: readonly MethodPairEvidence[]
    }
  | {
      type: typeof LiveMessages.INTERVAL
      id: number
      interval: readonly [number, number]
      maxIntervals: number
    }

export interface LiveSampleDiagnostic {
  requestId: number
  snapshotId: string
  candidateId: string
  experimentId: string
  experimentRevision: number
  methodId: string
  methodVersion: string
  sampleTime: number
  minimumClearance: number
  distanceTolerance: number
  timeTolerance: number
  maxIterations: number
  methodParameters: Readonly<Record<string, number | boolean | string>>
  configuredDurationMs: number
  effectiveDurationMs: number
  maxIntervals: number
  acceptedEvaluations: number
  availableEvaluations: number
  completedEvaluations: number | null
  completedPairCount: number
  partialPairCount: number
  missingPairCount: number
  pairIdsTruncated: boolean
  elapsedMs: number
  checkpoint: string
  stopCause:
    | 'completed'
    | 'deadline'
    | 'executor-error'
    | 'validation-error'
    | 'transport-error'
  errorName: string | null
  errorMessage: string | null
  completedPairIds: readonly string[]
  partialPairIds: readonly string[]
  missingPairIds: readonly string[]
}

export interface LiveDiagnosticRecord {
  diagnosticId: number
  worker: LiveSampleDiagnostic
  requestElapsedMs: number
  runnerOutcome: 'complete' | 'incomplete' | 'rejected'
  runnerError: string | null
  previewPublication: {
    time: number
    checkedTime: number
    feedbackKind: string
    issuePairIds: readonly string[]
    issuePairCount: number
    issuePairIdsTruncated: boolean
  } | null
}

export type LiveResponse =
  | { type: typeof LiveMessages.READY }
  | {
      type: typeof LiveMessages.PROGRESS
      id: number
      time: number
      pairs: readonly MethodPairEvidence[]
    }
  | {
      type: typeof LiveMessages.RESULT
      id: number
      time: number
      evidence: MethodEvidence
      diagnostic?: LiveSampleDiagnostic
    }
  | {
      type: typeof LiveMessages.ERROR
      id: number
      time: number
      pairs: readonly MethodPairEvidence[]
      diagnostic?: LiveSampleDiagnostic
    }
  | {
      type: typeof LiveMessages.INTERVAL_RESULT
      id: number
      interval: readonly [number, number]
      evidence: MethodEvidence
    }
  | {
      type: typeof LiveMessages.INTERVAL_ERROR
      id: number
      interval: readonly [number, number]
    }

export interface LiveSample {
  time: number
  requestId?: number
  diagnosticId?: number
  pairs: readonly MethodPairEvidence[]
  totalPairCount: number
  complete: boolean
  error: string | null
  evidenceOrigin?: 'interval'
}

export interface LiveState {
  status: 'idle' | 'preparing' | 'checking' | 'ready' | 'error'
  sample: LiveSample | null
  error: string | null
}

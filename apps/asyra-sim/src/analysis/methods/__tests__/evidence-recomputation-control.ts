import { vi } from 'vitest'
import * as continuous from '../continuous-query'

/** Retain the pre-handoff temporal baseline for explicitly historical hypotheses. */
export function useEvidenceRecomputationControl(): void {
  const query = continuous.queryContinuousPair
  vi.spyOn(continuous, 'queryContinuousPair').mockImplementation(
    (input, settings, checkpoint, kernel) =>
      query(
        input,
        settings,
        checkpoint,
        kernel
          ? {
              ...kernel,
              handoffEvidence: undefined,
              lowerUsesPositiveWitnessOnly: undefined
            }
          : kernel
      )
  )
}

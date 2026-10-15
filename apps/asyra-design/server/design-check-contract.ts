import type { createReferenceDecisions } from './local-reference-decisions'

export interface DesignCheckContext {
  criteria: Record<string, { requirement: string }>
  referenceImageIndexes?: number[]
  requirementRevision?: number
  referenceDecisions?: ReturnType<
    ReturnType<typeof createReferenceDecisions>['snapshot']
  >
}
export interface DesignCheckAssessment {
  suggestions?: string[]
  overall: { status: 'pass' | 'fail' | 'unverified'; evidence: string }
  checks: {
    criterionId: string
    status: 'pass' | 'fail' | 'unverified'
    evidence: string
  }[]
}

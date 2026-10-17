import type { createReferenceDecisions } from './local-reference-decisions'

export interface DesignCheckContext {
  criteria: Record<string, { requirement: string }>
  requirementRevision?: number
  referenceUses?: ReturnType<
    ReturnType<typeof createReferenceDecisions>['resolve']
  >[]
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

/** Pure session interruption contract; Feature System owns execution. */
export const SessionCancelPolicies = {
  ROLLBACK: 'rollback',
  COMMIT_CURRENT: 'commit-current',
  FEATURE_DEFINED: 'feature-defined'
} as const

export type SessionCancelPolicy =
  (typeof SessionCancelPolicies)[keyof typeof SessionCancelPolicies]

export type SessionCancelOutcome =
  | typeof SessionCancelPolicies.ROLLBACK
  | typeof SessionCancelPolicies.COMMIT_CURRENT

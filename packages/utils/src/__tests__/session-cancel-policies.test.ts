import { describe, expect, it } from 'vitest'
import {
  SessionCancelPolicies,
  type SessionCancelOutcome,
  type SessionCancelPolicy
} from '../index.js'

// Checked by TypeScript as well as exercised through the public package entry.
const acceptsPolicy = (value: SessionCancelPolicy) => value
const acceptsOutcome = (value: SessionCancelOutcome) => value

describe('public session cancellation policies', () => {
  it('exports the exact policies without widening their literal types', () => {
    expect(SessionCancelPolicies).toEqual({
      ROLLBACK: 'rollback',
      COMMIT_CURRENT: 'commit-current',
      FEATURE_DEFINED: 'feature-defined'
    })
    for (const value of Object.values(SessionCancelPolicies)) {
      expect(acceptsPolicy(value)).toBe(value)
    }
    expect(acceptsOutcome(SessionCancelPolicies.ROLLBACK)).toBe('rollback')
    expect(acceptsOutcome(SessionCancelPolicies.COMMIT_CURRENT)).toBe(
      'commit-current'
    )
  })
})

// Compile-time regressions: these calls must remain rejected, not widened to string.
// @ts-expect-error Misspelled policy is not part of the public contract.
acceptsPolicy('commit-curent')
// @ts-expect-error A feature-defined handler must resolve to a concrete outcome.
acceptsOutcome(SessionCancelPolicies.FEATURE_DEFINED)
// @ts-expect-error Constant keys must be spelled correctly.
acceptsPolicy(SessionCancelPolicies.COMMIT_CURENT)

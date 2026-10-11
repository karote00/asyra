import { describe, expect, it } from 'vitest'
import { MutationRecoveryError } from '../types/transaction.js'

describe('canonical mutation recovery evidence', () => {
  it('preserves the original failure and isolates the cleanup failure list from later mutations', () => {
    const cause = new Error('Publication failed')
    const cleanupFailure = new Error('Membership cleanup failed')
    const failures = [cleanupFailure]
    const error = new MutationRecoveryError(cause, failures)

    failures.length = 0

    expect(error).toBeInstanceOf(Error)
    expect(error.cause).toBe(cause)
    expect(error.recoveryFailures).toEqual([cleanupFailure])
    expect(Object.isFrozen(error.recoveryFailures)).toBe(true)
    expect(error.name).toBe('MutationRecoveryError')
  })

  it('retains a non-Error thrown cause without fabricating a different failure', () => {
    const error = new MutationRecoveryError('lost membership', [undefined])
    expect(error.cause).toBe('lost membership')
    expect(error.recoveryFailures).toEqual([undefined])
  })
})

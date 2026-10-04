import { describe, expect, it } from 'vitest'
import { initApp } from '../init-app.js'
import { resetCore, waitForCore } from '../../contexts/core.js'

// Permanent review regressions: a mounting host may leave before start settles,
// and multiple teardown callers must observe the same completion boundary.
describe('App lifecycle review regressions', () => {
  it('waits for startup before disposal and leaves the next mount usable', async () => {
    const app = initApp()
    const starting = app.start(document.createElement('div'))
    const closing = app.dispose().then(
      () => null,
      (error: unknown) => error
    )
    await starting
    const failure = await closing
    const nextMountFailure = await waitForCore().then(
      () => null,
      (error: unknown) => error
    )
    try {
      expect({ failure, nextMountFailure }).toEqual({
        failure: null,
        nextMountFailure: null
      })
    } finally {
      // Recover the real Core after the failed disposal so this regression
      // cannot contaminate the other formal App tests.
      if (failure) await resetCore()
    }
  })

  it('makes a repeated disposal await the in-progress Core reset', async () => {
    const app = initApp()
    await app.start(document.createElement('div'))
    const closing = app.dispose()
    try {
      await app.dispose()
      expect(app.core.getRuntimeState()).toBe('retired')
    } finally {
      await closing
    }
  })
  it('lets a mount requested during teardown initialize only after the old Core is retired', async () => {
    const app = initApp()
    const starting = app.start(document.createElement('div'))
    const closing = app.dispose().then(
      () => null,
      (error: unknown) => error
    )
    const nextMount = waitForCore().then(
      () => ({ app: initApp() }),
      (error: unknown) => ({ error })
    )
    await starting
    const failure = await closing
    const result = await nextMount
    try {
      expect(failure).toBeNull()
      expect('app' in result).toBe(true)
      if ('app' in result) {
        await result.app.start(document.createElement('div'))
        expect(result.app.core.getRuntimeState()).toBe('active')
      }
    } finally {
      if ('app' in result) await result.app.dispose()
      else if (failure) await resetCore()
    }
  })

  it('still retires Core when the startup being awaited rejects', async () => {
    const app = initApp()
    const startupError = new Error('Load source unavailable')
    app.core.setLoadSource({
      name: 'failing-source',
      load: async () => {
        throw startupError
      }
    })
    const starting = app.start(document.createElement('div')).then(
      () => null,
      (error: unknown) => error
    )
    const closing = app.dispose().then(
      () => null,
      (error: unknown) => error
    )
    const startupFailure = await starting
    const closeFailure = await closing
    try {
      expect(startupFailure).toBe(startupError)
      expect(closeFailure).toBeNull()
      expect(app.core.getRuntimeState()).toBe('retired')
    } finally {
      if (closeFailure) await resetCore()
    }
  })
})

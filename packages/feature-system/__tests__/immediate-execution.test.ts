import { SessionCancelPolicies } from '@asyra/utils'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import type { RawInputEvent, SystemContextSnapshot } from '@asyra/utils'
import type { InputSystemLike } from '../src/types/core-packages'

const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const snapshot = () => ({}) as SystemContextSnapshot
const raw = {} as RawInputEvent
class InputHost implements InputSystemLike {
  readonly listeners = new Map<
    string,
    (raw: RawInputEvent) => void | Promise<void>
  >()
  on(event: string, callback: (raw: RawInputEvent) => void | Promise<void>) {
    this.listeners.set(event, callback)
  }
  off(event: string) {
    return this.listeners.delete(event)
  }
}

describe('immediate Feature execution through existing session settlement', () => {
  let runtime: typeof import('../src')
  let input: InputHost
  let queueAdmissions: ReturnType<typeof vi.fn>
  beforeEach(async () => {
    vi.resetModules()
    const { interactionQueue } = await import('../src/core/interaction-queue')
    const createRunner = interactionQueue.createRunner.bind(interactionQueue)
    queueAdmissions = vi.fn()
    vi.spyOn(interactionQueue, 'createRunner').mockImplementation(() => {
      const run = createRunner()
      return (operation) => {
        queueAdmissions()
        return run(operation)
      }
    })
    runtime = await import('../src')
    input = new InputHost()
    runtime.setCorePackages({
      inputSystem: input,
      systemContext: { getSystemContextSnapshot: snapshot }
    })
  })
  afterEach(async () => {
    await runtime.disposeFeatureSystem(snapshot)
  })
  const emit = (event: string) => input.listeners.get(event)?.(raw)

  it('starts idle execution synchronously without entering the queue and ignores overlap', async () => {
    const gate = deferred(),
      calls: string[] = []
    runtime.defineFeature('history', 'history', {
      executionMode: 'immediate',
      execution: async () => {
        calls.push('history')
        await gate.promise
        return {}
      }
    })
    const first = emit('history')
    const atReturn = [...calls]
    const second = emit('history')
    gate.resolve()
    await Promise.all([first, second])
    expect(atReturn).toEqual(['history'])
    expect(calls).toEqual(['history'])
    expect(queueAdmissions).not.toHaveBeenCalled()
    await emit('history')
    expect(calls).toEqual(['history', 'history'])
  })

  it.each([false, true])(
    'settles an active update and existing finalizer exactly once, failure=%s',
    async (fail) => {
      const updateStarted = deferred(),
        updateGate = deferred(),
        endStarted = deferred(),
        endGate = deferred()
      const order: string[] = []
      runtime.defineFeature('drag', 'drag', {
        session: {
          onStart: () => ({}),
          onUpdate: async () => {
            updateStarted.resolve()
            await updateGate.promise
            order.push('update')
          },
          onEnd: async () => {
            endStarted.resolve()
            await endGate.promise
            order.push('end')
            if (fail) throw new Error('end failed')
          }
        }
      })
      runtime.defineFeature('history', 'history', {
        executionMode: 'immediate',
        execution: () => {
          order.push('history')
          return {}
        }
      })
      runtime.defineFeature('other', 'other', {
        execution: () => {
          order.push('other')
          return {}
        }
      })
      await emit('drag.start')
      const update = emit('drag.update')
      await updateStarted.promise
      const other = emit('other')
      const history = Promise.resolve(emit('history')).then(
        () => 'ok',
        (e: Error) => e.message
      )
      const repeated = emit('history')
      updateGate.resolve()
      await endStarted.promise
      const beforeEnd = [...order]
      endGate.resolve()
      await Promise.all([update, other, repeated])
      expect(beforeEnd).toEqual(['update'])
      expect(await history).toBe(fail ? 'end failed' : 'ok')
      expect(order).toEqual(
        fail
          ? ['update', 'end', 'other']
          : ['update', 'end', 'history', 'other']
      )
      expect(runtime.getSessionManager().getAllActiveSessions().size).toBe(0)
      await emit('history')
      expect(order.at(-1)).toBe('history')
    }
  )

  it('does not run deferred history after runtime closure during finalization', async () => {
    const started = deferred(),
      gate = deferred(),
      replay = vi.fn(() => ({}))
    runtime.defineFeature('drag', 'drag', {
      session: {
        onStart: () => ({}),
        onEnd: async () => {
          started.resolve()
          await gate.promise
        }
      }
    })
    runtime.defineFeature('history', 'history', {
      executionMode: 'immediate',
      execution: replay
    })
    await emit('drag.start')
    const request = Promise.resolve(emit('history')).catch((e: Error) => e)
    await started.promise
    const closing = runtime.disposeFeatureSystem(snapshot)
    gate.resolve()
    await closing
    expect(await request).toMatchObject({ code: 'FEATURE_RUNTIME_CLOSED' })
    expect(replay).not.toHaveBeenCalled()
  })
  it('uses the existing rollback policy instead of committing an interrupted session', async () => {
    const order: string[] = []
    runtime.defineFeature('drag', 'drag', {
      cancelPolicy: SessionCancelPolicies.ROLLBACK,
      session: {
        onStart: () => ({}),
        onEnd: () => {
          order.push('end')
        },
        onCancel: () => {
          order.push('cancel')
          return SessionCancelPolicies.ROLLBACK
        }
      }
    })
    runtime.defineFeature('history', 'history', {
      executionMode: 'immediate',
      execution: () => {
        order.push('history')
        return {}
      }
    })
    await emit('drag.start')
    await emit('history')
    expect(order).toEqual(['cancel', 'history'])
  })

  it('rejects a conflicting shared execution mode without leaving a partial registration', async () => {
    runtime.defineFeature('history', 'history', {
      executionMode: 'immediate',
      execution: () => ({})
    })
    expect(() =>
      runtime.defineFeature('conflict', 'history', { execution: () => ({}) })
    ).toThrow()
    expect(runtime.getFeatureRegistry().has('conflict')).toBe(false)
    await emit('history')
  })

  it('rejects retained immediate callers after disposal and permits a fresh runtime', async () => {
    const replay = vi.fn(() => ({}))
    runtime.defineFeature('history', 'history', {
      executionMode: 'immediate',
      execution: replay
    })
    const retained = input.listeners.get('history')
    if (!retained) throw new Error('Missing history binding')
    await runtime.disposeFeatureSystem(snapshot)
    runtime.beginFeatureSystemRuntime()
    runtime.setCorePackages({
      inputSystem: input,
      systemContext: { getSystemContextSnapshot: snapshot }
    })
    runtime.defineFeature('history', 'history', {
      executionMode: 'immediate',
      execution: replay
    })
    await expect(retained(raw)).rejects.toMatchObject({
      code: 'FEATURE_RUNTIME_CLOSED'
    })
    await emit('history')
    expect(replay).toHaveBeenCalledTimes(1)
  })
  it('the existing interaction owner itself prevents execution before the running operation settles', async () => {
    const queue = new runtime.InteractionQueue()
    const started = deferred(),
      gate = deferred()
    const order: string[] = []
    const running = queue.run(async () => {
      started.resolve()
      await gate.promise
      order.push('running')
    })
    await started.promise
    const immediate = queue.createImmediateRunner()(() => {
      order.push('immediate')
    })
    const beforeSettlement = [...order]
    gate.resolve()
    await Promise.all([running, immediate])
    expect(beforeSettlement).toEqual([])
    expect(order).toEqual(['running', 'immediate'])
    await queue.close()
  })
  it('does not deliver an interrupted invocation to a replacement registration', async () => {
    const started = deferred(),
      gate = deferred()
    const oldReplay = vi.fn(() => ({})),
      replacementReplay = vi.fn(() => ({}))
    runtime.defineFeature('drag', 'drag', {
      session: {
        onStart: () => ({}),
        onEnd: async () => {
          started.resolve()
          await gate.promise
        }
      }
    })
    runtime.defineFeature('old', 'history', {
      executionMode: 'immediate',
      execution: oldReplay
    })
    await emit('drag.start')
    const request = emit('history')
    await started.promise
    runtime.unregisterFeature('old')
    runtime.defineFeature('replacement', 'history', {
      executionMode: 'immediate',
      execution: replacementReplay
    })
    gate.resolve()
    await request
    expect(oldReplay).not.toHaveBeenCalled()
    expect(replacementReplay).not.toHaveBeenCalled()
    await emit('history')
    expect(replacementReplay).toHaveBeenCalledTimes(1)
  })
})

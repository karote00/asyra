import { describe, expect, it, vi } from 'vitest'
import * as runtime from '../index.js'

describe('shared invocation dispatch', () => {
  it('observes concurrent non-drawing calls and preserves result and error identity', async () => {
    expect(runtime).toHaveProperty('createAiInvoker')
    const events: unknown[] = []
    const result = { stock: 7 }
    const error = new Error('missing stock')
    const invoker = runtime.createAiInvoker({
      execute: async (call: { name: string }) => {
        if (call.name === 'missing') throw error
        return result
      },
      observe: (event: unknown) => {
        events.push(event)
      }
    })
    const calls = await Promise.allSettled([
      invoker.invoke({
        name: 'read',
        input: {},
        callId: 'a',
        parentCallId: 'root'
      }),
      invoker.invoke({
        name: 'missing',
        input: {},
        callId: 'b',
        parentCallId: 'root'
      })
    ])
    expect(calls).toEqual([
      { status: 'fulfilled', value: result },
      { status: 'rejected', reason: error }
    ])
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          phase: 'started',
          call: expect.objectContaining({ callId: 'a' })
        }),
        expect.objectContaining({ phase: 'completed', output: result }),
        expect.objectContaining({ phase: 'failed', error })
      ])
    )
  })

  it('prevents a middleware from executing a canonical write twice', async () => {
    expect(runtime).toHaveProperty('createAiInvoker')
    const execute = vi.fn(async () => 'saved')
    const invoker = runtime.createAiInvoker({
      execute,
      middleware: [
        async (_call, next) => {
          await next()
          return next()
        }
      ]
    })
    await expect(invoker.invoke({ name: 'write', input: {} })).rejects.toThrow(
      'once'
    )
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('records cancellation before dispatch and isolates observer failures', async () => {
    expect(runtime).toHaveProperty('createAiInvoker')
    const execute = vi.fn(async () => 42)
    const observe = vi.fn(() => {
      throw new Error('sink closed')
    })
    const invoker = runtime.createAiInvoker({ execute, observe })
    expect(await invoker.invoke({ name: 'read', input: {} })).toBe(42)
    const controller = new AbortController()
    controller.abort()
    await expect(
      invoker.invoke({ name: 'read', input: {}, signal: controller.signal })
    ).rejects.toBe(controller.signal.reason)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(observe).toHaveBeenLastCalledWith(
      expect.objectContaining({ phase: 'cancelled' })
    )
  })
})

it('does not finish while middleware leaves its invoked executor pending', async () => {
  let release!: () => void
  const work = new Promise<void>((resolve) => {
    release = resolve
  })
  const observe = vi.fn()
  const invoker = runtime.createAiInvoker({
    execute: async () => {
      await work
      return 'saved'
    },
    middleware: [
      async (_call, next) => {
        void next()
        return 'accepted'
      }
    ],
    observe
  })
  let complete = false
  const invocation = invoker.invoke({ name: 'save', input: {} }).then(() => {
    complete = true
  })
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(complete).toBe(false)
  release()
  await invocation
  expect(observe).toHaveBeenLastCalledWith(
    expect.objectContaining({ phase: 'completed' })
  )
})

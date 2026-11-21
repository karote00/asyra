import { expect, it, vi } from 'vitest'
import {
  createNativeConversations,
  createNativeSession
} from '../node/index.js'

it('binds native history to one conversation and exact contract without retaining executors', async () => {
  const registry = createNativeConversations()
  const first = registry.acquire('one', { model: 'm', tools: ['a'] })

  expect(first.threadId).toBeUndefined()
  expect(() => registry.acquire('one', { model: 'm', tools: ['a'] })).toThrow(
    'busy'
  )
  first.bind('thread-one')
  first.release()
  const next = registry.acquire('one', { tools: ['a'], model: 'm' })

  expect(next.threadId).toBe('thread-one')
  expect(() => first.bind('late')).toThrow('released')
  next.release()
  expect(() => registry.acquire('one', { model: 'm', tools: ['b'] })).toThrow(
    'contract changed'
  )
  expect(
    registry.acquire('two', { model: 'm', tools: ['b'] }).threadId
  ).toBeUndefined()
  registry.dispose()
  expect(() => registry.acquire('three', {})).toThrow('closed')
})

it('rejects wrong resumed identity before publishing it or starting a turn', async () => {
  const registry = createNativeConversations()
  const original = registry.acquire('one', {})

  original.bind('original')
  original.release()
  const lease = registry.acquire('one', {})
  const request = vi.fn(
    async (
      _method: string,
      _params: unknown,
      admit?: (value: unknown) => void
    ) => {
      const value = { thread: { id: 'wrong' } }

      admit?.(value)

      return value
    }
  )
  const session = createNativeSession({ request, write: vi.fn() })

  await expect(session.open({}, lease)).rejects.toThrow('identity')
  expect(session.threadId).toBeUndefined()
  expect(lease.threadId).toBe('original')
  expect(request).toHaveBeenCalledTimes(1)
  expect(request.mock.calls[0][0]).toBe('thread/resume')
  lease.release()
})

it('does not replace a lost thread or replay a failed turn', async () => {
  const registry = createNativeConversations()
  const initial = registry.acquire('one', {})

  initial.bind('original')
  initial.release()
  const lease = registry.acquire('one', {})
  const request = vi.fn(async () => {
    throw Error('history unavailable')
  })
  const session = createNativeSession({ request, write: vi.fn() })

  await expect(session.open({}, lease)).rejects.toThrow('history unavailable')
  expect(request).toHaveBeenCalledTimes(1)
  expect(lease.threadId).toBe('original')
  lease.release()
})

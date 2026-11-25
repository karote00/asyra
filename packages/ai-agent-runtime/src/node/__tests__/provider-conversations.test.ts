import { expect, it } from 'vitest'
import { createProviderConversations } from '../provider-conversations.js'

it('reuses protocol state exclusively without retaining a turn executor', () => {
  const registry = createProviderConversations<readonly string[]>()
  const lease = registry.acquire('a', { model: 'm', tools: ['x'] })

  expect(lease.state).toBeUndefined()
  expect(() => registry.acquire('a', { tools: ['x'], model: 'm' })).toThrow(
    'busy'
  )
  lease.checkpoint(['call', 'result'])
  lease.release()
  expect(() => lease.checkpoint(['late'])).toThrow('released')
  const next = registry.acquire('a', { tools: ['x'], model: 'm' })

  expect(next.state).toEqual(['call', 'result'])
  next.release()
  expect(() => registry.acquire('a', { model: 'other' })).toThrow(
    'contract changed'
  )
  expect(registry.acquire('b', {}).state).toBeUndefined()
  registry.dispose()
  expect(() => registry.acquire('c', {})).toThrow('closed')
})

it('does not silently restore an unresolved or invalidated execution', () => {
  const registry = createProviderConversations<string>()
  const lease = registry.acquire('a', {})

  lease.checkpoint('acknowledged mutation')
  lease.invalidate()
  lease.release()
  expect(() => registry.acquire('a', {})).toThrow('unavailable')
  expect(() => registry.acquire(' ', {})).toThrow('identity')
})

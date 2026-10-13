import { afterEach, expect, it, vi } from 'vitest'
import {
  isToolLibraryRequest,
  readToolLibrary,
  updateToolLibrary
} from '../tool-library-management'
afterEach(() => vi.unstubAllGlobals())
it.each([
  {},
  { operation: 'invoke' },
  { operation: 'list', input: {} },
  { operation: 'remove', name: 'tool', revision: 1, expectedVersion: '' },
  { operation: 'remove', name: 'tool', revision: -1, expectedVersion: '1' },
  {
    operation: 'remove',
    name: 'tool',
    revision: 1,
    expectedVersion: '1',
    input: {}
  }
])('refuses malformed or executable management input %j', (input) => {
  expect(isToolLibraryRequest(input)).toBe(false)
})
it('refuses malformed inventory without claiming an empty library', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ entries: [] }) }))
  )
  await expect(readToolLibrary(new AbortController().signal)).rejects.toThrow(
    'inventory was invalid'
  )
})
it('does not accept an acknowledgement for the wrong requested state', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: 'saved',
        availability: 'eligible',
        version: '2'
      })
    }))
  )
  await expect(
    updateToolLibrary(
      { operation: 'remove', name: 'tool', revision: 1, expectedVersion: '1' },
      new AbortController().signal
    )
  ).rejects.toThrow('not acknowledged')
})

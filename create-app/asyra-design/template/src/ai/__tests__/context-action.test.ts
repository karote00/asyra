import { describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
import { createDocumentContextAction } from '../context-action'

describe('document context action', () => {
  it('forwards a page to the read owner and returns its receipt', async () => {
    const receipt = { available: true, elements: [], nextOffset: null }
    const read = vi.fn(() => receipt)
    const action = createDocumentContextAction(read as never)
    const query = { scope: 'children' as const, limit: 10 }
    const result = await action.execute(query, {
      signal: new AbortController().signal
    } as never)
    expect(result).toBe(receipt)
    expect(read).toHaveBeenCalledExactlyOnceWith(query)
  })
  it('does not read after cancellation', async () => {
    const read = vi.fn()
    const controller = new AbortController()
    controller.abort()
    await expect(
      createDocumentContextAction(read).execute({ scope: 'selection' }, {
        signal: controller.signal
      } as never)
    ).rejects.toThrow('cancelled')
    expect(read).not.toHaveBeenCalled()
  })
})

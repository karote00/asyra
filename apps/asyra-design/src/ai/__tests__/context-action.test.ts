import { describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
import { createDocumentContextAction } from '../context-action'
import {
  operationInputIssue,
  nativeToolInputSchema
} from '../../../server/operation-input-schema'

describe('document context action', () => {
  it('forwards a page to the read owner and returns its receipt', async () => {
    const receipt = { available: true, elements: [], nextOffset: null }
    const read = vi.fn(() => receipt)
    const action = createDocumentContextAction(read as never)
    const query = { scope: 'children' as const, limit: 10 }
    const signal = new AbortController().signal
    const result = await action.execute(query, { signal } as never)
    expect(result).toBe(receipt)
    expect(read).toHaveBeenCalledExactlyOnceWith(query, signal)
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

it('advertises the same snapshot-only fields to native tools and action admission', () => {
  const schema = createDocumentContextAction().inputSchema
  const valid = {
    scope: 'snapshot',
    snapshotId: 'saved',
    offset: 20,
    limit: 10,
    delivery: 'columns'
  }
  for (const definition of [schema, nativeToolInputSchema(schema)]) {
    expect(operationInputIssue(valid, definition)).toBeUndefined()
    expect(operationInputIssue({ scope: 'snapshot' }, definition)).toBeDefined()
    expect(
      operationInputIssue({ ...valid, fields: ['x'] }, definition)
    ).toBeDefined()
    expect(
      operationInputIssue(
        { scope: 'selection', snapshotId: 'saved' },
        definition
      )
    ).toBeDefined()
  }
})

import { describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
import {
  createDocumentContextAction,
  createDocumentContextReleaseAction
} from '../context-action'
import {
  operationInputIssue,
  nativeToolInputSchema
} from '../../../server/operation-input-schema'

describe('document context action', () => {
  it('forwards a page to the read owner and returns its receipt', async () => {
    const receipt = { available: true, elements: [], nextOffset: null }
    const read = vi.fn(() => receipt)
    const action = createDocumentContextAction(read as never)
    const query = {
      scope: 'children' as const,
      limit: 10,
      delivery: 'page' as const
    }
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
    delivery: 'columns',
    filter: { name: { prefix: 'tier-3-', suffix: '-window' } },
    expectedCount: 24
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

it('defaults AI queries to retained references without transferring rows and preserves explicit pages', async () => {
  const read = vi.fn(() => ({ available: true }))
  const action = createDocumentContextAction(read)
  const signal = new AbortController().signal
  await action.execute({ scope: 'selection' }, { signal })
  expect(read).toHaveBeenLastCalledWith(
    { scope: 'selection', delivery: 'reference' },
    signal
  )
  await action.execute({ scope: 'selection', delivery: 'columns' }, { signal })
  expect(read).toHaveBeenLastCalledWith(
    { scope: 'selection', delivery: 'columns' },
    signal
  )
})

it('separates live query output from explicit release without weakening either input', async () => {
  const read = vi.fn(() => ({ released: true }))
  const query = createDocumentContextAction(read)
  const release = createDocumentContextReleaseAction(read)
  expect(
    operationInputIssue(
      { scope: 'snapshot', snapshotId: 'known', release: true },
      query.inputSchema
    )
  ).toBeDefined()
  expect(
    operationInputIssue({ snapshotId: 'known' }, release.inputSchema)
  ).toBeUndefined()
  expect(release.composition).toBe('control-plane')
  const signal = new AbortController().signal
  expect(await release.execute({ snapshotId: 'known' }, { signal })).toEqual({
    snapshotId: 'known',
    released: true
  })
  expect(read).toHaveBeenCalledExactlyOnceWith(
    { scope: 'snapshot', snapshotId: 'known', release: true },
    signal
  )
})

import { expect, it, vi } from 'vitest'
vi.mock('../../common-apis/design-edit', () => ({ editDesignElement: vi.fn() }))
import { createDesignEditAction } from '../design-edit-action'
it('forwards targeted edits and rejects an already cancelled operation', async () => {
  const edit = vi.fn(() => ({
    status: 'complete',
    compositionId: 'a',
    appliedElementIds: ['a']
  }))
  const action = createDesignEditAction(edit)
  const controller = new AbortController()
  await action.execute({ elementId: 'a', properties: { text: 'Updated' } }, {
    signal: controller.signal
  } as never)
  expect(edit).toHaveBeenCalledExactlyOnceWith({
    elementId: 'a',
    properties: { text: 'Updated' }
  })
  controller.abort()
  await expect(
    action.execute({ elementId: 'a', name: 'Title' }, {
      signal: controller.signal
    } as never)
  ).rejects.toThrow('cancelled')
  expect(edit).toHaveBeenCalledTimes(1)
})

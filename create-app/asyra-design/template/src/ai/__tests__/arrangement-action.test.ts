import { expect, it, vi } from 'vitest'
vi.mock('../../common-apis/design-arrangement', () => ({
  arrangeDesign: vi.fn()
}))
import { createArrangementAction } from '../arrangement-action'
it('forwards alignment and rejects cancellation before mutation', async () => {
  const arrange = vi.fn(() => ({
    status: 'complete',
    compositionId: 'f',
    appliedElementIds: ['a'],
    positions: [{ elementId: 'a', x: 1 }]
  }))
  const action = createArrangementAction(arrange),
    controller = new AbortController()
  const request = {
    operation: 'align',
    axis: 'horizontal',
    alignment: 'start',
    elementIds: ['a', 'b']
  } as const
  await action.execute(request, { signal: controller.signal } as never)
  expect(arrange).toHaveBeenCalledExactlyOnceWith(request)
  controller.abort()
  await expect(
    action.execute(request, { signal: controller.signal } as never)
  ).rejects.toThrow('cancelled')
  expect(arrange).toHaveBeenCalledTimes(1)
})

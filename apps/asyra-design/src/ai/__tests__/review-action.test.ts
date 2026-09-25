import { expect, it, vi } from 'vitest'
vi.mock('../../common-apis/design-review', () => ({ reviewDesign: vi.fn() }))
import { createDesignReviewAction } from '../review-action'
it('forwards review without mutation and respects cancellation', async () => {
  const review = vi.fn(async () => ({
    complete: true,
    truncated: false,
    checkedElements: 1,
    measuredTextCount: 0,
    measuredTextIds: [],
    findings: []
  }))
  const action = createDesignReviewAction(review),
    controller = new AbortController()
  await action.execute({ elementId: 'f' }, {
    signal: controller.signal
  } as never)
  expect(review).toHaveBeenCalledExactlyOnceWith('f', controller.signal)
  controller.abort()
  await expect(
    action.execute({ elementId: 'f' }, { signal: controller.signal } as never)
  ).rejects.toThrow('cancelled')
  expect(review).toHaveBeenCalledTimes(1)
})

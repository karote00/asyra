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

it('binds measurement to the same canonical evidence owner and rejects changes during measurement', async () => {
  const { createInspectionEvidence } =
    await import('../../common-apis/inspection-evidence')
  let changed: () => void = () => undefined
  const evidence = createInspectionEvidence((listener) => {
    changed = listener
    return () => undefined
  })
  let mutate = false
  const review = vi.fn(async () => {
    if (mutate) changed()
    return {
      complete: true,
      truncated: false,
      checkedElements: 1,
      measuredTextCount: 0,
      measuredTextIds: [],
      findings: []
    }
  })
  const action = createDesignReviewAction(review, evidence)
  const context = { signal: new AbortController().signal } as never
  const first = (await action.execute(
    { elementId: 'drawing' },
    context
  )) as Record<string, unknown>
  expect(first.complete).toBe(true)
  expect(evidence.isCurrent(first.evidence)).toBe(true)
  mutate = true
  const second = await action.execute({ elementId: 'drawing' }, context)
  expect(second).toMatchObject({ available: false })
  expect(second).not.toHaveProperty('complete', true)
  expect(evidence.isCurrent(first.evidence)).toBe(false)
  expect(review).toHaveBeenCalledTimes(2)
  evidence.dispose()
})

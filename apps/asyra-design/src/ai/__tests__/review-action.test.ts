import { expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({
  default: {
    getElementMetadata: (id: string) => ({
      id,
      parentId: id === 'workspace' ? undefined : 'workspace'
    })
  }
}))
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

it('retains independent canonical measurement validity across unrelated edits', async () => {
  const { createInspectionEvidence } =
    await import('../../common-apis/inspection-evidence')
  let changed: (change?: { elementIds: string[] }) => void = () => undefined
  const evidence = createInspectionEvidence((listener) => {
    changed = listener
    return () => undefined
  })
  const action = createDesignReviewAction(
    async () => ({
      complete: true,
      truncated: false,
      checkedElements: 1,
      measuredTextCount: 0,
      measuredTextIds: [],
      findings: []
    }),
    evidence
  )
  const context = { signal: new AbortController().signal } as never
  const a = (await action.execute({ elementId: 'a' }, context)) as Record<
    string,
    unknown
  >
  const b = (await action.execute({ elementId: 'b' }, context)) as Record<
    string,
    unknown
  >
  changed({ elementIds: ['a'] })
  expect(evidence.isCurrent(a.evidence)).toBe(false)
  expect(evidence.isCurrent(b.evidence)).toBe(true)
  changed({ elementIds: ['workspace'] })
  expect(evidence.isCurrent(b.evidence)).toBe(false)
  evidence.dispose()
})

it('publishes domain-owned mechanical verdicts with stable semantic progress', async () => {
  let findings = [
    { kind: 'text-overflow', elementId: 'window', right: 2 },
    { kind: 'container-overflow', elementId: 'roof', right: 3 }
  ]
  let complete = true
  const action = createDesignReviewAction(async () => ({
    complete,
    truncated: false,
    checkedElements: 2,
    measuredTextCount: 1,
    measuredTextIds: ['window'],
    findings
  }))
  const context = { signal: new AbortController().signal } as never
  const read = async (elementId = 'drawing') =>
    (await action.execute({ elementId }, context)) as {
      verification: { status: string; progress: string }
    }
  expect(action.verification).toEqual({
    statusPath: '/verification/status',
    progressPath: '/verification/progress'
  })
  const first = await read()
  expect(first.verification.status).toBe('repairable')
  expect(first.verification.progress).toMatch(/^[a-f0-9]{64}$/)
  findings = [...findings].reverse()
  expect((await read()).verification.progress).toBe(first.verification.progress)
  expect((await read('other')).verification.progress).not.toBe(
    first.verification.progress
  )
  findings = [{ kind: 'text-overflow', elementId: 'window', right: 1 }]
  expect((await read()).verification.progress).not.toBe(
    first.verification.progress
  )
  findings = []
  expect((await read()).verification.status).toBe('pass')
  complete = false
  expect((await read()).verification.status).toBe('decision-required')
})

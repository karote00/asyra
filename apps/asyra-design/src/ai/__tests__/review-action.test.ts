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
import type { InspectionEvidenceStamp } from '../inspection-evidence'
import { createDesignReviewAction } from '../review-action'
const requiredEvidence = (result: { evidence?: InspectionEvidenceStamp }) => {
  if (!result.evidence) {
    throw new Error('Expected mechanical evidence')
  }
  return result.evidence
}
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

it('delivers requested measurement scope and withdraws selection with stale evidence', async () => {
  const stamp = { sessionId: 'session', revision: 1, receiptId: 'receipt' }
  const review = vi.fn(async () => ({
    complete: true,
    truncated: false,
    checkedElements: 2,
    measuredTextCount: 0,
    measuredTextIds: [],
    findings: [],
    evidence: stamp,
    coveredMeasurementTargets: ['child']
  }))
  let current = true
  const action = createDesignReviewAction(review, () => current)
  const context = { signal: new AbortController().signal }
  expect(action.inputSchema.properties).toHaveProperty('measurementTargets')
  expect(
    await action.execute(
      { elementId: 'root', measurementTargets: ['child', 'outside'] },
      context
    )
  ).toMatchObject({ coveredMeasurementTargets: ['child'] })
  expect(review).toHaveBeenCalledWith('root', context.signal, [
    'child',
    'outside'
  ])
  expect(
    await action.execute(
      { elementId: 'root', measurementTargets: 'descendants' },
      context
    )
  ).toMatchObject({ coveredMeasurementTargets: ['child'] })
  expect(review).toHaveBeenLastCalledWith('root', context.signal, 'descendants')
  current = false
  expect(
    await action.execute(
      { elementId: 'root', measurementTargets: 'descendants' },
      context
    )
  ).toMatchObject({
    available: false,
    complete: false,
    coveredMeasurementTargets: []
  })
})

it('routes mechanical capture and freshness through the real reviewer without visual ownership', async () => {
  const { createDesignReviewer } = await vi.importActual<
    typeof import('../../common-apis/design-review')
  >('../../common-apis/design-review')
  const { createInspectionValidationAction } = await import('../inspection')
  const { createInspectionEvidence } =
    await import('../../common-apis/inspection-evidence')
  let changed: (change?: { elementIds: string[] }) => void = () => undefined
  const widths = { a: 10, b: 20 }
  const reviewer = createDesignReviewer(
    {
      observeChanges(listener) {
        changed = listener
        return () => undefined
      },
      read: () => ({ type: 'rect' }),
      computed: (id) => ({
        x: 0,
        y: 0,
        width: widths[id as keyof typeof widths],
        height: 10
      }),
      measure: () => []
    },
    async () => undefined,
    true
  )
  const visual = createInspectionEvidence(() => () => undefined)
  const action = createDesignReviewAction(reviewer.capture, reviewer.isCurrent)
  const validate = createInspectionValidationAction(visual, reviewer)
  const context = { signal: new AbortController().signal }
  const read = async (elementId: string) =>
    (await action.execute({ elementId }, context)) as Awaited<
      ReturnType<typeof reviewer.capture>
    >
  const a = await read('a'),
    b = await read('b')
  expect(visual.isCurrent(a.evidence)).toBe(false)
  widths.a = 11
  changed({ elementIds: ['a'] })
  expect(
    await validate.execute({ evidence: requiredEvidence(a) }, context)
  ).toMatchObject({ current: false, reason: 'rule-inputs-changed' })
  expect(
    await validate.execute({ evidence: requiredEvidence(b) }, context)
  ).toMatchObject({ current: true })
  expect(
    await validate.execute(
      {
        evidence: requiredEvidence(b),
        scope: { requiredIds: ['b'], overviewIds: ['b'] }
      },
      context
    )
  ).toMatchObject({ current: false })
  const delayed = createDesignReviewAction(async (...args) => {
    const captured = await reviewer.capture(...args)
    widths.b++
    changed({ elementIds: ['b'] })
    return captured
  }, reviewer.isCurrent)
  expect(await delayed.execute({ elementId: 'b' }, context)).toMatchObject({
    available: false,
    complete: false,
    evidence: undefined,
    verification: { status: 'decision-required' }
  })
  changed()
  expect(
    await validate.execute({ evidence: requiredEvidence(b) }, context)
  ).toMatchObject({ current: false })
  reviewer.dispose()
  visual.dispose()
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

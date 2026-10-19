import recordedClosure from './fixtures/recorded-101/whole-flow-closure-20261019.json'
import { expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
import { createDesignReviewer } from '../../src/common-apis/design-review'
import { createDesignReviewAction } from '../../src/ai/review-action'
import { createInspectionValidationAction } from '../../src/ai/inspection'
import { createLocalOperationTools } from '../local-operation-tools'
import { createDesignCheckResults } from '../design-check-results'
import { AiActionNames } from '../../src/constants'
import type { InspectionDependencyChange } from '../../src/common-apis/inspection-dependencies'

it('reconciles real subtree receipts through retained reads, verification and final settlement', async () => {
  const data: Record<
    string,
    { type: string; children?: string[]; parentId?: string }
  > = {
    root: { type: 'frame', children: ['left', 'right'] },
    left: { type: 'rectangle', parentId: 'root' },
    right: { type: 'rectangle', parentId: 'root' }
  }
  const geometry: Record<
    string,
    { x: number; y: number; width: number; height: number; rotation: number }
  > = {
    root: { x: 0, y: 0, width: 500, height: 500, rotation: 0 },
    left: { x: 10, y: 10, width: 40, height: 40, rotation: 0 },
    right: { x: 100, y: 10, width: 40, height: 40, rotation: 0 }
  }
  let change: (value?: InspectionDependencyChange) => void = () => undefined
  const read = vi.fn((id: string) => data[id])
  const reviewer = createDesignReviewer(
    {
      read,
      computed: (id) => geometry[id],
      measure: () => [],
      observeChanges(listener) {
        change = listener
        return () => undefined
      }
    },
    async () => undefined,
    true
  )
  const actions = [
    createDesignReviewAction(reviewer.capture, reviewer.isCurrent),
    createInspectionValidationAction(
      {
        validate: () => {
          throw new Error('Unexpected visual validation')
        }
      } as never,
      reviewer
    )
  ]
  const checks = createDesignCheckResults()
  interface Observation {
    parentCallId?: string
    reason?: string
    result?: { reason?: string; reconciliation?: { disposition: string }[] }
  }
  const observations: { stage: string; evidence: Observation }[] = []
  let failObserver = false
  let afterCoverage: (() => void) | undefined
  let dropCoverage = false
  const abort = new AbortController()
  const owner = createLocalOperationTools(
    actions,
    { modelActions: (a) => a, resolveBatch: (a) => a, checkResults: checks },
    async (batch) => {
      const actionResults = []
      for (const request of batch.actions) {
        if (dropCoverage && request.arguments.measurementTargets)
          throw new Error('Coverage delivery interrupted')
        const action = actions.find((a) => a.name === request.name)
        if (!action) throw new Error('Missing action')
        const result = await action.execute(
          request.arguments as never,
          { signal: abort.signal } as never
        )
        if (request.arguments.measurementTargets) {
          const hook = afterCoverage
          afterCoverage = undefined
          hook?.()
        }
        actionResults.push({
          actionId: request.id,
          actionName: request.name,
          result
        })
      }
      return { context: {}, actionResults } as never
    },
    {
      observation: {
        parentCallId: () => 'root-tool-call',
        trace: (stage, evidence) => {
          if (failObserver) throw new Error('Diagnostic observer unavailable')
          observations.push({ stage, evidence: evidence as Observation })
        }
      }
    }
  )
  const call = async (name: string, input: unknown = {}) =>
    JSON.parse(await owner.call(name, input, abort.signal))
  for (const id of ['left', 'right'])
    await call(AiActionNames.REVIEW_DESIGN, { arguments: { elementId: id } })
  geometry.left.width = 50
  geometry.right.height = 50
  change({ elementIds: ['left', 'right'] })
  const stale = await call('read_design_checks')
  expect(stale.counts.stale).toBe(2)
  expect(stale).not.toHaveProperty('items')
  const details = await call('read_design_checks', {
    view: 'details',
    limit: 1
  })
  expect(details.items).toHaveLength(1)
  expect(details.nextOffset).toBe(1)
  dropCoverage = true
  await call(AiActionNames.REVIEW_DESIGN, { arguments: { elementId: 'root' } })
  expect((await call('read_design_checks')).counts.stale).toBe(2)
  dropCoverage = false
  const source = recordedClosure.calls[0]
  const root = await call(source.tool, {
    ...source.input,
    arguments: { elementId: 'root' }
  })
  expect(
    (await call(recordedClosure.calls[1].tool, root.mechanicalSelection))
      .verification.status
  ).toBe('pass')
  for (let i = 0; i < 2; i++)
    expect(
      (
        await call(
          recordedClosure.calls[2].tool,
          recordedClosure.calls[2].input
        )
      ).counts
    ).toEqual({
      pass: 3,
      fail: 0,
      stale: 0,
      unverified: 0
    })
  expect(owner.settleOutcome({ batchId: 'done', actions: [] }).actions).toEqual(
    []
  )
  expect(
    observations.some(
      (event) => event.evidence.result?.reason === 'coverage-delivery-failed'
    )
  ).toBe(true)
  const reconciled = observations.find((event) =>
    event.evidence.result?.reconciliation?.some(
      (entry: { disposition: string }) => entry.disposition === 'updated'
    )
  )
  expect(reconciled).toMatchObject({
    stage: 'action_completed',
    evidence: {
      parentCallId: 'root-tool-call',
      result: {
        batchComplete: true,
        reconciliation: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'left',
            oldRevision: expect.any(Number),
            newRevision: expect.any(Number),
            disposition: 'updated'
          })
        ])
      }
    }
  })
  const right = checks.selection(['measurement:right'])[0]
  checks.record({
    id: 'visual:right',
    origin: 'main-agent',
    status: 'pass',
    evidence: 'Primary judgment linked to the unchanged measured right scope',
    dependencies: { 'check:measurement:right': String(right.revision) }
  })
  await call(AiActionNames.REVIEW_DESIGN, { arguments: { elementId: 'right' } })
  expect(checks.selection(['measurement:right'])[0]).toEqual(right)
  expect(
    checks.read({ ids: ['visual:right'], includePassed: true }).items[0].status
  ).toBe('pass')
  geometry.left.width = 60
  change({ elementIds: ['left'] })
  const next = await call('read_design_checks')
  expect(next.counts).toEqual({ pass: 2, fail: 0, stale: 2, unverified: 0 })
  failObserver = true
  await owner.finishInspection(new Set(['root']), undefined, true, abort.signal)
  failObserver = false
  expect((await call('read_design_checks')).counts.stale).toBe(0)
  expect(
    checks.read({ ids: ['visual:right'], includePassed: true }).items[0].status
  ).toBe('pass')
  const repaired = await call(AiActionNames.REVIEW_DESIGN, {
    arguments: { elementId: 'root' }
  })
  expect(
    (await call('verify_design_checks', repaired.mechanicalSelection))
      .verification.status
  ).toBe('pass')
  expect((await call('read_design_checks')).counts.stale).toBe(0)
  geometry.left.width = 70
  change({ elementIds: ['left'] })
  await call('read_design_checks')
  afterCoverage = () => {
    const {
      revision: _revision,
      reason: _reason,
      ...current
    } = checks.read({ ids: ['measurement:left'], includePassed: true }).items[0]
    checks.record({
      ...current,
      status: 'fail',
      evidence: 'A newer concurrent result must survive'
    })
  }
  await call(AiActionNames.REVIEW_DESIGN, { arguments: { elementId: 'root' } })
  expect(
    observations.some((event) =>
      event.evidence.result?.reconciliation?.some(
        (entry: { disposition: string }) => entry.disposition === 'superseded'
      )
    )
  ).toBe(true)
  expect(
    checks.read({ ids: ['measurement:left'], includePassed: true }).items[0]
  ).toMatchObject({
    status: 'fail',
    evidence: 'A newer concurrent result must survive'
  })
  await call(AiActionNames.REVIEW_DESIGN, { arguments: { elementId: 'left' } })
  expect((await call('read_design_checks')).counts.stale).toBe(0)
  geometry.left.width = 80
  change({ elementIds: ['left'] })
  await call('read_design_checks')
  afterCoverage = () =>
    abort.abort(new Error('Request cancelled after coverage delivery'))
  await expect(
    call(AiActionNames.REVIEW_DESIGN, { arguments: { elementId: 'root' } })
  ).rejects.toThrow('Request cancelled')
  expect(
    checks.read({ ids: ['measurement:left'], includePassed: true }).items[0]
      .status
  ).toBe('stale')
  expect(
    observations.some(
      (event) =>
        event.stage === 'action_failed' &&
        event.evidence.reason?.includes('Request cancelled')
    )
  ).toBe(true)
  reviewer.dispose()
})

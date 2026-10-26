import recordedClosure from './fixtures/recorded-101/whole-flow-closure-20261019.json'
import recordedCoverage from './fixtures/recorded-101/mechanical-coverage-20261025.json'
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
        if (
          dropCoverage &&
          request.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE &&
          request.arguments.measurementTargets
        )
          throw new Error('Coverage delivery interrupted')
        const action = actions.find((a) => a.name === request.name)
        if (!action) throw new Error('Missing action')
        const result = await action.execute(
          request.arguments as never,
          { signal: abort.signal } as never
        )
        if (
          request.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE &&
          request.arguments.measurementTargets
        ) {
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

it('selects recorded mechanical coverage before reconciliation without probing unrelated roots', async () => {
  const roots = recordedCoverage.roots
  const data = Object.fromEntries(
    roots.flatMap((id) => [
      [id, { type: 'frame', children: [`${id}:child`] }],
      [`${id}:child`, { type: 'rectangle', parentId: id }]
    ])
  )
  const read = vi.fn((id: string) => data[id])
  const computed = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0
  }))
  let change: () => void = () => undefined
  const reviewer = createDesignReviewer(
    {
      read,
      computed,
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
          throw new Error('Unexpected visual work')
        }
      } as never,
      reviewer
    )
  ]
  const checks = createDesignCheckResults()
  const exchanges: { request: unknown; reply: unknown }[] = []
  const controller = new AbortController()
  const owner = createLocalOperationTools(
    actions,
    { modelActions: (a) => a, resolveBatch: (a) => a, checkResults: checks },
    async (batch) => {
      const actionResults = []
      for (const request of batch.actions) {
        const action = actions.find((item) => item.name === request.name)
        if (!action) throw new Error('Missing registered review action')
        const result = await action.execute(request.arguments as never, {
          signal: controller.signal
        })
        actionResults.push({
          actionId: request.id,
          actionName: request.name,
          result
        })
      }
      const reply = { context: {}, actionResults }
      exchanges.push({ request: batch, reply })
      return reply as never
    }
  )
  for (const elementId of roots)
    await owner.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId } },
      controller.signal
    )
  expect(exchanges).toHaveLength(roots.length)
  expect
    .soft(
      (exchanges[0].request as { actions: { arguments: object }[] }).actions[0]
        .arguments
    )
    .not.toHaveProperty('measurementTargets')
  expect(checks.read({ includePassed: true }).items).toHaveLength(roots.length)
  expect(
    checks
      .read({ includePassed: true })
      .items.every((item) => item.status === 'pass')
  ).toBe(true)
  expect(read).toHaveBeenCalledTimes(roots.length * 2)
  expect(computed).toHaveBeenCalledTimes(roots.length * 2)
  const items = checks.read({ includePassed: true }).items
  expect(
    new Set(items.map((item) => JSON.stringify(item.dependencies))).size
  ).toBe(roots.length)
  // Compare the complete exchange envelopes, including scope hints, with the
  // original extra validation exchanges on this same canonical fixture.
  const currentBytes = Buffer.byteLength(JSON.stringify(exchanges))
  const legacy = JSON.parse(JSON.stringify(exchanges))
  for (const exchange of legacy) {
    for (const action of exchange.request.actions)
      delete action.arguments.measurementTargets
    for (const action of exchange.reply.actionResults)
      delete action.result.coveredMeasurementTargets
  }
  for (let index = 1; index < roots.length; index++) {
    const original = legacy[index]
    const evidence = original.reply.actionResults[0].result.evidence
    const request = {
      batchId: 'b'.repeat(36),
      actions: [
        {
          id: 'a'.repeat(36),
          name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
          arguments: { evidence, measurementTargets: roots.slice(0, index) }
        }
      ]
    }
    const result = await actions[1].execute(
      request.actions[0].arguments as never,
      { signal: controller.signal }
    )
    legacy.push({
      request,
      reply: {
        context: {},
        actionResults: [
          {
            actionId: request.actions[0].id,
            actionName: request.actions[0].name,
            result
          }
        ]
      }
    })
  }
  expect(currentBytes).toBeLessThan(Buffer.byteLength(JSON.stringify(legacy)))
  process.stdout.write(
    `${JSON.stringify({ measurement: 'mechanical-coverage', bytes: currentBytes, previousBytes: Buffer.byteLength(JSON.stringify(legacy)), exchanges: exchanges.length, previousExchanges: legacy.length })}\n`
  )
  expect(read).toHaveBeenCalledTimes(roots.length * 2)
  expect(computed).toHaveBeenCalledTimes(roots.length * 2)
  // Independent roots cannot turn an old failure into a pass. More retained
  // obligations must not produce more useless reconciliation dispatches.
  const { revision: _revision, reason: _reason, ...prior } = items[0]
  checks.record({
    ...prior,
    status: 'fail',
    evidence: 'Unresolved prior finding'
  })
  const failed = checks.read({ ids: [prior.id], includePassed: true }).items[0]
  for (let index = 0; index < 70; index++) {
    const elementId = `independent-${index}`
    data[elementId] = { type: 'frame', children: [`${elementId}:child`] }
    data[`${elementId}:child`] = { type: 'rectangle', parentId: elementId }
    await owner.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId } },
      controller.signal
    )
  }
  expect(exchanges).toHaveLength(roots.length + 70)
  expect(
    checks.read({ ids: [prior.id], includePassed: true }).items[0]
  ).toEqual(failed)
  // An explicitly empty selection remains empty, even with retained targets.
  await owner.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: roots[2], measurementTargets: [] } },
    controller.signal
  )
  expect(exchanges.at(-1)?.request).toMatchObject({
    actions: [{ arguments: { measurementTargets: [] } }]
  })
  expect(exchanges).toHaveLength(roots.length + 71)
  // A parent covering more than one validation window still updates only its
  // descendants after all prior browser receipts were invalidated.
  const descendants = Array.from(
    { length: 70 },
    (_, index) => `independent-${index}`
  )
  data.parent = { type: 'frame', children: descendants }
  for (const id of descendants) data[id].parentId = 'parent'
  change()
  const parentReply = JSON.parse(
    await owner.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId: 'parent' } },
      controller.signal
    )
  )
  expect(parentReply.actionResults[0].result).not.toHaveProperty(
    'coveredMeasurementTargets'
  )
  expect(exchanges).toHaveLength(roots.length + 74)
  expect(exchanges.at(-2)?.request).toMatchObject({
    actions: [{ arguments: { measurementTargets: descendants.slice(0, 64) } }]
  })
  expect(exchanges.at(-1)?.request).toMatchObject({
    actions: [{ arguments: { measurementTargets: descendants.slice(64) } }]
  })
  expect(
    checks.read({ ids: [prior.id], includePassed: true }).items[0]
  ).toEqual(failed)
  for (const id of descendants) {
    const item = checks.read({
      ids: [`measurement:${id}`],
      includePassed: true
    }).items[0]
    expect(item.status).toBe('pass')
    const stamp = JSON.parse(item.dependencies[item.id])
    expect(reviewer.isCurrent(stamp)).toBe(true)
  }
  reviewer.dispose()
})

it('omits automatic scope when only the root is retained but preserves explicit and full delivery', async () => {
  const data = {
    root: { type: 'frame', children: ['child'] },
    child: { type: 'rectangle', parentId: 'root' }
  }
  const reviewer = createDesignReviewer(
    {
      read: (id) => data[id as keyof typeof data],
      computed: () => ({ x: 0, y: 0, width: 100, height: 100, rotation: 0 }),
      measure: () => [],
      observeChanges: () => () => undefined
    },
    async () => undefined,
    true
  )
  const action = createDesignReviewAction(reviewer.capture, reviewer.isCurrent)
  const inputs: unknown[] = []
  const owner = createLocalOperationTools(
    [action],
    {
      modelActions: (a) => a,
      resolveBatch: (a) => a
    },
    async (batch) => ({
      context: {},
      actionResults: await Promise.all(
        batch.actions.map(async (item) => {
          inputs.push(item.arguments)
          return {
            actionId: item.id,
            actionName: item.name,
            result: await action.execute(item.arguments as never, {
              signal: new AbortController().signal
            })
          }
        })
      )
    })
  )
  const call = async (args: object) =>
    JSON.parse(
      await owner.call(action.name, args, new AbortController().signal)
    )
  try {
    await call({ arguments: { elementId: 'root' } })
    await call({ arguments: { elementId: 'root' } })
    expect
      .soft(inputs.slice(0, 2))
      .toEqual([{ elementId: 'root' }, { elementId: 'root' }])
    for (const selection of [[], ['child'], 'descendants']) {
      const reply = await call({
        arguments: { elementId: 'root', measurementTargets: selection }
      })
      expect(reply.actionResults[0].result.coveredMeasurementTargets).toEqual(
        selection.length ? ['child'] : []
      )
    }
    // Retain a separate root without permitting it to certify this subtree.
    await call({ arguments: { elementId: 'missing' } })
    const full = await owner.finishInspection(
      new Set(['root']),
      'root',
      true,
      new AbortController().signal,
      false,
      true
    )
    expect(full.actionResults[0].result.coveredMeasurementTargets).toEqual([
      'child'
    ])
  } finally {
    reviewer.dispose()
  }
})

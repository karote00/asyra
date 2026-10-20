import { describe, expect, it, vi } from 'vitest'
const observed = vi.hoisted(() => ({
  channels: new Map<string, (change?: unknown) => void>(),
  loaded: () => undefined as unknown,
  computed: (_events: unknown[]) => undefined as unknown,
  stopped: vi.fn(),
  getElementData: vi.fn(),
  getElementMetadata: vi.fn(),
  getElementIdsInBounds: vi.fn(),
  getCurrentWorkspaceId: vi.fn(() => 'workspace'),
  getElementComputedData: vi.fn(() => ({ x: 0, y: 0, width: 40, height: 20 })),
  isContainerType: vi.fn((type) => type === 'group'),
  elementLocalToWorkspace: vi.fn((_id, point) => ({
    x: 100 - point.y,
    y: 200 + point.x
  }))
}))
vi.mock('../../contexts', () => ({
  default: {
    getElementData: observed.getElementData,
    getElementMetadata: observed.getElementMetadata,
    getElementIdsInBounds: observed.getElementIdsInBounds,
    getCurrentWorkspaceId: observed.getCurrentWorkspaceId,
    getElementComputedData: observed.getElementComputedData,
    isContainerType: observed.isContainerType,
    elementLocalToWorkspace: observed.elementLocalToWorkspace,
    observeSharedDataChannel: (channel: string, listener: () => void) => {
      observed.channels.set(channel, listener)
      return () => {
        observed.channels.delete(channel)
        observed.stopped()
      }
    }
  }
}))
vi.mock('../../constants', async () => import('../../constants/ai-actions'))
vi.mock('../index', () => ({ inspectionApis: { inspect: vi.fn() } }))
vi.mock('@asyra/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@asyra/core')>()),
  yieldToCooperativeHost: async () => undefined,
  subscribeToEventBatches: (listener: (events: unknown[]) => void) => {
    observed.computed = listener
    return { unsubscribe: observed.stopped }
  },
  subscribeToFileLoadComplete: (listener: () => void) => {
    observed.loaded = listener
    return { unsubscribe: observed.stopped }
  }
}))
import { SharedDataChannelNames, SCENE_TREE_ACTIONS } from '@asyra/utils'
import {
  createInspectionEvidence,
  observeInspectionChanges
} from '../inspection-evidence'
import { EventTypes } from '@asyra/core'
import { createInspectionValidationAction } from '../../ai/inspection'

const setup = () => {
  let changed: () => void = () => undefined
  const stop = vi.fn()
  const observe = vi.fn((listener: () => void) => {
    changed = listener
    return stop
  })
  const evidence = createInspectionEvidence(observe)
  return { evidence, observe, stop, change: () => changed() }
}

describe('canonical inspection evidence lifetime', () => {
  it('subscribes once and validates unchanged stamps without repeating capture', async () => {
    const { evidence, observe, stop, change } = setup()
    const capture = vi.fn(() => ({
      available: true,
      image: { dataUrl: 'png' }
    }))
    expect(observe).not.toHaveBeenCalled()
    const first = await evidence.capture(capture)
    expect(first.available).toBe(true)
    for (let i = 0; i < 100; i++)
      expect(evidence.isCurrent(first.evidence)).toBe(true)
    expect(capture).toHaveBeenCalledTimes(1)
    expect(observe).toHaveBeenCalledTimes(1)
    change()
    expect(evidence.isCurrent(first.evidence)).toBe(false)
    const second = await evidence.capture(capture)
    expect(evidence.isCurrent(second.evidence)).toBe(true)
    expect(second.evidence).not.toEqual(first.evidence)
    expect(capture).toHaveBeenCalledTimes(2)
    expect(observe).toHaveBeenCalledTimes(1)
    evidence.dispose()
    evidence.dispose()
    expect(stop).toHaveBeenCalledTimes(1)
    expect(evidence.isCurrent(second.evidence)).toBe(false)
    await expect(evidence.capture(capture)).rejects.toThrow(/disposed/i)
    expect(capture).toHaveBeenCalledTimes(2)
  })

  it('rejects mixed-generation captures and stamps from another runtime', async () => {
    const { evidence, change } = setup()
    const mixed = await evidence.capture(async () => {
      change()
      return { available: true, image: { dataUrl: 'mixed' } }
    })
    expect(mixed).toMatchObject({ available: false })
    expect(mixed).not.toHaveProperty('image')
    expect(mixed).not.toHaveProperty('evidence')
    const next = await evidence.capture(() => ({ available: true }))
    const successor = setup().evidence
    await successor.capture(() => ({ available: true }))
    expect(successor.isCurrent(next.evidence)).toBe(false)
    expect(evidence.isCurrent(undefined)).toBe(false)
    expect(evidence.isCurrent({ sessionId: '', revision: 0 })).toBe(false)
    evidence.dispose()
    successor.dispose()
  })

  it('does not fabricate evidence for failed captures or absent observation', async () => {
    const { evidence } = setup()
    expect(
      await evidence.capture(() => ({ available: false }))
    ).not.toHaveProperty('evidence')
    const unavailable = createInspectionEvidence(() => {
      throw new Error('No observer')
    })
    const capture = vi.fn(() => ({ available: true }))
    await expect(unavailable.capture(capture)).rejects.toThrow('No observer')
    expect(capture).not.toHaveBeenCalled()
    evidence.dispose()
    unavailable.dispose()
  })
})

it('invalidates through structure, committed effective changes and document-load routes', async () => {
  observed.stopped.mockClear()
  const evidence = createInspectionEvidence()
  for (const change of [
    () => observed.channels.get(SharedDataChannelNames.SCENE_TREE)?.(),
    () =>
      observed.computed([
        {
          type: EventTypes.UPDATE_COMPUTED_DATA,
          payload: {
            id: 'a',
            owner: 'computed',
            key: 'fills',
            before: [],
            after: [{}]
          }
        }
      ]),
    () => observed.loaded()
  ]) {
    const result = await evidence.capture(() => ({ available: true }))
    expect(evidence.isCurrent(result.evidence)).toBe(true)
    change()
    expect(evidence.isCurrent(result.evidence)).toBe(false)
  }
  evidence.dispose()
  expect(observed.channels.size).toBe(0)
  expect(observed.stopped).toHaveBeenCalledTimes(3)
})

describe('canonical inspection scope coverage', () => {
  const verify = async (
    parents: Record<string, string | undefined>,
    requiredIds: string[],
    overviewIds: string[]
  ) => {
    observed.getElementData.mockReset()
    observed.getElementData.mockImplementation((id: string) =>
      Object.hasOwn(parents, id) ? { parentId: parents[id] } : undefined
    )
    const { evidence } = setup()
    const captured = await evidence.capture(() => ({ available: true }))
    const action = createInspectionValidationAction(evidence)
    const result = await action.execute(
      {
        evidence: captured.evidence,
        scope: { requiredIds, overviewIds }
      } as Parameters<typeof action.execute>[0],
      { signal: new AbortController().signal } as Parameters<
        typeof action.execute
      >[1]
    )
    evidence.dispose()
    return result
  }

  it('covers regrouped descendants and shares ancestor reads only within each query', async () => {
    const parents = {
      tower: undefined,
      a: 'tower',
      b: 'tower',
      untouched: undefined
    }
    expect(await verify(parents, ['a', 'b'], ['tower'])).toMatchObject({
      current: true,
      coverage: { complete: true, missingIds: [], uncoveredIds: [] }
    })
    expect(observed.getElementData.mock.calls.map(([id]) => id).sort()).toEqual(
      ['a', 'b', 'tower']
    )
    parents.b = 'untouched'
    expect(await verify(parents, ['a', 'b'], ['tower'])).toMatchObject({
      coverage: { complete: false, uncoveredIds: ['b'] }
    })
  })

  it('combines disjoint complete overview targets', async () => {
    expect(
      await verify(
        { a: undefined, b: undefined, detail: 'b' },
        ['a', 'detail'],
        ['a', 'b']
      )
    ).toMatchObject({ coverage: { complete: true } })
  })

  it.each([
    {
      parents: { tower: undefined, other: undefined },
      required: ['tower'],
      overview: ['other'],
      missing: []
    },
    {
      parents: { tower: undefined, detail: 'tower' },
      required: ['tower'],
      overview: ['detail'],
      missing: []
    },
    {
      parents: { tower: undefined },
      required: ['deleted'],
      overview: ['tower'],
      missing: ['deleted']
    },
    {
      parents: { a: 'b', b: 'a', tower: undefined },
      required: ['a'],
      overview: ['tower'],
      missing: []
    }
  ])(
    'rejects uncovered, deleted or cyclic scope $required -> $overview',
    async ({ parents, required, overview, missing }) => {
      expect(await verify(parents, required, overview)).toMatchObject({
        coverage: {
          complete: false,
          missingIds: missing,
          uncoveredIds: required
        }
      })
    }
  )
})

it('captures only the canonical parent chain and transformed local basis for preparation review', async () => {
  const { evidence, change } = setup()
  observed.getElementMetadata.mockImplementation(
    (id) =>
      ({
        group: { type: 'group', parentId: 'outer' },
        outer: { type: 'group', parentId: 'workspace' }
      })[id]
  )
  observed.getElementMetadata.mockClear()
  const result = await evidence.attachment('group')
  expect(result).toMatchObject({
    available: true,
    parentId: 'group',
    workspaceId: 'workspace',
    bounds: { width: 40, height: 20 },
    basis: [
      { x: 100, y: 200 },
      { x: 100, y: 201 },
      { x: 99, y: 200 }
    ]
  })
  expect(observed.getElementMetadata.mock.calls.map(([id]) => id)).toEqual([
    'group',
    'outer'
  ])
  expect(evidence.isCurrent(result.evidence)).toBe(true)
  change()
  expect(evidence.isCurrent(result.evidence)).toBe(false)
  observed.elementLocalToWorkspace.mockClear()
  expect(await evidence.attachment()).toMatchObject({
    parentId: 'workspace',
    basis: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ]
  })
  expect(observed.elementLocalToWorkspace).not.toHaveBeenCalled()
  observed.getElementMetadata.mockReturnValue({
    type: 'group',
    parentId: 'group'
  })
  await expect(evidence.attachment('group')).rejects.toThrow(/parent/i)
  observed.getElementMetadata.mockReturnValue(undefined)
  await expect(evidence.attachment('missing')).rejects.toThrow(/parent/i)
  evidence.dispose()
})

it('keeps a target capture current across an unrelated canonical edit', async () => {
  observed.getElementMetadata.mockImplementation((id) => ({
    id,
    type: 'group',
    parentId: id === 'workspace' ? undefined : 'workspace'
  }))
  const owner = createInspectionEvidence()
  const captured = await owner.capture(() => ({ available: true }), {
    elementId: 'tier-1'
  })
  observed.channels.get(SharedDataChannelNames.SCENE_TREE)?.({
    action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA,
    id: 'tier-3',
    changes: [{ key: 'visible', before: true, after: false }]
  } as never)
  expect(owner.isCurrent(captured.evidence)).toBe(true)
  owner.dispose()
})

it('retains attachment checks by actual parent geometry and reads changed signatures only once', async () => {
  let width = 40
  observed.getElementMetadata.mockImplementation((id: string) => {
    if (id === 'workspace') return { id, type: 'group' }
    return { id, type: 'group', parentId: id === 'child-a' ? 'a' : 'workspace' }
  })
  observed.getElementComputedData.mockImplementation((...args: unknown[]) => ({
    x: 0,
    y: 0,
    width: args[0] === 'a' ? width : 40,
    height: 20
  }))
  let changed: (change?: { elementIds: string[] }) => void = () => undefined
  const evidence = createInspectionEvidence((listener) => {
    changed = listener
    return () => undefined
  })
  const a = await evidence.attachment('a')
  const b = await evidence.attachment('b')
  observed.getElementComputedData.mockClear()
  observed.getElementData.mockClear()
  changed({ elementIds: ['child-a'] })
  expect(evidence.isCurrent(a.evidence)).toBe(true)
  expect(evidence.isCurrent(b.evidence)).toBe(true)
  const reads = observed.getElementComputedData.mock.calls.length
  expect(reads).toBe(1)
  for (let i = 0; i < 10; i++) expect(evidence.isCurrent(a.evidence)).toBe(true)
  expect(observed.getElementComputedData).toHaveBeenCalledTimes(reads)
  expect(observed.getElementData).not.toHaveBeenCalled()
  width = 60
  changed({ elementIds: ['child-a'] })
  expect(evidence.isCurrent(a.evidence)).toBe(false)
  expect(evidence.isCurrent(b.evidence)).toBe(true)
  changed()
  expect(evidence.isCurrent(b.evidence)).toBe(false)
  evidence.dispose()
})

it('invalidates attachment editability without invalidating unchanged rendered pixels', async () => {
  let locked = false
  let scale = 1
  observed.getElementMetadata.mockImplementation((id: string) => ({
    id,
    type: 'group',
    lock: id === 'a' && locked,
    parentId: id === 'workspace' ? undefined : 'workspace'
  }))
  observed.getElementComputedData.mockImplementation(() => ({
    x: 0,
    y: 0,
    width: 40,
    height: 20
  }))
  observed.elementLocalToWorkspace.mockImplementation((_id, point) => ({
    x: point.x * scale,
    y: point.y * scale
  }))
  const owner = createInspectionEvidence()
  const a = await owner.attachment('a')
  const b = await owner.attachment('b')
  const image = await owner.capture(() => ({ available: true }), {
    elementId: 'a'
  })
  locked = true
  observed.channels.get(SharedDataChannelNames.SCENE_TREE)?.({
    action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA,
    id: 'a',
    changes: [{ key: 'lock', before: false, after: true }]
  })
  expect(owner.isCurrent(a.evidence)).toBe(false)
  expect(owner.isCurrent(b.evidence)).toBe(true)
  expect(owner.isCurrent(image.evidence)).toBe(true)
  locked = false
  const fresh = await owner.attachment('a')
  scale = 2
  observed.channels.get(SharedDataChannelNames.SCENE_TREE)?.({
    action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA,
    id: 'workspace',
    changes: [{ key: 'transform', before: 1, after: 2 }]
  })
  expect(owner.isCurrent(fresh.evidence)).toBe(false)
  expect(owner.isCurrent(b.evidence)).toBe(false)
  owner.dispose()
})

it.each([
  { regionCount: 8, drift: false },
  { regionCount: 32, drift: false },
  { regionCount: 32, drift: true },
  ...[
    'duplicate',
    'missing',
    'wrong-name',
    'missing-version',
    'invalid-without-version',
    'extra',
    'cancel',
    'failure',
    'throw'
  ].map((fault) => ({ regionCount: 32, drift: false, fault }))
])(
  'accumulates $regionCount regional reviews with validation drift=$drift fault=$fault',
  async ({ regionCount, drift, fault }) => {
    const { createLocalOperationTools } =
      await import('../../../server/local-operation-tools')
    const { AiActionNames } = await import('../../constants/ai-actions')
    const { AiDesignToolIds } = await import('../../constants/ai-design')
    const units = Array.from(
      { length: regionCount },
      (_, index) => `tier-${index}`
    )
    const parents: Record<string, string | undefined> = {
      workspace: undefined,
      building: 'workspace'
    }
    for (const [index, unit] of units.entries()) {
      parents[unit] = 'building'
      parents[`window-${index}`] = unit
    }
    const metadata = (id: string) =>
      Object.hasOwn(parents, id)
        ? { id, type: 'group', parentId: parents[id] }
        : undefined
    observed.getElementData.mockImplementation(metadata)
    observed.getElementMetadata.mockImplementation(metadata)
    observed.elementLocalToWorkspace.mockImplementation((id, point) => ({
      x: point.x,
      y: point.y + Number(id.split('-')[1] ?? 0) * 100
    }))
    observed.getElementIdsInBounds.mockImplementation((bounds) => [
      `window-${Math.floor(bounds.y / 100)}`
    ])
    const evidence = createInspectionEvidence()
    const captureTargets: string[] = []
    const validations: unknown[] = []
    const batchSizes: number[] = []
    let changeDuringValidation = false
    const controller = new AbortController()
    const signal = controller.signal
    let validationFault: string | undefined
    const tools = createLocalOperationTools(
      [
        AiActionNames.INSPECT_DRAWING,
        AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      ].map((name) => ({ name, description: name, inputSchema: {} })),
      { modelActions: (actions) => actions, resolveBatch: (value) => value },
      async (batch) => {
        batchSizes.push(batch.actions.length)
        if (changeDuringValidation && batch.actions.length < 24) {
          changeDuringValidation = false
          observed.channels.get(SharedDataChannelNames.SCENE_TREE)?.({
            action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA,
            id: 'window-2',
            changes: [{ key: 'visible', before: true, after: false }]
          })
        }
        const reply = {
          context: {},
          actionResults: await Promise.all(
            batch.actions.map(async (action) => {
              const args = action.arguments as {
                evidence: unknown
                scope?: Parameters<typeof evidence.validate>[1]
                elementId: string
                region?: { x: number; y: number; width: number; height: number }
              }
              let result
              if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
                result = evidence.validate(args.evidence, args.scope)
                validations.push(result)
              } else {
                expect(action.name).toBe(AiActionNames.INSPECT_DRAWING)
                captureTargets.push(args.elementId)
                result = await evidence.capture(
                  () => ({
                    available: true,
                    image: { dataUrl: 'data:image/png;base64,AA==' }
                  }),
                  { elementId: args.elementId, region: args.region }
                )
              }
              return { actionId: action.id, actionName: action.name, result }
            })
          )
        }
        const currentFault = validationFault
        validationFault = undefined
        if (currentFault === 'duplicate')
          reply.actionResults.push(reply.actionResults[0])
        if (currentFault === 'missing') reply.actionResults.shift()
        if (currentFault === 'wrong-name')
          reply.actionResults[0].actionName = 'wrong'
        if (currentFault === 'invalid-without-version')
          (reply.actionResults[0].result as Record<string, unknown>).current =
            false
        if (
          currentFault === 'missing-version' ||
          currentFault === 'invalid-without-version'
        )
          delete (reply.actionResults[0].result as Record<string, unknown>)
            .validatedAt
        if (currentFault === 'extra')
          reply.actionResults.push({
            ...reply.actionResults[0],
            actionId: 'unexpected'
          })
        if (currentFault === 'cancel') controller.abort()
        if (currentFault === 'throw')
          throw new Error('Validation transport unavailable')
        if (currentFault === 'failure')
          return {
            ...reply,
            failure: {
              code: 'validation-failed',
              message: 'Validation unavailable',
              stage: 'execute',
              actionId: null,
              actionName: null,
              actionExecutionMs: null,
              settlement: 'not-started' as const,
              contextFresh: false
            }
          }
        return reply
      },
      { reviewTargetId: 'building' }
    )
    const call = async (name: string, args: Record<string, unknown>) =>
      JSON.parse(await tools.call(name, args, signal))
    try {
      await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
        method: 'Draw the requested building',
        references: [],
        structureCriteria: [],
        detailRequired: false,
        criteria: {
          Overall: {
            requirement: 'Complete building',
            description: 'Whole-view agreement',
            verification: 'visual',
            requiredUnits: []
          },
          Facade: {
            requirement: 'Detailed facade',
            description: 'Local windows and neighboring alignment',
            verification: 'visual',
            requiredUnits: [...units.slice(0, 16), 'alignment']
          },
          ...(units.length > 16
            ? {
                Additional: {
                  requirement: 'Remaining facade',
                  description: 'Remaining local windows',
                  verification: 'visual',
                  requiredUnits: units.slice(16)
                }
              }
            : {})
        }
      })
      const capturedBindings = new Map<string, Record<string, unknown>>()
      const capture = async (elementId: string, regional = true) => {
        const selection = regional
          ? {
              criterionId:
                Number(elementId.split('-')[1]) >= 16 ? 'Additional' : 'Facade',
              unitId: elementId
            }
          : { criterionId: 'Overall' }
        const reply = await call(AiDesignToolIds.REVIEW_DRAWING, {
          phase: 'visual',
          inspections: [
            {
              elementId,
              checks: [selection],
              ...(regional
                ? { region: { x: 0, y: 0, width: 40, height: 60 } }
                : {})
            }
          ]
        })
        expect(reply).not.toHaveProperty('status', 'partial')
        expect(reply.message).toContain('submit primary-agent findings')
        const id = reply.inspectionIds[0] as string
        capturedBindings.set(id, reply.next.arguments.checks[0])
        return id
      }
      const submit = async (unitId: string, inspectionIds: string[]) => {
        const bound =
          unitId === 'alignment'
            ? (
                await call(AiDesignToolIds.REVIEW_DRAWING, {
                  phase: 'visual',
                  bindChecks: [{ criterionId: 'Facade', unitId, inspectionIds }]
                })
              ).next.arguments.checks[0]
            : capturedBindings.get(inspectionIds[0])
        return call(AiDesignToolIds.REVIEW_DRAWING, {
          phase: 'visual',
          final: true,
          inspectionIds,
          checks: [{ ...bound, status: 'pass', evidence: `Observed ${unitId}` }]
        })
      }
      const images: string[] = []
      for (const unit of units) {
        const image = await capture(unit)
        images.push(image)
        expect((await submit(unit, [image])).accepted).toBe(false)
      }
      expect((await submit('alignment', [images[2], images[3]])).accepted).toBe(
        false
      )
      const whole = await capture('building', false)
      const overall = (image: string) =>
        call(AiDesignToolIds.REVIEW_DRAWING, {
          phase: 'visual',
          final: true,
          inspectionIds: [image],
          checks: [
            {
              ...capturedBindings.get(image),
              status: 'pass',
              evidence: 'Whole building agrees'
            }
          ]
        })
      const retainedBefore = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
        view: 'details',
        includePassed: true
      })
      changeDuringValidation = drift
      validationFault = fault
      const dispatchCount = batchSizes.length
      if (fault === 'cancel' || fault === 'throw') {
        await expect(overall(whole)).rejects.toThrow()
        expect(batchSizes.length - dispatchCount).toBe(1)
        const retained = JSON.parse(
          await tools.call(
            AiDesignToolIds.READ_DESIGN_CHECKS,
            { view: 'details', includePassed: true },
            new AbortController().signal
          )
        )
        expect(retained.items).toEqual(retainedBefore.items)
        return
      }
      const initial = await overall(whole)
      if (fault) {
        expect(initial).toMatchObject({ accepted: false, status: 'partial' })
        expect(batchSizes.length - dispatchCount).toBe(1)
        const retainedAfter = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
          view: 'details',
          includePassed: true
        })
        expect(retainedAfter.items).toEqual(retainedBefore.items)
        expect((await overall(whole)).accepted).toBe(true)
        expect(captureTargets).toHaveLength(regionCount + 1)
        return
      }
      if (drift) {
        expect(initial).toMatchObject({ accepted: false, status: 'partial' })
        const pending = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
          view: 'details'
        })
        expect(
          pending.items
            .map(
              (item: { unitId?: string; criterionId: string }) =>
                item.unitId ?? item.criterionId
            )
            .sort()
        ).toEqual(['Overall', 'alignment', 'tier-2'])
        expect(captureTargets).toHaveLength(regionCount + 1)
        return
      }
      expect(initial.accepted).toBe(true)
      const before = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
        view: 'details',
        includePassed: true
      })
      const memberships = observed.getElementIdsInBounds.mock.calls.length
      observed.channels.get(SharedDataChannelNames.SCENE_TREE)?.({
        action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA,
        id: 'window-2',
        changes: [{ key: 'visible', before: true, after: false }]
      })
      const pending = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
        view: 'details'
      })
      expect(
        pending.items
          .map(
            (item: { unitId?: string; criterionId: string }) =>
              item.unitId ?? item.criterionId
          )
          .sort()
      ).toEqual(['Overall', 'alignment', 'tier-2'])
      const fresh = await capture('tier-2')
      expect((await submit('tier-2', [fresh])).accepted).toBe(false)
      expect((await submit('alignment', [fresh, images[3]])).accepted).toBe(
        false
      )
      expect((await overall(await capture('building', false))).accepted).toBe(
        true
      )
      await tools.validateCompletion(signal)
      const after = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
        view: 'details',
        includePassed: true
      })
      for (const unit of units.filter((unit) => unit !== 'tier-2')) {
        expect(
          after.items.find((item: { unitId?: string }) => item.unitId === unit)
        ).toEqual(
          before.items.find((item: { unitId?: string }) => item.unitId === unit)
        )
        expect(captureTargets.filter((id) => id === unit)).toHaveLength(1)
      }
      expect(captureTargets.filter((id) => id === 'tier-2')).toHaveLength(2)
      expect(captureTargets.filter((id) => id === 'building')).toHaveLength(2)
      expect(
        observed.getElementIdsInBounds.mock.calls.length - memberships
      ).toBe(1)
      expect(Math.max(...batchSizes)).toBeLessThanOrEqual(24)
      expect(validations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            current: true,
            coverage: expect.objectContaining({ complete: true })
          })
        ])
      )
    } finally {
      evidence.dispose()
    }
  }
)

it('keeps canonical mutations separate from effective visual freshness and disposes both', async () => {
  const canonical = vi.fn()
  const stop = observeInspectionChanges(canonical)
  observed.channels.get(SharedDataChannelNames.PROPS)?.()
  expect(canonical).toHaveBeenCalledOnce()
  stop()
  const evidence = createInspectionEvidence()
  const captured = await evidence.capture(() => ({ available: true }))
  expect(observed.channels.has(SharedDataChannelNames.PROPS)).toBe(false)
  observed.channels.get(SharedDataChannelNames.SCENE_TREE)?.({
    action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_PROPERTY_BINDINGS,
    id: 'a',
    changes: [{ key: 'fills', before: 'source', after: 'local' }]
  })
  observed.computed([{ type: EventTypes.SELECT_ELEMENTS, payload: ['a'] }])
  observed.computed([
    {
      type: EventTypes.UPDATE_COMPUTED_DATA,
      payload: {
        id: 'a',
        owner: 'computed',
        key: 'name',
        before: 'old',
        after: 'new'
      }
    }
  ])
  expect(evidence.isCurrent(captured.evidence)).toBe(true)
  observed.computed([
    {
      type: EventTypes.UPDATE_COMPUTED_DATA_PATCH,
      payload: {
        id: 'a',
        patch: { fills: {} }
      }
    }
  ])
  expect(evidence.isCurrent(captured.evidence)).toBe(false)
  evidence.dispose()
  expect(observed.channels.size).toBe(0)
})

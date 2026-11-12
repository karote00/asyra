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
vi.mock('../../constants', async () => ({
  ...(await import('../../constants/ai-actions')),
  ...(await import('../../constants/ai-design'))
}))
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
import { EventTypes, renderStrategyRegistry } from '@asyra/core'
import { GROUP_RENDER_STRATEGY } from '@asyra/preset'
import { createInspectionValidationAction } from '../../ai/inspection'

const setup = () => {
  let changed: () => void = () => undefined

  const stop = vi.fn()
  const observe = vi.fn((listener: () => void) => {
    changed = listener

    return stop
  })
  const evidence = createInspectionEvidence(observe)

  return {
    evidence,
    observe,
    stop,

    change: () => changed()
  }
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
    for (let i = 0; i < 100; i++) {
      expect(evidence.isCurrent(first.evidence)).toBe(true)
    }

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

    expect(mixed).toMatchObject({
      available: false,
      code: 'INSPECTION_DOCUMENT_CHANGED',
      settlement: 'completed'
    })
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
    expect(await evidence.capture(() => undefined)).toMatchObject({
      available: false,
      code: 'INSPECTION_RESULT_INVALID',
      settlement: 'completed'
    })
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
    if (id === 'workspace') {
      return { id, type: 'group' }
    }

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
  for (let i = 0; i < 10; i++) {
    expect(evidence.isCurrent(a.evidence)).toBe(true)
  }

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

it.each([true, false])(
  'uses registered paint ownership for a container with official Group strategy=%s',
  async (official) => {
    const type = 'inspection-region-container'
    const render = official ? GROUP_RENDER_STRATEGY : () => undefined

    renderStrategyRegistry.register(type, render)
    observed.getElementIdsInBounds.mockClear()
    observed.getElementMetadata.mockImplementation((id) => ({
      id,
      type: id === 'container' ? type : 'rect',
      parentId: id === 'root' ? '' : 'root'
    }))
    observed.getElementIdsInBounds.mockReturnValue([
      'content',
      'container',
      'root'
    ])

    let changed: (change: { elementIds: string[] }) => void = () => undefined

    const evidence = createInspectionEvidence((listener) => {
      changed = listener

      return () => undefined
    })
    const capture = vi.fn(() => ({ available: true }))

    try {
      const result = await evidence.capture(capture, {
        elementId: 'root',
        region: { x: 0, y: 0, width: 20, height: 20 }
      })

      expect(result.available).toBe(true)
      changed({ elementIds: ['container'] })
      expect(evidence.isCurrent(result.evidence)).toBe(official)
      for (let i = 0; i < 10; i++) {
        expect(evidence.isCurrent(result.evidence)).toBe(official)
      }

      expect(capture).toHaveBeenCalledOnce()
      expect(observed.getElementIdsInBounds).toHaveBeenCalledTimes(
        official ? 2 : 1
      )
      if (official) {
        changed({ elementIds: ['content'] })
        expect(evidence.isCurrent(result.evidence)).toBe(false)
      }
    } finally {
      evidence.dispose()
      renderStrategyRegistry.unregister(type)
    }
  }
)

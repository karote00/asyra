import { describe, expect, it, vi } from 'vitest'
const observed = vi.hoisted(() => ({
  channels: new Map<string, () => void>(),
  loaded: () => undefined as unknown,
  stopped: vi.fn(),
  getElementData: vi.fn()
}))
vi.mock('../../contexts', () => ({
  default: {
    getElementData: observed.getElementData,
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
vi.mock('@asyra/core', () => ({
  yieldToCooperativeHost: async () => undefined,
  subscribeToFileLoadComplete: (listener: () => void) => {
    observed.loaded = listener
    return { unsubscribe: observed.stopped }
  }
}))
import { SharedDataChannelNames } from '@asyra/utils'
import { createInspectionEvidence } from '../inspection-evidence'
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

it('invalidates through the public Scene Tree, Props and document-load routes', async () => {
  observed.stopped.mockClear()
  const evidence = createInspectionEvidence()
  for (const change of [
    () => observed.channels.get(SharedDataChannelNames.SCENE_TREE)?.(),
    () => observed.channels.get(SharedDataChannelNames.PROPS)?.(),
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

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  defineFeature: vi.fn(
    (
      _name: string,
      _event: string,
      definition: {
        executionMode?: string
        execution: (snapshot: {
          keyShift: boolean
          detail?: { historyDirection?: string }
        }) => unknown
      }
    ) => ({
      api: {},
      dispose: vi.fn(),
      execution: definition.execution
    })
  ),
  redo: vi.fn<() => Promise<void>>(),
  undo: vi.fn<() => Promise<void>>()
}))

vi.mock('@asyra/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@asyra/core')>()),
  defineFeature: mocks.defineFeature
}))

vi.mock('../../../common-apis', () => ({
  historyApis: {
    redo: mocks.redo,
    undo: mocks.undo
  }
}))

import { FeatureNames } from '../../../constants'
import '../index'

const execution = mocks.defineFeature.mock.calls.find(
  ([featureName]) => featureName === FeatureNames.UNDO_REDO
)?.[2].execution

if (!execution) {
  throw new Error('Missing Undo/Redo feature execution')
}

describe('Undo/Redo feature cooperative replay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.undo.mockResolvedValue(undefined)
    mocks.redo.mockResolvedValue(undefined)
  })

  it('keeps the exclusive Undo execution pending until replay settles', async () => {
    let releaseUndo: (() => void) | undefined
    mocks.undo.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseUndo = resolve
        })
    )

    const result = execution({
      keyShift: true,
      detail: { historyDirection: 'undo' }
    })
    let settled = false
    void Promise.resolve(result).then(() => {
      settled = true
    })

    await Promise.resolve()
    expect(mocks.undo).toHaveBeenCalledOnce()
    expect(mocks.redo).not.toHaveBeenCalled()
    expect(settled).toBe(false)

    releaseUndo?.()
    await expect(result).resolves.toEqual({ undid: true })
  })

  it('awaits the issued Redo intent even when the live modifier changed', async () => {
    await expect(
      execution({ keyShift: false, detail: { historyDirection: 'redo' } })
    ).resolves.toEqual({
      redid: true
    })
    expect(mocks.redo).toHaveBeenCalledOnce()
    expect(mocks.undo).not.toHaveBeenCalled()
  })
  it.each([undefined, 'invalid'])(
    'does not infer missing or invalid intent from modifiers - %s',
    async (direction) => {
      expect(
        await execution({
          keyShift: true,
          detail: { historyDirection: direction }
        })
      ).toBeNull()
      expect(mocks.undo).not.toHaveBeenCalled()
      expect(mocks.redo).not.toHaveBeenCalled()
    }
  )
})

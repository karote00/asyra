import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InputType, ModifierKey, type RawInputEvent } from '@asyra/utils'
import type { SystemContextSnapshotWithDetail } from '@asyra/utils'

const mocks = vi.hoisted(() => ({
  defineFeature: vi.fn(),
  setSystemProperty: vi.fn(),
  isInUndoRedo: vi.fn(() => false),
  undo: vi.fn(),
  redo: vi.fn()
}))
vi.mock('@asyra/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@asyra/core')>()),
  defineFeature: mocks.defineFeature
}))
vi.mock('../../contexts', () => ({
  default: {
    setSystemProperty: mocks.setSystemProperty,
    isInUndoRedo: mocks.isInUndoRedo
  }
}))
vi.mock('../../common-apis', () => ({
  historyApis: { undo: mocks.undo, redo: mocks.redo }
}))
import { FeatureNames, InputSystemEvents } from '../../constants'
import { keyCombinations } from '../key-combinations'
import '../../features/undo-redo'

const definition = mocks.defineFeature.mock.calls.find(
  ([name]) => name === FeatureNames.UNDO_REDO
)?.[2] as {
  priority: number
  exclusive: boolean
  execution: (snapshot: SystemContextSnapshotWithDetail) => Promise<unknown>
}
if (!definition) throw new Error('Missing history feature')
const snapshot = (detail: Record<string, unknown>, keyShift: boolean) =>
  ({ detail, keyShift }) as SystemContextSnapshotWithDetail

describe('history shortcut intent handoff', () => {
  beforeEach(() => {
    mocks.isInUndoRedo.mockReset().mockReturnValue(false)
    mocks.undo.mockReset().mockResolvedValue(undefined)
    mocks.redo.mockReset().mockResolvedValue(undefined)
  })
  for (const modifier of [ModifierKey.META, ModifierKey.CTRL]) {
    for (const shift of [false, true]) {
      it(`retains ${modifier} history direction with Shift=${shift} after later input`, async () => {
        const combo = keyCombinations[
          InputSystemEvents.INPUT_SHORTCUT_UNDOREDO
        ].find((item) => item.modifiers.includes(modifier))
        if (!combo) throw new Error('Missing history shortcut')
        const raw = {
          type: InputType.KEYBOARD,
          keys: ['z'],
          modifiers: {
            shift,
            meta: modifier === ModifierKey.META,
            ctrl: modifier === ModifierKey.CTRL,
            alt: false
          },
          detail: { unrelated: 'preserved' }
        } as RawInputEvent
        combo.callback(raw)
        expect(raw.detail).toEqual({
          unrelated: 'preserved',
          historyDirection: shift ? 'redo' : 'undo'
        })
        expect(definition).toMatchObject({ priority: 100, exclusive: true })
        await definition.execution(snapshot(raw.detail ?? {}, !shift))
        expect(mocks.redo).toHaveBeenCalledTimes(shift ? 1 : 0)
        expect(mocks.undo).toHaveBeenCalledTimes(shift ? 0 : 1)
      })
    }
  }
  for (const direction of [undefined, '', 'other', true]) {
    it(`does not infer missing or invalid direction from live Shift - ${String(direction)}`, async () => {
      expect(
        await definition.execution(
          snapshot({ historyDirection: direction }, true)
        )
      ).toBeNull()
      expect(mocks.undo).not.toHaveBeenCalled()
      expect(mocks.redo).not.toHaveBeenCalled()
    })
  }
  for (const modifier of [ModifierKey.META, ModifierKey.CTRL]) {
    for (const shift of [false, true]) {
      it(`rejects busy ${modifier} history input with Shift=${shift} before dispatch`, () => {
        const combo = keyCombinations[
          InputSystemEvents.INPUT_SHORTCUT_UNDOREDO
        ].find((item) => item.modifiers.includes(modifier))
        if (!combo) throw new Error('Missing shortcut')
        const raw = {
          type: InputType.KEYBOARD,
          keys: ['z'],
          modifiers: { shift, meta: true, ctrl: false, alt: false }
        } as RawInputEvent
        mocks.isInUndoRedo.mockReturnValue(true)
        expect(combo.callback(raw)).toBe(false)
        expect(raw.detail).toBeUndefined()
        mocks.isInUndoRedo.mockReturnValue(false)
        expect(combo.callback(raw)).not.toBe(false)
        expect(raw.detail).toEqual({
          historyDirection: shift ? 'redo' : 'undo'
        })
      })
    }
  }
  it('propagates history failure without executing the opposite command', async () => {
    const failure = new Error('History owner rejected the replay')
    mocks.redo.mockRejectedValueOnce(failure)
    await expect(
      definition.execution(snapshot({ historyDirection: 'redo' }, false))
    ).rejects.toBe(failure)
    expect(mocks.redo).toHaveBeenCalledTimes(1)
    expect(mocks.undo).not.toHaveBeenCalled()
  })
})

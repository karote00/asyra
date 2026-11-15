import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DefaultPointerEventData,
  InputType,
  type RawInputEvent
} from '@asyra/utils'

const setSystemProperty = vi.hoisted(() => vi.fn())

vi.mock('../../contexts', () => ({ default: { setSystemProperty } }))
import { keyCombinations } from '../key-combinations'
import { InputSystemEvents } from '../../constants'

const toolInput = (
  key: string,
  change: Partial<NonNullable<RawInputEvent['keyboard']>> = {}
): RawInputEvent => ({
  type: InputType.KEYBOARD,
  keys: [key],
  modifiers: { shift: false, meta: false, ctrl: false, alt: false },
  pointer: DefaultPointerEventData,
  keyboard: {
    phase: 'down',
    changedKey: key,
    target: document.body,
    repeat: false,
    isComposing: false,
    ...change
  }
})

describe('Tool shortcut admission before session cancellation', () => {
  beforeEach(() => vi.clearAllMocks())

  for (const combo of keyCombinations[
    InputSystemEvents.INPUT_SHORTCUT_SWITCH_PRIMARY_TOOL
  ]) {
    const key = combo.keys[0]

    it(`${key} admits fresh presses but rejects repeats, release, cancellation and unrelated held changes`, () => {
      expect(combo.callback(toolInput(key))).not.toBe(false)
      expect(combo.callback(toolInput(key))).not.toBe(false)
      expect(setSystemProperty).toHaveBeenCalledTimes(8)
      setSystemProperty.mockClear()

      for (const input of [
        toolInput(key, { repeat: true }),
        toolInput(key, { phase: 'up' }),
        toolInput(key, { phase: 'cancel' }),
        toolInput(key, { changedKey: 'Shift' }),
        toolInput(key, { changedKey: key === 'R' ? 'O' : 'R' }),
        toolInput(key, { isComposing: true })
      ]) {
        expect(combo.callback(input)).toBe(false)
      }

      expect(setSystemProperty).not.toHaveBeenCalled()
      expect(combo).toMatchObject({ keyboardMode: 'held' })
    })
  }
})

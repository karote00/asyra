import { expect, it, vi } from 'vitest'
import type { RawInputEvent } from '@asyra/utils'
const setSystemProperty = vi.hoisted(() => vi.fn())
vi.mock('../../contexts', () => ({ default: { setSystemProperty } }))
import { keyCombinations } from '../key-combinations'
import { InputSystemEvents, PrimaryToolType } from '../../constants'

it.each(['input', 'textarea'])(
  'does not switch tools while a %s owns focus',
  (tag) => {
    const control = document.createElement(tag)
    document.body.append(control)
    control.focus()
    for (const combo of keyCombinations[
      InputSystemEvents.INPUT_SHORTCUT_SWITCH_PRIMARY_TOOL
    ]) {
      expect(combo.callback({} as RawInputEvent)).toBe(false)
    }
    expect(setSystemProperty).not.toHaveBeenCalled()
    control.remove()
  }
)
it('registers T through the shared tool routing and preserves its input state', () => {
  const combo = keyCombinations[
    InputSystemEvents.INPUT_SHORTCUT_SWITCH_PRIMARY_TOOL
  ].find((entry) => entry.detail.primaryTool === PrimaryToolType.TEXT)
  if (!combo) {
    throw new Error('Missing text shortcut')
  }
  expect(combo.keys).toEqual(['T'])
  combo.callback({
    modifiers: { shift: false, meta: false, ctrl: false, alt: false }
  } as RawInputEvent)
  expect(setSystemProperty).toHaveBeenCalledTimes(4)
})

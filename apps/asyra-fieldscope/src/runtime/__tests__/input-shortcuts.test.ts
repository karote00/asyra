import { expect, it } from 'vitest'
import { InputType, ModifierKey } from '@asyra/utils'
import { keyMap } from '@asyra/core'
import { createWorkbenchInputKeyCombinations } from '../input-shortcuts'

it('declares history and camera shortcuts as normalized key combinations', () => {
  const combinations = createWorkbenchInputKeyCombinations({
    history: () => undefined,
    fit: () => undefined,
    actualSize: () => undefined
  })

  expect(combinations['workspace.history']).toEqual([
    expect.objectContaining({
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.KeyZ],
      modifiers: [ModifierKey.META]
    }),
    expect.objectContaining({
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.KeyZ],
      modifiers: [ModifierKey.CTRL]
    })
  ])
  expect(combinations['workspace.camera.fit'][0]).toEqual(
    expect.objectContaining({
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.Digit1],
      modifiers: [ModifierKey.META]
    })
  )
  expect(combinations['workspace.camera.actual-size'][0]).toEqual(
    expect.objectContaining({
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.Digit0],
      modifiers: [ModifierKey.META]
    })
  )
})

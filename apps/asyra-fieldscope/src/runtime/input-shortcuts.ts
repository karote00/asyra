import { keyMap } from '@asyra/core'
import { InputType, ModifierKey, type RawInputEvent } from '@asyra/utils'

interface ShortcutActions {
  history: (redo: boolean) => void
  fit: () => void
  actualSize: () => void
}

function shortcut(
  key: string,
  modifier: ModifierKey.META | ModifierKey.CTRL,
  allowShift: boolean,
  action: (raw: RawInputEvent) => void
) {
  return {
    type: InputType.KEYBOARD,
    keys: [key],
    modifiers: [modifier],
    callback: (raw: RawInputEvent) => {
      const otherPrimaryModifier =
        modifier === ModifierKey.META ? raw.modifiers.ctrl : raw.modifiers.meta
      if (raw.modifiers.alt || otherPrimaryModifier) return
      if (raw.modifiers.shift && !allowShift) return
      action(raw)
    }
  }
}

export function createWorkbenchInputKeyCombinations(actions: ShortcutActions) {
  const primaryModifiers = [ModifierKey.META, ModifierKey.CTRL] as const
  return {
    'workspace.history': primaryModifiers.map((modifier) =>
      shortcut(keyMap.keys.KeyZ, modifier, true, (raw) =>
        actions.history(raw.modifiers.shift)
      )
    ),
    'workspace.camera.fit': primaryModifiers.map((modifier) =>
      shortcut(keyMap.keys.Digit1, modifier, false, actions.fit)
    ),
    'workspace.camera.actual-size': primaryModifiers.map((modifier) =>
      shortcut(keyMap.keys.Digit0, modifier, false, actions.actualSize)
    )
  }
}

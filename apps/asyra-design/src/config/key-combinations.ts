import {
  InputType,
  ModifierKey,
  PointerKey,
  MouseButton,
  DefaultKeySnapshot,
  DefaultMoseSnapshot,
  DefaultPosition,
  type RawInputEvent,
  type MouseSnapshot
} from '@asyra/utils'
import { keyMap } from '@asyra/core'
import { PresetSystemPropertyKeys } from '@asyra/preset'
import core from '../contexts'
import { InputSystemEvents, PrimaryToolType } from '../constants'
import { groupShortcutInputRegistrations } from './group-command-descriptors'

// Helper functions to reduce code duplication
const updateKeyState = (raw: RawInputEvent) => {
  const nextKeyState = {
    ...DefaultKeySnapshot,
    shift: raw.modifiers.shift,
    ctrl: raw.modifiers.ctrl,
    alt: raw.modifiers.alt,
    meta: raw.modifiers.meta
  }

  core.setSystemProperty(PresetSystemPropertyKeys.KEY_SHIFT, nextKeyState.shift)
  core.setSystemProperty(PresetSystemPropertyKeys.KEY_CTRL, nextKeyState.ctrl)
  core.setSystemProperty(PresetSystemPropertyKeys.KEY_ALT, nextKeyState.alt)
  core.setSystemProperty(PresetSystemPropertyKeys.KEY_META, nextKeyState.meta)
}

const updateHistoryShortcutState = (raw: RawInputEvent) => {
  updateKeyState(raw)
  if (core.isInUndoRedo()) {
    return false
  }

  raw.detail = {
    ...raw.detail,
    historyDirection: raw.modifiers.shift ? 'redo' : 'undo'
  }
}

export const isEditableShortcutTarget = (target: Element | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    target.isContentEditable ||
    target.contentEditable === 'true'
  )
}

const updateToolShortcutState = (raw: RawInputEvent, key: string) => {
  const keyboard = raw.keyboard

  if (
    !keyboard ||
    keyboard.phase !== 'down' ||
    keyboard.changedKey !== key ||
    keyboard.repeat ||
    keyboard.isComposing
  ) {
    return false
  }

  if (isEditableShortcutTarget(document.activeElement)) {
    return false
  }

  updateKeyState(raw)
}

const updateGroupShortcutState = (raw: RawInputEvent) => {
  updateKeyState(raw)
  raw.detail = {
    ...raw.detail,
    groupShortcut: true,
    editableTarget: isEditableShortcutTarget(document.activeElement)
  }
}

const getCurrentMouseState = (): MouseSnapshot => ({
  dragStart:
    core.getSystemProperty<MouseSnapshot['dragStart']>(
      PresetSystemPropertyKeys.MOUSE_DRAG_START
    ) ?? DefaultMoseSnapshot.dragStart,
  position:
    core.getSystemProperty<MouseSnapshot['position']>(
      PresetSystemPropertyKeys.MOUSE_POSITION
    ) ?? DefaultMoseSnapshot.position,
  delta:
    core.getSystemProperty<MouseSnapshot['delta']>(
      PresetSystemPropertyKeys.MOUSE_DELTA
    ) ?? DefaultMoseSnapshot.delta,
  button:
    core.getSystemProperty<MouseSnapshot['button']>(
      PresetSystemPropertyKeys.MOUSE_BUTTON
    ) ?? DefaultMoseSnapshot.button,
  down:
    core.getSystemProperty<MouseSnapshot['down']>(
      PresetSystemPropertyKeys.MOUSE_DOWN
    ) ?? DefaultMoseSnapshot.down,
  dragging:
    core.getSystemProperty<MouseSnapshot['dragging']>(
      PresetSystemPropertyKeys.MOUSE_DRAGGING
    ) ?? DefaultMoseSnapshot.dragging
})

const updateMouseState = (mouseState: MouseSnapshot) => {
  const currentDragStart =
    core.getSystemProperty<MouseSnapshot['dragStart']>(
      PresetSystemPropertyKeys.MOUSE_DRAG_START
    ) ?? DefaultMoseSnapshot.dragStart

  core.setSystemProperty(
    PresetSystemPropertyKeys.MOUSE_DRAG_START,
    mouseState.dragStart
      ? { ...mouseState.dragStart }
      : {
          ...(currentDragStart ?? DefaultPosition)
        }
  )
  core.setSystemProperty(PresetSystemPropertyKeys.MOUSE_POSITION, {
    ...mouseState.position
  })
  core.setSystemProperty(PresetSystemPropertyKeys.MOUSE_DELTA, {
    ...mouseState.delta
  })
  core.setSystemProperty(
    PresetSystemPropertyKeys.MOUSE_BUTTON,
    mouseState.button
  )
  core.setSystemProperty(PresetSystemPropertyKeys.MOUSE_DOWN, mouseState.down)
  core.setSystemProperty(
    PresetSystemPropertyKeys.MOUSE_DRAGGING,
    mouseState.dragging
  )
}

export const keyCombinations = {
  [InputSystemEvents.INPUT_DRAG_START]: [
    {
      type: InputType.POINTER,
      keys: [PointerKey.LEFT_MOUSE_DOWN],

      callback: (raw: RawInputEvent) => {
        const { clientX, clientY, button } = raw.pointer

        updateMouseState({
          dragStart: { x: clientX, y: clientY },
          position: { x: clientX, y: clientY },
          delta: { x: 0, y: 0 },
          button,
          down: true,
          dragging: false
        })
        updateKeyState(raw)
      }
    }
  ],
  [InputSystemEvents.INPUT_DRAG_UPDATE]: [
    {
      type: InputType.POINTER,
      keys: [PointerKey.LEFT_MOUSE_DOWN, PointerKey.LEFT_MOUSE_MOVE],

      callback: (raw: RawInputEvent) => {
        const { clientX, clientY, button } = raw.pointer
        const currentMouse = getCurrentMouseState()
        const startPos = currentMouse.dragStart || { x: clientX, y: clientY }

        updateMouseState({
          dragStart: startPos,
          position: { x: clientX, y: clientY },
          delta: {
            x: clientX - startPos.x,
            y: clientY - startPos.y
          },
          button,
          down: true,
          dragging: true
        })
        updateKeyState(raw)
      }
    }
  ],
  [InputSystemEvents.INPUT_DRAG_END]: [
    {
      type: InputType.POINTER,
      keys: [PointerKey.LEFT_MOUSE_UP],

      callback: (raw: RawInputEvent) => {
        const { clientX, clientY, button } = raw.pointer
        const currentMouse = getCurrentMouseState()
        const startPos = currentMouse.dragStart || { x: clientX, y: clientY }

        updateMouseState({
          dragStart: startPos,
          position: { x: clientX, y: clientY },
          delta: {
            x: clientX - startPos.x,
            y: clientY - startPos.y
          },
          button,
          down: false,
          dragging: false
        })
        updateKeyState(raw)
      }
    }
  ],
  [InputSystemEvents.INPUT_DOUBLE_CLICK]: [
    {
      type: InputType.POINTER,
      keys: [PointerKey.MOUSE_DOUBLE_CLICK],

      callback: (raw: RawInputEvent) => {
        const { clientX, clientY, button } = raw.pointer

        updateMouseState({
          position: { x: clientX, y: clientY },
          delta: { x: 0, y: 0 },
          button,
          down: false,
          dragging: false
        })
        updateKeyState(raw)
      }
    }
  ],
  [InputSystemEvents.INPUT_MOUSE_MOVE]: [
    {
      type: InputType.POINTER,
      keys: [PointerKey.LEFT_MOUSE_MOVE],

      callback: (raw: RawInputEvent) => {
        const { clientX, clientY, button } = raw.pointer

        updateMouseState({
          position: { x: clientX, y: clientY },
          delta: { x: 0, y: 0 },
          button,
          down: false,
          dragging: false
        })
        updateKeyState(raw)
      }
    }
  ],
  [InputSystemEvents.INPUT_WHEEL_SCROLL]: [
    {
      type: InputType.WHEEL,
      keys: [PointerKey.WHEEL],

      callback: (raw: RawInputEvent) => {
        const { clientX, clientY, deltaX, deltaY } = raw.pointer

        updateMouseState({
          position: { x: clientX, y: clientY },
          delta: { x: deltaX, y: deltaY },
          button: MouseButton.MIDDLE,
          down: false,
          dragging: false
        })
        updateKeyState(raw)
      }
    }
  ],
  [InputSystemEvents.INPUT_SHORTCUT_SWITCH_PRIMARY_TOOL]: [
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.KeyT],
      keyboardMode: 'held',
      detail: { primaryTool: PrimaryToolType.TEXT },

      callback: (raw) => updateToolShortcutState(raw, keyMap.keys.KeyT)
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.KeyR],
      keyboardMode: 'held',
      detail: { primaryTool: PrimaryToolType.RECTANGLE },

      callback: (raw) => updateToolShortcutState(raw, keyMap.keys.KeyR)
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.KeyV],
      keyboardMode: 'held',
      detail: { primaryTool: PrimaryToolType.SELECT },

      callback: (raw) => updateToolShortcutState(raw, keyMap.keys.KeyV)
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.KeyO],
      keyboardMode: 'held',
      detail: { primaryTool: PrimaryToolType.OVAL },

      callback: (raw) => updateToolShortcutState(raw, keyMap.keys.KeyO)
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.KeyP],
      keyboardMode: 'held',
      detail: { primaryTool: PrimaryToolType.PEN },

      callback: (raw) => updateToolShortcutState(raw, keyMap.keys.KeyP)
    }
  ],
  [InputSystemEvents.INPUT_SHORTCUT_CANCEL]: [
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.Escape],
      callback: updateKeyState
    }
  ],
  [InputSystemEvents.INPUT_SHORTCUT_ENTER]: [
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.Enter],
      callback: updateKeyState
    }
  ],
  [InputSystemEvents.INPUT_SHORTCUT_DELETE]: [
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.Delete],
      callback: updateKeyState
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.Backspace],
      callback: updateKeyState
    }
  ],
  [InputSystemEvents.INPUT_SHORTCUT_ARROW]: [
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.ArrowUp],
      callback: updateKeyState
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.ArrowDown],
      callback: updateKeyState
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.ArrowLeft],
      callback: updateKeyState
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.ArrowRight],
      callback: updateKeyState
    }
  ],
  [InputSystemEvents.INPUT_SHORTCUT_UNDOREDO]: [
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.KeyZ],
      modifiers: [ModifierKey.META],
      callback: updateHistoryShortcutState
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.KeyZ],
      modifiers: [ModifierKey.CTRL],
      callback: updateHistoryShortcutState
    }
  ],
  [InputSystemEvents.INPUT_SHORTCUT_GROUP]: groupShortcutInputRegistrations.map(
    ({ key, modifiers }) => ({
      type: InputType.KEYBOARD,
      keys: [key],
      modifiers: [...modifiers],
      detail: { groupShortcut: true },
      callback: updateGroupShortcutState
    })
  ),
  [InputSystemEvents.INPUT_SHORTCUT_ZOOM_PRESET]: [
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.Digit1],
      modifiers: [ModifierKey.META],
      callback: updateKeyState
    },
    {
      type: InputType.KEYBOARD,
      keys: [keyMap.keys.Digit1],
      modifiers: [ModifierKey.CTRL],
      callback: updateKeyState
    }
  ]
} satisfies Parameters<typeof core.registerInputKeyCombinations>[0]

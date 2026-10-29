import { PointerEventData } from './input.js'
import { InputType, ModifierKey, PointerKey } from '../constants/index.js'
import { ModifierKeys } from './key-state.js'

export type KeyboardKey = string

export type InputKey = KeyboardKey | ModifierKey | PointerKey

export type DetailType = Record<string, unknown>

export interface RawInputEvent {
  type: InputType
  keys: KeyboardKey[]
  modifiers: ModifierKeys
  pointer: PointerEventData
  /** Present only for opt-in held keyboard registrations. */
  keyboard?: {
    phase: 'down' | 'up' | 'cancel'
    changedKey: KeyboardKey | null
    target: EventTarget | null
    repeat: boolean
    isComposing: boolean
  }
  detail?: DetailType
}

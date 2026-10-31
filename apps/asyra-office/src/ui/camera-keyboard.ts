import core, { keyMap } from '@asyra/core'
import { InputType } from '@asyra/utils'

const CAMERA_INPUT_EVENT = 'camera.held-movement'

/** Retain held input and integrate velocity only while the camera is moving. */
export function bindCameraKeyboard(
  target: Window,
  move: (right: number, forward: number, fast: boolean) => void,
  owner: Pick<typeof core, 'registerInputKeyCombinations'>
) {
  const movementKeys = [
    keyMap.keys.KeyW,
    keyMap.keys.KeyS,
    keyMap.keys.KeyA,
    keyMap.keys.KeyD,
    keyMap.keys.ArrowUp,
    keyMap.keys.ArrowDown,
    keyMap.keys.ArrowLeft,
    keyMap.keys.ArrowRight
  ]
  const held = new Set<string>()
  let frame: number | undefined
  let previous = 0,
    rightVelocity = 0,
    forwardVelocity = 0,
    fast = false
  const isEditing = (element: EventTarget | null) =>
    element instanceof Element &&
    !!element.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="tab"]'
    )
  const stop = () => {
    if (frame !== undefined) {
      target.cancelAnimationFrame(frame)
    }
    frame = undefined
    held.clear()
    rightVelocity = forwardVelocity = 0
    fast = false
  }
  const tick = (now: number) => {
    frame = undefined
    const dt = Math.max(0, (now - previous) / 1000)
    const travelLimit = dt > 0 ? Math.min(1, 0.05 / dt) : 0
    previous = now
    // Aliases represent the same direction; opposite directions cancel.
    const right =
      Number(held.has(keyMap.keys.KeyD) || held.has('ArrowRight')) -
      Number(held.has(keyMap.keys.KeyA) || held.has('ArrowLeft'))
    const forward =
      Number(held.has(keyMap.keys.KeyW) || held.has('ArrowUp')) -
      Number(held.has(keyMap.keys.KeyS) || held.has('ArrowDown'))
    const length = Math.hypot(right, forward)
    const speed = (fast ? 3 : 1) / Math.max(1, length)
    const desiredRight = right * speed,
      desiredForward = forward * speed
    const tau = length ? 0.09 : 0.06
    const decay = Math.exp(-dt / tau)
    // Exact integral of exponential velocity smoothing, independent of frame rate.
    const dx =
      desiredRight * dt + (rightVelocity - desiredRight) * tau * (1 - decay)
    const dz =
      desiredForward * dt +
      (forwardVelocity - desiredForward) * tau * (1 - decay)
    rightVelocity = desiredRight + (rightVelocity - desiredRight) * decay
    forwardVelocity =
      desiredForward + (forwardVelocity - desiredForward) * decay
    // Controller units are zoom-relative ground displacement; 12 units per second.
    if (dx || dz) {
      move(dx * 12 * travelLimit, dz * 12 * travelLimit, false)
    }
    if (length || Math.hypot(rightVelocity, forwardVelocity) > 0.001) {
      frame = target.requestAnimationFrame(tick)
    } else {
      rightVelocity = forwardVelocity = 0
    }
  }
  const start = () => {
    if (frame !== undefined) {
      return
    }
    previous = target.performance.now()
    frame = target.requestAnimationFrame(tick)
  }
  const unregister = owner.registerInputKeyCombinations({
    [CAMERA_INPUT_EVENT]: [
      {
        type: InputType.KEYBOARD,
        keys: movementKeys,
        keyboardMode: 'held',
        callback: (raw) => {
          if (
            raw.keyboard?.phase === 'cancel' ||
            raw.keyboard?.isComposing ||
            raw.modifiers.ctrl ||
            raw.modifiers.meta ||
            raw.modifiers.alt ||
            isEditing(raw.keyboard?.target ?? null) ||
            isEditing(target.document.activeElement) ||
            target.document.hidden
          ) {
            stop()
            return false
          }
          held.clear()
          for (const key of raw.keys) {
            if (movementKeys.includes(key)) {
              held.add(key)
            }
          }
          fast = raw.modifiers.shift
          if (held.size || rightVelocity || forwardVelocity) {
            start()
          }
        }
      }
    ]
  })
  return () => {
    unregister()
    stop()
  }
}

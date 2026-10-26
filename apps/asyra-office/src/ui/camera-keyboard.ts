/** Retain held input and integrate velocity only while the camera is moving. */
export function bindCameraKeyboard(
  target: Window,
  move: (right: number, forward: number, fast: boolean) => void
) {
  const movementKeys = new Set([
    'w',
    's',
    'a',
    'd',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight'
  ])
  const held = new Set<string>()
  let frame: number | undefined
  let previous = 0,
    rightVelocity = 0,
    forwardVelocity = 0,
    fast = false
  const inputKey = (event: KeyboardEvent) =>
    event.key.length === 1 ? event.key.toLowerCase() : event.key
  const isEditing = (element: EventTarget | null) =>
    element instanceof Element &&
    !!element.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="tab"]'
    )
  const stop = () => {
    if (frame !== undefined) target.cancelAnimationFrame(frame)
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
      Number(held.has('d') || held.has('ArrowRight')) -
      Number(held.has('a') || held.has('ArrowLeft'))
    const forward =
      Number(held.has('w') || held.has('ArrowUp')) -
      Number(held.has('s') || held.has('ArrowDown'))
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
    if (dx || dz) move(dx * 12 * travelLimit, dz * 12 * travelLimit, false)
    if (length || Math.hypot(rightVelocity, forwardVelocity) > 0.001)
      frame = target.requestAnimationFrame(tick)
    else rightVelocity = forwardVelocity = 0
  }
  const start = () => {
    if (frame !== undefined) return
    previous = target.performance.now()
    frame = target.requestAnimationFrame(tick)
  }
  const down = (event: KeyboardEvent) => {
    if (
      event.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      isEditing(event.target) ||
      target.document.hidden
    ) {
      stop()
      return
    }
    if (event.defaultPrevented) return
    fast = event.shiftKey
    const key = inputKey(event)
    if (!movementKeys.has(key)) return
    event.preventDefault()
    event.stopPropagation()
    held.add(key)
    start()
  }
  const up = (event: KeyboardEvent) => {
    fast = event.shiftKey
    // Release even if another handler consumed keyup or focus moved since keydown.
    held.delete(inputKey(event))
    if (held.size) start()
  }
  const focus = (event: FocusEvent) => {
    if (isEditing(event.target)) stop()
  }
  const visibility = () => {
    if (target.document.hidden) stop()
  }
  target.addEventListener('keydown', down, true)
  target.addEventListener('keyup', up, true)
  target.addEventListener('blur', stop)
  target.addEventListener('focusin', focus)
  target.document.addEventListener('visibilitychange', visibility)
  return () => {
    stop()
    target.removeEventListener('keydown', down, true)
    target.removeEventListener('keyup', up, true)
    target.removeEventListener('blur', stop)
    target.removeEventListener('focusin', focus)
    target.document.removeEventListener('visibilitychange', visibility)
  }
}

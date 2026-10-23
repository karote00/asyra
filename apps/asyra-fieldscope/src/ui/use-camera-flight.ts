import { useEffect, type RefObject } from 'react'
import type { FarmRuntime } from '../runtime/bootstrap'

const movementKeys: Record<string, readonly [number, number, number]> = {
  KeyW: [0, 0, 1],
  KeyS: [0, 0, -1],
  KeyA: [-1, 0, 0],
  KeyD: [1, 0, 0],
  KeyE: [0, 1, 0],
  KeyQ: [0, -1, 0]
}
/** A frame loop exists only while movement keys are held on the focused canvas. */
export function useCameraFlight(
  host: RefObject<HTMLDivElement | null>,
  runtime: FarmRuntime | null
) {
  useEffect(() => {
    const target = host.current
    if (!target || !runtime) return
    const held = new Set<string>()
    let frame: number | undefined
    let previousTime: number | undefined
    let accelerated = false
    const move = (seconds: number) => {
      const vector = [0, 0, 0]
      held.forEach((key) =>
        movementKeys[key].forEach((v, i) => {
          vector[i] += v
        })
      )
      const length = Math.hypot(...vector)
      if (!length) return
      const distance = (1.5 * seconds * (accelerated ? 4 : 1)) / length
      runtime.move(
        vector[0] * distance,
        vector[1] * distance,
        vector[2] * distance
      )
    }
    const stop = () => {
      held.clear()
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = undefined
      previousTime = undefined
      accelerated = false
    }
    const tick = (time: number) => {
      if (document.activeElement !== target || document.hidden || !held.size) {
        stop()
        return
      }
      if (previousTime !== undefined)
        move(Math.min((time - previousTime) / 1000, 0.05))
      previousTime = time
      frame = requestAnimationFrame(tick)
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        stop()
        return
      }
      accelerated = event.shiftKey
      if (!movementKeys[event.code]) return
      event.preventDefault()
      if (held.has(event.code)) return
      held.add(event.code)
      move(1 / 30)
      if (frame === undefined) frame = requestAnimationFrame(tick)
    }
    const keyup = (event: KeyboardEvent) => {
      accelerated = event.shiftKey
      held.delete(event.code)
      if (!held.size) stop()
    }
    target.addEventListener('keydown', keydown)
    target.addEventListener('blur', stop)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', stop)
    return () => {
      stop()
      target.removeEventListener('keydown', keydown)
      target.removeEventListener('blur', stop)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', stop)
    }
  }, [host, runtime])
}

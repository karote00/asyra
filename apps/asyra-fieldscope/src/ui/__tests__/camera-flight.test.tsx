// @vitest-environment jsdom
import { act, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { useCameraFlight } from '../use-camera-flight'
import type { FarmRuntime } from '../../runtime/bootstrap'

it('routes focused held keys, applies Shift speed, and stops on release, blur and unmount', async () => {
  const pending = new Map<number, FrameRequestCallback>()
  let sequence = 0
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    pending.set(++sequence, callback)
    return sequence
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => pending.delete(id))
  const move = vi.fn()
  const runtime = { move } as unknown as FarmRuntime
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  function Fixture() {
    const ref = useRef<HTMLDivElement>(null)
    useCameraFlight(ref, runtime)
    return (
      <>
        <div ref={ref} tabIndex={0} />
        <input />
      </>
    )
  }
  const key = (
    target: EventTarget,
    type: string,
    code: string,
    shiftKey = false
  ) =>
    target.dispatchEvent(
      new KeyboardEvent(type, { code, shiftKey, bubbles: true })
    )
  const tick = (time: number) => {
    const callbacks = [...pending.values()]
    pending.clear()
    callbacks.forEach((callback) => callback(time))
  }
  try {
    await act(async () => root.render(<Fixture />))
    const scene = container.querySelector('div')
    const input = container.querySelector('input')
    if (!scene || !input) throw new Error('Missing fixture')
    input.focus()
    key(input, 'keydown', 'KeyW')
    expect(move).not.toHaveBeenCalled()
    expect(pending.size).toBe(0)
    scene.focus()
    key(scene, 'keydown', 'KeyW')
    expect(move).toHaveBeenLastCalledWith(0, 0, 0.05)
    expect(pending.size).toBe(1)
    key(scene, 'keydown', 'KeyW')
    expect(move).toHaveBeenCalledTimes(1)
    tick(0)
    tick(20)
    expect(move).toHaveBeenLastCalledWith(0, 0, 0.03)
    key(window, 'keyup', 'KeyW')
    expect(pending.size).toBe(0)
    key(scene, 'keydown', 'KeyS', true)
    expect(move).toHaveBeenLastCalledWith(0, 0, -0.2)
    input.focus()
    expect(pending.size).toBe(0)
    for (const [code, vector] of [
      ['KeyA', [-0.05, 0, 0]],
      ['KeyD', [0.05, 0, 0]],
      ['KeyE', [0, 0.05, 0]],
      ['KeyQ', [0, -0.05, 0]]
    ] as const) {
      scene.focus()
      key(scene, 'keydown', code)
      expect(move).toHaveBeenLastCalledWith(...vector)
      key(window, 'keyup', code)
    }
    key(scene, 'keydown', 'KeyW')
    window.dispatchEvent(new Event('blur'))
    expect(pending.size).toBe(0)
    key(scene, 'keydown', 'KeyW')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(pending.size).toBe(0)
    scene.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'KeyW',
        ctrlKey: true,
        bubbles: true
      })
    )
    expect(pending.size).toBe(0)
    key(scene, 'keydown', 'KeyW')
    await act(async () => root.unmount())
    expect(pending.size).toBe(0)
  } finally {
    container.remove()
    vi.unstubAllGlobals()
  }
})

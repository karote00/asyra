import { afterEach, expect, it, vi } from 'vitest'
import { bindCameraKeyboard } from '../camera-keyboard'

const disposers: (() => void)[] = []
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose())
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

function fixture() {
  let time = 0,
    next = 0
  const pending = new Map<number, FrameRequestCallback>()
  vi.spyOn(window.performance, 'now').mockImplementation(() => time)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    pending.set(++next, callback)
    return next
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    pending.delete(id)
  })
  const move = vi.fn()
  const dispose = bindCameraKeyboard(window, move)
  disposers.push(dispose)
  return {
    move,
    dispose,
    pending,
    frame(ms = 1000 / 60) {
      time += ms
      const callbacks = [...pending.values()]
      pending.clear()
      callbacks.forEach((callback) => callback(time))
    },
    run(frames: number, ms = 1000 / 60) {
      for (let i = 0; i < frames; i++) this.frame(ms)
    }
  }
}
function key(
  type: 'keydown' | 'keyup',
  value: string,
  options: KeyboardEventInit = {},
  target: EventTarget = window
) {
  target.dispatchEvent(
    new KeyboardEvent(type, {
      key: value,
      bubbles: true,
      cancelable: true,
      ...options
    })
  )
}
function total(move: ReturnType<typeof vi.fn>) {
  return move.mock.calls.reduce(
    (sum, [x, z, fast]) => {
      sum[0] += x * (fast ? 3 : 1)
      sum[1] += z * (fast ? 3 : 1)
      return sum
    },
    [0, 0]
  )
}

it('moves continuously without key repeat, eases start/release and schedules no idle work', () => {
  const f = fixture()
  expect(f.pending.size).toBe(0)
  key('keydown', 'w')
  expect(f.move).not.toHaveBeenCalled()
  expect(f.pending.size).toBe(1)
  f.run(12)
  expect(f.move).toHaveBeenCalledTimes(12)
  const distances = f.move.mock.calls.map(([, z]) => z)
  expect(distances[0]).toBeGreaterThan(0)
  expect(distances[0]).toBeLessThan(distances[11] / 3)
  for (let i = 1; i < distances.length; i++)
    expect(distances[i]).toBeGreaterThan(distances[i - 1])
  for (let i = 0; i < 10; i++) key('keydown', 'w', { repeat: true })
  expect(f.move).toHaveBeenCalledTimes(12)
  expect(f.pending.size).toBe(1)
  key('keyup', 'w')
  f.run(60)
  const released = f.move.mock.calls.slice(12).map(([, z]) => z)
  expect(released.length).toBeGreaterThan(1)
  for (let i = 1; i < released.length; i++)
    expect(released[i]).toBeLessThan(released[i - 1])
  expect(f.pending.size).toBe(0)
  const count = f.move.mock.calls.length
  f.run(10)
  expect(f.move).toHaveBeenCalledTimes(count)
})

it('covers equal ground distance at 30, 60 and 120 Hz without repeat-rate dependence', () => {
  const distances = [30, 60, 120].map((hz) => {
    const f = fixture()
    key('keydown', 'w')
    f.run(hz, 1000 / hz)
    key('keyup', 'w')
    f.run(hz, 1000 / hz)
    const result = total(f.move)[1]
    f.dispose()
    return result
  })
  expect(distances[0]).toBeGreaterThan(1)
  expect(distances[0]).toBeCloseTo(distances[1], 3)
  expect(distances[1]).toBeCloseTo(distances[2], 3)
})

it('normalizes diagonals, supports both key families and eases into three-times speed', () => {
  const run = (keys: string[], shift = false) => {
    const f = fixture()
    keys.forEach((k) => key('keydown', k, { shiftKey: shift }))
    f.run(60)
    const result = total(f.move)
    f.dispose()
    return result
  }
  const straight = run(['w'])[1]
  const diagonal = run(['ArrowUp', 'D'])
  expect(diagonal[0]).toBeCloseTo(diagonal[1], 6)
  expect(Math.hypot(...diagonal)).toBeCloseTo(straight, 6)
  expect(run(['ArrowDown'])[1]).toBeCloseTo(-straight, 6)
  expect(run(['A'])[0]).toBeCloseTo(-straight, 6)
  expect(run(['ArrowRight'], true)[0]).toBeCloseTo(straight * 3, 6)
})

it('cancels opposing keys and limits catch-up after a long frame stall', () => {
  const f = fixture()
  key('keydown', 'w')
  key('keydown', 's')
  f.run(10)
  expect(total(f.move)).toEqual([0, 0])
  key('keyup', 's')
  f.frame(5000)
  expect(total(f.move)[1]).toBeGreaterThan(0)
  expect(total(f.move)[1]).toBeLessThan(0.6)
})

it('preserves text/IME/browser shortcuts and immediately cancels on focus loss, hidden state and disposal', () => {
  const f = fixture()
  const input = document.createElement('input')
  document.body.append(input)
  key('keydown', 'w', {}, input)
  key('keydown', 'w', { metaKey: true })
  key('keydown', 'w', { isComposing: true })
  f.run(5)
  expect(f.move).not.toHaveBeenCalled()
  for (const cancel of [
    () => window.dispatchEvent(new Event('blur')),
    () => input.focus(),
    () => {
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
      document.dispatchEvent(new Event('visibilitychange'))
    },
    f.dispose
  ]) {
    input.blur()
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    key('keydown', 'w')
    f.run(5)
    const count = f.move.mock.calls.length
    cancel()
    expect(f.pending.size).toBe(0)
    f.run(5)
    expect(f.move).toHaveBeenCalledTimes(count)
  }
  key('keydown', 'w')
  expect(f.pending.size).toBe(0)
})

it('owns held movement keys before focused canvas input consumes them', () => {
  const f = fixture()
  const canvas = document.createElement('canvas')
  canvas.tabIndex = 0
  document.body.append(canvas)
  canvas.focus()
  const canvasInput = (event: KeyboardEvent) => event.preventDefault()
  document.addEventListener('keydown', canvasInput)
  disposers.push(() => document.removeEventListener('keydown', canvasInput))
  key('keydown', 'w', {}, canvas)
  f.run(5)
  expect(total(f.move)[1]).toBeGreaterThan(0)
})

it('settles release in real elapsed time even when rendering stalls', () => {
  const f = fixture()
  key('keydown', 'w')
  f.run(60)
  key('keyup', 'w')
  f.frame(800)
  expect(f.pending.size).toBe(0)
  const count = f.move.mock.calls.length
  f.frame(800)
  expect(f.move).toHaveBeenCalledTimes(count)
})

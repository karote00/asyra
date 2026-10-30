import { afterEach, expect, it, vi } from 'vitest'
import { InputType, type RawInputEvent } from '@asyra/utils'
import { InputSystem } from '../input-system'

const systems: InputSystem[] = []
afterEach(() => {
  systems.splice(0).forEach((s) => s.dispose())
  vi.useRealTimers()
  document.body.replaceChildren()
})
function setup() {
  const system = new InputSystem()
  systems.push(system)
  const receive = vi.fn()
  system.registry.registerKeyCombinations({
    movement: [
      {
        type: InputType.KEYBOARD,
        keys: ['W', 'A', 'S', 'D', 'ArrowUp'],
        keyboardMode: 'held',
        callback: receive
      }
    ]
  })
  system.attachBrowserHost(window)
  return { system, receive }
}
function key(
  type: string,
  code: string,
  options: KeyboardEventInit = {},
  target: EventTarget = document.body
) {
  const e = new KeyboardEvent(type, {
    code,
    bubbles: true,
    cancelable: true,
    ...options
  })
  target.dispatchEvent(e)
  return e
}
it('delivers complete held alternatives through the combination registry without repeat expiry', () => {
  vi.useFakeTimers()
  const { receive } = setup()
  key('keydown', 'KeyW')
  key('keydown', 'KeyD', { shiftKey: true })
  expect(receive).toHaveBeenLastCalledWith(
    expect.objectContaining({
      keys: ['W', 'D'],
      modifiers: expect.objectContaining({ shift: true }),
      keyboard: expect.objectContaining({ phase: 'down' })
    })
  )
  vi.advanceTimersByTime(20000)
  key('keyup', 'KeyD')
  expect(receive).toHaveBeenLastCalledWith(
    expect.objectContaining({
      keys: ['W'],
      keyboard: expect.objectContaining({ phase: 'up' })
    })
  )
  key('keyup', 'KeyW')
  expect(receive).toHaveBeenLastCalledWith(
    expect.objectContaining({ keys: [] })
  )
})
it('releases before an editor stops propagation, while rejected input preserves browser defaults', () => {
  const { receive } = setup()
  const editor = document.createElement('input')
  document.body.append(editor)
  key('keydown', 'KeyW')
  editor.addEventListener('keyup', (e) => e.stopPropagation())
  key('keyup', 'KeyW', {}, editor)
  expect(receive).toHaveBeenLastCalledWith(
    expect.objectContaining({ keys: [] })
  )
  receive.mockImplementation((raw: RawInputEvent) => !raw.modifiers.meta)
  expect(key('keydown', 'KeyW', { metaKey: true }).defaultPrevented).toBe(false)
})
it('cancels held state on blur, focus, composition and hidden document and removes host listeners', () => {
  const { system, receive } = setup()
  for (const event of ['blur', 'focusin', 'compositionstart']) {
    key('keydown', 'KeyW')
    window.dispatchEvent(new Event(event))
    expect(receive).toHaveBeenLastCalledWith(
      expect.objectContaining({
        keys: [],
        keyboard: expect.objectContaining({ phase: 'cancel' })
      })
    )
  }
  key('keydown', 'KeyW')
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  document.dispatchEvent(new Event('visibilitychange'))
  expect(receive).toHaveBeenLastCalledWith(
    expect.objectContaining({ keys: [] })
  )
  hidden.mockRestore()
  system.detachBrowserHost()
  receive.mockClear()
  key('keydown', 'KeyW')
  expect(receive).not.toHaveBeenCalled()
})
it('keeps ordinary exact chords and callback rejection semantics', () => {
  const { system } = setup()
  const chord = vi.fn(),
    dispatched = vi.fn()
  system.registry.register('chord', [
    { type: InputType.KEYBOARD, keys: ['A'], callback: chord }
  ])
  system.on('movement', dispatched)
  key('keydown', 'KeyA')
  expect(chord).toHaveBeenCalledOnce()
  key('keydown', 'KeyW')
  expect(chord).toHaveBeenCalledOnce()
  expect(dispatched).toHaveBeenLastCalledWith(
    expect.objectContaining({ keys: ['A', 'W'] })
  )
})
it('finishes runtime cleanup when a held cancellation callback throws', () => {
  const { system, receive } = setup()
  key('keydown', 'KeyW')
  receive.mockImplementation((raw: RawInputEvent) => {
    if (raw.keyboard?.phase === 'cancel') {
      throw new Error('Cancellation failed')
    }
  })
  expect(() => system.resetRuntime()).toThrow('Cancellation failed')
  expect(system.registry.getEventNames()).toEqual([])
  receive.mockClear()
  key('keydown', 'KeyW')
  expect(receive).not.toHaveBeenCalled()
  expect(() => system.resetRuntime()).not.toThrow()
})

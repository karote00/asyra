import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Input from '../Input'
afterEach(cleanup)
describe('Input step controls', () => {
  it('steps from the current draft and commits once per click', () => {
    const commit = vi.fn()
    render(
      <Input
        aria-label="Size"
        type="number"
        value={12}
        stepControls
        min={1}
        onChange={commit}
      />
    )
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '20' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Increase Size' }))
    expect(commit).toHaveBeenCalledExactlyOnceWith('21')
    expect(screen.getByRole('spinbutton').getAttribute('value')).toBe('21')
  })
  it('disables steps beyond bounds and leaves ordinary inputs unchanged', () => {
    const view = render(
      <Input
        aria-label="Size"
        type="number"
        value={1}
        stepControls
        min={1}
        onChange={vi.fn()}
      />
    )
    expect(
      (
        screen.getByRole('button', {
          name: 'Decrease Size'
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    view.rerender(<Input aria-label="Size" value={1} onChange={vi.fn()} />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})

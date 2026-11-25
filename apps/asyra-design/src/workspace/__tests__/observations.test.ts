import { describe, expect, it, vi } from 'vitest'
import { createWorkspaceObservations } from '../observations'

const source = vi.hoisted(() => ({
  getRegistrations: vi.fn(),
  getSystemPropertyObservable: vi.fn(),
  onUIPropertyChange: vi.fn()
}))

vi.mock('../../contexts', () => ({ default: source }))

describe('workspace observation discovery', () => {
  it('reads the sealed composition once and binds only advertised sources', () => {
    source.getRegistrations.mockReturnValue([
      { ref: { kind: 'ui-property', key: 'customColor' } },
      { ref: { kind: 'feature', key: 'draw' } }
    ])
    const detach = vi.fn()

    source.onUIPropertyChange.mockImplementation((_key, notify) => {
      notify({ color: '#123456' })

      return detach
    })

    const catalog = createWorkspaceObservations()
    const keys = catalog.observeKeys

    expect(keys).toEqual(['customColor', 'collaboration'])
    const receive = vi.fn()

    for (let index = 0; index < 3; index++) {
      expect(catalog.observeKeys).toBe(keys)
      catalog.observe('customColor', receive)()
    }

    expect(receive).toHaveBeenCalledTimes(3)
    expect(detach).toHaveBeenCalledTimes(3)
    expect(() => catalog.observe('draw', receive)).toThrow(
      'Unknown workspace observation'
    )
    expect(source.getRegistrations).toHaveBeenCalledTimes(1)
    expect(source.getSystemPropertyObservable).toHaveBeenCalledTimes(1)

    source.getRegistrations.mockReturnValue([
      { ref: { kind: 'ui-property', key: 'replacement' } }
    ])
    expect(createWorkspaceObservations().observeKeys).toEqual([
      'replacement',
      'collaboration'
    ])
    expect(catalog.observeKeys).toBe(keys)
  })
})

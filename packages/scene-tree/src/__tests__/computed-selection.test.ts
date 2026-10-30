import { describe, expect, it, vi } from 'vitest'
import sceneTree, { createDynamicComponent, Workspace } from '../index.js'

const SnapshotElement = createDynamicComponent(
  'snapshot-selection',
  'snapshot-selection',
  'Snapshot selection',
  [],
  {}
)

describe('computed snapshot owner selection', () => {
  it.each([0, 1000])(
    'reads selected fields once without enumerating %i unrelated fields',
    (count) => {
      const element = new SnapshotElement()
      const x = vi.fn(() => 12)
      const omitted = vi.fn(() => ({ large: ['geometry'] }))
      const source = Object.fromEntries(
        Array.from({ length: count }, (_, index) => [`unused-${index}`, index])
      )
      Object.defineProperties(source, {
        x: { enumerable: true, get: x },
        geometry: { enumerable: true, get: omitted }
      })
      const enumerate = vi.fn(Reflect.ownKeys)
      element.computed.data = new Proxy(source, {
        ownKeys: enumerate
      }) as typeof element.computed.data
      const snapshot = element.getAllComputedData(['x', 'x', 'absent'])
      expect(snapshot).toEqual({ x: 12 })
      expect(x).toHaveBeenCalledTimes(1)
      expect(omitted).not.toHaveBeenCalled()
      expect(enumerate).not.toHaveBeenCalled()
    }
  )

  it('preserves own enumerable values, empty selection and safe special keys', () => {
    const element = new SnapshotElement()
    const source = Object.create({ inherited: 42 })
    Object.defineProperties(source, {
      x: { value: 3, enumerable: true },
      hidden: { value: 4, enumerable: false },
      optional: { value: undefined, enumerable: true }
    })
    // Object literal __proto__ is special; define the actual own data key.
    Object.defineProperty(source, '__proto__', {
      value: 'own value',
      enumerable: true
    })
    element.computed.data = source
    expect(
      element.getAllComputedData([
        'x',
        'hidden',
        'inherited',
        'optional',
        '__proto__'
      ])
    ).toEqual(
      Object.fromEntries([
        ['x', 3],
        ['optional', undefined],
        ['__proto__', 'own value']
      ])
    )
    expect(element.getAllComputedData([])).toEqual({})
    const full = element.getAllComputedData()
    expect(full).toEqual(
      Object.fromEntries([
        ['x', 3],
        ['optional', undefined],
        ['__proto__', 'own value']
      ])
    )
    expect(full).not.toBe(source)
    expect(new Workspace(sceneTree).getAllComputedData(['x'])).toEqual({})
  })
})

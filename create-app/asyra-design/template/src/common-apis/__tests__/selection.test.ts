import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({
  default: {
    getElementMetadata: vi.fn(),
    getSelectedElementIds: vi.fn(),
    selectElements: vi.fn()
  }
}))
import core from '../../contexts'
import { selectionApis } from '../selection'

let selected: string[]
beforeEach(() => {
  vi.clearAllMocks()
  selected = ['previous']
  core.getSelectedElementIds = vi.fn(() => [...selected])
  core.getElementMetadata = vi.fn((id) =>
    ['previous', 'valid'].includes(id) ? { id, type: 'rect' } : undefined
  ) as typeof core.getElementMetadata
  core.selectElements = vi.fn((ids) => {
    selected = [...ids]
  })
})
describe('element selection admission', () => {
  it.each([['missing'], ['valid', 'missing'], ['missing', 'valid']])(
    'preserves the complete previous selection for invalid IDs: %j',
    (...ids) => {
      expect(() => selectionApis.selectElements(ids)).toThrow(
        'Selection target does not exist: missing'
      )
      expect(selected).toEqual(['previous'])
      expect(core.selectElements).not.toHaveBeenCalled()
      selectionApis.selectElements(['valid'])
      expect(selected).toEqual(['valid'])
    }
  )
  it('rejects a missing toggle without mutating the selection', () => {
    expect(() => selectionApis.toggleSelection('missing')).toThrow(
      'Selection target does not exist: missing'
    )
    expect(core.selectElements).not.toHaveBeenCalled()
    expect(selected).toEqual(['previous'])
    selectionApis.toggleSelection('valid')
    expect(selected).toEqual(['previous', 'valid'])
    selectionApis.toggleSelection('valid')
    expect(selected).toEqual(['previous'])
  })
  it('preserves explicit empty selection and mutation options', () => {
    const options = { undoable: false }
    selectionApis.selectElements([], options)
    expect(selected).toEqual([])
    expect(core.selectElements).toHaveBeenCalledWith([], options)
  })
})

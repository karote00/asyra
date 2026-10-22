import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ type: 'text' }))
vi.mock('../../providers', () => ({
  useElementSelection: () => new Set(['selected']),
  useElementData: () => ({ type: mocks.type })
}))
vi.mock('../text', () => ({ default: () => <div>Typography</div> }))
vi.mock('../position', () => ({ default: () => <div>Position</div> }))
vi.mock('../dimension', () => ({ default: () => <div>Dimension</div> }))
vi.mock('../rotation', () => ({ default: () => <div>Rotation</div> }))
vi.mock('../fills', () => ({ default: () => <div>Fills</div> }))
vi.mock('../strokes', () => ({ default: () => <div>Strokes</div> }))
import ElementPropertiesPanel from '../panels/element-properties-panel'

afterEach(cleanup)
describe('Text appearance ownership', () => {
  it('keeps geometry and typography but hides unsupported Text appearance lists', () => {
    mocks.type = 'text'
    render(<ElementPropertiesPanel title="Text" />)
    expect(screen.getByText('Position')).toBeTruthy()
    expect(screen.getByText('Typography')).toBeTruthy()
    expect(screen.queryByText('Fills')).toBeNull()
    expect(screen.queryByText('Strokes')).toBeNull()
  })

  it.each(['rect', 'custom-label'])(
    'preserves appearance panels for %s',
    (type) => {
      mocks.type = type
      render(<ElementPropertiesPanel title="Element" />)
      expect(screen.getByText('Fills')).toBeTruthy()
      expect(screen.getByText('Strokes')).toBeTruthy()
    }
  )
})

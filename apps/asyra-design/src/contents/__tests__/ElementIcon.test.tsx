import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Icon } from '@asyra/design-system'
vi.mock('../../providers', () => ({ useVectorIconPathMap: () => null }))
import { ElementIcon } from '../ElementIcon'

afterEach(cleanup)
describe('Text layer icon', () => {
  it('uses the shared Text SVG rather than the rectangle icon', () => {
    const row = render(<ElementIcon elementId="heading" type="text" />)
    const actual = row.container.querySelector('svg')?.outerHTML
    const reference = render(<Icon name="Text" />)
    expect(actual).toBeDefined()
    expect(reference.container.querySelector('svg')).not.toBeNull()
    expect(actual).toBe(reference.container.querySelector('svg')?.outerHTML)
    expect(row.container.querySelector('rect')).toBeNull()
  })
})

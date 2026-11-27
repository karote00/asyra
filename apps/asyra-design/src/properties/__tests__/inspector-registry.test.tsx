import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import Position from '../position'
import Dimension from '../dimension'

vi.mock('../../hooks', () => ({ useProperty: () => 0 }))
vi.mock('../../controllers/scene-tree', () => ({
  updateSelectedElementProperties: vi.fn()
}))

afterEach(cleanup)

it('identifies standalone inspector rows and their native fields without an SDK host', () => {
  const { container } = render(
    <>
      <Position />
      <Dimension />
    </>
  )
  const rows = Array.from(
    container.querySelectorAll('[data-inspector-row]'),
    (row) => ({
      id: row.getAttribute('data-inspector-row'),
      fields: Array.from(
        row.querySelectorAll('input'),
        (field) => field.dataset.inspectorField
      )
    })
  )

  expect(rows).toEqual([
    { id: 'positionRow', fields: ['x', 'y'] },
    { id: 'dimensionRow', fields: ['width', 'height'] }
  ])
})

import { expect, it, vi } from 'vitest'
import * as furnishings from '../../assets/furnishings'
import { composeOfficeSeating } from '../office-seating'

it('constructs shared tea geometry once per composition and gives the composer three instances', () => {
  const chair = vi.spyOn(furnishings, 'teaChair')
  const table = vi.spyOn(furnishings, 'teaTable')
  const add = vi.fn()
  composeOfficeSeating({ add })
  expect(chair).not.toHaveBeenCalled()
  expect(table).toHaveBeenCalledTimes(1)
  expect(add).toHaveBeenCalledTimes(3)
  composeOfficeSeating({ add })
  expect(chair).not.toHaveBeenCalled()
  expect(table).toHaveBeenCalledTimes(2)
  chair.mockRestore()
  table.mockRestore()
})

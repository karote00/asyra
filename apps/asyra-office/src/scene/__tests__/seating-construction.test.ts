import { expect, it, vi } from 'vitest'
import * as furnishings from '../../assets/furnishings'
import * as tableware from '../../assets/discussion-tableware'
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

it('reuses the constructed tabletop for room decoration and reconstructs only for a new scene', async () => {
  const { createReferenceScene } = await import('../reference-scene')
  const table = vi.spyOn(furnishings, 'teaTable')
  // Optical solid construction has separate geometry and visual coverage.
  // Keep this integration test focused on tabletop construction ownership.
  const coffee = vi.spyOn(tableware, 'americanoGlass').mockReturnValue([])
  const sugar = vi.spyOn(tableware, 'sugarJar').mockReturnValue([])
  try {
    createReferenceScene('room-furnishings')
    expect(table).toHaveBeenCalledTimes(1)
    createReferenceScene('room-furnishings')
    expect(table).toHaveBeenCalledTimes(2)
  } finally {
    table.mockRestore()
    coffee.mockRestore()
    sugar.mockRestore()
  }
})

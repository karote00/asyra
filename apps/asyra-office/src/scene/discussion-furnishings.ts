import { requiredSpecValue } from '../assets/specification'
import { wallClock } from '../assets/clock'
import { catalogAsset } from '../assets/catalog'
import { mug } from '../assets/desk-items'
import { OFFICE_FLOORS, OFFICE_FIT, OFFICE_SHELL } from './office-layout'
import { OFFICE_SEATING } from './office-seating'
import { addPrint } from './room-furnishing-helpers'
import type { OfficeComposer } from './office-interior'

export function addDiscussionFurnishings(c: OfficeComposer, tableTop: number) {
  const { add, block, plant } = c,
    p = OFFICE_FIT.parameters
  const floor = OFFICE_FLOORS.discussion,
    rear = p.rearY - 0.08,
    west = OFFICE_SHELL.westX + 0.08
  const start = p.creamY + 0.09,
    length = rear - start,
    height = p.rearTop - floor - 0.025
  // Original wood boards cover the left interior wall; the clock wall stays cream.
  for (let i = 0; i < 10; i++)
    block(
      'discussion-board-' + i,
      [0.022, length / 10 - 0.003, height],
      [west + 0.011, start + ((i + 0.5) * length) / 10, floor + height / 2],
      [0xaa8463, 0xb2906c, 0xa67f5d][i % 3],
      'wood',
      0.001
    )
  addPrint(
    c,
    'discussion-print',
    'Better\nAgents\nHappier\nPeople',
    [0.75, 1.06],
    [west + 0.042, 1.71, 2.1],
    90
  )
  add(
    'wall-clock',
    'wall-clock',
    wallClock(),
    [-1.83, rear - 0.004, 2.33],
    0,
    [1.35, 1.35, 1.35]
  )
  addPrint(
    c,
    'discussion-note',
    'Small steps\nEvery day',
    [0.3, 0.39],
    [-0.84, rear - 0.016, 2.18]
  )
  const top = floor + 0.82
  block(
    'discussion-console',
    [0.88, 0.29, 0.035],
    [-0.91, rear - 0.16, top],
    0xb49164,
    'wood',
    0.004
  )
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      block(
        `discussion-console-leg-${x}-${y}`,
        [0.033, 0.033, 0.8025],
        [-0.91 + x * 0.39, rear - 0.16 + y * 0.102, floor + 0.40125],
        0x705739,
        'wood',
        0.002
      )
  plant('discussion-console-plant', [-1.16, rear - 0.16, top + 0.0175], 0.95)
  const table = requiredSpecValue(
    OFFICE_SEATING.find((i) => i.id === 'meeting-table'),
    'meeting table'
  )
  add('discussion-cup-left', 'ceramic-mug', mug(0xeee1c7, true), [
    table.position[0] - 0.2,
    table.position[1] - 0.11,
    tableTop
  ])
  add('discussion-cup-right', 'ceramic-mug', mug(0xe8dbc0, true), [
    table.position[0] + 0.23,
    table.position[1] - 0.04,
    tableTop
  ])
  plant(
    'discussion-table-plant',
    [table.position[0] + 0.07, table.position[1] + 0.2, tableTop],
    0.9
  )
  block(
    'discussion-table-book',
    [0.22, 0.15, 0.035],
    [table.position[0] - 0.19, table.position[1] + 0.08, tableTop + 0.0175],
    0xd8c595,
    'plain',
    0.003
  )
  // A separate low console behind the left chair position, visible in the source.
  add(
    'discussion-side-bookcase',
    'low-bookcase',
    catalogAsset('low-bookcase'),
    [west + 0.17, 0.83, floor],
    90,
    [0.72, 0.72, 0.72]
  )
}

import { requiredSpecValue } from '../assets/specification'
import { wallClock } from '../assets/clock'
import discussionPosterUrl from './reference/discussion-poster.svg?url'
import discussionNoteUrl from './reference/discussion-note.svg?url'
import {
  discussionPerfume,
  discussionStorage,
  discussionTree,
  DISCUSSION_CONIFER_SIZES
} from './discussion-details'
import {
  americanoGlass,
  sugarJar,
  handlelessCup
} from '../assets/discussion-tableware'
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
  for (let i = 0; i < 10; i++) {
    block(
      'discussion-board-' + i,
      [0.022, length / 10 - 0.003, height],
      [west + 0.011, start + ((i + 0.5) * length) / 10, floor + height / 2],
      [0xaa8463, 0xb2906c, 0xa67f5d][i % 3],
      'wood',
      0.001
    )
  }
  addPrint(
    c,
    'discussion-print',
    'Better\nAgents\nHappier\nPeople',
    [1.15, 1.5],
    [west + 0.042, 2.46, 2.04],
    90
  )
  c.labels[c.labels.length - 1].artwork = {
    source: discussionPosterUrl,
    resolution: 512,
    corners: [
      [0, 0],
      [767, 0],
      [767, 1007],
      [0, 1007]
    ]
  }
  add(
    'discussion-left-climber',
    'tapered-indoor-tree',
    discussionTree(DISCUSSION_CONIFER_SIZES.floor, 37),
    [west + 0.36, 1.48, floor]
  )
  add(
    'wall-clock',
    'wall-clock',
    wallClock(),
    [-1.83, rear - 0.004, 2.33],
    0,
    [1.35, 1.35, 1.35]
  )
  const consoleX = -0.69,
    consoleWidth = 1.08,
    noteWidth = 0.38
  addPrint(
    c,
    'discussion-note',
    'October 2026 calendar',
    [noteWidth, 0.48],
    [consoleX - consoleWidth / 2 + noteWidth / 2, rear - 0.016, 2.26]
  )
  c.labels[c.labels.length - 1].artwork = {
    source: discussionNoteUrl,
    resolution: 512,
    corners: [
      [0, 0],
      [511, 0],
      [511, 659],
      [0, 659]
    ]
  }
  const top = tableTop + 0.23
  block(
    'discussion-console',
    [consoleWidth, 0.29, 0.035],
    [consoleX, rear - 0.16, top],
    0xb49164,
    'wood',
    0.004
  )
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      block(
        `discussion-console-leg-${x}-${y}`,
        [0.033, 0.033, top - floor - 0.0175],
        [
          consoleX + x * 0.49,
          rear - 0.16 + y * 0.102,
          (floor + top - 0.0175) / 2
        ],
        0x705739,
        'wood',
        0.002
      )
    }
  }
  plant('discussion-console-plant', [-1.02, rear - 0.16, top + 0.0175], 0.95, {
    color: 0x956e47,
    form: 'lanceolate'
  })
  add('discussion-console-perfume', 'perfume-bottle', discussionPerfume(), [
    -0.65,
    rear - 0.18,
    top + 0.0175
  ])
  add(
    'discussion-rear-climber',
    'tapered-indoor-tree',
    discussionTree(DISCUSSION_CONIFER_SIZES.console, 71),
    [-0.43, rear - 0.16, top + 0.0175],
    0
  )
  const table = requiredSpecValue(
    OFFICE_SEATING.find((i) => i.id === 'meeting-table'),
    'meeting table'
  )
  add('discussion-americano', 'americano-glass', americanoGlass(), [
    table.position[0] + 0.02,
    table.position[1] - 0.06,
    tableTop
  ])
  add('discussion-sugar', 'sugar-jar', sugarJar(), [
    table.position[0] - 0.015,
    table.position[1] - 0.18,
    tableTop
  ])
  add('discussion-cup-right', 'handleless-cup', handlelessCup(), [
    table.position[0] + 0.27,
    table.position[1] + 0.01,
    tableTop
  ])
  plant(
    'discussion-table-plant',
    [table.position[0] + 0.12, table.position[1] + 0.22, tableTop],
    0.9,
    { color: 0x42372d, form: 'lanceolate' }
  )
  block(
    'discussion-table-book',
    [0.15, 0.22, 0.035],
    [table.position[0] - 0.16, table.position[1] + 0.06, tableTop + 0.0175],
    0xd8c595,
    'plain',
    0.003
  )
  // Source low storage is distinct from the high rear console.
  add(
    'discussion-left-storage',
    'open-storage-bench',
    discussionStorage(false),
    [west + 0.19, 2.16, floor],
    90
  )
  add(
    'discussion-right-cabinet',
    'closed-low-cabinet',
    discussionStorage(true),
    [p.pantryX - 0.08 - 0.29, 1.98, floor],
    0
  )
  plant(
    'discussion-cabinet-plant',
    [p.pantryX - 0.08 - 0.29, 1.98, floor + 0.55],
    0.85,
    { color: 0x9e8c68, form: 'rosette' }
  )
  plant(
    'discussion-right-floor-plant',
    [p.pantryX - 0.08 - 0.52, 1.61, floor],
    1.1,
    { color: 0x42372d, form: 'lanceolate' }
  )
}

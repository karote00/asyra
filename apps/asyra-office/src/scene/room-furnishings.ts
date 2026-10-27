import { requiredSpecValue } from '../assets/specification'
import { addLoungeFurnishings } from './lounge-furnishings'
import { addPantryFurnishings } from './pantry-furnishings'
import { lowStool } from '../assets/low-stool'
import { addDiscussionFurnishings } from './discussion-furnishings'
import { addPrint, addRug, meshBounds } from './room-furnishing-helpers'
import { ellipsoid, type Vec } from '../assets/geometry'
import { catalogAsset, part } from '../assets/catalog'
import { laptop, mug } from '../assets/desk-items'
import type { OfficeComposer } from './office-interior'
import { OFFICE_FLOORS, OFFICE_SHELL } from './office-layout'
import { OFFICE_SEATING } from './office-seating'

export function addWorkFurnishings(c: OfficeComposer, deskTop: number) {
  const { add, block, plant } = c,
    floor = OFFICE_FLOORS.work
  const desk = requiredSpecValue(
    OFFICE_SEATING.find((i) => i.id === 'desk'),
    'desk'
  )
  const computer = laptop(),
    computerBounds = meshBounds(computer)
  // Source lid/front-desk-edge ratio: 41 / 89; preserve the laptop's authored aspect.
  const computerScale = (1.2 * desk.scale[0] * (41 / 89)) / 0.3
  const computerPosition: Vec = [
    desk.position[0] - 0.03,
    desk.position[1],
    deskTop - computerBounds[2][0] * computerScale
  ]
  add('work-laptop', 'laptop', computer, computerPosition, 180, [
    computerScale,
    computerScale,
    computerScale
  ])
  add(
    'work-mouse',
    'mouse',
    [part('body', ellipsoid([0.047, 0.065, 0.027], 20, 12), 0x434747, 'plain')],
    [desk.position[0] + 0.43, desk.position[1] - 0.04, deskTop + 0.027]
  )
  add('work-desk-cup', 'ceramic-mug', mug(0x424e44, true), [
    desk.position[0] - 0.45,
    desk.position[1] + 0.09,
    deskTop
  ])
  addRug(c, 'work-rug', [1.55, 1.08, 0.012], [-0.99, -1.45, floor], 0x708775)
  add(
    'work-stool',
    'square-low-stool',
    lowStool(),
    [-0.35, -0.1, floor],
    0,
    [1.15, 1.15, 1.15]
  )
  plant('work-floor-plant', [-2.68, -1.36, floor], 1.3, {
    color: 0x956a48,
    form: 'rosette'
  })
  const wallX = OFFICE_SHELL.westX + OFFICE_SHELL.exteriorThickness / 2
  addPrint(
    c,
    'work-print',
    'A\nBrighter\nDay',
    [0.54, 0.74],
    [wallX + 0.017, -1.56, 2.05],
    90
  )
  for (const [level, z] of [
    ['lower', 1.43],
    ['middle', 1.76],
    ['upper', 2.04]
  ] as const) {
    add(
      'work-shelf-' + level,
      'wall-shelf-plank',
      catalogAsset('wall-shelf-plank'),
      [wallX + 0.002, -0.41, z],
      90,
      [1.22, 1.22, 1.22]
    )
    if (level === 'lower') {
      for (let i = 0; i < 5; i++)
        block(
          'work-book-' + i,
          [0.14, 0.038, 0.19],
          [wallX + 0.1, -0.64 + i * 0.045, z + 0.0427 + 0.095],
          [0x365b72, 0x77999c, 0xe9d9b5, 0x927257, 0x42675c][i],
          'plain',
          0.001
        )
    } else {
      plant('work-shelf-plant-' + level, [wallX + 0.11, -0.59, z + 0.0427], 1.0)
      plant(
        'work-shelf-plant-' + level + '-right',
        [wallX + 0.11, -0.23, z + 0.0427],
        0.85
      )
    }
  }
  const tableZ = floor + 0.57
  block(
    'work-side-table-top',
    [0.45, 0.32, 0.032],
    [-0.87, -0.04, tableZ],
    0xbb946b,
    'wood',
    0.007
  )
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      block(
        `work-side-table-leg-${x}-${y}`,
        [0.028, 0.028, 0.554],
        [-0.87 + x * 0.188, -0.04 + y * 0.124, floor + 0.277],
        0x584c39,
        'wood',
        0.003
      )
  plant('work-side-plant', [-0.82, -0.04, tableZ + 0.016], 1.25)
  block(
    'work-side-book',
    [0.19, 0.13, 0.023],
    [-1, -0.1, tableZ + 0.0275],
    0xe3d5b9,
    'plain',
    0.002
  )
}

export function composeRoomFurnishings(
  c: OfficeComposer,
  tableTops: ReadonlyMap<string, number>
) {
  addWorkFurnishings(c, requiredSpecValue(tableTops.get('desk'), 'desk top'))
  addDiscussionFurnishings(
    c,
    requiredSpecValue(tableTops.get('meeting-table'), 'meeting-table top')
  )
  addPantryFurnishings(c)
  addLoungeFurnishings(
    c,
    requiredSpecValue(
      tableTops.get('lounge-coffee-table'),
      'lounge-coffee-table top'
    )
  )
}

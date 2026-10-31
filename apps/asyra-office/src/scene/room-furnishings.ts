import workPosterUrl from './reference/work-poster.svg?url'
import { requiredSpecValue } from '../assets/specification'
import { addLoungeFurnishings } from './lounge-furnishings'
import { addPantryFurnishings } from './pantry-furnishings'
import { lowStool } from '../assets/low-stool'
import { addDiscussionFurnishings } from './discussion-furnishings'
import { addPrint, addRug, meshBounds } from './room-furnishing-helpers'
import { ellipsoid, type Vec } from '../assets/geometry'
import { catalogAsset, part } from '../assets/catalog'
import { planter } from '../assets/plants'
import { shelfBotanical } from '../assets/shelf-botanical'
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
  addRug(c, 'work-rug', [1.55, 1.08, 0.012], [-0.99, -1.2, floor], 0x708775)
  add(
    'work-stool',
    'square-low-stool',
    lowStool(),
    [-0.35, 0.4, floor],
    0,
    [1.15, 1.15, 1.15]
  )
  add(
    'work-floor-plant',
    'planter',
    planter(1, 0xa4714e, 606, 'broadleaf-square'),
    [-2.68, -1.11, floor]
  )
  const wallX = OFFICE_SHELL.westX + OFFICE_SHELL.exteriorThickness / 2
  addPrint(
    c,
    'work-print',
    'A\nBrighter\nDay',
    [0.54, 0.74],
    [wallX + 0.017, -1.31, 2.05],
    90
  )
  c.labels[c.labels.length - 1].artwork = {
    source: workPosterUrl,
    resolution: 512,
    corners: [
      [0, 0],
      [767, 0],
      [767, 1007],
      [0, 1007]
    ]
  }
  for (const [level, z] of [
    ['lower', 1.43],
    ['middle', 1.76],
    ['upper', 2.04]
  ] as const) {
    add(
      'work-shelf-' + level,
      'wall-shelf-plank',
      catalogAsset('wall-shelf-plank'),
      [wallX + 0.002, 0.09, z],
      90,
      [1.22, 1.22, 1.22]
    )
    if (level === 'lower') {
      // The reference row has independently sized spines, not repeated blocks.
      const books = [
        [0.06, 0.24, 0x456e86],
        [0.035, 0.22, 0xe6d5b9],
        [0.06, 0.25, 0x315579],
        [0.07, 0.19, 0xb6aa96],
        [0.045, 0.23, 0x6b797e],
        [0.05, 0.28, 0x243a38],
        [0.07, 0.26, 0x395c53]
      ]
      let edge = -0.19
      books.forEach(([width, height, color], i) => {
        block(
          'work-book-' + i,
          [0.14, width, height],
          [wallX + 0.1, edge + width / 2, z + 0.0427 + height / 2],
          color,
          'plain',
          0.001
        )
        edge += width + 0.012
      })
    } else {
      const upper = level === 'upper'
      const pots = upper
        ? ([
            {
              suffix: '',
              y: -0.1,
              scale: 1,
              color: 0xeee5d7,
              seed: 701,
              form: 'fittonia'
            },
            {
              suffix: '-right',
              y: 0.25,
              scale: 1.1,
              color: 0x9b6543,
              seed: 702,
              form: 'snake'
            }
          ] as const)
        : ([
            {
              suffix: '',
              y: -0.14,
              scale: 1,
              color: 0xeee5d7,
              seed: 703,
              form: 'succulent'
            },
            {
              suffix: '-centre',
              y: 0.09,
              scale: 0.95,
              color: 0x9b6543,
              seed: 704,
              form: 'succulent'
            },
            {
              suffix: '-right',
              y: 0.31,
              scale: 1.05,
              color: 0xeee5d7,
              seed: 705,
              form: 'succulent'
            }
          ] as const)
      for (const pot of pots) {
        add(
          'work-shelf-plant-' + level + pot.suffix,
          'planter',
          shelfBotanical(pot.form, pot.color, pot.scale, pot.seed),
          [wallX + 0.15, pot.y, z + 0.0427]
        )
      }
    }
  }
  const tableZ = floor + 0.57
  block(
    'work-side-table-top',
    [0.45, 0.32, 0.032],
    [-0.87, 0.46, tableZ],
    0xbb946b,
    'wood',
    0.007
  )
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      block(
        `work-side-table-leg-${x}-${y}`,
        [0.028, 0.028, 0.554],
        [-0.87 + x * 0.188, 0.46 + y * 0.124, floor + 0.277],
        0x584c39,
        'wood',
        0.003
      )
    }
  }
  plant('work-side-plant', [-0.82, 0.46, tableZ + 0.016], 1.25, {
    color: 0xeee5d7,
    form: 'stemmed'
  })
  // The notebook belongs to the rear work surface, left of the small plant table.
  const returnLeft = wallX + 0.025,
    returnRight = -0.87 - 0.45 / 2 - 0.025,
    returnWidth = returnRight - returnLeft,
    returnX = (returnLeft + returnRight) / 2,
    returnY = 0.46,
    returnDepth = 0.32,
    returnThickness = 0.032,
    legHeight = deskTop - floor - returnThickness
  block(
    'work-return-top',
    [returnWidth, returnDepth, returnThickness],
    [returnX, returnY, deskTop - returnThickness / 2],
    0xbb946b,
    'wood',
    0.007
  )
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      block(
        `work-return-leg-${x}-${y}`,
        [0.032, 0.032, legHeight],
        [
          returnX + x * (returnWidth / 2 - 0.04),
          returnY + y * (returnDepth / 2 - 0.04),
          floor + legHeight / 2
        ],
        0x393831,
        'plain',
        0.003
      )
    }
  }
  plant('work-return-plant', [returnLeft + 0.14, returnY, deskTop], 0.8, {
    color: 0x8d6849,
    form: 'rosette'
  })
  block(
    'work-notebook',
    [0.24, 0.16, 0.023],
    [returnRight - 0.18, returnY - 0.025, deskTop + 0.0115],
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

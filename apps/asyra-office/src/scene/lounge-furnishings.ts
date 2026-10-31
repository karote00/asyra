import { requiredSpecValue } from '../assets/specification'
import referenceUrl from '../../../../assets/asyra-office/models/architecture/review/approved-office-reference.jpg?url'
import { part } from '../assets/catalog'
import { cylinder } from '../assets/geometry'
import { mug } from '../assets/desk-items'
import { wallSconce } from '../assets/wall-sconce'
import { OFFICE_FIT, OFFICE_FLOORS } from './office-layout'
import { OFFICE_SEATING } from './office-seating'
import { addPrint, addRug } from './room-furnishing-helpers'
import type { OfficeComposer } from './office-interior'

/** Regular furnishings only; the sofa and armchair require separate Blender review. */
export function addLoungeFurnishings(c: OfficeComposer, top: number) {
  const { add, block, plant, labels } = c,
    floor = OFFICE_FLOORS.lounge,
    p = OFFICE_FIT.parameters,
    west = p.loungeX + 0.07,
    rear = p.loungeY - 0.07
  const table = requiredSpecValue(
    OFFICE_SEATING.find((i) => i.id === 'lounge-coffee-table'),
    'lounge table'
  )
  addRug(c, 'lounge-rug', [2.05, 1.7, 0.012], [1.58, -1.01, floor], 0x89848b)
  add('lounge-table-mug', 'ceramic-mug', mug(), [
    table.position[0] - 0.22,
    table.position[1] - 0.16,
    top
  ])
  plant(
    'lounge-table-plant',
    [table.position[0] - 0.15, table.position[1] + 0.08, top],
    1,
    { color: 0x9dabae, form: 'rosette' }
  )
  block(
    'lounge-table-book',
    [0.24, 0.17, 0.035],
    [table.position[0] + 0.19, table.position[1] - 0.03, top + 0.0175],
    0x9ca5b1,
    'plain',
    0.003
  )
  // Low side table follows the left return, with a visible lower shelf.
  const x = west + 0.16,
    y = -1.73,
    consoleTop = floor + 0.43
  block(
    'lounge-console-top',
    [0.28, 0.67, 0.025],
    [x, y, consoleTop - 0.0125],
    0xb48e63,
    'wood',
    0.005
  )
  block(
    'lounge-console-shelf',
    [0.23, 0.6, 0.018],
    [x, y, floor + 0.14],
    0xaa8159,
    'wood',
    0.003
  )
  for (const a of [-1, 1]) {
    for (const b of [-1, 1]) {
      block(
        `lounge-console-leg-${a}-${b}`,
        [0.025, 0.025, 0.405],
        [x + a * 0.115, y + b * 0.3, floor + 0.2025],
        0x8a6846,
        'wood',
        0.002
      )
    }
  }
  plant('lounge-console-plant', [x, y + 0.13, consoleTop], 0.9)
  plant('lounge-console-lower-plant', [x, y - 0.17, floor + 0.149], 0.65)
  addPrint(c, 'lounge-side-print', '', [0.57, 0.4], [west + 0.017, y, 0.91], 90)
  labels[labels.length - 1].artwork = {
    source: referenceUrl,
    corners: [
      [598, 451],
      [620, 441],
      [620, 466],
      [598, 478]
    ]
  }
  // These small printed photographs are source artwork, not scene backdrops.
  for (const [i, x, z, sx, sy] of [
    [0, 0.99, 1.25, 726, 384],
    [1, 1.7, 1.26, 772, 394],
    [2, 1.97, 1.43, 792, 392],
    [3, 1.97, 1.17, 792, 413],
    [4, 2.25, 1.36, 811, 405],
    [5, 2.25, 1.1, 812, 426]
  ] as const) {
    addPrint(c, 'lounge-photo-' + i, '', [0.15, 0.19], [x, rear - 0.017, z])
    labels[labels.length - 1].artwork = {
      source: referenceUrl,
      corners: [
        [sx, sy - 4],
        [sx + 8, sy],
        [sx + 8, sy + 11],
        [sx, sy + 7]
      ]
    }
    block(
      'lounge-photo-clip-' + i,
      [0.018, 0.018, 0.045],
      [x, rear - 0.04, z + 0.105],
      0x7a765d,
      'metal',
      0.002
    )
  }
  labels.push({
    text: 'Same\nCurious\nBraver\nTogether',
    kind: 'lettering',
    width: 0.43,
    height: 0.65,
    position: [2.63, rear - 0.005, 1.4],
    rotation: 0,
    color: '#62513f',
    background: 'transparent'
  })
  // A floor-mounted stem and catalog shade recreate the source's curved lamp head.
  const lampX = west + 0.22,
    lampY = rear - 0.025,
    lampZ = 1.24
  add(
    'lounge-sconce',
    'wall-sconce',
    wallSconce(),
    [lampX, lampY, lampZ],
    0,
    [1.15, 1.15, 1.15]
  )
  add(
    'lounge-lamp-stem',
    'lamp-stem',
    [part('stem', cylinder(0.009, lampZ - floor + 0.16), 0x65503d, 'metal')],
    [lampX, lampY - 0.012, (floor + lampZ + 0.16) / 2]
  )
  plant('lounge-floor-plant', [west + 0.25, -0.02, floor], 1.85, {
    color: 0x3d3a32,
    form: 'rosette'
  })
}

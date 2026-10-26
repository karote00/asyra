import accents from '../../../../assets/asyra-office/models/wall-accents/wall-accents-model-spec.json'
import { catalogAsset, part, placeParts } from '../assets/catalog'
import {
  bezier,
  cylinder,
  ellipsoid,
  lathe,
  tube,
  type Vec
} from '../assets/geometry'
import { OFFICE_FIT, OFFICE_FLOORS, referencePoint } from './office-layout'
import { requiredSpecValue } from '../assets/specification'
import type { OfficeComposer } from './office-interior'

/** Mount the catalog-defined fixture without changing scene lighting. */
function addSconce({ add }: OfficeComposer) {
  const spec = requiredSpecValue(
    accents.modules.find((m) => m.moduleId === 'wall-sconce'),
    'sconce'
  )
  const shadePart = requiredSpecValue(
    spec.components.find((c) => c.partId === 'shade'),
    'shade'
  )
  if (!('profileRZ' in shadePart)) throw new Error('Missing shade profile')
  const shade = requiredSpecValue(shadePart.profileRZ, 'shade profile')
  const path: Vec[] = bezier(
    [
      [0, -0.01, 0.15],
      [0, -0.034, 0.15],
      [0, -0.04, 0.167],
      [0, -0.04, 0.185]
    ],
    24
  )
  for (let i = 1; i <= 48; i++) {
    const t = (i * Math.PI) / 48
    path.push([0, -0.1 + 0.06 * Math.cos(t), 0.185 + 0.06 * Math.sin(t)])
  }
  path.push([0, -0.16, 0.145])
  const plate = cylinder(0.05, 0.012, 0.05, 48)
  for (let i = 0; i < plate.positions.length; i += 3) {
    const y = plate.positions[i + 1],
      z = plate.positions[i + 2]
    plate.positions[i + 1] = -z - 0.006
    plate.positions[i + 2] = y + 0.14
  }
  const pieces = [
    part('wall-plate', plate, 0x70543a, 'metal'),
    part('arm', tube(path, 0.005, 16), 0x70543a, 'metal'),
    ...placeParts(
      [part('neck', cylinder(0.022, 0.035, 0.022, 32), 0xbd9254, 'metal')],
      [0, -0.16, 0.1325]
    ),
    ...placeParts(
      [part('shade', lathe([...shade, shade[0]], 64), 0xd7b16c, 'metal')],
      [0, -0.16, 0]
    ),
    ...placeParts(
      [
        part(
          'bulb',
          ellipsoid([0.0275, 0.0275, 0.0275], 24, 16),
          0xfff0c5,
          'ceramic'
        )
      ],
      [0, -0.16, 0.0275]
    ),
    ...placeParts(
      [part('bulb-stem', cylinder(0.012, 0.075), 0xfff0c5, 'ceramic')],
      [0, -0.16, 0.0825]
    )
  ]
  add(
    'lounge-sconce',
    'wall-sconce',
    pieces,
    referencePoint([694, 389], 1, OFFICE_FIT.parameters.loungeY - 0.07),
    0,
    [1, 1, 1]
  )
}

export function addInteriorDetails(composer: OfficeComposer) {
  const { add, block, plant, label } = composer
  const p = OFFICE_FIT.parameters,
    f = OFFICE_FLOORS
  const panelLength = p.rearY - p.discussionFront,
    panelHeight = p.rearTop - f.discussion - 0.08
  for (let i = 0; i < 9; i++)
    block(
      `discussion-panel-${i}`,
      [0.026, panelLength / 9 - 0.003, panelHeight],
      [
        -2.927,
        p.discussionFront + ((i + 0.5) * panelLength) / 9,
        f.discussion + panelHeight / 2
      ],
      [0xb29270, 0xb99a76, 0xac8c67][i % 3],
      'wood',
      0.002
    )
  block(
    'discussion-wood-cornice',
    [0.09, panelLength, 0.06],
    [-2.895, (p.discussionFront + p.rearY) / 2, p.rearTop - 0.08],
    0x9b7854,
    'wood'
  )
  const console = referencePoint([700, 216], 1, p.rearY - 0.24)
  block('discussion-console', [0.92, 0.28, 0.045], console, 0xc7a376, 'wood')
  for (const side of [-1, 1])
    block(
      `discussion-console-leg-${side}`,
      [0.045, 0.045, console[2] - 0.0225 - f.discussion],
      [
        console[0] + side * 0.37,
        console[1],
        (console[2] - 0.0225 + f.discussion) / 2
      ],
      0x9b7854,
      'wood'
    )
  plant(
    'discussion-console-plant',
    [console[0], console[1], console[2] + 0.0225],
    0.7
  )
  label(
    'A little\nprogress\nevery day',
    0.25,
    0.32,
    referencePoint([692, 166], 1, p.rearY - 0.095),
    '#74624e',
    '#eee4ce'
  )
  for (const [name, pixel] of [
    ['lower', [377, 284]],
    ['upper', [377, 257]]
  ] as const) {
    const pos = referencePoint(pixel, 0, -2.84)
    block('work-shelf-' + name, [0.2, 0.7, 0.035], pos, 0xba9263, 'wood')
    if (name === 'lower')
      for (let i = 0; i < 4; i++)
        block(
          `wall-book-${i}`,
          [0.13, 0.04, 0.18],
          [pos[0] + 0.02, pos[1] - 0.2 + i * 0.055, pos[2] + 0.1075],
          [0x476f85, 0xc4a16c, 0xe6dac2, 0x627d6b][i],
          'plain',
          0.002
        )
    plant(
      'work-shelf-plant-' + name,
      [pos[0] + 0.01, pos[1] + 0.2, pos[2] + 0.0175],
      0.65
    )
    if (name === 'upper')
      plant(
        'work-shelf-plant-top-left',
        [pos[0] + 0.01, pos[1] - 0.18, pos[2] + 0.0175],
        0.75
      )
  }
  const bookcase = referencePoint([619, 498], 2, f.lounge)
  const bookcaseParts = placeParts(
    catalogAsset('low-bookcase'),
    [0, 0, 0],
    90,
    [0.64, 0.64, 0.64]
  )
  add('lounge-bookcase', 'low-bookcase', bookcaseParts, bookcase)
  plant(
    'lounge-bookcase-plant',
    [bookcase[0], bookcase[1], f.lounge + 0.82 * 0.64],
    0.47
  )
  for (let i = 0; i < 5; i++)
    block(
      `lounge-book-${i}`,
      [0.12, 0.032, 0.14],
      [
        bookcase[0],
        bookcase[1] - 0.11 + i * 0.038,
        f.lounge + 0.3095 * 0.64 + 0.07
      ],
      [0x627d6b, 0xc4a16c, 0x476f85][i % 3],
      'plain',
      0.002
    )
  const workCase = referencePoint([519, 363], 2, f.work)
  const workCaseParts = placeParts(
    catalogAsset('low-bookcase'),
    [0, 0, 0],
    90,
    [0.55, 0.55, 0.55]
  )
  const caseRear = Math.max(
    ...workCaseParts.flatMap((piece) =>
      piece.mesh.positions.filter((_, i) => i % 3 === 1)
    )
  )
  workCase[1] = Math.min(workCase[1], p.creamY - 0.08 - caseRear)
  add('bookcase', 'low-bookcase', workCaseParts, workCase)
  plant(
    'bookcase-plant',
    [workCase[0], workCase[1], f.work + 0.82 * 0.55],
    0.55
  )
  addSconce(composer)
}

import { frameNightLight } from '../assets/frame-night-light'
import {
  pantryShelfPlant,
  pantrySmallShelfPlant,
  pantryShelfSucculent
} from '../assets/pantry-shelf-plant'
import { dishTray, soapPump, utensilPair } from '../assets/pantry-accessories'
import { ellipsoid } from '../assets/geometry'
import { catalogAsset, part } from '../assets/catalog'
import { mug } from '../assets/desk-items'
import { pantryVessel, pantryCounterBottle } from '../assets/pantry-vessels'
import { OFFICE_FLOORS, OFFICE_FIT } from './office-layout'
import { addPrint } from './room-furnishing-helpers'
import type { OfficeComposer } from './office-interior'

/** Original pantry: fridge/dispenser on the west wall; counter on the north wall. */
export function addPantryFurnishings(c: OfficeComposer) {
  const { add, block, plant } = c,
    p = OFFICE_FIT.parameters
  const floor = OFFICE_FLOORS.pantry,
    rear = p.rearY - 0.08
  const left = p.pantryX + 0.08,
    end = 1.9,
    count = 18,
    stripe = (end - left) / count
  for (let i = 0; i < count; i++)
    block(
      'pantry-wallpaper-' + i,
      [stripe, 0.004, p.pantryTop - floor - 0.025],
      [
        left + (i + 0.5) * stripe,
        rear - 0.003,
        (p.pantryTop + floor - 0.025) / 2
      ],
      i % 2 === 0 ? 0xb6aa70 : 0x687f71,
      'plain',
      0
    )
  addPrint(
    c,
    'pantry-print',
    'Good\nCoffee\nBetter\nIdeas\n☕',
    [0.59, 0.91],
    [2.42, rear - 0.018, 2.13]
  )
  const counterDepth = 0.5 * 1.25,
    fridgeScale = 1.35,
    fridgeY = rear - counterDepth - 0.02 - 0.26 * fridgeScale,
    fridgeShift = fridgeY - 1.7,
    fridgeX = left + 0.26 * fridgeScale + 0.012
  add(
    'fridge',
    'pantry-fridge',
    catalogAsset('pantry-fridge').map((part) =>
      ['cabinet', 'lower-door', 'upper-door'].includes(part.id)
        ? { ...part, color: 0xb8bbc3 }
        : part
    ),
    [fridgeX, fridgeY, floor],
    90,
    [fridgeScale, fridgeScale, fridgeScale]
  )
  add(
    'water-dispenser',
    'water-dispenser',
    catalogAsset('water-dispenser'),
    [left + 0.17 * 0.95 + 0.012, 1.07, floor],
    90,
    [0.95, 0.95, 0.95]
  )
  plant(
    'pantry-fridge-plant',
    [fridgeX, 1.51 + fridgeShift, floor + 1.15 * fridgeScale],
    1.35,
    { color: 0x956a48, form: 'shrub' }
  )
  add('pantry-fridge-night-light', 'frame-night-light', frameNightLight(), [
    fridgeX,
    1.84 + fridgeShift,
    floor + 1.15 * fridgeScale
  ])
  // Thin removable papers lie on the existing front face; the door geometry is unchanged.
  for (const [i, y, z, color] of [
    [0, 1.78, 1.58, 0x77999c],
    [1, 1.77, 1.48, 0xe9d9b5],
    [2, 1.64, 1.41, 0x927257]
  ] as const)
    block(
      'pantry-fridge-note-' + i,
      [0.003, 0.065, 0.082],
      [fridgeX + 0.26 * fridgeScale + 0.0015, y + fridgeShift, z],
      color,
      'plain',
      0
    )
  add(
    'pantry-fridge-magnet',
    'round-magnet',
    [
      part('magnet', ellipsoid([0.003, 0.023, 0.023], 16, 8), 0x434747, 'plain')
    ],
    [fridgeX + 0.26 * fridgeScale + 0.003, 1.51 + fridgeShift, 1.67]
  )
  const counterTop = floor + 0.8,
    counterRight = 1.77,
    counterWidth = counterRight - left,
    counterX = (left + counterRight) / 2,
    counterFront = rear - counterDepth,
    counterBodyWidth = counterWidth - 0.04
  block(
    'coffee-counter-body',
    [counterBodyWidth, counterDepth - 0.04, 0.745],
    [counterX, rear - counterDepth / 2, floor + 0.3975],
    0xb38e60,
    'wood',
    0.009
  )
  block(
    'coffee-counter-plinth',
    [counterBodyWidth - 0.06, counterDepth - 0.12, 0.05],
    [counterX, rear - counterDepth / 2 + 0.02, floor + 0.025],
    0x65523d,
    'wood',
    0.002
  )
  block(
    'coffee-counter-top',
    [counterWidth, counterDepth, 0.035],
    [counterX, rear - counterDepth / 2, counterTop - 0.0175],
    0xc7a575,
    'wood',
    0.008
  )
  for (const side of [-1, 1]) {
    block(
      'coffee-counter-door-' + side,
      [counterBodyWidth / 2 - 0.012, 0.022, 0.68],
      [
        counterX + (side * counterBodyWidth) / 4,
        counterFront + 0.009,
        floor + 0.4
      ],
      0xb99160,
      'wood',
      0.004
    )
    block(
      'coffee-counter-handle-' + side,
      [0.016, 0.025, 0.075],
      [counterX + side * 0.041, counterFront - 0.015, floor + 0.61],
      0x6c6352,
      'metal',
      0.003
    )
  }
  add(
    'sink',
    'sink-cabinet',
    catalogAsset('sink-cabinet').map((part) => {
      if (part.id === 'countertop')
        return {
          ...part,
          color: 0xc7a575,
          material: 'wood' as const,
          roughness: 0.85
        }
      if (part.id === 'door--1') return { ...part, color: 0x65594d }
      return part
    }),
    [2.34, rear - 0.3125, floor],
    0,
    [1.25, 1.25, 1.25]
  )
  plant('pantry-preparation-plant', [0.99, rear - 0.15, counterTop], 1.25, {
    color: 0x65523d,
    form: 'lanceolate'
  })
  add(
    'pantry-counter-mug',
    'ceramic-mug',
    mug(),
    [1.25, rear - 0.16, counterTop],
    0,
    [2.4, 2.4, 2.4]
  )
  add('pantry-dish-tray', 'dish-tray', dishTray(), [
    1.46,
    rear - 0.43,
    counterTop
  ])
  add('pantry-counter-bottle', 'counter-green-bottle', pantryCounterBottle(), [
    1.51,
    rear - 0.08,
    counterTop
  ])
  const shelfWidth = 2 - left
  block(
    'pantry-shelf',
    [shelfWidth, 0.24, 0.033],
    [(left + 2) / 2, rear - 0.125, 1.96],
    0xc3a06c,
    'wood',
    0.005
  )
  for (const [i, fraction, vessel] of [
    [0, 0.18, 'shelf-spice-jar'],
    [1, 0.33, 'shelf-cream-jar'],
    [2, 0.51, 'shelf-sage-jar'],
    [3, 0.67, 'shelf-brown-jar'],
    [4, 0.8, 'shelf-amber-jar']
  ] as const)
    add(
      'pantry-canister-' + i,
      vessel,
      vessel === 'shelf-spice-jar'
        ? pantrySmallShelfPlant()
        : pantryVessel(vessel),
      [left + fraction * shelfWidth, rear - 0.14, 1.9765]
    )
  add('pantry-canister-5', 'shelf-succulent', pantryShelfSucculent(), [
    left + 0.92 * shelfWidth,
    rear - 0.14,
    1.9765
  ])
  add('pantry-shelf-plant', 'plant-shrub', pantryShelfPlant(), [
    left + 0.06 * shelfWidth,
    rear - 0.12,
    1.9765
  ])
  plant('pantry-sink-plant', [2.79, rear - 0.18, counterTop], 1.15, {
    color: 0xe8dbc3,
    form: 'lanceolate'
  })
  add(
    'pantry-sink-mug',
    'ceramic-mug',
    mug(),
    [2.73, rear - 0.49, counterTop],
    0,
    [1.1, 1.1, 1.1]
  )
  add('pantry-sink-utensils', 'utensil-pair', utensilPair(), [
    2.73,
    rear - 0.49,
    counterTop
  ])
  add('pantry-soap-pump', 'soap-pump', soapPump(), [
    2.52,
    rear - 0.075,
    counterTop
  ])
  add(
    'pantry-floor-jar',
    'porcelain-floor-jar',
    pantryVessel('porcelain-floor-jar'),
    [3.02, rear - 0.66, floor]
  )
  add(
    'pantry-dark-cup',
    'ceramic-mug',
    mug(0x424e44),
    [1.84, rear - 0.13, counterTop],
    0,
    [1.1, 1.1, 1.1]
  )
}

import layout from './reference/pantry-layout.json'
import {
  COUNTERTOP_REFERENCE,
  pantryPitcher,
  pantryTumbler,
  pantryBrush,
  pantryCounterPlant
} from '../assets/pantry-counterware'
import { frameNightLight } from '../assets/frame-night-light'
import {
  pantryShelfPlant,
  pantrySmallShelfPlant,
  pantryShelfSucculent
} from '../assets/pantry-shelf-plant'
import { ellipsoid } from '../assets/geometry'
import { catalogAsset, part } from '../assets/catalog'
import { mug } from '../assets/desk-items'
import { pantryVessel, pantryCounterBottle } from '../assets/pantry-vessels'
import { OFFICE_FLOORS, OFFICE_FIT } from './office-layout'
import { addPrint, meshBounds } from './room-furnishing-helpers'
import type { OfficeComposer } from './office-interior'

/** Owner-approved pantry layout; retained catalog assets keep their geometry. */
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
  const counterDepth = layout.preparation.d,
    fridgeScale = 1.35,
    fridgeY = layout.fridge.y + 0.297 * fridgeScale,
    fridgeX = layout.fridge.x + layout.fridge.w / 2
  add(
    'fridge',
    'pantry-fridge',
    catalogAsset('pantry-fridge').map((part) =>
      ['cabinet', 'lower-door', 'upper-door'].includes(part.id)
        ? { ...part, color: 0xb8bbc3 }
        : part
    ),
    [fridgeX, fridgeY, floor],
    0,
    [fridgeScale, fridgeScale, fridgeScale]
  )
  add(
    'water-dispenser',
    'water-dispenser',
    catalogAsset('water-dispenser'),
    [
      layout.dispenser.x + 0.17 * 0.95,
      layout.dispenser.y + layout.dispenser.d / 2,
      floor
    ],
    90,
    [0.95, 0.95, 0.95]
  )
  plant(
    'pantry-fridge-plant',
    [fridgeX - 0.19, fridgeY, floor + 1.15 * fridgeScale],
    1.35,
    { color: 0x956a48, form: 'shrub' }
  )
  add('pantry-fridge-night-light', 'frame-night-light', frameNightLight(), [
    fridgeX + 0.14,
    fridgeY,
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
      [0.065, 0.003, 0.082],
      [fridgeX + y - 1.7, fridgeY - 0.26 * fridgeScale - 0.0015, z],
      color,
      'plain',
      0
    )
  add(
    'pantry-fridge-magnet',
    'round-magnet',
    [
      part('magnet', ellipsoid([0.023, 0.003, 0.023], 16, 8), 0x434747, 'plain')
    ],
    [fridgeX - 0.19, fridgeY - 0.26 * fridgeScale - 0.003, 1.67]
  )
  const counterTop = floor + 0.8,
    counterWidth = layout.preparation.w,
    counterX = layout.preparation.x + counterWidth / 2,
    counterFront = rear - counterDepth,
    counterBodyWidth = counterWidth - 0.04
  const sinkX = layout.mainSink.x + layout.mainSink.w / 2,
    sinkShift = sinkX - 2.34
  const positions = COUNTERTOP_REFERENCE.placement
  const position = (key: keyof typeof positions): [number, number, number] => [
    positions[key][0] + sinkShift,
    rear - positions[key][1],
    counterTop
  ]
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
  block(
    'coffee-counter-door',
    [counterBodyWidth - 0.012, 0.022, 0.68],
    [counterX, counterFront + 0.009, floor + 0.4],
    0xb99160,
    'wood',
    0.004
  )
  block(
    'coffee-counter-handle',
    [0.016, 0.025, 0.075],
    [
      layout.preparation.x + counterWidth - 0.07,
      counterFront - 0.015,
      floor + 0.61
    ],
    0x6c6352,
    'metal',
    0.003
  )
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
    [sinkX, rear - 0.3125, floor],
    0,
    [1.25, 1.25, 1.25]
  )
  const group = [
    {
      id: 'pantry-preparation-plant',
      asset: 'plant-lanceolate',
      parts: pantryCounterPlant('preparation'),
      footprint: layout.counterObjects.plant
    },
    {
      id: 'pantry-counter-pitcher',
      asset: 'water-pitcher',
      parts: pantryPitcher(),
      footprint: layout.counterObjects.pitcher
    },
    {
      id: 'pantry-counter-tumbler',
      asset: 'insulated-tumbler',
      parts: pantryTumbler(),
      footprint: layout.counterObjects.tumbler
    }
  ]
  for (const item of group) {
    const bounds = meshBounds(item.parts)
    const x = item.footprint.x - bounds[0][0]
    const y = item.footprint.y - bounds[1][0]
    add(item.id, item.asset, item.parts, [x, y, counterTop])
  }
  add('pantry-counter-bottle', 'counter-green-bottle', pantryCounterBottle(), [
    layout.counterBottleCenter[0],
    layout.counterBottleCenter[1],
    counterTop
  ])
  const shelf = layout.shelf
  block(
    'pantry-shelf',
    [shelf.w, shelf.d, 0.033],
    [shelf.x + shelf.w / 2, shelf.y + shelf.d / 2, 1.96],
    0xc3a06c,
    'wood',
    0.005
  )
  const retained = [
    {
      id: 'pantry-shelf-plant',
      asset: 'plant-shrub',
      parts: pantryShelfPlant()
    },
    {
      id: 'pantry-canister-0',
      asset: 'shelf-spice-jar',
      parts: pantrySmallShelfPlant()
    },
    {
      id: 'pantry-canister-2',
      asset: 'shelf-sage-jar',
      parts: pantryVessel('shelf-sage-jar')
    },
    {
      id: 'pantry-canister-3',
      asset: 'shelf-brown-jar',
      parts: pantryVessel('shelf-brown-jar')
    },
    {
      id: 'pantry-canister-5',
      asset: 'shelf-succulent',
      parts: pantryShelfSucculent()
    }
  ]
  let shelfLeft = shelf.x + shelf.endMargin
  for (const item of retained) {
    const bounds = meshBounds(item.parts)
    add(item.id, item.asset, item.parts, [
      shelfLeft - bounds[0][0],
      shelf.y + shelf.d / 2 - (bounds[1][0] + bounds[1][1]) / 2,
      1.9765
    ])
    shelfLeft += bounds[0][1] - bounds[0][0] + shelf.gap
  }
  add(
    'pantry-sink-plant',
    'plant-lanceolate',
    pantryCounterPlant('sink'),
    position('sinkPlant')
  )
  const cup = COUNTERTOP_REFERENCE.sinkCup
  add(
    'pantry-sink-mug',
    'ceramic-mug',
    mug(Number.parseInt(cup.color.slice(1), 16)),
    position('sinkCup'),
    cup.rotationDegrees,
    [cup.uniformScale, cup.uniformScale, cup.uniformScale]
  )
  add('pantry-sink-brush', 'brush', pantryBrush(), position('sinkCup'))
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
    [1.84 + sinkShift, rear - 0.13, counterTop],
    0,
    [1.1, 1.1, 1.1]
  )
}

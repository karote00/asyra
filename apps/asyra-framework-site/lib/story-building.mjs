// One footprint and one projected model are shared by the main and derived views.
// Storeys assemble independently; the ground never changes position.
export const buildingExample = Object.freeze({
  original: 'drawHouse(input)',
  replacement: 'drawTower(input)',
  width: 92,
  depth: 68,
  floorHeight: 22,
  houseFloors: 2,
  towerFloors: 8
})
const clamp = (value) => Math.max(0, Math.min(1, value))
const project = ([x, z, height]) => [
  150 + (x - z) * 0.85,
  199 + (x + z) * 0.38 - height
]
const polygon = (points) =>
  points
    .map((point) =>
      project(point)
        .map((v) => v.toFixed(3))
        .join(',')
    )
    .join(' ')
// Each storey has a local, reversible assembly sequence driven by the shared
// scroll sample: unfold a thick slab, raise walls, then finish glazing.
export function getBuildingGeometry(rise, tower) {
  rise = clamp(rise)
  tower = clamp(tower)
  const smooth = (value) => {
    const t = clamp(value)
    return t * t * (3 - 2 * t)
  }
  const floors = Array.from({ length: 8 }, (_, index) => {
    const progress =
      index < 2
        ? (rise / 0.86) * 2 - index
        : ((tower - 0.08) / 0.84) * 6 - (index - 2)
    return {
      slab: smooth(progress / 0.25),
      wall: smooth((progress - 0.25) / 0.5),
      facade: smooth((progress - 0.75) / 0.25)
    }
  })
  const height = floors.reduce(
    (value, floor, index) =>
      floor.wall > 0 ? Math.max(value, index * 22 + floor.wall * 22) : value,
    0
  )
  const roof = smooth((rise - 0.86) / 0.14) * (1 - smooth(tower / 0.08))
  const crown = smooth((tower - 0.92) / 0.08)
  const parts = []
  const add = (id, points, fill, opacity = 1, stroke = '#244c40') =>
    parts.push({ id, points: polygon(points), fill, opacity, stroke })
  // Paint from the ground upwards. Each slab hides only the volume below it,
  // so its top remains exposed while the next storey's walls are rising.
  for (let floor = 0; floor < 8; floor++) {
    const phase = floors[floor]
    const base = floor * 22
    const top = base + 22 * phase.wall
    const edge = 68 * phase.slab
    const slabOpacity = clamp(phase.slab * 8)
    add(
      `slab-top-${floor}`,
      [
        [-3, -3, base],
        [95, -3, base],
        [95, edge + 3, base],
        [-3, edge + 3, base]
      ],
      '#dce3cd',
      slabOpacity
    )
    add(
      `slab-side-${floor}`,
      [
        [95, -3, base - 2],
        [95, edge + 3, base - 2],
        [95, edge + 3, base],
        [95, -3, base]
      ],
      '#6c8b75',
      slabOpacity
    )
    add(
      `slab-front-${floor}`,
      [
        [-3, edge + 3, base - 2],
        [95, edge + 3, base - 2],
        [95, edge + 3, base],
        [-3, edge + 3, base]
      ],
      '#afc0a6',
      slabOpacity
    )
    // Rear walls and a visible inner partition give the unfinished storey depth.
    add(
      `rear-${floor}`,
      [
        [0, 0, base],
        [92, 0, base],
        [92, 0, top],
        [0, 0, top]
      ],
      '#cad6bd',
      phase.wall
    )
    add(
      `inner-${floor}`,
      [
        [0, 0, base],
        [0, 68, base],
        [0, 68, top],
        [0, 0, top]
      ],
      '#e5e9d8',
      phase.wall
    )
    add(
      `partition-${floor}`,
      [
        [45, 0, base],
        [45, 43, base],
        [45, 43, top - 2 * phase.wall],
        [45, 0, top - 2 * phase.wall]
      ],
      '#becfb7',
      phase.wall
    )
    add(
      floor === 0 ? 'side' : `side-${floor}`,
      [
        [92, 0, base],
        [92, 68, base],
        [92, 68, top],
        [92, 0, top]
      ],
      '#a7bea4',
      phase.wall
    )
    add(
      floor === 0 ? 'front' : `front-${floor}`,
      [
        [0, 68, base],
        [92, 68, base],
        [92, 68, top],
        [0, 68, top]
      ],
      '#f0ebd8',
      phase.wall
    )
    // Window geometry never stretches. Glazing appears only after its wall stands.
    for (const [column, x] of [10, 57].entries()) {
      add(
        `front-window-${floor}-${column}`,
        [
          [x, 68, base + 6],
          [x + 24, 68, base + 6],
          [x + 24, 68, base + 18],
          [x, 68, base + 18]
        ],
        '#507b6b',
        phase.facade
      )
      add(
        `front-pane-${floor}-${column}`,
        [
          [x + 3, 68, base + 8],
          [x + 10, 68, base + 8],
          [x + 10, 68, base + 16],
          [x + 3, 68, base + 16]
        ],
        '#c9dfcf',
        phase.facade,
        'none'
      )
    }
    for (const [column, z] of [9, 41].entries()) {
      add(
        `side-window-${floor}-${column}`,
        [
          [92, z, base + 6],
          [92, z + 19, base + 6],
          [92, z + 19, base + 18],
          [92, z, base + 18]
        ],
        '#335e50',
        phase.facade
      )
      add(
        `side-pane-${floor}-${column}`,
        [
          [92, z + 3, base + 8],
          [92, z + 8, base + 8],
          [92, z + 8, base + 16],
          [92, z + 3, base + 16]
        ],
        '#91b8a5',
        phase.facade,
        'none'
      )
    }
    if (floor === 0) {
      add(
        'door',
        [
          [38, 68, 0],
          [53, 68, 0],
          [53, 68, 19],
          [38, 68, 19]
        ],
        '#244c40',
        phase.facade
      )
      add(
        'door-glass',
        [
          [41, 68, 7],
          [50, 68, 7],
          [50, 68, 17],
          [41, 68, 17]
        ],
        '#b4ceba',
        phase.facade,
        'none'
      )
    }
  }
  const pitch = 22 * roof
  add(
    'roof-gable',
    [
      [0, 68, 44],
      [92, 68, 44],
      [46, 68, 44 + pitch]
    ],
    '#f0ebd8',
    roof
  )
  add(
    'roof-left',
    [
      [-3, -3, 44],
      [46, -3, 44 + pitch],
      [46, 71, 44 + pitch],
      [-3, 71, 44]
    ],
    '#809b72',
    roof
  )
  add(
    'roof-right',
    [
      [46, -3, 44 + pitch],
      [95, -3, 44],
      [95, 71, 44],
      [46, 71, 44 + pitch]
    ],
    '#355c49',
    roof
  )
  add(
    'roof-skylight',
    [
      [57, 18, 44 + pitch * 0.77],
      [77, 18, 44 + pitch * 0.37],
      [77, 37, 44 + pitch * 0.37],
      [57, 37, 44 + pitch * 0.77]
    ],
    '#d8e5cb',
    roof
  )
  add(
    'tower-roof',
    [
      [-3, -3, 176],
      [95, -3, 176],
      [95, 71, 176],
      [-3, 71, 176]
    ],
    '#dce3cd',
    crown
  )
  add(
    'tower-roof-front',
    [
      [-3, 71, 174],
      [95, 71, 174],
      [95, 71, 176],
      [-3, 71, 176]
    ],
    '#afc0a6',
    crown
  )
  add(
    'tower-roof-side',
    [
      [95, -3, 174],
      [95, 71, 174],
      [95, 71, 176],
      [95, -3, 176]
    ],
    '#6c8b75',
    crown
  )
  add(
    'roof-garden',
    [
      [12, 12, 176.4],
      [36, 12, 176.4],
      [36, 49, 176.4],
      [12, 49, 176.4]
    ],
    '#b9cd94',
    crown
  )
  add(
    'roof-core-side',
    [
      [69, 16, 176],
      [69, 34, 176],
      [69, 34, 185],
      [69, 16, 185]
    ],
    '#718f7b',
    crown
  )
  add(
    'roof-core-front',
    [
      [49, 34, 176],
      [69, 34, 176],
      [69, 34, 185],
      [49, 34, 185]
    ],
    '#d4dcc6',
    crown
  )
  add(
    'roof-core-top',
    [
      [49, 16, 185],
      [69, 16, 185],
      [69, 34, 185],
      [49, 34, 185]
    ],
    '#ebeedc',
    crown
  )
  return { height, tower, rise, floors, parts }
}

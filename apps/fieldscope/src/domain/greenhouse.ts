export type Point3 = readonly [number, number, number]

/** Metres; fixed first-stage brief. Assumptions are explicit, not structural ratings. */
export const SITE = Object.freeze({
  bays: 4,
  width: 7,
  length: 50,
  height: 5,
  margin: 0.35,
  eave: 3,
  frameSpacing: 1,
  postSpacing: 5,
  tubeDiameter: 0.048,
  postDiameter: 0.076,
  drainDepth: 0.25,
  barrierHeight: 0.35,
  barrierThickness: 0.02
})
export const BED_WIDTHS = Object.freeze([0.9, 0.3, 1.8, 0.3, 1.8, 0.3, 0.9])
export const CROPS = Object.freeze(['1914 小胡瓜', '玉女小蕃茄'])
export interface Strip {
  bay: number
  kind: 'soil' | 'drain'
  x: number
  width: number
}
export interface Member {
  kind: 'arch' | 'post' | 'purlin' | 'tie' | 'brace' | 'door'
  points: readonly Point3[]
  diameter: number
}

export function roofPoint(bay: number, fraction: number, z: number): Point3 {
  const half = SITE.width / 2
  const rise = SITE.height - SITE.eave
  const radius = (half * half + rise * rise) / (2 * rise)
  const theta = Math.asin(half / radius) * (2 * fraction - 1)
  return [
    bay * SITE.width + half + radius * Math.sin(theta),
    SITE.height - radius + radius * Math.cos(theta),
    z
  ]
}

export function createLayout() {
  const strips: Strip[] = []
  for (let bay = 0; bay < SITE.bays; bay++) {
    let x = bay * SITE.width + SITE.margin
    BED_WIDTHS.forEach((width, index) => {
      strips.push({ bay, kind: index % 2 === 0 ? 'soil' : 'drain', x, width })
      x += width
    })
  }
  const passages = Array.from({ length: SITE.bays - 1 }, (_, i) => ({
    x: (i + 1) * SITE.width - SITE.margin,
    width: 2 * SITE.margin
  }))
  return { strips, passages, totalWidth: SITE.width * SITE.bays }
}

export function createStructure(): Member[] {
  const members: Member[] = []
  const add = (
    kind: Member['kind'],
    points: readonly Point3[],
    diameter: number = SITE.tubeDiameter
  ) => members.push({ kind, points, diameter })
  for (let bay = 0; bay < SITE.bays; bay++) {
    for (let z = 0; z <= SITE.length; z += SITE.frameSpacing)
      add(
        'arch',
        Array.from({ length: 49 }, (_, i) => roofPoint(bay, i / 48, z))
      )
    for (const fraction of [0, 0.25, 0.5, 0.75, 1])
      // Shared shoulders have one longitudinal member, not coincident duplicates.
      if (fraction !== 0 || bay === 0)
        add('purlin', [
          roofPoint(bay, fraction, 0),
          roofPoint(bay, fraction, SITE.length)
        ])
    for (let z = 0; z <= SITE.length; z += SITE.postSpacing) {
      add('tie', [
        [bay * 7, SITE.eave, z],
        [(bay + 1) * 7, SITE.eave, z]
      ])
      for (const fraction of [0.25, 0.75]) {
        const top = roofPoint(bay, fraction, z)
        add('brace', [[bay * 7 + 3.5, SITE.eave, z], top])
      }
    }
    for (const z of [0, SITE.length]) {
      const center = bay * 7 + 3.5
      // Two metre end openings are an explicit assumption, kept clear below 2.5m.
      for (const x of [center - 1, center + 1]) {
        const half = SITE.width / 2,
          rise = SITE.height - SITE.eave
        const radius = (half * half + rise * rise) / (2 * rise)
        add('door', [
          [x, 0, z],
          [x, SITE.height - radius + Math.sqrt(radius ** 2 - 1), z]
        ])
      }
      add('door', [
        [center - 1, 2.5, z],
        [center + 1, 2.5, z]
      ])
    }
  }
  for (let boundary = 0; boundary <= SITE.bays; boundary++) {
    const x = boundary * SITE.width
    for (let z = 0; z <= SITE.length; z += SITE.postSpacing)
      add(
        'post',
        [
          [x, -0.4, z],
          [x, SITE.eave, z]
        ],
        SITE.postDiameter
      )
    // Bracing only on exterior walls; internal longitudinal passages stay open.
    if (boundary === 0 || boundary === SITE.bays) {
      for (const y of [0.45, 1.5])
        add('purlin', [
          [x, y, 0],
          [x, y, SITE.length]
        ])
      for (const z of [0, SITE.length - SITE.postSpacing]) {
        add('brace', [
          [x, 0.45, z],
          [x, SITE.eave, z + SITE.postSpacing]
        ])
        add('brace', [
          [x, SITE.eave, z],
          [x, 0.45, z + SITE.postSpacing]
        ])
      }
    }
  }
  return members
}

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
  barrierHeight: 0.35,
  barrierThickness: 0.02
})
export const BED_WIDTHS = Object.freeze([0.9, 0.3, 1.8, 0.3, 1.8, 0.3, 0.9])
export type Site = { [K in keyof typeof SITE]: number }
export const BED_STRIPS: readonly { kind: Strip['kind']; width: number }[] =
  BED_WIDTHS.map((width, i) => ({ kind: i % 2 ? 'drain' : 'soil', width }))
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

export function roofPoint(
  bay: number,
  fraction: number,
  z: number,
  site: Site = SITE
): Point3 {
  const half = site.width / 2
  const rise = site.height - site.eave
  const radius = (half * half + rise * rise) / (2 * rise)
  const theta = Math.asin(half / radius) * (2 * fraction - 1)
  return [
    bay * site.width + half + radius * Math.sin(theta),
    site.height - radius + radius * Math.cos(theta),
    z
  ]
}

export function createLayout(site: Site = SITE, beds = BED_STRIPS) {
  const strips: Strip[] = []
  for (let bay = 0; bay < site.bays; bay++) {
    let x = bay * site.width + site.margin
    beds.forEach(({ width, kind }) => {
      strips.push({ bay, kind, x, width })
      x += width
    })
  }
  const passages = Array.from({ length: site.bays - 1 }, (_, i) => ({
    x: (i + 1) * site.width - site.margin,
    width: 2 * site.margin
  }))
  return { strips, passages, totalWidth: site.width * site.bays }
}

export function createStructure(site: Site = SITE): Member[] {
  const members: Member[] = []
  const doorHalf = Math.min(1, site.width / 4)
  const doorHeight = Math.min(2.5, (site.eave * 5) / 6)
  const add = (
    kind: Member['kind'],
    points: readonly Point3[],
    diameter: number = site.tubeDiameter
  ) => members.push({ kind, points, diameter })
  for (let bay = 0; bay < site.bays; bay++) {
    for (const z of memberStations(site.length, site.frameSpacing))
      add(
        'arch',
        Array.from({ length: 49 }, (_, i) => roofPoint(bay, i / 48, z, site))
      )
    for (const fraction of [0, 0.25, 0.5, 0.75, 1])
      // Shared shoulders have one longitudinal member, not coincident duplicates.
      if (fraction !== 0 || bay === 0)
        add('purlin', [
          roofPoint(bay, fraction, 0, site),
          roofPoint(bay, fraction, site.length, site)
        ])
    for (const z of memberStations(site.length, site.postSpacing)) {
      add('tie', [
        [bay * site.width, site.eave, z],
        [(bay + 1) * site.width, site.eave, z]
      ])
      for (const fraction of [0.25, 0.75]) {
        const top = roofPoint(bay, fraction, z, site)
        add('brace', [[bay * site.width + site.width / 2, site.eave, z], top])
      }
    }
    for (const z of [0, site.length]) {
      const center = bay * site.width + site.width / 2
      // Two metre end openings are an explicit assumption, kept clear below 2.5m.
      for (const x of [center - doorHalf, center + doorHalf]) {
        const half = site.width / 2,
          rise = site.height - site.eave
        const radius = (half * half + rise * rise) / (2 * rise)
        add('door', [
          [x, 0, z],
          [x, site.height - radius + Math.sqrt(radius ** 2 - doorHalf ** 2), z]
        ])
      }
      add('door', [
        [center - doorHalf, doorHeight, z],
        [center + doorHalf, doorHeight, z]
      ])
    }
  }
  for (let boundary = 0; boundary <= site.bays; boundary++) {
    const x = boundary * site.width
    for (const z of memberStations(site.length, site.postSpacing))
      add(
        'post',
        [
          [x, -0.4, z],
          [x, site.eave, z]
        ],
        site.postDiameter
      )
    // Bracing only on exterior walls; internal longitudinal passages stay open.
    if (boundary === 0 || boundary === site.bays) {
      for (const y of [site.eave * 0.15, site.eave * 0.5])
        add('purlin', [
          [x, y, 0],
          [x, y, site.length]
        ])
      for (const z of new Set([
        0,
        Math.max(0, site.length - site.postSpacing)
      ])) {
        add('brace', [
          [x, 0.45, z],
          [x, site.eave, Math.min(site.length, z + site.postSpacing)]
        ])
        add('brace', [
          [x, site.eave, z],
          [x, 0.45, Math.min(site.length, z + site.postSpacing)]
        ])
      }
    }
  }
  return members
}

/** Include the last frame even when length is not a multiple of the spacing. */
export function memberStations(length: number, spacing: number): number[] {
  const positions = Array.from(
    { length: Math.ceil(length / spacing) },
    (_, i) => i * spacing
  )
  return [...positions, length]
}

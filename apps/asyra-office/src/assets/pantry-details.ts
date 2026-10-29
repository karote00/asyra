import { lathe, type Mesh, type Vec } from './geometry'
import { extrudeProfile } from './profile-extrusion'
import { subtractSolids } from './solid-subtraction'

export interface TrayGrooves {
  count: number
  width: number
  depth: number
  slotBreadth: number
  xCentres: number[]
  yCentres: number[]
}
export interface BottleRings {
  centresZ: number[]
  height: number
  extraRadius: number
}
/** Blind slots retain their actual floor and semicircular end walls. */
export function cutTrayGrooves(
  mesh: Mesh,
  centre: Vec,
  size: Vec,
  slots: TrayGrooves
) {
  if (
    slots.count !== slots.xCentres.length * slots.yCentres.length ||
    slots.depth >= size[2]
  )
    throw new Error('Invalid tray groove contract')
  const cutters: Mesh[] = []
  const r = slots.slotBreadth / 2,
    half = slots.width / 2 - r,
    top = centre[2] + size[2] / 2
  for (const x of slots.xCentres)
    for (const y of slots.yCentres) {
      const outline: number[][] = []
      for (const sign of [1, -1])
        for (let i = 0; i <= 12; i++) {
          const a = (sign === 1 ? -0.5 : 0.5) * Math.PI + (i * Math.PI) / 12
          outline.push([x + sign * half + r * Math.cos(a), y + r * Math.sin(a)])
        }
      cutters.push(
        extrudeProfile(outline, 2, [top - slots.depth, top + size[2]])
      )
    }
  return subtractSolids(mesh, cutters)
}
/** Monotone cubic radius interpolation preserves shared slopes without overshoot. */
function bottleRows(profile: number[][], rings?: BottleRings): number[][] {
  const spans = profile.slice(1).map((p, i) => p[0] - profile[i][0])
  const slopes = spans.map((h, i) => (profile[i + 1][1] - profile[i][1]) / h)
  const tangents = profile.map((_, i) => {
    if (i === 0 || i === profile.length - 1) return 0
    const before = slopes[i - 1],
      after = slopes[i]
    if (before * after <= 0) return 0
    const leftWeight = 2 * spans[i] + spans[i - 1]
    const rightWeight = spans[i] + 2 * spans[i - 1]
    return (
      (leftWeight + rightWeight) / (leftWeight / before + rightWeight / after)
    )
  })
  const heights = new Set<number>()
  for (let j = 0; j < profile.length - 1; j++)
    for (let i = 0; i <= 8; i++)
      heights.add(profile[j][0] + ((profile[j + 1][0] - profile[j][0]) * i) / 8)
  if (rings)
    for (const z of rings.centresZ)
      for (let i = 0; i <= 8; i++)
        heights.add(z - rings.height / 2 + (rings.height * i) / 8)
  return [...heights]
    .sort((a, b) => a - b)
    .map((z) => {
      const j = Math.min(
        profile.length - 2,
        Math.max(
          0,
          profile.findIndex(
            (p, i) => i < profile.length - 1 && z <= profile[i + 1][0]
          )
        )
      )
      const t = (z - profile[j][0]) / spans[j],
        s = t * t * (3 - 2 * t)
      let r =
        profile[j][1] +
        s * (profile[j + 1][1] - profile[j][1]) +
        spans[j] *
          (t * (1 - t) ** 2 * tangents[j] + t * t * (t - 1) * tangents[j + 1])
      if (rings)
        for (const c of rings.centresZ)
          if (Math.abs(z - c) <= rings.height / 2)
            r +=
              (rings.extraRadius *
                (1 + Math.cos((2 * Math.PI * (z - c)) / rings.height))) /
              2
      return [r, z]
    })
}
export function bottleSurface(profile: number[][], rings?: BottleRings): Mesh {
  const rows = bottleRows(profile, rings)
  return lathe([[0, rows[0][1]], ...rows], 64)
}

/** Static liquid uses the same cavity profile and an exact frustum-volume fraction. */
export function bottleContents(
  profile: number[][],
  rings: BottleRings | undefined,
  ratio: number,
  inset: number
): Mesh {
  if (!(ratio > 0 && ratio <= 1) || !(inset > 0))
    throw new Error('Invalid bottle fill fraction or clearance')
  const rows = bottleRows(profile, rings)
    .filter(([, z]) => z >= profile[0][0] + inset)
    .map(([r, z]) => [Math.max(0, r - inset), z])
  const volume = (a: number[], b: number[]) =>
    ((b[1] - a[1]) * (a[0] ** 2 + a[0] * b[0] + b[0] ** 2)) / 3
  const target =
    rows.slice(1).reduce((sum, row, i) => sum + volume(rows[i], row), 0) * ratio
  const filled = [rows[0]]
  let accumulated = 0
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1],
      b = rows[i],
      segmentVolume = volume(a, b)
    if (accumulated + segmentVolume < target) {
      filled.push(b)
      accumulated += segmentVolume
      continue
    }
    let low = 0,
      high = 1
    const at = (t: number) => [
      a[0] + t * (b[0] - a[0]),
      a[1] + t * (b[1] - a[1])
    ]
    for (let pass = 0; pass < 40; pass++) {
      const t = (low + high) / 2
      if (volume(a, at(t)) < target - accumulated) low = t
      else high = t
    }
    const end = at((low + high) / 2)
    filled.push(end, [0, end[1]])
    break
  }
  return lathe([[0, filled[0][1]], ...filled], 64)
}

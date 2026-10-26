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
/** Source Z remains linear while radius uses smoothstep and cosine ring reliefs. */
export function bottleSurface(profile: number[][], rings?: BottleRings): Mesh {
  const heights = new Set<number>()
  for (let j = 0; j < profile.length - 1; j++)
    for (let i = 0; i <= 8; i++)
      heights.add(profile[j][0] + ((profile[j + 1][0] - profile[j][0]) * i) / 8)
  if (rings)
    for (const z of rings.centresZ)
      for (let i = 0; i <= 8; i++)
        heights.add(z - rings.height / 2 + (rings.height * i) / 8)
  const rows = [...heights]
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
      const t = (z - profile[j][0]) / (profile[j + 1][0] - profile[j][0]),
        s = t * t * (3 - 2 * t)
      let r = profile[j][1] + s * (profile[j + 1][1] - profile[j][1])
      if (rings)
        for (const c of rings.centresZ)
          if (Math.abs(z - c) <= rings.height / 2)
            r +=
              (rings.extraRadius *
                (1 + Math.cos((2 * Math.PI * (z - c)) / rings.height))) /
              2
      return [r, z]
    })
  return lathe([[0, rows[0][1]], ...rows], 64)
}

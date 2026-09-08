import { SITE, type Point3 } from './greenhouse'
import { SUPPORT_LAYOUT, type createSupportAssembly } from './planting-supports'

/** Metres. Mesh and cord dimensions are provisional planting-system choices. */
export const NET_LAYOUT = Object.freeze({
  bottom: 0.45,
  mesh: 0.15,
  cordDiameter: 0.002,
  tieWidth: 0.004,
  tieThickness: 0.001
})
type Assembly = ReturnType<typeof createSupportAssembly>
export function createPlantingNet(assembly: Assembly) {
  const strands: {
    bay: number
    diameter: number
    points: readonly Point3[]
  }[] = []
  const ties: { bay: number; center: Point3; radius: number }[] = []
  const rows = assembly.tubes.filter(
    (tube) => tube.z === SUPPORT_LAYOUT.endInset
  )
  for (const row of rows) {
    const line = assembly.tubes.filter(
      (tube) => tube.row === row.row && tube.side === row.side
    )
    const last = line[line.length - 1]
    const top = SITE.eave
    // Put the net against the drain-facing surface, clear of the steel centreline.
    const direction = row.side === 'left' ? 1 : -1
    const x =
      row.x +
      (direction * (SUPPORT_LAYOUT.diameter + NET_LAYOUT.cordDiameter)) / 2
    const add = (a: Point3, b: Point3) =>
      strands.push({
        bay: row.bay,
        diameter: NET_LAYOUT.cordDiameter,
        points: [a, b]
      })
    const verticalIntervals = Math.ceil(
      (top - NET_LAYOUT.bottom) / NET_LAYOUT.mesh - 1e-9
    )
    const longitudinalIntervals = Math.ceil(
      (last.z - row.z) / NET_LAYOUT.mesh - 1e-9
    )
    for (let i = 0; i <= verticalIntervals; i++) {
      const y = Math.min(top, NET_LAYOUT.bottom + i * NET_LAYOUT.mesh)
      add([x, y, row.z], [x, y, last.z])
    }
    for (let i = 0; i <= longitudinalIntervals; i++) {
      const z = Math.min(last.z, row.z + i * NET_LAYOUT.mesh)
      add([x, NET_LAYOUT.bottom, z], [x, top, z])
    }
    for (const tube of line)
      ties.push({
        bay: row.bay,
        center: [tube.x, top - NET_LAYOUT.tieWidth / 2, tube.z],
        radius: SUPPORT_LAYOUT.diameter / 2 + NET_LAYOUT.cordDiameter
      })
  }
  return { strands, ties }
}

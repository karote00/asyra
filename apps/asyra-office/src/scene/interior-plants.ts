import { planter } from '../assets/plants'
import type { Mesh, Vec } from '../assets/geometry'
import { OFFICE_FIT } from './office-layout'

export type IndoorPlantId = keyof typeof OFFICE_FIT.indoorPlants

/** Size the vessel and soil-rooted foliage from their independently measured envelopes. */
export function indoorPlant(id: IndoorPlantId) {
  const fit = OFFICE_FIT.indoorPlants[id]
  const parts = planter(
    1,
    Number.parseInt(fit.potColor.slice(1), 16),
    fit.seed,
    'rosette'
  ).map((part) => {
    const vessel = part.id === 'pot' || part.id === 'soil'
    const scale = vessel ? fit.potScale : fit.foliageScale
    const transform = (mesh: Mesh): Mesh => ({
      ...mesh,
      positions: mesh.positions.map((n, i) => {
        const axis = i % 3
        return !vessel && axis === 2
          ? (n - fit.soilPivot) * scale[2] + fit.soilPivot * fit.potScale[2]
          : n * scale[axis]
      })
    })
    return {
      ...part,
      mesh: transform(part.mesh),
      ...(part.distant
        ? {
            distant: {
              mesh: transform(part.distant.mesh),
              maxError: part.distant.maxError * Math.max(...scale)
            }
          }
        : {})
    }
  })
  return { parts, position: fit.position as Vec }
}

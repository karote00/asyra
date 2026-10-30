import { meshBounds } from './room-furnishing-helpers'
import { teaTable } from '../assets/furnishings'
import { catalogAsset } from '../assets/catalog'
import type { Vec } from '../assets/geometry'
import type { OfficeComposer } from './office-interior'
import { OFFICE_FLOORS } from './office-layout'
import seating from './reference/office-seating.json'

/** Measured whole-unit transforms inside the accepted, unchanged room structure. */
export const OFFICE_SEATING = seating.instances

export function composeOfficeSeating({ add }: Pick<OfficeComposer, 'add'>) {
  const tableTops = new Map<string, number>()
  // One factory invocation per requested asset per composition, shared by its instances.
  const assets = new Map<string, ReturnType<typeof catalogAsset>>()
  for (const item of OFFICE_SEATING) {
    let parts = assets.get(item.asset)
    if (!parts) {
      if (item.asset === 'round-tea-table') {
        parts = teaTable()
      } else {
        parts = catalogAsset(item.asset)
      }
      assets.set(item.asset, parts)
    }
    tableTops.set(
      item.id,
      OFFICE_FLOORS[item.room as keyof typeof OFFICE_FLOORS] +
        meshBounds(parts)[2][1] * item.scale[2]
    )
    add(
      item.id,
      item.asset,
      parts,
      [
        ...item.position,
        OFFICE_FLOORS[item.room as keyof typeof OFFICE_FLOORS]
      ] as Vec,
      item.rotation,
      item.scale as Vec
    )
  }
  return tableTops
}

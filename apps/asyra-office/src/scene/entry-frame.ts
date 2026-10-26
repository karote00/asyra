import architecture from '../../../../assets/asyra-office/models/architecture/architecture-model-spec.json'
import { catalogAsset } from '../assets/catalog'
import { requiredSpecValue } from '../assets/specification'
import type { Vec } from '../assets/geometry'

/** Fit the approved structural members to an app-owned rough wall opening. */
export function createEntryFrame(
  width: number,
  height: number,
  centerX: number,
  frontY: number,
  floor: number
) {
  const spec = requiredSpecValue(
    architecture.modules.find((item) => item.moduleId === 'entry-door-set'),
    'entry door'
  )
  const mounting = requiredSpecValue(spec.mounting, 'entry mounting')
  const sx = width / mounting.roughOpeningSizeMetres[0],
    sz = height / mounting.roughOpeningSizeMetres[1]
  const members = ['jamb-left', 'jamb-right', 'head']
  const parts = catalogAsset('entry-door-set').filter((part) =>
    members.includes(part.id)
  )
  if (parts.length !== members.length)
    throw new Error('Missing approved structural entry members')
  const front = Math.min(
    ...parts.flatMap((part) =>
      part.mesh.positions.filter((_, index) => index % 3 === 1)
    )
  )
  return {
    parts,
    position: [centerX, frontY - front * sz, floor] as Vec,
    scale: [sx, sz, sz] as Vec
  }
}

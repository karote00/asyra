import { roundedTaper } from './rounded-turning'
import { requiredSpecValue } from './specification'
import tea from '../../../../assets/asyra-office/models/tea-furniture/tea-furniture-model-spec.json'
import { box, vec } from './geometry'
import { part, placeParts, type AssetPart } from './catalog'
const oak = 0xd5b587,
  dark = 0x584333
export function teaTable(): AssetPart[] {
  const module = requiredSpecValue(
    tea.modules.find((m) => m.moduleId === 'round-tea-table'),
    'round-tea-table'
  )
  const top = requiredSpecValue(
    module.components.find((c) => c.partId === 'top'),
    'tea top'
  ) as { zMin: number; zMax: number; radius: number; bevel: number }
  const zMin = requiredSpecValue(top.zMin, 'top zMin'),
    zMax = requiredSpecValue(top.zMax, 'top zMax'),
    radius = requiredSpecValue(top.radius, 'top radius')
  const pieces = [
    part(
      'top',
      roundedTaper(
        [0, 0, zMin],
        [0, 0, zMax],
        radius,
        radius,
        requiredSpecValue(top.bevel, 'top bevel'),
        64
      ),
      oak,
      'wood'
    )
  ]
  for (const name of ['apron-front-back', 'apron-sides']) {
    const rail = requiredSpecValue(
      module.components.find((c) => c.partId === name),
      name
    ) as { centres: number[][]; size: number[]; bevel: number }
    requiredSpecValue(rail.centres, 'apron centres').forEach((centre, i) =>
      pieces.push(
        ...placeParts(
          [
            part(
              `${name}-${i}`,
              box(vec(requiredSpecValue(rail.size, 'apron size')), rail.bevel),
              dark,
              'wood'
            )
          ],
          vec(centre)
        )
      )
    )
  }
  const legs = requiredSpecValue(
    module.components.find((c) => c.partId === 'legs'),
    'tea legs'
  )
  requiredSpecValue(legs.endCentres, 'leg endpoints').forEach(
    ({ bottom, top }, i) =>
      pieces.push(
        part(
          `leg-${i}`,
          roundedTaper(
            vec(bottom),
            vec(top),
            requiredSpecValue(legs.bottomRadius, 'bottom radius'),
            requiredSpecValue(legs.topRadius, 'top radius'),
            requiredSpecValue(legs.edgeBevel, 'leg bevel')
          ),
          dark,
          'wood'
        )
      )
  )
  return pieces
}
export { teaChair } from './tea-chair'
export { mug, laptop } from './desk-items'
export { planter } from './plants'
export { bench } from './bench'
export { lantern } from './lantern'

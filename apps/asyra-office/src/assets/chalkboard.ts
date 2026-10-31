import specification from '../../../../assets/asyra-office/models/outdoor-accents/outdoor-accents-model-spec.json'
import { append, box, cylinder, emptyMesh, vec } from './geometry'
import { part, type AssetPart } from './catalog'
import { requiredSpecValue } from './specification'
export function chalkboard(): AssetPart[] {
  const source = requiredSpecValue(
    specification.modules.find((m) => m.moduleId === 'entry-chalkboard'),
    'chalkboard'
  )
  const pieces: AssetPart[] = []
  const wood = parseInt(
      specification.materials.wood.baseColorSRGB.slice(1),
      16
    ),
    board = parseInt(specification.materials.board.baseColorSRGB.slice(1), 16),
    metal = parseInt(specification.materials.metal.baseColorSRGB.slice(1), 16)
  const angle = (14 * Math.PI) / 180
  for (const side of [-1, 1]) {
    for (const id of ['side-posts', 'rails', 'panels']) {
      const c = requiredSpecValue(
        source.components.find((c) => c.partId === id),
        id
      ) as {
        localCentres?: number[][]
        localCentre?: number[]
        sizeWidthUpNormal: number[]
        bevel?: number
      }
      const centres = c.localCentres ?? [
        requiredSpecValue(c.localCentre, 'local centre')
      ]
      centres.forEach(([x, up, normal], i) => {
        const size = c.sizeWidthUpNormal,
          mesh = emptyMesh()
        append(
          mesh,
          box([size[0], size[2], size[1]], c.bevel ?? 0.001),
          [
            x,
            side * 0.17 -
              side * up * Math.sin(angle) +
              side * normal * Math.cos(angle),
            up * Math.cos(angle) + normal * Math.sin(angle)
          ],
          [side * 14, 0, 0]
        )
        for (let j = 2; j < mesh.positions.length; j += 3) {
          mesh.positions[j] = Math.max(0, mesh.positions[j])
        }
        pieces.push(
          part(
            `${side === -1 ? 'front' : 'rear'}-${id}-${i}`,
            mesh,
            id === 'panels' ? board : wood,
            id === 'panels' ? 'plain' : 'wood'
          )
        )
      })
    }
  }
  for (const id of [
    'side-spreaders',
    'hinges',
    'hinge-heads',
    'spreader-fastener-shafts',
    'spreader-fastener-heads'
  ]) {
    const c = requiredSpecValue(
      source.components.find((c) => c.partId === id),
      id
    ) as {
      centres: number[][]
      size?: number[]
      radius?: number
      length?: number
      bevel?: number
    }
    c.centres.forEach((centre, i) => {
      const mesh = emptyMesh()
      const shape = c.size
        ? box(vec(c.size), c.bevel ?? 0.001)
        : cylinder(
            requiredSpecValue(c.radius, 'pin radius'),
            requiredSpecValue(c.length, 'pin length'),
            c.radius,
            24
          )
      append(mesh, shape, vec(centre), c.size ? [0, 0, 0] : [0, 90, 0])
      pieces.push(
        part(
          `${id}-${i}`,
          mesh,
          c.size ? wood : metal,
          c.size ? 'wood' : 'metal'
        )
      )
    })
  }
  return pieces
}

import specification from '../../../../assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json'
import { part, placeParts, type AssetPart, type SurfaceKind } from './catalog'
import { append, box, emptyMesh, lathe, tube, vec, type Mesh } from './geometry'
import { vesselLabel } from './vessel-label'

export type PantryVesselId = keyof typeof specification.sourceVariants.vessels
export const PANTRY_VESSEL_LABELS = {
  'counter-green-bottle': 'Pantry - green counter bottle',
  'shelf-spice-jar': 'Pantry - small brown plant pot',
  'shelf-cream-jar': 'Pantry - ivory contents and yellow label',
  'shelf-sage-jar': 'Pantry - ochre contents and green label',
  'shelf-brown-jar': 'Pantry - clear brown-spice jar',
  'shelf-amber-jar': 'Pantry - clear ochre-spice jar',
  'porcelain-floor-jar': 'Pantry - blue-white porcelain jar'
} satisfies Record<PantryVesselId, string>
export const isPantryVessel = (id: string): id is PantryVesselId =>
  Object.hasOwn(PANTRY_VESSEL_LABELS, id)

export function pantryCounterBottle(): AssetPart[] {
  const recipe = specification.sourceVariants.counterBottle
  if (!isPantryVessel(recipe.vessel)) throw new Error('Unknown counter bottle')
  const colors = Object.fromEntries(
    Object.entries(recipe.colors).map(([region, color]) => [
      region,
      Number.parseInt(color.slice(1), 16)
    ])
  )
  const scale = recipe.uniformScale
  return placeParts(pantryVessel(recipe.vessel, colors), [0, 0, 0], 0, [
    scale,
    scale,
    scale
  ])
}
interface VesselRegion {
  id: string
  kind: 'lathe' | 'tube' | 'label' | 'box' | 'ellipsoid'
  profile?: number[][]
  path?: number[][]
  radius?: number
  size?: number[]
  center?: number[]
  rotation?: number[]
  zRange?: number[]
  angles?: number[]
  color: string
  roughness: number
  opacity: number
  environmentIntensity?: number
  uvAspectRatio?: number
  topProfileIndex?: number
  surface?: SurfaceKind
}

/** Actual source variants share a constructor, not a single scaled silhouette. */
export function pantryVessel(
  id: PantryVesselId,
  colors: Readonly<Record<string, number>> = {}
): AssetPart[] {
  const recipe = specification.sourceVariants.vessels[id]
  if (!recipe) throw new Error(`Unknown pantry vessel: ${id}`)
  return (recipe.regions as VesselRegion[]).map((region) => {
    const construct = (segments: number): Mesh => {
      if (region.kind === 'lathe' && region.profile) {
        if (region.topProfileIndex !== undefined) {
          const split = region.topProfileIndex
          const aspect = region.uvAspectRatio ?? 1
          const height = Math.max(...region.profile.map(([, z]) => z))
          const radius = Math.max(...region.profile.map(([r]) => r))
          const extent = Math.max(
            height,
            radius * 2,
            (2 * Math.PI * radius) / aspect
          )
          const side = lathe(region.profile.slice(0, split + 1), segments)
          for (let i = 0; i < side.positions.length / 3; i++) {
            side.uvs[i * 2] *= (2 * Math.PI * radius) / (extent * aspect)
            side.uvs[i * 2 + 1] = side.positions[i * 3 + 2] / extent
          }
          const top = lathe(region.profile.slice(split), segments)
          for (let i = 0; i < top.positions.length / 3; i++) {
            top.uvs[i * 2] = top.positions[i * 3] / (extent * aspect) + 0.5
            top.uvs[i * 2 + 1] = top.positions[i * 3 + 1] / extent + 0.5
          }
          append(side, top)
          return side
        }
        const mesh = lathe(region.profile, segments)
        if (region.surface) {
          const height = Math.max(...region.profile.map(([, z]) => z))
          for (let i = 0; i < mesh.positions.length / 3; i++)
            mesh.uvs[i * 2 + 1] = mesh.positions[i * 3 + 2] / height
        }
        return mesh
      }
      if (
        region.kind === 'label' &&
        region.radius &&
        region.zRange &&
        region.angles
      )
        return vesselLabel(region.radius, region.zRange, region.angles)
      if (
        (region.kind === 'box' || region.kind === 'ellipsoid') &&
        region.size &&
        region.center
      ) {
        const mesh = emptyMesh()
        const shape =
          region.kind === 'box'
            ? box(vec(region.size), 0.002, 4)
            : lathe(
                Array.from({ length: 17 }, (_, i) => [
                  i === 0 || i === 16 ? 0 : Math.sin((i / 16) * Math.PI),
                  -Math.cos((i / 16) * Math.PI)
                ]),
                24
              )
        if (region.kind === 'ellipsoid')
          for (let i = 0; i < shape.positions.length; i++)
            shape.positions[i] *= region.size[i % 3] / 2
        append(
          mesh,
          shape,
          vec(region.center),
          vec(region.rotation ?? [0, 0, 0])
        )
        return mesh
      }
      if (region.kind === 'tube' && region.path && region.radius)
        return tube(region.path.map(vec), region.radius, 12)
      throw new Error(`Incomplete vessel region: ${id}/${region.id}`)
    }
    const mesh = construct(specification.sourceVariants.angularIntervals)
    const result = part(
      region.id,
      mesh,
      colors[region.id] ?? Number.parseInt(region.color.slice(1), 16),
      region.surface ?? 'plain',
      region.roughness
    )
    if (region.opacity < 1) result.opacity = region.opacity
    if (region.environmentIntensity !== undefined)
      result.environmentIntensity = region.environmentIntensity
    if (
      region.kind === 'lathe' &&
      !('preserveFullDetail' in recipe && recipe.preserveFullDetail)
    )
      result.distant = {
        mesh: construct(specification.sourceVariants.distantAngularIntervals),
        maxError: 0.00065
      }
    return result
  })
}

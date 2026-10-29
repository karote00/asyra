import specification from '../../../../assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json'
import { part, type AssetPart } from './catalog'
import { lathe, tube, vec } from './geometry'

/** Owner-confirmed refrigerator light with separately replaceable enclosure and diffuser. */
export function pantryNightLight(
  colors: Readonly<Record<string, number>> = {}
): AssetPart[] {
  const recipe = specification.sourceVariants.nightLight
  const color = (region: { id: string; color: string }) =>
    colors[region.id] ?? Number.parseInt(region.color.slice(1), 16)
  const parts = recipe.regions.map((region) => {
    const result = part(
      region.id,
      lathe(region.profile, recipe.angularIntervals),
      color(region),
      'plain',
      region.roughness
    )
    if ('emissive' in region && typeof region.emissive === 'string') {
      result.emissive =
        colors[region.id] ?? Number.parseInt(region.emissive.slice(1), 16)
      result.emissiveIntensity = region.emissiveIntensity
    }
    if (region.opacity < 1) result.opacity = region.opacity
    return result
  })
  const loop = recipe.loop
  parts.push(
    part(
      loop.id,
      tube(loop.path.map(vec), loop.radius, 12),
      color(loop),
      'plain',
      loop.roughness
    )
  )
  return parts
}

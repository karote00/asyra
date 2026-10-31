import specification from '../../../../assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json'
import { part, type AssetPart } from './catalog'
import { append, emptyMesh, lathe } from './geometry'
import { extrudeProfile } from './profile-extrusion'

/** Independent framed light; the original pantry night-light remains available. */
export function frameNightLight(
  colors: Readonly<Record<string, number>> = {}
): AssetPart[] {
  const recipe = specification.sourceVariants.frameNightLight
  const color = (region: { id: string; color: string }) =>
    colors[region.id] ?? Number.parseInt(region.color.slice(1), 16)
  const parts = recipe.regions.map((region) => {
    const result = part(
      region.id,
      lathe(region.profile, recipe.angularIntervals),
      color(region),
      region.material === 'metal' ? 'metal' : 'plain',
      region.roughness
    )
    result.metalness = region.metalness
    result.environmentIntensity = region.environmentIntensity
    if (region.opacity < 1) {
      result.opacity = region.opacity
    }
    if ('emissive' in region && typeof region.emissive === 'string') {
      result.emissive =
        colors[region.id] ?? Number.parseInt(region.emissive.slice(1), 16)
      result.emissiveIntensity = region.emissiveIntensity
    }
    return result
  })
  const frame = recipe.frame
  // Each strap has a solid rectangular section, not a round wire or full panel.
  const contour = (inset: number, topZ: number) => {
    const halfWidth = frame.outerWidth / 2 - inset
    const radius = frame.cornerRadius - inset
    const top = topZ - inset
    const points = [[-halfWidth, frame.bottom]]
    for (const [cx, start] of [
      [-halfWidth + radius, Math.PI],
      [halfWidth - radius, Math.PI / 2]
    ]) {
      for (let i = 0; i <= frame.cornerIntervals; i++) {
        const a = start - (i / frame.cornerIntervals) * (Math.PI / 2)
        points.push([
          cx + radius * Math.cos(a),
          top - radius + radius * Math.sin(a)
        ])
      }
    }
    points.push([halfWidth, frame.bottom])
    return points
  }
  for (const arch of frame.arches) {
    const outline = [
      ...contour(0, arch.top),
      ...contour(frame.bandWidth, arch.top).reverse()
    ].map(([x, z]) => [z, x])
    const mesh = emptyMesh()
    append(
      mesh,
      extrudeProfile(outline, 1, [-frame.depth / 2, frame.depth / 2]),
      [0, 0, 0],
      [0, 0, arch.rotationDegrees]
    )
    parts.push({
      ...part(
        arch.id,
        mesh,
        color({ id: arch.id, color: frame.color }),
        'metal',
        frame.roughness
      ),
      metalness: frame.metalness,
      environmentIntensity: frame.environmentIntensity
    })
  }
  return parts
}

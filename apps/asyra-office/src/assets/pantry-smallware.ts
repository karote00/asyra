import specification from '../../../../assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json'
import { part, type AssetPart } from './catalog'
import { lathe } from './geometry'
import { requiredSpecValue } from './specification'

/** The approved canister is a hollow revolved body with a separate closed lid. */
export function pantryCanister(color?: number, lidColor?: number): AssetPart[] {
  const recipe = requiredSpecValue(
    specification.modules.find((m) => m.moduleId === 'pantry-canister'),
    'pantry canister'
  )
  return recipe.components.map((component) => {
    const profile = requiredSpecValue(component.profile, component.partId)
    const material =
      specification.materials[
        component.material as keyof typeof specification.materials
      ]
    let appearanceColor = Number.parseInt(material.baseColorSRGB.slice(1), 16)
    if (component.partId === 'body' && color !== undefined)
      appearanceColor = color
    if (component.partId === 'lid' && lidColor !== undefined)
      appearanceColor = lidColor
    const result = part(
      component.partId,
      lathe(profile, specification.revolution.angularIntervals),
      appearanceColor,
      component.material === 'wood' && lidColor === undefined
        ? 'wood'
        : 'ceramic'
    )
    result.distant = { mesh: lathe(profile, 24), maxError: 0.0004 }
    return result
  })
}

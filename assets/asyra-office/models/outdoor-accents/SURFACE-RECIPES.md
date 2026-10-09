# Outdoor Accents - Surface Recipes

JSON supplies sRGB colours and material constants. Wood #B68050, grain #95683E, dark metal #343633, board #34332F and chalk #EBE6D6. Alpha 1, transmission 0, emission 0 and no clearcoat. Metal uses metallic 0.5 and roughness 0.85; all highlights come from scene lighting.

Wood grain follows each board or post's longest local axis L. Let W be the shorter local face coordinate across it. Compute f=0.5+0.5*sin(2*pi*(W/0.004+0.1*sin(2*pi*L/0.18))). Mix linear wood and grain colours with weight 0.15*f. No random knots, plank subdivisions, engraved grooves, normal map or displacement. Grain is intrinsic colour only; hidden wood undersides use the same rule.

Metal is uniform matte dark grey. Blackboard is uniform charcoal, front/back and edges; chalk is the flat vector stroke mask from JSON on front only. Use ordinary antialiasing, no blurred shadow, raised ink, glow, chalk dust or grunge. Handwriting in the generated sheet is illustrative; exact letter construction follows the vector contract.

Do not copy rendered highlights, cast/contact shadows, ambient occlusion, white backgrounds or sheet labels into any texture. No scene geometry, shadow plane or baked illumination is included. The app owns all lighting.

## Bench defaults and replaceable regions

The bench uses two independently configurable regions:

| Region | Default surface | sRGB base | Additional default |
| --- | --- | --- | --- |
| Wood | All four seat and three back slats | #B68050 | Intrinsic grain #95683E using the recipe above |
| Metal | Complete frame including two seat crossrails | #343633 | Metallic 0.5, roughness 0.85 |

These values are defaults, not restrictions on instance appearance. Follow the
[shared sizing and appearance contract](../README.md#overall-size-and-appearance---2026-10-09):
complete geometry sizing first, then resolve per-region colour/material overrides
and mapping. Changing one instance must not mutate shared materials of others.
A colour override retains the selected material's other properties; a material
override may replace grain with a different surface. Geometry never changes as
an implicit side effect of appearance overrides.

For default grain, L and W use final resized local metres, before placement
rotation. Preserve the stated physical periods instead of stretching a fixed
bitmap. L runs along each slat's local X axis; W follows its other in-face local
axis (Y on horizontal faces, Z on longitudinal vertical faces). End faces use
local Y for L and local Z for W. Each board's coordinate zero is its resized
local minimum bound on the corresponding axis. Adjacent boards need not have
continuous grain. No normals or displacement are implied by this colour recipe.

### Bench reference appearance

Bench v4 maps small interior wood samples from original v1 onto all projected
slats in their local coordinates. It preserves the original colour family and
illustrated grain style without copying complete source object views. It does
not evaluate the procedural grain recipe above. That recipe remains a future
configurable material default, not an exact reconstruction of illustrated grain.
Metal uses a uniform dark fill; geometric outlines distinguish cap/face edges.
No new directional lighting, cast shadow or ambient occlusion is added.
Source samples are drawing aids, not approved runtime texture maps.

Changing reference colours is warranted only when an actual visibility problem
requires it. Replaceable appearance and documented defaults do not themselves
require recolouring a reference. The original bench already distinguishes wood
from metal clearly, so the earlier pale palette is withdrawn.

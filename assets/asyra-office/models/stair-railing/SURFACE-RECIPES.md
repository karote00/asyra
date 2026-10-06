# Stair Railing - Surface Recipes

The default surface recipe for both objects is uniform charcoal-painted metal.
Colour and material are replaceable creation options under the shared asset
review rule. These values are defaults, not fixed geometry requirements;
instance-specific overrides must not mutate other instances.

When no colour or material override is supplied, both the stair baluster and
sloped handrail use sRGB base colour `#383A38` uniformly on every face. This
matches `material.baseColor` in `stair-railing-model-spec.json`.

The calculated handrail v3 diagram uses different grey face tones solely to
distinguish geometry. Do not sample those tones as material defaults or create
different default materials for the top, sides and cut ends.

| Property | Value |
| --- | --- |
| sRGB base color | #383A38 |
| Metallic | 0.15 |
| Roughness | 0.80 |
| Alpha | 1 |
| IOR | 1.5 |
| Coat, transmission, subsurface, anisotropy, emission | 0 |
| Normal map and displacement | None |

Convert sRGB to the tool's linear working space normally. Use the same intrinsic color on every face, including cut ends and underside. No UV-dependent texture is required.

No baked shadows, AO, gradients, reflections, highlights, wear or rust. Runtime scene lighting will provide illumination. Drawing contours and dimension marks must not become painted stripes or modeled grooves. Minor raster variation is not a material instruction.

# Column and Beam - Surface Recipes

Both objects use the same uniform cream plaster material as the new roof module body.

This is the explicit default for both the square column and horizontal beam
when no colour or material override is supplied: plaster with sRGB base colour
`#E4D9C4`, on all six faces. It matches the numeric specification's
`materials.plaster`. The recipe is replaceable; an instance override must not
change geometry or other instances. Diagram shading is not a separate default.

| Property | Value |
| --- | --- |
| sRGB base color | #E4D9C4 |
| Roughness | 0.90 |
| Metallic | 0 |
| Alpha | 1 |
| IOR | 1.5 |
| Coat, transmission, subsurface, anisotropy, emission | 0 |

Convert sRGB to the tool's linear working space normally. Use the identical intrinsic color on all six faces. No texture or UV layout is required. No normal maps, displacement or modeled grain.

No baked shadows, ambient occlusion, gradients, reflections, highlights or emissive appearance. Lighting belongs to the future 3D scene. The contour lines and labels in the sheets are drawing aids and must not be baked into materials. Minor generated raster variation is not a surface specification.

This supplementary solid-color recipe does not modify the original architecture's existing surface recipes.

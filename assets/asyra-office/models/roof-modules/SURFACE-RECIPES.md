# Roof Modules - Surface Recipes

This batch uses uniform intrinsic colors from the original architecture palette. It deliberately has no procedural fleck or grain. All faces assigned to a material have the same color.

| Material | sRGB base color | Roughness | Metallic | Alpha | Emission |
| --- | --- | --- | --- | --- | --- |
| Stone | #D6D0C1 | 0.90 | 0 | 1 | 0 |
| Plaster | #E4D9C4 | 0.90 | 0 | 1 | 0 |
| Cream cap | #EEE4D2 | 0.87 | 0 | 1 | 0 |

Use a dielectric material with IOR 1.5, no coat, transmission, subsurface scattering, anisotropy or emission. Convert sRGB base colors to the tool's linear working space normally. UV mapping is unnecessary for these solid colors.

No baked shadows, AO, highlights, gradients, reflections, normal maps or displacement. Future scene lighting belongs to the app. Review sheet contour lines, labels and dimension arrows are presentation marks, not mesh features or textures. Any minor raster color variation is not a material instruction.

The cap/body boundary comes only from the two materials and their shared plane; never add a black groove or painted edge. The new roof material recipe does not alter existing architecture recipes.

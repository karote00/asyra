# Mini Spinning Top - Surface Recipes

| Region | sRGB base color | Roughness |
| --- | --- | --- |
| Body, underside, rim and upper annulus | #8B9B7A | 0.85 |
| Handle cylinder and handle top | #D5B587 | 0.85 |

Both regions use metallic=0, alpha=1, IOR=1.5, and zero coat, transmission, subsurface, anisotropy and emission. No normal map or displacement.

Use uniform intrinsic colors. The handle's wood color does not imply a grain texture. No UV-dependent detail is needed. Convert sRGB normally to the tool's linear working space.

No baked shadows, AO, highlights, gradients, reflections, wear, grain or dirt. Runtime scene lighting owns illumination. Drawing contours, view labels and minor raster variation must not become material detail.

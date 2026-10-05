# Wireless Mouse - Surface Recipes

| Region | sRGB base color | Roughness |
| --- | --- | --- |
| Upper shell | #F0ECE3 | 0.70 |
| Base sides and underside | #B8BCBE | 0.80 |

Both use metallic=0, alpha=1, IOR=1.5, and zero coat, transmission, subsurface, anisotropy and emission. No normal map or displacement.

Assign shell material to the ellipsoid, base material to the elliptical cylinder and bottom cap. Use uniform intrinsic colors. Convert sRGB normally to the working space. UV-dependent textures are unnecessary.

No baked shadow, AO, highlight, gradient, reflection, logo, texture or wear. Future scene lighting owns illumination. Drawing outlines, labels and minor raster variation are not surface instructions.

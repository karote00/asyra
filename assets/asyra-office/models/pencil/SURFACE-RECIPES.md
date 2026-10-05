# Pencil - Surface Recipes

| Region | sRGB base color | Roughness |
| --- | --- | --- |
| Painted barrel | #8B9B7A | 0.85 |
| Exposed wood taper and tail | #D5B587 | 0.85 |
| Graphite apex and tail centre | #383A38 | 0.85 |

All use metallic=0, alpha=1, IOR=1.5, with coat, transmission, subsurface, anisotropy and emission zero. No normal map or displacement.

Assign materials to the documented exterior segments. On the tail only, the centred radius-0.001 regular hexagonal region uses graphite. Use the six-vertex polygon mask or an equivalent coplanar material boundary. No raised geometry or hole is implied.

Convert sRGB normally to the working space. No wood grain, painted text, stripe, dirt, baked shadow, AO, highlight, gradient or reflection. Runtime lighting owns illumination. Drawing contours and minor raster variation must not become material detail.

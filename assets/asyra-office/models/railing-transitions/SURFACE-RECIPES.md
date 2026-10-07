# Railing Transitions - Surface Recipes

Use one uniform charcoal-painted-metal material, matching the approved railing groups.

This is the default when no colour or material override is supplied. Preserve
the original charcoal reference's specified sRGB base colour `#383A38`, matching
`material.baseColor` in the numeric JSON. Colour and material are replaceable
independently of geometry; overrides must not mutate other instances.

Recoloured review sheets are geometry-inspection aids only. Their display
colour does not replace this default and must not be sampled into the model.
All faces retain the same default material, including both top planes.

For the lower transition post specifically, the original charcoal v2 drawing
remains the default appearance reference. The accepted light-grey v14 review sheet uses
`#C8CCD0` as its requested display colour only; the material default remains
`#383A38` with metallic 0.15 and roughness 0.80. The same distinction applies
to the upper post's light-grey review sheet.

| Property | Value |
| --- | --- |
| sRGB base color | #383A38 |
| Metallic | 0.15 |
| Roughness | 0.80 |
| Alpha | 1 |
| IOR | 1.5 |
| Coat, transmission, subsurface, anisotropy, emission | 0 |
| Normal map and displacement | None |

Convert sRGB normally to the tool's linear working space. All faces, including both top planes and the bottom, share the same intrinsic color. UV-dependent textures are unnecessary.

No baked shadows, AO, highlights, gradients, reflections, rust or wear. Scene lighting belongs to the app. Sheet contours, centre guides and annotations are not surface details. The top crease comes from geometry only; do not paint it black.

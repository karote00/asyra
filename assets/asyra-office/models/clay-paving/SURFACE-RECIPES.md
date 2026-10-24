# Red Clay Paver - Surface Recipes

By default, use a single matte terracotta material on every face, including chamfers and the underside.

| Property | Value |
| --- | --- |
| sRGB base color | #B86F53 |
| Roughness | 0.92 |
| Metallic | 0 |
| Alpha | 1 |
| IOR | 1.5 |
| Coat, transmission, subsurface, anisotropy, emission | 0 |
| Normal map and displacement | None |

Convert sRGB normally to the tool's linear working space. No UV-dependent texture, random flecks, grain or per-brick color randomization is specified.

No baked shadow, AO, highlight, gradient, reflection, weathering or dirt. Future scene lighting owns illumination. Sheet outlines and text are explanatory marks, not textures. Minor raster variation must not become surface variation.

Colour and full-material replacement follow the [shared sizing and appearance rule](../README.md#overall-size-and-appearance---2026-10-09).
This unit has one whole-brick material region, including chamfers and the bottom.
The default flat tint has no physical tile scale; a replacement texture material
supplies its own stretch or physical-repeat mapping after overall dimensions are
resolved. Existing defaults do not restrict replacements to flat terracotta.

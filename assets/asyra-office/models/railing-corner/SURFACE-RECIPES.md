# Level Handrail Corner - Surface Recipes

Use the following charcoal-painted-metal recipe as the default when no override
is supplied, matching the approved railing material. Default sRGB colour
`#383A38` agrees with `material.baseColor` in the numeric specification.

Colour and material must be replaceable independently of geometry. Future
creation parameters may override either without changing dimensions, ports,
origin or another instance's appearance. The current review covers dimensions
and geometry; colour and material are configurable defaults, not acceptance
criteria for the shape.

| Property | Value |
| --- | --- |
| sRGB base color | #383A38 |
| Metallic | 0.15 |
| Roughness | 0.80 |
| Alpha | 1 |
| IOR | 1.5 |
| Coat, transmission, subsurface, anisotropy, emission | 0 |
| Normal map and displacement | None |

Convert sRGB normally to the tool's linear working space. All faces use the same intrinsic color, including the inside corner, bottom and ends. No UV-dependent textures are required.

No baked shadows, AO, highlights, gradients, reflections, wear or rust. Runtime scene lighting owns illumination. Sheet outlines and labels must not become textures or grooves. Minor raster variation is not a material instruction.


The v2 reference sheet uses light grey `#C8CCD0` for inspection only and labels
the actual default `#383A38`. Do not sample the review fill or its raster
variation into the model material. Original v1 was removed; the numeric default above is authoritative. No geometry or numeric material value changes with this
recolour.

# Shop Awning - Surface Recipes

| Default material | sRGB base colour | Roughness |
| --- | --- | --- |
| Muted blue | #657B89 | 0.90 |
| Ivory | #EEE4D2 | 0.90 |

Both use metallic=0, alpha=1, IOR=1.5, with zero coat, transmission, subsurface,
anisotropy and emission; no default normal map or displacement. These authored
intrinsic defaults are replaceable, not colours sampled from scene lighting.

## Explicit colour modes

- `solid`: one selected colour/material covers every module. Default is blue.
- `alternating` (default): exactly two selected colours/materials, default blue
  and ivory. Module i uses entry i modulo 2. Start with blue at the leftmost
  local-X module. A narrowed final piece retains its index and colour.

For 5.3 module equivalents, the six visible regions are blue, ivory, blue,
ivory, blue, then ivory at 30% width. Solid mode uses the same six geometric
regions with one colour, not a different mesh. The default eight-module example
ends ivory, but odd counts end blue. No fixed eight-band texture is required.

Reject unsupported modes. If a palette is explicitly supplied, solid mode
requires exactly one entry and alternating mode requires exactly two entries.
An explicit empty list is invalid in either mode; it is not an omitted value.
When the palette is omitted, solid mode uses blue and alternating mode uses
blue/ivory. When the mode is omitted, use alternating mode. A palette entry may be a supplied material or colour;
colour-only entries use the default surface properties. No appearance option
changes dimensions, angle, count or partial-piece width.

Each module's material is continuous across slope, valance, underside, rear cut
and exposed side ends. Preserve logical regions after removing internal end
caps. No raised stripes, grooves or added seams. Rear/bottom camera reversal
does not reverse object-space mapping.

Mode assignment supplies the preset for each region. Apply shared precedence:
explicit module material over group material over preset, then explicit module
colour over group colour. Explicit overrides may intentionally replace a mode's
assigned colours. Never mutate other instances through a shared material.
Resolve surface mapping after final geometry/XYZ sizing. Solid default colours
need no texture, but replacement materials may use ordinary surface textures.

No baked shadow, AO, highlight, gradient, reflection, dirt or wear. App lighting
supplies illumination. Drawing outlines, annotation text and raster variation
are not material details. Convert sRGB normally to the working colour space.

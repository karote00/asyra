# Street Details - Surface Recipes

Default metal appearance: uniform charcoal #383A38 (sRGB), metallic 0.15, roughness 0.80, opacity 1 and emission 0 on every metal surface, including hidden ends and backs. The default has no rust, grain or normal maps. Geometry displacement is excluded from appearance overrides.

The sign's front lettering uses ivory #EEE9DD with the original-reference-derived alpha mask defined by the JSON recipe. No border. Lettering is paint, not luminous or raised geometry. Use antialiasing only along the mask edge.

No cast/contact shadows, AO, directional gradients, reflections, highlights or glow may be copied into materials. Drawing outlines and white sheet backgrounds are annotations, not asset textures. Runtime lights create the scene's illumination.

## Street sign - replaceable appearance

The values above are defaults, not restrictions on caller-selected colours or
materials. Preserve seven independently configurable regions:

| Region | Default colour | Metallic | Roughness | Opacity | Emission |
| --- | --- | --- | --- | --- | --- |
| shaft | #383A38 | 0.15 | 0.80 | 1 | 0 |
| collar | #383A38 | 0.15 | 0.80 | 1 | 0 |
| finial | #383A38 | 0.15 | 0.80 | 1 | 0 |
| board-1 | #383A38 | 0.15 | 0.80 | 1 | 0 |
| board-2 | #383A38 | 0.15 | 0.80 | 1 | 0 |
| lettering-board-1 | #EEE9DD | 0 | 0.80 | 1 | 0 |
| lettering-board-2 | #EEE9DD | 0 | 0.80 | 1 | 0 |

The metal group contains the first five regions; the lettering group contains
the last two. For each region select its material override, otherwise its group
material override, otherwise its default. Then apply its colour override,
otherwise its group colour override. With no colour override, preserve the
selected material's colour, including custom materials; do not restore default
tint over a custom material. A colour-only override retains other shader
properties. A full material override replaces surface properties within the
selected region, while preserving its boundaries and geometry.

Lettering remains a flat mask on the corresponding board front. Replacing a
board material must not erase or recolour its independent lettering region.
No letter extrusion or coplanar overlay mesh is introduced. Colours and surface
materials cannot move vertices, change dimensions, add displacement or create
lights. Do not modify another instance through shared material mutation.
This describes future creation parameters, not an implemented API. The bollard's corresponding contract is below.

## Reference drawing colours - documentation only

The current v6 sheet uses light face colours to make the square post legible.
These colours do not replace any defaults in the table above. The physical
shaft is a square prism with four flat side faces, not a cylinder.

| Drawing surface | Review colour (sRGB) |
| --- | --- |
| Box faces normal to X | #9DADB9 |
| Box faces normal to Y | #D7E0E6 |
| Box faces normal to Z | #EDF2F5 |
| Spherical finial | #BCCBD5 |
| Lettering | #33434F |
| Geometry outline | #273743 |

These are constant orientation-coded diagram fills, not directional lighting,
shadows, textures or separately coloured runtime faces. All five views use the
same world-axis mapping. Future construction must read metal #383A38 and
lettering #EEE9DD from the default material specification unless callers supply
an override; never sample defaults from this review sheet. The diagram header
also states both defaults explicitly.

## Roadside bollard - default and replaceable appearance

| Region | Default colour (sRGB) | Metallic | Roughness | Opacity | Emission | Review target only |
| --- | --- | --- | --- | --- | --- | --- |
| shaft | #383A38 | 0.15 | 0.80 | 1 | 0 | #D7E0E6 |
| collar | #383A38 | 0.15 | 0.80 | 1 | 0 | #9DADB9 |
| finial | #383A38 | 0.15 | 0.80 | 1 | 0 | #BCCBD5 |

The existing shared metal default remains authoritative. Explicit per-region
rows clarify that hidden bottom surfaces and annular shoulders also use that
default; no textures, roughness variation, grain, rust or glow are required.

Each region supports independent colour and full-material replacement. Select
per-region material, otherwise metal-group material, otherwise the default;
then apply per-region colour, otherwise metal-group colour. Without a colour
override, retain the selected material's colour. A tint-only change preserves
other material properties. Preserve source-region ownership through union,
including the collar's exposed shoulders. Keep geometry and other instances
unchanged; never bake shadows, AO, highlights or review outlines into materials.

V3 uses the same light review targets for readability. Its header identifies default
metal #383A38 and the cylindrical shaft. The primitive projections use constant per-part fills and contour lines only;
there are no baked lighting gradients or shadows. The original image-generation
colour variations and illustrated form cues are historical documentation only. Do not sample the PNG to
set runtime colours or surface maps. These requirements describe future creation
parameters; no API, model or shader is implemented by this reference update.

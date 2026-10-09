# Surface Recipes

| Part | Uniform sRGB color | Metallic | Roughness |
| --- | --- | --- | --- |
| Entire canopy | #C77D59 | 0 | 0.90 |
| Pole, ribs, base and socket | #414647 | 0.15 | 0.80 |

Emission and transmission are zero. Canopy top, underside and edge faces share the same color. The bore has the same charcoal color as the base.

The default uses no textures, panel stripes, grain, normal, bump, displacement or occlusion map. Preview colors are unlit. No cast/contact shadows, AO, gradients, highlights, reflected light or glow. Panel contours describe actual triangle boundaries, not decorative trim. The application supplies scene lighting later.

## Replaceable appearance

The listed colours and material properties are defaults, not restrictions.
The generated parasol exposes separate canopy, pole and rib regions. Each may
receive a colour or material override after geometry parameters and overall XYZ
size are resolved, following the shared asset contract. Default canopy sides
and edges share one material; no alternating panel palette is required.
Appearance overrides cannot move vertices or introduce implicit displacement.
The separate base retains its independent default charcoal region. Source
illustration lighting and outlines must not be baked into runtime textures.

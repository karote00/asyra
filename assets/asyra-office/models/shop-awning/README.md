# Group 4AF - Parametric Shop Awning

Status: user-approved parametric documentation and annotated reference on
2026-10-10. No generator, Blender model or app implementation.

One placeable unit is one strip containing an adjustable sloped canopy and a
vertical front valance. Repeat strips along X to fit the eave exactly, including
a partial final strip. Direct programmatic generation is the selected method.

Appearance follows the blue/ivory canopy on the upper-right bookshop in the
[approved office reference](../architecture/review/approved-office-reference.jpg).
This is a secondary source for this component; the central office remains the
primary project reference. Exact dimensions and hidden thickness are authored.

## Defaults and configurable inputs

| Input | Default | Meaning |
| --- | --- | --- |
| Module width | 250 mm | One complete strip along X |
| Canopy length L | 854.400375 mm | Along the upper sloped surface |
| Canopy angle | 20.556045 degrees | Downward from horizontal |
| Valance length V | 120 mm | Always vertical, independent of canopy angle |
| Layout | 8 module equivalents | 2000 mm wide default assembly |
| Colour mode | Alternating | Blue #657B89 / ivory #EEE4D2; solid mode also supported |

The exact length/angle defaults are sqrt(0.8^2+0.3^2) m and atan2(0.3,0.8).
These reproduce an 800 mm projection and 420 mm total height. Those two extents
are derived outputs when L, angle or V changes, not additional locked inputs.

A request for 5.3 module equivalents creates five 250 mm pieces and one 75 mm
piece, totalling 1325 mm. It never rounds down to five pieces or expands to six
full pieces. Solid/alternating colours do not change geometry or piece count.
In solid mode, an omitted palette uses blue; an explicit empty palette is invalid.
FRONT/BACK surface lines show the two sides of the folded profile. The blue side
profile is LEFT, with its original geometry retained.

## Handoff

- [Final annotated reference and review scope](review/README.md)
- [Geometry and parameter formulas](GEOMETRY-SUPPLEMENT.md)
- [Colour modes and replaceable materials](SURFACE-RECIPES.md)
- [Numeric specification](shop-awning-model-spec.json)
- [Original image prompts](review/PROMPTS.md)

Generate the shared profile and layout before any explicit overall XYZ scaling,
then resolve appearance. Internal joins have no doubled end caps or gaps.
No walls, signs, frames, support posts, environment or retracting mechanism are
included. Future generated geometry must still be reviewed separately.

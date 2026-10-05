# Asyra Office - Group 5A - Small Potted Plants

Status: **The user approved these drawings and documents for commit. No models, app implementation or model verification.**

| One unit | Source or authored completion | Fixed size | Sheet |
| --- | --- | --- | --- |
| Pale-pot leafy plant | Central-office pale pots and broad green foliage; simplified six-leaf structure | Pot 0.14 m diameter, 0.12 m high; plant about 0.32 m high | [Leaf plant](review/01-potted-leaf-plant-v1.png) |
| Terracotta-pot cactus | New matching-style design; no clearly identifiable cactus in the source | Pot 0.13 m diameter, 0.11 m high; plant 0.30 m high | [Cactus](review/02-potted-cactus-v1.png) |

One placeable plant includes pot, soil and foliage. Keep these as named components within the unit for future replacement; no replacement behavior is implemented here. There is one pot per view, no saucer, room or tabletop. Both sheets contain front, right, back, top and oblique views.

## Modeling handoff

- [Approved office reference](../architecture/review/approved-office-reference.jpg): central-office palette and plant language.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md): pot cross-sections, hidden interiors, fixed leaves and branch curves.
- [JSON specification](small-plants-model-spec.json): all numeric dimensions, component parameters and material values.
- [Surface recipes](SURFACE-RECIPES.md): flat intrinsic colours and cactus areoles without lighting.
- [Review index](review/README.md) and [actual prompts](review/PROMPTS.md).

Metric sizes, unseen pot construction, leaf count/arrangement and the cactus design are explicit authored decisions. Sheets are appearance guides, not calibrated projections or recovered plant geometry. Numeric contracts resolve hidden structure and dimensions; appearance remains subject to review. No models or 100% reconstruction have been verified.

The app owns placement, duplication, lighting and any later growth/animation. No species identification, botanical simulation, wind, soil physics or LOD model is included.

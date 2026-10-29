# Asyra Office - Group 5A - Small Potted Plants

## Current room recipes - 2026-10-29

- [Generic and square-floor-plant numbers](small-plants-model-spec.json):
  `broadleaf-square` owns the work-room floor plant's square terracotta vessel
  and broad leaves. Its [owner crop](review/work-floor-square-planter-owner-reference.png)
  supersedes the earlier round-pot interpretation for this instance.
- [Shelf botanical numbers](shelf-botanical-model-spec.json) and
  [selected photo](review/work-shelf-botanical-reference.png): upper-left ivory
  fittonia/chevron pot, upper-right terracotta snake plant/fluted pot, and three
  succulent cat pots below (ivory, terracotta, ivory). Colors, anchors and scales
  remain as recorded in the [technical proposal](../../../../docs/ai/apps/asyra-office/implementation.md#five-reference-botanical-work-shelf-planters).
  The old straight-cylinder shelf recipes and crop are superseded for these
  five instances; do not use them to reconstruct the current shelf.
- [Discussion conifer photo](review/discussion-conifer-owner-reference.png) and
  [complete branch-first construction](../../../../docs/ai/apps/asyra-office/implementation.md#discussion-room-reference-furnishings---2026-10-28):
  independent height, branch reach and pot sizes, then connected fine foliage.
  Both room instances use that recipe, not the generic broad-leaf plant.
- Other pantry/scene plants retain the scoped growth variants in the generic
  JSON and geometry supplement. New variants do not replace all plants globally.

The implementation/specification links above own current geometry. The original
batch table below remains a reusable default handoff, not the active scene list.
Appearance stays independently replaceable; growth is deterministic at scene
construction, not rerun during camera movement. Reference photos are shape and
appearance sources, not baked model textures.


Status: the original drawings were approved; scoped procedural room recipes now
exist. The owner included the current discussion/work-room plants in the partial
2026-10-29 merge checkpoint. Cactus modeling and full-catalog validation remain
outside that acceptance.

| One unit | Source or authored completion | Fixed size | Sheet |
| --- | --- | --- | --- |
| Pale-pot leafy plant | Central-office pale pots and broad green foliage; broad folded leaf scaffold, now 6..9 seeded leaves | Pot 0.14 m diameter, 0.12 m high; plant about 0.32 m high | [Leaf plant](review/01-potted-leaf-plant-v1.png) |
| Terracotta-pot cactus | New matching-style design; no clearly identifiable cactus in the source | Pot 0.13 m diameter, 0.11 m high; plant 0.30 m high | [Cactus](review/02-potted-cactus-v1.png) |

One placeable plant includes pot, soil and foliage. Keep these as named components within the unit for future replacement; no replacement behavior is implemented here. There is one pot per view, no saucer, room or tabletop. Both sheets contain front, right, back, top and oblique views.

## Modeling handoff

- [Approved office reference](../architecture/review/approved-office-reference.jpg): central-office palette and plant language.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md): pot cross-sections, hidden interiors, seeded leaves and branch curves.
- [JSON specification](small-plants-model-spec.json): all numeric dimensions, component parameters and material values.
- [Surface recipes](SURFACE-RECIPES.md): flat intrinsic colours and cactus areoles without lighting.
- [Review index](review/README.md) and [actual prompts](review/PROMPTS.md).

Metric sizes, unseen pot construction, leaf count/arrangement and the cactus design are explicit authored decisions. Sheets are appearance guides, not calibrated projections or recovered plant geometry. Numeric contracts resolve hidden structure and dimensions; appearance remains subject to review. No exact reconstruction or new visual approval is claimed.

The app owns placement, duplication, lighting and any later growth/animation. No species identification, botanical simulation, wind, soil physics or LOD model is included.

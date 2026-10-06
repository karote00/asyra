# Architectural Components - Image Review

The six revision-2 sheets were approved on 2026-10-04. The user approved the corrected wall v5 shape on 2026-10-06; it supersedes wall v2 and v3. The floor v7 drawing and independent natural oak PNG were approved for commit on 2026-10-06. Partition v5 was approved for commit on 2026-10-06 and supersedes its earlier sheets. Stair and door retain their existing approval. Window v6 and its 45-degree frame geometry were approved for commit on 2026-10-06; colour and materials are outside this approval. Each shows four views of one component, not four components or four objects that must be placed together.

## References

- [User-approved overall style](approved-office-reference.jpg): central office first, surrounding shops second.
- [User-specified entrance close-up](entry-door-reference.png): narrow same-colour left panel and right leaf form one door set.

## Current sheets

1. [Wall - single segment](01-wall-v5.png)
2. [Floor - single plank](02-floor-v7.png)
3. [Partition - single segment](03-partition-v5.png)
4. [Stair - single step](04-stair-v2.png)
5. [Entrance door - complete set](05-door-v2.png)
6. [Window - one unit with sill](06-window-v6.png)

### Approved partition revision - 2026-10-06

[Partition v5](03-partition-v5.png) and its [SIDE detail](03-partition-v5-side-detail.png)
show the approved flush X ends and symmetric 15 mm Y lips. SIDE is generated
from numeric bounds; unchanged views remain appearance references. See the
[review record](03-partition-v5-review.md). Earlier v3/v4 sheets are historical;
v4 failed the required symmetric thickness profile. No shadow pass was needed.

### Approved floor revision - 2026-10-06

The [v7 sheet](02-floor-v7.png) retains the dimension-driven v6 projection and
restores natural wood grain through a [replaceable PNG](../materials/floor-natural-oak-v1.png).
See its [self-review record](02-floor-v7-review.md). The user approved this
drawing and material for commit on 2026-10-06. It supersedes floor v2. V5 failed
self-review; v6's regular grain was rejected. Both remain historical evidence.

Sheets support appearance review. See the [main document](../README.md) for dimensions, backs, materials, and component relationships. Backgrounds, text, and outlines are not assets. Do not bake face shading into textures; use shadow-free surface recipes. The window takes cues from secondary shops, not a required matching central-office window.

[Actual prompts](PROMPTS.md) are generation history only. Old overviews and orthoviews are outside this revision's approval. This document claims no model, export, or verified reconstruction.

The wall v5 approval covers shape. Its [review record](01-wall-v5-review.md) and
[enlarged end detail](01-wall-v5-end-detail.png) document the correction. The
current sheet has no newly added reference shadows. Numeric dimensions retain
the existing scale with explicit flush-end checks in the geometry supplement.

## Conditional shadow review - 2026-10-06

For the single stair step, the user selected direct document review because its
shape is a solid rectangular block with small edge treatments. Keep the current
sheet; no extra shadow reference is needed. The checked bounds, bevel and
placement anchors are recorded in the [stair specification](../GEOMETRY-SUPPLEMENT.md#single-stair-step).

Review one component at a time: present current multiview drawings, obtain user
shape review, add a shadow-assisted reference only when curves, recesses,
occlusion or part relationships need clarification, then reconcile dimensions
and materials and perform a document self-review. Shadows are not mandatory.
The user explicitly confirmed that wall v5 and floor v7 need no reference
shadows. Material PNGs remain free of baked lighting; the app owns scene lights.

## Lighting revision - 2026-10-04 (historical)

The user authorized committing these lighting-only drawing revisions. Prior approval applies to the underlying design. Dimensions and construction specifications are unchanged.

See the [complete lighting review](../../SHADOW-FREE-REVIEW.md) for revised images and the shared surface rule. Do not bake shadows, ambient occlusion, highlights or directional lighting into materials.

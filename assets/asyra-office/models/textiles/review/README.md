# Group 4F - Textile Review

Status: original drawings and rectangular-rug construction approved. The round-rug construction revision is approved by the user for commit; throw pillow is unchanged. No production model verification.

1. [Rectangular rug](01-rectangular-rug-v1.png): sage green rug beside the central office laptop desk; one flat unit with simple bound edge.
2. [Round rug](02-round-rug-v1.png): grey-lavender rug in the central office sofa area; one circular unit.
3. [Throw pillow](03-throw-pillow-v1.png): mustard cushion from the green sofa; one independent square cushion.

Review colour, silhouette, edge treatment and thickness. Each rug includes an underside view; pillow back is explicitly plain and symmetric. Reference dimensions, hidden backs and edge construction are authored completions, not measurements. Use [JSON](../textiles-model-spec.json) and the [geometry supplement](../GEOMETRY-SUPPLEMENT.md) for exact construction. No image lighting becomes part of the material.

## Rectangular rug construction revision

The original image is unchanged. Review the [construction specification](../RECTANGULAR-RUG-SPEC.md) and [JSON](../textiles-model-spec.json) for geometry, five replaceable appearance regions, default colours, size behavior and LoD. The [permanent checks](__tests__/test_rectangular_rug_spec.py) validate an in-memory analytic construction, not an exported model or app render. Binding is a surface mask without added thickness.

## Round rug construction revision

The original image is unchanged. The [round-rug specification](../ROUND-RUG-SPEC.md) and [JSON](../textiles-model-spec.json) define the inward rounded edge, 24 mm flat binding, five replaceable regions, nonuniform sizing and three LoD tiers. The [permanent checks](__tests__/test_round_rug_spec.py) validate the numeric construction in memory. No production model or app validation is claimed.

## Lighting revision - 2026-10-04

The user authorized committing these lighting-only drawing revisions. Prior approval applies to the underlying design. Dimensions and construction specifications are unchanged.

See the [complete lighting review](../../SHADOW-FREE-REVIEW.md) for revised images and the shared surface rule. Do not bake shadows, ambient occlusion, highlights or directional lighting into materials.

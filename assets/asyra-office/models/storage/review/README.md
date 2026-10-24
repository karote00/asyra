# Group 4C - Storage Furniture Review

Status: original sheets retained. The snack-cabinet construction revision is approved by the user for commit; bookcase and wall shelf are unchanged. No production model verification.

1. [Snack cabinet](01-snack-cabinet-v2.png): new matching-style design, two open compartments and two lower doors.
2. [Narrow bookcase](02-bookcase-v1.png): based on the sofa-side wooden shelf, with three open compartments.
3. [Wall shelf](03-wall-shelf-v1.png): based on workspace wall planks; one plank is one unit.

Each contains five views without stored contents. The initial snack-cabinet sheet had incorrect generated dimension labels; revision 2 removes them. [JSON](../storage-model-spec.json) controls dimensions. Dimensions on the other sheets are authored, not measured from the original.

The [geometry document](../GEOMETRY-SUPPLEMENT.md) records completed hidden backs, holes, and compartment counts; the [main document](../README.md) defines scope. Future modeling still requires appearance comparison. No models were exported in this batch.

## Snack cabinet numeric review

The [construction specification](../SNACK-CABINET-SPEC.md) corrects the full-width cap, door fit and handle mounting planes while preserving the original sheet. The [permanent checks](__tests__/test_snack_cabinet_spec.py) verify bounds, clearances, cavity emptiness, connections and document consistency. Five output solids and LoD budgets are future implementation requirements, not verified model results.

## Lighting revision - 2026-10-04

The user authorized committing these lighting-only drawing revisions. Prior approval applies to the underlying design. Dimensions and construction specifications are unchanged.

See the [complete lighting review](../../SHADOW-FREE-REVIEW.md) for revised images and the shared surface rule. Do not bake shadows, ambient occlusion, highlights or directional lighting into materials.

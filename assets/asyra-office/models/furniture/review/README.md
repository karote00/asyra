# Group 4A - Furniture Image Review

The user approved committing five furniture items. Each sheet shows five views of the same item.

1. [Wooden writing desk](01-desk-v1.png)
2. [Work chair](02-work-chair-v1.png)
3. [Green two-seat sofa](03-sofa-v1.png)
4. [Orange lounge armchair - approved widened revision](../source/side-source-reset/five-views-v3-wider.png)
5. [Round coffee table](05-coffee-table-v1.png)

The [original reference](../../architecture/review/approved-office-reference.jpg) prioritizes the central office. Hidden chair supports, sofa underside, and table leg count are explicit completions in the [document](../GEOMETRY-SUPPLEMENT.md). Review appearance and these choices together.

Images are not calibrated projections: some front/side views are slightly elevated, and coffee-table leg projections/top circle have generation deviations. Reconstruct one numeric geometry and compare appearance, rather than turning inconsistent views into different parts. Sheet shading, outlines, and dimensions are not materials and must not be baked.

No movable tabletop objects, throw pillows, rugs, or plants are included. Other Group 4 items remain later batches in the [main document](../README.md).

## Writing desk document review

The [desk specification](../WRITING-DESK-SPEC.md) is approved for commit. The
original sheet is preserved; its elevated front/side views do not change the
four equal-height legs. This step reviews documents, not a modeled result.

## Work chair document review

The [work-chair specification](../WORK-CHAIR-SPEC.md) is approved for commit.
The original sheet is preserved. The corrected numeric back posts stop at the
seat bottom, matching the BACK connection rule; the former 56 mm hanging stubs
were a specification error. The linked inspection crop enlarges original pixels
without creating a replacement design. Actual model appearance remains unverified.

## Two-seat sofa document review

The [sofa specification](../TWO-SEAT-SOFA-SPEC.md) is approved for commit.
The five-view image remains unchanged. Its RIGHT SIDE label 0.30 m is not the
construction height; the agreed overall height is 0.70 m. The revised numeric
assembly follows the reference's cushion-above-shell relationship and short
feet, with documented contacts and no model acceptance claim.

## Lighting revision - 2026-10-04

The user authorized committing these lighting-only drawing revisions. Prior approval applies to the underlying design. Dimensions and construction specifications are unchanged.

See the [complete lighting review](../../SHADOW-FREE-REVIEW.md) for revised images and the shared surface rule. Do not bake shadows, ambient occlusion, highlights or directional lighting into materials.

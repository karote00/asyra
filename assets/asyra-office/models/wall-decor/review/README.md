# Group 4D - Wall Decoration Review

Status: approved by the user for commit; no model verification.

1. [Wall clock](01-wall-clock-v2.png): dark circular rim, ivory face, short indices and two hands; plain hidden back is an authored completion.
2. [Vertical wallpaper](02-vertical-wallpaper-v1.png): one tall paper strip with one sage band and two cream half-bands, no host wall.
3. [Horizontal wallpaper](03-horizontal-wallpaper-v1.png): one wide rotated-pattern strip, not a panel or wall assembly.

Each sheet has front, right, back, top and oblique views. Shapes and colours follow the [central office reference](../../architecture/review/approved-office-reference.jpg); the reference itself is not re-embedded in conversational delivery. Hidden backs and exact dimensions are defined in the [geometry supplement](../GEOMETRY-SUPPLEMENT.md) and [JSON](../wall-decor-model-spec.json).

Review the clock silhouette and face, the paper-like thickness, the sage/cream palette and each unit's independent boundary. Any soft illumination visible in a generated sheet is illustrative only; it must not become a texture, shadow mesh or added geometry. These sheets are not calibrated engineering projections.

Clock revision 2 restores the two omitted front indices. The top-profile pin silhouette and apparent rim depth are illustrative: numeric geometry keeps the pin behind the front rim, and fixes total depth at 0.055 m. Wallpaper side thickness is magnified for readability, not a thicker construction.

## Lighting revision - 2026-10-04

The user authorized committing these lighting-only drawing revisions. Prior approval applies to the underlying design. Dimensions and construction specifications are unchanged.

See the [complete lighting review](../../SHADOW-FREE-REVIEW.md) for revised images and the shared surface rule. Do not bake shadows, ambient occlusion, highlights or directional lighting into materials.

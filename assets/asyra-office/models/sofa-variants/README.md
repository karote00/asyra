# Asyra Office - Group 4H - Sofa Variants

Status: original drawings and L-shaped sofa documents are approved for commit; revised curved sofa documents are approved by the user for commit. No models, app code or Blender outputs are included.

These two shapes were requested by the user but do not appear in the approved office image. They extend the [approved two-seat sofa](../furniture/review/03-sofa-v1.png) using its sage fabric, rounded cushioning and dark wooden feet. They are not claimed as exact copies of unseen reference objects.

| One placeable unit | Nominal X x Y x Z (m)      | Fixed structure                                                               | Sheet                                           |
| ------------------ | -------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| L-shaped sofa      | 1.80 x 1.15 x 0.70         | Right-side forward chaise, two seat cushions, two back cushions, six feet     | [L-shaped sofa](review/01-l-shaped-sofa-v1.png) |
| Curved sofa        | 1.723245 x 0.817373 x 0.70 | 120-degree annular sector, three seat cushions, three back cushions, six feet | [Curved sofa](review/02-curved-sofa-v1.png)     |

Each sheet has front, right, back, top and oblique views. Seat top is 0.34 m for both. These are two complete furniture units; feet, fixed armrests and structural cushions belong to the same unit. Loose throw pillows remain separate assets. No room or furniture arrangement is included.

## Current L-shaped sofa document review

The [updated L-shaped sofa contract](L-SHAPED-SOFA-SPEC.md) is approved by the user for commit.
It retains the right-side chaise, short right arm, original six feet and overall
size, while correcting embedded seat joints, inset base surfaces, lowered rear
coverage and leaned back cushions. It defines concave rounding, replaceable
appearance and unverified LOD targets. The original L-shaped sofa sheet remains unchanged. No model is produced or verified.

## Current curved sofa document review

The [curved sofa construction contract](CURVED-SOFA-SPEC.md) is approved by the user
for commit. The table now lists rounded physical dimensions, not the historical
unrounded envelope. It specifies polar-mapped roundovers, embedded joints,
radially leaned backs, an inset rear shell, six feet, independent appearance
replacement and unverified LOD targets. The reference image and approved
L-shaped sofa inputs remain unchanged. No model is produced or verified.

## Modeling inputs

- [Original office](../architecture/review/approved-office-reference.jpg) and [approved sofa](../furniture/review/03-sofa-v1.png): style authority.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md): exact footprint, orientation, cushion counts, hidden rear/underside and joins.
- [JSON specification](sofa-variants-model-spec.json): parts, coordinates, curves, bounds and materials.
- [Surface recipes](SURFACE-RECIPES.md): inherited colours, simple cloth and no baked illumination.
- [Review index](review/README.md) and [actual prompts](review/PROMPTS.md).

Dimensions, new silhouettes and hidden construction are authored design choices awaiting review. Generated sheets are appearance guides, not calibrated projections. Numeric geometry fixes the footprint and part count; visual differences require review rather than arbitrary additions. No model verification or 100% reconstruction is claimed.

The app owns placement, agents using seats, orientation, lighting and any future interactions. No moving chaise, recliner or deformation is implemented. A mirrored L variant would be a separate future design; this group fixes the chaise on the front viewer's right.

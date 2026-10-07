# Stair Baluster - Top Cut Review

Reference image: none (obsolete revision removed). This record describes a past review; use the current gallery for the accepted design.

Review date: 2026-10-06. Scope: dimensions and geometry only.
Result: numeric specification is consistent; TOP CUT DETAIL does not pass
visual review. No source sheet or numeric geometry was modified.

## Numeric checks

Top plane: Z=0.90+0.5X, independent of Y. Its four corners are:

| Corner | X (m) | Y (m) | Z (m) |
| --- | --- | --- | --- |
| Front left | -0.02 | -0.02 | 0.89 |
| Front right | 0.02 | -0.02 | 0.91 |
| Rear right | 0.02 | 0.02 | 0.91 |
| Rear left | -0.02 | 0.02 | 0.89 |

The four corners are coplanar. Adjacent top edges are perpendicular in 3D;
the physical top surface is a rectangle, approximately 44.72136 x 40 mm.
Its horizontal TOP projection is a 40 x 40 mm square. Pitch is
atan(0.5)=26.565051 degrees, matching the handrail and placement reference.
There are two low corners and two high corners; neither pair collapses to
one point. Bottom stays horizontal. No bevel or additional cap is specified.

## Image findings

The detail depicts a near-triangular top with no clearly separated fourth
corner, whereas THREE-QUARTER depicts a four-corner top. A normal unobstructed
oblique view of this planar rectangular cap must preserve four corners. An
edge-on projection would collapse the whole cap to a line, not a triangle.
Do not accept this detail as equivalent to the specified solid.

FRONT rises toward screen-right and BACK reverses that direction, as required.
RIGHT can have a rectangular silhouette because the high end occludes the
lower top edge. TOP and BOTTOM correctly have square footprints. Screen-space
slope alone is not evidence of a geometry error between different oblique views.
These checks do not certify drawing scale or exact camera calibration.

The Top centre label in the detail points at a visible edge. A corrected drawing
should distinguish the face centre from the front-edge midpoint, even though
both have Z=0.90 m at X=0.

## Evidence crops

Unretouched crops from the 1536 x 1024 v2 sheet, enlarged 3x with nearest-neighbour
sampling (magnification does not add source detail):

- cut inspection: source (1265,418)-(1510,590), output 735 x 516.
- quarter inspection: source (1065,173)-(1178,302), output 339 x 387.
- front-back inspection: source (128,174)-(514,289), output 1158 x 345.

Files use `01-stair-baluster-v2-` followed by `cut-inspection.png`,
`quarter-inspection.png` and `front-back-inspection.png`.

Next correction: redraw the detail from the same four-corner plane as the main
oblique view, label both equal-height corner pairs clearly and retain the numeric
specification. Do not change the model dimensions to match the faulty detail.

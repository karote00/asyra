# Park Railing - Geometry Supplement

## Coordinates and authority

Use metres, +Z up, -Y front and +X right. Each unit's origin is the centre of its bottom plane. All JSON box sizes are full X/Y/Z extents, with axis-aligned faces. Apply no rotation or scale. Front, right, back and top look from -Y, +X, +Y and +Z; the oblique view looks from (1,-1,0.8). Numeric specifications control geometry; drawings control the proposed appearance.

## Post

Build the three closed solids in JSON. The shaft is 0.045 square and extends from Z=0 to 0.622. The collar is 0.08 square and extends from 0.620 to 0.652. The spherical finial has radius 0.035, centre Z=0.685 and top Z=0.720. Shaft/collar overlap is 0.002; the sphere penetrates the collar by 0.002. Boolean-union the solids so the finished unit has no internal coplanar or tangent-only connection. The collar is deliberately wider than the sphere, as shown in the selected top view.

Use 48 equally spaced longitude segments and 24 equal latitude intervals for the sphere, with single vertices at its poles. Smooth sphere faces only. Boxes have flat faces, square corners and no added bevel. The bottom is a closed plain square. No baseplate, fasteners, shaft hollowing, mounting holes or hidden decorative parts.

The first generation prompt requested a 0.065 collar. The selected drawing shows the sphere inside the collar footprint, so the final numeric collar is 0.08. This explicit design completion supersedes the initial prompt. The assembled height remains 0.72.

## Panel

Create two horizontal closed boxes, length 0.90 along X, depth and height 0.025. Their centres are (0,0,0.060) and (0,0,0.490). Add exactly five closed square pickets, section 0.018, extending from Z=0 to 0.550 at X=-0.36,-0.18,0,0.18,0.36; all centres lie at Y=0. Boolean-union these seven solids into one unit.

Rail spans are X=-0.45..0.45 and Y=-0.0125..0.0125. Pickets remain behind the rail front/back planes by 0.0035 on each side. Clear horizontal spacing between pickets is 0.162. All ends and picket tops are plain flat caps with no finials. No weld beads or extra brackets. The back is geometrically identical to the front.

The initial prompt placed rails at 0.13 and 0.45. The selected drawing has shorter end overhangs. Final rail centres are 0.060 and 0.490 to retain that appearance; these final values supersede prompt values. Pixel proportions must not override the dimensions.

## Connection reference

For a straight example only, place one panel origin at (0,0,0.06), and two post origins at (-0.4725,0,0) and (0.4725,0,0). Rail end faces then touch shaft side faces at X=+-0.45, with panel top Z=0.61 below the post collar. No overlapping duplicate posts are included in the panel asset. Post and panel remain independent assets; this example does not prescribe app snapping or user layouts.

## Future acceptance

After separate modeling authorization, inspect the five views and underside: post bounds 0.08 x 0.08 x 0.72; panel bounds 0.90 x 0.025 x 0.55; two rails, five pickets; no extra parts; closed surfaces; no internal intersecting faces after union; no baked lighting. Dimensional tolerance is 0.0005 m. No model has been produced or verified in this batch.

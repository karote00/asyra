# Park Railing - Geometry Supplement

## Coordinates and authority

Use metres, +Z up, -Y front and +X right. Each unit's origin is the centre of its bottom plane. All JSON box sizes are default full X/Y/Z extents, with axis-aligned faces and identity rotation and scale. Explicit instance dimensions follow the [shared overall-size contract](../README.md#overall-size-and-appearance---2026-10-09). Front, right, back and top look from -Y, +X, +Y and +Z; the oblique view looks from (1,-1,0.8). Numeric specifications control default geometry; the original drawing supplies the silhouette intent. Review colours are annotations, not default materials.

## Post

Build the three closed solids in JSON. All values below are defaults.

| Part | Full size or diameter (mm) | Centre Z (mm) | Z range (mm) |
| --- | --- | --- | --- |
| Square shaft | 65 x 65 x 614 | 307 | 0 to 614 |
| Square collar | 80 x 80 x 40 | 632 | 612 to 652 |
| Spherical finial | Diameter 70 | 685 | 650 to 720 |

All centres have X=Y=0. Shaft/collar overlap is 2 mm; the sphere penetrates
the collar by 2 mm. Boolean-union the solids so the finished unit has no internal
faces or tangent-only connection. The collar overhangs the shaft by 7.5 mm per
side. In top projection, the 70 mm sphere lies inside the 80 mm square collar,
leaving 5 mm from the circle extrema to the square sides. At Z=652 mm, the
sphere/collar intersection circle has radius sqrt(35^2 - 33^2) = 11.661904 mm.
This contact is distinct from the full 35 mm projected sphere radius.

Use 48 equally spaced longitude segments and 24 equal latitude intervals for the sphere, with single vertices at its poles. Smooth sphere faces only. Boxes have flat faces, square corners and no added bevel. The bottom is a closed plain square. No baseplate, fasteners, shaft hollowing, mounting holes or hidden decorative parts.

The initial prompt and older numeric revision do not define the current post.
The 2026-10-09 revision retains the 80 mm collar width, 70 mm sphere and 720 mm
height, and revises the shaft width and collar thickness to follow the original
silhouette. Original v1 and rejected recolour v2 are not calibrated projections.
Current v3 projects this numeric geometry at 2000 px/m in every view; do not
independently fit or resize individual views. The sphere is projected as an
analytic sphere for the drawing, not as evidence of a completed tessellated mesh.

The three-quarter projection uses normalized screen-right (1,1,0) and normalized
camera direction from the origin (1,-1,0.8). Screen-up is
`normalize(cross(cameraDirection, screenRight))`.
This gives equal projected widths to the two square-shaft faces. The top view
looks along -Z and shows the full 70 mm sphere silhouette inside the 80 mm
collar. The shaft is fully occluded in that view. Use depth ordering to remove
hidden edges at joins; never draw collar rear edges through the sphere.

## Panel

All panel dimensions below are defaults, before the shared overall XYZ size
transform. The unit is one joined infill panel; neither end post is included.

Create two horizontal closed boxes, length 0.90 along X, depth and height 0.025. Their centres are (0,0,0.060) and (0,0,0.490). Add exactly five closed square pickets, section 0.018, extending from Z=0 to 0.550 at X=-0.36,-0.18,0,0.18,0.36; all centres lie at Y=0. Boolean-union these seven solids into one unit.

Rail spans are X=-0.45..0.45 and Y=-0.0125..0.0125. Pickets remain behind the rail front/back planes by 0.0035 on each side. Clear horizontal spacing between pickets is 0.162. All ends and picket tops are plain flat caps with no finials. No weld beads or extra brackets. The back is geometrically identical to the front.

| Default construction item | Dimension or interval (mm) |
| --- | --- |
| Panel bounds X / Y / Z | -450 to 450 / -12.5 to 12.5 / 0 to 550 |
| Each horizontal rail, X x Y x Z | 900 x 25 x 25 |
| Lower rail Z | 47.5 to 72.5 |
| Upper rail Z | 477.5 to 502.5 |
| Each vertical picket, X x Y x Z | 18 x 18 x 550 |
| Picket centre X positions | -360, -180, 0, 180, 360 |
| Picket centre pitch / clear horizontal gap | 180 / 162 |
| Rail-to-rail clear vertical opening | 405 |
| Picket extension below lower rail / above upper rail | 47.5 / 47.5 |
| Rail extension beyond outer picket edges | 81 at each end |
| Picket setback from rail front / back planes | 3.5 / 3.5 |

Each of the ten rail/picket joints is a positive-volume intersection measuring
18 x 18 x 25 mm. Remove internal faces when forming the final surface. Do not
introduce a front-mounted/back-mounted picket offset, weld bead or extra bracket
to imitate ambiguous drawing contours. The default material covers the whole
panel; colour boundaries do not introduce separate geometry.

FRONT and BACK must have identical 900/550 proportions. RIGHT is the projection
of the five aligned pickets into one 18 mm-wide strip, with 25 mm-wide rail
sections at their defined heights. TOP has a 900 x 25 mm envelope: five 18 x
18 mm picket caps are visible within the rail footprint, inset by 3.5 mm on
each depth side. No picket may project beyond that footprint. The upper rail
occludes the lower rail in TOP. Use actual depth ordering in oblique views;
hidden joint edges are not grooves.

The initial prompt placed rails at 0.13 and 0.45. The numeric specification
supersedes those values with 0.060 and 0.490. The original generated sheet does
not accurately establish these positions or the overall aspect ratio; its TOP
also contradicts the depth relationship above. Corrected panel v2 projects the
unchanged numeric specification at 1100 px/m on one 3072 x 2048 sheet. Camera
directions follow the coordinates section; all five views share that scale.
The lower rail is occluded in TOP, and the five caps remain within the upper
rail footprint. Original v1 remains historical visual evidence, not the current
numeric handoff. V2 is approved by the user for commit; no model is verified by the drawing.

## Connection reference

For a straight default example only, place one panel origin at (0,0,0.06), and two post origins at (-0.4825,0,0) and (0.4825,0,0). Rail end faces then touch shaft side faces at X=+-0.45, with panel top Z=0.610 below the collar bottom Z=0.612 by 2 mm. Each post centre is offset from the panel centre by half the panel length plus half the shaft width: 0.45+0.0325=0.4825. Recalculate positions and clearances from final part bounds after resizing; these are not fixed snapping distances. No overlapping duplicate posts are included in the panel asset. Post and panel remain independent assets; this example does not prescribe app snapping or user layouts.

## Future acceptance

After separate modeling authorization, inspect the five views and underside: default post bounds 0.08 x 0.08 x 0.72; default panel bounds 0.90 x 0.025 x 0.55; two rails, five pickets; no extra parts; closed surfaces; no internal intersecting faces after union; no baked lighting. Dimensional tolerance is 0.0005 m at default size. For explicit instance sizes, check transformed bounds, part positions and overlaps against the shared transform. No model has been produced or verified in this batch.

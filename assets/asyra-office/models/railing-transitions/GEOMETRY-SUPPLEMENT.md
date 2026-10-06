# Railing Transitions - Geometry Supplement

## Coordinates and construction

Use metres, +Z up, -Y front and +X right. The stair rises toward +X. Origin is the centre of the bottom footprint. Apply identity rotation and unit scale.

For each post, extrude its ordered XZ polygon across Y=-0.02..+0.02 and close both ends. Each mesh has ten vertices, two pentagonal side faces and five quad strip faces, totaling sixteen triangles when triangulated. Use outward winding and flat face normals. No bevel, subdivision, cavity, hardware, baseplate, cap or extra solid.

Front looks along +Y; back along -Y with screen-horizontal reversal. Right looks along -X, top along -Z, bottom along +Z. The top projection is a square with a geometric face boundary at X=0. That boundary is not a painted stripe or groove.

## Upper transition post

| Polygon vertex | X | Z |
| --- | --- | --- |
| A | -0.02 | 0 |
| B | 0.02 | 0 |
| C | 0.02 | 0.90 |
| D | 0 | 0.90 |
| E | -0.02 | 0.89 |

Overall size is 0.04 x 0.04 x 0.90. The top is Z=0.90+0.5X on the negative-X half, and Z=0.90 on the positive-X half. Both halves extend through the entire Y depth. The bottom is a flat square. The two top faces touch without a gap at X=0.

### Upper post reconstruction checks

- At both Y=-0.02 and Y=+0.02, top heights are 0.89 m at X=-0.02,
  0.90 m at X=0 and 0.90 m at X=+0.02. These six points define both
  rectangular top faces; there is no slope across Y.
- The sloped half has a 0.02 m horizontal run and a 0.01 m rise. Its pitch
  is 26.5650511771 degrees and its inclined length is approximately
  0.0223606798 m. The level half is 0.02 m long. Both are 0.04 m deep.
- The shared top edge runs from (0,-0.02,0.90) to (0,+0.02,0.90).
  This is one continuous solid with a change of slope, not a seam gap,
  raised strip, separate cap or groove.
- FRONT rises on its left half and stays level on its right half; BACK
  reverses this. RIGHT has a 0.04 x 0.90 m rectangular silhouette.
  A strict right orthographic projection does not expose a separate top strip.
- TOP is a 0.04 x 0.04 m square with the slope boundary at X=0;
  BOTTOM is an undivided square. Image detail crops do not reset the Z datum.
- In the upper connection example, the sloped underside is
  Z=0.75+0.5(X+0.30)=0.90+0.5X over X=-0.02..0. The level underside
  is Z=0.90 over X=0..0.02. Both contact their respective post halves
  across the full Y depth, and rail end faces meet at X=0, Z=0.90..0.94.

These checks clarify the existing numeric geometry without changing it.

## Lower transition post

| Polygon vertex | X | Z |
| --- | --- | --- |
| A | -0.02 | 0 |
| B | 0.02 | 0 |
| C | 0.02 | 0.91 |
| D | 0 | 0.90 |
| E | -0.02 | 0.90 |

Overall size is 0.04 x 0.04 x 0.91. The top is Z=0.90 on the negative-X half, and Z=0.90+0.5X on the positive-X half. Both halves extend through the entire Y depth. The bottom is a flat square.

## Rail connection reference

Use the existing rail objects unchanged. Their origins are the midpoint of the bottom edge at the negative-X end. In each example the new post origin is (0,0,0), with all parts unrotated.

| Transition | Sloped rail origin | Level rail origin |
| --- | --- | --- |
| Upper | -0.30, 0, 0.75 | 0, 0, 0.90 |
| Lower | 0, 0, 0.90 | -0.30, 0, 0.90 |

The rails' vertical end faces meet at X=0 from Z=0.90 to 0.94. The post's two top faces match the corresponding rail underside over each half of its 0.04 width. There is surface contact without volume overlap. A rail does not contain a duplicate post.

Translate the entire example vertically to match a particular landing. Rotate all parts about Z together for another direction. These coordinates are a geometry handoff, not runtime placement logic. Rail count, stair layout, collisions, routing and construction interactions belong to the app.

## Appearance and future acceptance

The enlarged front detail is a shape explanation with height annotations, not a scaled engineering projection. Heights refer to the full post's base, even when a detail is cropped. Minor raster line distortion must not change the numerical polygons.

When models are authorized, confirm bounds within 0.0005 m, the two top planes, closed faces, origins and rail-contact coordinates. No model has been generated or verified. These sixteen-triangle solids need no alternative authored LOD mesh. Existing railing specifications are unchanged.

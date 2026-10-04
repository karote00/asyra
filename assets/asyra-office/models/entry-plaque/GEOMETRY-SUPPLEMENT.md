# Entry Wall Plaque - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front and +X right. Origin is the centre of the plate depth at its bottom edge. Apply identity rotation and unit scale. Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. Left matches right geometrically.

Numeric bounds define dimensions and hidden surfaces. The drawing is not a calibrated projection.

## Closed plate

One rectangular box: X=-0.09..0.09, Y=-0.0075..0.0075, Z=0..0.20. Overall size is 0.18 x 0.015 x 0.20.

Eight vertices, six planar quad faces or twelve triangles. Use outward winding and flat face normals. No bevel, subdivision, frame, hole, screw, bracket, recessed back, hollowing or extra part. All hidden faces are plain blue-gray.

## Front markings

Two rectangular intrinsic-color regions lie on the front face at Y=-0.0075:

| Mark | X range | Z range |
| --- | --- | --- |
| Upper | -0.040..0.040 | 0.117..0.133 |
| Lower | -0.040..0.040 | 0.067..0.083 |

Each is 0.080 wide and 0.016 high, centred at Z=0.125 or Z=0.075. They are flush color regions with no mesh thickness, embossing or cutout. All corners are square.

These bars simplify unreadable reference lettering. They are not known words, icons or recovered text. No font or semantic label is implied.

## Placement reference

The back face is Y=+0.0075. To place it against a wall whose exposed face is world Y=0 with the plaque facing -Y, translate the plaque origin to Y=-0.0075. The front then lies at Y=-0.015. The app decides horizontal position and mounting height.

This is only a coordinate example. Hardware, app snapping and editable signage are outside the batch.

## Future acceptance

After modeling authorization, verify bounds within 0.0002 m, plain back, two front-only marks, closed faces and correct origin. No model or export validation has occurred. Twelve triangles suffice for the base plate; no alternate LOD mesh is delivered.

# Level Handrail Corner - Geometry Supplement

## Coordinates and authority

Use metres, +Z up, -Y front and +X right. Origin is the intersection of the two arm centre lines at the bottom plane. This is not the centre of the overall bounding box. Apply identity rotation and unit scale.

Front looks along +Y, back along -Y, right along -X. Top looks along -Z with +X screen-right and +Y screen-up. Bottom looks along +Z with -X screen-right and +Y screen-up, so its silhouette mirrors the top. Left is omitted but fully defined by the geometry.

Drawings are appearance references, not calibrated projections. Use the polygon below for exact dimensions, including the arm lengths.

## One closed L-shaped solid

Extrude this counterclockwise XY polygon from Z=0 to Z=0.04:

| Vertex | X | Y |
| --- | --- | --- |
| A | -0.02 | -0.02 |
| B | 0.30 | -0.02 |
| C | 0.30 | 0.02 |
| D | 0.02 | 0.02 |
| E | 0.02 | 0.30 |
| F | -0.02 | 0.30 |

Overall bounds are 0.32 x 0.32 x 0.04. Both arms have a 0.04 x 0.04 square section. Each end plane is 0.30 from the centre-line intersection. The shared outer corner extends 0.02 behind that intersection on both axes.

The concave inner corner is (0.02,0.02). It is a sharp 90-degree corner, with no radius. Both arms have identical authored lengths even if the perspective sketch foreshortens one.

This is one solid: twelve vertices, six vertical quads and two concave six-vertex end polygons, twenty triangles after valid triangulation. Triangulate each concave polygon into four triangles wholly inside its boundary; never fill the open inner quadrant. Use outward winding and flat face normals. Remove internal faces if using a box-union construction instead.

Top and bottom are horizontal and closed. Two terminal faces are vertical 0.04 x 0.04 squares. No seam, bevel, hollowing, fastener, fitting, plug or separate cap.

## Connection coordinates

Two end-face centres in local coordinates:

- X outlet: (0.30,0,0.02), outward normal +X.
- Y outlet: (0,0.30,0.02), outward normal +Y.

For one optional level placement example:

- Corner origin: (0,0,0.90).
- Existing landing post origin: (0,0,0). Its full square top touches the corner underside.
- Existing straight rail A origin: (0.30,0,0.90), rotation Z=0.
- Existing straight rail B origin: (0,0.30,0.90), rotation Z=90 degrees.
- All rail tops are Z=0.94. End faces meet without volumetric overlap.
- Rotate the entire configuration by multiples of 90 degrees for other corner orientations; do not create separate mirrored catalogue objects.

The post and straight rails remain independent assets. These coordinates explain geometry only. App placement, counts, collisions and lighting are not implemented. Sloped corners are outside this batch.

## Future acceptance

After model authorization, verify bounds within 0.0005 m, equal arms, the open inner quadrant, origin, closed faces and port coordinates. Twenty triangles suffice; no alternative authored LOD meshes are included. No model or export validation has been performed.

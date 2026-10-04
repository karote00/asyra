# Shop Awning - Geometry Supplement

## Coordinates and authority

Use metres, +Z up, -Y front and +X right. The rear mounting plane is Y=0. The awning projects toward negative Y. Origin is X=0, Y=0, Z=0, where Z=0 matches the front valance's bottom elevation. Apply identity rotation and unit scale.

Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. For the sheet convention, right view shows rear on the left and front on the right; bottom mirrors the top in screen X. Drawings are uncalibrated appearance references.

## Closed thin shell

Extrude this ordered YZ polygon from X=-1 to X=+1:

| Vertex | Y | Z |
| --- | --- | --- |
| A | -0.80 | 0 |
| B | -0.78 | 0 |
| C | -0.78 | 0.1075 |
| D | 0 | 0.40 |
| E | 0 | 0.42 |
| F | -0.80 | 0.12 |

Close the two narrow side profiles. The area under the canopy remains open; do not fill it with a triangular wedge or add fabric side curtains.

Canopy upper plane: Z=0.42+0.375Y. Lower plane: Z=0.40+0.375Y, up to its intersection with the valance's rear face at Y=-0.78. Vertical canopy thickness is 0.02; thickness normal to the slope is 0.02/sqrt(1+0.375^2), approximately 0.018727. Front valance extends from Z=0 to Z=0.12 at Y=-0.80, with depth 0.02.

Overall bounds: X=-1..1, Y=-0.80..0, Z=0..0.42. The upper plane drops 0.30 over a projection of 0.80. The valance has a straight horizontal bottom, with no scallops or fringe.

Base topology: twelve vertices, two concave six-vertex side faces and six quad strips. Triangulate the concave polygons inside their boundary, without filling the open wedge. Twenty triangles suffice before any optional material-boundary splits. All normals point outward; use flat face normals. No bevel or subdivision.

## Eight continuous stripes

Apply the local-X color rule in the surface document to the entire shell. Stripe boundaries do not create grooves, gaps or separate fabric pieces. A single unit always includes all eight stripes.

The rear and underside can show reversed color order because the viewer is on the opposite side. Do not reverse the object's color mapping itself. At X=-1 the side profile is blue; at X=+1 it is ivory.

## Placement reference

The rear edge contacts a hypothetical wall at Y=0. If the awning origin is translated to world Z=h, its front valance bottom is at h and rear upper edge at h+0.42. This is an attachment coordinate reference, not implemented mounting behavior.

No mounting hardware is inferred from the occluded source. The app owns placement, resizing policy, visibility and lighting. This static reference does not include cloth simulation, retracting, hinges or animation.

## Future acceptance

After model authorization, verify bounds within 0.001 m, the open underside, closed thin shell, stripe count and continuity, square ends and straight valance. No model or export validation has occurred. Alternate LOD meshes are outside this handoff.

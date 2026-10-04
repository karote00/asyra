# Red Clay Paver - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front and +X right. Origin is the bottom footprint centre. Apply identity rotation and unit scale. Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. Left is geometrically identical to right.

Numeric dimensions define reconstruction. The sheet's bevel lines are enlarged for readability and must not override the 0.001 m offset.

## Solid and chamfers

Overall extents: X=-0.10..0.10, Y=-0.05..0.05, Z=0..0.06. Start from a solid 0.20 x 0.10 x 0.06 box. All twelve edges have a straight one-segment 45-degree chamfer with a 0.001 offset measured on each adjacent original face. There is no rounded fillet or subdivision.

For deterministic corner construction, use centred coordinates with half-extents a=0.10, b=0.05, c=0.03 and d=0.001. For every sign triple (sx,sy,sz), create these three vertices:

- (sx*a, sy*(b-d), sz*(c-d))
- (sx*(a-d), sy*b, sz*(c-d))
- (sx*(a-d), sy*(b-d), sz*c)

Then add (0,0,0.03) to each vertex. Build the convex hull. It has twenty-four vertices, six rectangular main faces, twelve quad edge strips and eight triangular corner patches. Total: twenty-six polygon faces, forty-four triangles. Use outward winding and flat face normals.

This construction leaves the overall extents unchanged. Top and bottom central flats are 0.198 x 0.098. Front and back flats are 0.198 x 0.058. Side flats are 0.098 x 0.058. All hidden surfaces are closed and use the same material.

No recess, frog, hollow cavity, hole, chipped edge, logo, lettering, mortar joint or separate underside structure. The brick is one solid.

## Placement reference

Edge-to-edge copies can be translated by (0.20,0,0) or (0,0.10,0). Chamfers produce a small edge relief without requiring extra gap geometry. The app or user decides wider gaps, row offsets, rotations and paving patterns. No fixed array or grout is part of the asset.

Road paint must remain independently placeable and must never acquire a red-brick backing. This handoff does not define paint placement over joints or implement overlays.

## Future acceptance

When modeling is authorized, verify bounds within 0.0002 m, the one-millimetre chamfers, closed bottom, outward normals and single-unit boundary. No model, export or runtime validation has been performed. The specified base mesh is small; separate LOD meshes are not delivered here.

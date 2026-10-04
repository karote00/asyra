# Pencil Eraser - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front and +X right. Origin is the bottom footprint centre. Apply identity rotation and unit scale. Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. Left matches right geometrically.

The drawings communicate appearance. Numerical dimensions and construction define hidden geometry; do not measure raster pixels.

## Closed chamfered solid

Overall size: 0.050 x 0.020 x 0.012. Bounds: X=-0.025..0.025, Y=-0.010..0.010, Z=0..0.012. Each of the twelve original box edges has a straight 45-degree chamfer, with 0.001 offset on each adjacent face. No rounded fillet or subdivision.

For exact construction, let a=0.025, b=0.010, c=0.006, d=0.001. At each sign triple (sx,sy,sz), form three vertices:

- (sx*a, sy*(b-d), sz*(c-d))
- (sx*(a-d), sy*b, sz*(c-d))
- (sx*(a-d), sy*(b-d), sz*c)

Add (0,0,0.006) to every vertex, then build the convex hull. This defines twenty-four vertices, six rectangular main faces, twelve quad bevel strips and eight triangular corner patches. Triangulation produces forty-four triangles. Use outward winding and flat face normals.

Top and bottom main flats are 0.048 x 0.018. Front and back main flats are 0.048 x 0.010. Side main flats are 0.018 x 0.010. Every surface is closed and uses the same ivory material.

No hidden recess, logo, wrapper, separate cap, hollowing, felt pad or handle. The chamfer does not change the overall bounding dimensions.

## Placement and future acceptance

The bottom plane is Z=0. Placing the origin at a desktop's surface elevation makes the eraser rest on its flat bottom. Counts, rotation, placement and interactions belong to the app.

When models are authorized, verify bounds within 0.0001 m, chamfer construction, closed faces and single-unit boundary. No reconstruction or export validation has occurred. Wear, deformation, crumbs, erasing animation and alternate LOD meshes are outside this handoff.

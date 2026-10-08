# Garden Masonry - Geometry Supplement

## Coordinates and units

Metres, +Z up, -Y front and +X right. Each origin is centred on its bottom bounding rectangle. Full extents and centres are in JSON. Front/right/back/top look from -Y/+X/+Y/+Z; use an oblique view from (1,-1,0.8). These describe the default units, with identity rotation and unit scale. Explicit
instance sizes follow the [shared sizing rule](../README.md#overall-size-and-appearance---2026-10-09):
scale the complete default solid about its authored origin before surface mapping
and world placement. The default equal-offset chamfers scale with it; independent
axis scaling need not retain equal offsets or 45-degree edge angles.

## Exact chamfer definition

For each asset, work first in centred coordinates q=(x,y,z-height/2). Let half-extents be h=(width/2,depth/2,height/2), and c the specified chamfer distance. The solid is the intersection of the following half-spaces:

- For each axis i: abs(q_i) <= h_i.
- For each distinct pair i,j: abs(q_i)+abs(q_j) <= h_i+h_j-c.
- At the corners: abs(q_x)+abs(q_y)+abs(q_z) <= h_x+h_y+h_z-2*c.

Expand each absolute-value inequality into its signed linear planes and retain their common convex volume. This yields six principal faces, twelve planar edge chamfers and eight triangular corner faces. It preserves the outer bounding dimensions. Use flat face normals and triangulate each convex face with a consistent winding and fan if needed. Do not add a second bevel, rounded subdivision, displacement or edge erosion.

## Masonry block

Size 0.30 x 0.18 x 0.14, centre (0,0,0.07), chamfer 0.006. Bottom Z=0, top Z=0.14. The object is one solid stone, with no scored mortar lines, multiple brick subdivisions, holes or recessed back. All faces, including underside and ends, use warm grey stone.

## Coping slab

Default size 0.32 x 0.22 x 0.055, centre (0,0,0.0275), chamfer 0.003. Default bottom Z=0, top Z=0.055. Top is broad and flat, without a ridge or drainage slope. Underside is flat with the same edge treatment; no drip groove, attachment sockets or hidden supports. All faces use cream limestone by default, with colour and material replaceable under the shared contract.

This preset uses the same chamfered-box construction as the masonry block.
At default size the principal top and bottom faces measure 0.314 x 0.214;
the principal vertical faces have height 0.049. The chamfer offsets are
construction defaults, not fixed-width details after independent axis scaling.

## Fit reference and placement boundary

For a single-block fit illustration only, put the block at (0,0,0) and coping at (0,0,0.14). Their bounding footprints give 0.01 overhang on each X side and 0.02 on each Y side. Chamfers leave small geometric recesses along edges. This is not a combined asset, fixed wall layout or structural installation specification.

The two default lengths differ intentionally. Explicit length/width/height overrides
are supported by the shared rule; do not resize a unit without such a request
merely to force a repeating layout. Recalculate fit, overhang and placement from
the final bounds instead of retaining the default 10/20 mm overhangs. The app
controls spacing, counts and bond pattern; no automatic joint fitting or mortar
is introduced.

## Views and future acceptance

Front/back match; right/left match; top/bottom have the same plan silhouette. The generated drawings may show slightly elevated elevations and exaggerated thin chamfers; numerical geometry is authoritative. A drawn light edge is not a separate material stripe.

After separate modeling authorization, inspect five views plus underside. At default size, check bounds within 0.0005 m and exact chamfer planes.
For explicit instance sizes, check the transformed bounds and correspondingly
transformed chamfer planes. In both cases check one closed convex stone per asset, no duplicate/internal faces or assembly geometry, and no baked lighting. No models have been produced or verified in this batch.

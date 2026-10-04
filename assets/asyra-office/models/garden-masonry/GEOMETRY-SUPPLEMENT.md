# Garden Masonry - Geometry Supplement

## Coordinates and units

Metres, +Z up, -Y front and +X right. Each origin is centred on its bottom bounding rectangle. Full extents and centres are in JSON. Front/right/back/top look from -Y/+X/+Y/+Z; use an oblique view from (1,-1,0.8). No rotation or scale is baked into these units.

## Exact chamfer definition

For each asset, work first in centred coordinates q=(x,y,z-height/2). Let half-extents be h=(width/2,depth/2,height/2), and c the specified chamfer distance. The solid is the intersection of the following half-spaces:

- For each axis i: abs(q_i) <= h_i.
- For each distinct pair i,j: abs(q_i)+abs(q_j) <= h_i+h_j-c.
- At the corners: abs(q_x)+abs(q_y)+abs(q_z) <= h_x+h_y+h_z-2*c.

Expand each absolute-value inequality into its signed linear planes and retain their common convex volume. This yields six principal faces, twelve planar edge chamfers and eight triangular corner faces. It preserves the outer bounding dimensions. Use flat face normals and triangulate each convex face with a consistent winding and fan if needed. Do not add a second bevel, rounded subdivision, displacement or edge erosion.

## Masonry block

Size 0.30 x 0.18 x 0.14, centre (0,0,0.07), chamfer 0.006. Bottom Z=0, top Z=0.14. The object is one solid stone, with no scored mortar lines, multiple brick subdivisions, holes or recessed back. All faces, including underside and ends, use warm grey stone.

## Coping slab

Size 0.32 x 0.22 x 0.055, centre (0,0,0.0275), chamfer 0.003. Bottom Z=0, top Z=0.055. Top is broad and flat, without a ridge or drainage slope. Underside is flat with the same edge treatment; no drip groove, attachment sockets or hidden supports. All faces use cream limestone.

## Fit reference and placement boundary

For a single-block fit illustration only, put the block at (0,0,0) and coping at (0,0,0.14). Their bounding footprints give 0.01 overhang on each X side and 0.02 on each Y side. Chamfers leave small geometric recesses along edges. This is not a combined asset, fixed wall layout or structural installation specification.

The two lengths differ intentionally. Do not silently stretch individual units or add mortar to force a repeating layout. Future app controls decide spacing, counts, bond pattern and any separately authorized length variants.

## Views and future acceptance

Front/back match; right/left match; top/bottom have the same plan silhouette. The generated drawings may show slightly elevated elevations and exaggerated thin chamfers; numerical geometry is authoritative. A drawn light edge is not a separate material stripe.

After separate modeling authorization, inspect five views plus underside. Check bounds within 0.0005 m, exact chamfer planes, one closed convex stone per asset, no duplicate/internal faces or assembly geometry, and no baked lighting. No models have been produced or verified in this batch.

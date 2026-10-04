# Street Details - Geometry Supplement

## Coordinates and construction

Metres, +Z up, -Y front, +X right. Origin is the post axis on the flat bottom plane. Box dimensions are full X/Y/Z extents. All primitives are axis-aligned. Cylinders run along Z, with 64 perimeter samples and closed planar ends. Spheres use 64 longitude segments and 32 latitude intervals, with single pole vertices. Smooth curved surfaces; flat box faces and cylinder caps. No extra bevels. Union overlapping solids within each asset to remove internal faces.

## Street sign

Shaft section is 0.045 square, Z=0..1.582. Collar section is 0.052 square, Z=1.580..1.596. Finial radius is 0.030 at Z=1.620, reaching Z=1.650. Its bottom penetrates the collar by 0.006. Everything is charcoal, including the finial.

Both boards occupy the same X/Y footprint. They are centred at Z=1.390 and 1.160. Each has height 0.180, thickness 0.018, and spans X=0.0205..0.5025. The first 0.002 lies inside the shaft; the exposed width from the shaft side X=0.0225 is exactly 0.480. Boards have no arrow tips, rim, back brackets, fasteners, recesses or separate backing layers. The back is blank charcoal.

The first prompt said board left edges at the post centre; final drawings place exposed edges at the post side. The inserted-root construction above is the final decision. The first prompt also requested a light border; the selected corrected sheet has plain unbordered plaques. No border is part of this proposal.

In overhead projection the two boards coincide, so only one thin extension is visible. In back view the boards appear to the viewer's left. Right view shows two thin vertical plate edges. All bottom and top surfaces are closed.

## Bollard

Shaft radius 0.0225, Z=0..0.404. Collar radius 0.029, Z=0.400..0.421. Finial radius 0.0325 at Z=0.4475, spanning 0.415..0.480. Overlaps create actual joined solids. The bottom is plain and flat; do not invent anchors, holes, a baseplate, reflective stripes or hollow interiors.

Front/right/back silhouettes are identical. In top view the largest spherical finial hides the collar and shaft completely, forming one disk, with no visible concentric collar circle.

## Letter construction

JSON includes explicit stroke polylines for every non-space character. Each point is (u,v), with u right and v up. Sweep each polyline in 2D with width 0.065 glyph units, round joins and round endcaps, then union overlapping strokes. Advance each non-space character by 0.8 units and spaces by 0.45. Preserve case.

Compute the complete stroked bounds of each line. Uniformly scale to fit width 0.380 and height 0.085, choosing the smaller scale factor. Centre those bounds at X=0.2625 and the corresponding board centre Z. Map u to X and v to Z. Apply as a flat front material mask at Y=-0.009; no separate coplanar geometry or letter extrusion. Front words are Maple St and Riverside, upper then lower. Backs remain blank.

The generated sans-serif lettering is illustrative; numeric rounded stroke lettering is the portable reconstruction authority and requires no external font. It is an authored approximation, not an exact recovery of the reference typeface.

## Future model acceptance

After separate modeling authorization, inspect all five views plus undersides. Check the bounds in JSON within 0.0005 m, two boards only, correct wording/order, one visible board edge in top projection, fully dark finials, closed surfaces and no internal overlapping faces after union. Neither asset has been modeled or verified in this batch. Placement, collision, navigation and interaction are app responsibilities.

# Accent Furniture - Geometry Supplement

## Shared coordinates

Metres, +Z up, -Y front, +X right. Origin is the centre of the footprint at Z=0. Sizes are full X/Y/Z extents; primitive centres and endpoints are in asset coordinates. Front/right/back/top look along +Y/-X/-Y/-Z respectively. Use an oblique view from (1,-1,0.8). Drawings may show slightly elevated front views; do not infer slopes from these.

## Square low stool

The [square low stool contract](SQUARE-LOW-STOOL-SPEC.md) owns the complete
construction and LOD rules. All original dimensions remain: 360 x 360 x 300 mm,
one radius 35 mm rounded cushion, four vertical 35 mm square legs at XY=+-125 mm.
Source legs reach Z=175 mm, embedding 15 mm into the cushion beginning at 160 mm.
Every leg cap stays inside the planar underside with 2.5 mm margin.

The revised handoff makes the clipped exterior explicit: remove four holes from
the flat underside, trim hidden leg sides/tops, and stitch the four leg rims to
those holes into one closed exterior with five replaceable surface regions.
The underside has 26 triangles without extra vertices, not two triangles covering
the leg contacts. No legs, caps, seams, rails or support blocks are added.

Use normalized barycentric corner grids and matching atan2 edge samples under
the new LOD contract, replacing the earlier equal-angle sampling instruction.
Preserve exact outer bounds and ground contacts. Source drawings remain
illustrative; no model or rendered likeness has been verified.

## Pedestal side table

The [pedestal side table contract](PEDESTAL-SIDE-TABLE-SPEC.md) defines the
shared exposed union profile and LOD sampling. Original external dimensions
remain: 420 mm top diameter, 440 mm height, 35 mm column diameter and 250 mm base
diameter. The top has 3 mm straight chamfers; the base has 2 mm straight chamfers.
The construction column embeds 3 mm into the base and 6 mm into the top.

Revolve the complete exposed profile using identical ring angles and segment
counts, including the column and both disk openings. LOD0 uses 96 segments
throughout, superseding the original 64-segment column. Remove hidden column
caps and covered disk centres. Retain one closed shell and independently
replaceable top, column and base regions. No flange or additional support.

The plain circular base remains the selected completion of the partly hidden
source. Front/right/back geometry is rotationally symmetric; TOP hides the base
and column. The original image is unchanged. Future model verification remains
required; analytic document checks do not certify rendered likeness.

## Future acceptance

After separate modeling authorization: verify dimensions within 0.0005 m, exactly four stool legs, no unintended seam geometry, one round tabletop/pedestal/base, continuous joined exteriors without overlapping faces, closed undersides and correct materials. Inspect all five views plus the underside. No models have been created or verified now. The app owns placement, seating interactions, collisions and scene lighting.

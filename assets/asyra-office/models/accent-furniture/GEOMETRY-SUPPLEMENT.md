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

Revolve the JSON tabletop profile around Z with 96 angular segments. Each pair is (radius,Z), in order. Close the profile back to its first point, collapse radius-zero rings to single centre vertices and join matching rings. The resulting disk has diameter 0.42, bottom Z=0.412, top Z=0.440 and 0.003 straight edge chamfers. Do not add a rim or slope to its central flat surface.

The pedestal is a closed cylinder radius 0.0175 from Z=0.015 to 0.418 with 64 perimeter segments. Revolve the base profile with 96 angular segments: maximum diameter 0.25, Z=0..0.018, edge chamfer 0.002. Join pedestal and base by solid union. At the wood contact, keep the material boundary at Z=0.412 and remove covered surfaces; no hidden upper plate or screws are needed. Both visible pedestal and base are dark metal.

The source does not fully resolve the base. A simple circular base is the explicitly selected completion, approved for this reference handoff. No tripod, cross feet, floor protector or underside recess.

Top projection shows only the wooden circle; the smaller base and pedestal are fully hidden. Front/right/back have identical geometry. The wood grain direction distinguishes their surface appearance only.

## Future acceptance

After separate modeling authorization: verify dimensions within 0.0005 m, exactly four stool legs, no unintended seam geometry, one round tabletop/pedestal/base, continuous joined exteriors without overlapping faces, closed undersides and correct materials. Inspect all five views plus the underside. No models have been created or verified now. The app owns placement, seating interactions, collisions and scene lighting.

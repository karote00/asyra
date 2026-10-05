# Accent Furniture - Geometry Supplement

## Shared coordinates

Metres, +Z up, -Y front, +X right. Origin is the centre of the footprint at Z=0. Sizes are full X/Y/Z extents; primitive centres and endpoints are in asset coordinates. Front/right/back/top look along +Y/-X/-Y/-Z respectively. Use an oblique view from (1,-1,0.8). Drawings may show slightly elevated front views; do not infer slopes from these.

## Square low stool

One orange rounded box has bounds X/Y=-0.18..0.18, Z=0.16..0.30. Radius is 0.035 on all twelve edges. Define this surface as the Minkowski sum of a centred box of size (0.29,0.29,0.07) and a sphere of radius 0.035, then translate to Z=0.23. This defines planar centre regions, quarter-cylinder edges and spherical corners without scaling drift. Use eight equal angular intervals per quarter circle; preserve the exact outer bounds. No sculpted bulge, piping, button, seam, extra layer or indentation.

Four straight square wooden legs have centres X/Y=+-0.125, section 0.035, and run from Z=0 to 0.175. Each penetrates the cushion underside by 0.015 within its planar underside region. Legs are vertical, not splayed. No bevel, rail, stretcher, upholstery fastener or additional support block.

Treat legs and cushion as separate material parts of one placeable unit. Clip each leg at Z=0.16 for the visible exterior and remove covered contact faces when creating a unified watertight exterior; preserve the orange underside outside the four contact footprints. The untrimmed overlap coordinates specify the fit and do not authorize visible duplicate surfaces. Leg bottoms are plain dark wood.

Front/back/right silhouettes match; two rear legs are occluded in exact orthographic front/right views. Top shows only the rounded square cushion. Oblique view can reveal all four legs, with the far leg partially occluded.

## Pedestal side table

Revolve the JSON tabletop profile around Z with 96 angular segments. Each pair is (radius,Z), in order. Close the profile back to its first point, collapse radius-zero rings to single centre vertices and join matching rings. The resulting disk has diameter 0.42, bottom Z=0.412, top Z=0.440 and 0.003 straight edge chamfers. Do not add a rim or slope to its central flat surface.

The pedestal is a closed cylinder radius 0.0175 from Z=0.015 to 0.418 with 64 perimeter segments. Revolve the base profile with 96 angular segments: maximum diameter 0.25, Z=0..0.018, edge chamfer 0.002. Join pedestal and base by solid union. At the wood contact, keep the material boundary at Z=0.412 and remove covered surfaces; no hidden upper plate or screws are needed. Both visible pedestal and base are dark metal.

The source does not fully resolve the base. A simple circular base is the explicitly selected completion, approved for this reference handoff. No tripod, cross feet, floor protector or underside recess.

Top projection shows only the wooden circle; the smaller base and pedestal are fully hidden. Front/right/back have identical geometry. The wood grain direction distinguishes their surface appearance only.

## Future acceptance

After separate modeling authorization: verify dimensions within 0.0005 m, exactly four stool legs, no unintended seam geometry, one round tabletop/pedestal/base, continuous joined exteriors without overlapping faces, closed undersides and correct materials. Inspect all five views plus the underside. No models have been created or verified now. The app owns placement, seating interactions, collisions and scene lighting.

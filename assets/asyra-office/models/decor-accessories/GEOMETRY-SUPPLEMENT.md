# Decor Accessories - Geometry Supplement

## Shared coordinates

Metres; +Z up, -Y front, +X right. Size arrays use X/Y/Z unless specified otherwise. Origin is at the centre of the bottom edge, not at the wall anchor. Front/right/back/top camera directions are -Y/+X/+Y/+Z; oblique is (1,-1,0.8). Bevels are inward and do not expand bounds. All components stay in one unit coordinate system.

## Fabric hanging

The rectangular cloth occupies X=-0.18..0.18 and Z=0..0.44. Its middle surface is Y=-0.0105+0.002*sin(2*pi*(X/0.36+0.5))*sin(pi*Z/0.44). Sample 72 equal X intervals and 88 equal Z intervals, form quads and triangulate each from lower-left to upper-right. Front/back surfaces offset Y by -/+0.0005 respectively; connect all border edges to make a closed thin solid. Smooth normals on broad faces. This is a fixed shallow ripple, not simulated fabric. No fringe, folds added by randomness, separate tassels or attached artwork.

A hollow fabric sleeve runs along X=-0.18..0.18, around the X-axis line Y=0,Z=0.44. Inner radius 0.0085, outer radius 0.0105, 64 radial segments. Annular end faces leave both holes open. Union only the sleeve and cloth where they meet at the sleeve's front tangent; remove hidden intersecting faces. Do not cap the sleeve holes or union the dowel into the fabric. The cylinder remains ivory, with the same cloth material.

The oak dowel is a capped X-axis cylinder, centre (0,0,0.44), radius 0.008, length 0.42, 64 radial segments. Round end rims inward by 0.001 with three bevel segments. Its ends extend 0.03 beyond each cloth edge. No finials, knobs, mounting screws or wall hook.

The tan suspension cord is a circular tube of radius 0.0015 along the polyline (-0.20,0,0.448), (0,0,0.56), (0.20,0,0.448). Use 16 radial segments, a continuous miter join at the apex and capped ends. Ends slightly intersect the rod top to represent attachment; no unmodeled knot or fastening hardware is required. This static visual joint is an authored simplification. The app's mounting anchor is (0,0,0.56), while the asset origin remains (0,0,0).

The front sage band is a flat colour mask over the full cloth width, Z=0.03..0.07. Back, sleeve, narrow edge faces and the rest of the cloth remain ivory. A hem is implied by this ivory lower margin and the surface weave; do not add thick piping. The approximate envelope includes cord thickness; build exact components rather than scaling the drawing to the nominal depth.

## Closed book

Book front cover faces -Y, with spine on its left at negative X. Two cover boxes have size (0.125,0.002,0.18), centres (0,-0.013,0.09) and (0,0.013,0.09). Bevel inward 0.001 with three segments. Blue spine is an extruded half-ellipse cross-section: X=-0.0565-0.006*cos(t), Y=0.014*sin(t), t=-pi/2..pi/2 sampled in 48 equal intervals, closed by the straight chord at X=-0.0565. Extrude Z=0..0.18 and cap both ends, with end-rim bevel 0.001 and three segments. Union covers and spine into one closed blue binding shell; keep the page block separate. This rounded binding profile is an authored completion. Add one shallow front hinge groove by subtracting a Z-axis cylinder centred X=-0.051,Y=-0.0148, radius 0.001, spanning Z=0..0.18, with 32 radial segments. It cuts only 0.0002 into the front face. No matching back groove, embossed title or decorative ribs.

The cream page block is one box size (0.116,0.024,0.174), centre (0.0015,0,0.09), bevel 0.0004 with two segments. It occupies X=-0.0565..0.0595, Y=-0.012..0.012, Z=0.003..0.177. It meets the binding on the left; covers overhang the fore-edge by 0.003 and top/bottom by 0.003. Cream paper is visible from the right, top and bottom only. No individual loose sheets, interior printing or open-book model.

Broad front/back cover surfaces are plain blue. The page marks are intrinsic colour masks, not extra grooves or geometry. Keep the spine left in front view; the apparent handedness reverses in back view because the camera moves. Do not generate a second mirrored book.

## Future model acceptance

No models have been built or verified. After separate modeling authorization, compare front, side, rear, top, oblique and underside views. Confirm one hanging with open sleeve ends, dowel and triangular cord, front-only green band and plain back; confirm one closed book with blue front/back/spine and three exposed cream page edges. Check exact part dimensions within 0.001 m; approximate envelopes are not scaling targets. No baked shadows or lighting. Appearance approval and later geometry verification remain separate.

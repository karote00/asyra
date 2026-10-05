# Textiles - Geometry Supplement

## Coordinates and units

Use metres and X/Y/Z size order, +Z up and -Y front. Rug origin is the bottom-face centre at Z=0; pillow origin is its lowest point below the volume centre. All objects are independent closed meshes. Material boundaries do not introduce extra thickness. JSON owns exact numbers; generated view extents are not calibrated dimensions.

## Rectangular rug

A rounded XY rectangle spans X=-0.70..0.70 and Y=-0.475..0.475 with plan corner radius 0.025. Extrude from Z=0 to 0.008. Use 12 segments per quarter circle. Bevel the top and bottom perimeter inward by 0.001 with three segments, without expanding bounds. The planar top and underside remain flat. There is no hidden floor, underlay, tassel, grass or displaced pile.

Top colour is sage, except the 0.012 m binding band. Its inner boundary is the centred rounded rectangle 1.376 x 0.926 m with corner radius 0.013. Points outside that boundary use the darker sage binding colour. The top bevel and side faces also use binding; the flat underside is tan backing with an outer binding band matching the top boundary. The band is a colour/material region on the same surface, not an added lip or stitched cord. Bottom perimeter bevel uses binding. Straight edges and corners have the same thickness.

## Round rug

A Z-axis cylinder radius 0.60 spans Z=0..0.008. Use 192 circumferential segments. Bevel top and bottom circular edges inward by 0.001 with three segments; do not increase diameter or thickness. The top is flat lavender. Its outer band begins at radius 0.575, so nominal binding width is 0.025. The top bevel and side faces use darker lavender binding. The flat bottom is tan backing inside radius 0.575 and binding outside it; bottom bevel uses binding. No additional concentric rings, woven spiral, scallops or fringes.

The true top and bottom outlines are circles. Elliptical perspective in an oblique drawing does not change geometry. Front and right profiles are identical thin strips. Use geometry for edge curvature, never a dark outline texture to imitate thickness.

## Throw pillow

Model two inflated radial surface patches, centred at (0,0,0.16), sharing a closed seam outline. JSON supplies eight cubic Bezier segments in the X/Z plane relative to that centre. Long side segments curve inward slightly; corner segments turn smoothly between them. Each cubic is B(t)=(1-t)^3*P0+3*(1-t)^2*t*P1+3*(1-t)*t^2*P2+t^3*P3 for t=0..1. Adjacent curves share endpoints. This defines the gently concave edges and fuller corners seen in the drawing.

For each outline point (Bx,Bz), each radius r=0..1 and each side sign (-1 front, +1 back), create X=r*Bx, Z=0.16+r*Bz, Y=sign*0.055*sqrt(1-r*r). Use 24 intervals per outline curve and 32 radial intervals sampled at r=sin(pi*j/64), j=0..32. Collapse each patch centre to one vertex, weld adjacent curve endpoints and share a single boundary ring at r=1. The two surfaces form one closed volume, with smooth normals and no separate inflated insert. Do not add a subdivision modifier that changes bounds.

Exact extrema are X +/-0.16, Y +/-0.055 and Z=0..0.32. Front and back have the same shape and material. The inward side curves distinguish the cushion from a convex rounded block. There is no opening, zipper, button, piping cord, label, diagonal crease or asymmetric sag.

The seam is a narrow self-coloured material region on the existing surface where abs(Y)<=0.00075. It follows the perimeter at the middle of the thickness. Do not add a torus, dark recess, raised cord or additional thickness. This is an authored simple seam, not measured tailoring. Pillow is undeformed and upright for documentation; the app will choose placement and orientation.

## Camera directions and hidden faces

Rugs: top from +Z, front from -Y, right from +X, bottom from -Z, oblique from (1,-1,0.8), aimed at volume centre. Pillow: front from -Y, right from +X, back from +Y, top from +Z and the same oblique direction. Pillow bottom is fixed by vertical symmetry; left is fixed by X symmetry. Rug views may magnify thickness for legibility, but model thickness stays 0.008 m.

## Future model checks

After separately authorized modeling, verify closed geometry, one unit per file, bounds and origins, 8 mm rug thickness, single binding bands, plain backing, a single pillow volume and seam, no baked shading and no furniture/ground geometry. Rug size tolerance is 0.0005 m; pillow tolerance is 0.001 m. Compare all sheet directions plus hidden surfaces. These are future acceptance criteria; no models or model checks have been run in this batch.

# Tea Furniture - Geometry Supplement

## Coordinates

Metres, +Z up, -Y front; X/Y/Z dimensions. Origins are ground-level footprint centres. Front camera is -Y, right +X, back +Y, top +Z and oblique (1,-1,0.8), aimed at each object's centre. Use inward bevels and smooth normals without expanding nominal bounds. Generated perspective and partial occlusion do not imply a different support count.

## Round tea table

Top is a filled Z-axis cylinder radius 0.34, Z=0.545..0.580, with 128 radial segments. Bevel both circular edges by 0.006 with four segments. Top and underside are closed wood faces. No extra ring, inset disc or central hole.

The underside apron is a square frame of four rails. Front/back rails: size 0.39 x 0.025 x 0.06, centres (0,+/-0.1825,0.515). Side rails: size 0.025 x 0.34 x 0.06, centres (+/-0.1825,0,0.515). Their ends meet without gaps; bevel 0.002 with three segments. The apron top is flush with the tabletop underside at Z=0.545. Empty space remains between its rails; there is no solid slab filling the frame.

For each sign pair sx/sy in +/-1, one tapered leg joins bottom centre (sx*0.22,sy*0.22,0), radius 0.017, to top centre (sx*0.16,sy*0.16,0.545), radius 0.022. End rings stay parallel to the XY plane so the feet contact the floor evenly. This is a sheared frustum, not a rotated cone with an angled floor contact. With t=0..1, interpolate the centre and radius linearly; ring point is C(t)+(R(t)*cos(phi),R(t)*sin(phi),0). Use 48 circumference segments, close both caps and bevel end edges inward by 0.002 with three segments. The concealed leg/apron overlaps are intentional. Exactly four legs, no fifth support or exposed fasteners.

Overall bounds X/Y +/-0.34, Z=0..0.58. This taller tea table is distinct from the low front-lounge coffee table. Do not attach mugs or decor to its geometry.

## Orange tea chair

The continuous shell is an elliptical annular sector over theta=-120..+120 degrees, using X=rx*sin(theta),Y=ry*cos(theta). Outer radii are (0.22,0.23), inner radii (0.17,0.18). Zero angle faces rear +Y; open front faces -Y. Bottom height is Z=0.235. Top height is 0.39+0.26*(1-(abs(theta)/120)^1.6). Thus rear centre reaches 0.65 and the short arm ends reach 0.39. Use 120 angular intervals, connect inner and outer surfaces at their top/bottom and close both radial end caps. It is a real thick U-shaped shell, not a solid bucket blocking the seating area. Bevel edges inward 0.012 with four segments.

Seat base is a rounded XY rectangle width 0.36, depth 0.35, centre (0,-0.015), Z=0.205..0.255; plan radius 0.07 and edge bevel 0.008 with three segments. Cushion is width 0.36, depth 0.39, centre (0,-0.035), Z=0.255..0.33, plan radius 0.07 and edge bevel 0.025 with four segments. Sample each plan corner with twelve intervals. Keep the cushion as one component. It meets the shell and base; small concealed overlaps are allowed, but no inner shell wall should cut across the usable seat surface.

Four legs use the end centres and radii in JSON, with the same horizontal-ring sheared-frustum construction as the table. Top Z=0.23 overlaps the seat base, bottom Z=0. Legs splay outward to X +/-0.175; front bottoms Y=-0.18 and rear bottoms Y=0.145. Use 48 radial segments and inward 0.002 edge bevel, three segments. There are no crossbars, wheels or metal plates.

Nominal bounds before bevel are X +/-0.22, Y +/-0.23, Z=0..0.65. Underside upholstery is plain orange. Rear is the same continuous shell, without a separate back pillow, seam cord, label or zipper. The complete inner-shell shape is a simple authored completion of a partly obscured reference chair.

## Future verification

After modeling is separately authorized, compare all five sheet directions plus undersides. Check dimensions within 0.001 m before bevel, circular table top, four flat-footed legs per unit, apron void, open chair front, continuous shell, one cushion and seat height 0.33. Check no scene geometry or baked lighting. No model or model verification has been performed here.

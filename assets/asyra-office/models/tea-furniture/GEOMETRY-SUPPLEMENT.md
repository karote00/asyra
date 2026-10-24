# Tea Furniture - Geometry Supplement

## Coordinates

Metres, +Z up, -Y front; X/Y/Z dimensions. Origins are ground-level footprint centres. Front camera is -Y, right +X, back +Y, top +Z and oblique (1,-1,0.8), aimed at each object's centre. Use inward bevels and smooth normals without expanding nominal bounds. Generated perspective and partial occlusion do not imply a different support count.

## Round tea table

The [round tea table construction contract](ROUND-TEA-TABLE-SPEC.md) owns the
revised connections, exact tangent leg profiles, hollow apron union, sizing,
appearance regions and LOD rules. The tabletop remains radius .34 m,
Z=0.545..0.580 m, with inward radius .006 m circular roundovers.

Rail bottoms stay at .485 m and tops now reach .555 m, embedding 10 mm into
the tabletop. Side rails are .35 m long, overlapping neighboring rails by 5 mm.
Union the four rounded rails into one closed hollow frame, retaining their
separate material regions and removing coplanar duplicate faces. Do not fill
its central void. The top and four legs remain separate closed components.

Leg XY endpoints remain (+- .22,+- .22) at ground and (+- .16,+- .16) at the top.
Upper Z is now .555 m for 10 mm embedment; nominal radii remain .017/.022 m.
Use the exact tangent rim profile before shear, with horizontal end caps and
.002 m fillets. Do not rotate a cone or infer fillet geometry from a generic
modifier. Twenty attachment witnesses and all final union checks are specified
in the construction contract. The overall size remains .68 x .68 x .58 m.

## Orange tea chair

The continuous shell is an elliptical annular sector over theta=-120..+120 degrees, using X=rx*sin(theta),Y=ry*cos(theta). Outer radii are (0.22,0.23), inner radii (0.17,0.18). Zero angle faces rear +Y; open front faces -Y. Bottom height is Z=0.235. Top height is 0.39+0.26*(1-(abs(theta)/120)^1.6). Thus rear centre reaches 0.65 and the short arm ends reach 0.39. Use 120 angular intervals, connect inner and outer surfaces at their top/bottom and close both radial end caps. It is a real thick U-shaped shell, not a solid bucket blocking the seating area. Bevel edges inward 0.012 with four segments.

Seat base is a rounded XY rectangle width 0.36, depth 0.35, centre (0,-0.015), Z=0.205..0.255; plan radius 0.07 and edge bevel 0.008 with three segments. Cushion is width 0.36, depth 0.39, centre (0,-0.035), Z=0.255..0.33, plan radius 0.07 and edge bevel 0.025 with four segments. Sample each plan corner with twelve intervals. Keep the cushion as one component. It meets the shell and base; small concealed overlaps are allowed, but no inner shell wall should cut across the usable seat surface.

Four legs use the end centres and radii in JSON, with the same horizontal-ring sheared-frustum construction as the table. Top Z=0.23 overlaps the seat base, bottom Z=0. Legs splay outward to X +/-0.175; front bottoms Y=-0.18 and rear bottoms Y=0.145. Use 48 radial segments and inward 0.002 edge bevel, three segments. There are no crossbars, wheels or metal plates.

Nominal bounds before bevel are X +/-0.22, Y +/-0.23, Z=0..0.65. Underside upholstery is plain orange. Rear is the same continuous shell, without a separate back pillow, seam cord, label or zipper. The complete inner-shell shape is a simple authored completion of a partly obscured reference chair.

## Future verification

After modeling is separately authorized, compare all five sheet directions plus undersides. Check dimensions within 0.001 m before bevel, circular table top, four flat-footed legs per unit, apron void, open chair front, continuous shell, one cushion and seat height 0.33. Check no scene geometry or baked lighting. No model or model verification has been performed here.

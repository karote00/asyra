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

The [tea chair construction contract](TEA-CHAIR-SPEC.md) owns the exact mapped
shell, rounded-seat construction, clearance cut, connections, sizing and LOD
rules. Keep the continuous open-front shell and the .44 x .46 x .65 m bounds.
The existing inner/outer ellipse radii, varying height and four leg inputs remain.
The source box is rounded before mapping; this replaces the unspecified shell
bevel operation. No solid bucket or separate back cushion is introduced.

The base remains unchanged. The cushion blank now spans Z=0.245..0.33 m with depth
.425 m, centre Y=-.0175, preserving its Y=-.23 front and Z=.33 top. First clip
its rear half to the documented ellipse, then subtract the mapped shell with
.002 m source-space clearance expansion. This yields one conforming cushion,
not a fixed rectangular final footprint. Its bottom embeds 10 mm into the base.
Keep seven closed components and seven independent appearance regions.

Use exact tangent tapered leg profiles before shear, with horizontal end caps.
The seven attachment witnesses and final gap/topology checks are in the contract.
The original reference image remains unchanged; no production model is verified.

## Future verification

After modeling is separately authorized, compare all five sheet directions plus undersides. Check each current construction contract's physical bounds within 0.001 m, circular table top, four flat-footed legs per unit, apron void, open chair front, continuous shell, one cushion and seat height 0.33. Check no scene geometry or baked lighting. No model or model verification has been performed here.

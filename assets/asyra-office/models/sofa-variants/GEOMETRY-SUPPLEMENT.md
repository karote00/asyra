# Sofa Variants - Geometry Supplement

## Shared conventions

Metres, +Z up, -Y front; X/Y/Z size order. Origin is the centre of the declared nominal footprint bounds at ground Z=0. Every part has the coordinates in JSON. Apply inward bevels with the indicated segments, never expand bounds. Use smooth normals. The shapes are deliberately simple rounded upholstered solids, not simulated cloth. No tufting, piping cords, zipper, loose pillow or folds.

Foot cylinders end at Z=0.09 and overlap the base beginning at Z=0.07. This concealed overlap is intentional. Other structural overlaps between rear shell, back cushions, arms and base close upholstery gaps; preserve component identity for cushions and feet. Do not treat apparent sheet shading as extra gaps, stitches or supports.

## L-shaped sofa

The [L-shaped sofa construction contract](L-SHAPED-SOFA-SPEC.md) owns the revised
inset base polygon, exact concave rounding, cushion tilt, attachment witnesses,
instance sizing, appearance regions and LOD sampling. Its rules take precedence
over shared defaults for this module only.

The base now spans Z=0.07..0.25 and overlaps both seat cushions by 15 mm. Its
rear portion is inset beneath the arms and rear shell; its forward +X chaise
keeps the overall depth. One continuous stepped chaise cushion remains at
Z=0.235..0.34, with a short right arm that stops at Y=-0.075. Do not fill the
front-left opening or split off an ottoman. Both seat tops stay at Z=0.34.

Back cushions are 0.40 m high and lean -10 degrees about their own centres;
compute their Z placement from rounded support so their tops remain Z=0.70.
The rear shell extends to Z=0.08..0.61. Six original feet remain at their numeric
centres, Z=0..0.09, embedded in the base. There are fourteen closed solids in all.

Both polygon solids use the documented section-based rounding, including local
reflex-corner fillets. These do not bridge the empty cutout. Do not substitute
a convex hull, an unspecified bevel modifier or added patch geometry. Full
numeric tables, profile equations, contacts and acceptance limits are in the
L-shaped sofa contract; model appearance remains unverified.

## Curved sofa

Use polar coordinates X=r*sin(theta), Y=r*cos(theta)-0.5875, with theta in [-60,+60] degrees. Zero angle points to the rear +Y. The inner concave face opens toward -Y; the outer rear is convex. Every sector uses this same origin and angular convention. Circumferential sampling must include exact end angles, with intervals no larger than one degree. Cap radial ends, top and bottom to make closed solids.

The base has inner radius 0.35, outer radius 1.00, full 120-degree span, Z=0.07..0.235. Rear shell occupies radius 0.90..1.00, full span, Z=0.22..0.61. Arms occupy the full radial width over [-60,-53] and [53,60] degrees, Z=0.09..0.56. Arms are curved end caps rather than added rectangular blocks. Apply each component's bevel in JSON; the narrow arm bevel is 0.012 so it fits the inner arc.

Divide the 106-degree seating span [-53,+53] into three equal intervals. Inset each interval by 0.2 degrees at both ends, yielding gaps of 0.4 degrees between cushions. JSON lists exact values. Each seat is a curved wedge with radius 0.36..0.84, Z=0.235..0.34. Each matching back cushion uses radius 0.835..0.965, Z=0.35..0.70. Bevel these parts by 0.025 with four segments. Use exactly three of each, not a continuous seat pad or two cushions.

Six feet use polar radius 0.46 and 0.89, each at angles -48, 0 and 48 degrees. Convert their centres with the same formula. Feet have radius 0.023, Z=0..0.09, 48 segments and 0.005 bevel. They remain inside the curved footprint and are not distributed along a straight row. Underside is plain sage; no exposed mechanical frame.

Nominal pre-bevel footprint bounds are X +/-sqrt(3)/2, Y +/-0.4125. Edge bevels may slightly reduce extrema; do not scale the sofa afterward to compensate. Preserve the exact radii, angle range and 0.5875 offset. The 0.825 depth refers to overall curved footprint, not radial seat width.

## Views and future verification

Front from -Y, right from +X, back from +Y, top from +Z, oblique from (1,-1,0.8), all aimed at the unit centre. L chaise must stay on +X in every view; its apparent screen side changes naturally in back view. Curved top must show one annular sector, never an ellipse or semicircle. Some feet are occluded in a given view, but all six must be present in future geometry.

After modeling is separately authorized, inspect these five views plus undersides. Verify nominal dimensions within 0.002 m before edge bevel, fixed handedness, two versus three seat/back cushions, six feet, ground contact, rounded arm ends and no scene geometry or baked lighting. No model or such validation exists in this drawing-only batch.

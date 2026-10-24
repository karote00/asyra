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

The [curved sofa construction contract](CURVED-SOFA-SPEC.md) owns the current
rounded physical dimensions, common polar map, back shear, joins, sizing,
appearance and LOD rules. It supersedes the original sector bevel defaults.
There are sixteen solids: ten upholstered components and six feet. Keep the
120-degree envelope and three matching seat/back divisions.

Seats now embed 15 mm into the base; backs begin at Z=.30 and lean radially by
10 degrees through shear while retaining Z=.70 tops. The inset rear shell
extends to Z=.08. Its outer radius is .995 m and angular range is [-59,+59]
degrees to avoid coincident exposed faces with arms. All six feet remain at
their original polar radii/angles, converted using the corrected common origin.

The old 1.732050808 x .825 x .70 m size is an unrounded engineering envelope.
The physical default is 1.723245086 x .817373398 x .70 m with polar Y offset
.586313301 m. Use full-precision numeric values and the support equations in
the contract. Source-space roundovers mapped into polar space define the exact
construction; do not substitute an unspecified bevel modifier or fill the
concavity. Default appearance and replacement are defined separately.

## Views and future verification

Front from -Y, right from +X, back from +Y, top from +Z, oblique from (1,-1,0.8), all aimed at the unit centre. L chaise must stay on +X in every view; its apparent screen side changes naturally in back view. Curved top must show one annular sector, never an ellipse or semicircle. Some feet are occluded in a given view, but all six must be present in future geometry.

After modeling is separately authorized, inspect these five views plus undersides. Verify the current module contract's physical dimensions and tolerance, fixed handedness, two versus three seat/back cushions, six feet, ground contact, rounded arm ends and no scene geometry or baked lighting. No model or such validation exists in this drawing-only batch.

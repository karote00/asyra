# Round Coffee Table - Construction Review

Status: revised documents approved for commit. No model, rendered appearance,
app interaction or runtime performance is verified.

## Sources and reference interpretation

- [Original sheet](review/05-coffee-table-v1.png).
- [Numeric inputs](furniture-model-spec.json), `modules[moduleId=round-coffee-table]`.
- [Common geometry](GEOMETRY-SUPPLEMENT.md).
- [Surface recipes](SURFACE-RECIPES.md).
- [Shared whole-unit sizing](../README.md).

One unit has four closed solids: one round tabletop and three tapered, outward
splayed round legs. No shelf, underside platform, brackets, central support,
fourth leg or attached props. Programmatic geometry is sufficient; Blender is
optional. This document does not supply a production generator.

The source sheet shows a circular top, thin rounded rim and three legs. Its
FRONT/RIGHT SIDE/BACK projections are not mutually calibrated, and TOP is not
perfectly circular. Preserve the sheet but use one true circle and the existing
three-leg 120-degree arrangement. Do not recreate each projection as different
geometry, or shorten a rear leg because its projected endpoint appears higher.
Defaults below are explicit construction dimensions, not pixel measurements.

## Coordinates and fixed defaults

Metres; +Z up, -Y front, +X right. Root (0,0,0) is the ground placement centre.
Whole bounds remain **620 x 620 x 320 mm**, X/Y=-310..310 mm and Z=0..320 mm.

The tabletop has radius R=310 mm, height H=35 mm, centre (0,0,302.5) mm and
inward rim radius b=6 mm. Its bottom/top planes are Z=285/320 mm. The flat
cap discs have radius R-b=304 mm; the curved rim reaches R without increasing
height. The 6 mm radius is not another ring attached outside the tabletop.

Leg centres below are in mm; widths are nominal pre-fillet diameters. Inward rim radius is 2 mm
for every leg, before the shear described below.

| Part  | Bottom centre XYZ   | Top centre XYZ       | Bottom diameter | Top diameter |
| ----- | ------------------- | -------------------- | --------------- | ------------ |
| leg-1 | (0,-240,0)          | (0,-180,295)         | 32              | 44           |
| leg-2 | (207.846097,120,0)  | (155.884573,90,295)  | 32              | 44           |
| leg-3 | (-207.846097,120,0) | (-155.884573,90,295) | 32              | 44           |

Angles about +Z are -90, 30 and 150 degrees measured from +X. Ground-centre
radius is 240 mm and upper-centre radius 180 mm. Compute their X/Y coordinates
as radius times cos/sin; JSON retains floating-point values and the table rounds
to six decimals in mm. Each centreline shifts 60 mm inward over 295 mm height,
so its angle from vertical is approximately **11.496563 degrees**. This is a
centreline angle, not the taper angle of the outer surface.

The old leg tops stopped at Z=285 mm, merely touching the tabletop underside.
The corrected Z=295 mm creates **10 mm embedment** without altering overall
height, diameter or foot locations. No extra joining part is introduced. The
slight X/Y precision correction makes all three legs share the exact layout.

## Tabletop surface

Use a rotational profile in (rho,z), initially z=0..H, then translate by
Z=285 mm. The lower rim has centre (R-b,b):
`rho=R-b+b*cos(theta), z=b+b*sin(theta)` for `theta=-pi/2..0`.
The upper rim has centre (R-b,H-b), with `theta=0..pi/2`.
Join their side endpoints at rho=R and close both flat discs at z=0/H.
This yields a closed inward-rounded cylinder with no seams or added rings.

## Tapered leg surface and flat caps

Do not rotate a finished cylinder: that would tilt its end caps. Define a
canonical vertical tapered profile, then shear each height slice in X/Y.
For leg H=0.295 m, bottom/top radii r0=0.016 and r1=0.022 m, rim radius b=0.002 m:

- `k=(r1-r0)/H`, `q=sqrt(1+k*k)`, `alpha=-atan(k)`.
- Lower fillet centre: `(r0+k*b-b*q, b)`.
- Upper fillet centre: `(r1-k*b-b*q, H-b)`.
- Around either centre `(rc,zc)`, use `rho=rc+b*cos(theta)`, `z=zc+b*sin(theta)`.
- Lower arc spans `-pi/2..alpha`; upper arc spans `alpha..pi/2`.
- Join the two side endpoints along `rho=r0+k*z`.
- Close flat discs of the respective centre radii rc at z=0 and z=H.

The 32/44 mm endpoint diameters describe the unrounded taper, not the final
flat contact discs. The lower/upper flat discs have diameters approximately
28.080529/39.917817 mm, respectively, from twice their fillet-centre radii.
Do not enlarge those discs back to the nominal width after rounding.

Both arcs meet the sloped side tangentially. Using two ordinary quarter-circles
would leave a tangent mismatch on a tapered leg. The fillet centres lie exactly
b inside the side line. The 2 mm fillet is defined before shear, so it need not
remain a circular section of radius 2 mm in every post-shear world plane.

For each profile point and azimuth phi, let the documented endpoint centres be
B and T. Define `Cxy(z)=Bxy+(Txy-Bxy)*(z/H)` and
`p=(Cxy.x+rho*cos(phi), Cxy.y+rho*sin(phi), z)`.
All cross-section rings are parallel to XY, including end caps. The cap normals
remain vertical. Normals on sloped/rounded sides come from the transformed
geometry; do not reuse lighting normals from an unsheared cylinder.

Sample azimuth uniformly starting at +X, including all cardinal directions
for the tabletop. Join corresponding rings consistently, with no folds or
unwelded cracks; include all caps. Do not remove hidden top caps for a cheaper
triangle count. The entire tapered profile stays beneath the tabletop footprint:
even `0.240+0.022=0.262 m` is inside its 0.304 m flat underside radius.

## Attachments, ground contact and error margins

The three lower flat discs touch Z=0; the upper caps are concealed inside the
tabletop at Z=295 mm. For each leg use a joint witness on its centreline at
Z=292 mm: `w=(Cxy(0.292),0.292)`. It is 7 mm above the tabletop underside and
3 mm below the leg top, well inside the flat tabletop cap radius and the leg's
straight core. This is one joint per leg; all three must pass.

In default space, define shear magnitude `s=length(Txy-Bxy)/H` and maximum
stretch `sigma=(sqrt(4+s*s)+s)/2`. The inverse shear has the same operator norm.
A conservative leg interior margin at this witness is
`min(z,H-z,(r0+k*z)/q)/sigma`, greater than 2 mm. Tabletop margin is 7 mm.
These margins exceed the corresponding coarsest-tier error limits below.

Require closed, outward-oriented, convex inscribed meshes and verify each
witness remains strictly inside both actual meshes. Surface distance alone
does not certify containment or topology. No patch geometry, dark seams or
lighting may hide a disconnected joint. This is geometric attachment, not a
physical engineering or load-bearing certification.

## Overall sizing and appearance

Assemble the default four parts first. For D=(0.62,0.62,0.32) and finite positive
requested extents T, apply `pFinal=pDefault*T/D` once about (0,0,0). Omitted axes
retain defaults. Scale every point, rim, joint and datum together. Reject
nonpositive/nonfinite values. Nonuniform scaling may make the top and leg caps
elliptical and change apparent splay; do not compensate by rebuilding parts.
Dimensions describe local bounds before placement, not rotated world bounds.

| Region                          | Default   | sRGB    | Roughness |
| ------------------------------- | --------- | ------- | --------- |
| top                             | oak       | #D5B587 | 0.80      |
| each leg                        | dark-wood | #584333 | 0.82      |
| tabletop secondary grain colour | oak-grain | #BD986B | 0.80      |

The secondary grain colour is a palette parameter, not another mesh. Each of
the four parts is independently replaceable. Resolve region material, otherwise
table material, otherwise preset; then region colour, otherwise table colour.
Preserve remaining properties and isolate instances. A plain replacement removes
the default grain; a base-colour override retains the selected pattern, whose
secondary colour can also be overridden. Alpha=1, metallic=0, transmission=0,
emission=0 by default. No baked shadows, highlights, AO, normal/displacement maps
or painted silhouettes. Feet and tabletop underside default to solid colour.

Use the existing wood recipe in resized local metres before placement. Flat
top uses g(X,Y); circular vertical side uses g(X,Z). Grain runs along X, not in
concentric rings. To join them continuously across the rounded rim, let n be
the unit geometric normal in default local space, before instance scaling:
`a=max(nZ,0)`, `bSide=sqrt(nX*nX+nY*nY)`, `S=abs(nZ)+bSide`.
Set `G=(a*g(X,Y)+bSide*g(X,Z))/S` and use G in the common oak colour mixture.
At the flat underside G=0. Preserve these default mapping normals independently
of correctly transformed lighting normals. Replacement materials own their
mapping; do not force this recipe onto them. Export uses the common physical
texel density and edge-dilation rules; no texture export is delivered here.

## LOD and final-model acceptance

Use identical default dimensions, profile endpoints and attachment positions
for all tiers. Divide each rim arc uniformly by the listed interval count and
use uniform azimuth rings. The longest leg rim arc is `pi/2+atan(k)`.

| Tier | Top radial | Leg radial | Rim intervals | Base triangles | Triangle ceiling | Top error mm | Leg error mm |
| ---- | ---------- | ---------- | ------------- | -------------- | ---------------- | ------------ | ------------ |
| LOD0 | 64         | 32         | 3             | 2560           | 2800             | 1            | 0.25         |
| LOD1 | 48         | 24         | 2             | 1440           | 1600             | 1.5          | 0.5          |
| LOD2 | 24         | 12         | 1             | 480            | 600              | 5            | 2            |

Analytical base count is `(topRadial+3*legRadial)*(4*rimIntervals+4)`, including
flat triangle-fan caps and hidden faces. Additional samples count toward the
ceiling. These are sampling counts and targets, not measured exported meshes.
Uniform tabletop rings include cardinal points, preserving exact X/Y extrema;
flat cap centres preserve Z extrema. Do not rescale individual LODs to fit.

Conservative sampling error bounds, in metres:

- Tabletop: `R*(1-cos(pi/topRadial))+b*(1-cos(pi/(4*rimIntervals)))`.
- Leg before shear: `r1*(1-cos(pi/legRadial))+b*(1-cos((pi/2+atan(k))/(2*rimIntervals)))`.
- Multiply the leg bound by sigma to include shear. At instance scale, multiply
  default-space error bounds by at most the largest XYZ scale.

Measure adaptive bidirectional surface distance per part against the ideal
profile after shear, along with closedness, normals, cap planarity, whole bounds,
all three joint witnesses and ground contacts. Reject any failed error,
attachment or triangle budget. Runtime switching and performance are app-owned.

Later visual acceptance needs matched cameras and enlarged tabletop rims,
all three upper joints, tapered sides and flat feet, plus an underside view.
A distant overview or passing document tests cannot certify resemblance to
the reference. The source's projection inconsistencies remain disclosed above.

## Document checks

```sh
python3 -B assets/asyra-office/models/furniture/review/__tests__/test_coffee_table_spec.py
```

Also run the existing desk, work-chair and two-seat-sofa document suites to
preserve their accepted inputs. Tests check positions, embedment, fillet
tangency, cap planes, error bounds, joint margins, triangle counts, table values,
replacement regions and reference preservation. They do not generate a model.

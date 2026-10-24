# L-Shaped Sofa - Construction Review

Status: revised documents approved by the user for commit. No model, app rendering or
runtime performance is verified. The curved sofa is outside this revision.

## Sources and interpretation

- [Original five-view sheet](review/01-l-shaped-sofa-v1.png).
- [Numeric specification](sofa-variants-model-spec.json), `modules[moduleId=l-shaped-sofa]`.
- [Shared geometry](GEOMETRY-SUPPLEMENT.md) and [surface defaults](SURFACE-RECIPES.md).
- [Whole-unit sizing](../README.md).

One placeable unit contains fourteen closed solids: base, rear shell, two arms,
left seat, one continuous stepped chaise seat, two back cushions and six feet.
The JSON `feet` group represents six solids, not one cylinder. No detached
ottoman, loose pillows, recliner mechanism or extra upholstery patch.

TOP fixes handedness: the forward extension is on +X, the front viewer's right.
RIGHT SIDE and THREE-QUARTER show the right arm stopping before the extended
chaise. BACK shows a continuous rear panel below two raised cushions. Apparent
screen-side changes in BACK do not mirror the unit. FRONT is an elevated
illustration; its lower chaise projection is not a second seat height. Both
seat tops remain Z=340 mm and all feet meet Z=0. Views are appearance guides,
not calibrated pixel measurements; component revisions are construction choices.

## Coordinates and dimension changes

Metres, +Z up, -Y front. Ground origin (0,0,0) remains the centre of the overall
bounding rectangle, not the area centroid of the L. Final local bounds are
X=-900..900, Y=-575..575, Z=0..700 mm: **1800 x 1150 x 700 mm**.
Do not recenter the L, close the front-left opening, or apply a negative scale.

Rounded-box rows use full size and pre-rotation centre in mm. Radii are inward.

| Part               | Centre XYZ            | Full size XYZ    | Radius | X rotation degrees |
| ------------------ | --------------------- | ---------------- | ------ | ------------------ |
| rear-shell         | (0,515,345)           | 1580 x 120 x 530 | 25     | 0                  |
| left-arm           | (-845,250,325)        | 110 x 650 x 470  | 45     | 0                  |
| right-arm          | (845,250,325)         | 110 x 650 x 470  | 45     | 0                  |
| left-seat          | (-395,167.5,287.5)    | 780 x 445 x 105  | 35     | 0                  |
| left-back-cushion  | (-395,445,497.145353) | 780 x 150 x 400  | 45     | -10                |
| right-back-cushion | (395,445,497.145353)  | 780 x 150 x 400  | 45     | -10                |

For rounded boxes use the inset-box half-size `h=size/2-r` plus radius-r sphere.
Rotate back cushions only, around their own centres. With a=-10 degrees,
`eZ=abs(sin(a))*hY+abs(cos(a))*hZ+r` and `centreZ=0.700-eZ`.
The table rounds display values; the JSON retains the computed centre. Back
cushions now span approximately Z=294.290706..700 mm and overlap their seats.
Do not translate or rotate the entire furniture assembly to fit a view.

The former back cushions were vertical and began at Z=350 mm, above the seat
tops. Their corrected height, lean and placement match the illustrated seated
connection. The rear shell now spans Z=80..610 mm instead of starting at 220 mm,
so it covers the rear of the inset base down to short-foot level. Arms retain
Z=90..560 mm and their original lengths; the right arm is not extended forward.

### Base and chaise polygons

The base is one stepped polygon, counterclockwise in XY, in mm:

```text
(-850,-75), (0,-75), (0,-575), (900,-575),
(900,-75), (850,-75), (850,540), (-850,540)
```

Extrude Z=70..250 mm with edge radius 18 mm. The rear base is inset beneath
arms/rear shell to prevent coincident exterior faces. Its front chaise keeps
the previous outer extent. Raising the base top from 235 to 250 mm creates
15 mm embedment into both seat cushions; their seat surfaces do not rise.

The unchanged single chaise-seat polygon is also counterclockwise, in mm:

```text
(5,-555), (880,-555), (880,-75),
(785,-75), (785,390), (5,390)
```

Extrude Z=235..340 mm with edge radius 25 mm. Its rear width is 780 mm,
front width 875 mm and total depth 945 mm. The right-side step accommodates
the short arm; do not split this cushion at the step or add a transverse seam.
There is a 10 mm minimum centre gap between left/right seat and back pairs.
The front base projects 20 mm beyond the chaise cushion's front/outer extrema;
this is a defined upholstered base margin, not an extra platform. Rounding
changes local edge separation, so these extrema are not per-pixel seam widths.

## Reproducible polygon rounding

Both input polygons are simple, orthogonal and counterclockwise. Round their
plan corners and top/bottom rims using the following one surface definition;
do not use an unspecified bevel modifier or convex hull of the whole outline.

For a corner V, let u/v be incoming/outgoing unit edge directions, n0/n1 their
left normals, and `s=sign(cross(u,v))`. With the part's edge radius b, define
fixed corner centre `C=V+s*b*(n0+n1)`. Positive s is convex; negative s is reflex.

At height z, compute the section inset d:

- Lower rim, `zMin<=z<zMin+b`: `d=b-sqrt(b*b-(z-(zMin+b))**2)`.
- Middle band: d=0.
- Upper rim, `zMax-b<z<=zMax`: `d=b-sqrt(b*b-(z-(zMax-b))**2)`.

The section corner arc has centre C and radius `b-s*d`. Start in direction
`-s*n0` and sweep `s*pi/2` to `-s*n1`. Connect each arc end to the next arc
start by the corresponding straight edge. Equivalently, straight boundaries
are offset inward by d. At cap planes, convex arc radii reach zero: collapse
coincident samples, weld shared vertices and remove degenerate triangles.
Reflex radii reach 2b. Never silently clamp overlapping arcs; reject invalid
geometry. The current shortest base step is 50 mm, sufficient for these radii.

At d=0 the reflex arc rounds the notch locally and can occupy a small part of
the sharp polygon's empty corner. This is intentional concave rounding within
b of the vertex; it does not bridge or fill the large front-left cutout. Overall
bounds never expand. Do not describe reflex rounding as removing material only.

Sample each planar quarter arc uniformly and sample vertical rims by their
quarter-circle angle, using the per-tier counts below. Loft corresponding
sections with consistent orientation. Triangulate the concave top/bottom caps
within their boundaries, for example by ear clipping; never use a centre fan
across the missing corner. The result remains a single closed concave solid.
Validate self-intersections, manifold edges and outward normals on the mesh.

## Six feet and attachment checks

Feet have radius 25 mm, Z=0..90 mm and inward rim radius 5 mm. Their centres
in mm are (-820,490), (0,490), (820,490), (-820,0), (80,-490), (820,-490).
No foot occupies the front-left cutout. Use the inward circular rim profile in
the [work-chair contract](../furniture/WORK-CHAIR-SPEC.md#views-and-tessellation),
with the above dimensions: flat ground discs have radius 20 mm at Z=0.
Feet embed 20 mm in the base. Hidden caps remain part of closed solids.

The following metre-space witnesses must be strictly inside both joined parts:

| Connection                       | Witness XYZ            |
| -------------------------------- | ---------------------- |
| base / rear-shell                | (0,0.49,0.23)          |
| base / left arm                  | (-0.80,0.25,0.20)      |
| base / right arm                 | (0.80,0.25,0.20)       |
| base / left seat                 | (-0.395,0.1675,0.2425) |
| base / chaise seat               | (0.395,-0.30,0.2425)   |
| left seat / left back cushion    | (-0.395,0.37,0.322)    |
| chaise seat / right back cushion | (0.395,0.37,0.322)     |
| rear-shell / each back cushion   | (+/-0.395,0.50,0.54)   |
| base / each of six feet          | (footX,footY,0.08)     |

There are fifteen pairwise joins, including both backs and all six feet.
Rounded test cores contained in the polygon solids make the attachment proof
independent of a polygon triangulator: base rear core bounds X=+/-0.85,
Y=-0.075..0.54; front core X=0..0.90, Y=-0.575..-0.075; both Z=0.07..0.25,
radius 0.018. The chaise core uses X=0.005..0.785, Y=-0.555..0.39,
Z=0.235..0.34, radius 0.025. These are test volumes, not additional mesh pieces.
Their interior witnesses have more than 3 mm margin. Actual meshes must also
pass signed-containment checks; coarse sampling does not certify a closed join.

## Sizing and independently replaceable appearance

Assemble all fourteen default solids, including cushion rotations and polygon
rounding, then apply `pFinal=pDefault*T/D` once with D=(1.80,1.15,0.70).
Requested extents must be finite and positive; omitted axes retain defaults.
Scale every component, gap, rim and attachment together about the fixed origin.
Nonuniform sizing can change apparent lean or turn circles into ellipses.
Do not mirror the chaise, refit radii, bend to terrain or recenter parts.

| Region                | Default material | sRGB    | Roughness |
| --------------------- | ---------------- | ------- | --------- |
| each upholstered part | sage             | #78836A | 0.93      |
| feet                  | dark-wood        | #584333 | 0.82      |

Every component is independently replaceable; feet can additionally be targeted
by zero-based `centresXY` index. Resolve material from individual foot, otherwise
part region, otherwise sofa override, otherwise preset. Apply colour overrides
in the same priority order after material selection, preserving other properties
and instances. Defaults are solid colours, alpha=1, metallic=0, transmission=0,
emission=0, no clearcoat. Cloth weave is an optional separately selected material,
not a required texture or geometry. Replacements own their mapping using resized
local coordinates as appropriate; do not bake source shadows, AO, seam ink or
highlights. This L-sofa default clarification does not change the curved sofa.

## LOD requirements and limits of review

| Tier | Box segments | Polygon arc/rim segments | Foot radial/rim | Triangle ceiling | Upholstery error mm | Foot error mm |
| ---- | ------------ | ------------------------ | --------------- | ---------------- | ------------------- | ------------- |
| LOD0 | 8            | 8                        | 48 / 3          | 15000            | 1                   | 0.3           |
| LOD1 | 5            | 5                        | 32 / 2          | 7500             | 2                   | 0.6           |
| LOD2 | 4            | 3                        | 16 / 1          | 4000             | 3                   | 2             |

A conservative pre-support triangle allowance is 13432 / 6304 / 3072 for the
three tiers. It includes six rounded boxes, six capped feet and the two polygon
lofts/caps before coincident endpoint collapse. For polygon corner count v and
sampling n, use the upper bound `4*v*(n+1)**2-4`; the two polygons have v=8/6.
Extra rotated-support samples and any necessary refinements still count toward
the ceilings. These are analytic allowances, not measured output counts.

Rounded boxes use the normalized barycentric corner construction from the
[desk contract](../furniture/WRITING-DESK-SPEC.md#view-interpretation-and-lod).
Include shared ideal-support samples for rotated cushion tops as in the
[chair support construction](../furniture/WORK-CHAIR-SPEC.md#preserve-exact-support-planes).
Polygon caps must keep their notches. Do not apply a convex-hull rule to them.

Conservative polygon sampling bound is `3*b*(1-cos(pi/(4*n)))`: the largest
plan radius is 2b and vertical rim radius is b. Use the actual spherical-corner
bound for boxes and radial-plus-rim bound for feet. Compare adaptive bidirectional
surface distance per part with the ideal surfaces, preserve the fifteen joins,
verify six flat contacts and retain the exact unit bounds at every tier.
All hidden caps and additional support samples count toward each ceiling.
Do not normalize each LOD separately, remove feet or add reconnection patches.

The ceilings and analytic sampling bounds are design targets, not measured mesh
results. At nonuniform instance scale, error increases by at most the largest
axis scale. Runtime switching and performance belong to the app. Future visual
review must compare matched views and enlarged notches, short-arm/chaise step,
seams, back lean, underside and foot attachments. Numeric checks do not establish
pixel-perfect reconstruction or visual acceptance of a generated model.

## Document checks

```sh
python3 -B assets/asyra-office/models/sofa-variants/review/__tests__/test_l_shaped_sofa_spec.py
```

The checks cover connection relationships, rounding profiles, bounds, fixed
handedness, feet, LOD error targets and unchanged curved-sofa/reference inputs.
The revised document still awaits user review; no implementation is delivered.

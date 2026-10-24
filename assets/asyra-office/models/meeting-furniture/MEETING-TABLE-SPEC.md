# Wooden Meeting Table - Construction Contract

Status: revised documents approved by the user for commit. No production model, app rendering
or runtime performance is verified.

## Authority and scope

- [Original five-view sheet](review/01-wooden-meeting-table-v1.png).
- [Numeric specification](meeting-furniture-model-spec.json), asset `wooden-meeting-table`.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md).
- [Default surfaces](SURFACE-RECIPES.md).
- [Shared sizing and appearance](../README.md).

This is one programmatic-primitives assembly: a rounded-plan tabletop, four
straight square legs and four apron rails. Nine independently closed solids,
nine independently selectable appearance regions. Blender is optional. Do not
add chairs, braces, drawers, screws, underside plates or extra feet.

The approved image and every existing part dimension remain unchanged. The
source thumbnail establishes broad appearance; hidden joints and exact dimensions
are authored construction decisions. The sheet is not a calibrated projection.
Its RIGHT-view 0.70 m label means floor to tabletop underside, not floor to the
apron bottom: the apron bottom is 0.62 m. Do not measure the drawn leader length
or use occlusion to remove a rear leg. The whiteboard is outside this revision.

## Default dimensions and placement

Metres in JSON; millimetres in the following table. +Z up, -Y front, +X right.
Origin is (0,0,0) at the floor-footprint centre. Overall size is
**1400 x 750 x 740 mm**; top surface Z=740 mm, underside Z=700 mm.

| Region      | Centre XYZ (mm) | Size XYZ (mm)   |
| ----------- | --------------- | --------------- |
| top         | (0,0,720)       | 1400 x 750 x 40 |
| leg-0       | (-580,-255,350) | 55 x 55 x 700   |
| leg-1       | (580,-255,350)  | 55 x 55 x 700   |
| leg-2       | (-580,255,350)  | 55 x 55 x 700   |
| leg-3       | (580,255,350)   | 55 x 55 x 700   |
| front-apron | (0,-255,660)    | 1105 x 22 x 80  |
| back-apron  | (0,255,660)     | 1105 x 22 x 80  |
| left-apron  | (-580,0,660)    | 22 x 455 x 80   |
| right-apron | (580,0,660)     | 22 x 455 x 80   |

The top has a **25 mm XY corner radius**. There is no Z-edge bevel, no box-edge
rounding and no subdivision. Legs are vertical with constant square sections;
their four complete bottom faces are flat at Z=0. Neither perspective nor wood
pigment changes these geometry rules.

Outer leg limits are X=+/-607.5 mm and Y=+/-282.5 mm. Top overhang from these
outer limits is 92.5 mm on all four sides. The inner-leg gap is 1105 mm in X
and 455 mm in Y. Apron lower faces are at Z=620 mm. These are geometry
clearances, not real-world load, ergonomic or app seating certification.

## Exact tabletop and boxes

The tabletop XY contour is a rectangle with four tangent quarter-circles.
For W=1.4, D=.75, R=.025, the arc centres and angle ranges, viewed from +Z, are:

| Centre XY (m) | Angle range (degrees) |
| ------------- | --------------------- |
| (.675,.350)   | 0..90                 |
| (-.675,.350)  | 90..180               |
| (-.675,-.350) | 180..270              |
| (.675,-.350)  | 270..360              |

On each arc, use `(cx+R*cos(theta), cy+R*sin(theta))`, including both endpoints.
Connect successive arcs by straight tangent segments, including the last to the
first. This is a counter-clockwise loop; extrude it from Z=.700 to .740.
Triangulate each convex cap without new vertices into N-2 nondegenerate triangles.
Give the top outward +Z winding, the bottom -Z winding, and side faces outward
winding. Each of the N side strips has two triangles. Close and weld geometric
boundaries even where render vertices split to carry different normals or UVs.

Cap normals are exactly +/-Z. Straight sides have axis-aligned outward normals.
Corner side normals follow the radial XY direction; they join tangent straight
side normals continuously. Keep cap/side edges hard; smooth shading must not
round the 40 mm vertical thickness. Normal interpolation does not replace
sufficient geometric tessellation.

Each leg and rail is its exact closed axis-aligned box, with 12 triangles,
flat face normals and zero bevel. Box centre/size values above derive from JSON
ranges; do not apply another offset, normalization, taper or scale at assembly.

## Sixteen flush contacts

All 16 contacts are positive-area, zero-gap interfaces. Positive volume overlap
is not required for these sharp, exactly specified primitives. Reuse the same
coordinate values at each interface; do not round each part independently.

| Contact kind           | Count | Plane      | Area per contact (mm squared) |
| ---------------------- | ----- | ---------- | ----------------------------- |
| leg to top             | 4     | Z=700      | 3025                          |
| long apron to top      | 2     | Z=700      | 24310                         |
| short apron to top     | 2     | Z=700      | 10010                         |
| long apron end to leg  | 4     | X=+/-552.5 | 1760                          |
| short apron end to leg | 4     | Y=+/-227.5 | 1760                          |

For each leg with signs `(sx,sy)`, contact-centre witnesses in metres are:

- Leg/top: `(sx*.580,sy*.255,.700)`.
- Long apron/leg: `(sx*.5525,sy*.255,.660)`.
- Short apron/leg: `(sx*.580,sy*.2275,.660)`.
- Long apron/top: `(0,sy*.255,.700)`, one for each sy.
- Short apron/top: `(sx*.580,0,.700)`, one for each sx.

These witnesses lie on shared faces, not strictly inside both solids. Contact
area and equality of the mating planes must both be checked. All eight top
interfaces lie within its straight central XY rectangle, so the corner arcs
cannot cut away a joint. Adjacent rails do not meet directly; each leg connects
two rails. There are no floating rails or corner filler blocks.

Retain nine closed components; a Boolean union is not necessary. Shared mating
faces are internal interfaces, not exposed overlapping layers. Do not add black
seam strips or thickness offsets. Final rendering must show no exposed z-fighting,
cracks or missing faces at joints. A dimension tolerance is not permission to
separate mating planes. Actual mesh and app verification remain deferred.

## Whole-unit sizing

Use the default geometry once, then `pFinal = diag(T / D) * pDefault`, with
D=(1.4,.75,.74) and finite positive requested extents T. Omitted axes retain the
default. Reject nonfinite, zero or negative values. Preserve the ground origin;
scale all nine parts, offsets, thicknesses and corner arcs together. No per-part
refit, automatic height normalization, ground bending or mirroring is implied.

A proportional lock must reject conflicting target ratios rather than distort
silently. Nonuniform scaling makes circular plan corners elliptical. Transform
normals with the inverse transpose and renormalize; do not restore the original
radius or make legs square again. Joint equality is preserved by the same common
transform. Appearance mapping follows resizing; world placement comes afterward.

## Default and replaceable appearance

All nine regions default to `honey-wood`: base sRGB **#B9864E**, grain sRGB
**#A77945**, roughness **0.80**, metallic **0**. Opacity is 1; transmission,
emission and clearcoat are zero. Preserve the selectable subtle wood pigment
recipe in the surface document. No baked light, AO, contact shadows or source
image contour strokes belong in these defaults.

Regions are `top`, `leg-0`..`leg-3`, `front-apron`, `back-apron`, `left-apron`
and `right-apron`. Array indices use the order in JSON. Select material from
region, then part group, then whole table, then preset. Resolve supplied colour
independently in that same order and apply it after material selection; absent
colour keeps the selected material's colour. A tint retains the material's
other properties. Do not mutate materials shared by other instances.

Use final resized local metres for the default grain; nonuniform scaling does
not stretch its physical period. For the curved tabletop side wall, use the
horizontal side normal: if abs(Ny)>=abs(Nx), use u=X,v=Z; otherwise u=Y,v=Z.
This resolves diagonal ties and preserves the existing long/short edge rule.
Caps use u=X,v=Y. Replacement materials own their mapping and may omit grain.
Colour/material overrides never add displacement or alter the part geometry.

## LOD and future acceptance

Only the tabletop's plan-corner sampling changes. Boxes and all shared planes
remain exact at every tier. The following are analytic tessellation counts,
not measured exported assets or verified runtime performance:

| Tier | Segments per quarter | Outline vertices N | Total triangles | Ceiling | Maximum surface error (mm) |
| ---- | -------------------- | ------------------ | --------------- | ------- | -------------------------- |
| lod0 | 16                   | 68                 | 364             | 400     | .031                       |
| lod1 | 8                    | 36                 | 236             | 260     | .121                       |
| lod2 | 4                    | 20                 | 172             | 200     | .481                       |

N=4(n+1), tabletop triangles=4N-4, eight boxes=96; total=16n+108.
The radial chord error is R*(1-cos(pi/(4n))); cap corners share the same contour.
Endpoints preserve exact X/Y supports, and the same Z planes preserve height.
No under-surface cap removal or automatic simplification is included in counts.
Normal/UV vertex splits do not add triangles. If a later export changes these
assumptions, recount and validate rather than claiming this table as measured.

Require nine closed geometric components, nine appearance regions, all 16
contacts, four flat feet and an empty interior below the tabletop. No gaps may
be introduced by LOD. Default overall dimension tolerance is .001 m; shared
planes still use identical inputs. Under scaling, maximum world-space geometric
error is bounded by default error times max(scaleX,scaleY,scaleZ).

Future visual review must use matching camera projections and show FRONT, RIGHT,
BACK, TOP, THREE-QUARTER plus an underside and magnified joint/corner views.
Inspect the 25 mm plan corners, hard vertical top edge, four distinct legs and
rail placement. Compare geometry independently of grain or scene light. Reject
wrong counts, slopes, hidden missing faces, cracks, budget overflow or lost
appearance regions; do not hide them with patches or alternate camera angles.

## Current document verification

Run `python3 -B assets/asyra-office/models/meeting-furniture/review/__tests__/test_meeting_table_spec.py`
from the repository worktree. The permanent checks cover all contact rectangles,
default bounds and scaled planes, contour sampling/error/counts, document table
consistency, regions and preservation of source geometry, palette, both images
and the unrelated whiteboard. These analytic checks do not instantiate a
production generator or certify visual similarity. Review and approval of an
actual model remain a separate stage.

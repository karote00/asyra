# Writing Desk - Reviewed Construction Contract

Status: original five-view sheet retained; revised documentation approved by the user
for commit. No model, generator implementation or app rendering is verified.

## Authority and production route

- [Original desk sheet](review/01-desk-v1.png).
- [Numeric specification](furniture-model-spec.json), `modules[moduleId=writing-desk]`.
- [Common geometry](GEOMETRY-SUPPLEMENT.md).
- [Surface recipes](SURFACE-RECIPES.md).
- [Shared sizing, appearance and production rules](../README.md).

One unit contains nine parts: one tabletop, four wooden aprons and four vertical
square legs. No drawer, brace, shelf, laptop, mug or chair is included. Existing
part IDs, geometry values, palette defaults and reference pixels are preserved.

This is a programmatic-primitives asset under the shared production rule. Use
rounded boxes and the existing square-leg construction; Blender is optional,
not a required intermediary. This document does not implement a factory or
require a new package. Other furniture remains outside this review.

## Axes, dimensions and component table

Metres, +Z up, -Y front, +X right. Origin is (0,0,0), the footprint centre on
the ground. Default complete XYZ size is **1200 x 600 x 650 mm**. These are
already final default coordinates: unlike the animal recipes, no raw-to-default
bounds normalization is needed. Surface height is Z=650 mm.

All table values are millimetres. Legs are listed by their equivalent box centre
and full size for readability; their endpoint fields remain authoritative in
JSON. Equal endpoint widths and equal endpoint X/Y make them vertical, untapered
square legs despite the shared primitive name `tapered-square-leg`.

| Part        | Centre XYZ      | Full size XYZ   | Inward radius |
| ----------- | --------------- | --------------- | ------------- |
| top         | (0,0,630)       | 1200 x 600 x 40 | 8             |
| front-apron | (0,-238,582.5)  | 1060 x 25 x 55  | 4             |
| back-apron  | (0,238,582.5)   | 1060 x 25 x 55  | 4             |
| left-apron  | (-538,0,582.5)  | 25 x 450 x 55   | 4             |
| right-apron | (538,0,582.5)   | 25 x 450 x 55   | 4             |
| leg-1       | (-540,-240,305) | 32 x 32 x 610   | 2             |
| leg-2       | (540,-240,305)  | 32 x 32 x 610   | 2             |
| leg-3       | (-540,240,305)  | 32 x 32 x 610   | 2             |
| leg-4       | (540,240,305)   | 32 x 32 x 610   | 2             |

Bevel inward on every edge without enlarging the bounds. Use the explicit LOD
tessellation below: LOD0 has four segments on the tabletop and three on other
parts. This desk-specific rule overrides the shared three-segment default.
Preserve flat face centres and closed bottoms.
The ideal rounded box is the box inset by radius on each axis plus a sphere of
that radius; at three-edge corners the corresponding corner is rounded, not an
unlisted decorative sphere. Discretization must stay within the LOD error limits.
Do not increase only the tabletop's XY corner radius based on sheet perspective.

## Assembly and contacts

Tabletop spans Z=610..650 mm. Legs span Z=0..610 mm; aprons span Z=555..610 mm.
The flat upper faces of all legs and aprons contact the tabletop's flat underside
at Z=610 mm. This is flush contact, not a required positive overlap with the top.
Keep interfaces hidden; no exposed coplanar overlays or dark painted gap lines.

The four legs have outer X=+/-556 mm and Y=+/-256 mm, so the tabletop overhangs
these outer limits by 44 mm on each side. Between leg inner faces, the X gap is
1048 mm and Y gap is 448 mm. The apron lower face is at Z=555 mm. These are
geometry clearances, not certified real-world ergonomic or app seating limits.

Each apron joins two legs, giving eight apron/leg joints. Front/back apron end
bounds overlap leg bounds by 6 mm along X. Side-apron end bounds overlap by
1 mm along Y. Bounding-box intersection alone does not prove a beveled join.
The following raw/default metre points are strictly inside both rounded parts:

- For a leg at signs (sx,sy), the front/back apron witness is
  (sx*0.527, sy*0.238, 0.580).
- The side-apron witness is (sx*0.538, sy*0.2245, 0.580).

These points lie in flat face cores, so the default circular bevel segmentation
does not remove their overlap. Preserve these hidden joints through LOD and
instance sizing. Adjacent aprons need not connect directly through the corner:
the leg connects them. Do not add corner blocks, screws or diagonal braces.

Parts are independently closed solids with intentional hidden apron/leg overlap.
There is no requirement to Boolean-union all nine pieces into one manifold, and
there is no authorization for duplicate exposed faces. All four feet retain
flat central contact faces on Z=0 after inward bottom-edge beveling.

## Overall sizing

For requested positive extents T and D=(1.2,0.6,0.65), scale each component point
p by pInstance=p*T/D about the shared ground origin, once. Omitted dimensions
retain D; reject nonfinite or nonpositive values. Scale part positions, leg
widths, thicknesses, bevels and joint overlap together. Do not stretch the top
alone or keep legs at fixed width. Do not normalize the default mesh again.

Nonuniform scaling makes circular bevels elliptical; do not regenerate them to
an unscaled radius. Surface height follows 0.65*Tz/0.65. Placement rotation is
a later transform and does not redefine requested local dimensions. No terrain
fitting, adaptive leg lengths, rigging or seating behavior is introduced.

## Defaults, replacement and wood mapping

Three independently replaceable regions cover every part exactly once:

| Region   | Parts           | Default material | sRGB    | Roughness |
| -------- | --------------- | ---------------- | ------- | --------- |
| Tabletop | top             | oak              | #D5B587 | 0.80      |
| Aprons   | all four aprons | oak              | #D5B587 | 0.80      |
| Legs     | all four legs   | dark-frame       | #363832 | 0.70      |

The default tabletop grain also uses oak-grain #BD986B as its secondary colour.
This is a surface palette parameter, not an extra mesh or independent object.
Alpha=1, metallic=0, emission=0 and transmission=0. No baked shading, AO,
reflections, normal/displacement maps or silhouette lines.

Select region material, otherwise desk material, otherwise preset; then region
colour, otherwise desk colour. Preserve unoverridden material properties and
other instances. The selected material owns its surface pattern: replacing oak
with a plain material removes its grain. A colour override updates the base
colour; the grain recipe remains only while that material is selected. Its
secondary grain colour remains separately configurable; omitted overrides retain
the documented palette. Do not reapply the original oak material after an override.

Evaluate the existing wood recipe in **resized local metres before world
placement**, not normalized UV coordinates stretched with the tabletop. Top
uses u=X,v=Y; long edge faces use u=X,v=Z. Short end faces and underside are solid
oak by default. Aprons are solid oak; legs are solid dark-frame. The grain runs
along X, with v period 22 mm and u modulation period 370 mm. Enlarging the desk
shows more grain instead of enlarging each streak. Phase is anchored to the
resized local origin. Texture export retains the common 1024 pixels/metre and
8-pixel dilation rule; export or runtime shader implementation is not delivered.

### Grain across rounded edges and corners

For the default tabletop wood, let n be the unit geometric normal in default
local space, before instance scaling or placement. Use continuous interpolated
geometry normals, not flat triangle normals, normal maps or a light vector.
Let S=abs(nX)+abs(nY)+abs(nZ), wTop=max(nZ,0)/S, wLong=abs(nY)/S.
Using the existing recipe's g function at resized local coordinates, set
G=wTop*g(X,Y)+wLong*g(X,Z), then
C=base*(1-0.18*G)+secondary*0.18*G in normalized sRGB before linear conversion.

The remaining weight is solid base colour. This recovers X/Y grain on the flat
top, X/Z grain on flat long sides, and solid colour on short ends and underside.
It continuously blends them over bevels and spherical corners. Preserve default
normal directions as mapping data so nonuniform sizing does not change the
blend weights; lighting still uses correctly transformed normals. Pattern phase
may differ between projections, but there is no abrupt face-switch boundary.
This rule affects neither other parts nor replacement materials' own mappings.

## View interpretation and LOD

The sheet's FRONT, RIGHT SIDE and BACK views are slightly elevated illustrations,
not calibrated orthographic projections. They expose rear legs and some top
surface. All four legs have the same height; do not shorten rear legs to copy
image projection. Front/back and left/right geometry are symmetric. TOP is a
1200:600 rectangle with inward corner rounding. No extra shading pass is needed
for this simple assembly; existing pixels remain the appearance reference.

Later canonical review uses front on -Y, right on +X, back on +Y, top on +Z and
one recorded three-quarter camera. Include an underside/contact close-up when
verifying the joints; it need not become an extra design sheet now.

| LOD  | Bevel segments per quarter-circle | Whole-desk triangle ceiling | Maximum surface error - default metres |
| ---- | --------------------------------- | --------------------------- | -------------------------------------- |
| LOD0 | 3                                 | 1600                        | 0.0005                                 |
| LOD1 | 2                                 | 1000                        | 0.001                                  |
| LOD2 | 1                                 | 500                         | 0.003                                  |

The table's segment count applies to the eight non-top parts; the tabletop uses
4/2/1 segments for LOD0/1/2 respectively. Rounded corner topology is explicit:

- LOD0, all parts: use the normalized barycentric octant grid. For n segments,
  vertices are normalize(i,j,n-i-j), with nonnegative integer i/j and i+j<=n.
  Each lattice cell uses triangles (i,j)/(i+1,j)/(i,j+1), plus
  (i+1,j)/(i+1,j+1)/(i,j+1) when i+j<n-1. This yields n squared triangles per
  corner. Its boundary angles are atan2(j,n-j); adjoining cylindrical edge
  strips must use those same, nonuniform angles so there are no T-junctions.
- LOD1, all parts: use equal-angle quarter-circle boundaries with n=2. Connect
  each boundary segment to normalize(1,1,1), producing 3n triangles per corner.
- LOD2: the tabletop uses that centre fan at n=1. Each other part uses the single
  triangle through the three octant-axis endpoints, also with n=1.

For each corner, multiply unit-octant points by the part radius, apply corner
signs and translate to the inset-box corner centre. Orient outward. Share the
position boundaries with adjacent edge strips and flat faces; attribute seams
may duplicate vertex records but must not duplicate faces. Each part has six
flat quads (12 triangles), twelve edge strips (24n triangles), and eight corner
patches. The complete nine-part totals are **1484 / 972 / 412 triangles**,
including every hidden contact face, below the unchanged 1600 / 1000 / 500
ceilings. Keep all nine solids closed: hidden-face removal is not part of this
recipe. No triangulation should add face-centre fans to the six already-flat quads.

This is necessary because a single spherical-octant triangle at the tabletop's
8 mm radius has 8*(1-1/sqrt(3))=3.3812 mm error, exceeding the LOD2 3 mm limit.
The prescribed LOD2 tabletop fan reduces the conservative radial bound to 2.4421 mm. The
analytic corner/edge bounds across all parts are at most 0.4576 / 0.9084 / 2.4421
mm for LOD0/1/2. Tests derive conservative triangle-plane radial bounds and arc
sag; they do not substitute for measuring the eventual exported mesh.

These are authored limits, not measured meshes. Each tier retains all nine
parts, flat face planes, complete extents, four grounded legs and eight hidden
apron/leg overlaps. Reduce bevel segmentation rather than removing supports.
Count all faces, including hidden caps. Compare adaptive bidirectional surface
distance against each ideal rounded part at default size; pooling parts or
checking only vertices can conceal errors. A failed budget or error blocks
approval; do not silently increase limits or insert patches. All LODs share
one origin and one instance scale. These limits do not prove app performance.

## Document checks and next gate

Run `python3 -B assets/asyra-office/models/furniture/review/__tests__/test_writing_desk_spec.py`.
Checks cover unchanged reference/other furniture, nine-part table consistency,
height and overhang, flat top/ground contacts, rounded-volume joint witnesses,
region coverage, sizing, corner triangulation counts/error bounds and rounded
surface mapping policies. They do not build a production mesh,
verify triangulation, certify visual likeness or run the app. Model acceptance
still requires matched views, actual contact/closed-surface checks, LOD counts
and measured surface errors. No commit approval is inferred from these checks.

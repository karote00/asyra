# Ivory Sleeping Pillow - Construction Contract

Status: revised documents approved by the user for commit. No production model, app render,
cloth simulation, comfort or runtime performance is verified.

## Authority and unit boundary

- [Original six-view sheet](review/02-ivory-sleeping-pillow-v1.png).
- [Numeric specification](rest-furniture-model-spec.json), asset `ivory-sleeping-pillow`.
- [Shared geometry](GEOMETRY-SUPPLEMENT.md).
- [Default surfaces](SURFACE-RECIPES.md).
- [Rounded-patch construction](DAYBED-SPEC.md#exact-rounded-pad).
- [Shared sizing and appearance](../README.md).

One independently placeable pillow, one closed rounded solid, one appearance
region. Use a programmatic rounded-box construction; Blender is optional. All
existing dimensions, palette and reference pixels remain unchanged. The approved
daybed is outside this revision. Do not duplicate its platform, add an attached
bed, create a casing/insert pair or treat the pillow as several stacked pads.

The source is a supplementary authored design. FRONT, RIGHT and BACK establish
a thick rounded form; TOP and BOTTOM show the same plan silhouette. The oblique
view has weak depth cues and does not authorize flattening the object. Keep the
100 mm Z extent and planar middle faces specified below. No fabric weave, seam,
piping, buttons, pointed corners, wrinkles, compression or gravity sag is implied.
Colour gradients and drawing contours are not geometry or baked surface maps.

## Exact default dimensions

Metres in JSON, millimetres in this table. +Z up, -Y front, +X right. Origin is
(0,0,0), the centre of the bottom contact plane, not the volume centre.

| Quantity           | XYZ values (mm) |
| ------------------ | --------------- |
| Outside size XYZ   | 500 x 320 x 100 |
| Inner box size XYZ | 420 x 240 x 20  |
| Centre XYZ         | 0 x 0 x 50      |

Rounding radius is **40 mm**. Bounds are X=-250..250, Y=-160..160, Z=0..100 mm.
The inner box has bounds X=-210..210, Y=-120..120, Z=40..60 mm. Add a sphere
of radius 40 mm by Minkowski sum, rather than adding overlapping visible balls
or cylinders as separate objects. The outside size equals the inner size plus
80 mm on every axis; all six faces belong to one closed boundary.

This same rounded-box recipe is already specified for the daybed pad. Reuse
its six planar rectangles, twelve quarter-cylinders and eight spherical octants,
with this pillow's centre, inner half-size a=(.210,.120,.010) m and r=.040 m.
Reuse the patch formulas and outward winding, not the daybed's dimensions,
material, component count or LOD budgets. Weld shared boundaries and octant poles.
Flat faces have axis normals; curved faces have continuous analytic radial normals.
No subdivision cage or unspecified bevel may replace the exact construction.

For centred point p, q=abs(p)-a; the signed distance is
`length(max(q,0)) + min(max(q.x,q.y,q.z),0) - r`.
A zero value is the ideal surface. The coordinate for this formula is relative
to the volume centre (0,0,.05), while instance scaling uses the bottom origin.
Do not apply the centre offset twice.

## Flat faces, support and projections

Top and bottom flat faces occupy X=-210..210 and Y=-120..120 mm at Z=100 and
Z=0 respectively. Each is 420 x 240 mm, area **100800 mm squared**. The front
and rear planar rectangles are 420 x 20 mm at Y=+/-160 mm, Z=40..60 mm.
The two end planar rectangles are 240 x 20 mm at X=+/-250 mm, Z=40..60 mm.
These small flat side bands join curved edges; do not turn them into seams.

Only the central 420 x 240 mm bottom face contacts a flat support plane. The
rounded lower perimeter rises above it. The full 500 x 320 mm bounding rectangle
is neither a contact footprint nor a separate base plate. There is no contact
joint between internal components, because there is only one component.

| View         | Full silhouette size (mm) | Planar central face size (mm) |
| ------------ | ------------------------- | ----------------------------- |
| FRONT / BACK | 500 x 100                 | 420 x 20                      |
| RIGHT        | 320 x 100                 | 240 x 20                      |
| TOP / BOTTOM | 500 x 320                 | 420 x 240                     |

All orthographic silhouettes are rectangles with 40 mm rounded corners. The
current sheet is illustrative, not a calibrated pixel measurement. FRONT looks
+Y, +X screen-right; BACK looks -Y, -X screen-right; RIGHT looks -X, +Y
screen-right. Those views use +Z up. TOP looks -Z with +X right and +Y up.
BOTTOM looks +Z with +X right and -Y up. Its symmetry does not change the axes.
The oblique view must retain visible thickness in future model review.

## Placement and whole-unit sizing

The pillow is not attached to a particular daybed coordinate. App placement owns
position and orientation. In an unrotated placement on a horizontal support at
height H, translate the bottom origin to H after resizing; do not subtract half
of the pillow height or embed its rounded underside. This is a placement rule,
not a bundled placement instance, cloth collision system or deformation feature.

For positive finite requested extents T, default D=(.500,.320,.100), apply
`pFinal=diag(T/D)*pDefault` once about (0,0,0). Omitted axes keep defaults.
Reject zero, negative or nonfinite values; a proportional lock rejects conflicting
ratios. Scale the centre, flat-face sizes and radius-derived curves together.
Bottom Z stays 0, volume centre becomes T.z/2, and top Z becomes T.z. Independent
axis scaling can make circular/spherical patches elliptical; do not restore
40 mm rounding or normalize again. Use inverse-transpose normals and normalize.
Appearance mapping follows resizing and precedes world placement.

## Default and replaceable appearance

The single region `body` defaults to `ivory`: uniform sRGB **#EEE9DB**, roughness
**.90**, metallic **0**, opacity **1**, zero transmission, emission and clearcoat.
All visible and hidden faces use it. There is no default wood grain, textile
weave, bump, normal, displacement, AO, shadow or highlight map.

Resolve material and supplied colour independently: body region, pillow instance,
then preset. Apply supplied colour after material selection while retaining
its other properties. Without a tint, preserve the chosen material's own colour.
Overrides must not mutate another instance. Replacement materials own their
mapping in final resized geometry; a plain-colour material needs no texture.
This reference contract defines no specific UV atlas or runtime shader API.
Appearance replacement does not add geometry, seams or displacement.

## LOD and verification

| Tier | Segments per quarter n | Total triangles | Ceiling | Maximum surface error (mm) |
| ---- | ---------------------- | --------------- | ------- | -------------------------- |
| lod0 | 12                     | 2508            | 2600    | .343                       |
| lod1 | 6                      | 684             | 700     | 1.364                      |
| lod2 | 4                      | 332             | 350     | 3.045                      |

The pillow-only tier table overrides the shared 12-segment default at lower
tiers. Use the linked patch topology: six planar faces contribute 12 triangles,
twelve cylinders contribute 24*n, and eight octants contribute 8*(2*n*n-n).
Total is **16*n*n+16\*n+12**. Collapse each octant's pole to one geometric vertex;
never count or export degenerate triangles. Normal/UV splits do not add triangles.

Use the same conservative spherical error bound `r*(1-cos(pi/(2*n)))` and
cylinder chord bound `r*(1-cos(pi/(4*n)))` as the linked daybed patch derivation,
with pillow radius .040 m. The table rounds upward. All tiers retain exact
extrema, a closed outward boundary, the flat support rectangle and one region.
There are no omitted hidden caps or extra internal faces. Counts and error
bounds are analytic, not measured exports or verified runtime performance.

Overall default size tolerance is .001 m. The per-tier surface-error budget is
separate from size tolerance: extrema and the Z=0 support remain exact. Under
instance resizing, error is bounded by the tier error times the largest axis
scale. Reject degenerate poles, cracks, inverted normals, missing bottom faces,
extra layers or budget overflow; do not conceal them with patches or camera choice.

Future model review must inspect all six views with matching projections, then
magnify top/side/bottom transitions. Confirm 100 mm height, 40 mm default radius,
a 20 mm flat vertical side band and the bottom contact area independently of
material and scene lighting. No comfort, cloth or exact rendered likeness claim
is made from this document.

Run `python3 -B assets/asyra-office/models/rest-furniture/review/__tests__/test_sleeping_pillow_spec.py`
from the worktree, together with the daybed document tests. The pillow checks
reuse the existing analytic patch builder in memory to verify topology, normals,
counts, support area, bounds, error bounds, scaling, document tables and preserved
source data. No model files are produced. Revised documents are approved by the user for commit.

# Cockatiel - Reviewed Construction Contract

Status: original six-view sheet retained; revised documentation approved by the user
for commit. No model, Blender output, rig, animation or app implementation is verified.

## Authority and unit

- [Reference sheet](review/02-cockatiel-v2.png).
- [Numeric inputs](birds-model-spec.json), `birds[id=cockatiel]`.
- [Common geometry equations](GEOMETRY-SUPPLEMENT.md).
- [Surface masks and defaults](SURFACE-RECIPES.md).
- [Overall sizing and appearance](../README.md).

This document supplies cockatiel-specific construction clarifications. Existing
raw geometry, mask coordinates and default dimensions remain unchanged. The
approved sparrow numeric entry and both reference images are preserved. Numeric
inputs are authored reconstruction choices, not image-derived measurements.

One static, standing animal contains joined torso/head, two folded wings, one
long tail, three distinct crest feather lofts, an upper hooked beak, a lower
mandible and two feet. Each foot has two forward and two rear toes: eight total.
Eyes, orange cheeks and ivory wing patches are intrinsic surface regions. No
perch, cage, collar, open wings, feather strands, extra claws, mouth cavity,
tongue, nostril holes or protruding eyeballs. Lines and dots in the sheet do not
add those parts to this closed-beak construction contract.

## Coordinates and complete sizing

Metres; +Z up, -Y front, +X anatomical right. Default final local XYZ bounds are
**180 x 360 x 320 mm**. All part dimensions below are raw, before normalization.

Construct every part including crest tips, both beak parts, feet and tail caps.
Measure complete raw surface bounds lo/hi. Set O=((loX+hiX)/2,(loY+hiY)/2,loZ)
and D=(0.180,0.360,0.320). Use pDefault=(pRaw-O)*D/(hi-lo), componentwise.
Apply the same nonuniform transform to all parts once, before LOD generation.
Reject empty, nonfinite or nonpositive extents. Store the default transform;
never fit parts or LODs separately to a bounding box.

Requested extents T apply pInstance=pDefault*T/D once about the root. Omitted
axes retain D. Reject nonfinite/nonpositive requests rather than mirroring or
collapsing geometry. All components and their colour masks inherit this sizing.
Inverse instance sizing then inverse default normalization recovers raw mask
space. The long tail and tall crest count toward overall extents; body size alone
is not the final animal size. Nonuniform scaling does not keep local radii fixed.

## Body and folded wings

Table values are raw millimetres; full dimensions are diameters, not radii.

| Part       | Centre XYZ   | Full dimensions XYZ |
| ---------- | ------------ | ------------------- |
| body       | (0,18,110)   | 146 x 154 x 186     |
| head       | (0,-22,189)  | 148 x 132 x 134     |
| wing-0     | (-68,30,124) | 32 x 124 x 120      |
| wing-1     | (68,30,124)  | 32 x 124 x 120      |
| lower-beak | (0,-80,158)  | 22 x 24 x 14        |

Wing labels name existing array positions; lower-beak denotes the existing
`lowerMandible` entry. These are table labels, not renamed persisted identifiers.
Join body then head using the common ellipsoid field, k=3 mm smooth minimum and
0.8 mm raw extraction grid. Wings remain separate closed ellipsoids. Rotate each
-25 degrees about its own X axis before translation. Both rotations have the
same sign. Wing centres lie inside the body, ensuring positive root overlap.
No individual wing feathers or modeled contour grooves are added.

## Long tail

Rows give Y, centre Z, radius X and radius Z in raw millimetres.

| Tail row | Y   | Centre Z | Radius X | Radius Z |
| -------- | --- | -------- | -------- | -------- |
| Root     | 55  | 75       | 34       | 13       |
| Middle   | 170 | 35       | 24       | 7        |
| Tip      | 255 | 21       | 2        | 2        |

Use 64 angular samples, phi=2*pi*j/64, j=0..63, with
p=(radiusX*cos(phi),Y,centreZ+radiusZ*sin(phi)). Join matching indices between
rows and close both ends with centre fans. Root is inside the torso. Tail
narrows and descends toward +Y; it is a single closed loft, not several split
feathers. Its tip minimum Z=19 mm remains above the raw toe minimum of 0.5 mm.
It must not become a third ground support.

## Upper hook and lower mandible

Upper-beak rows give Z, centre Y, radius X and radius Y in raw millimetres.

| Upper-beak row | Z   | Centre Y | Radius X | Radius Y |
| -------------- | --- | -------- | -------- | -------- |
| Root           | 196 | -81      | 14       | 13       |
| Broad section  | 180 | -91      | 17       | 18       |
| Hook section   | 161 | -97      | 10       | 12       |
| Tip            | 151 | -99      | 2        | 3        |

Create XY ellipses p=(radiusX*cos(phi),centreY+radiusY*sin(phi),Z), with the
same 64 angular samples. Rows descend in Z: correct winding to face outward,
connect matching indices and cap both ends. Linear interpolation between rows
is authoritative; do not swap the Z loft for the sparrow's Y-axis wedge.

The front outline reaches Y=-109 mm at the broad/hook sections, then returns
to Y=-102 mm at the lower tip, forming the hook. The centreline itself continues
forward; the taper creates the outline return. Do not mistake it for a straight
cone. The small tip ellipse is closed with a fan, not an open hole or an added
hemispherical cap. No extra smoothing changes these section dimensions.

The lower mandible uses the ellipsoid in the component table and inherits the
beak default material. Keep upper/lower identities independently replaceable.
Both attach to the head; the raw point (0,-90,160) mm lies strictly inside both
beak parts, proving positive overlap. Keep a closed beak, without carving an
unlisted mouth cavity. Intentional hidden overlap is allowed; disconnected or
open surfaces are not. Preserve the hook and attachment during mesh reduction.

## Three distinct crest feathers

Each row gives Z, centre X, centre Y, radius X and radius Y in raw millimetres.
Feather numbers follow array order. Their unequal heights and offsets are
intentional; do not mirror one feather three times or force equal tip heights.

| Crest row  | Z      | Centre X | Centre Y | Radius X | Radius Y |
| ---------- | ------ | -------- | -------- | -------- | -------- |
| 0 - root   | 239    | -16      | -12      | 7        | 9        |
| 0 - middle | 269.25 | -16      | 0        | 6        | 7        |
| 0 - tip    | 294    | -16      | 15       | 1        | 1        |
| 1 - root   | 243    | 0        | -18      | 7        | 9        |
| 1 - middle | 284.8  | 0        | -6       | 6        | 7        |
| 1 - tip    | 319    | 0        | 9        | 1        | 1        |
| 2 - root   | 240    | 16       | -10      | 7        | 9        |
| 2 - middle | 275.2  | 16       | 2        | 6        | 7        |
| 2 - tip    | 304    | 16       | 17       | 1        | 1        |

Use p=(centreX+radiusX*cos(phi),centreY+radiusY*sin(phi),Z), the same 64-sample
rings, linear interpolation and closed fan caps. Unlike beak rows, these rows
ascend in Z. Each tip bends toward +Y, which is backward. Roots are strictly
inside the head. Heights span 55, 76 and 64 mm respectively in raw space.

These are three independent head-attached lofts. They do **not** overlap each
other in 3D: adjacent centre-X spacing is 16 mm and each maximum X radius is
7 mm, leaving at least 2 mm between their X intervals. Their projections may
overlap in side views. The earlier description of overlapping feather lofts
was incorrect. Do not join them with filler geometry; head attachment supplies
their shared support. Each feather has its own closed surface and small capped
tip. No hair strands or further crest branches are authorized.

## Legs and zygodactyl feet

Legs are vertical capsules at X=-32/+32 mm, Y=-12 mm, with centreline endpoints
Z=12/60 mm and radius 5.5 mm. Endpoints refer to hemispherical-cap centres, not
outer bounds. Upper ends overlap the body. Each toe segment has radius 4.5 mm.

Local polylines are relative to (legX,legY,0); units are raw millimetres.
The same set applies to both feet. The X set is symmetric; do not reflect Y.

| Toe                  | Root XYZ | Middle XYZ | Tip XYZ     |
| -------------------- | -------- | ---------- | ----------- |
| Forward - negative X | (0,0,10) | (-9,-16,6) | (-15,-34,5) |
| Forward - positive X | (0,0,10) | (9,-16,6)  | (15,-34,5)  |
| Rear - negative X    | (0,0,10) | (-9,13,6)  | (-14,28,5)  |
| Rear - positive X    | (0,0,10) | (9,13,6)   | (14,28,5)   |

For capsule endpoints A/B: t=clamp(dot(p-A,B-A)/dot(B-A,B-A),0,1),
f=length(p-(A+t*(B-A)))-radius. Reject coincident endpoints. Within each foot,
combine leg first, then listed toes and their segments root-to-tip using k=1 mm
smooth minimum and 0.8 mm extraction grid. Keep the two feet separate. Shared
toe roots merge; eight distal tips stay distinct. The sparrow's three-forward,
one-rear pattern must not be copied here.

All raw toe-tip minima are Z=5-4.5=0.5 mm. Normalize the complete final surface
once so its lowest point is on ground. Verify both feet contact the same plane
on the extracted mesh and every LOD; endpoint math alone does not certify this.
Do not independently shift feet, spread toes or add pads to hide a failure.
Sheet toe/claw contours do not introduce extra digits or separate talon meshes.

## Appearance defaults and replacement

Use the common matte material: roughness 0.90, metallic 0, alpha 1, IOR 1.5;
no feather fibres, normal/displacement maps or baked lighting. Defaults are:

| Region                        | Default material | sRGB    |
| ----------------------------- | ---------------- | ------- |
| Body                          | featherGray      | #898C8E |
| Head                          | yellow           | #E8CF71 |
| Crest                         | yellow           | #E8CF71 |
| Cheeks                        | orange           | #D98943 |
| Eyes                          | dark             | #342F29 |
| Wings                         | wingGray         | #707577 |
| Wing patches                  | ivory            | #EEE4CC |
| Tail                          | wingGray         | #707577 |
| Upper beak                    | beakGray         | #5F6261 |
| Lower beak                    | beakGray         | #5F6261 |
| Feet, including legs and toes | gray             | #8E8C80 |

Keep these named regions distinct even when defaults match. The crest region
covers all three feather lofts. Select region material, otherwise bird material,
otherwise preset; then region colour, otherwise bird colour. Overrides preserve
other properties, geometry and other instances. Store masks independently from
any atlas; a single flattened texture is not enough for region replacement.

Use the common head-space angular formula: eyes at longitude +/-52 degrees,
latitude 5 degrees, radius 6 degrees; cheeks at +/-56/-24/10 degrees. Apply head
base, cheeks, then eyes only where the head pre-blend field is lower than body;
ties belong to body. Eyes are flat solid dark patches, without whites or glints.
Cheeks are flat orange pigment, not rosy illumination. Verify complete mask
boundaries and visible occlusion later, not only the analytic mask centres.

Ivory wing patches use wing-local Y=-44..43 mm and Z=-18..18 mm. Undo instance
and default transforms, subtract wing centre and inverse-rotate X by +25 degrees
before testing these ranges. Require an outward raw-space rotated wing normal:
normalX*sign(wingCentreX)>0. Do not evaluate these ranges as world-space Y/Z or
reuse the sparrow's two wing-bar intervals. Do not convert drawn scalloped feather
lines into extra geometry. No shadows, AO or highlights belong in the masks.

## View mapping

The sheet's RIGHT label maps to canonical LEFT, looking along +X with +Z up;
its RIGHT THREE-QUARTER maps to FRONT-LEFT, camera on negative X/negative Y/
positive Z. Preserve source pixels and document the mapping; do not mirror the
bird. TOP and BOTTOM are illustrative rather than calibrated projections.

| Canonical view | Look direction | Screen up |
| -------------- | -------------- | --------- |
| FRONT          | +Y             | +Z        |
| LEFT           | +X             | +Z        |
| BACK           | -Y             | +Z        |
| TOP            | -Z             | +Y        |
| BOTTOM         | +Z             | -Y        |

True visibility governs crest, eyes and feet. Do not move parts to keep them
visible from a view where another surface occludes them. Record the oblique
camera framing/elevation for future matched comparisons.

## Extraction, LOD and acceptance

Source ellipsoids use the common 64-longitude/32-latitude construction, with
shared poles. Loft rings use 64 samples. Body/feet use the common raw grid and
10 mm padding; verify the boundary is outside every field. These are construction
settings, not runtime triangle counts. Normalize the complete bird before mesh
reduction and preserve one shared normalization/origin across LODs.

| LOD  | Whole-bird triangle ceiling | Maximum surface error - default metres |
| ---- | --------------------------- | -------------------------------------- |
| LOD0 | 16000                       | 0.0005                                 |
| LOD1 | 8000                        | 0.001                                  |
| LOD2 | 4000                        | 0.002                                  |

These are authored, unverified limits. Count all triangles, including internal
caps and feet. Measure adaptive bidirectional surface distance against normalized
pre-reduction surfaces, separately for body, each wing, tail, each crest feather,
each beak part and each foot. Vertex-only probes or pooled surfaces can hide
missing components. Preserve three distinct crest feathers, hook shape, two
wings, eight toes, two grounded feet, attachment overlaps and appearance masks.
Reject a mesh if either budget or error fails; do not silently remove anatomy,
resize LODs or increase limits. The raw 0.8 mm extraction grid does not certify
0.5 mm final surface accuracy.

Run both bird document suites:

```sh
python3 -B assets/asyra-office/models/animals-sparrow-parrot/review/__tests__/test_cockatiel_spec.py
python3 -B assets/asyra-office/models/animals-sparrow-parrot/review/__tests__/test_tree_sparrow_spec.py
```

Checks cover preserved sources, input/table consistency, primitive overlaps,
crest separation, beak attachment/outline, toe layout, mask centres and declared
policies. They do not extract meshes, prove all mask boundaries, certify visual
likeness or measure actual LOD budgets. Later model review requires six matched
views and enlarged crest roots/tips, beak junction, wing patches, tail root and
both feet. This is a static construction contract, not a flight or walking rig.

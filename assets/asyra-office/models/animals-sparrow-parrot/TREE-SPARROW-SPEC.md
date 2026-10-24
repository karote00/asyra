# Tree Sparrow - Reviewed Construction Contract

Status: original six-view sheet retained; revised documentation approved by the user
for commit. No model, Blender output, rig, animation or app implementation is verified.

## Authority and unit

- [Reference sheet](review/01-tree-sparrow-v2.png).
- [Numeric inputs](birds-model-spec.json), `birds[id=tree-sparrow]`.
- [Common geometry equations](GEOMETRY-SUPPLEMENT.md).
- [Surface masks and defaults](SURFACE-RECIPES.md).
- [Overall sizing and appearance](../README.md).

This document supplies sparrow-specific clarifications. Existing raw geometry,
colour-mask values and default dimensions remain unchanged. The cockatiel entry
and both reference images are preserved. Numeric inputs are authored geometry,
not measurements recovered from the generated sheet. Contour lines do not add
feather meshes, toe rings or cuts.

One unit is a static standing bird: joined torso/head, two independently closed
folded wings, one tail, one closed beak and two feet, each consisting of a leg
and four toes. There are eight toes total. Eyes, cheeks, cheek spots, throat bib
and wing bars are surface colour regions. No perch, collar, flight pose, separate
claws, mouth cavity, nostrils, eyeballs or feather strands.

## Coordinates, default size and instance size

Metres; +Z up, -Y front, +X anatomical right. Default final XYZ extents are
**160 x 230 x 200 mm**. All dimensions below are raw pre-normalization inputs.

Construct every part first, including feet, toe hemispheres, beak tip and tail.
Measure complete bounds lo/hi. Let O=((loX+hiX)/2,(loY+hiY)/2,loZ),
D=(0.160,0.230,0.200). Then pDefault=(pRaw-O)*D/(hi-lo), componentwise.
Apply this single shared transform to every part; it is deliberately nonuniform.
Reject missing, nonfinite or nonpositive extents. Record this transform.

Requested extents T apply pInstance=pDefault*T/D once about the default root.
Omitted axes retain D. Reject nonfinite/nonpositive requests; do not mirror,
recenter parts or independently normalize wings/feet. All LODs inherit the same
normalization and origin. Recover anatomical mask coordinates by inverse instance
scaling followed by inverse default normalization. Anatomical markings stretch
with the bird; they are not physical-scale repeating wallpaper.

## Torso, head and folded wings

All table dimensions are **raw millimetres**, with full diameters rather than
radii. They do not describe each part's exposed span after overlap.

| Part   | Centre XYZ  | Full dimensions XYZ |
| ------ | ----------- | ------------------- |
| body   | (0,18,88)   | 130 x 140 x 154     |
| head   | (0,-22,150) | 126 x 116 x 112     |
| wing-0 | (-59,30,98) | 32 x 104 x 100      |
| wing-1 | (59,30,98)  | 32 x 104 x 100      |

The wing row labels denote the two existing array positions, not new asset IDs.
Use the common ellipsoid field and smooth minimum to join body then head, with
k=3 mm and raw extraction spacing 0.8 mm. Wings remain separate closed surfaces,
rotated -25 degrees about their own X axes before translation. Both use the
same rotation; X reflection does not reverse that rotation. Each wing centre
lies inside the torso, giving a positive root overlap. Do not merge the two
wings or create individual feathers from illustration lines.

## Tail and beak

Rows give Y, centre Z, radius X and radius Z in raw millimetres.

| Tail row | Y   | Centre Z | Radius X | Radius Z |
| -------- | --- | -------- | -------- | -------- |
| Root     | 54  | 62       | 34       | 13       |
| Middle   | 110 | 44       | 23       | 7        |
| Tip      | 126 | 40       | 10       | 3        |

| Beak row | Y    | Centre Z | Radius X | Radius Z |
| -------- | ---- | -------- | -------- | -------- |
| Root     | -70  | 143      | 16       | 10       |
| Middle   | -86  | 142      | 10       | 6        |
| Tip      | -102 | 141      | 1        | 1        |

For each ring, phi=2*pi*j/64 with j=0..63:
p=(radiusX*cos(phi),Y,centreZ+radiusZ*sin(phi)). Connect matching indices
between successive rows and cap both ends with centre fans. Orient outward even
though beak rows run toward decreasing Y while tail rows run toward increasing Y.
Linear interpolation between rows defines the loft; no extrapolation or added
rounding changes the sections. Tips are small closed ellipses, not holes.

Tail root intersects torso and beak root intersects head. Both remain separate
closed components with intentional attachment overlap. Do not treat internal
root caps as exposed seams. The beak is one solid closed unit: any line in the
sheet is illustrative, not an additional jaw, mouth gap or cavity.

## Legs and eight toes

Two legs: X=-28/+28 mm, Y=-12 mm, centreline Z=12..48 mm, radius 4.5 mm.
Each is a vertical capsule, including hemispherical end caps; Z endpoints name
centreline ends, not outer bounds. The upper cap overlaps the torso.

Each foot has the same four local polylines relative to (legX,legY,0), radius
3.5 mm. There is no Y reflection for the other foot. The local X set is already
symmetric. All values below are raw millimetres.

| Toe                  | Root XYZ | Middle XYZ | Tip XYZ     |
| -------------------- | -------- | ---------- | ----------- |
| Forward - negative X | (0,0,9)  | (-9,-15,5) | (-14,-30,4) |
| Forward - centre     | (0,0,9)  | (0,-19,5)  | (0,-39,4)   |
| Forward - positive X | (0,0,9)  | (9,-15,5)  | (14,-30,4)  |
| Rear                 | (0,0,9)  | (0,12,5)   | (0,25,4)    |

Every segment is a capsule, not a flat line or rectangular prism. For endpoints
A/B, t=clamp(dot(p-A,B-A)/dot(B-A,B-A),0,1) and
f=length(p-(A+t*(B-A)))-radius. Reject coincident endpoints. Within each foot,
combine leg first, then toes in listed order and their segments root-to-tip,
using k=1 mm and the common 0.8 mm grid. Shared roots intentionally merge;
distal toe tips must remain eight distinct lobes. Left and right feet remain
separate closed components. No invented ninth digit or separate claws.

All raw toe-tip minima are Z=4-3.5=0.5 mm. The complete final-surface bounds,
not a manually moved leg or guessed Z=0, establish the ground plane. Normalize
the whole bird once. Verify both feet contact the same ground plane on the
extracted and reduced surfaces; primitive endpoints alone do not prove contact.
Do not lift or stretch individual toes to conceal an extraction error.

## Appearance defaults and mask ownership

The material defaults and exact masks remain in the numeric and surface files.
Use roughness 0.90, metallic 0, alpha 1 and IOR 1.5. No displacement, normal map,
feather fibres, baked shadows, AO or highlights.

| Region                        | Default material | sRGB    |
| ----------------------------- | ---------------- | ------- |
| Lower body                    | tan              | #C2A078 |
| Head base and upper back      | chestnut         | #875C42 |
| Cheeks                        | ivory            | #EEE4CC |
| Cheek spots                   | dark             | #342F29 |
| Throat bib                    | dark             | #342F29 |
| Eyes                          | dark             | #342F29 |
| Wings                         | brown            | #75513C |
| Wing bars                     | ivory            | #EEE4CC |
| Tail                          | brown            | #75513C |
| Beak                          | dark             | #342F29 |
| Feet, including legs and toes | pinkBrown        | #B28270 |

Each row is independently replaceable, even when multiple regions share a
colour. Select region material, otherwise bird material, otherwise preset;
then region colour, otherwise bird colour. Retain other material properties
and isolate overrides between instances. Preserve masks separately from any
base-colour atlas so region replacement does not require re-authoring geometry.

Use normalized head-ellipsoid directions and the angular masks in the surface
recipe. At blended points, head masks apply only if the original head field is
lower than the body field; ties belong to body. Apply head base, cheeks, spots,
bib, then eyes. Sample entire masks on the final joined surface; checking mask
centres alone does not certify the boundaries or visible projection.

Eye longitude +/-52 degrees, latitude 5 degrees and angular radius 7 degrees
define circular head-space patches, not camera-facing circles. Cheeks use
+/-58/-18/29 degrees; spots +/-70/-20/8 degrees; bib 0/-52/19 degrees.
The cheek spots fit inside the cheek patches. Paint only on the correct surface,
not through a wing or beak. No white eye glints or raised eyeballs.

Upper-back chestnut applies to body-owned points above raw Z=105 mm. Wing bars
use raw Y=9..15 and 36..42 mm on outward wing faces only. Evaluate the outward
normal in raw space after wing rotation and before overall scaling:
normalX*sign(wingCentreX)>0. Do not use screen/world-camera coordinates or
copy wing bars onto hidden roots. Feather contour strokes are not grooves.

## Source views and future review

The sheet's RIGHT view faces screen-right: under the documented coordinates
this is canonical LEFT, looking along +X with +Z up. Its RIGHT THREE-QUARTER
is front-left, camera in negative X/negative Y/positive Z. Preserve pixels and
record this label mapping; do not mirror geometry to fit the label.

| Canonical view | Look direction | Screen up |
| -------------- | -------------- | --------- |
| FRONT          | +Y             | +Z        |
| LEFT           | +X             | +Z        |
| BACK           | -Y             | +Z        |
| TOP            | -Z             | +Y        |
| BOTTOM         | +Z             | -Y        |

TOP and BOTTOM are illustrative, not calibrated camera projections. True
occlusion and eight actual toes take precedence over a drawing that hides or
flattens a toe. Do not relocate eyes to force them visible in TOP. Record the
three-quarter camera for later comparisons; camera intrinsics are not recovered
from this sheet.

## Extraction, LOD and acceptance

The initial 64-longitude/32-latitude ellipsoids and 64-sample lofts are source
surfaces, not the final mesh budget. Body/feet extraction uses the common grid;
verify padding encloses every field with an exterior boundary. Normalize all
components together before deriving LODs. No per-LOD resizing or patch geometry.

| LOD  | Whole-bird triangle ceiling | Maximum surface error - default metres |
| ---- | --------------------------- | -------------------------------------- |
| LOD0 | 12000                       | 0.0005                                 |
| LOD1 | 6000                        | 0.001                                  |
| LOD2 | 3000                        | 0.002                                  |

These are authored, unverified limits. Count all components, including hidden
caps and feet. Measure bidirectional surface distance adaptively against the
normalized pre-reduction surfaces, separately for body, each wing, tail, beak
and each foot. Comparing only vertices or pooling parts can hide errors.
Retain two wings, eight distinct toes, two grounded feet, tail/beak attachments
and all named masks. Triangle count and error must both pass; failure blocks
approval rather than authorizing dropped toes or a larger budget. The 0.8 mm
raw grid is not proof of a 0.5 mm final LOD error.

Run `python3 -B assets/asyra-office/models/animals-sparrow-parrot/review/__tests__/test_tree_sparrow_spec.py`.
The suite checks preservation, numeric/table consistency, primitive attachments,
toe layout/separation, mask centres, size/view policies and declared LOD limits.
It does not extract meshes, certify every mask boundary, establish visual
likeness or measure actual LOD performance. Later model acceptance requires
six matched views plus enlarged beak roots, wing joins, feet/toes, face masks
and tail roots. This static contract does not define flight or walking rigs.

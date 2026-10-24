# Standing Corgi - Reviewed Construction Contract

Status: original six-view reference retained; revised documentation and document-only
illustration approved by the user for commit. No model, rig, Blender process, animation or app implementation is delivered.

## Authority and scope

- [Original six-view sheet](review/02-standing-corgi-v1.png).
- [Numeric specification](animals-model-spec.json), `animals[id=standing-corgi]`.
- [Common construction equations](GEOMETRY-SUPPLEMENT.md).
- [Surface defaults and masks](SURFACE-RECIPES.md).
- [Shared overall sizing and appearance](../README.md).

This review covers the standing corgi. Its existing raw shape values and default
size remain unchanged. The cat's approved numeric entry and images are preserved.
The source establishes rounded proportions and visible features; hidden surfaces
and raw coordinates are authored reconstruction inputs, not photogrammetry.
This document owns corgi-specific projection, view mapping, sizing and LOD rules.

## One unit, axes and size

One unit includes torso, chest, head, muzzle, four short legs, four paws, two
ears, one centred short tail, two eye colour regions and one separate solid nose.
It stands on all four paws. No collar, rug, tongue, teeth, claws, whisker strands,
fingers or toe grooves. The paw underside is cream without pink pads.

Use metres, +Z up, -Y front and +X anatomical right. Existing IDs ending `--1`
mean negative X; IDs ending `-1` without the extra hyphen mean positive X.
These source identifiers remain stable. Do not interpret `--1` as a new limb.

The default final bounds are **320 x 620 x 480 mm** in X/Y/Z. Raw coordinates
below are not final measurements. Construct the common smooth-union body and
the separate nose first, and measure their combined bounds lo/hi. Use origin
O=((loX+hiX)/2,(loY+hiY)/2,loZ) and pDefault=(pRaw-O)*D/(hi-lo), where D is the
three default extents. Reject empty, nonfinite or nonpositive spans. Record this
transform with the model, retaining raw anatomical coordinates for masks.

Normalize the complete animal once, including the nose, before generating LODs.
Never normalize individual parts, recolour regions into new geometry, or resize
each reduced LOD independently. Requested overall extents T apply
pInstance=pDefault*T/D once about root; omitted dimensions retain D. Reject
nonfinite/nonpositive requests. All attached components follow the same scale.
Inverse instance sizing then inverse default normalization recovers mask space.

## Raw component dimensions

All table values are **raw millimetres**. Full dimensions are twice the JSON
radii. They do not represent exposed silhouette spans after smooth blending.

| ID           | Centre XYZ    | Full dimensions XYZ |
| ------------ | ------------- | ------------------- |
| torso        | (0,60,190)    | 270 x 440 x 260     |
| chest        | (0,-110,210)  | 224 x 220 x 300     |
| head         | (0,-205,310)  | 270 x 210 x 240     |
| muzzle       | (0,-295,262)  | 180 x 104 x 90      |
| front-leg--1 | (-84,-95,83)  | 90 x 104 x 150      |
| front-paw--1 | (-84,-115,30) | 98 x 120 x 60       |
| hind-leg--1  | (-87,210,83)  | 100 x 110 x 150     |
| hind-paw--1  | (-87,195,30)  | 100 x 120 x 60      |
| front-leg-1  | (84,-95,83)   | 90 x 104 x 150      |
| front-paw-1  | (84,-115,30)  | 98 x 120 x 60       |
| hind-leg-1   | (87,210,83)   | 100 x 110 x 150     |
| hind-paw-1   | (87,195,30)   | 100 x 120 x 60      |
| nose         | (0,-345,275)  | 38 x 16 x 24        |

Keep the source-list union order. Chest overlaps torso; head overlaps chest;
muzzle overlaps head; front legs overlap chest and hind legs overlap torso;
each paw overlaps its corresponding leg. All four paw minima are Z=0 in raw
space. Verify these contacts on the final union and each reduced mesh; primitive
contact alone does not prove four visible support patches on a finished mesh.
Do not hide failed contacts by stretching legs or adding support geometry.

Each ear is a closed three-section loft. For the positive-X ear:

| Ear row | Centre XYZ - raw mm | Radii XY - raw mm |
| ------- | ------------------- | ----------------- |
| Base    | (90,-190,370)       | 47 x 32           |
| Middle  | (115,-180,450)      | 38 x 22           |
| Tip     | (120,-175,505)      | 6 x 4             |

Mirror X for the other ear.
Interpolate all section values linearly with Z and cap both ends. The roots
intersect the head. Keep the upper ellipse small and closed, not an open spike.

## Short tail

The tail is centred at X=0 behind the torso; do not reuse the cat's side curl.
Use Catmull-Rom with duplicated endpoint controls, linear radii and spherical
caps, following the common recipe.

| Control | Centre XYZ - raw mm | Radius - raw mm |
| ------- | ------------------- | --------------- |
| Root    | (0,255,230)         | 27              |
| 2       | (0,290,265)         | 27              |
| Tip     | (0,315,260)         | 12              |

Two spans at 32 intervals yield 65 unique samples. The root is inside the
torso. Consecutive spheres must overlap and remain centred at X=0. Include all
evaluated spheres in the extraction bounds, not only the control centres.
The orange colour is continuous; there is no cream tail tip or stripe.

## Nose and eye projection

The nose is a separate closed dark ellipsoid, not the cat's flat pink graphic.
Its rear overlaps the muzzle by positive volume; its front projects beyond the
muzzle. Preserve its identity/material instead of smoothing it into the muzzle.
Include its triangles, extents and surface error in the whole-animal accounting.
Each component must be closed; the intentional nose/muzzle overlap is allowed.

Eye centres X=+/-53 mm, Z=309 mm, with X/Z radii 12/17 mm, remain unchanged.
Eye colour is flush, with no relief, whites, glints or lashes. There is no mouth
opening or added mouth line.

First validate the complete eye ellipse against the head projection domain:
q=1-((x-cx)/rx)^2-((z-cz)/rz)^2. Reject q<=0; never clamp a negative q to zero.
The analytic head front y=cy-ry*sqrt(q) is only an initial location, not the
final painted surface. Cast along +Y from outside the entire animal's front
bounds. Paint the frontmost union hit only if its pre-blend owner is **head or
muzzle**, using the common numeric-list tie order. Do not skip another foreground
part, paint behind the muzzle, or duplicate the eyes on rear-facing surfaces.

A head-only rule is incorrect here: at raw (X,Z)=(53,292) mm, the head front
is approximately Y=-300.277 mm while the muzzle front is Y=-318.759 mm. The
muzzle is about 18.482 mm in front of the head at the lower eye. Eye paint must
follow the visible joined face across this area. This explains why the cat's
head-only ownership rule cannot be copied unchanged. Do not move an eye merely
to bypass its intended projection or recolour an occluder to conceal it.

The regression checks sample both the ellipse perimeter and interior against
analytic parts. Smooth-union hit ownership and painted continuity still require
final-surface verification during modeling.

## Appearance defaults

Use orange #C98B50, cream #F1E4CC, pink #B97972 and dark #38312C, with the common
matte material parameters. Named regions are orange coat, cream coat, pink ear
interiors, dark eyes and dark nose. Equal default colours do not merge regions.
The paw undersides are cream, without the cat's pads or tail markings.

Preserve intrinsic masks separately from palette colours. Select region material,
otherwise animal material, otherwise preset material; then apply region colour,
otherwise animal colour, retaining other material properties. Overrides must not
mutate other animals. Anatomical masks follow resized geometry via inverse
transforms; they are not world-projected or physically repeated tile patterns.
No shadows, highlights, AO, image outlines or fur texture are baked into colours.

## Camera and source-label mapping

The sheet's side labelled **RIGHT** faces screen-right. With +Z up and -Y front,
that is a **LEFT** view looking along +X. Its labelled RIGHT THREE-QUARTER view
is a front-left view, camera on negative X, negative Y and positive Z.
Document this mapping without mirroring the geometry or editing source pixels.

| Canonical view | Look direction | Screen up | Source use                                   |
| -------------- | -------------- | --------- | -------------------------------------------- |
| FRONT          | +Y             | +Z        | FRONT                                        |
| LEFT           | +X             | +Z        | Sheet labelled RIGHT                         |
| BACK           | -Y             | +Z        | BACK                                         |
| TOP            | -Z             | +Y        | TOP appearance guidance; tilted illustration |
| BOTTOM         | +Z             | -Y        | BOTTOM                                       |

A canonical RIGHT view looks along -X with +Z up; it faces screen-left. It can
be added during model verification but must not be mislabeled as the sheet's
side projection. Keep front-left three-quarter camera elevation/framing recorded.
Do not force eyes to remain visible from true TOP just because a tilted source
illustration shows them. The source does not supply calibrated camera intrinsics.

## Extraction, LOD and next acceptance gate

Use the common 4 mm smooth minimum and 1 mm raw extraction grid. Check that the
extraction boundary is outside the field; truncation is a failure. Grid spacing
is not a certified final surface error or a final triangle budget. Preserve
source identities and outward closed surfaces; no arbitrary post-smoothing.

| LOD  | Whole-animal triangle ceiling | Maximum surface error - default metres |
| ---- | ----------------------------- | -------------------------------------- |
| LOD0 | 12000                         | 0.001                                  |
| LOD1 | 6000                          | 0.002                                  |
| LOD2 | 2000                          | 0.004                                  |

These are authored limits, not measurements. Count every body and nose triangle.
Use bidirectional adaptive surface comparison against the normalized default
body and nose separately; one component cannot conceal the other's error.
Retain four legs/paw lobes and coplanar sole contacts, two ears, tail continuity,
nose attachment and eye placement. A failed budget or error limit blocks model
approval; do not silently increase budgets or erase anatomy.

Run both document suites:

```sh
python3 -B assets/asyra-office/models/animals-cat-dog/review/__tests__/test_standing_corgi_spec.py
python3 -B assets/asyra-office/models/animals-cat-dog/review/__tests__/test_sleeping_cat_spec.py
```

The checks cover source preservation, numeric/table consistency, primitive
connections, coplanar paw inputs, nose overlap, eye-domain/occlusion samples,
tail continuity, view mapping and declared appearance/LOD policies. They do not
extract the complete implicit surface, validate surface ownership, build a rig,
prove model likeness or verify actual LOD budgets. Final modeling must show six
matched views plus enlarged eyes/muzzle/nose, ear roots, four soles and tail
attachments. The standing pose is a static asset contract, not an animation rig.

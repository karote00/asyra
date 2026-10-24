# Two-Seat Sofa - Construction Review

Status: revised documents approved for commit. The original sheet is unchanged.
No model, app rendering, seating interaction or runtime performance is verified.

## Authority and unit

- [Original five-view sheet](review/03-sofa-v1.png).
- [Numeric inputs](furniture-model-spec.json), `modules[moduleId=two-seat-sofa]`.
- [Common construction](GEOMETRY-SUPPLEMENT.md).
- [Surface defaults](SURFACE-RECIPES.md).
- [Whole-unit sizing](../README.md).

One sofa contains twelve closed solids: one base, one rear shell, two arms,
two seat cushions, two structural back cushions and four short round feet.
Yellow throw pillows are separate assets. Do not add springs, slats, piping,
buttons, a third seating division or loose decorative cushions. Rounded boxes
and round feet can be generated programmatically; Blender is optional.

## Reading the reference

FRONT and THREE-QUARTER show two seat/back divisions, rounded arms extending
near the lower upholstered body, and short feet. BACK shows the two back
cushions above a lower continuous rear shell. RIGHT SIDE shows backward-leaning
back cushions; the arms themselves are unrotated. Their rounded upper edges
must not be mistaken for an additional adjustable arm angle. TOP shows the
same two seating divisions; it is illustrative, not a calibrated projection.

The RIGHT SIDE height label `0.30 m` conflicts with the overall `0.70 m` on
FRONT and the original design brief. Treat that side label as an annotation
error, not another sofa height. The source image is preserved for this review;
its appearance relationships remain relevant. Numeric construction below is
explicitly chosen to make those relationships buildable, not extracted as
precise measurements from illustration pixels.

## Coordinates and revised dimensions

Metres, +Z up, -Y front, +X right. Root (0,0,0) is the ground footprint centre.
Default whole bounds remain **1350 x 650 x 700 mm**:
X=-675..675, Y=-325..325, Z=0..700 mm. Seat surfaces stay at Z=340 mm.
Table dimensions and centres are millimetres before local rotation.

| Part            | Centre XYZ            | Full size XYZ    | Inward radius | X rotation degrees |
| --------------- | --------------------- | ---------------- | ------------- | ------------------ |
| base            | (0,-50,175)           | 1150 x 550 x 210 | 45            | 0                  |
| back-shell      | (0,257.5,340)         | 1210 x 135 x 520 | 45            | 0                  |
| arm--1          | (-615,0,295)          | 120 x 630 x 470  | 48            | 0                  |
| seat-cushion--1 | (-278,-75,295)        | 545 x 500 x 90   | 35            | 0                  |
| back-cushion--1 | (-278,148,507.212095) | 545 x 110 x 385  | 40            | -10                |
| arm-1           | (615,0,295)           | 120 x 630 x 470  | 48            | 0                  |
| seat-cushion-1  | (278,-75,295)         | 545 x 500 x 90   | 35            | 0                  |
| back-cushion-1  | (278,148,507.212095)  | 545 x 110 x 385  | 40            | -10                |
| foot-1          | (-615,-230,40)        | 45 x 45 x 80     | 2             | 0                  |
| foot-2          | (615,-230,40)         | 45 x 45 x 80     | 2             | 0                  |
| foot-3          | (-615,230,40)         | 45 x 45 x 80     | 2             | 0                  |
| foot-4          | (615,230,40)          | 45 x 45 x 80     | 2             | 0                  |

Round-foot X/Y sizes are diameters. Their equal endpoint centres and diameters
make them vertical cylinders, despite the shared `tapered-round-leg` name.
Each foot runs from Z=0 to 80 mm. Seat datums are (+/-278,-75,340) mm; their height remains unchanged.

The following corrections supersede the earlier sofa component inputs:

- Rear shell: Z=80..600 mm, below the back-cushion tops; it overlaps the base
  rather than merely meeting the old base top at Z=280 mm.
- Back cushions: height 385 mm, centre Z=507.212095 mm, rotated -10 degrees
  around each cushion's own centre. Their ideal top is Z=700 mm, their bottom
  approximately Z=314.424190 mm. They overlap their seat cushions instead of
  leaving the former approximately 22 mm vertical gap.
- Seat cushions: depth 500 mm and Y centre -75 mm, retaining their rear
  extreme Y=175 mm and aligning the front extreme Y=-325 mm with the base.
  This aligns the flat front extrema and removes the old 50 mm offset. Rounded
  edge transitions still differ; this is not a claim of identical silhouettes
  at every height. The datum moves with each
  cushion to Y=-75 mm; seat height and X centres remain unchanged.
- Arms: Z=60..530 mm, covering the side body down to short-foot level.
- Base: X=-575..575, Y=-325..225, Z=70..280 mm. It is inset into the arms and
  rear shell, avoiding the old full-width base's coplanar outer side faces.
- Feet: X=+/-615, Y=+/-230 mm; each now attaches beneath its corresponding arm.
  The arm bottom at Z=60 leaves 60 mm exposed below it and 20 mm embedded.
  Do not retain the old 120 mm under-base clearance or 140 mm foot length.

These construction choices for the illustrated form are approved for commit. Other furniture assets and the original sofa sheet are unchanged.

## Rounded geometry, rotation and seams

An inward rounded box is the inset box of half-size `h=size/2-r` plus a
radius-r sphere. Radii do not expand the outer dimensions. Build that surface,
then rotate only back cushions about their own centres by `a=-10 degrees`.
No global normalization or assembly translation is needed.

Their vertical half-extent is
`eZ=abs(sin(a))*hY+abs(cos(a))*hZ+r`; set `centreZ=0.700-eZ`.
Use the numeric centre rather than the table's rounded display value. Positive
Y is rear, so the negative X rotation makes the top lean backward.

Both seat and back pairs have X centres +/-278 mm and widths 545 mm, giving
an **11 mm minimum gap** at their central flat side faces. Rounded edges can
make the visible opening wider near the top/front. Do not force every seam
pixel to an 11 mm width, fill the gap with a dark plane, or paint black seams.
The rear shell and base close the assembly behind/below these divisions.

The seat-to-arm side clearance is 4.5 mm at flat extrema and widens at rounded
corners. This is a cushion separation, not a disconnected sofa: seat cushions
attach to the base; arms and rear shell attach to that same base. Both back
cushions attach to the rear shell and seat cushions.

## Connections and underside

Verify actual rounded volumes, not just overlapping box bounds. The following
metre-space points lie inside both listed solids. Apply the sign consistently
for each left/right pair; these are default placed coordinates.

| Joined parts                   | Interior witness XYZ   |
| ------------------------------ | ---------------------- |
| base / back-shell              | (0,0.21,0.20)          |
| base / each arm                | (+/-0.565,0,0.24)      |
| back-shell / each arm          | (+/-0.58,0.24,0.40)    |
| base / each seat cushion       | (+/-0.278,-0.05,0.265) |
| seat / matching back cushion   | (+/-0.278,0.13,0.33)   |
| back-shell / each back cushion | (+/-0.278,0.20,0.55)   |
| each foot / its arm            | (footX,footY,0.075)    |

Keep all twelve solids closed, including hidden caps. Hidden attachment
intersections are intentional; exposed coplanar duplicate faces are not. The
base/arm/rear-shell lower planes differ (70/60/80 mm), so their undersides do
not become overlapping coplanar sheets. No extra underside platform or patches
may hide a disconnected part. The four feet alone contact Z=0.

Feet have radius R=22.5 mm and inward rim radius b=2 mm. Use the
[work-chair round-leg profile](WORK-CHAIR-SPEC.md#views-and-tessellation) with
H=80 mm, preserving flat bottom discs at Z=0 and capped tops at Z=80 mm.
This defines geometric attachment, not physical load certification.

## Sizing and replaceable appearance

Assemble default geometry first, including cushion rotation. With
`D=(1.35,0.65,0.70)` and finite positive requested extents T, apply
`pFinal=pDefault*T/D` once about (0,0,0). Omitted axes retain defaults. Reject
nonfinite/nonpositive extents. Scale all parts, radii, gaps, contacts and seat
datums together; no per-part recentering or second normalization. Nonuniform
scaling may make feet elliptical or change apparent cushion angles. Do not
compensate by rebuilding them. Dimensions refer to local bounds before placement.

| Default region | Parts                                          | sRGB    | Roughness |
| -------------- | ---------------------------------------------- | ------- | --------- |
| sage           | base, rear shell, arms, seat and back cushions | #78836A | 0.93      |
| dark-wood      | four feet                                      | #584333 | 0.82      |

Every part is its own replacement region even when defaults match. Use region
material, otherwise sofa material, otherwise preset; then region colour,
otherwise sofa colour. Preserve other material properties and isolate instances.
Defaults are solid colours, opaque, metallic=0, emission=0, transmission=0.
No baked shadows, AO, directional highlights, seam ink or fabric displacement.
A replacement material owns mapping under the shared resized-local-space rule;
changing appearance must not change geometry. Do not apply desk wood grain to
fabric automatically.

## LOD targets and later visual acceptance

Use one ideal default assembly for every tier. The following are initial
sampling requirements and triangle ceilings, **not measured model results**.
All eight upholstered boxes use the listed bevel sampling. Foot rim segments
are separate from radial segments. The whole-unit error column applies to
upholstered parts; feet have the stricter per-part limits below.

| Tier | Box bevel subdivisions | Box corner topology         | Foot radial / rim segments | Whole-unit triangle ceiling | Maximum default-space error |
| ---- | ---------------------- | --------------------------- | -------------------------- | --------------------------- | --------------------------- |
| LOD0 | 8                      | normalized barycentric grid | 32 / 3                     | 8500                        | 1 mm                        |
| LOD1 | 5                      | normalized barycentric grid | 24 / 2                     | 4500                        | 2 mm                        |
| LOD2 | 3                      | normalized centre fan       | 12 / 1                     | 1800                        | 6 mm                        |

| Tier | Maximum foot error | Base sampling triangles | Remaining triangle allowance |
| ---- | ------------------ | ----------------------- | ---------------------------- |
| LOD0 | 0.25 mm            | 7776                    | 724                          |
| LOD1 | 0.50 mm            | 3808                    | 692                          |
| LOD2 | 1.50 mm            | 1632                    | 168                          |

Base counts include caps and hidden faces before exact-support insertion.
For each box use `12+24*n+8*cornerTriangles`; for each foot use
`radialSegments*(4*rimSegments+4)`. There are eight boxes and four feet.
These analytical counts leave an allowance, not proof that an exported mesh
with additional support samples fits. Count and reject an overflow later.

Use the [desk corner construction](WRITING-DESK-SPEC.md#view-interpretation-and-lod)
with matching edge-strip samples. Include boundary-consistent ideal support
samples for rotated cushion tops, following the
[chair support construction](WORK-CHAIR-SPEC.md#preserve-exact-support-planes).
Count additional samples, caps and hidden faces toward the budget. Never add
isolated vertices to fake a bounding box. Do not reposition parts per LOD.

### Attachment margins after simplification

Every tier must be a closed, outward-oriented, convex, inscribed approximation
of each ideal convex part, with no folds or disconnected patches. Each listed
attachment point must remain strictly inside both joined mesh volumes. Check
signed distance on the final mesh, not just whether surfaces are close.

The selected default rounded-box witnesses have more than 9 mm of interior
margin in each joined box, exceeding the coarsest 6 mm box error limit. The
rear-shell/back-cushion witness is at Y=200, Z=550 mm: it lies 10 mm inside
the shell and approximately 11.220039 mm inside the cushion. The earlier
Y=195, Z=500 mm point had only 5 mm shell margin and was insufficient for
this proof; the geometry itself is unchanged by selecting a deeper witness.

Each foot witness is on its axis at Z=75 mm, 5 mm below the capped top and
outside the rim-bevel region. The separate 0.25/0.50/1.50 mm foot limits keep
this margin larger than the permitted error; the 6 mm upholstery limit must
not be applied to feet. Use the conservative foot sampling bound
`R*(1-cos(pi/radialSegments))+b*(1-cos(pi/(4*rimSegments)))`.

All fifteen connections must pass, not just one example from each type. Inside
samples and error bounds constrain the construction but do not substitute for
closed-mesh validation. Reject a tier if it fails; do not move parts or add a
patch to reconnect them. Scaling transforms the accepted whole assembly once.

Measure adaptive bidirectional surface distance per part against the ideal
placed default surface. Verify twelve closed solids, four flat ground contacts,
the fifteen attachment witnesses above, full bounds and two visible seating
divisions. Reject a failed error/triangle budget rather than removing anatomy
or filling gaps with patches. At instance scale, local error bounds multiply
by at most the largest XYZ scale; runtime LOD selection remains app-owned.
Sampling checks alone do not prove final mesh topology, likeness or performance.

Future visual review must match cameras to the sheet and enlarge the rear
cushion/shell height step, cushion joins, arm/base intersections, seams and foot
attachments. Inspect the underside too. Do not use a distant overview or a
numeric test pass as complete appearance acceptance.

## Document validation

```sh
python3 -B assets/asyra-office/models/furniture/review/__tests__/test_two_seat_sofa_spec.py
python3 -B assets/asyra-office/models/furniture/review/__tests__/test_work_chair_spec.py
python3 -B assets/asyra-office/models/furniture/review/__tests__/test_writing_desk_spec.py
```

The suites check revised relationships, rounded contact witnesses, bounds,
ground contacts, seating divisions, tables, LOD attachment margins, analytic
triangle allowances, reference preservation, unaffected
furniture inputs and sampling error limits. They do not generate or certify a
mesh. The user approved committing the revised document.

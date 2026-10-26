# Work Chair - Reviewed Construction Contract

Status: original five-view sheet retained; revised documentation approved for commit. No generated model, app rendering, seating behavior or rig is verified.

## Authority and unit

- [Original sheet](review/02-work-chair-v1.png).
- [Numeric specification](furniture-model-spec.json), `modules[moduleId=work-chair]`.
- [Common construction](GEOMETRY-SUPPLEMENT.md).
- [Surface defaults](SURFACE-RECIPES.md).
- [Shared sizing and production rules](../README.md).

One unit comprises eight closed solids: seat, backrest, four circular-section
legs and two back posts. No arms, wheels, adjustment knob, piping, swivel base,
extra cushions or props. The current rounded-box/round-leg design can be produced
programmatically; Blender is optional. This document supplies construction
clarifications, not a factory implementation. The two back posts are shortened
from their lower ends to match the reference. Other component dimensions,
reference pixels and other furniture inputs are preserved.

## Scene identity restriction

This standalone green four-legged chair remains a reviewed catalog design. It is
not approved as the lower-left chair in `architecture/review/approved-office-reference.jpg`:
the visible source chair behind the actor is dark and its silhouette differs.
Do not infer a scene assignment from the generic `work-chair` name. That scene
position remains empty until a reference-specific chair is reviewed. The source
crop occludes much of the seat and base; wheels, armrests and hidden supports
are not established by this observation. No geometry or default appearance of
this standalone asset is changed by the scene rejection.

## Coordinates and component dimensions

Metres; +Z up, -Y front, +X right. The authored root remains (0,0,0). Final default
XYZ bounds are **420 x 460 x 700 mm**. After back-assembly positioning, X spans
-210..210 mm and Y spans -220..240 mm: the bounding-box Y midpoint is +10 mm,
not zero. The root is a placement datum; do not recenter the chair to that midpoint.
This clarifies the shared shorthand of a ground-centred origin for this asset.

Table centres are **before** each component's local rotation and the shared
back-assembly translation. Sizes and radii are raw/default millimetres. Circular
leg X/Y dimensions below are diameters, not square widths.

| Part         | Centre XYZ                   | Full size XYZ        | Inward radius | X rotation degrees |
| ------------ | ---------------------------- | -------------------- | ------------- | ------------------ |
| seat         | (0,-20,325)                  | 420 x 400 x 70       | 25            | 0                  |
| backrest     | (0,170,554)                  | 400 x 75 x 285       | 33            | -7                 |
| leg-1        | (-163,-165,150)              | 25 x 25 x 300        | 2             | 0                  |
| leg-2        | (163,-165,150)               | 25 x 25 x 300        | 2             | 0                  |
| leg-3        | (-163,150,150)               | 25 x 25 x 300        | 2             | 0                  |
| leg-4        | (163,150,150)                | 25 x 25 x 300        | 2             | 0                  |
| back-post--1 | (-140,173.435658,427.981189) | 22 x 22 x 283.617355 | 3             | -7                 |
| back-post-1  | (140,173.435658,427.981189)  | 22 x 22 x 283.617355 | 3             | -7                 |

The two post IDs are existing identifiers; preserve their spelling. Legs have
equal endpoint diameters and X/Y positions: they are vertical cylinders despite
the shared primitive name `tapered-round-leg`. Their endpoints are Z=0/300 mm.
The seat spans Z=290..360 mm, so its top datum remains (0,-20,360) mm.

## Back assembly rotation and positioning

Construct the ideal inward-rounded surfaces before positioning. For a rounded
box of full size L and radius r, the inset-box half-size is h=L/2-r; the ideal
surface is its Minkowski sum with a radius-r sphere. Rotate each back component
by a=-7 degrees **about its own centre**, then apply one shared translation t:
pPlaced=c+Rx(a)*(p-c)+t. Do not rotate all three centres about the world origin.

For cA=cos(a), sA=sin(a), the rounded support half-extents are:

- `eY=abs(cA)*hY+abs(sA)*hZ+r`.
- `eZ=abs(sA)*hY+abs(cA)*hZ+r`.

Over the three back parts only, let MY=max(centreY+eY), MZ=max(centreZ+eZ).
Then t=(0,0.24-MY,0.70-MZ). The backrest owns both maxima. This uses the ideal
rounded surface, not the rotated unrounded box and not a different bounding box
for each LOD. The resulting shared translation is approximately
**(0,19.188849,3.767784) mm**. Compute from inputs; do not use rounded display
numbers as new authoritative positions. Seat and legs receive no such translation.

After translation, backrest Y spans 138.377698..240 mm and Z spans
415.535569..700 mm. Each post Y spans 164.767616..220.481399 mm and Z spans
290..573.497946 mm. Both keep their original X centres. The -7-degree
rotation makes the top lean toward +Y, away from the front.

## Connections and visible consequences

Each leg embeds into the seat by a 10 mm axial range, Z=290..300 mm. Points at
its own X/Y and Z=297 mm lie inside both the leg's straight core and the rounded
seat. Do not rely only on an unrounded bounding-box overlap. Bottom caps have
flat contact discs at Z=0 after inward rim beveling.

For each back post at X=+/-140 mm, these placed metre coordinates are strictly
inside both joined rounded volumes:

- Seat/post: (X,0.174,0.320).
- Backrest/post: (X,0.200,0.500).

### Reference review and lower-end correction

The BACK view shows two back posts ending at the seat's lower edge. The four
members continuing toward the ground are legs, not extra post tails. FRONT,
RIGHT SIDE and THREE-QUARTER show no additional suspended post ends below the
seat. TOP cannot establish this lower-end height. These illustrative views
support the connection rule, not an exact millimetre measurement.

A [back-view inspection crop](review/02-work-chair-post-review-crop.png) uses an unretouched crop
from (1120,210) to (1390,530) on the unchanged 1536 x 1024 sheet,
enlarged 3x to 810 x 960 for inspection. It is inspection evidence, not a new
reference design. Small drawn edge overlaps are not evidence for a 56 mm stub.

The previous 340 mm posts reached Z=234.037622 mm, approximately 55.962378 mm
below the seat bottom. That numeric input conflicts with the drawing and is
superseded. Set each post's minimum Z to the seat bottom **290 mm** while
preserving the original upper local-axis endpoint and -7-degree inclination.
This is a lower-end length correction, not moving the entire post upward.

For reproduction from the prior raw centre c0=(+/-0.14,0.17,0.4), length L0=0.34,
radius r=0.003 and transverse half-size hY=0.011-r, use the already-defined t:

- `zOld=c0Z+tZ-(abs(sin(a))*hY+cos(a)*(L0/2-r)+r)`.
- `delta=(0.290-zOld)/cos(a)` = approximately 0.05638264541034 m.
- `L=L0-delta` = approximately 0.28361735458966 m.
- `c=c0+Rx(a)*(0,0,delta/2)`.

The numeric file stores the corrected raw centre/length; generators consume
those current values and must not apply this migration a second time. Table
entries are rounded to six decimals in mm; use the numeric inputs for assembly.
Both placed upper bounds remain Z=573.497946 mm. Their lower bounds are now
Z=290 mm, with no post surface below the seat bottom. Portions along the rear
seat face may remain visible, as shown in BACK; do not hide the entire post
inside the cushion or merge it with a rear leg. The seat/post and backrest/post
witnesses above remain inside both joined volumes after shortening.

The four feet alone reach the ground. The vertical backrest/seat gap remains
approximately 55.535569 mm at their extrema. This review corrects the dangling
post discrepancy; it does not certify complete model-to-image correspondence.

Eight independently closed solids may have intentional hidden overlaps at
attachments. Keep all caps, including hidden ones; no exposed coplanar duplicate
faces or lighting tricks conceal disconnections. This is a static assembly,
not a physically engineered mechanism or a validated ergonomic chair.

## Overall sizing and replacement

Complete the default assembly first. For D=(0.42,0.46,0.70) and requested positive
extents T, pInstance=pPlaced*T/D about the fixed root, once. Omitted axes retain
D; reject nonfinite/nonpositive requests. Scale every component, attachment and
seat datum together. Do not repeat back normalization after instance sizing or
recenter the seat/post pieces individually. Nonuniform scale may change the
apparent back angle and make circular legs elliptical; do not compensate by
retilting or rebuilding the legs. Bounds refer to local size before placement.

| Region   | Parts           | Default material | sRGB    | Roughness |
| -------- | --------------- | ---------------- | ------- | --------- |
| Seat     | seat            | sage             | #78836A | 0.93      |
| Backrest | backrest        | sage             | #78836A | 0.93      |
| Posts    | both back posts | dark-frame       | #363832 | 0.70      |
| Legs     | all four legs   | dark-frame       | #363832 | 0.70      |

Each region is independently replaceable even when defaults match. Use region
material, otherwise chair material, otherwise preset; then region colour,
otherwise chair colour. Preserve other material properties and other instances.
Defaults are opaque, metallic=0, emission=0, transmission=0, without baked
lighting, texture weave, normal/displacement maps or painted seam lines. Default
surfaces are solid colours, so they need no wood-grain mapping. A replacement
material owns its mapping under the shared resized-local-space rules.

## Views and tessellation

The sheet includes elevated/illustrative views; its TOP is not a calibrated
orthographic top. Do not change leg heights, move the rear posts or add a seam
because an illustration contour suggests one. Canonical front looks along +Y,
right along -X, back along -Y, top along -Z. Record one three-quarter camera and
inspect the rear/underside as well as the front during model review.

Use the ideal rounded shapes as geometric authority. The following are minimum
cushion bevel subdivisions and unverified whole-chair budgets:

| LOD  | Cushion bevel subdivisions | Whole-chair triangle ceiling | Maximum error - default metres |
| ---- | -------------------------- | ---------------------------- | ------------------------------ |
| LOD0 | 6                          | 4000                         | 0.001                          |
| LOD1 | 4                          | 2200                         | 0.002                          |
| LOD2 | 2                          | 900                          | 0.004                          |

For seat/backrest corners, use the normalized barycentric octant grid at LOD0/1
and a normalized centre fan at LOD2, as defined in the
[desk corner construction](WRITING-DESK-SPEC.md#view-interpretation-and-lod).
Match boundary samples between corners and edge strips. Posts start with 3/2/1
bevel subdivisions, using barycentric-grid/centre-fan/single-triangle corners.
The 33 mm backrest radius gives conservative base-sampling error bounds of
0.816106 / 1.887302 / 3.747088 mm before any further boundary-preserving refinement.
Do not use the desk's much smaller radius as the cushion error oracle.

Legs use 32/24/12 radial segments and 3/2/1 quarter-rim subdivisions for LOD0/1/2.
For radius R=12.5 mm, rim radius b=2 mm and height H=300 mm, the bottom rim profile
is rho=R-b+b*cos(theta), z=b+b*sin(theta), theta=-pi/2..0. Mirror about Z=H/2
for the top. Connect the two straight-side rings, and cap at Z=0/H with flat fans
of radius R-b. Sample azimuth from +X with uniform angular steps. This defines
an inward rim bevel without rounding the entire cylinder into a capsule.

### Preserve exact support planes

Each tier must include support witnesses of the rotated rounded backrest at
max Y=240 mm and max Z=700 mm, plus seat X/front-Y and leg Z=0 extrema. For unit
world-local support direction e, take d=Rx(a)^T*e and q=h*sign(d)+r*d;
use sign(0)=0. Then c+Rx(a)*q+t is an ideal support point. Include these points
in the relevant edge/corner sampling, splitting adjacent patches consistently.
Do not append isolated vertices, move existing surface samples off the ideal
surface or add disconnected triangles merely to manipulate a bounding box.
Additional samples and their triangles count toward each tier's ceiling.

All tiers use the same ideal-derived placement t, not individually fitted
placements. Compare bidirectional surface distance adaptively per seat,
backrest, post and leg; count every cap and hidden face. Preserve eight closed
parts, four ground contacts, post overlaps and named appearance regions.
Sampling checks do not prove the final triangulation's error or budget. Reject
any tier that exceeds either; do not silently relax limits or remove anatomy.
These budgets do not certify runtime performance or LOD switching behavior.

## Document validation

Run both furniture document suites:

```sh
python3 -B assets/asyra-office/models/furniture/review/__tests__/test_work_chair_spec.py
python3 -B assets/asyra-office/models/furniture/review/__tests__/test_writing_desk_spec.py
```

Checks cover unchanged source fields, the authorized post correction, rounded
support calculations, eight attachment
witnesses, four grounded leg inputs, tables, regions, view-independent size rules
and base tessellation error bounds. They do not produce a mesh, certify support
sample insertion, reproduce the sheet exactly or validate app behavior. Final
model review must show matched views and enlarged post ends, post/cushion joins,
four feet and rotated backrest extrema. Verify that both post lower ends meet
the seat bottom without additional hanging stubs in every LOD.

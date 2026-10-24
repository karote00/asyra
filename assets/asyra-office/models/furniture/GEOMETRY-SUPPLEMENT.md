# Group 4A - Furniture Geometry Specification

Use with [furniture-model-spec.json](furniture-model-spec.json). Units m, +Z up, -Y front, +X right. The origin is the furniture's ground placement centre; component centre is local and size order is X/Y/Z. Rotate only explicitly specified components: construct and bevel first, rotate around their own centres, then apply the specified assembly translation.

## Shared construction

- rounded-box: closed box from size, with all edges beveled inward by radius using 3 circular-arc segments, without increasing bounds. Smooth bevel normals on fabric planes without adding random bulges, creases, or tufting.
- tapered-square-leg: create XY-parallel square rings at bottomCentre/topCentre with side lengths bottomWidth/topWidth. Connect corresponding corners and cap both ends. Centre offsets create inclination; do not rotate a whole leg and leave its bottom uneven. Bevel edges inward by radius with 3 segments.
- tapered-round-leg: same endpoint rules, interpreting widths as diameters. Use 32-point rings, connected sides, closed ends, and inward radius bevels with 3 segments. Fabric and wooden feet need only simple geometry; add no metal connectors.
- beveled-cylinder: along Z, 64 segments, capped ends, inward edgeRadius bevel with 3 segments and unchanged bounding height.
- Small overlaps hidden inside shells are allowed, but no exposed coplanar z-fighting faces. Do not hide intersections with black lines, shadows, or patches. Close undersides. All ground-contact feet end at Z=0.

## Writing desk

The [desk construction contract](WRITING-DESK-SPEC.md) supplies the current
programmatic route, detailed contacts, default/instance sizing, appearance and
LOD requirements. Its desk-specific clarifications take precedence.

Top size 1.20 × 0.60 × 0.04, Z=0.61–0.65. Four charcoal square legs at X=±0.54, Y=±0.24 run from Z=0 to 0.61. Four wooden aprons sit beneath the top: front/back length 1.06, sides 0.45, centres/thicknesses from JSON.

Front and back are symmetric. No drawers, handles, cross-braces, keyboard tray, or shelf. Top grain runs along X; underside uses the same wood colour. The original does not clearly show the underside, so four legs and aprons are explicit simple completions. The unit includes no laptop, cup, chair, or rug.

## Work chair

The [work-chair contract](WORK-CHAIR-SPEC.md) owns exact rounded support bounds,
shared back placement, corrected post termination, instance sizing and LOD sampling.
Its chair-specific clarifications take precedence over the common defaults.

One green rounded seat, one backrest, two dark back posts, and four dark round legs. Seat top Z=0.36, width 0.42, depth 0.40. Rotate the backrest -7° about local X so its top leans backward; rotate both posts similarly.

Then apply the same Y/Z translation to the backrest and posts under JSON normalizeBackAssembly so their combined max Y=0.24 and max Z=0.70. Seat front Y=-0.22 gives total depth 0.46. Do not move posts independently to match generated perspective differences. Retain embedded post portions inside seat/backrest so connections remain intact. The corrected lower post ends stop at the seat bottom Z=0.290 m; no hanging stubs extend below it. Portions against the rear seat face may remain visible. The work-chair contract defines the shortened length while preserving the upper endpoints.

The original character obscures legs/posts. Four legs, no wheels, and no arms are chosen completions, not a mechanism proven by the image. Rear uses the same green, with no pocket, logo, or adjustment knob. Fine image edge lines indicate cushion contours; do not add piping cords.

## Green two-seat sofa

The [sofa construction contract](TWO-SEAT-SOFA-SPEC.md) owns the revised numeric
assembly, connections, sizing, appearance and LOD targets. These sofa-specific
rules supersede the generic three-segment sampling default.

One base, one rear shell, two arms, two seat cushions, two back cushions and
four short round wooden feet form twelve closed parts. Seat top Z=0.34, arm
top Z=0.53, rear-shell top Z=0.60 and back-cushion top Z=0.70. Cushion centres
X=+/-0.278 and width 0.545 leave an 0.011 m central gap; no black seam texture.

Back cushions rotate -10 degrees about their own centres, with their corrected
lower portions overlapping the seat cushions. Arms extend to Z=0.06; feet at
X=+/-0.615, Y=+/-0.23 attach beneath the arms and extend to Z=0.08. The inset
base overlaps arms and rear shell without coincident exterior side planes.
Do not restore the former floating rear-shell/base contact or long exposed feet.
The sheet's RIGHT SIDE height label 0.30 m is an annotation error; overall
height is 0.70 m. The sheet is otherwise retained as the appearance reference.

The rear is plain green and all undersides are closed. Structural cushions
belong to the sofa; yellow throw pillows are excluded separate assets. Internal
springs and wooden slats are not modeled. Full numeric tables and attachment
witnesses are in the sofa contract; no actual model is verified.

## Orange lounge armchair

Base, separate seat cushion, enclosing U-shaped back/arm shell, and four splayed round wooden legs. Seat max Z=0.34, back max Z=0.69, front arms max Z=0.45.

Horizontal U-shell outer contour follows JSON: half-width a=0.31, front f=-0.305, back b=0.305, rear corner radius r=0.11. Start left-front (-a,f), line to (-a,b-r), quarter-circle centred at (-a+r,b-r) from 180°→90° to (-a+r,b), rear line to (a-r,b), arc centred at (a-r,b-r) from 90°→0° to (a,b-r), then line to right-front (a,f). Use 12 intervals per corner and at least one interval per 0.025 m on straight segments.

The inner contour is an inward parallel offset by thickness=0.075, with inner rear radius 0.035. Opening faces -Y; cap both front ends across the section. Bottom Z=0.21. At each contour point, u=clamp((y-f)/(b-f),0,1), topZ=0.45+0.24×(3u²−2u³). Corresponding inner/outer points share height; connect and close tops, bottoms, and sides.

Bevel upper edges, front ends, and bottom edges by 0.022 with 3 circular-arc segments, cutting both inner/outer edges inward. No extra rear cushion. This recipe fixes the shell/back shape; sheet curvature is for appearance comparison. If the model differs from approved sheets, revise the recipe rather than inventing hidden patches.

Offset leg centres create splay. Tops Z=0.17 intersect the base spanning Z=0.145–0.285 for attachment. No wheels or swivel disc underneath.

## Round wooden coffee table

The [coffee-table contract](COFFEE-TABLE-SPEC.md) owns tabletop and tapered-leg
profiles, horizontal caps, embedded joints, sizing, mapping and LOD rules.
Its part-specific sampling and rim construction supersede the common defaults.

True circular top: radius 0.31, thickness 0.035, top Z=0.32. Three splayed round
legs are spaced 120 degrees, with upper/lower centre radii 0.18/0.24 m. Corrected
upper caps reach Z=0.295, embedding 10 mm in the tabletop; lower caps remain at
Z=0. Use tangent profile fillets and XY shear, not whole-leg rotation. Nominal
32/44 mm diameters differ from the smaller rounded flat cap diameters.

The reference projections are not calibrated and TOP has contour distortion.
Use one circular top and one three-leg arrangement across all views. No fourth
leg, shelf, underside platform or attached props. Underside and legs have solid
replaceable default colours; tabletop grain uses the coffee-table mapping.
No production model or visual match is verified by this documentation.

## Dimensions, use, and future verification

Heights match the visual proportions of the earlier 1.20 m chibi characters; they are design choices, not real-world ergonomic standards. surfaceHeight and seatDatum are local geometry references, not existing app seating/interaction contracts.

Future modeling should check bounds, leg counts, ground contact, seat heights, cushion counts, and closed front/back/underside geometry with tolerance 0.002, then compare five views. Perspective/detail deviations prevent pixel-level engineering use of the sheets. No Blender, model export, or interaction was executed here.

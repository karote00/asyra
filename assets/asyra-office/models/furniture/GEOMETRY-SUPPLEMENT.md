# Group 4A - Furniture Geometry Specification

Use with [furniture-model-spec.json](furniture-model-spec.json). Units m, +Z up, -Y front, +X right. The origin is the furniture's ground placement centre; component centre is local and size order is X/Y/Z. Rotate only explicitly specified components: construct and bevel first, rotate around their own centres, then apply the specified assembly translation.

## Shared construction

- rounded-box: closed box from size, with all edges beveled inward by radius using 3 circular-arc segments, without increasing bounds. Smooth bevel normals on fabric planes without adding random bulges, creases, or tufting.
- tapered-square-leg: create XY-parallel square rings at bottomCentre/topCentre with side lengths bottomWidth/topWidth. Connect corresponding corners and cap both ends. Centre offsets create inclination; do not rotate a whole leg and leave its bottom uneven. Bevel edges inward by radius with 3 segments.
- tapered-round-leg: same endpoint rules, interpreting widths as diameters. Use 32-point rings, connected sides, closed ends, and inward radius bevels with 3 segments. Fabric and wooden feet need only simple geometry; add no metal connectors.
- beveled-cylinder: along Z, 64 segments, capped ends, inward edgeRadius bevel with 3 segments and unchanged bounding height.
- Small overlaps hidden inside shells are allowed, but no exposed coplanar z-fighting faces. Do not hide intersections with black lines, shadows, or patches. Close undersides. All ground-contact feet end at Z=0.

## Writing desk

Top size 1.20 × 0.60 × 0.04, Z=0.61–0.65. Four charcoal square legs at X=±0.54, Y=±0.24 run from Z=0 to 0.61. Four wooden aprons sit beneath the top: front/back length 1.06, sides 0.45, centres/thicknesses from JSON.

Front and back are symmetric. No drawers, handles, cross-braces, keyboard tray, or shelf. Top grain runs along X; underside uses the same wood colour. The original does not clearly show the underside, so four legs and aprons are explicit simple completions. The unit includes no laptop, cup, chair, or rug.

## Work chair

One green rounded seat, one backrest, two dark back posts, and four dark round legs. Seat top Z=0.36, width 0.42, depth 0.40. Rotate the backrest -7° about local X so its top leans backward; rotate both posts similarly.

Then apply the same Y/Z translation to the backrest and posts under JSON normalizeBackAssembly so their combined max Y=0.24 and max Z=0.70. Seat front Y=-0.22 gives total depth 0.46. Do not move posts independently to match generated perspective differences. Retain embedded post portions inside seat/backrest so connections remain intact.

The original character obscures legs/posts. Four legs, no wheels, and no arms are chosen completions, not a mechanism proven by the image. Rear uses the same green, with no pocket, logo, or adjustment knob. Fine image edge lines indicate cushion contours; do not add piping cords.

## Green two-seat sofa

One base, one rear shell, two arms, two seat cushions, two back cushions, and four short round wooden feet. Seat maximum Z=0.34, arms Z=0.53, rear shell Z=0.70. Left/right seat and back cushions have centres X=±0.278 and width 0.545, leaving a 0.011 gap; no black seam texture.

Each back cushion leans back by X=-10°; other JSON parts remain unrotated. Rear shell is solid green; cushion undersides are closed in the same colour. The two yellow throw pillows are separate objects and excluded. Do not omit structural back cushions as though they were loose pillows. Internal structure is hidden in the base; do not model unseen springs or wooden slats.

## Orange lounge armchair

Base, separate seat cushion, enclosing U-shaped back/arm shell, and four splayed round wooden legs. Seat max Z=0.34, back max Z=0.69, front arms max Z=0.45.

Horizontal U-shell outer contour follows JSON: half-width a=0.31, front f=-0.305, back b=0.305, rear corner radius r=0.11. Start left-front (-a,f), line to (-a,b-r), quarter-circle centred at (-a+r,b-r) from 180°→90° to (-a+r,b), rear line to (a-r,b), arc centred at (a-r,b-r) from 90°→0° to (a,b-r), then line to right-front (a,f). Use 12 intervals per corner and at least one interval per 0.025 m on straight segments.

The inner contour is an inward parallel offset by thickness=0.075, with inner rear radius 0.035. Opening faces -Y; cap both front ends across the section. Bottom Z=0.21. At each contour point, u=clamp((y-f)/(b-f),0,1), topZ=0.45+0.24×(3u²−2u³). Corresponding inner/outer points share height; connect and close tops, bottoms, and sides.

Bevel upper edges, front ends, and bottom edges by 0.022 with 3 circular-arc segments, cutting both inner/outer edges inward. No extra rear cushion. This recipe fixes the shell/back shape; sheet curvature is for appearance comparison. If the model differs from approved sheets, revise the recipe rather than inventing hidden patches.

Offset leg centres create splay. Tops Z=0.17 intersect the base spanning Z=0.145–0.285 for attachment. No wheels or swivel disc underneath.

## Round wooden coffee table

A true circular top, radius 0.31, thickness 0.035, top Z=0.32. Three round wooden legs spaced 120° around it, upper radius from centre 0.18 and lower 0.24; directions/coordinates follow JSON. Three legs, not four, with no central column, lower shelf, or attached props.

Generated FRONT/BACK/SIDE leg projections are not fully consistent and TOP has slight contour distortion. Do not build different geometry for each view. The numeric true circle and one set of three legs are the fixed design. Underside uses the same wood colour; leg tops attach directly to the tabletop bottom.

## Dimensions, use, and future verification

Heights match the visual proportions of the earlier 1.20 m chibi characters; they are design choices, not real-world ergonomic standards. surfaceHeight and seatDatum are local geometry references, not existing app seating/interaction contracts.

Future modeling should check bounds, leg counts, ground contact, seat heights, cushion counts, and closed front/back/underside geometry with tolerance 0.002, then compare five views. Perspective/detail deviations prevent pixel-level engineering use of the sheets. No Blender, model export, or interaction was executed here.

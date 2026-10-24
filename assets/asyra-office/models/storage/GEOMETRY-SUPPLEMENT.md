# Storage Furniture - Geometry Supplement

Units m, +Z up, -Y front. JSON size order X/Y/Z; centre is local. Cabinet origins are ground centres; wall shelf origin is the rear-edge bottom centre, with mounting plane Y=0. Original/current sheets control appearance, while numeric data defines reproducible geometry.

## Shared panels

The snack cabinet uses the explicit union-first and contact rules below rather than independently rounding its touching carcass panels. The following general rounded-box definition still applies to isolated rounded parts; bookcase and wall shelf remain unchanged in this review.

rounded-box is closed, with all outer edges beveled inward by radius using 3 circular-arc segments, without enlarging bounds. Keep planar normals and smooth arc normals. Front, back, and bottom surfaces are complete; no exposed duplicate contact faces. Bookcase and snack cabinet use actual side, back, bottom, and shelf panels. Compartments are empty space, not black rectangles on solid boxes.

Grain directions follow the surface document. No contents, shadow maps, lights, colliders, or animation. Doors remain separate for future replacement, but there is no hinge or opening-mechanism contract here.

## Snack cabinet

Use the [snack-cabinet specification](SNACK-CABINET-SPEC.md) and JSON together. Complete size is 0.700 x 0.378 x 1.000 m including handles; body depth is 0.340 m. Origin remains the body ground centre, so complete Y bounds are -0.208..0.170 rather than symmetric around zero.

The 25 mm top cap spans the full 700 mm width at Z=975..1000 mm. Side panels are 25 mm thick and occupy Z=40..975 mm. The 40 mm plinth is inset 30 mm at both sides, 40 mm at front and 20 mm at back. Union the eight carcass boxes, remove internal faces, then round exposed convex edges inward by 3 mm. Do not bevel contact faces separately and create cracks. Concave cavity corners stay sharp.

Two upper clear compartments remain: lower Z=0.460..0.6975, upper Z=0.7225..0.975, width 0.650 and depth 0.322. Their shelf boards are 25 mm thick. These are empty regions, not dark rectangles.

Lower doors each have size 0.319 x 0.020 x 0.366, centres X=+/-0.1635, Y=-0.168, Z=0.250. Centre gap stays 8 mm; side, top and bottom gaps are 2 mm. Doors end at Z=0.067..0.433 without colliding with the bottom or divider. A field on each door opens at Y=-0.178, width 0.259 and height 0.306. Its 2 mm inset transition descends 4 mm toward +Y, giving a 0.255 x 0.302 floor at Y=-0.174 and 16 mm residual thickness. Four planar slopes meet at 45-degree XZ mitres; no raised frame is added.

Handle front remains Y=-0.208. Each bar unions with two 12 x 15 x 12 mm rounded mounts. The mounts' 4 x 4 mm planar rear pads touch the door at Y=-0.178, rather than entering it. Carcass, two doors and two handles form five closed output solids; actual mesh validation remains pending. Original rear dots do not add screws. No additional lower shelf, drawer, glazing or light is supplied.

The original office does not clearly identify a standalone snack cabinet. This is the existing new matching-style design; the current revision fixes numeric assembly while retaining its sheet.

## Narrow bookcase

Outer width 0.42, depth 0.26, height 0.82. Side thickness 0.022, plinth height 0.035, back thickness 0.018. Two internal shelves of thickness 0.025 at centres Z=0.297 and 0.547 form three open compartments.

Bottom-to-top clear Z intervals are 0.057–0.2845, 0.3095–0.5345, 0.5595–0.798; clear width 0.376 and depth 0.242. No front doors; rear fully closed. Underside shares wood colour; no casters or exposed thin legs. Original books/plants remain separate. Location/colour come from the shelf beside the sofa; exact compartment count and backing are chosen completions.

## Wall shelf

One plank spans X=-0.30–0.30, Y=-0.18–0, Z=0–0.035. Rear edge mounts at Y=0; origin is that edge's bottom centre for app wall alignment. Front and side edges bevel 0.004 with 3 segments. Keep the rear face and its four adjoining edges straight.

Two rear holes at X=±0.20, Z=0.0175 extend 0.025 along -Y, radius 0.004, 48 circumferential segments. They are blind holes, not through-holes. Around each is a shallow 0.034 × 0.002 × 0.018 recess centred at (±0.20,-0.001,0.0175), corner radius 0.002. Cut the rectangular recess, then place a matching thin oak-dark surface at its floor Y=-0.002 while retaining the central circular hole. No metal bracket protrudes from the back.

Hole/recess locations are completions of a hidden mounting face. Include no wall, expansion screws, pins, brackets, or additional planks. This is not a mounting-safety or load-rating specification. The app chooses plank count, vertical spacing, and height.

## Future model checks

Only drawings/documents exist; no modeling has been performed. Future checks cover dimensions (tolerance 0.002), snack cabinet's two compartments/two doors, bookcase's three compartments, one wall plank/two blind holes, ground contact, closed backing, real compartment voids, origins, and absence of contents.

Compare the same model from front -Y, right +X, back +Y, top +Z, and oblique (1,-1,0.8). Generated sheets have slight perspective and face tones, not precision projections or textures. Use surface recipes for grain and solid colours.

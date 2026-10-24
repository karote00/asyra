# Storage Furniture - Geometry Supplement

Units m, +Z up, -Y front. JSON size order X/Y/Z; centre is local. Cabinet origins are ground centres; wall shelf origin is the rear-edge bottom centre, with mounting plane Y=0. Original/current sheets control appearance, while numeric data defines reproducible geometry.

## Shared panels

Snack cabinet and bookcase use their explicit union-first rules rather than independently rounding touching carcass panels. The general rounded-box definition below applies to isolated rounded parts. The wall shelf is unchanged in this review.

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

The [bookcase construction specification](BOOKCASE-SPEC.md) preserves the original panel sizes and positions. Its 376 mm top fits between the sides, which reach the full 820 mm height; it is not a full-width cap. Union the eight unrounded inputs before adding 3 mm inward roundovers on exposed convex edges. Remove internal faces, keep concave cavity joints sharp and preserve source material regions. The output must be one closed body without joining slits.

Outer width 0.42, depth 0.26, height 0.82. Side thickness 0.022, plinth height 0.035, back thickness 0.018. Two internal shelves of thickness 0.025 at centres Z=0.297 and 0.547 form three open compartments.

Bottom-to-top clear Z intervals are 0.057–0.2845, 0.3095–0.5345, 0.5595–0.798; clear width 0.376 and depth 0.242. The clear heights are 227.5, 225 and 238.5 mm, not equal. The plinth spans X=-180..180, Y=-90..110 and Z=0..35 mm; insets are 30 mm at both sides, 40 mm front and 20 mm back. The cabinet origin remains the body footprint centre on Z=0. No front doors; rear fully closed. Underside shares wood colour; no casters or exposed thin legs. Original books/plants remain separate. Location/colour come from the shelf beside the sofa; exact compartment count and backing are chosen completions.

## Wall shelf

One plank spans X=-0.30–0.30, Y=-0.18–0, Z=0–0.035. Rear edge mounts at Y=0; origin is that edge's bottom centre for app wall alignment. Front and side edges bevel 0.004 with 3 segments. Keep the rear face and its four adjoining edges straight.

Two rear holes at X=±0.20, Z=0.0175 extend 0.025 along -Y, radius 0.004, 48 circumferential segments. They are blind holes, not through-holes. Around each is a shallow 0.034 × 0.002 × 0.018 recess centred at (±0.20,-0.001,0.0175), corner radius 0.002. Cut the rectangular recess, then place a matching thin oak-dark surface at its floor Y=-0.002 while retaining the central circular hole. No metal bracket protrudes from the back.

Hole/recess locations are completions of a hidden mounting face. Include no wall, expansion screws, pins, brackets, or additional planks. This is not a mounting-safety or load-rating specification. The app chooses plank count, vertical spacing, and height.

## Future model checks

Only drawings/documents exist; no modeling has been performed. Future checks cover dimensions (tolerance 0.002), snack cabinet's two compartments/two doors, bookcase's three compartments, one wall plank/two blind holes, ground contact, closed backing, real compartment voids, origins, and absence of contents.

Compare the same model from front -Y, right +X, back +Y, top +Z, and oblique (1,-1,0.8). Generated sheets have slight perspective and face tones, not precision projections or textures. Use surface recipes for grain and solid colours.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Wall shelf plank

One 600 x 180 x 35 mm plank; X=+/-300, Y=-180..0, Z=0..35 mm. The two rear sockets at X=+/-200 are blind: diameter 8, total depth 25 mm from Y=0, including the 2 mm mounting recess. Remaining bore beyond the recess is 23 mm. Residual wood toward the front is 155 mm; vertical bore margin is 13.5 mm. Recess height 18 leaves 8.5 mm above and below. Keep each circular entrance open through its dark recess-floor region; do not cover it with a colored rectangle. Mount hardware is excluded. Rear mating surfaces remain planar after exposed-edge rounding.

Oak and grain retain the existing storage palette. Shelf, recess floor and bore wall remain addressable surface regions; a dark floor is an intrinsic default, not baked occlusion. LoD must retain two blind sockets, the planar mounting face and the board envelope. Reduce edge/ring sampling, never replace sockets with black dots.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

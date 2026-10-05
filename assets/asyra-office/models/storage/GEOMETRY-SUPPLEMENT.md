# Storage Furniture - Geometry Supplement

Units m, +Z up, -Y front. JSON size order X/Y/Z; centre is local. Cabinet origins are ground centres; wall shelf origin is the rear-edge bottom centre, with mounting plane Y=0. Original/current sheets control appearance, while numeric data defines reproducible geometry.

## Shared panels

rounded-box is closed, with all outer edges beveled inward by radius using 3 circular-arc segments, without enlarging bounds. Keep planar normals and smooth arc normals. Front, back, and bottom surfaces are complete; no exposed duplicate contact faces. Bookcase and snack cabinet use actual side, back, bottom, and shelf panels. Compartments are empty space, not black rectangles on solid boxes.

Grain directions follow the surface document. No contents, shadow maps, lights, colliders, or animation. Doors remain separate for future replacement, but there is no hinge or opening-mechanism contract here.

## Snack cabinet

Body width 0.70, depth 0.34, height 1.00; recessed plinth height 0.04, inset on all sides. Side thickness 0.025; top/bottom panels fit between sides; back thickness 0.018.

Two upper clear compartments: lower Z=0.460–0.6975, upper Z=0.7225–0.975, width 0.65, depth 0.322. Intermediate shelf thickness 0.025, centre Z=0.71. Upper/lower section divider centre Z=0.4475, top 0.46. There are two compartments; counting top/bottom boards as shelves does not add compartments.

Lower doors each have width 0.321, height 0.38, thickness 0.02, centres X=±0.1645, Y=-0.168, Z=0.25, gap 0.008. Front Y=-0.178. Each centred shallow rectangular field is width 0.261, height 0.32, depth 0.004. A 0.002-wide inward slope transitions to the recessed floor, reducing its width/height by another 0.004 each. Do not cut through the door.

Handles and upper/lower mounts follow JSON. Handle front Y=-0.208, cabinet rear Y=0.17, total depth 0.378. Add no compartments, drawers, glass, or light strips behind doors. Rear is plain wood; small corner dots in the sheet are illustrative, not modeled screw decorations.

The original does not clearly identify a standalone snack cabinet. This is a new design in the same warm-wood style. Unreadable dimensions and rear structure are fixed here rather than left to tool invention.

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

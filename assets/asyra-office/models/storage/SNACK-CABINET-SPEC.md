# Snack Cabinet - Construction Specification

Status: construction documents approved by the user for commit. The [original multiview drawing](review/01-snack-cabinet-v2.png) is unchanged. The matching-style cabinet is an authored design, not a recovered object clearly visible in the central office. No model, boolean mesh, Blender output or app performance has been verified.

## Unit, axes and corrections

One placeable unit contains a carcass, two lower door leaves and two handles. Keep two open upper compartments and an empty enclosed lower compartment. Do not add contents, another shelf, drawers, hinges, screws or opening animation. The sheet's small rear dots are illustrative, not a hardware requirement.

Use metres, +Z up and -Y front. The origin is the body footprint centre on Z=0. Default complete bounds are X=-0.350..0.350, Y=-0.208..0.170, Z=0..1.000: **700 x 378 x 1000 mm**, including handles. The wood body depth is 340 mm. The complete bounding-box centre has Y=-19 mm; do not recenter the model and lose the body placement origin.

This revision resolves three numeric assembly problems while preserving the sheet's design:

- The top is a full-width 700 mm cap, flush with the sides. Side panels stop at its underside rather than extending beside an inset top.
- Each lower door is 319 x 20 x 366 mm. The previous 321 x 20 x 380 mm leaves had no side clearance and overlapped the bottom and divider by 5 mm. Revised leaves retain the 8 mm centre gap and add 2 mm on each outer side, above and below.
- Handle mounts terminate on the door front at Y=-178 mm. Their depth is 15 mm, eliminating the former 5 mm penetration into the door without moving the visible handle front.

## Component dimensions

The [JSON](storage-model-spec.json) owns metre values. This table lists X,Y,Z sizes and centres in millimetres. Existing part identifiers are retained. Dimensions describe unrounded envelopes; inward edge treatment never enlarges them.

| Part               | Size X,Y,Z (mm) | Centre X,Y,Z (mm) | Treatment                                  |
| ------------------ | --------------- | ----------------- | ------------------------------------------ |
| side-left          | 25,340,935      | -337.5,0,507.5    | Carcass input                              |
| side-right         | 25,340,935      | 337.5,0,507.5     | Carcass input                              |
| top                | 700,340,25      | 0,0,987.5         | Carcass input                              |
| bottom             | 650,340,25      | 0,0,52.5          | Carcass input                              |
| back               | 650,18,910      | 0,161,520         | Carcass input                              |
| plinth             | 640,280,40      | 0,10,20           | Carcass input                              |
| shelf-1            | 650,322,25      | 0,-9,447.5        | Carcass input                              |
| shelf-2            | 650,322,25      | 0,-9,710          | Carcass input                              |
| door--1            | 319,20,366      | -163.5,-168,250   | 3 mm exterior roundover and recessed field |
| handle--1          | 14,22,52        | -28,-197,365      | 6 mm rounded box                           |
| handle-mount--1--1 | 12,15,12        | -28,-185.5,348    | 4 mm roundover; 4 x 4 mm rear contact      |
| handle-mount--1-1  | 12,15,12        | -28,-185.5,382    | Same                                       |
| door-1             | 319,20,366      | 163.5,-168,250    | 3 mm exterior roundover and recessed field |
| handle-1           | 14,22,52        | 28,-197,365       | 6 mm rounded box                           |
| handle-mount-1--1  | 12,15,12        | 28,-185.5,348     | 4 mm roundover; 4 x 4 mm rear contact      |
| handle-mount-1-1   | 12,15,12        | 28,-185.5,382     | Same                                       |

The plinth is recessed 30 mm at both X sides, 40 mm at the front and 20 mm at the back. Its bottom is Z=0 and top Z=40 mm. The asymmetrical Y inset follows its specified 10 mm centre offset; do not assume equal front/back offsets.

## Carcass construction and real openings

Union the eight unrounded carcass inputs in the table before edge treatment. Remove their internal/shared faces and weld contacts into one closed wood volume. Retain source surface labels for independent appearance overrides. No input panel remains an independently overlapping closed box in the output carcass.

Apply a 3 mm inward circular roundover only to exposed convex edges of this union. Keep concave compartment corners and internal mating boundaries sharp. In particular, do not round a joining edge on each panel first and leave a slit between the sides, shelves and back. Use tangent quarter-circle profiles on straight edges and compatible radius-3 mm convex corner patches; preserve all planar support and bounding extrema. Exact production triangulation must be checked when implemented.

Open compartment nominal clear envelopes are:

| Space                     | X (mm)    | Y (mm)    | Z (mm)     | Width x depth x height (mm) |
| ------------------------- | --------- | --------- | ---------- | --------------------------- |
| Lower open shelf          | -325..325 | -170..152 | 460..697.5 | 650 x 322 x 237.5           |
| Upper open shelf          | -325..325 | -170..152 | 722.5..975 | 650 x 322 x 252.5           |
| Behind closed lower doors | -325..325 | -158..152 | 65..435    | 650 x 310 x 370             |

These are real empty regions bounded by panels, not dark face textures. Exposed convex edge rounding removes material; it must not fill any of these spaces. The lower space has no additional internal shelf. Its front limit is the door rear plane, not the front of the carcass.

The top occupies Z=975..1000 mm, spanning the entire width. The side panels occupy Z=40..975 mm. The back meets the bottom and top, and its front face is Y=152 mm. No rear ventilation, decoration or hidden cover is added.

## Doors and recessed fields

Left door X=-323..-4 mm, right door X=4..323 mm. Both span Y=-178..-158 mm and Z=67..433 mm. The centre opening is 8 mm, side clearances are 2 mm, and upper/lower clearances are 2 mm. These are planar-edge gaps; the 3 mm inward exterior roundover increases local corner clearance rather than closing it. No leaf intersects the bottom, sides or divider. The existing 2 mm overall-dimension tolerance must not be reused as a clearance tolerance: default-scale side/top/bottom gaps must remain 1.8..2.2 mm, the centre gap 7.8..8.2 mm, and each mounting pad must meet the door plane within 0.01 mm without visible separation or solid penetration. Scale these local-axis tolerances with the unit.

On each door's front plane Y=-178 mm, centre a rectangular field at that door's X centre and Z=250 mm. Its opening is 259 x 306 mm. A 2 mm inward transition in X/Z descends 4 mm into the door, toward +Y. The flat field floor is 255 x 302 mm at Y=-174 mm. Four planar slopes connect corresponding outer and inner corners; their X/Z corner joins are 45-degree mitres. The slope angle from the front plane is atan(4/2)=63.43494882 degrees. The opening and inner outline have sharp rectangular corners; no extra roundover or inset frame is implied.

The surrounding frame is 30 mm wide on every side. Remaining wood behind the field is 16 mm. Cut the field from the door solid and retain a single closed leaf; do not overlay a second thin panel or paint a dark rectangle to fake depth. The doors are distinct solids for replacement; this specification does not add hinges, a swing range or an opening interaction.

## Handles and connections

Each handle bar spans Y=-208..-186 mm and Z=339..391 mm. Its two mounts span Y=-193..-178 mm, at Z=342..354 and 376..388 mm. The bar-to-door standoff is 8 mm in the region between the mounts. Mount and bar envelopes overlap by 7 mm along Y; an interior overlap remains after roundovers, as checked by the numeric contact samples. Their X footprints sit on the flat inner door frame, at the recessed field's boundary without crossing into its slope.

Use an inward radius-4 mm rounded box for each mount. Its remaining central +Y face is a flat 4 x 4 mm contact pad, centred at the mount's X/Z centre and Y=-178 mm. The curved border recedes from the door; it does not penetrate it. Use a radius-6 mm inward rounded box for the bar. Boolean-union each bar with its two mounts and remove the intersection faces, yielding one closed handle. Preserve the flat rear mounting pads on Y=-178 mm. Do not leave rods floating behind the handle or penetrating the door.

The intended output has five closed solids: one carcass, two door leaves and two handles. A handle and its door touch at hidden planar interfaces; each independent solid retains its closure there. No coincident contact face may remain exposed. This differs from the internal faces inside a union, which must be removed. Five solids are an output requirement, not a completed mesh claim.

## Replaceable appearance and defaults

Follow the [shared size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09). Resolve part material, then assembly-group material, then whole-unit material, then its preset. Resolve explicit colour overrides in the same order; absent a tint, retain the selected material's own colour. Do not mutate shared material state belonging to other cabinets.

| Region                                                                    | Default material and colour        | Roughness |
| ------------------------------------------------------------------------- | ---------------------------------- | --------- |
| Carcass wood except plinth; both doors including recess floors and slopes | oak #C7A376 with oak-grain #AF895F | 0.82      |
| Plinth                                                                    | oak-dark #A68760                   | 0.85      |
| Both handle bars and all mounts                                           | dark #44443C                       | 0.80      |

All defaults have alpha 1, metallic 0, transmission 0 and emission 0. The [surface recipes](SURFACE-RECIPES.md) own grain, not screenshot shading. Grain is an intrinsic appearance with replaceable materials, not displaced geometry. Every input part retains an addressable material region even after geometric unions. Original exposed faces retain their source labels. New carcass roundover faces inherit the closest adjacent surviving source face; exact distance ties follow component-table order. No duplicate geometry is needed to preserve those labels.

Vertical side/back/door grain uses (u,v)=(Z,X) on front/back-facing regions and (Z,Y) on side-facing regions. Horizontal boards use (X,Y) on top/bottom and (X,Z) on front edges; short ends remain plain oak. Door recess floors inherit the door's front mapping; slope regions inherit their adjoining front frame mapping. Rounded transitions inherit the selected source region. Evaluate u/v in final resized local metres before placement, so 24 mm grain spacing and 400 mm modulation length remain physical defaults. Plinth and handles are solid-colour defaults. Model materials contain no baked shadows, AO, black cavity rectangles or reference outlines.

## Whole-unit dimensions

For finite positive target sizes (Wx,Dy,Hz), use S=(Wx/0.700,Dy/0.378,Hz/1.000), with omitted axes retaining defaults. Apply this once to all vertices and part centres about (0,0,0), including handles, gaps and recesses. Reject nonfinite, zero and negative extents. The 378 mm denominator includes the handles; using 340 mm would produce the wrong complete depth.

The front and back stay asymmetrical about the origin: Ymin=-0.208*Sy and Ymax=0.170*Sy. All gaps and edge details follow the same scale. Nonuniform scaling may change bevel and field-slope angles; do not rebuild them at fixed millimetres or fixed angles afterward. Transform normals with the inverse transpose and normalize. The support plane remains Z=0. No terrain fitting, door motion or changed shelf count is implied.

## LoD targets and verification limits

| Tier | Circular edge intervals | Triangle budget | Measured triangles |
| ---- | ----------------------- | --------------- | ------------------ |
| lod0 | 3                       | 6000            | Not generated      |
| lod1 | 2                       | 3000            | Not generated      |
| lod2 | 1                       | 1500            | Not generated      |

These are implementation admission budgets, not calculated counts for an existing mesh. All tiers retain the five-solid assembly, full bounds, two open compartments, both door leaves, all four gap dimensions, both recessed fields and both handles with contacting mounts. Keep planar field slopes exact; reduce circular-edge subdivision only. Corner patches must match their adjacent edge sampling without cracks. Boolean result complexity and actual triangle counts must be measured before a tier can pass; no automatic acceptance is claimed. If a tier cannot satisfy the budget while preserving these features, revise the tessellation within those constraints and present evidence instead of silently dropping parts. The app owns screen-space switching.

## Review evidence and later acceptance

The permanent [assembly checks](review/__tests__/test_snack_cabinet_spec.py) verify bounds, origin, nonuniform resizing, carcass input connectivity, panel non-overlap, real cavity envelopes, door clearances, recessed field dimensions, rounded handle/mount intersection samples, mounting planes, defaults and documentation tables. These numeric tests do not prove a boolean mesh is manifold, a bevel implementation is correct, or the app matches the picture.

After separately authorized implementation, inspect front, right, back, top and oblique views, followed by closeups of the cap/side joints, shelf/back joints, four door-gap types, field slopes, handle contacts and underside. Check five closed outputs, no internal union faces, correct material regions and measured LoD budgets. Any geometry or visual failure blocks model acceptance even if these document checks pass.

# Pantry Equipment - Geometry Supplement

All dimensions and component coordinates follow the [JSON](pantry-model-spec.json). Units m, +Z up, -Y front, origin at body bottom centre; size order X/Y/Z and centre is component-local. The user approved committing this design; it is not a model verification result.

## Shared construction

rounded-box is closed with inward circular-arc bevels, 3 segments, actual radius min(radius, shortest edge/2). cylinder uses 48 circumferential segments along its axis, capped at both ends. Preserve underside/rear surfaces with outward normals.

Shapes in subtract are Boolean cutters only, not visible parts. Bevel the outer box, then subtract the specified rounded box; add 0.001 m, 2-segment bevels to exposed cut edges. Do not fake recesses with black planes. Small hidden overlaps are allowed, but no coplanar z-fighting faces. Reliefs, contours, and gaps follow documentation; generated light/dark lines are not material content.

## Refrigerator

Cream-grey body, black plinth, small freezer door, larger fridge door, and two grey handles. Body Z=0.04–1.15; upper door Z=0.77–1.14, lower Z=0.06–0.758, meeting gap 0.012. Door front Y=-0.26. Both handles at X=-0.207; mounts connect door faces to grip bars.

Body width/depth 0.52/0.52; depth including handles 0.557. Rear is the same cream-grey, with no vents, cord, or compressor. Add no side pivots or mechanisms; interiors are not modeled. Image door proportions may differ slightly; use the fixed smaller-upper/larger-lower dimensions. Do not turn this into side-by-side doors or an attached cabinet.

## Water dispenser

Cabinet height 0.79, total with blue bottle 1.12. Cut a front dispensing recess with a thin grey back panel and drip tray below. Tray extends to Y=-0.192, giving total depth 0.362; image depth 0.34 refers to cabinet only.

Two Y-axis cylindrical tap connectors span Y=-0.149..-0.075 (length 0.074, centre Y=-0.112), entering the back panel front at Y=-0.076 by 0.001. Each receives a downward cylindrical nozzle at their front: radius 0.009, length 0.026, centres (±0.046,-0.149,0.661). Each lever has a radius-0.003 vertical connector at Y=-0.126, Z=0.690..0.700, intersecting both tap body and lever. Levers follow JSON, left red/right blue; these are intrinsic colours without emission. Lower cabinet door is a closed thin panel with no interior compartments.

Lathe the profileZR Z/radius curve around Z using 64 circumferential segments. Interpolate adjacent profile points with smoothstep s=3t²−2t³, 8 intervals per segment. Merge top radius=0 into a point and cap the lower end. Two raised bottle rings follow rings: within |z−centreZ|≤height/2, add radius extraRadius×(1+cos(2π(z−centreZ)/height))/2. Bottle is a closed opaque blue form, without liquid, bubbles, or transmission effects.

Tray grooves use the Cartesian product of xCentres and yCentres: 6 slots, each length width and breadth slotBreadth along X. Cut depth down from tray top with end radius slotBreadth/2. Do not cut through. Grooves remain grey, without black stripes.

## Sink cabinet

One wooden cabinet, pale-grey countertop, single basin, two doors, and faucet. Counter height 0.64, width 0.90, depth 0.50. Cut basin clearance from the cabinet itself so a solid cabinet does not fill the basin. Subtract the inner cavity from the outer basin box, retaining bottom thickness. Drain disc is at basin-floor Z=0.5275, not an opening into model internals. No pipes.

Door centres X=±0.2175, width 0.427, centre gap 0.008; front Y=-0.248. Each centred inner field is 0.357 wide, 0.44 high, recessed 0.004 toward +Y, with 0.035 border. A 0.002-wide slope transitions from opening edge to recessed floor, reducing floor width/height by another 0.004 each. Each handle is a U-shaped assembly: one grip bar (18 x 13 x 65 mm, centre X=+/-36, Y=-265, Z=510 mm, inward radius 5 mm) and two mounts (12 x 18 x 12 mm, same X, Y=-251.5, Z=487.5/532.5 mm, inward radius 2 mm). Mounts overlap the bar and enter the door frame/recess floor, while the middle remains open behind the bar. Union the three handle inputs, trim hidden door intersections and retain the handle region. Its front Y=-0.2715 preserves total assembly depth 0.5215. Do not replace the visible U-shaped grip with a solid plate.

Faucet uses two cubic Bézier tube segments, each sampled in 32 intervals: B(t)=(1−t)³P0+3(1−t)²tP1+3(1−t)t²P2+t³P3. Circular section radius 0.012 with 12 segments. Curves lie in YZ; one section basis is fixed X, the other normalize(T×X), where T is the tangent, maintaining continuity. Centreline max Z=0.858 plus tube radius gives approximately 0.87. Cap outlet flat; no water flow. Base and small lever follow JSON.

Rear is a closed same-colour wooden panel with no wall, backsplash, or adjoining cabinets. Plants, cups/jars, soap, and coffee machine are separate from this sink unit.

## Coffee machine

Cut a front cup bay from the rounded cream shell, retaining a dark-grey back, base, and short central upper outlet. Front buttons are vertical at X=0.062, Z=0.255 and 0.23, not a horizontal arrangement potentially implied by the prompt. Use the current sheet's upper-right two-button layout.

Height 0.29, body depth 0.25, total including tray/rear panel 0.2715. Outlet extends from upper housing into the bay. Dark back colour is intrinsic material, not baked shadow. The bay cutter spans Z=0.024..0.206 with radius 0.004; the tray spans Z=0.020..0.032. Its bottom is seated in the housing and its top projects above the cavity floor, including the cutter corner radius. The back liner spans the same Z=0.024..0.206 with a 0.003 inward bevel. Six tray grooves follow the dispenser rule. The sheet's central circular hole is illustrative; this revision does not cut through the base. Top is smoothly closed, rear panel dark grey, with no external tank or grinder.

This is a conservative completion of a small reference countertop appliance, not identification of a specific model. Appearance review should confirm size/style; tools must not replace it with a large professional espresso machine.

## Future model checks

Criteria only, with no modeling performed: check unit counts, dimensions (tolerance 0.002), doors, outlets, actual recess depth, ground contact, closed backs, origins, and materials. Compare the same model from front -Y, right +X, back +Y, top +Z, and oblique (1,-1,0.8).

Sheets contain slight perspective and lighting tones, not calibrated engineering projections. Materials follow solid-colour/intrinsic-texture recipes; scene lighting belongs to the app. Hidden rear choices are explicit; do not freely add ventilation decorations, branding, wiring, or props.

## Ground contacts retained from the reference

The refrigerator and dispenser have four dark feet, not a plinth flattened to the floor. Refrigerator feet are Z=0..0.010, radius 0.015, centres X=+/-0.200/Y=+/-0.160; its plinth now spans Z=0.010..0.040. Dispenser feet are Z=0..0.010, radius 0.012, centres X=+/-0.120/Y=+/-0.130; its plinth spans Z=0.010..0.020. Coffee-machine feet are Z=0..0.004, radius 0.005, centres X=+/-0.072/Y=+/-0.095; its base spans Z=0.004..0.010. Feet contact the existing lower support at a shared plane. These changes preserve the previously specified total heights and widths. The sink keeps its existing continuous toe-kick, without added feet.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Equipment fit and complete dimensions

Use complete extents, including projecting parts: refrigerator 520 x 557 x 1150 mm, dispenser 320 x 362 x 1120 mm, sink 900 x 521.5 x 870 mm, coffee machine 200 x 271.5 x 290 mm. The coffee tray front is Y=-143.5 mm and rear panel reaches +128 mm; the old 258 mm depth omitted the tray. Caption depths generally describe bodies, not all protrusions. The sink faucet's 858 mm centreline maximum plus 12 mm tube radius determines height, not the control-point maximum.

Refrigerator door gap is 12 mm. Sink door gap is 8 mm; field border is 35 mm and recess depth 4 mm with a 2 mm transition. Dispenser groove depth is 2 mm in a 16 mm tray; coffee grooves are 2 mm in a 12 mm tray. Preserve real recess floors, outlets and six grooves per tray. Parts have independently replaceable existing material assignments, including feet and handle connectors.

LoD reduces roundovers and circular sampling while preserving ground contacts, handles and their voids, door separation, basin/cup bays and outlets. These closed appliance exteriors do not authorize opening a solid refrigerator or sink cabinet into an invented interior. Opening behavior requires its separately specified model state later.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

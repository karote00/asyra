# Pantry Equipment - Geometry Supplement

All dimensions and component coordinates follow the [JSON](pantry-model-spec.json). Units m, +Z up, -Y front, origin at body bottom centre; size order X/Y/Z and centre is component-local. The user approved committing this design; it is not a model verification result.

## Shared construction

rounded-box is closed with inward circular-arc bevels, 3 segments, actual radius min(radius, shortest edge/2). cylinder uses 48 circumferential segments along its axis, capped at both ends. Preserve underside/rear surfaces with outward normals.

Shapes in subtract are Boolean cutters only, not visible parts. Bevel the outer box, then subtract the specified rounded box; add 0.001 m, 2-segment bevels to exposed cut edges. Do not fake recesses with black planes. Small hidden overlaps are allowed, but no coplanar z-fighting faces. Reliefs, contours, and gaps follow documentation; generated light/dark lines are not material content.

## Refrigerator

Cream-grey body, black plinth, small upper freezer door and large lower refrigerator door, and two grey handles. Body Z=0.04–1.15; upper door Z=0.712–1.140 (height 0.428), lower Z=0.060–0.700 (height 0.640), meeting gap 0.012. Door front Y=-0.26. Both handles at X=-0.207; mounts connect door faces to grip bars.

Body width/depth 0.52/0.52; depth including handles 0.557. Rear is the same cream-grey, with no vents, cord, or compressor. Add no side pivots or mechanisms; interiors are not modeled. These are reusable default dimensions. For the office reconstruction, independently measured source corners control instance proportions; update the scene recipe when an old default disagrees with the approved full reference. Do not turn this into side-by-side doors or an attached cabinet.

## Water dispenser

Cabinet height 0.64, bottle height 0.48, total 1.12. The original pantry crop overrides the previous 0.79/0.33 split: the bottle is approximately three quarters of the cabinet height. Preserve the footprint and total height; dispensing parts follow the revised cabinet height, while floor feet stay grounded. Cut a front dispensing recess with a thin grey back panel and drip tray below. Tray extends to Y=-0.192, giving total depth 0.362; image depth 0.34 refers to cabinet only.

Two Y-axis cylindrical tap connectors span Y=-0.149..-0.075 (length 0.074,
centre Y=-0.112), entering the back panel front at Y=-0.076 by 0.001. The nozzle
and lever Z coordinates and lengths follow the current JSON cabinet-height
revision; do not reuse the old 0.79 m cabinet's coordinates. Levers remain left
red/right blue, with no emission. The lower door is a closed thin panel.

The owner's product photo `review/dispenser-jug-photo-reference.png` replaces
the older simplified jug silhouette. Install neck down: neck occupies roughly
Z=0.64..0.735, rounded shoulder Z=0.735..0.794, straight barrel Z=0.794..1.09,
rounded base Z=1.09..1.12. The barrel radius is 0.123 m; the four reinforcing rib
centres are Z=0.812, 0.866, 1.024 and 1.08, each 0.032 m tall and 0.008 m proud.
Maximum diameter is 0.262 m. The white cap is a separate closed region at the
bottom neck. Do not include the photographed sticker or text.

Lathe the profileZR Z/radius curve around Z using 64 circumferential segments.
Interpolate adjacent profile points with monotone cubic Hermite curves, eight
intervals per segment. Interior tangents use the span-weighted harmonic mean
of adjacent secants, or zero at a change of direction; endpoint tangents are
zero. Share tangents across stations so the shoulder has no artificial ledges. Merge top radius=0 into a point and cap the lower end. Rib relief uses
extraRadius×(1+cos(2π(z−centreZ)/height))/2 within each band's half-height.
Plastic default is `#63AFD0`, roughness 0.22, opacity 0.42; cap stays opaque.
This uses alpha translucency, not physical refraction.
Keep opacity replaceable and propagate it from catalog material to the scene
and the existing spatial renderer. Transparent objects cannot be merged into
opaque batches, nor merged together in a way that prevents object sorting.

The separate `bottle-water` region derives its cavity from the same sampled
bottle profile, with a 0.002 m radial inset and a bottom at the first profile
section at least 0.002 m above the lower end. Integrate the circular-frustum
volumes and clip at exactly 70% of total cavity volume; close the resulting top
with a horizontal disk. This is 70% by capacity, not 70% of the neck-to-base
height. Keep the remaining upper cavity empty. The static water default is
`#258CBF`, opacity 0.62 and roughness 0.12, all appearance values replaceable.
Construct once with the asset; no waves, animation or per-frame fluid work.
Keep liquid and shell as separate transparent draw items, with liquid before
the enclosing shell in the retained catalog order. Do not add labels or bubbles.

Tray grooves use the Cartesian product of xCentres and yCentres: 6 slots, each length width and breadth slotBreadth along X. Cut depth down from tray top with end radius slotBreadth/2. Do not cut through. Grooves remain grey, without black stripes.

## Sink cabinet

One wooden cabinet, pale-grey countertop, single basin at X=-0.06, one left door, two stacked right drawers, a narrow end panel, and faucet. Counter height 0.64, width 0.90, depth 0.50. Cut basin clearance from the cabinet itself so a solid cabinet does not fill the basin. Subtract the inner cavity from the outer basin box, retaining bottom thickness. Drain disc is at basin-floor Z=0.5275, not an opening into model internals. No pipes.

The retained left door centre is X=-0.2175, width 0.427; front Y=-0.248. Its centred inner field is 0.357 wide, 0.44 high, recessed 0.004 toward +Y, with 0.035 border. A 0.002-wide slope transitions from opening edge to recessed floor, reducing floor width/height by another 0.004 each. Its door handle is a U-shaped assembly: one grip bar (18 x 13 x 65 mm, centre X=-36, Y=-265, Z=510 mm, inward radius 5 mm) and two mounts (12 x 18 x 12 mm, same X, Y=-251.5, Z=487.5/532.5 mm, inward radius 2 mm). Mounts overlap the bar and enter the door frame/recess floor, while the middle remains open behind the bar. Union the three handle inputs, trim hidden door intersections and retain the handle region. Its front Y=-0.2715 preserves total assembly depth 0.5215. Do not replace the visible U-shaped grip with a solid plate.

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

## Full-reference cabinet-front correction

The full-office reference is the active authority when the older multiview recipe
conflicts with it. The source region X=885..983, Y=328..390 shows one left door,
two stacked drawers to its right, and a narrow end panel under the plant.
The former two-equal-door front is superseded for this module. The 880 mm closed
cabinet body, 900 x 500 mm countertop and its existing basin remain the default
construction; placed scene XYZ size comes from named source counter corners.

Default front X intervals are -431..-4 mm for the retained recessed door,
6..213.5 mm for both drawers, and 223.5..431 mm for the end panel. Both drawers
are 207.5 x 23 x 251 mm, with Z centers 193.5 and 452.5 mm and an 8 mm gap.
Each has a horizontal 70 x 13 x 12 mm handle, two connected mounts, and the
existing replaceable metal appearance. The end panel is 207.5 x 23 x 510 mm.
All fronts retain Y center -236.5 mm and the existing closed-body attachment.
Visible subdivisions come from the full image; exact hidden seams and hardware
sizes remain authored construction. This update does not claim drawer animation
or interior storage geometry. Older images are not dimensional authority for the
superseded equal-door subdivision.

Owner correction (2026-10-27) supersedes both reference drawings: exchange the
previous door heights so the upper freezer is smaller than the lower refrigerator.
The split moves from Z=0.488..0.500 to Z=0.700..0.712. Both handle assemblies
move up 0.212 m: lower grip centre Z=0.592, mounts Z=0.519/0.665; upper grip
centre Z=0.992, mounts Z=0.939/1.045. Grip sizes and front clearances are unchanged.
Body, ground contacts, depth, 12 mm door gap and total height remain unchanged.
Keep the existing reference images as visual context, not door-split authority.

## Original pantry composition correction - 2026-10-27

The enlarged approved office crop is the visual authority for this composition.
Room anchors are the accepted common floor (Z=0.38), inner north wall
(Y=2.6220995177) and west wall (X=0.1776932207). Do not refit the shell to place
accessories. All figures below are reconstruction defaults, not measurements of
hidden geometry. Color and material remain replaceable per named region.

- Dispenser: retain 1.12 m catalog height and 0.95 room scale. Cabinet top is
  0.64 m and bottle span 0.48 m in catalog space, giving a 0.75 height ratio.
  Preserve two taps, separate ring geometry and original floor contact.
- Refrigerator: retain 1.35 scale and the upper-small/lower-large door split.
  The owner-approved top-view layout rotates it toward the aisle and recesses it
  at the rear left. Notes/magnet remain on its actual front; the top plant and
  framed night-light follow its position. Top support remains Z=1.9325.
- Shelf: approved width 1.05 m, depth 0.24 m, thickness 0.033 m, top Z=1.9765.
  Starts at the preparation counter's left edge and extends over the main sink's
  left strip. Retain flower pot, small plant, ochre jar, cork jar and succulent.
  Use complete-envelope widths with 0.03 m gaps and approximately 0.03331 m end
  margins. Omit largest cream jar and tiny bottle instances; preserve the assets.
- Preparation counter: X span [0.9696932207,1.8075], Y span
  [1.9970995177,2.6220995177], top Z=1.18 and thickness 0.035 m. One door replaces
  the two-door arrangement; body is 0.04 m narrower/shallower than the top with
  height 0.745 m. Left hinge, right-side handle, existing wood appearance.
  Keep the 7.5 mm gap to the unchanged full-size main sink. Both countertop
  depths remain 0.625 m. Remove the small basin instance and construct uncut
  worktop/body solids; its independent asset/specification remains available.
  Approved staggered smallware and exact floor anchors are owned by
  `apps/asyra-office/src/scene/reference/pantry-layout.json`.
- Sink: retain basin width/depth and 1.25 uniform scale; shift basin, drain,
  faucet and all cabinet/worktop clearance cuts 60 mm left in asset space. Worktop
  default is wood `#C7A575`; left door default is `#65594D`. The right drawers and
  end panel retain their wood regions. The dark cup stays entirely left of
  X=1.9775, the basin's left opening edge. The right white cup holds one brush.
  The unsupported soap pump and paired wooden utensils are absent from the scene.
- The right white-pot plant uses the distinct soil-rooted lanceolate variant. The pale-blue
  floor jar rests on the white floor band at (3.02, 1.9620995177, 0.38), diameter
  0.128 m, height 0.200 m. It is not placed on a new wall or raised floor.

Pantry-only shrub shape uses the `shrub` growth variant in the small-plants JSON:
136-144 closed small blades along nine unequal sprigs, 4 by 4 blade grid,
32-segment vessel and 6-segment petioles. Keep the whole unscaled plant below
18,000 triangles. This variant does not modify the default stemmed/rosette plants
or exterior tree construction. Geometry and lighting remain separate.

Appearance batching reuses the existing cream, dark-green, terracotta, blue-grey
and metal families where visually equivalent. Refrigerator notes and the round
magnet use existing plain-surface colors. Preparation basin metal uses `#AAAFA9` at roughness 0.48 and its fitting uses 0.40. Whole-scene draw groups retain the existing limit
of fewer than 160; do not relax the gate to accommodate smallware.

### Current pantry composition authority - 2026-10-28

The approved top-view layout supersedes previous west-wall fridge, full-span
shelf and corner-row placement instructions. Runtime placement is owned by
`apps/asyra-office/src/scene/reference/pantry-layout.json`; the product plan
records owner approval. Asset geometry remains in the existing pantry and
pantry-smallware specifications. Retain original sizes/materials for the sink,
appliances and smallware. Main sink accessories move +0.0375 m in X with their
parent group. Do not restore stored instances merely because their factories
and geometry tests remain present. Geometry and lighting stay separate.

#### Owner-directed room expansion

The 2026-10-28 four-room expansion moves the pantry rear wall and complete
approved appliance/counter/shelf group +1.00 m in world Y. The pantry front
boundary moves +0.50 m, giving 0.50 m additional clear depth. The dispenser
also moves +1.00 m, placing its complete footprint within the extended west
wall. Geometry, dimensions, X/Z coordinates, rotation, appearance and relative
fridge/dispenser clearance are unchanged. Current world anchors are in
scene/reference/pantry-layout.json; the earlier top-view proposal records the
pre-expansion approval and is not the current world-coordinate authority.

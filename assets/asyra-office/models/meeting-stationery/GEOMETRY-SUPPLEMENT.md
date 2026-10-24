# Geometry Supplement

## Conventions

Metres, +Z up, -Y front, +X right. Part coordinates are fixed in the [numeric specification](meeting-stationery-model-spec.json). Use flat caps and smooth cylindrical sides; no subdivision. Bevels remain inside stated bounds and apply only where explicitly listed.

## Capped whiteboard marker

The origin is the assembled axis center. Axis is +X, with the cap on the positive end. Overall bounds: X +/-0.070, Y/Z +/-0.009.

Four separately addressable closed solids:

- Ivory barrel: X=-0.070 to 0.035, radius 0.007, 64 angular segments. Both outer end edges have a 0.0005 inward bevel with three segments.
- Charcoal neck: X=0.035 to 0.050, radius 0.005, 64 segments, flat ends.
- Charcoal nib: X=0.050 to 0.057, radius 0.0025, 48 segments, flat ends. This simplified hidden nib has no extra chisel geometry.
- Charcoal cap: outer cylinder X=0.035 to 0.070, radius 0.009, 64 segments. Apply 0.0005 inward bevels to the outer end edges, three segments. Subtract a radius-0.007 bore from X=0.034 to 0.067. This exits through the negative end and leaves 0.003 closed material at the positive tip.

All parts are centered on Y=Z=0. Sample angular rings from +Y using Y=r*cos(t), Z=r*sin(t). After the main bore subtraction, union a charcoal internal annular collar into the cap at X=0.035..0.038, radii 0.005..0.007, using 64 sectors. It contacts the radius-0.005 neck and the barrel end's flat radius-0.0065 disk; the original radius-0.007 bore alone left no mating area. The remainder of the bore clears neck and nib. The collar belongs to the cap, with internal cap/collar faces removed; it is not a spring or a separate moving part. No painted cavity darkness.

The sheets show only the capped assembly. Hidden neck, nib, and bore are authored completions, not visually approved open-state geometry. A later model review must inspect them before acceptance. No ink, reservoir, clip, thread, ventilation slots, moving mechanism, or cap-removal animation is included.

For later placement, the cap's bottom lies at Z=-0.009; do not silently change the model origin to floor level. Placement or rotation belongs to the app.

## Whiteboard eraser

Origin is centered on the bottom felt contact plane. Overall bounds: X +/-0.050, Y +/-0.0225, Z=0 to 0.025.

Both layers use the same XY rounded rectangle, full width 0.100, depth 0.045, circular corner radius 0.006. Use 16 equal angular segments per corner, join by straight sides, and extrude:

- Charcoal felt: Z=0 to 0.006.
- Sage grip: Z=0.006 to 0.025.

Both are closed solids, touching at Z=0.006 without overlap or gap. Top, bottom, and layer boundary are flat. Smooth only the curved plan-corner sides. No extra vertical bevel, dome, recess, seam groove, relief, fibers, magnets, or fasteners. Any softened top contour in the drawing is illustrative; the defined section is planar.

## Views and future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. The marker's RIGHT view sees its closed cap end. Rear projection reverses left/right placement on the sheet without changing the physical cap end. The eraser BOTTOM detail shows the felt contact surface.

Future review checks dimensions within 0.0002, marker part separation and bore clearance, hidden nib, eraser's two-layer stack and flat bottom, and all underside/end views. No model or runtime interaction has been verified.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Marker cap and eraser

Marker extent is 140 x 18 x 18 mm about its axis-centred origin. Its body radius is 7 mm, neck 5 mm and nib 2.5 mm; the cap has a 3 mm closed tip. The internal collar meets the barrel end and neck, avoiding a visually disconnected cap caused by an oversized through-bore. Keep it part of the cap, not a fifth independently placeable object. This remains a static capped model; no snap-fit simulation is certified.

Eraser extent is 100 x 45 x 25 mm. Felt spans Z=0..6 mm and grip Z=6..25 mm with identical rounded plan boundaries. Both layers meet without a gap. Keep felt/grip appearance independent. LoD reduces circular/corner samples while retaining marker cap, positive shell thickness and eraser layer boundary. A caption's drawing perspective does not introduce another curved upper surface.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

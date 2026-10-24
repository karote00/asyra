# Pantry Smallware - Geometry Supplement

## Coordinates and construction

Metres, +Z up, -Y front; origin is the centre of the bottom contact plane. Size order X/Y/Z. Front/right/back/top directions are -Y/+X/+Y/+Z; oblique is (1,-1,0.8). A rotational profile is an ordered closed polygon of (radius,Z). Revolve it around Z using 96 equal angular intervals. Connect matching ring vertices with quads; triangulate consistently. Collapse each radius-zero ring to one vertex to avoid degenerate faces. Close the profile to its first vertex. The resulting solid's boundaries include the specified hollow regions; do not fill cavities with extra cylinders. Smooth curved sides, retain hard normals at profile corners. No additional bevels unless stated; chamfers already appear in the profiles.

## Canister

Body profile in JSON defines a pale sage ceramic pot with a rounded-looking chamfered lower rim, straight sides, thick base and hollow interior. Maximum body radius 0.043, top Z=0.117, interior radius 0.039, interior floor Z=0.006. The short shoulder and rim are explicit profile segments. This is an opaque ceramic container, not glass. No label or handles.

The wooden lid is a separate rotational solid with a shallow locating plug. Plug radius 0.0385, Z=0.116..0.117; it fits inside the 0.039 opening with 0.0005 radial clearance. The upper disk reaches radius 0.045 and Z=0.125. The lid rests on the body's top rim at Z=0.117. Profile corners form small chamfers; no knob, gasket, hinge or latch. Underside uses the same wood material. Show the unit closed; hollow interior is specified so no tool must guess it later.

## Takeaway cup

Paper body is a rotational shell with flat bottom, tapered side, thickened top lip and a hollow interior. Follow JSON vertices directly. Its outer main wall between Z=0.0015 and 0.108 follows radius r(z)=0.026+0.011*(z-0.0015)/0.1065. The top lip reaches Z=0.112. The lower internal floor is Z=0.004. Body wall thickness follows the two profile sides; do not add a generic solidify modifier that changes bounds.

The kraft sleeve is a separate open-ended conical band over Z=0.035..0.075. Inner radius equals r(z), outer radius r(z)+0.001. Revolve the closed quadrilateral [(r(0.035),0.035),(r(0.035)+0.001,0.035),(r(0.075)+0.001,0.075),(r(0.075),0.075)]. It touches the cup surface without an air gap. Top/bottom annular edges are kraft; no corrugation, glued seam, logo or printed design.

The ivory lid is a separate rotational solid from the JSON profile, maximum radius 0.04, Z=0.111..0.12. Its shallow raised annular rim is at Z=0.12, while the central top disk is at Z=0.119. Its underside overlaps the body's lip slightly as an authored static fit; this is not a manufactured snap-fit or removable mechanism. Subtract one vertical elliptical prism centred (X,Y)=(0,-0.026), semi-axes (0.007,0.0025), Z=0.110..0.121, sampled with 48 perimeter segments. This creates a real through opening near the front, not a black decal or fake recess. Keep lid thickness at the hole, with no fill disk. All cut faces use the lid material. Do not add liquid, a straw or a second vent.

## Views and future model checks

The canister's front/right/back share the same silhouette; top is a wooden disk. Cup top shows one oval opening toward -Y, front is aligned with that opening, and rear does not gain a second opening. The cup bottom is cream and the jar bottom sage, both flat and undecorated. Hidden surfaces are determined by the profiles.

No models have been produced or verified. Future modeling acceptance: profile dimensions within 0.0005 m; correct closed assembled silhouettes, real hollow interiors and sip opening, separate bodies/lids, one continuous sleeve, no extra components and no baked lighting. Inspect all five views and the underside after separate modeling authorization. Drawings are design references, not a claim of calibrated orthographic accuracy.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Lids, clearances and cup opening

Canister extent is 90 x 90 x 125 mm. Lid locating radius 38.5 mm fits the 39 mm mouth with 0.5 mm radial clearance, and its underside rests on the rim at Z=117 mm. Body floor is 6 mm thick. Keep lid and body separate.

Cup extent is 80 x 80 x 120 mm. Sleeve follows the same outer taper as the paper with 1 mm radial thickness. The 14 x 5 mm sip cutter exits the lid at both ends; it cuts only the lid, never the vessel wall or sleeve. Its nearest radial edge is well within the upper lid disk. Preserve the empty cup cavity beneath it. Lid/body overlap is the explicit static visual fit, not a verified removable seal.

Ceramic/wood or paper/lid/kraft remain replaceable regions. LoD preserves real mouths and sip opening, lid steps and sleeve separation; reduce angular sectors only and weld zero-radius endpoints. Never put a dark disk over either cavity.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

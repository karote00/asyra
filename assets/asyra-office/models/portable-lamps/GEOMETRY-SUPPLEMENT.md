# Geometry Supplement

## Shared construction

Use metres, +Z up, -Y front, +X right. Each origin is the base center on its bottom contact plane. Cylinders and revolutions use 96 angular samples, beginning on +X. Close cylinder ends and annular rims. Smooth curved faces; keep caps and support faces flat. No bevel or subdivision.

Spheres use 48 equal longitude sectors and 24 latitude intervals, merging each pole into one vertex. All named parts remain individually addressable closed solids in one placeable assembly. See [numeric geometry](portable-lamps-model-spec.json).

These simplified display lamps do not contain functional wiring or electrical parts. Dimensions and concealed details are authored rather than recovered from the office image.

## Sage desk lamp

Overall diameter 0.180, height 0.300. All parts are centered on the Z axis:

- Sage base: radius 0.070, Z=0 to 0.018.
- Charcoal stem: radius 0.006, Z=0.018 to 0.298.
- Ivory bulb: sphere centered at Z=0.248, radius 0.018. The stem passes through its center as a simplified mounting arrangement.

Revolve the closed radius/Z shade profile:

```json
[
  [0, 0.3],
  [0.03, 0.3],
  [0.09, 0.22],
  [0.087, 0.22],
  [0.02925, 0.297],
  [0, 0.297]
]
```

This produces a conical frustum with lower outside radius 0.090 at Z=0.220 and upper radius 0.030 at Z=0.300. The bottom is open, with a closed annular material edge. The top is a closed cap, thickness 0.003. The conical side has radial thickness 0.003, not constant thickness normal to its slope.

The stem intersects the underside of the top cap by 0.001, joining the assembly without an extra bracket. The bottom opening reveals the unlit bulb and stem. No shade pleats, rim beads, side arms, hinge, socket detail, or additional opening.

Assign sage to the outside cone, top face, and bottom rim. Assign ivory to the inside cone and underside of the top cap. Do not darken interior faces.

## Ivory floor lamp

Overall diameter 0.360, height 1.400. Centered on the Z axis:

- Charcoal base: radius 0.150, Z=0 to 0.025.
- Charcoal stem: radius 0.011, Z=0.025 to 1.375.
- Ivory drum shade: annular cylinder, outside radius 0.180, inside radius 0.176, Z=1.120 to 1.400. Both ends are open; only the material rim is capped.
- Ivory bulb: sphere centered at Z=1.240, radius 0.035, intersected by the central stem.

Two charcoal support bars form a cross just inside the upper opening:

- X bar: X +/-0.176, Y +/-0.003, Z=1.367 to 1.373.
- Y bar: X +/-0.003, Y +/-0.176, Z=1.367 to 1.373.

The bars intersect one another and the stem. Their outer corners slightly enter the shade material so the joints do not leave gaps. Keep them as distinct named solids; any future union must preserve the exterior. Do not substitute an opaque top disk.

Shade top and bottom details show real openings, with the supports, bulb, stem or base visible according to occlusion. A BOTTOM view cannot show through the opaque base; hidden construction is resolved by these dimensions.

## Lighting boundary

The listed light-anchor centers are location references for the future application only. All materials, including bulbs, have emission zero. No light object, intensity, range, glow, baked illumination, or shadow settings are delivered. The app owns those decisions later.

## Future acceptance

Check bounds within 0.0005, flat base contact, separate named parts, desk shade's closed top and open bottom, floor shade's two open ends, crossed supports and hidden bulb positions. Inspect openings and undersides closely. No model, lighting behavior, performance, or physical electrical function has been validated.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Shade construction and supports

Desk lamp is 180 x 180 x 300 mm; floor lamp is 360 x 360 x 1400 mm. Desk shade wall is 3 mm radially at equal Z, not 3 mm normal to the slope. Its top is capped and bottom open. The floor shade has two open ends, a 4 mm wall and the crossed supports at Z=1367..1373 mm. Support outer corners enter the inner shade wall; the centre stem intersects the support cross and bulb intentionally. Internal contact surfaces must not become visible duplicate caps.

Preserve shade, stem, base and bulb appearance regions and the floor support region. LoD can reduce angular/latitude samples, retaining cardinal extrema, bulbs, both floor openings and desk cap. Light anchors follow the complete unit's scaling exactly once. No geometry tier may substitute a luminous painted opening for the real cavity; scene lighting is not part of this reference handoff.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

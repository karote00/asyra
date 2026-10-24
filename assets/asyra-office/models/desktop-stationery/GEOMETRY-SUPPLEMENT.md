# Geometry Supplement

## Shared conventions

Metres, +Z up, -Y front, +X right. Origins are centered on the bottom contact plane. Dimensions and hidden details are authored. The [numeric specification](desktop-stationery-model-spec.json) provides the exact values.

## Empty pencil cup

Revolve this closed radius/Z profile around Z:

```json
[
  [0, 0],
  [0.04, 0],
  [0.04, 0.1],
  [0.036, 0.1],
  [0.036, 0.006],
  [0, 0.006]
]
```

Use 96 equal angular segments beginning on +X. Join profile vertices linearly, merge each radius-zero ring into an axis vertex, and close the profile along the axis. Smooth cylindrical sides; keep bottom, inner floor, and rim flat. No bevel or subdivision.

Outside diameter is 0.080, height 0.100. Inner radius is 0.036, giving 0.004 wall thickness. The bottom is closed, thickness 0.006. The opening is real empty space with a flat floor at Z=0.006. There is no taper, rolled lip, handle, foot, drain hole, or content.

## Closed notebook

Overall bounds are X +/-0.075, Y +/-0.105, Z=0 to 0.014. The spine is on -X. Construct four closed boxes:

- Lower cover: full XY footprint, Z=0 to 0.002.
- Upper cover: full XY footprint, Z=0.012 to 0.014.
- Spine: X=-0.075 to -0.072, full Y span, Z=0.002 to 0.012.
- Ivory page block: X=-0.072 to 0.072, Y=-0.102 to 0.102, Z=0.002 to 0.012.

The covers overhang the paper by 0.003 on front, back and right. The page block meets the spine directly on the left. Shared surfaces touch without gaps or overlaps. Keep parts separately addressable inside one placeable assembly. Flat faces and square corners are authoritative; no bevel or subdivision.

Do not turn page-block edges into a texture stack or individual leaves. No printing, labels, ribbons, elastic bands, spiral rings, glue relief, hinge geometry or unpictured open-state internals. Only a static closed notebook is specified. Opening and page turning would require a later approved asset extension, not inferred geometry.

## Views and future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. The notebook RIGHT view shows the exposed paper edge, while its -X edge is the sage spine. BOTTOM shows the plain lower cover.

Future model review checks bounds within 0.0002, origins, cup wall/base thickness, real empty cavity, four notebook parts, cover overhang and spine placement. Inspect underside and hidden contact surfaces. No model, runtime use or exact source reconstruction has been verified.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Cup and notebook fit

Pencil cup is 80 x 80 x 100 mm, with 4 mm walls and 6 mm floor. It has one open mouth and no drain. Notebook is 150 x 210 x 14 mm: 2 mm covers, 10 mm paper and 3 mm spine. Paper bounds meet the spine at X=-72 mm, with 3 mm overhang on the remaining three edges. Shared contact faces are hidden and must not produce duplicate rendered surfaces.

Keep cover, spine and page regions replaceable; opening behavior is not specified. The cup's angular tessellation can reduce with LoD while retaining all profile points. Notebook topology stays planar across tiers; do not manufacture individual pages, seams or hidden rings.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

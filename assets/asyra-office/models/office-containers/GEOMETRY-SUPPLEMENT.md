# Geometry Supplement

## Coordinates

Metres, +Z up, -Y front, +X right. Each origin is centered on its bottom contact plane. Dimensions and hidden geometry are authored, not recovered from the office image. The [numeric specification](office-containers-model-spec.json) supplies the complete construction values.

## Sage wastebasket

Revolve this closed radius/Z profile around Z:

```json
[
  [0, 0],
  [0.09, 0],
  [0.12, 0.28],
  [0.116, 0.28],
  [0.08664285714285715, 0.006],
  [0, 0.006]
]
```

Use 96 equal angular segments with angle zero on +X. Join consecutive profile points linearly and collapse radius-zero rings into axis vertices. Close the profile along the axis.

The exterior is a truncated cone: radius 0.090 at Z=0 and radius 0.120 at Z=0.280. Its radius at height z is 0.090+(0.030/0.280)*z. The inner side radius at a given height is that value minus 0.004, starting at Z=0.006 and ending at Z=0.280. The inner bottom radius is therefore 0.08664285714285715.

This gives a 0.004 radial wall thickness, a 0.006 closed base, and a thin flat top rim. Thickness normal to the sloping wall is not exactly 0.004. Smooth side normals; keep bottom, inner floor, and rim flat. No bevel, subdivision, rolled lip, drain hole, liner, feet, handles, pedal, lid, or contents.

The inside is real open volume. Do not replace it with a dark disk or shallow decorative depression.

## Ivory tissue box

Start with a closed box:

- X=-0.110 to +0.110.
- Y=-0.060 to +0.060.
- Z=0 to 0.080.

Apply a 0.003 inward bevel to the outside edges with four segments, preserving those bounds. Subtract the internal box X +/-0.107, Y +/-0.057, Z=0.003 to 0.077. Internal corners remain sharp; thickness is 0.003 on planar walls, while corner thickness follows the Boolean difference of the rounded outer surface and sharp inner cavity.

Connect this cavity to the exterior through the top:

- Capsule opening is centered on X=Y=0.
- Its long axis is X; total length 0.120, width 0.025.
- Two end semicircles have radius 0.0125, centered at X=-0.0475 and +0.0475, Y=0.
- Join with straight sides at Y +/-0.0125.
- Use 48 segments per semicircle and extrude the cutter from Z=0.076 to 0.081.
- Subtract it from the shell, leaving real vertical opening walls through the 0.003 top.

Keep the flat bottom and all side faces closed. Smooth bevel normals and keep planar faces flat; do not subdivide. No removable lid seam, refill opening, paper stack, protruding tissue, feet, decoration, or simulated dispensing mechanism is delivered. This is an empty display shell; any future functional refill design is a separate decision.

## Views and future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. Oblique views are illustrative. Generated view scale and slight elevation are not dimension authority.

Future model review checks dimensions within 0.0005, floor-centered origins, closed material shells, genuinely empty cavities, wastebasket taper and base thickness, and a capsule opening connected to the tissue-box interior. Inspect underside, back, inside, and opening edges. No model verification or physical simulation has been performed.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Container openings

Wastebasket extent is 240 x 240 x 280 mm. Its 4 mm radial wall and 6 mm floor are distinct measurements; do not treat the radial value as normal thickness on the taper. Tissue box is 220 x 120 x 80 mm, with an inner box 214 x 114 x 74 mm and a 120 x 25 mm capsule slot. The slot cutter overlaps the cavity by 1 mm and exits the top, so the opening is connected to real empty volume.

Preserve sage and ivory defaults as replaceable regions, without interior darkness baked into them. LoD must preserve both real openings, the basket taper and tissue slot end curves. Reduce ring, capsule and bevel intervals, never close the slot or retain the removed cavity volume.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

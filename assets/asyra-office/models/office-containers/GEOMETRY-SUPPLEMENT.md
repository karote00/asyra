# Geometry Supplement

## Coordinates

Metres, +Z up, -Y front, +X right. Each origin is centered on its bottom contact plane. Dimensions and hidden geometry are authored, not recovered from the office image. The [numeric specification](office-containers-model-spec.json) supplies the complete construction values.

## Sage wastebasket

Revolve this closed radius/Z profile around Z:

```json
[[0,0],[0.09,0],[0.12,0.28],[0.116,0.28],[0.08664285714285715,0.006],[0,0.006]]
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

Apply a 0.003 inward bevel to the outside edges with four segments, preserving those bounds. Subtract the internal box X +/-0.107, Y +/-0.057, Z=0.003 to 0.077. Internal corners remain sharp; thickness is 0.003 on planar walls, with additional material at the softened outside corners.

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

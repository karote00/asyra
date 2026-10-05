# Geometry Supplement

## Shared conventions

Metres, +Z up, -Y front, +X right. Origins are centered on the bottom contact plane. Dimensions and hidden details are authored. The [numeric specification](desktop-stationery-model-spec.json) provides the exact values.

## Empty pencil cup

Revolve this closed radius/Z profile around Z:

```json
[[0,0],[0.04,0],[0.04,0.1],[0.036,0.1],[0.036,0.006],[0,0.006]]
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

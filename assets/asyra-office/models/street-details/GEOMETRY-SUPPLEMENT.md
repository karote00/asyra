# Street Details - Geometry Supplement

## Coordinates and construction

Metres, +Z up, -Y front, +X right. Origin is the post axis on the flat bottom plane. Box dimensions are full X/Y/Z extents. All primitives are axis-aligned. Cylinders run along Z, with 64 perimeter samples and closed planar ends. Spheres use 64 longitude segments and 32 latitude intervals, with single pole vertices. Smooth curved surfaces; flat box faces and cylinder caps. No extra bevels. Union overlapping solids within each asset to remove internal faces.

## Street sign

The shaft is a solid rectangular prism, 0.045 x 0.045 x 1.582 m, with a square cross-section and four flat vertical faces. It is not a cylinder or a cube. Its section occupies X/Y=-0.0225..+0.0225 and Z=0..1.582; edges are straight, with no bevel or rounding. Collar section is 0.052 square, Z=1.580..1.596. Finial radius is 0.030 at Z=1.620, reaching Z=1.650. Its bottom penetrates the collar by 0.006. All metal regions default to charcoal, including the finial; appearance remains independently replaceable.

The shaft and collar overlap by 0.002 m: the shaft ends at Z=1.582,
while the collar begins at Z=1.580. Thus the exposed shaft below the collar
is 1.580 m high, although the construction box is 1.582 m high. The 1.650 m
annotation measures the complete assembly, including its finial. These are
different measurements, not competing definitions of post height.

The TOP view's circle represents the spherical finial. The square collar
hides the shaft's top face, so this circle must not be interpreted as the
shaft cross-section. In THREE-QUARTER, the two visible shaft faces meet along
a straight vertical edge. The review face colours identify those planes;
they do not prescribe different runtime materials on each face.

Both boards occupy the same X/Y footprint. They are centred at Z=1.390 and 1.160. Each has height 0.180, thickness 0.018, and spans X=0.0205..0.5025. The first 0.002 lies inside the shaft; the exposed width from the shaft side X=0.0225 is exactly 0.480. Boards have no arrow tips, rim, back brackets, fasteners, recesses or separate backing layers. The back is blank and defaults to charcoal; it uses the documentation-only palette in v6.

The first prompt said board left edges at the post centre; final drawings place exposed edges at the post side. The inserted-root construction above is the final decision. The first prompt also requested a light border; the selected corrected sheet has plain unbordered plaques. No border is part of the approved v6 design.

### Projection and visibility - revised 2026-10-08

FRONT looks from -Y toward +Y, RIGHT from +X toward -X, and BACK from +Y
toward -Y; all keep +Z upward. TOP looks from +Z toward -Z with +X screen
right and +Y screen up. The current v6 sheet computes these projections directly from the numeric
parts at 800 pixels per metre in the 3072 x 2048 PNG. Raster contours have
antialiasing uncertainty; JSON remains exact numeric authority. The original
v1 and rejected v2 illustration proportions are not construction authority.

- FRONT: the two boards extend right; their front text remains readable.
- RIGHT: the board end faces at X=0.5025 are nearer the camera than the post.
  They occupy Y=-0.009..+0.009, centred within the post's Y=-0.0225..+0.0225.
  At each board height the visible post margin is 13.5 mm on each side.
  The end faces must be shown on the post silhouette, never beside it. They
  are raised/nearer surfaces, not recesses or slots cut into the post.
- BACK: the boards extend left and remain blank.
- TOP: the two boards coincide, giving one extension, not a fork. The collar
  projects to a 52 mm square and the finial to a concentric 60 mm disk.
  Collar corners lie 36.7695526 mm from the axis, beyond the 30 mm disk radius.
  All four corners must remain visible. On each square edge the circle meets
  at an offset of sqrt(30^2-26^2)=14.9666295 mm from the edge midpoint.
  The central edge sections are hidden; the sections toward the four corners
  remain visible. Do not draw an enclosing square larger than the disk along
  X/Y. The collar covers the smaller post top.
- THREE-QUARTER: the boards remain centred on the same Y=0 plane, join the
  post's +X side and retain the same vertical gap and blank end faces.

Both boards share Z height 180 mm; the clear gap is 50 mm. The exposed board
centre X=0.2625 differs intentionally from the full board centre X=0.2615:
lettering is centred on the exposed 480 mm face, excluding the 2 mm embed.
All bottom and top surfaces are closed. Existing dimensions are unchanged.

The current [v6 sheet](review/01-street-sign-v6.png) recomputes all five views.
The [drawing source](review/draw-street-sign-projections.py) reads this batch's
JSON without changing it. Analytic ray/box and ray/sphere intersections resolve
occlusion of the same five solids in every view. Text uses masks derived from the original FRONT reference, not the rejected
polyline alphabet or a substitute font. No illumination or shadows are added. Constant face colours distinguish X, Y and Z orientations; they are documentation-only, as specified in the surface recipes. The default metal remains charcoal #383A38.
THREE-QUARTER uses camera direction (4,-7,3.2), normalized, with horizontal
screen axis (7,4,0), normalized, and vertical axis their cross product.
All views share the same projected scale, including TOP.

The [measurement record](review/street-sign-projection-measurements.json)
records dimensions and projection bases. The [v1 source](review/01-street-sign-v1.png)
remains the original appearance comparison. V2 corrected topology but failed
proportion review; it is superseded. V3 was rejected for its lettering. V4 restored the original lettering; v5 added attached dimensions. V6 uses light review colours, retains the dimensions and explicitly identifies the square post. The user approved v6. This diagram is not
an exported model or an app rendering.

### Surface ownership through assembly

Keep the five source part regions (shaft, collar, finial, board-1, board-2)
on the exposed union surface. Remove buried faces without losing their source
material assignments. At their respective joins, the finial, collar and board
own their exposed boundary faces. Keep two additional flat lettering-mask
regions, one on each board front; they do not create extra geometry.
See [surface replacement rules](SURFACE-RECIPES.md).

## Bollard - revised compact proportions

The original v1 drawing owns the compact form. Its former numeric diameters did
not match that form. The following construction replaces the old 45/58/65 mm
diameters while preserving total height 480 mm. It is the current specification
for the [v3 five-view sheet](review/02-roadside-bollard-v3.png).

The shaft and collar are solid concentric cylinders, not square prisms or hollow
tubes. The finial is a solid sphere. All three share the Z axis. The bottom is
flat and closed. There is no taper, additional rim, carved groove, baseplate,
fastener, reflective stripe or hollow interior. No additional bevel is specified.

### Dimensions and placement - millimetres

| Part | Diameter | Construction height or Z span | Centre |
| --- | --- | --- | --- |
| Shaft | 92 | 344 high, Z=0..344 | Axis X=Y=0 |
| Collar | 110 | 34 high, Z=340..374 | Axis X=Y=0 |
| Finial | 112 | Z=368..480 | (0, 0, 424) |

The exposed shaft below the collar is 340 mm; its remaining 4 mm enters the
collar. The sphere enters the collar by 6 mm. Neither join has an air gap.
The collar extends 9 mm radially beyond the shaft. The finial's equator extends
1 mm radially beyond the collar; this is not the radius at their join.
At the collar top, the sphere cross-section radius is
`sqrt(56^2 - (424 - 374)^2) = 25.2190404 mm`, leaving an exposed annular
shoulder out to radius 55 mm. At the collar bottom, its exposed shoulder runs
from shaft radius 46 mm to collar radius 55 mm. Boolean union removes buried
caps and interior faces while preserving exposed source-region assignments.

Bounds are X/Y=-56..56 mm and Z=0..480 mm. Curved sides use smooth normals;
planar shoulders and the bottom use planar normals with sharp boundaries.
Numerical construction segmentation remains specified in JSON; runtime LoD
still needs separate model-stage validation.

### Reference proportions and views

Original FRONT contour evidence: approximately 353 px total height, 68 px shaft
width, 83 px finial width and 81 px collar width. These include outline thickness.
With height fixed at 480 mm, the rounded dimensions above agree with all three
width/height ratios within 0.51%. This is proportional design agreement, not
exact camera recovery or pixel-for-pixel reproduction of the original artwork.

V3 projects the same primitives at 1500 px/m in all five views on one
3072 x 2048 sheet. FRONT looks from -Y, RIGHT from +X, BACK from +Y, with +Z
screen up. These level orthographic views have identical silhouettes and a
straight bottom edge. The bottom ellipses in illustrative v1/v2 were not correct
for level orthographic front views and are not retained in these projections.
TOP looks from +Z, +X screen right and +Y screen up. The sphere obscures both
smaller parts, forming one 112 mm disk; do not add collar or shaft circles.
THREE-QUARTER looks from normalized (4, -7, 3), with screen-right normalized
(7, 4, 0) and screen-up their cross product. It shows the collar's annular
shoulder and cylindrical contours. The curved lower silhouette in that tilted
view is the projection of a flat circular bottom, not a rounded physical base.

The [drawing source](review/draw-bollard-projections.py) reads JSON dimensions
and emits only a reference PNG and [projection record](review/bollard-projection-measurements.json).
All height arrows terminate at the actual projected sphere top and ground datum.
The sphere and shaft diameter annotations span their projected extremities.

Default metal remains #383A38 for all three regions. Review colours distinguish
parts and do not become textures or lighting. Independent colour/material
replacement is defined in the surface recipes. The original v1 and recoloured
v2 remain historical comparison sheets with superseded numeric labels. Current
v3 is user-approved; no model export or app verification is claimed.

## Letter construction - original reference authority

The original FRONT lettering in [v1](review/01-street-sign-v1.png) owns the
letter shapes, stroke weight, spacing and case. The previously authored
polyline alphabet was visibly different and has been removed from JSON. A
written reconstruction rule must not override the user's approved appearance.

Use the source crops, source checksum and alpha-extraction recipe in JSON.
Coordinates are half-open pixel rectangles in the unchanged 1536 x 1024 source.
Only letter coverage is extracted; discard the source board colour, shading
and surrounding artwork. Convert mean RGB to alpha with
`clamp((meanRGB - 80) / 170, 0, 1)`, find bounds at alpha >= 0.5, and keep a
two-pixel padding. This derives the existing letter shapes without inventing
a font or substituting a typeface.

Uniformly map each source pixel to `0.480 / 177` metres, using the original
visible board width to preserve relative lettering scale. Centre the unpadded
letter bounds at X=0.2625 and the corresponding board centre Z. Do not stretch
X and Z independently. Sample the mask bilinearly; tighten edge coverage using
`clamp((sample - 0.4) / 0.2, 0, 1)` around the unchanged 0.5 contour, then
supersample the reference sheet. This avoids enlarging source antialias blur.
The source raster still limits recoverable detail; this is not a font file.

Apply the same per-board mask on the plane Y=-0.009 in every view. Upper text
is Maple St and lower is Riverside. Front and oblique views show the same
physical lettering; backs and end faces remain blank. Default paint is ivory,
with separate colour/material overrides retained. No extrusion, coplanar
letter mesh, baked shading or source background is included.

The v4 reference restores this lettering while preserving v3 projection geometry.
See the [lettering review](review/STREET-SIGN-LETTERING-REVIEW.md).

## Future model acceptance

After separate modeling authorization, inspect all five views plus undersides. Check the bounds in JSON within 0.0005 m, two boards only, correct wording/order, one visible board edge in top projection, default charcoal finials (or the explicit caller override), closed surfaces and no internal overlapping faces after union. Neither asset has been modeled or verified in this batch. Placement, collision, navigation and interaction are app responsibilities.

For the street sign, additionally check centred RIGHT end faces, 13.5 mm post
margins, four visible collar corners in TOP, the 50 mm board gap and retention
of all seven appearance regions. Review colour-only and full-material overrides
without geometry changes or cross-instance material mutation. These are future
model acceptance criteria, not claims that the current drawing proves them.

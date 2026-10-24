# Shop Awning - Geometry Supplement

## Coordinates and authority

Use metres, +Z up, -Y front and +X right. Rear mounting plane Y=0. Origin is the
module/run width centre at the front valance bottom elevation Z=0. Identity
rotation and unit scale are the reference pose. Vertical means local Z; ordinary
world placement rotation is separate and must not be used to adjust canopy slope.

Front looks along +Y, back -Y, left +X, top -Z, bottom +Z. The sheet LEFT view
shows rear left/front right and the blue end at negative X; bottom reverses
screen X. The former RIGHT label was incorrect; its geometry is unchanged. The original views are
uncalibrated appearance drawings, not measurements. The annotated sheet shows
the default eight-module assembly. The JSON and formulas own construction.

## Independent parameters and defaults

| Symbol / parameter | Exact default | Definition |
| --- | --- | --- |
| w / moduleWidth | 0.25 m | Full strip width along X |
| L / canopyLength | sqrt(0.8^2+0.3^2) m | Upper surface length rear edge to front fold |
| theta / canopyAngleDegrees | atan2(0.3,0.8), in degrees | Downward from horizontal toward front |
| V / valanceLength | 0.12 m | Vertical outer fold-to-bottom length |
| t / canopy vertical thickness | 0.02 m | Vertical separation of sloped planes |
| d / valance depth | 0.02 m | Front-to-back thickness of vertical segment |

L=0.854400374532 m and theta=20.556045220 degrees are rounded display values;
use the exact defaults for construction. L, theta and V are independently
configurable. Changing slope never rotates the valance. It remains vertical and
its outer length stays V. Thicknesses t/d are construction defaults, not extra
user-facing controls in this revision; overall XYZ scaling still affects them.

Convert degrees to radians for trigonometry. Derive projection P=L*cos(theta),
vertical drop R=L*sin(theta), height H=V+R and slope m=tan(theta). Do not keep
800 mm projection or 420 mm height locked after changing parameters.

Validate finite inputs, w,L,V>0 and 0<=theta<90 degrees. Also require P>d and
V-t+d*m>0 so the lower canopy/valance intersection remains above the bottom and
the thin profile stays nondegenerate. Reject invalid configurations explicitly;
do not silently clamp angle or length. A flat canopy (theta=0) is valid when
V>t. No upward slope, vertical canopy or zero-length segment is defined.

## Shared closed profile

Extrude the following ordered polygon in YZ from X=-w/2 to X=+w/2:

| Vertex | Y expression | Z expression | Default Y | Default Z |
| --- | --- | --- | --- | --- |
| A | -P | 0 | -0.80 | 0 |
| B | -P+d | 0 | -0.78 | 0 |
| C | -P+d | V-t+d*m | -0.78 | 0.1075 |
| D | 0 | H-t | 0 | 0.40 |
| E | 0 | H | 0 | 0.42 |
| F | -P | V | -0.80 | 0.12 |

Upper plane Z=H+m*Y; lower plane Z=H-t+m*Y. C is the lower plane intersection
with the vertical valance rear face. The shared polygon forms a joined thin solid
without rotating a separate valance, leaving a crack, or intersecting two boxes.
The underside space beneath the slope stays open: no triangular filled wedge,
side curtains, scallops or fringe. Straight horizontal bottom and square ends.

Canopy thickness normal to the slope is t*cos(theta), default 18.726584 mm.
It changes with slope because t is deliberately measured vertically. Module
bounds are [-w/2,w/2] x [-P,0] x [0,H]. Twelve geometric vertices, two concave
six-vertex caps and six quads yield twenty triangles before material splits.
Triangulate inside each concave boundary. Flat outward normals, no bevel or
subdivision. Default numeric vertices in JSON are evaluated defaults only;
regenerate them from parameters for each configuration.

## Front, back and left view interpretation

FRONT and BACK remain orthographic elevations with rectangular silhouettes.
The bend changes surface orientation, not the outer width of these elevations.
Draw surface boundaries to distinguish the sloped canopy and vertical valance;
do not turn either view into a flat rectangular panel or introduce perspective.
Use the same folded profile as THREE-QUARTER, viewed from the indicated axis.

Do not place a total-height dimension beside FRONT or BACK. These views explain
the folded surfaces along the viewing axis; the LEFT profile and numeric
specification carry vertical extent, slope and segment-length dimensions.
The default 0.42 m is the overall Z extent H=V+L*sin(theta), not the sum of the
two surface lengths. This annotation change does not alter the geometry, its
bounds or the default assembly dimensions in the heading.

| View | Visible surfaces from top to bottom | Horizontal boundaries |
| --- | --- | --- |
| FRONT | Upper canopy, then outer vertical valance | Outer fold at Z=V; default 120 mm above bottom |
| BACK | Rear thickness cut, lower canopy, then inner vertical valance | Rear lower edge at Z=H-t (default 400 mm); inner fold at Z=V-t+d*tan(theta) (default 107.5 mm) |
| LEFT | Thin side profile at negative X | Existing profile unchanged; blue in the default assembly |

The front fold sits 12.5 mm higher than the inner back fold at the defaults.
They are different edges of a 20 mm thick joined profile, not conflicting
representations. In BACK, the outer front fold is occluded and must not be
added as another visible line. Stripes continue across every visible boundary;
these lines mark surface intersections, not grooves, gaps or added trim.
BACK reverses the screen stripe order relative to FRONT. LEFT retains the
original blue profile without mirroring or redrawing it.

The sheet uses each existing elevation's top and bottom as its height bounds.
For a boundary at height z, place it at pixelY=bottom-(z/H)*(bottom-top).
This fixes the vertical proportions of the added lines while preserving the
original illustrative views; it does not calibrate every image dimension.

## Bottom view interpretation

BOTTOM looks along +Z with screen-up +Y, so the front lies at the lower edge
and screen X is reversed relative to TOP. The canopy underside occupies
Y=-P+d..0. The valance bottom face AB occupies Y=-P..-P+d at Z=0. Its projected
width in the depth direction is d=20 mm by default, or 2.5% of the default
800 mm projection. Show the horizontal boundary at Y=-P+d (default -0.78 m)
across the entire assembly width, immediately inside the front outline.

The inner vertical valance face BC projects edge-on to this same line. Do not
add another band for its height or turn the 20 mm band into a groove, gap or
extra layer. Keep the existing stripe colours continuous across both faces.
The boundary is placed at pixelY=bottom-(d/P)*(bottom-top) within the existing
BOTTOM drawing. TOP has no corresponding interior line: the upper canopy
occludes the valance bottom face from above.

## Fractional repetition and width fitting

Choose one mode; never silently combine conflicting inputs:

1. Module-equivalent count q: any positive finite real number, including 5.3.
   Target width W=q*w. If no layout input is supplied, use q=8.
2. Target width W: positive finite metres. Compute q=W/w.

Let N=ceil(q). First N-1 pieces have width w; last width is W-(N-1)*w. A whole
multiple has a full final piece and no extra zero-width piece. q<1 produces
one partial piece. A partial piece is a shorter X extrusion of the same YZ
profile, not a scaled-down copy in all axes. Every piece shares L, theta and V.

Use unrounded dimensions. To prevent floating-point near-integers producing a
spurious extra piece, normalize q to a positive integer k only when
abs(q-k)<=8*Number.EPSILON*max(1,abs(q)); then use W=k*w. Never normalize to zero.
The 1 mm future mesh acceptance tolerance is not a count-rounding tolerance.

| Request at w=250 mm | Generated pieces | Total width |
| --- | --- | --- |
| q=5 | 5 x 250 mm | 1250 mm |
| q=5.3 | 5 x 250 mm + 75 mm | 1325 mm |
| q=8 | 8 x 250 mm | 2000 mm |
| W=2100 mm | 8 x 250 mm + 100 mm | 2100 mm |
| W=180 mm | 1 x 180 mm | 180 mm |

For widths w_i, place centres at x_i=-W/2+sum(widths[0:i])+w_i/2 with common
rear Y and bottom Z. Modules meet exactly; no gap or groove is introduced by a
colour boundary. A standalone module has both end caps. For adjacent identical
profiles, remove both coincident internal caps and weld profile boundaries;
retain only the two exposed outer caps and all logical material regions.
This rule does not silently fuse mismatched profiles.

## Appearance and overall sizing

Solid mode uses one selected colour/material for all pieces. Alternating mode
uses two entries by zero-based index parity, including the partial final piece.
For q=5.3 the sixth partial piece uses the second colour. Per-piece overrides
remain available. See [surface recipes](SURFACE-RECIPES.md) for precedence.

Resolve L/theta/V, then count/width and geometry, calculate bounds, then apply
any explicit overall XYZ scaling once, then appearance mapping. Geometry
parameters describe dimensions before that optional final transform. Do not
stretch a fixed eight-piece asset to satisfy a requested layout width.

Nonuniform positive Y/Z scaling changes effective slope to
atan2(scaleZ*sin(theta),scaleY*cos(theta)) and upper-surface length to
L*sqrt((scaleY*cos(theta))^2+(scaleZ*sin(theta))^2). Valance length becomes
scaleZ*V and stays parallel to Z. To retain the requested parameter lengths
and angle exactly, omit final scale overrides. Whole-unit sizing is an explicit
subsequent operation, never an implicit second adjustment of the slope.

## Placement and reference

At world translation Z=h, front bottom is h and rear upper edge is h+H.
If the caller instead fixes rear mounting height M, use h=M-H before ordinary
placement (or M minus the scaled H after final scaling). No mounting hardware,
cloth simulation, automatic terrain fitting, hinges or animation is included.

[Final annotated sheet](review/01-striped-shop-awning-annotated-v1.png) preserves
the original view placements and adds FRONT/BACK surface boundaries, corrects
the side label to LEFT, and adds parameter, fractional layout and colour-mode
notes. BOTTOM receives the valance bottom-face boundary. TOP, THREE-QUARTER
and the side-profile geometry stay unchanged. Its old SINGLE UNIT heading is replaced with an assembly heading. The
[original](review/01-striped-shop-awning-v2.png) is retained for provenance only;
it is not the current unit definition. No need to redraw every parameter value.

## Future acceptance

After implementation authorization, verify parameter-derived bounds within
0.001 m, downward angle, unchanged vertical valance, closed thin shell with open
space underneath, cap removal, exact requested width, fractional remainder and
both colour modes. Check flat and tilted valid inputs plus invalid/degenerate
inputs. Documents and annotated drawings do not prove generated mesh or runtime
correctness. No model, export or LOD verification has occurred in this revision.

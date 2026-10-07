# Planar Curbs - Shared Section and Path Presets

Status: The user approved the shared section drawing on 2026-10-07.
Approval covers this section design, not a generated model or runtime API.

## Ownership and coordinates

A curb is a path-generated solid model, not a decal or a material. One shared
cross-section determines width, height and longitudinal edge treatment. The
app supplies the planar path and placement; appearance is independently replaceable.
Paths lie in local XY at Z=0. A constant placement elevation is allowed; slopes,
terrain following, banking, twist and arbitrary surface conformance are excluded.

Let P(s) be a regular planar centreline parameterized by arc length, with unit
tangent T=(Tx,Ty,0). Set N=(-Ty,Tx,0) and U=(0,0,1). Section coordinates are
u in [-0.08,0.08] m and v in [0,0.12] m; the bottom-centre is (u,v)=(0,0).
Sweep Q(s,u,v)=P(s)+u*N(s)+v*U. This keeps the section upright and perpendicular
to the path. Reversing the path swaps left/right without changing the solid.

Start from a rectangular section. Treat its four corners with an inward
0.008 m surface-offset bevel, two segments and circular profile 0.5. This is
the offset along adjoining faces, not a fillet radius. Preserve nominal width
and height; do not scale the result to recover extrema removed by bevels.
The former curved example's 0.004 m bevel is superseded by this shared value.

## Paths, ends and placement

Straight lines, circular arcs and regular tangent-continuous planar curves
may use the section. Radius and length come from the path, not separate
hand-modelled assets. Initial paths are open. Zero-length spans, undefined
tangents, cusps, sharp tangent discontinuities and intersecting swept footprints
must be rejected with an explicit reason; do not clamp, distort or invent joins.
For curved spans, require absolute curvature times 0.08 m to be less than one;
this local condition does not replace whole-footprint intersection checks.
Sharp corners need an explicitly designed smooth connector outside this initial
scope. Closed-loop seams also require a later contract.

Cap each open end in the plane perpendicular to its endpoint tangent. Close
the solid with outward normals; bevel cap perimeter junctions inward by the
same 0.008 m offset with two segments. Do not bevel sample-ring seams, cap
triangulation edges or add decorative grooves. If end treatments overlap on a
short interval, reject the interval instead of silently reducing the bevel.

Continuous mode produces one solid with two end caps. Divided mode trims the
path into arc-length intervals first, then generates and caps each interval
independently; it does not stretch a stock stone to fill the path. The app
chooses interval lengths and omitted gap intervals. A gap measured along the
centreline is not a uniform perpendicular gap across the width on a curve.
No mortar, foundation or adjacent pavement is included in either mode.

## Existing presets

| Preset | Path | Origin and retained nominal dimensions |
| --- | --- | --- |
| `curb-straight` | P(s)=(s,0,0), -0.15 <= s <= 0.15 m | Bottom centre; length 0.30, width 0.16, height 0.12 m |
| `curb-curved` | P(theta)=(0.77*cos(theta),0.77*sin(theta),0), theta=0..18 degrees counterclockwise | Arc centre; inner radius 0.69, outer radius 0.85, height 0.12 m |

Angles start at +X about +Z. The circular preset uses eight equal angular
segments (nine sample rings) for its design example; the section's two bevel
segments are a separate count. At each sample use the analytic tangent rather
than a chord direction that shifts the inner/outer radii. Smooth shading cannot
replace geometry. Global FRONT remains a camera on -Y looking +Y.

For the ideal circular preset, outer/inner arc lengths are 0.267035/0.216770 m,
chords are 0.265939/0.215880 m, and sagittae are 0.010465/0.008495 m.
These are pre-bevel checking values, not raster measurements. Five instances
rotated by 18 degrees cover a nominal 90-degree corner; a continuous path can
instead generate one 90-degree run. Those are different placement choices.

## Appearance and future implementation review

Default material is stone-grey (#C9C4B9 sRGB, roughness 0.90, metallic 0).
Stone-cream and stone-pale remain alternatives. No lighting, AO or image-sheet
outlines are baked into material. UVs should follow path arc length and section
perimeter distance with explicit physical material scale, avoiding texture
stretch when path length changes. Production maps and UV packing are not authored.

Path sampling and LoD may change tessellation, never section dimensions or path
parameters. Future implementation must define and validate error budgets before
selecting runtime LoD counts. No runtime performance claim is made here.
Review the [shared section drawing](review/04-curb-shared-section-v1.png) first.
The user approved this single sheet on 2026-10-07. It marks the 160 x 120 mm section, four 8 mm
corner offsets and bottom-centre path origin. The raster is schematic, not
calibrated: its displayed width/height ratio is not exactly 4:3. Numeric
coordinates govern construction, not image measurements. At the top-right
corner the two-segment profile runs through (u,v)=(72,120),
(77.656854,117.656854), (80,112) mm; mirror about u=0 and v=60 mm for
other corners. These coordinates describe the existing circular profile,
not a change to dimensions.

## Exact section outline and drawing interpretation

Use millimetres in the following table, convert once to metres for modeling.
The twelve vertices are ordered clockwise in the displayed u-right/v-up plane;
close vertex 12 to vertex 1. Correct face winding for the sweep and each cap
so normals point outward; this list is not a universal triangle winding order.

| Vertex | u (mm) | v (mm) |
| --- | --- | --- |
| 1 | -72 | 120 |
| 2 | 72 | 120 |
| 3 | 77.656854 | 117.656854 |
| 4 | 80 | 112 |
| 5 | 80 | 8 |
| 6 | 77.656854 | 2.343146 |
| 7 | 72 | 0 |
| 8 | -72 | 0 |
| 9 | -77.656854 | 2.343146 |
| 10 | -80 | 8 |
| 11 | -80 | 112 |
| 12 | -77.656854 | 117.656854 |

The intermediate offsets are 8/sqrt(2) mm from each corner-profile centre;
use that formula rather than rounding coordinates before mesh generation.
Straight top/bottom spans are 144 mm; straight left/right spans are 104 mm.
Each corner consists of two facets. It is not a single diagonal chamfer or
an unspecified smooth arc. The four corners share one profile, reflected
symmetrically; no corner is authored independently.

The blue dot and coordinate arrows are annotations, not model geometry.
The dot marks the bottom midpoint, not the area centre at (u,v)=(0,60 mm).
Local u follows the path's horizontal normal; local v follows world +Z.
Do not treat v as the path plane's global Y or rotate the section flat into XY.
The shown section describes an interior slice normal to the path tangent;
end-cap edge treatment is separate and must not shrink every sample ring.
No duplicate cap or shell is added to the section. Its nominal height includes
all section geometry; there is no additional base layer.

This drawing is the sole shared-section review reference. Separate straight
and curved multiview reference sheets are not required: the app generates their shapes from this section and
planar paths. Future generated models still require validation of caps,
endpoint bevels, width preservation and invalid-path handling.

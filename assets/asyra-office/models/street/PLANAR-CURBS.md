# Planar Curbs - Shared Section and Path Presets

Status: Design specification following the user's planar-only decision.
No generator, model, runtime API or visual acceptance is delivered here.

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
Review the shared section first, then consistent straight and circular examples,
including caps, endpoint bevels, width preservation and rejected invalid paths.
Reference image: none for the shared cross-section and curved path example.
Use this specification until a new reference has been drawn and reviewed.

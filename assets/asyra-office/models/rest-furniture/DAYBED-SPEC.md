# Sage Nap Daybed - Construction Contract

Status: revised documents approved by the user for commit. No production model, app render,
comfort, physical load or runtime performance is verified.

## Authority and scope

- [Original five-view sheet](review/01-sage-nap-daybed-v1.png).
- [Numeric specification](rest-furniture-model-spec.json), asset `sage-nap-daybed`.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md).
- [Default surfaces](SURFACE-RECIPES.md).
- [Shared sizing and appearance rules](../README.md).

One programmatic-primitives assembly: four straight legs, one solid wooden
platform, one headboard and one rounded pad. Seven closed components and seven
appearance regions. Blender is optional; no factory or exported model is created
by this document. All existing dimensions, source pixels and palette values
remain unchanged. The separate sleeping pillow is not included or revised.

The reference is an authored supplementary design, not a recovered real object.
Its elevations include illustrative raised viewing angles; do not treat pixel
ratios as measurements. Visible pad contour lines are shape boundaries, not
seams, piping, layered upholstery or new geometry. A hidden rear leg is still
present. No footboard, side rails, drawer, hidden mechanism, extra frame,
fasteners, blanket or occupant is included.

## Axes, dimensions and part placement

Metres in JSON; millimetres below. +Z up, -Y front, +X right. Origin (0,0,0)
is the floor-footprint centre. Overall XYZ size is **1800 x 750 x 650 mm**.
The headboard is at -X. The +X end is the foot end. Pad top is Z=420 mm,
platform top Z=340 mm and its underside Z=280 mm.

| Part      | Centre XYZ (mm) | Outside size XYZ (mm) | Rounding radius (mm) |
| --------- | --------------- | --------------------- | -------------------- |
| leg-0     | (-780,-255,140) | 60 x 60 x 280         | 0                    |
| leg-1     | (-780,255,140)  | 60 x 60 x 280         | 0                    |
| leg-2     | (780,-255,140)  | 60 x 60 x 280         | 0                    |
| leg-3     | (780,255,140)   | 60 x 60 x 280         | 0                    |
| platform  | (0,0,310)       | 1800 x 750 x 60       | 0                    |
| headboard | (-880,0,495)    | 40 x 750 x 310        | 0                    |
| pad       | (20,0,380)      | 1740 x 710 x 80       | 20                   |

Leg indices follow JSON `centersXY` order. Wood pieces are sharp, axis-aligned
closed boxes with flat normals and 12 triangles each, including both caps.
Legs have constant square sections, no taper or splay; all four bottom faces
are flat on Z=0. The headboard begins at the platform top, not at floor level.
No Z-edge bevel or decorative platform rim is added.

Leg outer limits are X=+/-810 mm and Y=+/-285 mm. The platform overhangs them
by 90 mm on each corresponding edge. Inner-leg clearances are 1500 mm in X
and 450 mm in Y. These are geometric clearances, not ergonomic certification.

Pad bounds are X=-850..890, Y=-355..355, Z=340..420 mm. The headboard inner
face is X=-860 mm, so the minimum headboard/pad gap is 10 mm. The foot-end
platform margin is 10 mm; side margins are 20 mm. Rounding increases the
clearance near upper/lower edges: a uniform 10 mm gap at every height is not
required. Do not stretch the pad to touch the headboard or add a filler strip.

## Exact rounded pad

Use the Minkowski sum of the inner box **1700 x 670 x 40 mm** and a sphere
of radius **20 mm**, centred at (20,0,380) mm. The outside size is the inner
size plus twice the radius in each axis. It is not an ellipsoid or inflated
cloth simulation. Keep planar central top and bottom faces.

For local centred point p, inner half-size a=(.850,.335,.020) m and r=.020 m,
let q=abs(p)-a. The signed distance is
`length(max(q,0)) + min(max(q.x,q.y,q.z),0) - r`.
Zero defines the surface; negative is inside. Use this for geometric checks,
not as a requirement to install a particular meshing package.

The complete boundary has six planar rectangles, twelve quarter-cylinders and
eight spherical octants. All patches meet without gaps and use shared geometric
vertices. On planar face axis i, set p[i]=+/-(a[i]+r) and the other coordinates
within their inner-box half-extents. Each rectangle has two triangles.

For a cylinder whose straight axis is k, the other axes i,j have signs si,sj:
`p[i]=si*(a[i]+r*cos(t))`, `p[j]=sj*(a[j]+r*sin(t))`, with
`t=0..pi/2` and `p[k]=-a[k]..a[k]`. Split the angle into n equal intervals,
including both ends. Each interval forms a quad split into two triangles.

For an octant with signs sx,sy,sz, use
`p=(sx*(a.x+r*sin(phi)*cos(theta)), sy*(a.y+r*sin(phi)*sin(theta)), sz*(a.z+r*cos(phi)))`.
Both phi and theta span 0..pi/2 with n equal intervals. At phi=0 all theta
samples identify one pole vertex; emit n pole triangles, not degenerate quads.
For each remaining grid cell, split the quad along one consistent diagonal.
This yields 2*n*n-n triangles per octant. The three octant boundaries use the
same angular samples as adjacent cylinders. Add the pad centre after construction.

Orient every face outward; reflection by negative octant signs can reverse
winding and must be accounted for. Normals on cylinder/sphere patches follow
their analytic outward radial directions and meet flat face normals continuously.
Weld patch boundaries geometrically; render-vertex splits for UVs/normals must
not introduce cracks. No subdivision, seams, tufting, zipper, wrinkles or sag.

## Six structural contacts

| Contact            | Count | Plane (mm)                       | Contact area per pair (mm squared) |
| ------------------ | ----- | -------------------------------- | ---------------------------------- |
| leg/platform       | 4     | Z=280                            | 3600                               |
| headboard/platform | 1     | Z=340, X=-900..-860, Y=-375..375 | 30000                              |
| pad/platform       | 1     | Z=340, X=-830..870, Y=-335..335  | 1139000                            |

The pad's support is its **1700 x 670 mm planar underside**, not its full
1740 x 710 mm bounding rectangle. Rounded underside edges rise away from the
platform; that opening is intentional. Do not flatten the entire rounded shell
or add an extra pad/base layer to hide it. Pad and headboard do not contact.

These six interfaces are positive-area, zero-gap contacts, not volume overlaps.
All lie within the supporting slab. Keep identical Z coordinates at each joint;
the general dimension tolerance does not permit independent offsets that open
a gap. All seven parts remain independently closed and addressable; no Boolean
union is necessary. Internal mating faces are allowed; no exposed duplicate
surface or artificial dark line is allowed. Corner supports are not missing just
because an oblique view hides one leg.

## Whole-unit scaling and appearance

Default D=(1.8,.75,.65). Resolve finite positive target XYZ extents T and apply
`pFinal=diag(T/D)*pDefault` once about the shared ground origin to every component.
Omitted axes retain defaults; reject zero, negative or nonfinite values. A
proportional lock rejects inconsistent ratios. Scale pad rounding, thickness,
positions and clearances together. Nonuniform scaling can make spherical corners
ellipsoidal and square legs rectangular; do not refit or restore those details.
Preserve outward normals with inverse-transpose transformation and normalization.
No new ground fitting, deformation or adjustable back is implied.

Regions: `leg-0`..`leg-3`, `platform`, `headboard`, `pad`. Six wooden regions
default to wood sRGB **#B9864E**, grain **#A77945**, roughness **.80**, metallic 0.
Pad defaults to uniform sage **#899B85**, roughness **.90**, metallic 0. Opacity
is 1; transmission, emission and clearcoat are zero. Preserve the wood pigment
recipe; no fabric weave is implied by the source's tonal variation.

Resolve material and supplied colour independently from component to part group
(`legs`, `platform`, `headboard`, `pad`), whole daybed, then preset. Apply supplied
colour after selecting the material; absent tint retains the selected material's
colour. Preserve all other properties and isolate instance overrides from shared
materials. Materials and colours do not change geometry or add displacement.

Default wood grain uses final resized local metres before world placement, as
defined in the surface document. Replacement materials own their UV/procedural
mapping and may omit grain. No light, AO, contact shadow or drawing contour is
baked into any default. The separate pillow's defaults remain unchanged.

## LOD and analytic budgets

Only pad curved-patch sampling changes. Wood boxes and flat pad faces stay
exact; lower LODs do not remove legs, the headboard or hidden cap faces.

| Tier | Segments per quarter n | Total triangles | Ceiling | Maximum surface error (mm) |
| ---- | ---------------------- | --------------- | ------- | -------------------------- |
| lod0 | 12                     | 2580            | 2700    | .172                       |
| lod1 | 6                      | 756             | 800     | .682                       |
| lod2 | 3                      | 276             | 300     | 2.680                      |

Pad count is `12 + 24*n + 8*(2*n*n-n) = 16*n*n+16*n+12`.
Six wooden boxes add 72, giving `16*n*n+16*n+84`. Counts assume triangulation
above with welded poles, no extra cap vertices and no duplicate patch faces.
Normal/UV splits do not change triangle count. These are analytic construction
budgets, not measured exported assets, draw-call counts or runtime performance.

The cylinder chord error is `r*(1-cos(pi/(4*n)))`. A conservative spherical-cell
radial error bound is `r*(1-cos(pi/(2*n)))`: every cell vertex lies within angular
distance pi/(2*n) of its spherical cell centre, and its planar triangles remain
outside that centre-normal support plane. Radial projection covers each spherical
triangle. This bounds both surface directions; the table rounds upward. All
vertices lie on the ideal surface and planar facets remain inside its convex
volume. Flat support faces and extrema are retained exactly at every tier.

Require seven closed components, seven appearance regions, all six contacts,
positive headboard clearance and four flat feet at every tier. Overall dimension
tolerance is .001 m; mating planes remain exact. Under scaling, surface error is
bounded by default error times max(scaleX,scaleY,scaleZ). Reject overflow,
degenerate poles, inward faces, cracks or lost contacts; do not add patches or
normalize individual LOD meshes to compensate.

## Review and verification limits

FRONT looks along +Y with +X screen-right; BACK looks -Y with -X screen-right;
RIGHT looks -X with +Y screen-right. All use +Z up. TOP looks -Z, +X right and
+Y up. FRONT puts the headboard on the left; BACK reverses its image side.
RIGHT is the foot-end view: the distant headboard rises above the pad. In the
three-quarter view, occlusion may hide a leg, but there are four in the assembly.

Future model review must match camera projections, then magnify pad corners,
headboard clearance and underside contacts. Inspect all five reference views
plus the underside. Check geometry separately from colour and scene lighting.
The present handoff does not certify model likeness or real-world comfort.

Run `python3 -B assets/asyra-office/models/rest-furniture/review/__tests__/test_daybed_spec.py`
from the worktree. The permanent checks cover source preservation, dimensions,
contact footprints, clearance, scaling, patch topology/winding/counts, LOD error
bounds, document tables and regions. Test meshes exist only in memory; they are
not Blender output or app assets. Revised documents are approved by the user for commit.

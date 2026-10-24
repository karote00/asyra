# Square Low Stool - Construction Review

Status: revised documents approved by the user for commit. No model, app render or runtime
performance is verified. The side table and both original reference sheets are
unchanged. All original stool dimensions and part placements are preserved.

## Sources and interpretation

- [Original five-view sheet](review/01-square-low-stool-v1.png).
- [Numeric inputs](accent-furniture-model-spec.json), `assets[name=square-low-stool]`.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md), [surface defaults](SURFACE-RECIPES.md)
  and [whole-unit sizing](../README.md).

One placeable stool has five logical components: one upholstered cushion and
four straight square wooden legs. The finished exterior is one connected closed
shell with five independently replaceable surface regions. No rail, apron,
additional base, piping, top seam, tufting, indentation or fabric patch.

The front/right/back drawings are slightly elevated; the top boundary indicates
rounding, not a separate cushion layer. TOP shows a rounded square. Exact front,
right and back projections occlude the far pair of legs; the oblique view can
show a partly hidden fourth leg. Do not move a hidden leg to improve visibility.
The sheet communicates appearance, not calibrated metric proportions. Its
illustrated boundary lines must not become grooves or painted lines.

## Coordinates and exact dimensions

Metres in JSON, millimetres in the tables. +Z up, -Y front, +X right. Ground
origin (0,0,0) is the centre of both the cushion footprint and the four ground
contacts. Overall physical bounds: X/Y=-180..180 mm, Z=0..300 mm. Default full
size is **360 x 360 x 300 mm**. Radius rounding does not reduce these extrema.

| Part    | Centre XYZ mm    | Full size XYZ mm |
| ------- | ---------------- | ---------------- |
| cushion | 0, 0, 230        | 360, 360, 140    |
| leg-0-0 | -125, -125, 87.5 | 35, 35, 175      |
| leg-0-1 | -125, 125, 87.5  | 35, 35, 175      |
| leg-1-0 | 125, -125, 87.5  | 35, 35, 175      |
| leg-1-1 | 125, 125, 87.5   | 35, 35, 175      |

The cushion spans Z=160..300 mm, with radius 35 mm on every edge. Its exact
solid is the Minkowski sum of a centred **290 x 290 x 70 mm** box and a sphere
of radius 35 mm, translated to Z=230 mm. Equivalently, in metres:

```text
q = abs(p-(0,0,.23)) - (.145,.145,.035)
d(p) = length(max(q,0)) + min(max(q.x,q.y,q.z),0) - .035
solid: d(p) <= 0
```

The flat top and bottom squares span X/Y=-145..145 mm. Edge patches are quarter
cylinders and corner patches are sphere octants; this is not a subdivided cube
with shrinkage. Preserve the flat faces and the six physical support planes.

Each leg is a sharp-edged 35 mm square prism, with no bevel or rotation. Its
construction volume reaches Z=175 mm, embedding 15 mm into the cushion. The
visible straight leg extends only from Z=0 to 160 mm. Do not shorten the source
construction volume to remove the intended overlap.

The outer leg edge is 142.5 mm from the origin, leaving **2.5 mm** to the edge
of the flat underside at 145 mm. The full upper leg cap lies inside the cushion,
including all four cap corners. Ground-contact bounds are X/Y=-142.5..142.5 mm;
these are not the stool's overall dimensions. The clear gap between adjacent
legs is 215 mm. There is no splay or leg taper.

## One closed exterior and five material regions

The existing instruction to clip visible legs at the cushion bottom is retained
and completed here. It must not leave five disconnected open meshes.

1. Construct the rounded cushion and four overlapping leg volumes for fit checks.
2. On the cushion's flat bottom plane Z=.16 m, remove four square footprints,
   each 35 x 35 mm and centred at its leg's XY coordinates. Keep all remaining
   orange underside, including the 2.5 mm strips near its outer boundary.
3. Remove each leg's hidden top and the hidden side portions above Z=.16.
   Keep four vertical exterior walls per leg and its flat bottom cap at Z=0.
4. Join each open leg rim to the corresponding square opening in the cushion
   underside. Share geometric boundary vertices/edges. Preserve the cushion and
   four leg region IDs across these joins; orange owns the horizontal underside,
   dark wood owns the vertical walls and bottom caps. No two exposed faces
   occupy the same plane and area. No artificial gap, black ring or connector.
5. Triangulate the planar underside as a square with four square holes. Use
   constrained triangulation preserving every hole edge, not a centre fan or
   convex hull. The region has 20 boundary vertices and four holes: without
   extra vertices it needs `20+2*4-2 = 26` triangles. Its area is
   `.29*.29 - 4*.035*.035 = .0792 m²`. Both are validation targets.
6. Weld the geometric topology into one connected outward-oriented two-manifold.
   Each edge has two incident faces, with no degenerate triangles or internal
   caps. Region/UV/normal splits may duplicate render vertices; their geometric
   positions and adjacency must still represent the same closed surface.

Keep sharp normals at leg corners and the cushion/leg right-angle junction;
use analytic smooth normals on roundovers and constant normals on flat faces.
The four bottom faces remain exactly coplanar at Z=0. Before export, verify the
complete exterior, not only the upper surfaces visible in the sheet.

## Sizing and replaceable appearance

Assemble the default geometry first, then scale the entire unit once by
requested/default X/Y/Z extents about (0,0,0). Omitted dimensions use defaults.
Reject nonfinite, zero or negative extents. Do not independently refit the legs,
recreate a 35 mm roundover after resizing, or silently swap axes. All positions,
widths, join margins and radii follow the same transform. Nonuniform scaling
intentionally makes spherical corners ellipsoidal. A proportional lock must
reject incompatible target dimensions. Transform normals appropriately.

Resolve materials and surface mapping after final sizing according to the
[shared instance contract](../README.md). This specifies capability, not a new
public function name or runtime implementation.

| Region         | Default material | sRGB    | Roughness |
| -------------- | ---------------- | ------- | --------- |
| cushion        | orange           | #CB7135 | .90       |
| each named leg | darkWood         | #60422E | .85       |

Defaults have metallic 0, opacity 1, emission 0, transmission 0 and no clearcoat.
No grain, cloth weave, normal map or displacement is required. The orange
underside has the same default as the cushion. These defaults do not restrict
replacement: each leg and the cushion may use its own colour or material.

Resolve material and colour independently from component override, otherwise
stool override, otherwise preset. Apply the resolved colour to the selected
material without changing other properties or instances. Preserve region IDs
when exporting one exterior. Replacements own their resized-local-space UV or
triplanar mapping; source ink, shadows, AO and highlights must not be baked in.
Runtime placement, seat interaction, collisions and lighting belong to the app.

## LOD construction and budgets

| Tier | Corner segments | Analytic triangles | Triangle ceiling | Surface error mm |
| ---- | --------------- | ------------------ | ---------------- | ---------------- |
| LOD0 | 8               | 780                | 1000             | 1                |
| LOD1 | 5               | 396                | 550              | 2                |
| LOD2 | 3               | 220                | 300              | 4                |

Use the [normalized barycentric corner grid](../furniture/WRITING-DESK-SPEC.md#view-interpretation-and-lod).
For each sphere octant, normalize the integer barycentric grid with i+j+k=n,
then triangulate its cells. Each octant has n² triangles. Match the cylindrical
edge arc samples to the corner boundaries: `atan2(j,n-j)` for j=0..n. This
replaces the former equal-angle sampling statement; mixing those two boundary
samplings would create cracks. Cylindrical patches need no subdivision along
their straight axes. Keep flat rectangle faces, four sharp square legs, the four
bottom holes and all default extrema at every tier.

For n corner segments the ordinary rounded box has `12+24*n+8*n²` triangles.
Replace its two flat underside triangles by 26 and append four open-top legs
with 10 triangles each: **76+24*n+8*n²**. These analytic counts assume no extra
Steiner vertices in the underside triangulation. Additional vertices are allowed
only within the ceiling, with the same geometry and joins. Counts are planning
calculations, not measured exported meshes or performance guarantees.

The maximum source corner/edge chord error multiplied by .035 m must fit the
listed surface error. Legs and all planar contact regions are exact. Verify
adaptive bidirectional surface distance against the ideal rounded solid and
closed exterior. Support planes must remain exact, with default numerical
bounds tolerance 0.5 mm; the larger surface-error allowance does not permit
moving the outer bounds or feet. At nonuniform scale, errors increase by at
most the largest axis factor.

Reject tiers with missing holes, open joins, collapsed 2.5 mm underside strips,
wrong region ownership, excessive triangles or excessive error. Do not remove
legs, add join patches or scale individual LODs. The app chooses switching
thresholds and scheduling; these documents do not establish runtime cost.

## Checks and limits

```sh
python3 -B assets/asyra-office/models/accent-furniture/review/__tests__/test_square_low_stool_spec.py
```

Document tests verify unchanged source geometry, bounds, all four leg cap
corners and ground contacts, underside area, analytic triangle/error budgets,
region coverage, numeric tables and preserved reference images/side-table inputs.
The hole triangulation and final mesh manifold are future production checks;
no mesh is generated by these document tests.

After modeling is separately authorized, compare the five matched views and
close-ups of cushion corners, leg joins, the narrow underside strips and the
underside. Confirm one closed exterior and four sharp straight legs. Numeric
consistency does not certify pixel-perfect visual reconstruction.

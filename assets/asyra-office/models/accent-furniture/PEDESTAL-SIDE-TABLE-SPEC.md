# Round Pedestal Side Table - Construction Review

Status: revised documents approved by the user for commit. No production model, Blender
render or app performance has been verified. Original part dimensions and
reference images are unchanged; column sampling is synchronized with the disks.
The approved square low stool is outside this revision.

## Sources and interpretation

- [Original five-view reference](review/02-pedestal-side-table-v1.png).
- [Numeric inputs](accent-furniture-model-spec.json), `assets[name=round-pedestal-side-table]`.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md), [surface recipe](SURFACE-RECIPES.md)
  and [whole-unit sizing](../README.md).

One placeable table has three logical parts: wooden top, cylindrical metal
pedestal and circular metal base. The finished exterior is one closed shell
with three independently replaceable surface regions. No hidden mounting plate,
flange, screws, tripod, foot pad, raised tabletop rim or underside recess.

The illustration's top/front/back views are slightly elevated; do not interpret
an ellipse as a noncircular disk or a dark side as a square column. FRONT, RIGHT
and BACK have identical geometric silhouettes in exact orthographic projection.
TOP hides the smaller base and pedestal. The source does not fully resolve the
base; the plain circular base remains the previously selected completion.
Exact dimensions and the hidden joins are construction decisions, not calibrated
measurements from the image. Preserve the original sheet for visual review.

## Coordinates and dimensions

JSON uses metres. Tables use millimetres. +Z up, -Y front, +X right. All three
parts share the Z axis and the ground origin (0,0,0). Full default physical
bounds are **420 x 420 x 440 mm**, X/Y=-210..210 mm, Z=0..440 mm.

| Component | Diameter mm | Construction Z range mm | Exposed Z range mm |
| --------- | ----------- | ----------------------- | ------------------ |
| top       | 420         | 412..440                | 412..440           |
| pedestal  | 35          | 15..418                 | 18..412            |
| base      | 250         | 0..18                   | 0..18              |

The top is 28 mm thick. Its lower and upper outer edges use straight 3 x 3 mm
45-degree chamfers, not roundovers. The vertical rim spans Z=415..437 mm.
Top and bottom flat disk diameters are 414 mm before removing the covered
underside centre. The top is planar and horizontal, without a raised lip.

The base is 18 mm thick, with straight 2 x 2 mm 45-degree chamfers. Its vertical
rim spans Z=2..16 mm. Its flat ground cap and flat upper disk have diameter
246 mm. Ground contact is the entire lower cap at Z=0, not a narrow ring.

The construction column is 403 mm long, radius 17.5 mm, Z=15..418 mm. It embeds
3 mm into the base and 6 mm into the top. Its visible length is 394 mm, from
Z=18 to 412 mm. Keep the supplied overlapping volumes as fit inputs; remove
buried caps when constructing the final exposed exterior. No column taper,
lean, collar or end bevel is present.

## Exact exposed union profile

Revolve the following profile about Z. Each row is (radius,Z). It is derived
from the union of the existing three volumes; it changes no external dimension.
The matching full-precision JSON profile is the construction authority.

| Point | Radius mm | Z mm |
| ----- | --------- | ---- |
| P0    | 0         | 0    |
| P1    | 123       | 0    |
| P2    | 125       | 2    |
| P3    | 125       | 16   |
| P4    | 123       | 18   |
| P5    | 17.5      | 18   |
| P6    | 17.5      | 412  |
| P7    | 207       | 412  |
| P8    | 210       | 415  |
| P9    | 210       | 437  |
| P10   | 207       | 440  |
| P11   | 0         | 440  |

The implicit closing edge P11->P0 lies on the axis and creates no surface.
Do not produce an axis tube or degenerate zero-radius quads.

| Profile edges           | Surface region |
| ----------------------- | -------------- |
| P0->P1 through P4->P5   | base           |
| P5->P6                  | pedestal       |
| P6->P7 through P10->P11 | top            |

P4->P5 is the exposed base-top annulus, and P6->P7 is the exposed tabletop
underside annulus. Both meet the column directly at radius 17.5 mm. The hidden
column ends at Z=15/418 mm and covered central disk areas are absent from the
exterior. They must not remain as overlapping interior faces or open holes.

## Shared rings, topology and normals

Use `theta_i=2*pi*i/N`, i=0..N-1, starting at +X. Map each positive-radius
profile point to `(r*cos(theta_i), r*sin(theta_i), z)`. Every ring, including
the small column and disk openings, uses the same N and phase. LOD0 uses 96
segments for all parts, replacing the former column-only 64-segment sampling.
Separate 96/64 rings must not be stitched by nearest vertices or left unwelded.

For consecutive positive-radius rings A then B, and j=(i+1) modulo N, emit:

```text
(A_i, A_j, B_j)
(A_i, B_j, B_i)
```

At the bottom axis endpoint, emit `(P0, P1_j, P1_i)`. At the top endpoint,
emit `(P10_i, P10_j, P11)`. Each axis endpoint is a single vertex. These
orders give outward walls, downward bottom/underside faces and upward top
faces. Share ring vertices across neighboring strips, including the theta seam.

There are ten nonzero-radius rings, nine connecting strips and two cap fans:
`V=10*N+2`, `F=20*N`. The geometric surface must be one connected closed
orientable manifold, with two oppositely directed incidences per edge, no
zero-area triangles and positive signed volume. Its Euler characteristic is 2.
Do not convex-hull the result; that would fill the open space around the column.

Assign region IDs by profile edge even when adjacent parts use the same default
metal. Shared geometry does not merge base and pedestal appearance ownership.
Normals/UVs may split render vertices at those boundaries while geometric
adjacency remains welded. Use constant +/-Z normals on flat caps/annuli, radial
normals on vertical walls, and normalized `(dz*cos(theta),dz*sin(theta),-dr)`
on each chamfer. Preserve sharp creases between profile segments; interpolate
smoothly around each circular strip. Do not average a cap normal into a side.

## Sizes and surfaces

Assemble the default unit first, then apply requested/default X/Y/Z extents once
about the ground origin. Omitted axes retain defaults. Reject nonfinite, zero
or negative extents. All profile dimensions, joins and material boundaries
follow that same transform; no independent column fitting or per-LOD scaling.
Nonuniform XY sizes intentionally produce elliptical disks and column; nonuniform
XYZ sizes change the apparent chamfer angle. Do not recreate 45-degree chamfers
after scaling. A proportional lock rejects incompatible target dimensions.
Transform normals with the inverse transpose of the final transform.

| Region   | Default appearance              | Base sRGB | Roughness | Metallic |
| -------- | ------------------------------- | --------- | --------- | -------- |
| top      | wood with existing grain recipe | #B9864E   | .80       | 0        |
| pedestal | charcoal metal                  | #383A38   | .80       | .15      |
| base     | charcoal metal                  | #383A38   | .80       | .15      |

All defaults have opacity 1, emission 0, transmission 0 and no clearcoat. The
existing grain secondary colour is #986B3D. Preserve its existing linear-colour
mixing formula in the [surface recipe](SURFACE-RECIPES.md); use final resized
local X/Y coordinates in metres. This keeps the physical grain period and a
continuous sample across top, chamfers, rim and underside. Grain adds no
geometry, normal perturbation or displacement. It is a selectable default
material, not a compulsory constraint on replacement surfaces.

Resolve material and colour independently from component override, otherwise
table override, otherwise preset. Apply the resolved colour to the selected
material's base colour while retaining its other settings; a replacement wood
material owns its secondary colour/grain parameters. A plain-colour replacement
may omit grain entirely. Do not mutate other instances. Keep all three regions
independent even if base and pedestal currently share a material. Resolve
surface mapping after whole-unit sizing. No source ink, lighting, shadows, AO,
reflections or background may be baked into appearance.

## LOD requirements

| Tier | Shared radial segments | Analytic triangles | Triangle ceiling | Surface error mm |
| ---- | ---------------------- | ------------------ | ---------------- | ---------------- |
| LOD0 | 96                     | 1920               | 2000             | .15              |
| LOD1 | 48                     | 960                | 1050             | .5               |
| LOD2 | 24                     | 480                | 550              | 2                |

All N values are divisible by four, retaining vertices on +/-X and +/-Y and
therefore exact overall bounds. Keep every profile point, both straight chamfers,
both connection annuli, all three regions and the complete flat ground cap.
All hidden faces/caps and any extra triangulation count toward the ceiling.

The conservative maximum radial chord error is `.21*(1-cos(pi/N))` metres.
The largest radius controls the bound; all profile segments are straight and
shared angular samples prevent gaps. The default analytic error fits every
tier's table limit. Verify bidirectional surface distance and welded topology
on the eventual export; the table does not certify arbitrary triangulations.
Bounds must remain within 0.5 mm numerical tolerance at default size; the 2 mm
LOD2 surface allowance does not permit shrinking the outer extents or moving
the floor contact. At nonuniform scale, error grows by at most the largest axis
scale. The app owns switching distances and rendering schedules.

If error, connectivity, regions or budgets fail, fix the canonical shared-profile
tessellation. Do not add patch faces, hide holes, remove the base or normalize
individual LODs. Counts are analytic planning figures, not measurements of a
production asset or evidence of runtime performance.

## Checks and future visual review

```sh
python3 -B assets/asyra-office/models/accent-furniture/review/__tests__/test_pedestal_side_table_spec.py
python3 -B assets/asyra-office/models/accent-furniture/review/__tests__/test_square_low_stool_spec.py
```

These checks verify preserved source dimensions, embedded joins, the union
profile, region ownership, bounds, local links and Markdown/JSON tables. An
in-memory abstract indexed surface tests the stated winding, manifold edge
incidence, Euler characteristic, signed volume and triangle counts at all three
LODs. It creates no Blender project, model export or app asset. The actual future
generator/export still needs the same checks and material/normal validation.

After modeling is authorized, compare all five reference views with matched
cameras, then inspect enlarged tabletop chamfers, both column connections and
the ground cap. Confirm no rim, flange or visible hidden support was introduced.
Document consistency and abstract topology proofs do not establish visual
acceptance of the final model.

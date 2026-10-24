# Blank Whiteboard - Construction Contract

Status: revised documents approved by the user for commit. No production model, app render
or runtime performance has been verified.

## Authority and scope

- [Current five-view sheet](review/02-blank-whiteboard-v2.png).
- [Side-view drawing record](review/whiteboard-side-record.json).
- [Numeric specification](meeting-furniture-model-spec.json), asset `blank-whiteboard`.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md).
- [Default surfaces](SURFACE-RECIPES.md).
- [Shared sizing and appearance rules](../README.md).

One wall-mounted assembly contains four mitered frame members, one writing panel,
one backing and one flat tray: seven closed components and seven appearance
regions. Use programmatic polygon extrusion and boxes; Blender is optional.
No wall, writing, stationery, stand, mounting hardware or hidden support blocks.

Preserve the original dimensions and palette. The current sheet preserves all
original pixels outside the corrected RIGHT inset. The drawing's
45-degree frame corner joins are resolved as actual mating member faces below;
this supersedes the old surface-only vertical-member corner ownership rule.
The four members together occupy the same rectangular ring as before. Do not
add dark grooves or gaps to imitate illustration outlines.

The current RIGHT view is drawn directly from the numeric frame and tray bounds.
It shows the tray projecting to screen-left (front -Y), with its top exactly at
the frame bottom and all tray thickness below that plane. The rear edges align.
The same 500 px/m scale applies to both axes within this view. Other views remain
illustrative rather than metrically calibrated; do not infer hidden dimensions
from their pixels. The original v1 RIGHT inset was mirrored and placed the tray
too high; v1 is source history only, not the current construction sheet.

The meeting table is outside this revision.

## Coordinates and complete bounds

Metres in JSON; millimetres in tables. +Z up, -Y front, +X right. Origin remains
(0,0,0), the frame centre on its rear mounting plane Y=0. This is not the floor
origin or the centre of the complete tray-inclusive bounds.

- Overall XYZ size: **900 x 60 x 612 mm**.
- Complete X bounds: -450..450; Y: -60..0; Z: -312..300 mm.
- Frame alone: 900 mm wide, 600 mm high and 25 mm deep.
- Aperture: 850 x 550 mm; uniform frame border: 25 mm.
- Writing panel: 4 mm thick, front recessed 4 mm from the frame front.
- Backing: 5 mm thick, rear flush at Y=0.
- Empty panel-to-backing depth: 12 mm, Y=-17..-5 mm.
- Tray: 600 mm wide, 60 mm deep, 12 mm thick. Its forward projection beyond
  the frame front is 35 mm; 60 mm includes the 25 mm under-frame depth.

| Part          | Minimum XYZ (mm) | Maximum XYZ (mm) |
| ------------- | ---------------- | ---------------- |
| writing-panel | (-425,-21,-275)  | (425,-17,275)    |
| backing       | (-425,-5,-275)   | (425,0,275)      |
| tray          | (-300,-60,-312)  | (300,0,-300)     |

All three are closed sharp boxes, 12 triangles each. No bevel, lip, trough,
inset groove, rounded cap or subdivision. The word tray describes the reference's
flat shelf; it does not imply a functional pen-retention groove. App writing
and interaction are separate future behavior, not baked surface marks.

## Four exact frame members

The `parts.frame` ring dimensions remain the envelope authority; `frameMembers`
splits that envelope into four non-overlapping-interior prisms. Polygons below
are counter-clockwise in the ordered (X,Z) plane and extrude through Y=-25..0 mm.
They are full polygons, not centre lines. Keep the order for winding conversion.
Do not emit `parts.frame` as an additional mesh: its ring dimensions and Y range
are shared construction inputs only. Emit the four `frameMembers` prisms, then
one box each for `writingPanel`, `backing` and `tray`. The `frame` appearance
group addresses its four members; it does not create another material surface.

| Member       | Ordered polygon XZ vertices (mm)                 |
| ------------ | ------------------------------------------------ |
| frame-top    | (-450,300), (-425,275), (425,275), (450,300)     |
| frame-right  | (450,300), (425,275), (425,-275), (450,-300)     |
| frame-bottom | (450,-300), (425,-275), (-425,-275), (-450,-300) |
| frame-left   | (-450,-300), (-425,-275), (-425,275), (-450,300) |

Each corner joins an outer corner to its corresponding inner corner with
abs(deltaX)=abs(deltaZ)=25 mm. The mating plane extends through the full 25 mm
Y depth, so every joint is 45 degrees in the default XZ plane. The members meet
at exact shared faces; no material-thickness gaps, overlap or corner squares
assigned solely to the vertical members. Top/bottom prism front area is
21875 mm squared each; left/right area is 14375 mm squared each. Total frame
front area is 72500 mm squared, equal to outer area minus aperture area.

Each quadrilateral prism has eight geometric vertices and twelve triangles.
Triangulate each cap into two triangles. Front Y=-25 uses the listed XZ winding
(outward normal -Y), rear Y=0 reverses it (+Y). Connect corresponding polygon
edges with two outward triangles each. Use flat normals per planar face; UV or
normal splits may duplicate render vertices without opening geometric edges.
Do not smooth across frame edges or miter boundaries into curved corners.

## Thirteen exact interfaces

| Contact kind                 | Count | Interface                     | Area per contact (mm squared) |
| ---------------------------- | ----- | ----------------------------- | ----------------------------- |
| adjacent frame members       | 4     | Full 45-degree mating face    | 625*sqrt(2)                   |
| panel to top/bottom member   | 2     | Z=+/-275, Y=-21..-17          | 3400                          |
| panel to left/right member   | 2     | X=+/-425, Y=-21..-17          | 2200                          |
| backing to top/bottom member | 2     | Z=+/-275, Y=-5..0             | 4250                          |
| backing to left/right member | 2     | X=+/-425, Y=-5..0             | 2750                          |
| tray to bottom member        | 1     | Z=-300, X=-300..300, Y=-25..0 | 15000                         |

The panel and backing contact the four inner frame walls. They do not contact
each other: preserve the 12 mm concealed cavity. The tray contacts only the
bottom frame member, not the panel or backing. It remains centred on X=0 with
150 mm margin to either frame end. Its rear face is flush with the mounting
plane; nothing extends behind Y=0.

These are positive-area flush contacts, not positive-volume intersections.
Closed solids may share internal mating faces. Reuse identical coordinates;
do not shift surfaces by epsilon or add black seam strips. No exposed coplanar
overlay or light leak is permitted. Geometry tolerance never authorizes
separating mating planes. Seven closed components are sufficient; no Boolean
union, cavity filling or invisible connector geometry is required.

## Whole-unit scaling

Default XYZ extents D=(.900,.060,.612). Apply `diag(T/D)` once to every point
about the mounting origin (0,0,0); omitted dimensions retain defaults. T must be
finite and positive. Reject zero, negative and nonfinite dimensions. Under
scaling, frame height is .600*scaleZ while total height is .612*scaleZ. Keep rear
Y=0, and preserve the asymmetric Z bounds; do not re-centre around the total
bounding box or translate to the ground.

Scale every member, panel, backing, tray, recess and cavity together. Transform
normals by inverse transpose and renormalize. Independent XYZ scaling may change
the apparent miter angle and border proportions; do not recut a 45-degree joint
or restore a 25 mm border after resizing. A proportional lock rejects conflicting
ratios. No terrain fitting, curvature or independent member resizing is implied.

## Defaults and replaceable appearance

Seven regions: four `frame-*` members, `writing-panel`, `backing`, `tray`.
Frame members/backing/tray default to honey wood: sRGB base **#B9864E**, grain
**#A77945**, roughness **0.80**, metallic **0**. Panel defaults to uniform ivory
**#EEE9DB**, roughness **0.75**, metallic **0**. All default surfaces have opacity
1 and zero transmission, emission and clearcoat. No baked light, AO, contour
strokes, handwriting or geometric displacement.

Resolve material independently from supplied colour: region, applicable group
(`frame`, `writingPanel`, `backing`, `tray`), whole whiteboard, preset. Apply any
resolved colour after material selection, preserving other material properties.
With no tint, use the selected material's own colour. Isolate instance overrides
from shared materials. The four frame members remain separately selectable.

Use the existing subtle wood pigment in resized local metres before world
placement. The surface document defines each member's mapping, including its
miter face and end caps. Miter lines are material-region boundaries with no gap;
never draw a dark groove. Replacement materials own mapping and may omit grain.
The panel remains an independent plain surface without a default wood recipe.

## LOD, views and acceptance

| Tier | Closed components | Triangles | Ceiling | Geometric simplification error |
| ---- | ----------------- | --------- | ------- | ------------------------------ |
| lod0 | 7                 | 84        | 84      | 0                              |
| lod1 | 7                 | 84        | 84      | 0                              |
| lod2 | 7                 | 84        | 84      | 0                              |

Four frame prisms contribute 48 triangles; three boxes contribute 36. All tiers
reuse this simple geometry; no need for three duplicate meshes. Retain closed
caps, all seven regions and thirteen contacts. Counts are analytic for this
recipe, not measured exports or verified app performance. Scene visibility,
culling, draw calls and projected-size material filtering belong to the app.
Do not remove the rear surface, cavity or tray to meet an invented lower budget.

Default overall dimension tolerance is .001 m; exact common mating planes are
still required. FRONT camera looks +Y with +X screen-right; BACK looks -Y with
-X screen-right; RIGHT looks -X with +Y screen-right; all three use +Z up.
TOP looks -Z with +X screen-right and +Y up. A THREE-QUARTER front view must show
the writing panel and negative-Y tray projection, not the wooden backing.

Review matching projections, a side cross-section and magnified miter, recess
and tray interfaces. Confirm 4 mm recess, 12 mm cavity, 35 mm visible tray
projection and 45-degree default miters. Use the current v2 RIGHT inset for the
corrected direction and joint height. Actual likeness and rendered seams still
require a generated model and app evidence.

## Document verification

Run `python3 -B assets/asyra-office/models/meeting-furniture/review/__tests__/test_whiteboard_spec.py`
from the worktree. Permanent analytic checks cover profile area, shared diagonal
edges, oriented closed prism topology, contact/bounds arithmetic, scaling,
LoD counts, document consistency and preservation of the table, old dimensions,
palette and source images. The same suite verifies the numeric side-view drawing
and that all pixels outside its bounded inset are unchanged. These checks do not
implement a production generator. Revised documents and image are approved by the user for commit.

Regenerate the corrected inset with
`python3 -B assets/asyra-office/models/meeting-furniture/review/draw_whiteboard_side.py`;
use `--check` for read-only reproducibility verification. The script uses the
existing repository Node/sharp dependency, produces a numeric SVG overlay and
composes it over v1. Only v2 is the current review image; v1 remains immutable
source evidence. Neither image contains a rendered production model.

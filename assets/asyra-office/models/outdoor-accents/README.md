# Asyra Office - Group 4J - Outdoor Bench and Entry Sign

Status: park bench is designated for procedural generation. V4 failed visual review; its dimensions and curves remain unapproved proposals. The entry chalkboard retains its earlier approval. No models or app implementation.

## Bench production method - procedural generation

Generate the bench from parameterized slats, frame members and swept arm curves.
Blender is optional; the application may construct the geometry directly.
This is a production-method designation, not authorization to implement it now.

Preserve [original v1](review/01-park-bench-v1.png) as the appearance reference.
Further illustrated reference redraws are deferred. Future review should inspect
multiple views of the same generated object against the original, including
enlarged arm bends, rear arm/post joins and under-seat supports.
The existing drawing scripts already share geometry; changing the production
method alone does not correct their rejected shape parameters.

The JSON and construction below retain the reproducible V4 proposal, not an
approved reconstruction. Resolve its rear arm protrusion, front bend, support
contours and uncalibrated height rationale before accepting generated geometry.
Keep overall XYZ sizing and independently replaceable wood/metal appearance.
Default colours and materials remain defined in the surface recipes.

| One placeable unit | Source | Nominal X x Y x Z (m) | Sheet |
| --- | --- | --- | --- |
| Park bench - procedural generation | Lower-right park beside the central office | Unapproved V4 proposal: 1.20 x 0.508955165475 x 0.65; seat top 0.34 | [Original](review/01-park-bench-v1.png); [rejected V4](review/01-park-bench-v4.png) |
| Open A-frame chalkboard | Beside the central office entrance | 0.416 x 0.37 x 0.69 | [Sign](review/02-entry-chalkboard-v1.png) |

Each sheet has front, right, back, top and oblique views. Bench frame, slats and arms form one unit. Sign includes both leaning frames, front and rear boards, hinges and spreaders as one open unit. No people, pets, cups, plants, ground or wall is included.

## Reconstruction handoff

- [Approved original reference](../architecture/review/approved-office-reference.jpg): park bench and central entrance sign.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md): supports, transforms, hidden backs and static joints.
- [Numeric specification](outdoor-accents-model-spec.json): complete component sizes, curves and vector lettering.
- [Surface recipes](SURFACE-RECIPES.md): wood, metal and flat chalk artwork without lighting.
- [Review index](review/README.md) and [actual prompts](review/PROMPTS.md).

The source supplies appearance and the four-line sign wording. Exact dimensions, four seat slats, three back slats, hidden bench frame and rear sign structure are authored completions. The original generated views are not engineering projections. Bench v4 projects one shared numeric construction in all five views. Original v1 remains the uncalibrated appearance reference. JSON defines dimensions and hidden construction; contour lines and dimension labels are annotations. No model verification or 100% reconstruction is claimed.

The app owns placement, seating, sign count, lighting and any future folding behavior. The sign is modeled only in a fixed open pose; no animation, physical hinge simulation or installation engineering is supplied.

## Bench revision - 2026-10-09

The previous TOP-only pipeline could not verify the other four views after
geometry changes. V4 replaces every candidate view with a projection of one
shared construction and preserves original v1 unchanged for comparison.
Historical v3 is retained solely as evidence of that incomplete approach.

The unapproved V4 defaults are 1200 x 508.955165475 x 650 mm; seat top 340 mm, seat width
1140 mm, back width 1070 mm, rear inset 92.5 mm per side, 27.5 mm wood outside
each rear post, 15-degree lean and flat caps 10 mm below the backrest top.
The current whole-arm clearance lower bound is approximately 7.649 mm.

- [Rejected V4 sheet - retained evidence](review/01-park-bench-v4.png)
- [Original reference](review/01-park-bench-v1.png)
- [Composition source](review/compose-bench-reference.py)
- [Shared construction](review/bench_geometry.py)
- [Projection source](review/bench_projection.py)
- [Reproducible review and its limits](review/README.md)

All five overview cameras are explicit; they are not calibrated original-image
cameras. Technical consistency does not automatically establish visual fidelity
or user approval. Colour/material regions and overall XYZ sizing remain
replaceable. No model export, app change or production mesh acceptance.

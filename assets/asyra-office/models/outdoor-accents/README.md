# Asyra Office - Group 4J - Outdoor Bench and Entry Sign

Status: **The user approved these drawings and documents for commit. No models or app implementation.**

| One placeable unit | Source | Nominal X x Y x Z (m) | Sheet |
| --- | --- | --- | --- |
| Park bench | Lower-right park beside the central office | 1.20 x 0.49 x 0.73; seat top 0.36 | [Bench](review/01-park-bench-v1.png) |
| Open A-frame chalkboard | Beside the central office entrance | 0.416 x 0.37 x 0.69 | [Sign](review/02-entry-chalkboard-v1.png) |

Each sheet has front, right, back, top and oblique views. Bench frame, slats and arms form one unit. Sign includes both leaning frames, front and rear boards, hinges and spreaders as one open unit. No people, pets, cups, plants, ground or wall is included.

## Reconstruction handoff

- [Approved original reference](../architecture/review/approved-office-reference.jpg): park bench and central entrance sign.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md): supports, transforms, hidden backs and static joints.
- [Numeric specification](outdoor-accents-model-spec.json): complete component sizes, curves and vector lettering.
- [Surface recipes](SURFACE-RECIPES.md): wood, metal and flat chalk artwork without lighting.
- [Review index](review/README.md) and [actual prompts](review/PROMPTS.md).

The source supplies appearance and the four-line sign wording. Exact dimensions, four seat slats, three back slats, hidden bench frame and rear sign structure are authored completions. Generated views are not engineering projections. JSON determines otherwise ambiguous geometry; appearance remains subject to review. No model verification or 100% reconstruction is claimed.

The app owns placement, seating, sign count, lighting and any future folding behavior. The sign is modeled only in a fixed open pose; no animation, physical hinge simulation or installation engineering is supplied.

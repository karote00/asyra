# Asyra Office - Group 4F - Rugs and Throw Pillow

Status: **The user approved these drawings and documents for commit. No Blender, exported models, animation, app implementation or model verification.**

| One placeable unit | Source in the central office | X x Y x Z (m) | Sheet |
| --- | --- | --- | --- |
| Rectangular green rug | Floor beside the left laptop desk and sleeping pet | 1.40 x 0.95 x 0.008 | [Rectangular rug](review/01-rectangular-rug-v1.png) |
| Round grey-lavender rug | Beneath the small table in front of the green sofa | 1.20 x 1.20 x 0.008 | [Round rug](review/02-round-rug-v1.png) |
| Mustard throw pillow | Yellow cushions on the green sofa | 0.32 x 0.11 x 0.32 | [Pillow](review/03-throw-pillow-v1.png) |

Each rug sheet has top, front edge, right edge, bottom and oblique views. The pillow has front, right, back, top and oblique views. One rug is one textile unit, not a ground tile or furniture set. One pillow is independent of its sofa. No preset arrangement is supplied.

## Reconstruction inputs

- [Approved original reference](../architecture/review/approved-office-reference.jpg): central office first.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md): bounds, bevels, backs, pillow shape and seam.
- [JSON specification](textiles-model-spec.json): exact geometry, origin, materials and region masks.
- [Surface recipes](SURFACE-RECIPES.md): deterministic intrinsic weave without lighting.
- [Review index](review/README.md) and [actual prompts](review/PROMPTS.md).

Colours and silhouettes follow the original office. Exact sizes, obscured rug outlines, backing colours, border widths and the pillow's hidden back are authored completions, not recovered measurements. Generated sheets are not engineering projections. Numeric geometry controls dimensional ambiguities; visual disagreements remain subject to review. No 100% reconstruction or model verification is claimed.

The app owns placement, count, orientation, furniture arrangement and scene lighting. Do not bake shadows into textiles. These are static undeformed assets; cloth simulation, draping, folds and collision behavior are outside this group.

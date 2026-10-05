# Asyra Office - Group 5B - Small Tree and Wall Planter

Status: **The user approved these drawings and documents for commit. No models, app implementation or model verification.**

| One unit | Reference and authored completion | Size | Sheet |
| --- | --- | --- | --- |
| Potted small tree | Central-office entrance planted greenery style; explicit three-cluster crown | Pot diameter 0.25 m, height 0.23 m; total about 0.71 m | [Tree](review/01-potted-small-tree-v1.png) |
| Wall trailing planter | Pale pots/foliage from the office; flat-back mounting is a new completion | Bowl 0.20 m wide, 0.16 m high, projects 0.11 m; foliage envelope 0.25 x 0.15 x 0.44 m | [Wall planter](review/02-wall-planter-v1.png) |

Each sheet has front, right, back, top and oblique views. One unit includes pot, soil and plant as separately named components. The wall unit has no wall, ceiling chain or projecting fastener; its attachment recess is part of the pot.

## Modeling inputs

- [Approved office reference](../architecture/review/approved-office-reference.jpg): source for the palette and planted miniature style.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md): full plant construction, cavities, mounting plane and hidden faces.
- [Numeric specification](planters-model-spec.json): pot sections, branch paths, explicit tree leaves and vine placement.
- [Surface recipes](SURFACE-RECIPES.md): intrinsic colour and no baked lighting.
- [Review index](review/README.md) and [generation prompts](review/PROMPTS.md).

Exact dimensions, leaf counts, unseen branching, flat-backed bowl and mounting recess are authored decisions, not recovered measurements. Generated sheets guide appearance and are not calibrated engineering projections. Numeric specifications fix otherwise ambiguous geometry; appearance remains subject to review. No model verification or 100% reconstruction is claimed.

The app owns placement, wall attachment behavior, duplication, lighting and animation. No growth, wind, hardware installation, physics or LOD model is implemented. The mounting recess describes visual geometry, not load-bearing engineering.

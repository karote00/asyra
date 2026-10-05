# Asyra Office - Group 4L - Pantry Canister and Takeaway Cup

Status: approved for commit by the user. Drawings and specifications only; no model verification.

| One placeable unit | Reference | X x Y x Z (m) | Sheet |
| --- | --- | --- | --- |
| Closed pantry canister | Small jars on the central office pantry shelf | 0.09 x 0.09 x 0.125 | [Canister](review/01-pantry-canister-v1.png) |
| Takeaway coffee cup | Small drinks around the park seating beside the office | 0.08 x 0.08 x 0.12 | [Cup](review/02-takeaway-cup-v1.png) |

One canister includes its body and wooden lid. One cup includes its paper body, sleeve and fitted lid. No shelf, table, other container, contents, liquid or preset arrangement. The two objects are independently placeable units.

## No baked lighting

The user explicitly requires no shadows because the 3D scene supplies lighting. Review drawings use flat colours and contour lines, without cast/contact shadows, ambient occlusion, highlights or lighting gradients. Contour lines are drawing annotations, not texture details. Future materials contain intrinsic colour and wood grain only. The app owns lights, shadows, reflections and exposure.

## Reconstruction handoff

- [Original approved reference](../architecture/review/approved-office-reference.jpg): central office first, adjacent park second.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md): closed revolution profiles, hollow interiors and sip opening.
- [Numeric specification](pantry-smallware-model-spec.json): part profiles, transforms, dimensions and material values.
- [Surface recipes](SURFACE-RECIPES.md): base colours and intrinsic grain.
- [Review index](review/README.md) and [actual prompts](review/PROMPTS.md).

The source objects are small and partially obscured. Colour families and simple silhouettes guide these designs; exact jar construction, cup lid, sleeve, hidden surfaces and dimensions are authored completions, not recovered details. Generated views are illustrative rather than calibrated projections. Geometry documents resolve dimensional ambiguity; appearance remains subject to user review. No exact reconstruction or model verification is claimed.

Only static, assembled objects are specified. The app owns placement and interactions. No opening/closing animation, simulated contents, pouring, rigging, Blender operation or export is included. The user authorized committing this reference handoff.

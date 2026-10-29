# Asyra Office - Group 4L - Pantry Canister and Takeaway Cup

## Current pantry variants

`sourceVariants` in the [numeric specification](pantry-smallware-model-spec.json)
and the [geometry supplement](GEOMETRY-SUPPLEMENT.md) own the four clear
containers, inserted cork closure, narrow-neck bottle, flowering/leafy shelf
plants, blue/brown succulent pot, white pitcher, insulated tumbler and brush cup.
The large ivory-content jar and tiny narrow-neck bottle remain reusable assets
but are stored off the current shortened shelf. The cork enters the glass mouth;
it is not a loose disk resting on top. Exact ingredient identity is unresolved.

Both the original lantern and the new [framed night light](FRAME-NIGHT-LIGHT.md)
remain separate assets; the fridge uses the framed light. Its two owner photos
and single-unit reference are retained beside that specification. The
[current layout](../../../../apps/asyra-office/src/scene/reference/pantry-layout.json)
and [technical proposal](../../../../docs/ai/apps/asyra-office/implementation.md#countertop-group-and-approved-pantry-layout---2026-10-28)
own placement, support, shortened shelf contents and cabinet clearances.


Status: original design sheets approved; the subsequent procedural pantry
variants and current layout are included in the 2026-10-29 partial room checkpoint.
The original batch below is not the complete runtime smallware inventory.

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

# Asyra Office - Group 4E - Desk Items

Status: **The user approved these drawings and documents for commit. No models, animation, app implementation or model verification.**

| One placeable unit | Source in central office | Fixed design dimensions | Sheet |
| --- | --- | --- | --- |
| Silver laptop | Silver Apple-style lid on the left work desk | Base 0.30 x 0.21 x 0.012 m; lid 0.30 x 0.006 x 0.19 m; 110-degree opening | [Laptop](review/01-laptop-v2.png) |
| Empty ceramic mug | Pale cup held at the tea point and pale table cups | Vessel diameter 0.084 m and height 0.090 m; total width with handle 0.119 m | [Mug](review/02-ceramic-mug-v1.png) |

Each drawing provides front, right, back, top and oblique views. One laptop includes its screen, hinge, keys and trackpad. One mug includes its handle and hollow body. No desk, person, drink, charger or scene geometry is included.

## Handoff

- [Primary reference](../architecture/review/approved-office-reference.jpg): central office first; exterior shop objects are not the source.
- [Geometry](GEOMETRY-SUPPLEMENT.md): surfaces, pivots, hidden faces, hollow interior and handle join.
- [JSON specification](desk-items-model-spec.json): dimensions, exact primitive construction, keyboard arrangement, emblem mask and material slots.
- [Surface recipes](SURFACE-RECIPES.md): colours and screen UV mapping with no baked lighting.
- [Review index](review/README.md) and [generation prompts](review/PROMPTS.md).

The laptop follows the requested Apple-style appearance, with a small white apple-shaped rear emblem. Its hidden front and underside are explicit simplified completions, not a reconstruction of a particular commercial model. Metric dimensions are design choices. Generated image perspectives and key layouts are approximate; JSON fixes construction. Future models require comparison after separate authorization; this package does not establish 100% reconstruction.

The display is a separate front-facing surface region with normalized UVs and a plain dark preview material. The app will supply the user's current work content. No screenshot, UI, video, reflection or animation is baked into the model. The mug is empty. Lighting and any future drink content belong to the app.

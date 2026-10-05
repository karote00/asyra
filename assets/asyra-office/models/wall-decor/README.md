# Asyra Office - Group 4D - Wall Decoration

Status: **The user approved these drawings and documents for commit. No models, implementation or model verification in this batch.**

The central office is the primary reference. This small batch contains three independently placeable units; it does not change earlier groups or their approval status.

| Unit | Width x depth x height (m) | Reference and completion | Sheet |
| --- | --- | --- | --- |
| Round wall clock | 0.60 x 0.055 x 0.60 | Dark rim, ivory dial and short hour marks on the central office rear wall; exact dimensions and hidden back are authored | [Clock](review/01-wall-clock-v2.png) |
| Vertical wallpaper strip | 0.40 x 0.001 x 1.20 | Sage and cream stripes behind the tea-point counter; one independently placeable paper strip | [Vertical strip](review/02-vertical-wallpaper-v1.png) |
| Horizontal wallpaper strip | 1.20 x 0.001 x 0.40 | Rotated variant of the same palette and stripe pattern; horizontal stripes are not visible in the reference | [Horizontal strip](review/03-horizontal-wallpaper-v1.png) |

A wallpaper unit includes one green band and two cream half-bands. Repetition is the app's choice. There is no wall, ground, frame, or assembled wallpaper array. Both orientations have a plain cream back and paper-thin edges.

## Modeling handoff

1. [Original reference](../architecture/review/approved-office-reference.jpg): central clock and central tea-point wall only.
2. [Geometry supplement](GEOMETRY-SUPPLEMENT.md): complete geometry, coordinates, parts, seams and hidden surfaces.
3. [Numeric specification](wall-decor-model-spec.json): dimensions, materials, primitive parameters, pivots and pattern functions.
4. [Surface recipes](SURFACE-RECIPES.md): solid colours and unlit stripe masks.
5. [Review index](review/README.md) and [actual generation prompts](review/PROMPTS.md).

Dimensions and unseen construction are explicit design decisions, not measurements recovered from a single image. Drawings are appearance guides, not calibrated projections. Exact geometry follows the numeric contract; shape or colour disagreements still require review. No 100% reconstruction or Blender validation is claimed. Sheet shading must never be baked into materials.

The app owns placement, wall attachment, repetition, time display and scene lighting. Clock hands are separate authored components, but this batch does not implement movement. Animals, additional furniture, wall lights, hangings and plants are outside this batch.

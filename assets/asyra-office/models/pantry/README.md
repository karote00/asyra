# Asyra Office - Group 4B - Pantry Equipment

Status: **The user approved committing four multiview sheets and documents; models have not been verified.**

## Units in this batch

| One placeable unit | Source location | Body width × depth × height (m) | Sheet |
| --- | --- | --- | --- |
| Two-door refrigerator | Upper-right pantry beside the dispenser | 0.52 × 0.52 × 1.15 | [Fridge](review/01-fridge-v1.png) |
| Water dispenser with bottle | Left of refrigerator | 0.32 × 0.34 × 1.12 (including bottle height) | [Dispenser](review/02-water-dispenser-v1.png) |
| Sink cabinet assembly | Below poster on pantry right | 0.90 × 0.50 × 0.64 (counter height) | [Sink](review/03-sink-cabinet-v1.png) |
| Coffee machine | Below pantry shelf, left of sink | 0.20 × 0.25 × 0.29 | [Coffee machine](review/04-coffee-machine-v1.png) |

Dimensions are authored model scales, not measured from the original. Handles/trays protrude beyond body sizes; JSON gives complete bounds. Sink height including faucet is approximately 0.87 m. Each sheet contains front, right, back, top, and oblique views.

Fridge notes/magnets and countertop cups, jars, and plants remain separate objects. The bottle belongs to the complete dispenser unit; cabinet, counter, basin, and faucet form one complete sink unit.

## Documents and reference

- [Original approved reference](../architecture/review/approved-office-reference.jpg): upper-right central-office pantry first.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md): openings, recesses, curves, backs, and joins.
- [Numeric specification](pantry-model-spec.json): part sizes, positions, materials, and operations.
- [Surface recipes](SURFACE-RECIPES.md): no baked shadows, highlights, or reflections.
- [Image index](review/README.md) and [actual prompts](review/PROMPTS.md).

Recognizable source colours, contours, and layout guide appearance. Faucet details, coffee-machine outlet/buttons, hidden backs, and recess depths are explicit completions. The coffee machine is the smallest and partly obscured source item; this design is not a precisely identified source structure.

## Scope

Images/documents only. No Blender, GLB, or feature implementation. These are static closed exteriors with visible recesses only, excluding fridge/cabinet interiors, plumbing, and appliance mechanisms. Future app requirements determine door opening, pouring, and coffee effects. Snack cabinet and other pantry objects remain a later batch.

Generated images are not calibrated projections. Slight view-tone/position differences must not become materials or separate geometry. Future actual models need comparison; complete documentation does not establish 100% reconstruction.

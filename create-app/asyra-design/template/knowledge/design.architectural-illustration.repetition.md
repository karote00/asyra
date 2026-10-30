---
{
  "description": "Represent repeated multi-face components once while preserving painter order and genuine exceptions.",
  "contexts": [
    "architectural-illustration"
  ],
  "provenance": [
    "Asyra Design advisory mapping reviewed against current public tool descriptions and schemas."
  ],
  "references": [
    "design.architectural-illustration",
    "design.architectural-illustration.contracts",
    "illustration.architecture.repetition",
    "illustration.architecture.projection"
  ]
}
---

## Represent a repeated multi-face component once

After selecting the component shape and material method, separate unique contours,
material roles, repeat axes and genuine exceptions. For translated world-space
copies, use one `pattern.faces` list containing every face of the component in
painter order, then `origin` and `axes`. The backend projects each prototype and
expands all copies. The last axis varies fastest; output order is instance first,
then face. This does not depth-sort: if the intended painter order differs, split
into appropriate explicit families instead of changing the artwork to fit a pattern.

Use the executable multi-face example in the discovered `prepare_design` definition
for exact syntax:
its glass and rim are separate contours, its glass uses the chosen world field,
and its irregular accent stays outside the pattern. Use local fills for intended
per-piece material restarts; select a common `linearFields` domain only when the
material should continue across copies. Preserve source contour detail. Identical
2D curves use `vector-pattern`; arbitrary nontranslated 3D shapes remain explicit.
Knowledge is optional; these are representation choices, not invocation eligibility.

Confirm representative material evidence separately from overall detail completion
using the scoped review flow in the materials.review child. Ready parts still use `prepare_and_apply_design`.
Use current returned IDs or `retain_design_targets` with the artifact and exact
instance prefix for a later local edit; generated keys are not canonical IDs or
cross-artifact aliases. Reuse unaffected passes after that edit. Release/cancellation
requires current authority, not replay of successful writes. `instanceRanges` can
restore known missing complete instances; if a write stopped within an instance,
use its actual partial receipt and current state before deciding what remains.
A save failure retries saving, not preparation/application. Reload restores editable
native shapes and fills, not the original request artifact or a live pattern link.

### Relevant capability handoffs

| Intent/data already available                   | Existing consumer                                                                                                                         | Required handoff and limit                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draw a ready part from chosen world faces       | prepare_and_apply_design with projection + projected-face                                                                                 | Choose the camera and geometry once; tool projects supplied geometry and applies canonical parent attachment. No automatic perspective, hidden-face removal or depth ordering. Already projected 2D outlines remain vectors.                                                                                                                                                                                                                              |
| Expand regular facade detail                    | Same main tool with surface-grid boundary, normalized motifs, rows/columns and order                                                      | Backend owns expansion. Respect the actual four-corner surface contract and cell-major/motif-major semantics. Do not send a list of every projected window corner.                                                                                                                                                                                                                                                                                        |
| Repeat a compatible motif                       | `pattern.faces` + `origin`/`axes`, or `vector-pattern.template` + placements                                                              | Read exact selected schemas. These are not arbitrary 3D instancing or arbitrary function execution. Confirm supported transformations and split genuinely different motifs.                                                                                                                                                                                                                                                                               |

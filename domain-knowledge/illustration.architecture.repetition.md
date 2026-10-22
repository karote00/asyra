---
{
  "description": "Represent repeated detail with rules while preserving genuine exceptions.",
  "contexts": [
    "architectural-illustration"
  ],
  "provenance": [
    "Project-authored advisory synthesis; informed by retained architectural drawing failures, not a building-specific recipe or empirical efficacy claim."
  ],
  "references": [
    "illustration.architecture"
  ]
}
---

# Describe repeated detail as rules when the representation fits

## What

Represent genuinely repeated geometry with a template and placements;
keep unique or irregular details explicit.

## Why

Re-deriving and transmitting every repeated vertex increases output and
opportunities for inconsistency without adding design decisions.

## How

Separate the decisions that vary from those that repeat. Choose one motif,
its dimensions, placement rule, material and visibility order. For a tapered planar
facade, describe a surface and a normalized window/frame motif. For repeated curves,
retain the curve template rather than replacing it with many independently
sampled polygons. Reuse only transformations the selected representation actually
supports; different orientations or topologies may require different templates.
A shared material means intentional linked edits; independent equal colors must
remain independently editable when that is the intent. Do not force an irregular
ornament into a grid or reduce requested detail merely to reduce payload size.

## Evaluation Guidance

Compare required silhouette/detail, editable geometry and paint
order before crediting reduced payload. Track transmitted input bytes and later
repair effort, not generated object count.

## Provenance

Extracted from the project-authored architectural illustration advice; this topic makes no empirical efficacy claim.

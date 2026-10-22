---
{
  "description": "Choose consistent projection, coordinate bases and visibility order.",
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

# Preserve a consistent projection and explicit visibility order

## What

Keep world geometry, projected canvas positions and parent-local
coordinates distinct. Keep one camera for connected geometry unless the user
requests a deliberate change.

## Why

Changing coordinate basis or painter order can produce seams, floating
parts or rear edges appearing through nearer surfaces even with correct vertices.

## How

Choose a projection appropriate to the requested view; orthographic and
perspective views are different choices. Reuse the chosen projection for connected
surfaces. Signed world coordinates are legitimate; use the consumer's documented
conversion instead of clamping negative values or translating every child
independently. Determine far-to-near order for actual overlapping surfaces.
A single global height sort is not a visibility solution. Split intersecting
surfaces only when their actual visible portions require it. Do not assume the
renderer removes hidden faces or establishes architectural depth automatically.

## Evaluation Guidance

Inspect podium/tower joins, near/far crown edges and top surfaces
at fixed views. Distinguish a geometry error from a layer-order error before
repairing. Do not rebuild geometry when a scoped order correction is sufficient.

## Provenance

Extracted from the project-authored architectural illustration advice; this topic makes no empirical efficacy claim.

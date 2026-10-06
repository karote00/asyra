# Stair Baluster - Top Cut Correction Review

Review date: 2026-10-06. Scope: dimensions and geometry only.
Status: rejected after user review. The independently redrawn top detail does
not match the main THREE-QUARTER projection. The earlier checks below did not
establish cross-view consistency and do not constitute acceptance.

## Revised correction plan

Use the user-requested direct crop and uniform enlargement of the existing
THREE-QUARTER top. Replace only the inset interior in a new v4 sheet. Preserve
the source sheet and every pixel outside the inset; do not redraw the geometry
or change the numeric specification. Update this component's gallery and review
documentation only. Verify exact crop equality, uniform scale, unchanged main
views and readable annotations, then inspect the full sheet and enlarged inset.
No Blender, app work, dependency changes or commit is included. Plan self-review:
one source region owns both depictions, so an independently invented camera or
top-face shape can no longer enter this correction.

## Drawing review

Inspected the full 1536 x 1024 v3 sheet and an unretouched detail crop from
(1196, 286) to (1526, 838), enlarged 2x with nearest-neighbour sampling to
660 x 1104. Enlargement adds no source detail.

- The detail now has four distinct top vertices, A-B-C-D, replacing the
  near-triangular v2 inset.
- A and D identify the low pair at Z=0.89 m; B and C identify the high pair
  at Z=0.91 m. Centre height is separately stated as Z=0.90 m.
- The oblique detail shows one planar top and straight vertical side edges,
  without an added cap, ridge, bevel or hole.
- FRONT and BACK retain opposite slope directions. RIGHT remains the
  rectangular high-end silhouette. TOP and BOTTOM retain square footprints.
- Equal world heights need not appear at equal screen heights in an elevated
  oblique view. The inset uses its own close-up camera; its screen slope is
  not a direct angle measurement for the main THREE-QUARTER view.

These are visual topology and annotation checks. Pixel-identical preservation
of the other views and calibrated camera/projection agreement are not claimed.
The numeric specification governs exact reconstruction.

## Document review

The geometry supplement now explicitly defines the four top coordinates,
equal-height pairs, face centre, projection dimensions and view directions.
The existing numeric JSON geometry remains unchanged.

- All four corners satisfy Z=0.90+0.5X.
- Opposite edges are parallel; adjacent top edges are perpendicular in 3D.
- The actual top rectangle is approximately 44.72136 x 40 mm.
- Its horizontal footprint and TOP projection remain 40 x 40 mm.
- Rise across the post is 20 mm over a 40 mm run; pitch is
  26.5650511771 degrees, matching the handrail.
- Overall height is 0.91 m; centre height is 0.90 m.
- In the documented interior assembly, both adjoining rail undersides and
  the post top lie on Z=0.90+0.5X throughout the post width.
- Future acceptance no longer treats the default material as fixed geometry.
  Colours and materials remain replaceable and outside this review.

No mesh, export, Blender execution or app modification is part of this review.

## Provenance

Built-in imagegen edited `01-stair-baluster-v2.png` to produce
`01-stair-baluster-v3.png`. The actual correction prompt is recorded in
[PROMPTS.md](PROMPTS.md#4-baluster-top-cut-correction---2026-10-06).
The enlarged detail is a crop of that generated sheet, not a separate design.

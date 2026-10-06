# Wall - Flush End Revision

Status: rejected by the user on 2026-10-06; magnification still shows an end
overhang. The inspection claim below was incorrect. See `01-wall-v5-review.md`
for the subsequent candidate. This sheet does not approve a model or change
the numeric specification. Lighting and dimension review follow user approval.

- Input: `01-wall-v2.png`.
- Candidate: `01-wall-v3.png`.
- Tool: built-in image generation, reference-based edit.
- Requested correction: cap ends flush with the wall along its length; preserve
  the approved small thickness-direction projection visible in SIDE.
- Inspection: the previous right-end step in THREE-QUARTER is removed. FRONT
  retains equal cap/body width. SIDE retains the small cap projection. TOP keeps
  equal longitudinal endpoints. No cast shadow has been added.
- Limitation: this generated drawing is not a calibrated geometric projection.
  User shape approval and subsequent numeric review remain required.

## Edit prompt

Use case: precise-object-edit.
Edit the supplied architectural multiview sheet. Preserve the same cream wall segment, texture, four-view layout, white background, labels FRONT, SIDE, TOP, THREE-QUARTER and original title WALL - ONE SEGMENT. This is a geometry reference correction, not a redesign.

CRITICAL GEOMETRY: define X as wall length, Y as thickness, Z as vertical height. The thin top cap MUST have exactly the same X length as the wall body. Both X end faces of cap and body must be flush, coplanar, with zero cap overhang at either end. The cap may protrude a little along Y thickness, as already shown in the SIDE view; preserve that approved SIDE profile exactly. FRONT stays same width from body to cap. In THREE-QUARTER correct the upper-right end: the cap end plane must align with the exposed right wall end plane. Do not leave the cap extending past that wall end. Any small ledge is along Y only, not X. Make TOP consistent: same length cap/body, slightly thicker cap. Preserve wall height, body width, body thickness, cap height, overall camera angles and scale, material and linework. No new shadows, contact shadows, ambient occlusion or directional lighting. No new objects or callouts. All views represent the identical single wall component.

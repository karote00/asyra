# Window - Consistent Depth Reference

Status: rejected by the user because TOP does not match THREE-QUARTER.
The previous self-review below missed the longitudinal end mismatch. It is
historical evidence, not approval. No model or numeric specification changes.
The user selected the v2 THREE-QUARTER view as the shape authority.

## Correction

- FRONT and THREE-QUARTER retain the four recessed panes, cream wooden frame,
  cross mullions and projecting bottom sill as the appearance target.
- SIDE removes the erroneous full-height projecting secondary panel. The frame
  sits above the sill; only the sill projects toward the front (left on sheet).
- TOP shows the continuous head above a rectangular sill footprint. No added
  glass slab or side ears project beyond the sill.
- Existing dimensions were supplied as guidance: frame depth 0.10 m; glass
  depth 0.008 m centered inside it; sill Y=-0.13..+0.05 m. Dimensions remain
  controlled by the JSON, not measurements from generated pixels.

## Self-review

Inspected the 1536 x 1024 output. V3 failed because TOP introduced stepped
side ears and narrowed the sill front. V4 removes those steps. Checked that
SIDE has one vertical frame silhouette ending at the sill, with aligned rear
edges; TOP has one rectangular outer silhouette; FRONT and THREE-QUARTER
still show glass recessed inside the frame rather than a projecting panel.

This is a shape candidate, not calibrated orthographic or material approval.
Image generation may vary texture and fine linework in retained views; no
pixel-identical preservation is claimed. No extra shadow pass was requested.
Canonical reviewDrawing remains v2 until the user reviews the correction.

## Generation

Built-in image generation, using v2 for v3 and v3 for v4. Both outputs are
retained locally. No Blender model or app changes were made.

### V3 prompt

Use case: precise-object-edit. Edit this architectural window multiview sheet. The lower-right THREE-QUARTER drawing is the authoritative design, and the FRONT drawing is also to be preserved exactly. Change ONLY the upper-right SIDE drawing and lower-left TOP drawing so they depict the SAME geometry as THREE-QUARTER. Preserve sheet composition, English labels, pale cream wood texture and blue glass, title and white background. No shadows, AO, lighting effects, added decorative features or new design.

Geometry: one rectangular wooden frame with a cross mullion and four blue panes recessed WITHIN the depth of the frame. NO projecting full-height secondary panel, NO stacked backing board, NO extra layer beyond the frame. Only the low sill projects forward. Numeric envelope: frame width 1.82m, height 1.28m, depth 0.10m. Frame front at Y=-0.05 and rear Y=+0.05. Glass thickness .008m centered at Y=0 and is hidden inside frame in true top/side exterior projection. Sill width1.86m, depth.18m, thickness.035m, below frame at Z=-.035 to0. Sill spans Y=-.13 to+.05: extends .08m toward FRONT only, flush at rear. Sill extends .02m at each left/right width end.

SIDE: TRUE orthographic side elevation, no perspective: a single vertical slim rectangular frame body .10m deep, sitting ON TOP of a thin horizontal sill .18m deep. The sill extends to screen LEFT (front), rear edges aligned at screen RIGHT. Frame terminates at top of sill, never extends below it. No narrow full-height attached slab! Continuous outer outline, no false internal solid vertical line. Label underneath SIDE.

TOP: TRUE orthographic overhead elevation, not a perspective or cross section. One long rear rectangle is the continuous visible upper face of the head/frame .10m deep. Sill footprint extends downward on page toward front by .08m, and extends very slightly to left and right by .02m each. Rear Y edges align. Do not show a large glass panel sticking out, end blocks protruding beyond sill, or a second full-width solid slab above frame. Glass itself is occluded by upper frame, not an extra visible block.

Keep FRONT and THREE-QUARTER exactly as given. This is an editing task, not a redesign. Crisp outline clarity at junctions.

### V4 prompt

Precise edit of attached window review sheet. Change ONLY the lower-left TOP drawing. Preserve FRONT, SIDE, THREE-QUARTER, labels, all other pixels, colours and layout.

The TOP drawing currently wrongly has stepped side ears and a narrower front slab. Correct it as a TRUE ORTHOGRAPHIC TOP PROJECTION:
Outer silhouette must be ONE SIMPLE RECTANGLE with straight left/right sides and NO steps, notches or ears anywhere. That outer rectangle is the rectangular sill.
Within it, draw the visible top of the wooden window head as a second rectangle occupying the rear/top 0.10/0.18 (about 56%) of total depth. Its rear edge shares the outer rectangle's top/back edge. Its left and right endpoints are each inset by only 0.02/1.86 of the overall width (about6px on this drawing), because sill is1.86m wide while head/frame1.82m wide. Its straight front horizontal edge separates the back head face from the exposed forward sill. The forward sill is the full outer width, never narrower. All material pale cream wood, matching sheet. No glass pane visible in TOP because the head occludes it. No floating panel, no extra slab. Preserve existing approximate TOP overall size and position. No shadows. Only fix TOP contour/linework.

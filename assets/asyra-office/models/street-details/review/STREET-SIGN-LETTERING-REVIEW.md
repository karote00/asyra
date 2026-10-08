# Street Sign - Original Lettering Restoration

Date: 2026-10-08. Status: v6 reference approved by the user; final document review complete. No commit or push. Earlier sections record superseded review stages.

## Scope and authority

The user rejected the invented thin polygonal lettering and confirmed that the
original reference owns appearance. V4 changes only the lettering on the v3
numeric diagram and its documentation. The original PNG is unchanged. Existing
part sizes, positions, projection cameras, contour drawing and seven appearance
regions remain unchanged. The former glyph polylines have been removed, not
retained as an alternate authority.

Current handoff: [one complete annotated v6 sheet](01-street-sign-v6.png).
Original comparison: [v1](01-street-sign-v1.png).
Authoring source: [numeric diagram generator](draw-street-sign-projections.py).
Source crop bounds, checksum, alpha extraction and physical mapping are recorded
in the parent JSON. No third-party font or package was added. The final sheet is
rendered from the existing code-native diagram using original-reference masks.

## Review and iteration

1. Derived each word's alpha from the original FRONT lettering. Reused that same
   mask for both FRONT and THREE-QUARTER so the letter shapes cannot drift across
   viewpoints. The original board shading and background are excluded.
2. Reviewed the initial full 3072 x 2048 render. Glyph identity and spacing were
   restored, but magnified edge sampling was soft.
3. Tightened edge coverage around the unchanged alpha=0.5 contour. Reviewed the
   [enlarged internal comparison](street-sign-lettering-detail-review.png): original
   letter shapes, filled stroke weight, word spacing and case are retained;
   the unwanted thin polyline style is absent. The enlargement exposes the
   original raster's limited resolution; no exact font recovery is claimed.
4. Compared saved v4 and v3 pixels: zero changed pixels outside the two FRONT
   board faces and two THREE-QUARTER front board faces. RIGHT, BACK, TOP, all
   silhouette geometry, dimensions, labels and page layout are unchanged.
5. Reviewed document authority: original lettering is the source, invented glyphs
   are removed, and future per-region colour/material replacement remains required.

This approves the bounded lettering correction for user review, not a Blender
model, runtime implementation, or a claim that every feature of the original
illustration is reproduced pixel-for-pixel. Only the final full sheet and
original full reference are handoff images; the detail comparison is internal
evidence, not a third proposed design.

## V5 - Attached dimension annotations

The v4 handoff omitted the requested dimension lines and leaders. V5 adds them
to the same five-view sheet. Part geometry, cameras, original lettering masks,
default appearance and the unannotated THREE-QUARTER view are unchanged.

- FRONT: overall height 1650, exposed board length 480, board height 180,
  clear gap 50, post width 45 and collar height 16.
- RIGHT: board centre elevations 1390 and 1160 from the ground datum,
  and a leader identifying the 18-thick board end face.
- TOP: overall width 532.5, finial diameter 60, collar width 52 and square
  footprint 52 x 52, plus a leader identifying its exposed corners.

All lengths are in millimetres. Dimension endpoints are projected from the
existing JSON part sizes and centres; the new annotation layer does not change
those values. Blue ink identifies documentation marks, not model geometry,
colour, material or baked lighting. The 480 dimension is exposed length;
construction length remains 482 with 2 embedded in the post.

Self-review covers full-sheet legibility, endpoint ownership, the 50 clear-gap
extension lines, the 18-thickness leader, and TOP finial/collar separation.
At the v5 checkpoint, the annotated drawing awaited user acceptance. No model or app was produced.

## V6 - Square post visibility and preserved defaults

The user could not distinguish the post shape in the dark v5 sheet. The JSON
already defines a 45 x 45 x 1582 mm box. V6 preserves that geometry and all
attached dimensions, while using the review-only palette in `referenceReview.display`.
Its THREE-QUARTER view labels the straight edge between two planar post faces.
The header identifies the square post and explicitly records unchanged defaults:
metal #383A38 and lettering #EEE9DD. The original lettering masks are unchanged;
only their review tint changes for contrast on the light boards.

Self-review at native 3072 x 2048 resolution confirms visible flat-face contrast,
a straight shared shaft edge, readable original lettering, preserved dimension
annotations and a legible header. The TOP circle depicts the finial; it does not
specify a circular shaft. The collar and finial obscure the shaft's top face.
Geometry, material defaults and the unchanged bollard were checked against the
pre-edit specification. The user subsequently approved v6; no commit or push.

## Final document consistency review

The user accepted v6 and requested a final document review. The approved PNG
was not edited or regenerated. Its SHA-256 is
`5080298efc7290613242e75c1e01a23fc906a8b4a9866bc6a339e15c926b0358`.

Recomputed from the five JSON primitives: overall bounds 532.5 x 60 x 1650 mm,
480 mm exposed board length, 2 mm board embed, 50 mm board gap, 13.5 mm RIGHT
margin, 2 mm shaft/collar overlap and 6 mm finial/collar overlap. Projection
record geometry and orthonormal view bases match the specification. Original
lettering-source hash and current document links resolve correctly. Metal and
lettering defaults remain #383A38 and #EEE9DD; v6 face colours are review-only.

Corrected outdated approval wording and the misleading term "letter paths".
Clarified the 1582 mm construction shaft versus 1580 mm exposed shaft below
the collar, and that TOP's circle depicts the finial above the hidden square
shaft. Current links identify v6; earlier review stages remain historical.
This closes the reference/document consistency review only. Model construction,
mesh validation and runtime integration remain separate future work.

# Partition - Flush End Correction

Reference image: none (obsolete revision removed). This record describes a past review; use the current gallery for the accepted design.

Status: historical intermediate drawing, superseded by approved v5. The SIDE
profile required correction; this record is not current geometry approval.

- Source: `03-partition-v2.png`.
- Candidate: `03-partition-v3.png`.
- Tool: built-in image generation, reference-based edit.
- Scope: remove cap overhang at both longitudinal ends while retaining the
  thickness-direction projection visible in SIDE. Preserve plaster appearance
  and the low wall design. No additional reference lighting was requested.
- Self-review: inspected the full sheet and four unretouched 4x crops. FRONT
  left/right outlines and THREE-QUARTER left/right end junctions have continuous
  cap/body boundaries without the previous longitudinal step. The narrow end
  face remains visible. SIDE retains a thickness lip.
- Limits: this remains a generated appearance sheet, not a calibrated
  engineering projection. Numeric and material reconciliation follows user
  shape approval. The existing v2 pointer is retained until approval.

## Inspection crops

Pixel coordinates refer to the 1536 x 1024 candidate, before 4x enlargement.

| Image suffix | Crop bounds (left, top, right, bottom) |
| --- | --- |
| `right-end` | 1300, 570, 1430, 720 |
| `left-end` | 900, 505, 1030, 655 |
| `front-left` | 145, 105, 230, 205 |
| `front-right` | 665, 105, 750, 205 |

Files use the prefix `03-partition-v3-` and suffix `.png`. No retouching was
performed on these inspection crops.

## Edit prompt

Use case: precise-object-edit.
Edit the supplied partition wall multiview sheet. Preserve the original plaster texture, warm cream color, low wide proportions, four views, labels and white background. Correct ONLY the top cap's longitudinal end overhang.

The cap and wall body must be exactly equal in LENGTH X, sharing the same left and right end planes. Cap can be thicker in Y and thus project slightly in front/back thickness directions, as shown in SIDE. Preserve SIDE's thickness lip. Do not make all cap faces flush: only its two longitudinal ends are flush.

FRONT: existing cap extends a few pixels left and right beyond body. Shorten the cap so its left and right boundaries align EXACTLY with the body boundaries: one continuous vertical silhouette each side, zero ledge. No cap end projection, not even 1-2 pixels.
THREE-QUARTER: retain the visible narrow right END FACE with its full width and BOTH vertical boundaries; do not erase that face. The far-right cap edge must align exactly with the far-right body edge: continue the same straight vertical line from the cap top corner down to the wall base. NO outward or inward step at the cap/body joint. Its seam is just a straight diagonal joint line on the same flat end plane. No underside lip visible at this end. Also remove the small left cap extension: align the cap's left longitudinal end with the wall body's left end plane. Keep cap/body thickness relationship intact.
TOP: cap and body have identical length, no end extensions. Preserve thickness excess only.
Keep the cap height, overall dimensions, plaster grain, component shape and style unchanged. No new shading, no cast shadows, no AO, no labels added or removed, no dimensional annotations. The result should clearly show one repeatable partition whose longitudinal ends can join without cap collisions.

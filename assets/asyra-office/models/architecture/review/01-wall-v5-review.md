# Wall - Flush End Correction

Status: shape approved by the user on 2026-10-06. Specification review retains
the existing dimensions and explicitly defines flush X ends and Y-only cap
overhang. No reference shadows have been added; no model approval is claimed.

The user rejected v3 because the cap still protruded at the longitudinal end.
The first retry (v4) incorrectly erased the visible wall end face and was rejected
during inspection. V5 preserves the end face and aligns its cap and body edges.

- Edit input: `01-wall-v3.png`.
- Approved drawing: `01-wall-v5.png`.
- Inspection detail: `01-wall-v5-end-detail.png`, cropped from the candidate at
  x=1390, y=150, width=120, height=150 and enlarged six times without retouching.
- Visual check: the cap/body joint meets a continuous rightmost vertical edge;
  the narrow end face remains visible. SIDE retains the thickness-direction lip.
- Tool: built-in image generation. The crop uses sips for inspection only.
- Specification follow-up: `../architecture-model-spec.json` and
  `../GEOMETRY-SUPPLEMENT.md` now identify v5 and the unchanged numeric bounds.
  Future model validation remains separate.

## Edit prompt

Use case: precise-object-edit.
Edit the supplied multiview wall drawing with an extremely localized correction ONLY. Return the same full sheet.
Keep the visible narrow RIGHT END FACE in the THREE-QUARTER view, including its approximately 30-pixel width and BOTH vertical boundaries. Never erase that end face; this is a solid thick wall, not a flat plane. Preserve the SIDE view exactly: its cap projects slightly in thickness.

At the THREE-QUARTER view top-right, correct only the tiny cap end mismatch. In this 1536x1024 input, the cap's far-right upper/end edge is around x1464, whereas the wall body's far-right vertical edge is around x1462. Move the cap end edge into precise alignment with the wall end edge (approximately x1462). Make that existing rightmost wall line continue uninterrupted up through the cap, zero step at cap bottom. Also align cap front/end corner around x1433 to the body corner around x1432. KEEP the diagonal cap/body seam across the narrow visible end face between these two boundaries. This seam is a joint drawn ON the same plane, not a projecting ledge.
Do NOT collapse the 30px-wide end face. Preserve its full width, the bottom diagonal end edge, the existing side-face material and all existing wall proportions. The correction is only a few pixels at the top, NOT a new camera angle or re-render of the object.
Longitudinal cap ends must be coplanar with body ends. Thickness-direction projection in SIDE stays. All four views, labels, title, white background and cream texture stay unchanged. No shadows, no AO, no new details.

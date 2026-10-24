# Partition - Orthographic Side Correction

Status: drawing approved by the user for commit on 2026-10-06. Numeric dimensions are unchanged; no model approval.

## Source and geometry

`draw_partition_side.py` reads `partition-segment` from
`../architecture-model-spec.json`. It replaces only the SIDE region of
`03-partition-v3.png` with a true +X orthographic Y/Z profile.

- Body: 2000 x 140 x 1290 mm.
- Cap: 2000 x 170 x 60 mm, centered over the body.
- Overall height: 1350 mm.
- Thickness bounds: body Y = -70..70 mm; cap Y = -85..85 mm.
- Overhang: 15 mm on each thickness face; zero at either X end.
- Cap bottom and body top meet at Z = 1290 mm.
- Prescribed upper-edge bevel: inward 4 mm radius, two segments.

## Evidence and review

- `03-partition-v5.png`: 1536 x 1024 sheet.
- `03-partition-v5-side-detail.png`: 840 x 570 top-junction detail at 3 px/mm.
- `03-partition-v5-side.json`: numeric projection bounds and replacement region.
- Image comparison confirms every pixel outside the SIDE replacement region
  (1090, 90, 1240, 490) remains identical to v3.
- Numeric checks confirm equal 15 mm lips, flush X ends, and touching Z bounds.
- Visual review inspected the full sheet and enlarged junction: both lips and
  the cap/body boundary are distinct; SIDE has no perspective tilt.

Plaster swatches are cropped from v3 and fitted without aspect distortion.
The enlarged diagram illustrates geometry; its magnified texture is not a
production material or a material-detail approval. Outlines and dimension marks
are drawing annotations, not geometry or baked lighting. No shadow pass added.

This correction does not approve unchanged views as measured orthographic
projections, and does not approve any Blender model.

## Document review - 2026-10-06

Reconciled the canonical drawing path, approval status, asset catalogue, overview,
and review index. The geometry supplement now states exact component bounds,
shared X end planes, symmetric Y lips, cap/body contact and the existing bevel.
Recomputed sizes and bounds from JSON: body 2000 x 140 x 1290 mm, cap
2000 x 170 x 60 mm, overall 2000 x 170 x 1350 mm. Material assignments remain
plaster and cream-cap; no drawing outlines or shadows become asset materials.
Canonical dimensions and material recipes were not changed.

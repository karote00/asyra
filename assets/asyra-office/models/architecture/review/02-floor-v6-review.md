# Floor Plank - Dimension-Driven Drawing

Status: historical geometric evidence; the user rejected the regular wood grain.
V7 preserves these projection coordinates while replacing the material. The
current authoring script now emits v7; this record describes the saved v6 files.
The user authorized programmatic drawing on 2026-10-06 after generated sheets
failed to preserve the dimensions and knot-free grain. V5 remains failed evidence.

## Scope

This is a drawing-only authoring artifact, not an app renderer or Blender model.
The generator reads the existing `floor-plank` module from
[architecture-model-spec.json](../architecture-model-spec.json). The module ID,
dimensions, materials, and production surface specification remain unchanged.
Internal drawing identifiers belong only to this local authoring script.

- [Review image](02-floor-v6.png): 2400 x 1240 pixels.
- [Editable projection sheet](02-floor-v6.svg): vector boundaries with embedded
  intrinsic-colour face textures; contains no external dependencies.
- [Projection data](02-floor-v6.json): physical dimensions, scale and coordinates.
- [Authoring script](draw_floor_sheet.py): uses the existing Pillow and NumPy
  installations. No new dependency was installed.
- [Grain detail](02-floor-v6-grain-detail.png): unretouched 3x crop.
- [Short-end detail](02-floor-v6-side-detail.png): unretouched 6x crop.

Run `python3 assets/asyra-office/models/architecture/review/draw_floor_sheet.py`
from the worktree. The font path may be supplied with `DRAWING_FONT_PATH`.

## Geometry review

All views use 900 pixels per metre. FRONT, SIDE and TOP are axis-aligned
orthographic projections. The oblique view uses the same box dimensions and
scale, with an orthographic camera at azimuth -60 degrees and elevation 35 degrees.
Its three visible faces share physical vertices; it is not independently sketched.

| View | Physical extent (mm) | Vector extent (px) | Ratio |
| --- | --- | --- | --- |
| FRONT | 1200 x 25 | 1080 x 22.5 | 48:1 |
| SIDE | 180 x 25 | 162 x 22.5 | 7.2:1 |
| TOP | 1200 x 180 | 1080 x 162 | 6.6666667:1 |

The ratio checks use geometric coordinates, not thresholded raster interiors.
Raster outlines and antialiasing may span additional pixels. No dimensions were
changed to accommodate earlier generated images.

This sheet depicts the outer envelope. The specified 1 mm inward bevel with two
segments is annotated, not resolved as individual bevel facets. Do not infer a
zero-radius production edge from the envelope drawing. This limitation must stay
visible during review; the drawing does not certify a finished model.

## Material and visual review

The Plank formula in [surface recipes](../SURFACE-RECIPES.md#plank) is evaluated
in physical face coordinates. TOP and the long sides use the same lengthwise
grain rule; both short ends use uniform oak. The phase varies linearly across
the grain with a small continuous sinusoidal offset along its length, so there
are no closed eye or knot contours. No shadow, AO, lighting gradient or highlight
is applied to any face.

The final whole sheet was inspected for layout and face connectivity. Enlarged
TOP and SIDE crops were inspected for residual knots and short-end grain. All
four view panels are separate and readable. Numeric extents were checked against
the JSON source, and the naming gate passed before and after authoring.

Shape approval remains with the user. Reference lighting and any further
specification reconciliation follow that approval. No commit or model admission
is authorized by this self-review record.

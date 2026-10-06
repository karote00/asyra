# Stair Baluster - Matched Top Detail Review

Date: 2026-10-06. Status: approved by the user; local commit authorized.
Scope: repair the inset-to-main-view correspondence and its documentation only.

## Correction

The v3 inset was independently redrawn and did not preserve the main
THREE-QUARTER projection. Four corners and correct height labels alone were
insufficient acceptance criteria. The v3 candidate is rejected.

Following the user's approval of direct cropping and enlargement, v4 replaces
only the inset interior with a direct source crop and separate text annotations.
No image generation, geometric redrawing, sharpening or invented detail is used
for v4. Python/Pillow performs only the crop, uniform resize and page composition.

## Reproduction coordinates

All coordinates are pixels, origin at upper left. Crop bounds are half-open.

- Source: `01-stair-baluster-v3.png`, 1536 x 1024.
- Source THREE-QUARTER region: (1078, 179)-(1168, 292), 90 x 113.
- Resize: exactly 3x on both axes using nearest-neighbour sampling, 270 x 339.
- Paste top-left: (1226, 330); destination bounds (1226, 330)-(1496, 669).
- Replacement rectangle: (1201, 292)-(1521, 833).
- Output: `01-stair-baluster-v4.png`, 1536 x 1024.
- Detail export: output crop (1196, 248)-(1526, 838), 330 x 590.

Annotations sit below the pasted crop, not on its edges: low edge Z=0.89 m,
high edge Z=0.91 m, centre Z=0.90 m. The two height pairs and face centre remain
defined by the geometry supplement. No new corner assignments are inferred
from enlarged pixels.

## Review evidence

- Exact pixel equality between the pasted region and the source crop enlarged
  3x confirms that all four corners and edges are the same projection.
- Every pixel outside the replacement rectangle is unchanged from v3,
  including the complete THREE-QUARTER and all orthographic views.
- The full output and separate inset were visually inspected at their native
  dimensions. The annotations are readable and outside the geometric crop.
- The numeric JSON remains byte-for-byte unchanged; this correction does not
  change dimensions, slope, placement or the replaceable appearance contract.

Nearest-neighbour enlargement exposes the existing raster edges; it does not
add source resolution. These checks establish exact main-view/inset identity,
not calibrated reconstruction accuracy or approval of a 3D model. No model,
Blender execution or app modification is included.

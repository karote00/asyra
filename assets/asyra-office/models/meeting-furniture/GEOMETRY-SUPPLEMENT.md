# Geometry Supplement

## Shared construction

Metres, +Z up, -Y front, +X right. See the [numeric specification](meeting-furniture-model-spec.json) for exact part bounds. Boxes have flat closed faces and no bevel. The tabletop is the only part with rounded plan corners; no subdivision. Structural pieces remain separate closed solids within one placeable assembly.

The dimensions and hidden details are authored decisions. Do not infer them from pixels or add image contour strokes as geometry.

## Wooden meeting table

The [meeting table contract](MEETING-TABLE-SPEC.md) completes the exact contour,
part placement, sixteen flush contacts, sizing, appearance regions and LOD rules.
Every existing part dimension remains unchanged. Overall size is 1.400 x 0.750
x 0.740 m. The top spans Z=0.700 to 0.740 with 25 mm XY corner radii and no vertical
rounding. Four straight square legs and four apron rails remain sharp boxes.

All legs/rails end at Z=.700; rail bottoms are at .620. Rail ends contact the
inner leg faces, not additional corner blocks. These are exact positive-area
flush interfaces, not required volume overlaps. Keep nine closed components;
LOD changes only corner sampling. The original drawing remains unchanged.
No model or rendered likeness has been verified.

## Blank whiteboard

Origin is the frame center on its rear mounting plane Y=0. Frame bounds: X +/-0.450, Z +/-0.300, Y=-0.025 to 0. The frame is a rectangular ring with square corners, outer width/height 0.900/0.600 and aperture 0.850/0.550. It has a constant 0.025 border.

The writing panel fills the aperture, from Y=-0.021 to -0.017. Its front is recessed 0.004 relative to the frame front. A wooden backing fills the same aperture from Y=-0.005 to 0, leaving empty space behind the panel. Frame, panel, and backing are separately closed solids meeting at shared boundaries without extra seams.

The marker tray is a plain flat box: X +/-0.300, Y=-0.060 to 0, Z=-0.312 to -0.300. Its top touches the lower frame edge. It has no front lip or storage groove.

Total bounds including tray: width 0.900, height 0.612, depth 0.060. The frame alone is 0.600 high. No wall mounts, screws, marker, eraser, magnet, writing, stand, or room is included. Writing and interaction belong to the app later.

## Views and future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. The oblique view is illustrative; occluded legs do not alter the four-leg count.

Future modeling review checks dimensions within 0.001, exact part counts, planar table contact, underside rails and joints, recessed board panel, flat backing, and tray projection. Inspect front, side, back, top, underside and close joints. No model verification or exact source reconstruction is claimed.

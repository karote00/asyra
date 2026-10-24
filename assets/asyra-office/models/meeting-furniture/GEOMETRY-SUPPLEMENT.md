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

The [whiteboard construction contract](WHITEBOARD-SPEC.md) retains all existing
part dimensions and resolves the frame as four 45-degree mitered prisms. Together
they occupy the original rectangular ring. Frame XYZ size: 0.900 x 0.025 x 0.600 m
(width x depth x height), with an .850 x .550 m XZ aperture. A separate panel, backing and flat tray give seven closed
components with thirteen exact flush contacts. `parts.frame` describes the
envelope and member depth; it is not an eighth mesh. No bevel, gap or extra connector.

The panel front recess is .004 m; the concealed panel/backing cavity is .012 m.
Total XYZ extents are .900 x .060 x .612 m about the frame's rear mounting origin.
The tray projects .035 m forward beyond the frame front; its total depth is .060 m.
The current v2 RIGHT inset is generated from these dimensions: the tray projects
screen-left and its top meets the frame bottom. Original v1 is historical input;
its former reversed/elevated tray is not a construction reference.
See the contract for polygons, topology, defaults, scaling and LOD counts.

## Views and future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. The oblique view is illustrative; occluded legs do not alter the four-leg count.

Future modeling review checks dimensions within 0.001, exact part counts, planar table contact, underside rails and joints, recessed board panel, flat backing, and tray projection. Inspect front, side, back, top, underside and close joints. No model verification or exact source reconstruction is claimed.

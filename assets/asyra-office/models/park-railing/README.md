# Asyra Office - Group 4M - Park Railing

Status: the original reference batch was approved for commit. The 2026-10-09 post v3 revision is approved by the user for commit. Drawings and specifications only; no model verification.

| Independently placeable unit | Default X x Y x Z (m) | Sheet |
| --- | --- | --- |
| One railing post with collar and spherical finial | 0.08 x 0.08 x 0.72 | [Post - review colours](review/01-railing-post-v3.png) |
| One infill panel with two rails and five pickets | 0.90 x 0.025 x 0.55 | [Panel](review/02-railing-panel-v1.png) |

The dark railing in the lower-right park of the approved office reference supplies the colour family, restrained silhouette, horizontal rails and rounded post tops. Each sheet shows front, right, back, top and oblique views. Panels exclude end posts; posts exclude panels. No pavement, masonry, plants or preset fence arrangement is included.

## Reconstruction handoff

- [Geometry supplement](GEOMETRY-SUPPLEMENT.md)
- [Numeric specification](park-railing-model-spec.json)
- [Surface recipes](SURFACE-RECIPES.md)
- [Review gallery](review/README.md)
- [Actual prompts](review/PROMPTS.md)
- [Original reference](../architecture/review/approved-office-reference.jpg)

Exact dimensions, square sections, five-picket count, underside and joints are authored completions of the small, partly obscured reference. They are not measured facts recovered from it. Original image-generated sheets are illustrative, not calibrated projections. The current post v3 sheet is drawn from the JSON with one common orthographic scale; the panel remains illustrative. JSON and the geometry supplement resolve dimensions and hidden construction. Post v3 is approved by the user for commit.

No models, animation, placement logic, export or app implementation is included. The app owns arrangement and lighting. No baked shadows, AO, specular highlights or lighting gradients belong in the materials. The user authorized committing this reference handoff.

## Post review revision - 2026-10-09

The default appearance remains charcoal-painted metal, sRGB `#383A38`, metallic
0.15 and roughness 0.80. The light colours on the current post sheet identify
parts and face orientation for review only; they do not replace the default.
See [surface defaults and overrides](SURFACE-RECIPES.md).

Retain the [original post sheet](review/01-railing-post-v1.png) as the silhouette
source. Its front-view shaft is about 0.82 of the collar width; the previous
45/80 mm numeric ratio was only 0.5625. The revised default shaft is 65 mm
square and the collar is 80 mm square by 40 mm high, matching the original's
approximately half-width collar thickness. These are authored numeric choices
guided by the illustration, not exact physical measurements recovered from it.
Keep the 70 mm sphere diameter established by the top view and the 720 mm
overall height. The geometry supplement gives all resulting positions and joins.

Explicit overall dimensions and appearance replacements follow the
[shared contract](../README.md#overall-size-and-appearance---2026-10-09).
The post is one unit composed of a square shaft, square collar and sphere;
nonuniform sizing transforms all three together, including overlaps. Reference
assembly coordinates are default examples and must be recalculated after sizing.
The panel drawing and its part dimensions are not revised in this post review.

## Dimension-driven post reference

The user authorized programmatic reference drawing after image-generation
corrections failed the cross-view proportion check. The current single sheet
retains the five-view layout, palette and part labels. All views are drawn at
2000 px/m on a 3072 x 2048 PNG; the oblique view uses camera direction
(1,-1,0.8). Its foreshortening is intentional, not another unit size.

- [Drawing source](review/draw-railing-post-projections.py)
- [Projection and saved-image measurements](review/post-projection-measurements.json)

The saved PNG measures 140 px sphere diameter and 160 px collar width in all
four principal views. The elevations measure 1440 px total height. These give
the required 0.875 diameter ratio and 9 height/width ratio. Rebuild and review
instructions are in the review gallery. This is drawing validation only; no
Blender operation, mesh export or app implementation was performed.

## Agreed future post production route

Use direct programmatic geometry for this post's two boxes and sphere, following
the [shared production rule](../README.md#geometry-production-routes---agreed-2026-10-09).
Keep the specified joins and final surface requirements; overlapping display
primitives alone do not satisfy the specified union. This route is distinct
from the existing PNG projection script. The production generator and its
geometry, appearance and LOD validation belong to the later implementation stage.

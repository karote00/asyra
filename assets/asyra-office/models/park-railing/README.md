# Asyra Office - Group 4M - Park Railing

Status: the post v3 revision is approved by the user for commit. The panel v2 revision is approved by the user for commit. Drawings and specifications only; no model verification.

| Independently placeable unit | Default X x Y x Z (m) | Sheet |
| --- | --- | --- |
| One railing post with collar and spherical finial | 0.08 x 0.08 x 0.72 | [Post - review colours](review/01-railing-post-v3.png) |
| One infill panel with two rails and five pickets | 0.90 x 0.025 x 0.55 | [Panel](review/02-railing-panel-v2.png) |

The dark railing in the lower-right park of the approved office reference supplies the colour family, restrained silhouette, horizontal rails and rounded post tops. Each sheet shows front, right, back, top and oblique views. Panels exclude end posts; posts exclude panels. No pavement, masonry, plants or preset fence arrangement is included.

## Reconstruction handoff

- [Geometry supplement](GEOMETRY-SUPPLEMENT.md)
- [Numeric specification](park-railing-model-spec.json)
- [Surface recipes](SURFACE-RECIPES.md)
- [Review gallery](review/README.md)
- [Actual prompts](review/PROMPTS.md)
- [Original reference](../architecture/review/approved-office-reference.jpg)

Exact dimensions, square sections, five-picket count, underside and joints are authored completions of the small, partly obscured reference. They are not measured facts recovered from it. Original image-generated sheets are illustrative, not calibrated projections. Current post v3 and panel v2 sheets are drawn from the JSON with a common orthographic scale within each sheet. JSON and the geometry supplement resolve dimensions and hidden construction. Post v3 is approved by the user; panel v2 is approved by the user for commit.

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
The post review did not revise panel part dimensions. The subsequent panel
drawing correction below also preserves those dimensions.

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

## Panel default and document review - 2026-10-09

The panel defaults to `charcoal-painted-metal`, base sRGB `#383A38`, metallic
0.15, roughness 0.80, opacity 1 and emission 0. The existing top-level JSON
material applies to both units; the panel does not introduce a second material
definition. All two rails and five pickets share one replaceable appearance
region, including ends and hidden faces. Use the shared XYZ sizing and
appearance contract; default dimensions are not fixed instance dimensions.

The default 900 x 25 x 550 mm envelope and all seven part coordinates were
checked. See the [panel geometry](GEOMETRY-SUPPLEMENT.md#panel) for dimensions,
spacing, intersections and projected visibility. As a simple assembly of
boxes, its future production route is direct programmatic geometry with the
specified joined surface. No runtime generator is implemented by this review.

The [original panel sheet](review/02-railing-panel-v1.png) remains available,
but failed dimensional and top-view consistency checks. Its front outline is
approximately 631 x 279 px (ratio 2.262), rather than the specified 900/550
(ratio 1.636). Its top view showed pickets wider than the rails, contrary to
the 18/25 mm depth relationship. V2 corrects these projections without changing
the numeric dimensions. The original batch approval does not override those
discrepancies.

## Dimension-driven panel correction

The current panel v2 is a single five-view sheet drawn at 1100 px/m from the
same seven specified boxes. Light review colours identify parts and faces;
all runtime surfaces still default to charcoal #383A38. The sheet labels the
default 900 x 25 x 550 mm envelope and 3.5 mm depth setbacks.

- [Drawing source](review/draw-railing-panel-projections.py)
- [Projection and saved-image measurements](review/panel-projection-measurements.json)

Saved-image front/back envelopes are 990 x 605 px, exactly the specified aspect
ratio. TOP is 990 x 28 px including pixel rounding of the 27.5 px rail depth;
all five 18 mm caps remain inside it. The original image is preserved. This
passes scoped reference review and is approved by the user for commit; no Blender operation,
runtime generator, model export or model acceptance is included.

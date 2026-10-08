# Asyra Office - Group 2B - Garden Masonry

Status: approved for commit by the user. Drawings and specifications only; no model verification.

| Independently placeable unit | Default X x Y x Z (m) | Sheet |
| --- | --- | --- |
| One warm grey masonry block | 0.30 x 0.18 x 0.14 | [Block](review/01-masonry-block-v1.png) |
| One cream wall coping slab | 0.32 x 0.22 x 0.055 | [Coping](review/02-wall-coping-v1.png) |

Appearance follows the low wall beside the water at the lower-right park in the [approved reference](../architecture/review/approved-office-reference.jpg). The block is one stone from the vertical wall face; the coping is one cap stone from its top. These are separate from the existing street pavers and curb blocks.

Each view contains one unit. No wall assembly, mortar, soil, plants, pavement, railing or water is included. Users can choose counts and arrangement later.

## Reconstruction handoff

- [Geometry supplement](GEOMETRY-SUPPLEMENT.md)
- [Numeric specification](garden-masonry-model-spec.json)
- [Surface recipes](SURFACE-RECIPES.md)
- [Review gallery](review/README.md)
- [Actual prompts](review/PROMPTS.md)

The source establishes pale masonry, softened edges and the wall/cap relationship. Exact dimensions, hidden backs and bottoms, chamfer sizes and repeatable stone flecks are authored completions. Images are illustrative rather than calibrated projections. Numerical documents determine construction; appearance remains approved for this reference handoff.

No models, Blender operations, app placement logic, animation or exports are included. No exact reconstruction or model verification is claimed. The user authorized committing this reference handoff.

## Shared geometry preset decision - 2026-10-09

Retain `masonry-block` as a selectable preset and preserve its reference sheet.
It shares the convex chamfered-box geometry family with `red-clay-paver`; it does
not require a separate future modeling algorithm. Its default 300 x 180 x 140 mm
size, 6 mm chamfer and warm grey stone recipe remain useful defaults. The clay
preset's 1 mm chamfer cannot become this default merely through axis scaling.
See the [family comparison](../ASSET-TYPES.md#shared-geometry-families-and-selectable-presets).

Apply the [shared sizing and appearance contract](../README.md#overall-size-and-appearance---2026-10-09)
to explicit instance sizes. All dimensions and fit examples in this batch are
defaults. Material replacement is common behavior, not another model. This
updates documentation only; retain drawings and identifiers, and do not count
this as an additional generator or completed model.

## Coping slab preset review - 2026-10-09

Retain `wall-coping-slab` as another selectable preset of the same convex
chamfered-box family. Its default size is 320 x 220 x 55 mm, with a 3 mm
equal-offset planar chamfer and the cream limestone default recipe. It needs
no separate modeling algorithm. The existing sheet remains a shape reference;
its printed dimensions describe the default, not fixed instance dimensions.

The geometry supplement and numeric specification agree on the bottom-centred
origin, flat top and underside, and absence of grooves or additional parts.
Explicit overall sizes and appearance overrides use the shared contract above;
the chamfers scale with the complete unit. This is a document review, not model
verification or a claim that the illustrative views are calibrated drawings.

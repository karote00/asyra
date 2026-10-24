# Group 2C - Red Clay Paver

Status: user-approved reference sheets. Drawings and reconstruction specifications only.

One independently placeable red clay paving brick. This supplementary design addresses the requested alternative to asphalt. The original office image does not establish a specific red-brick style, so its color and dimensions are authored design choices.

## Handoff

- [Review gallery](review/README.md)
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md)
- [Surface recipes](SURFACE-RECIPES.md)
- [Numeric specification](clay-paving-model-spec.json)
- [Actual prompt](review/PROMPTS.md)

Road markings remain separate [street components](../street/README.md). This unit includes no paint, mortar, sand, ground or neighboring brick. No models, Blender verification or app implementation are included.

## Shared geometry preset - 2026-10-09

`red-clay-paver` and `masonry-block` share the convex chamfered-box geometry
family. Retain both presets and their references: this preset defaults to
200 x 100 x 60 mm with a 1 mm chamfer and matte terracotta #B86F53; the stone
preset defaults to 300 x 180 x 140 mm with a 6 mm chamfer and a stone recipe.
No duplicate future modeling algorithm is needed. See the [family comparison](../ASSET-TYPES.md#shared-geometry-families-and-selectable-presets).

The [shared sizing and appearance contract](../README.md#overall-size-and-appearance---2026-10-09)
owns configurable dimensions, tint and material replacement. Numeric dimensions
and edge-to-edge translations here describe the default unit. After resizing,
use final bounding dimensions for placement. Keep the single-unit boundary;
no array, mortar or receiving surface is included.

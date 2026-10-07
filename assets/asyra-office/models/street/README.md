# Asyra Office - Street Components - Group 2

2026-10-04: all seven appearance categories and four transparent single-unit corrections are approved. Specification version 2.2.0; the 2026-10-07 path-marking decision supersedes fixed road-line asset production. Each placeable unit is independent; paint is completely separate from receiving road surfaces. This delivery contains drawings and reconstruction documents, not built or verified 3D models.

## Asset classification

Follow the [shared asset types](../ASSET-TYPES.md). The asphalt tile is a model
component; asphalt is its independent default material recipe. Straight edge
lines, curved edge lines and short dashes are presets of one **path-marking
decal family**, using shared paint and a path-generated contour. Crosswalk
stripes remain rectangular decal components. Neither contains receiving
geometry or physical thickness. See [path markings](PATH-MARKINGS.md).

This classification preserves the existing identifiers, parameters and approval
states; it does not create a runtime decal system or finish the current review.

## Modeling inputs

1. [Reconstruction specification and unit table](STREET-SUPPLEMENT.md): read order, origins, structure, and acceptance criteria.
2. [Exact parameters](street-model-spec.json): geometry/material defaults for the existing eleven unit/preset entries across seven categories; three entries are path-marking presets.
3. [Surface and leaf recipes](SURFACE-RECIPES.md): repeatable textures, leaf placement, and transparency.
4. [Drawing index and approval status](review/README.md): approved appearances, transparent units, and original reference.

A crosswalk unit is one stripe; a road line is one segment; a tree is one tree; a light is one light. Pavers and curb blocks are also individual units. The app owns arrangement, count, spacing, ground material, and lighting. No paint unit contains asphalt backing; transparent wear reveals any receiving ground.

Dimensions are production decisions, not image measurements. Generated view labels and perspective do not override geometry specifications. No model comparison has been performed, so no 100% pixel or unknown-model reconstruction is claimed.

## Historical material

`orthoviews/`, `street-stage-02-review.png`, v1 images, and v3 images with road backing remain historical records only. Old road corners, fixed crosswalk arrays, spherical canopies, side-arm lanterns, and fixed pavement assemblies are no longer production specifications. Do not build new models from old sheets.

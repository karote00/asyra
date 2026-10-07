# Asyra Office - Street Components - Group 2

2026-10-04: all seven appearance categories and four transparent single-unit corrections are approved. Specification version 2.1.0. Each placeable unit is independent; paint is completely separate from receiving road surfaces. This delivery contains drawings and reconstruction documents, not built or verified 3D models.

## Modeling inputs

1. [Reconstruction specification and unit table](STREET-SUPPLEMENT.md): read order, origins, structure, and acceptance criteria.
2. [Exact parameters](street-model-spec.json): geometry and materials for eleven units across seven categories.
3. [Surface and leaf recipes](SURFACE-RECIPES.md): repeatable textures, leaf placement, and transparency.
4. [Drawing index and approval status](review/README.md): approved appearances, transparent units, and original reference.

A crosswalk unit is one stripe; a road line is one segment; a tree is one tree; a light is one light. Pavers and curb blocks are also individual units. The app owns arrangement, count, spacing, ground material, and lighting. No paint unit contains asphalt backing; transparent wear reveals any receiving ground.

Dimensions are production decisions, not image measurements. Generated view labels and perspective do not override geometry specifications. No model comparison has been performed, so no 100% pixel or unknown-model reconstruction is claimed.

## Historical material

`orthoviews/`, `street-stage-02-review.png`, v1 images, and v3 images with road backing remain historical records only. Old road corners, fixed crosswalk arrays, spherical canopies, side-arm lanterns, and fixed pavement assemblies are no longer production specifications. Do not build new models from old sheets.

## Shared planar curb section - approved 2026-10-07

[Approved section drawing](review/04-curb-shared-section-v1.png) - one shared
160 x 120 mm section, four 8 mm two-segment corner treatments and a bottom-centre
path origin. Straight and curved forms are generated along planar paths;
separate multiview sheets are not required. See [the current contract](PLANAR-CURBS.md).
No runtime generator or model is delivered by these reference documents.

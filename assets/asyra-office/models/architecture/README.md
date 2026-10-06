# Asyra Office - Architectural Components - Design Revision 2

Design status: **Wall v5, floor v7 with its independent material PNG, and partition v5 were approved on 2026-10-06. The other three components retain their 2026-10-04 design approval.**
This delivery contains images and documents, with no Blender, GLB, animation, or app implementation. This group is approved design documentation.

## Reference and units

The central office is the primary reference; neighbouring shops are secondary references for the window only. The entrance door follows the user's close-up: the narrow same-colour left panel and the right main leaf form one complete unit. Do not omit the left panel or replace it with wall.

| Component | One placeable unit | X × Y × Z (m) | Multiview sheet |
| --- | --- | --- | --- |
| Wall | One capped wall segment | 1 × 0.27 × 2.5 | [Wall](review/01-wall-v5.png) |
| Floor | One plank | 1.2 × 0.18 × 0.025 | [Plank](review/02-floor-v7.png) |
| Partition | One capped low wall segment | 2 × 0.17 × 1.35 | [Partition](review/03-partition-v5.png) |
| Stair | One stone step | 1.2 × 0.3 × 0.15 | [Step](review/04-stair-v2.png) |
| Door | Frame, narrow left panel, right leaf, and handle | 1.64 × 0.146 × 2.16 (including handle) | [Complete door](review/05-door-v2.png) |
| Window | One four-pane window with sill | 1.86 × 0.18 × 1.315 (including sill) | [Window](review/06-window-v2.png) |

Each sheet contains front, side, top, and oblique views. The app owns count, arrangement, rotation, joins, wall openings, and lighting. Doors and windows include no wall; planks and steps include no base slab or array. Required frames, caps, and handles remain parts of the same unit.

## Wall revision - 2026-10-06

The approved [v5 drawing](review/01-wall-v5.png) supersedes the wall v2/v3 sheets.
Body and cap both span X=-0.5 to +0.5 m. Their end faces are coplanar; the cap
must not protrude or step back at either end. Existing dimensions are retained:
body 1 x 0.24 x 2.42 m, cap 1 x 0.27 x 0.08 m, overall 1 x 0.27 x 2.5 m.
The cap projects 0.015 m on each Y side only. See the
[geometry contract](GEOMETRY-SUPPLEMENT.md#wall---approved-v5-dimensions-and-joins)
for explicit bounds and acceptance checks.

This is shape approval and specification review, not model approval. Reference
shadows are not required for this simple wall, as confirmed by the user.
Production albedo remains free of baked lighting.

## Floor revision - 2026-10-06

The approved [floor v7 sheet](review/02-floor-v7.png) retains the existing
1.2 x 0.18 x 0.025 m dimensions and 0.001 m inward bevel. Its orthographic
outer-envelope projections are computed from the numeric specification.
The [independent wood PNG](materials/floor-natural-oak-v1.png) restores natural
irregular grain. The [material contract](materials/README.md) defines replaceable
base colour and UV coordinates without changing geometry. The user confirmed
that this simple component does not need reference shadows. The sheet annotates
the bevel rather than rendering its facets; no model validation is claimed.

## Partition revision - 2026-10-06

The approved [partition v5 sheet](review/03-partition-v5.png) retains the authored
2 x 0.17 x 1.35 m overall dimensions. Body thickness is 0.14 m and cap thickness
is 0.17 m: the cap projects 0.015 m on each Y side. Both parts share X=-1 to +1 m
and have flush ends. The corrected SIDE is a numeric orthographic projection;
the other views are appearance references, not calibrated measurements.
See the [geometry contract](GEOMETRY-SUPPLEMENT.md#partition---approved-v5-dimensions-and-joins)
and [review record](review/03-partition-v5-review.md). No reference shadows were
needed to explain this simple profile. This is not approval of a model.

## Inputs for modeling tools

1. [Source references and six-sheet index](review/README.md): appearance sources and their priority.
2. [Geometry supplement](GEOMETRY-SUPPLEMENT.md): origins, backs, recesses, and joins.
3. [Machine-readable specification](architecture-model-spec.json): component sizes, positions, materials, bevels, and bounds.
4. [Surface recipes](SURFACE-RECIPES.md): reproducible solid colours and intrinsic textures without baked shadows or lighting.

The numbers are authored modeling dimensions, not physical measurements from the single image. Generated sheets are not calibrated engineering projections. Resolve appearance conflicts against the original reference and dimensional ambiguity against the numeric specification. Do not copy image shading, outlines, or white backgrounds into materials. Matching a model to the reference still requires comparison after modeling is authorized; complete documentation does not establish 100% reconstruction.

## Historical material

Old overview images, orthoviews, BUILD_SCENE.py, .blend, and glb files are historical drafts, not sources for this revision, and were not updated here. Do not run the old modeling script and present its output as this revision. No models were added or updated in this delivery.

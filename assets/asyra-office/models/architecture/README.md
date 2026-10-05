# Asyra Office - Architectural Components - Design Revision 2

Status: **The user approved committing all six multiview sheets and documents on 2026-10-04; model verification has not been performed.**
This delivery contains images and documents, with no Blender, GLB, animation, or app implementation. This group is approved design documentation.

## Reference and units

The central office is the primary reference; neighbouring shops are secondary references for the window only. The entrance door follows the user's close-up: the narrow same-colour left panel and the right main leaf form one complete unit. Do not omit the left panel or replace it with wall.

| Component | One placeable unit | X × Y × Z (m) | Multiview sheet |
| --- | --- | --- | --- |
| Wall | One capped wall segment | 1 × 0.27 × 2.5 | [Wall](review/01-wall-v2.png) |
| Floor | One plank | 1.2 × 0.18 × 0.025 | [Plank](review/02-floor-v2.png) |
| Partition | One capped low wall segment | 2 × 0.17 × 1.35 | [Partition](review/03-partition-v2.png) |
| Stair | One stone step | 1.2 × 0.3 × 0.15 | [Step](review/04-stair-v2.png) |
| Door | Frame, narrow left panel, right leaf, and handle | 1.64 × 0.146 × 2.16 (including handle) | [Complete door](review/05-door-v2.png) |
| Window | One four-pane window with sill | 1.86 × 0.18 × 1.315 (including sill) | [Window](review/06-window-v2.png) |

Each sheet contains front, side, top, and oblique views. The app owns count, arrangement, rotation, joins, wall openings, and lighting. Doors and windows include no wall; planks and steps include no base slab or array. Required frames, caps, and handles remain parts of the same unit.

## Inputs for modeling tools

1. [Source references and six-sheet index](review/README.md): appearance sources and their priority.
2. [Geometry supplement](GEOMETRY-SUPPLEMENT.md): origins, backs, recesses, and joins.
3. [Machine-readable specification](architecture-model-spec.json): component sizes, positions, materials, bevels, and bounds.
4. [Surface recipes](SURFACE-RECIPES.md): reproducible solid colours and intrinsic textures without baked shadows or lighting.

The numbers are authored modeling dimensions, not physical measurements from the single image. Generated sheets are not calibrated engineering projections. Resolve appearance conflicts against the original reference and dimensional ambiguity against the numeric specification. Do not copy image shading, outlines, or white backgrounds into materials. Matching a model to the reference still requires comparison after modeling is authorized; complete documentation does not establish 100% reconstruction.

## Historical material

Old overview images, orthoviews, BUILD_SCENE.py, .blend, and glb files are historical drafts, not sources for this revision, and were not updated here. Do not run the old modeling script and present its output as this revision. No models were added or updated in this delivery.

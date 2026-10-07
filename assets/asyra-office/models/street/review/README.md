# Asyra Office - Street Drawing Index

2026-10-04: the user approved seven v2 appearance categories and requested documentation. Later instructions override earlier ones: each placeable unit is independent, markings include no asphalt, and lighting belongs to the scene. Four transparent v4 single-unit corrections were also approved on 2026-10-04 and may guide production specifications.

## Solid appearances and historical colours

- [Asphalt](01-asphalt-v2.png): one unmarked surface tile.
- [Road-marking appearance](02-road-markings-v2.png): historical colour reference; approved v4 units take precedence.
- [Crosswalk appearance](03-zebra-crossing-v2.png): historical white-paint reference; approved v4 stripe takes precedence.
- [Pavement and curb appearance](04-pavement-curb-v2.png): laying-style reference; each block remains independent.
- [Round manhole](05-manhole-cover-v2.png): one cover/frame assembly.
- [Street tree](06-street-tree-v2.png): one complete tree.
- [Street lantern](07-street-lantern-v2.png): one complete light.

## Path-marking presets and the rectangular crosswalk decal

- [Straight path preset](02-road-line-single-v4.png)
- [Arc path preset](02-road-curve-single-v4.png)
- [Short path preset](02-road-dash-single-v4.png)
- [One crosswalk stripe](03-crossing-single-v4.png)

The first three images are appearance examples for presets of one shared
[path-marking family](../PATH-MARKINGS.md). They no longer require separate
fixed models or shape-specific paint materials. Keep their existing default
dimensions and origins; generate contours from path and width. The crosswalk
remains one independently placeable rectangular stripe.

These PNGs are not seamless paint textures or calibrated production masks.
Do not stretch them around arbitrary curves or include receiving ground.
No redraw or production texture generation accompanies this classification.


## Production rules

See parent specifications for dimensions, origins, unit counts, and hidden structure. Do not bake cast shadows, AO, reflections, or glow into materials. Transparent wear reveals arbitrary ground rather than grey simulated asphalt. Views are concept drawings, not calibrated projections with verified consistency.

## Sources

- [Original approved scene](approved-office-reference.jpg)
- [Initial generation record](PROMPTS.md)
- [Revision generation record](REVISION-PROMPTS.md)
- [Unit and transparency corrections](UNIT-CORRECTIONS.md)

Created with built-in image_gen. Historical revisions cannot replace the latest single-unit specification.

## Lighting revision - 2026-10-04

The user authorized committing these lighting-only drawing revisions. Prior approval applies to the underlying design. Dimensions and construction specifications are unchanged.

See the [complete lighting review](../../SHADOW-FREE-REVIEW.md) for revised images and the shared surface rule. Do not bake shadows, ambient occlusion, highlights or directional lighting into materials.

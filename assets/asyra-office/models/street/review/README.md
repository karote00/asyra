# Asyra Office - Street Drawing Index

2026-10-04: the user approved seven v2 appearance categories and requested documentation. Later instructions override earlier ones: each placeable unit is independent, markings include no asphalt, and lighting belongs to the scene. Four transparent v4 single-unit corrections were also approved on 2026-10-04 and may guide production specifications.

## Solid appearances and historical colours

- [Asphalt](01-asphalt-v2.png): one unmarked surface tile.
- Road-marking appearance - reference image: none (obsolete image removed): historical colour reference; approved v4 units take precedence.
- Crosswalk appearance - reference image: none (obsolete image removed): historical white-paint reference; approved v4 stripe takes precedence.
- [Pavement layout - annotated assembly reference](04-pavement-layout-v3.png): not a single component; annotation revision approved on 2026-10-07.
- [Paving stone - one independent unit](04-paving-stone-single-v1.png): six-view sheet, 0.60 x 0.30 x 0.05 m; approved on 2026-10-07.
- Original pavement and curb appearance - reference image: none (obsolete image removed): retained approved laying-style evidence; not unit geometry.
- [Straight curb - one independent unit](04-curb-straight-single-v1.png): 0.30 x 0.16 x 0.12 m; specification reviewed on 2026-10-07. Illustrative, not calibrated; see [review limitations](CURB-STRAIGHT-PROMPTS.md#initial-review).
- [Shared curb cross-section](04-curb-shared-section-v1.png) - user-approved on 2026-10-07; schematic, not calibrated. Straight and curved paths are program-generated; separate multiview sheets are not required. See [construction specification](../PLANAR-CURBS.md).
- [Round manhole](05-manhole-cover-v2.png): original reference retained unchanged; magnified review confirms six slots in both upper views. Raised/flat ring topology and cover/frame separation are now user-confirmed; numeric relief dimensions are now specified, with image-derived estimates distinguished from authored height/edge decisions. See [review findings](05-manhole-review.md).
- [Manhole - dimensioned reference sheet](05-manhole-dimensioned-v2.png): current handoff with accepted dimensions and topology; final annotation layout user-approved on 2026-10-07. Annotated v1 remains historical approval evidence; original v2 remains the appearance source.
- [Street tree](06-street-tree-v2.png): overall character reference; unchanged. The [document review](06-street-tree-review.md) records the new construction contract and its validation boundary.
- [Single leaf](06-single-leaf-v1.png): one shared thick rounded leaf. Numeric contour, shallow bulge and shell are now fixed under user delegation in the [construction contract](../TREE-CONSTRUCTION.md); the drawn SIDE arch is not calibrated.
- [Natural leaf cluster](06-leaf-cluster-v2.png): selected by the user as the improved composition. Mixed sizes, local overlap and irregular outline guide the deterministic assembly; v1 is historical.
- [Bare-tree structure - selected reference](06-bare-tree-selected-v1.png): fuller two-level version explicitly selected on 2026-10-07 and preserved unchanged. The [branch inventory](../BARE-TREE.md) and [numeric data](../tree-construction-spec.json) replace the superseded six-plus-six proposal. No rendered model approval is implied.
- [Street lantern](07-street-lantern-v2.png): one complete light; unchanged reference. The [recalculated geometry and appearance contract](../LANTERN-SPEC.md) corrects proportions and fixes joints, panes and replacement rules. See [document review](07-street-lantern-review.md); numeric review is not rendered-model approval.

The paving stone's smooth review fill shows geometry, not final surface finish.
Future replaceable stone materials may supply grain, roughness and micro-normal
or bump detail. These are not yet authored; the current geometry and defaults
remain unchanged. See the [surface-detail note](../SURFACE-RECIPES.md#paving-stone-surface-detail-note).

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

- [Single paving stone and layout annotation prompts](PAVING-STONE-PROMPTS.md)

- [Original approved scene](approved-office-reference.jpg)
- [Initial generation record](PROMPTS.md)
- [Revision generation record](REVISION-PROMPTS.md)
- [Unit and transparency corrections](UNIT-CORRECTIONS.md)

Created with built-in image_gen. Historical revisions cannot replace the latest single-unit specification.

## Lighting revision - 2026-10-04

The user authorized committing these lighting-only drawing revisions. Prior approval applies to the underlying design. Dimensions and construction specifications are unchanged.

See the [complete lighting review](../../SHADOW-FREE-REVIEW.md) for revised images and the shared surface rule. Do not bake shadows, ambient occlusion, highlights or directional lighting into materials.

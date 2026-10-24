# Asyra Office - Group 3 - Character Designs

Status: the original sheets were approved on 2026-10-04. The male modular puppet documentation is approved for commit after scoped numeric checks; no rendered model is verified. The female baseline is unchanged. One unit is one person, not one view. Appearance presets do not restrict who may use their parts.

## Reference and delivery

Appearance follows the [approved original office image](../architecture/review/approved-office-reference.jpg), prioritizing the central office.

| Character | Reference location | Retained features | Five-view sheet |
| --- | --- | --- | --- |
| Man | Round-glasses worker at the rear circular table | Short brown hair, round black glasses, off-white shirt, large head and small body | [Man](review/01-man-v1.png) |
| Woman | Worker at the laptop on the central office's left | Rounded black hair, swept fringe, off-white top, simple black eyes | [Woman](review/02-woman-v1.png) |

Sheets show front, side, back, top, and oblique views. Seated source poses become neutral standing poses to describe complete bodies. Hidden trousers, shoes, rear hair, and unclear collar details are authored completions, not directly proven by the source. Man/woman name these appearance samples without restricting future app appearance choices.

## Current construction authority

| Preset | Numeric source | Geometry source | State |
| --- | --- | --- | --- |
| Male modular puppet | [Part and assembly specification](man-puppet-model-spec.json) | [Puppet construction contract](PUPPET-SPEC.md) | Documentation reviewed; model review pending |
| Female baseline | [Inline female entry](people-model-spec.json) | [Female baseline recipe](GEOMETRY-SUPPLEMENT.md) | Unchanged; later review |

The [measurement record](man-reference-measurements.json) retains source pixels,
scale, picked landmarks and authored-completion limits. Male defaults now target
1200 mm styled height, 672 mm hair width, 640 mm hand span and a 560 mm bare skin
head width. The old sheet's approximate 520 mm head caption is superseded and
awaits annotation; do not use it to shrink the hair or body. The image itself
has not been edited during this documentation task.

All dimensions are defaults subject to the [shared XYZ and appearance rules](../README.md).
The male profile contains complete skin anatomy, independent hair leaves, face,
glasses, limbs, hands/feet, clothing and sockets. The female baseline is not yet
certified for this modular body profile. Do not apply its shared numeric sections
to the delegated male entry.

- [Materials and replaceable appearance](SURFACE-RECIPES.md)
- [Image index](review/README.md) and [original prompts](review/PROMPTS.md)

## Scope

Images and model specifications only. No Blender files, GLB, rigging, animation, interaction, or app changes. The new male data defines replaceable-part and garment-fit requirements. It does not implement a wardrobe, animation or rig. Hidden naked anatomy and revised dimensions are documented; their rendered appearance and fit remain pending model review.

Images are appearance drawings, not calibrated projections. Outlines, text, background, and shading are not materials; documented seams, eyes, and mouth are intrinsic details. Future models still need multiview comparison. No 100% reconstruction is claimed here.

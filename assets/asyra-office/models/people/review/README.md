# Group 3 Characters - Image Review

Status: the user approved committing both sheets on 2026-10-04.

1. [Man - round glasses and short hair](01-man-v1.png): based on the worker at the rear circular table inside the central office.
2. [Woman - black-haired laptop worker](02-woman-v1.png): based on the worker at the left laptop inside the central office.

Each sheet contains FRONT, SIDE, BACK, TOP, and THREE-QUARTER. Hair, clothing, and proportions must remain consistent. The man's left-facing and woman's right-facing side layouts do not define different coordinates; modeling uses front -Y and right +X.

The [original reference](../../architecture/review/approved-office-reference.jpg) controls appearance. The male specification uses [the puppet recipe](../PUPPET-SPEC.md) and [male numeric specification](../man-puppet-model-spec.json); the female baseline uses [its geometry specification](../GEOMETRY-SUPPLEMENT.md) and [inline numeric specification](../people-model-spec.json). Both TOP views are slightly tilted top-appearance illustrations, not orthographic measurement sources. Actual model top review uses +Z.

No animals, props, chairs, status lights, or animation. Review hidden-area completions and authored dimensions together. Slight image tonal variation does not become baked lighting; use solid-colour model materials.

## Lighting revision - 2026-10-04

The user authorized committing these lighting-only drawing revisions. Prior approval applies to the underlying design. Dimensions and construction specifications are unchanged.

See the [complete lighting review](../../SHADOW-FREE-REVIEW.md) for revised images and the shared surface rule. Do not bake shadows, ambient occlusion, highlights or directional lighting into materials.

## Male puppet specification revision

The existing male sheet is the appearance source for the new
[modular puppet specification](../PUPPET-SPEC.md). Its [measurement record](../man-reference-measurements.json)
uses front pixels to adopt 672 mm hair width and 640 mm hand span at 1200 mm
styled height. The old approximate 520 mm head-width caption is superseded;
it needs a later annotation update. It is not a current numeric authority.
The bare skin head is separately specified as 560 mm wide.

No source pixels were changed in this task. New hidden anatomy, depth, garment
interiors, hair decomposition and sockets are authored. The user approved
committing the revised documentation after its scoped numeric checks. This
documentation approval does not prove a rendered match. The female baseline retains its separate review status.

# Group 3B - Sleeping Cat and Standing Corgi

Status: user-approved reference sheets. Drawings and reconstruction specifications only.

Animal work is now authorized. This batch contains two complete independent animals. Sparrow and parrot remain for a later batch.

| Animal | Source | Pose | Default final size XYZ |
| --- | --- | --- | --- |
| Orange-and-cream cat | Sleeping pet on the central office's green rug | Curled sleeping | 0.38 x 0.50 x 0.26 m |
| Orange-and-cream corgi | Dog on the pavement outside the office | Four-paw standing | 0.32 x 0.62 x 0.48 m |

The [approved office image](../architecture/review/approved-office-reference.jpg) determines visible style. The cat's sleeping pose is retained. The corgi's walking pose is standardized to standing to expose all limbs. Hidden paws, underside, tail continuity and precise color boundaries are authored completions, not recovered measurements.

## Sleeping cat review

The user reconfirmed the cat's six-view shape. Its [reviewed construction
contract](SLEEPING-CAT-SPEC.md) now distinguishes raw part coordinates from the
380 x 500 x 260 mm default bounds, specifies facial projection failure handling,
tail/paw checks, independently replaceable appearance regions and unverified
LOD budgets. The reference image and raw primitive dimensions remain unchanged.
The revised cat documentation is approved for commit. That review preserved
the corgi geometry; its separate review is described below. The [shared size and appearance contract](../README.md)
applies to all instances.

## Standing corgi review

The [corgi construction contract](STANDING-CORGI-SPEC.md) now defines default
320 x 620 x 480 mm bounds including the separate solid nose, raw component
dimensions, four-paw ground contact, eye projection across head/muzzle surfaces,
source-label mapping and replaceable appearance/LOD requirements. Source pixels
and raw geometry remain unchanged. The revised corgi documentation and document-only illustration are approved
by the user for commit; no model is verified.

## Handoff

- [Review gallery](review/README.md)
- [Geometry and construction](GEOMETRY-SUPPLEMENT.md)
- [Surface and facial recipes](SURFACE-RECIPES.md)
- [Numeric specification](animals-model-spec.json)
- [Actual prompts](review/PROMPTS.md)

No collars, props, floor, rug or environment are bundled with either animal. No models, rigging, Blender execution, animation or app implementation are included. Geometry recipes define an authored reconstruction target; they do not prove a model matches the drawings or original image.

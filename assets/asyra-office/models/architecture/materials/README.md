# Floor Materials

Status: independent PNG material workflow authorized by the user on 2026-10-06.
The natural oak v1 appearance and floor v7 sheet were approved for commit on
2026-10-06. Reference shadows are not required for this component.

## Classification

This is an independent **material asset** specification. The PNG below is its
base-colour input; the mapping and material parameters complete its contract.
The floor plank remains a separate model component that references this default.
It is not a decal or an additional coplanar mesh. Reuse on another compatible
model requires explicit mapping rather than assuming this plank mapping applies.
See the [shared classification](../../ASSET-TYPES.md).

## Natural oak v1

- Asset: [floor-natural-oak-v1.png](floor-natural-oak-v1.png).
- Format: opaque RGB PNG, 2160 x 324 pixels, sRGB base colour.
- Coverage: one 1.2 x 0.18 m top face; image aspect 20:3 equals plank aspect.
- Direction: grain runs left to right along local X.
- Content: natural irregular grain, without the original reference's oval knot.
- No plank geometry, background, outlines, alpha cutout, cast shadow, AO,
  directional lighting, normal map or displacement is included.
- Source: edited from the original floor sheet's cropped grain reference using
  the built-in image tool. The full output is retained in the review folder;
  the final PNG crops x=5, y=200, width=2160, height=324 without recolouring.

## Mapping contract

Keep the existing plank dimensions, bevel, origin and placement connections.
Texture replacement never changes those values.

Normalized image coordinates use (0,0) at the top-left:

- TOP: s=(X+0.6)/1.2, t=0.5-Y/0.18.
- Long sides: s=(X+0.6)/1.2, t=0.5-Z/0.18.
- Short ends and underside: uniform RGB equal to the arithmetic mean of the
  active PNG's sRGB pixels, then converted to linear for the material input.
- Map normalized coordinates to pixel coordinates x=s*(width-1), y=t*(height-1).
  Clamp at the edges and sample bilinearly. Do not repeat within a plank.
- Read the image as sRGB and convert once to linear for physical rendering.
  Base-colour multiplier is white; do not multiply by the previous oak tint.
- Keep existing oak roughness 0.78, metallic 0, alpha 1, emission 0.

TOP and the oblique top face use the same local coordinates and same image.
The authoring script does not invent separate textures for separate views.

The PNG is a replaceable material input, not a second coplanar floor mesh.
Future app material selection may substitute another PNG with this UV contract.
This candidate covers one plank and is not certified as a seamless repeating
whole-room texture. Material selection, tiling and rotation controls remain app
work; no such controls are implemented in this drawing revision.

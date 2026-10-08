# Garden Masonry - Surface Recipes

| Material | Base sRGB | Fleck sRGB | Roughness |
| --- | --- | --- | --- |
| Warm grey stone | #C6BFB3 | #AFA79A | 0.92 |
| Cream limestone | #EBE2CE | #D5C7AB | 0.88 |

Metallic 0, opacity 1, emission 0. No clearcoat, normal map, relief or displacement.

## Repeatable intrinsic flecks

Use resized local coordinates x,y,z in metres, before world placement, including
on hidden surfaces. These are coordinates after the overall-size transform,
not the unscaled reference mesh coordinates. Evaluate the field at that physical
scale so changing block size does not stretch the flecks. At default size this
is identical to the original recipe. Define:

s = sin(2*pi*(x/0.019 + y/0.023 + z/0.017))
    * sin(2*pi*(x/0.031 - y/0.013 + z/0.029))

Let t=clamp((abs(s)-0.68)/0.22,0,1), mask=t*t*(3-2*t). Convert the base and fleck sRGB colours to linear space, then mix them with weight 0.30*mask. This deterministic field provides sparse, understated stone variation without an external texture, random seed or view-dependent result. The generated fleck placement is illustrative; this recipe is the reconstruction authority.

Use the same field and material across main faces, chamfers, corners and underside. No special brighter edge paint, dark bottom band or baked crevice colour.

## Lighting separation

No shadows, AO, highlights, directional gradients, glow or reflections belong in these materials. Drawing contour lines, dimension marks and white backgrounds are annotations only. Scene lights produce all illumination.

## Defaults and common overrides

These are default material recipes. Apply the [shared sizing and appearance rule](../README.md#overall-size-and-appearance---2026-10-09).
Each stone has one configurable whole-stone material region covering principal
faces, chamfers, corner patches and the underside. Colour or material replacement
does not require another mesh or change geometry. Replacement materials supply
their own stretch/repeat mapping; the default stone field uses the resized local
metre coordinates above. No production texture file is required by this recipe.

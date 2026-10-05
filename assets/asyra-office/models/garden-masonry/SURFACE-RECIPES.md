# Garden Masonry - Surface Recipes

| Material | Base sRGB | Fleck sRGB | Roughness |
| --- | --- | --- | --- |
| Warm grey stone | #C6BFB3 | #AFA79A | 0.92 |
| Cream limestone | #EBE2CE | #D5C7AB | 0.88 |

Metallic 0, opacity 1, emission 0. No clearcoat, normal map, relief or displacement.

## Repeatable intrinsic flecks

Use object-space coordinates x,y,z in metres, including on hidden surfaces. Define:

s = sin(2*pi*(x/0.019 + y/0.023 + z/0.017))
    * sin(2*pi*(x/0.031 - y/0.013 + z/0.029))

Let t=clamp((abs(s)-0.68)/0.22,0,1), mask=t*t*(3-2*t). Convert the base and fleck sRGB colours to linear space, then mix them with weight 0.30*mask. This deterministic field provides sparse, understated stone variation without an external texture, random seed or view-dependent result. The generated fleck placement is illustrative; this recipe is the reconstruction authority.

Use the same field and material across main faces, chamfers, corners and underside. No special brighter edge paint, dark bottom band or baked crevice colour.

## Lighting separation

No shadows, AO, highlights, directional gradients, glow or reflections belong in these materials. Drawing contour lines, dimension marks and white backgrounds are annotations only. Scene lights produce all illumination.

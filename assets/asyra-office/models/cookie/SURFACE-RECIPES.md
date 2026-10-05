# Cookie - Surface Recipes

| Region | sRGB color | Roughness |
| --- | --- | --- |
| Dough | #D5A66B | 0.90 |
| Chocolate spots | #654333 | 0.90 |

Both use metallic=0, alpha=1, IOR=1.5, with coat, transmission, subsurface, anisotropy and emission all zero. No normal map or displacement.

Use local object-space XY for the top-face mask. On the flat top only, assign chocolate color if (x-cx)^2+(y-cy)^2 <= 0.004^2 for any of the five documented centres. Otherwise assign dough color. Restrict this rule by top-face identity so it cannot repeat onto the bottom or rim.

A tool may evaluate the mask procedurally or bake only intrinsic base color. For a texture implementation, map the top disk with u=(x+0.035)/0.070 and v=(y+0.035)/0.070, use at least 512 x 512 pixels and antialias circle edges. Do not bake illumination. Convert sRGB to the working space normally.

No noise, grain, browning gradient, shadow, AO, highlight, reflection or painted contour. Image outlines and labels are presentation aids. The selected drawing removes the initial generated rim highlight; minor raster variation is not a material instruction.

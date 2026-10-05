# Surface Recipes

Use flat unlit base color for reference review. No shadows, AO, highlights, gradients, reflections, normal maps, bump maps, displacement, or baked cavity darkness.

| Part | sRGB base color | Metallic | Roughness |
| --- | --- | --- | --- |
| Hand towel | #899B85 | 0 | 0.95 |
| Towel seam | #768A72 | 0 | 0.95 |
| Paper | #EEE9DB | 0 | 0.95 |
| Cardboard core | #B38B64 | 0 | 0.90 |

Emission and transmission are zero. Hidden faces retain the assigned color. Do not paint the roll bore dark: background is visible through its real opening.

## Towel seam coordinates

Use unfolded u in [0,0.240] across width and s in [0,0.500] from the front hem, over the top, to the rear hem. Let d=min(u,0.240-u,s,0.500-s). Use seam color where abs(d-0.008)<=0.0002, otherwise towel base color. This produces one fine rectangular inset seam border before folding. Apply it to both cloth faces; edge thickness faces remain base color. There is no stitched relief or doubled hem thickness.

No additional weave, grain, paper fibers, cardboard rings, or decorative artwork is specified. Contour strokes and sheet annotations are not asset textures. Runtime lighting supplies depth and shadows.

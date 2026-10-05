# Cat and Corgi - Surface Recipes

## Palette

| Name | sRGB color |
| --- | --- |
| Orange | #C98B50 |
| Cream | #F1E4CC |
| Pink | #B97972 |
| Dark facial marks | #38312C |

All regions use roughness=0.90, metallic=0, alpha=1, IOR=1.5, with coat, transmission, subsurface, anisotropy and emission zero. No normal map, displacement, fur texture or strand geometry. Convert sRGB normally to the working space.

Use raw pre-normalization coordinates for the following masks. Assign a surface point to the primitive with the smallest pre-blend field; ties use numeric-list order. Apply that primitive's base color, then its overrides below. Masks are intrinsic color only and may be baked to separate per-animal 2048 x 2048 base-color atlases with at least eight pixels of same-color island padding. Do not project sheet backgrounds or outlines onto the model.

## Cat coat

- Head starts cream. On its front half, orange applies above z=0.115+0.080*exp(-(x/0.040)^2); the rear half y>-0.155 is orange above z=0.13. This creates the cream central forehead peak.
- Torso starts orange. Cream applies when z<0.065 or when (x/0.14)^2+((y-0.04)/0.12)^2+((z-0.08)/0.065)^2<1. On the outer side regions also use cream where abs(x)>0.115 and ((y-0.025)/0.075)^2+((z-0.09)/0.07)^2<1.
- All paws are cream. Tail starts orange; paint the final 22 percent of its centreline arc length cream. A second cream band occupies arc fractions 0.35..0.47. Nearest centreline sample determines the fraction.
- On each ear's front-facing surface, let t=(z-zBase)/(zTip-zBase). Pink applies for 0.18<=t<=0.82 and abs(x-centreX(z))<0.65*radiusX(z). Rear faces remain orange.
- Use the documented closed-eye curves, mouth and pink nose. No extra facial marks.

## Corgi coat

- Torso starts orange; cream applies below z=0.095. Chest and muzzle are cream.
- Head starts orange. Cream applies below z=0.272 or on its front hemisphere within abs(x)<0.019+0.018*max(0,(0.40-z)/0.15). This is the central blaze; do not repeat it on the head back.
- Legs start orange; cream applies below z=0.060. Paws are entirely cream.
- Ear inner pink patches use the same normalized ear rule as the cat. Ear backs are orange.
- Tail is orange. Eyes and nose are solid dark. No mouth opening or tongue.

## Paw undersides

Cat only: on the downward-facing surface of each paw, use a pink central ellipse with local X/Y radii 0.014/0.012, centred at the paw centre's XY. Add three toe-pad circles radius 0.0045 at local XY (-0.012,-0.020), (0,-0.024), (+0.012,-0.020). Restrict to the lower hemisphere so pads cannot appear on paw tops.

Corgi paws remain plain cream underneath, matching the proposed drawing. Small toe contour marks in the illustrations are drawing aids, not grooves. The coat mask recipes define exact authored boundaries; generated irregularities are not additional noise instructions.

## Lighting boundary

No baked shadows, ambient occlusion, highlights, gradients, reflections or painted dark silhouette outlines. Future scene lights provide illumination. Review intrinsic colors unlit before comparing lit renders. The source image's warm lighting is not part of the palette.

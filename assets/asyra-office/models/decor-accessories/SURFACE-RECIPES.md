# Decor Accessories - Surface Recipes

All materials are opaque, non-metallic, non-emissive, with transmission 0 and clearcoat 0. Colours are sRGB inputs converted to linear for mixing. Roughness is specified in JSON. No baked lighting, ambient occlusion, contact shadows, highlights, wall texture or sheet labels enter the assets.

## Cloth and cord

Cloth ivory #E7DDC7, band sage #82927A. The front face alone uses sage for local Z=0.03..0.07; all other faces use ivory. On broad cloth faces, use weave multiplier 1-0.025*(0.5+0.5*sin(2*pi*X/0.001))*(0.5+0.5*sin(2*pi*Z/0.001)). This modulates linear base colour only, with no displacement or normal map. The sleeve is solid ivory; its circumference does not inherit the front band. Cord is uniform tan #B49A73. No random stains or edge darkening.

## Dowel

Oak #B68050 and grain #95683E. Along the cylinder use axial X and circumferential distance C=radius*theta: f=0.5+0.5*sin(2*pi*(C/0.004+0.1*sin(2*pi*X/0.18))). Mix linear oak and grain with weight 0.12*f. End caps are uniform oak. Intrinsic grain only, no engraved channels.

## Book

Binding is uniform matte blue #607F9F. Page block is cream #E7DFCB, with restrained lines #D0C5AE. On exposed right fore-edge X=0.0595, each page separation line runs vertically along Z at Y=-0.012+n*0.0007 for integer n with 0< n*0.0007 <0.024. Line width is 0.00005 in Y. On top/bottom page faces, the same stacked-sheet appearance uses lines at Y=-0.012+n*0.0007 within the exposed block, width 0.00005 in Y. Use ordinary antialiasing and mix line colour at weight 0.25. Do not interpret the texture's fine lines as a physical page count. Rounded page edges may remain plain cream. No typography, cover artwork, gloss, ribbon or barcode.

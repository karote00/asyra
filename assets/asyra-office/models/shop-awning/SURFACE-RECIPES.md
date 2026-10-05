# Shop Awning - Surface Recipes

| Material | sRGB base color | Roughness |
| --- | --- | --- |
| Muted blue | #657B89 | 0.90 |
| Ivory | #EEE4D2 | 0.90 |

Both materials use metallic=0, alpha=1, IOR=1.5, and zero coat, transmission, subsurface, anisotropy and emission. No normal map or displacement. Colors are authored approximations of the reference's intrinsic palette, not sampled scene-light colors.

For local X in [-1,1], calculate i=min(7,max(0,floor((X+1)/0.25))). Even i uses blue; odd i uses ivory. Apply this on every surface, including underside, valance, back cut and side cuts. At exact boundaries the interval to the positive-X side owns the boundary, except X=1 belongs to stripe 7.

Each stripe is 0.25 wide. There are exactly four blue and four ivory stripes. The material rule is continuous through the canopy-to-valance bend. A procedural mask or equivalent intrinsic-color texture may implement it; do not create raised strips.

No fabric weave, dirt, wear, baked shadow, AO, highlight, gradient or reflection. Future scene lighting supplies illumination. Drawing contours, labels and minor raster variation must not become material detail. Convert sRGB normally to the working space.

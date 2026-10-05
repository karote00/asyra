# Wall Decoration - Surface Recipes

All base colours are sRGB hex values; convert to linear only as required by the chosen renderer. JSON defines roughness and other material parameters. The palette is an authored visual match, not a calibrated sample of the source photograph.

| Material | Base colour | Roughness |
| --- | --- | --- |
| Dark clock housing/rim | #494039 | 0.80 |
| Warm ivory dial | #EADCC4 | 0.88 |
| Clock marks, hands and pin | #39332D | 0.85 |
| Wallpaper sage | #89977A | 0.95 |
| Wallpaper cream | #E7D7B4 | 0.95 |

All materials: metallic 0, alpha 1, transmission 0, emission 0. No clearcoat, normal map, bump map, grain, noise, cracks, fibres, patina, edge darkening or roughness variation. Back and underside colours are the same as their assigned material everywhere.

Wallpaper front uses the exact UV step mask in JSON; do not derive its pattern from a rendered sheet. Generate analytic colour assignments or a repeatable flat texture. If a texture is needed, use 1024x1024 pixels, first 256 cream, next 512 sage, final 256 cream along U for vertical or V for horizontal. Store an opaque sRGB image; use clamped edges and no baked highlights. Normal image-filter antialiasing at colour boundaries is allowed. Do not embed labels, white sheet backgrounds, outlines or view shadows.

Use neutral illumination only for inspection. All cast shadows, contact shadows, ambient occlusion and specular lighting belong to the application scene, never to asset colour or geometry. No wall receiver or ground plane is part of a unit.

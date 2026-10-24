# Wall Decoration - Surface Recipes

All base colours are sRGB hex values; convert to linear only as required by the chosen renderer. JSON defines roughness and other material parameters. The palette is an authored visual match, not a calibrated sample of the source photograph.

| Material                   | Base colour | Roughness |
| -------------------------- | ----------- | --------- |
| Dark clock housing/rim     | #494039     | 0.80      |
| Warm ivory dial            | #EADCC4     | 0.88      |
| Clock marks, hands and pin | #39332D     | 0.85      |
| Wallpaper sage             | #89977A     | 0.95      |
| Wallpaper cream            | #E7D7B4     | 0.95      |

All materials: metallic 0, alpha 1, transmission 0, emission 0. No clearcoat, normal map, bump map, grain, noise, cracks, fibres, patina, edge darkening or roughness variation. Back and underside colours are the same as their assigned material everywhere.

At default size, wallpaper front uses the exact UV step mask in JSON; do not derive its pattern from a rendered sheet. Generate analytic colour assignments or a repeatable flat texture. If a texture is needed, use 1024x1024 pixels, first 256 cream, next 512 sage, final 256 cream along U for vertical or V for horizontal. Store an opaque sRGB image; use repeat wrapping along the stripe axis and clamp along the other axis, with no baked highlights. After whole-unit sizing, calculate q=fract(d/0.4) in final local metres, where d starts at the resized left edge for vertical stripes or bottom edge for horizontal stripes. Sage covers q in [0.25,0.75), cream covers the remainder. The default 0.4 m cycle is retained; the strip can end in a partial cycle. Do not stretch one motif to fill an enlarged strip. The original normalized mask describes only the default single cycle. Normal image-filter antialiasing at colour boundaries is allowed. Do not embed labels, white sheet backgrounds, outlines or view shadows.

Use neutral illumination only for inspection. All cast shadows, contact shadows, ambient occlusion and specular lighting belong to the application scene, never to asset colour or geometry. No wall receiver or ground plane is part of a unit.

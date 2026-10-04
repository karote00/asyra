# Surface Recipes

Use unlit base-color previews for design review. Do not bake cast shadows, contact shadows, ambient occlusion, highlights, reflections, or lighting gradients. The application supplies lighting later. Thin illustrative contour strokes are not texture artwork.

## Honey wood

Base sRGB color: #B9864E. Grain color: #986B3D. Metallic: 0. Roughness: 0.80. No normal, bump, displacement, or occlusion map.

For deterministic subtle intrinsic grain, let u and v be metre coordinates along/across the grain. Compute:
- q = sin(2*pi*(v/0.003 + 0.12*sin(2*pi*u/0.055))).
- a = 0.10 * max(0, q)^8.
- Mix base and grain colors by a in linear RGB, converting the listed sRGB colors before mixing.

Tray floor, underside, and long rim surfaces use u=X, v=Y. End rim surfaces use u=Y, v=X. Exterior/interior long vertical faces use u=X, v=Z; short vertical faces use u=Y, v=Z. Assign the four rim rectangles by the nearest outside edge; ties meet along a corner diagonal without a geometric groove.

This grain is pigment variation, independent of lighting or face orientation. No stains, labels, carvings, or dark cavity tint.

## Ivory ceramic

Uniform sRGB #EEE9DB. Metallic: 0. Roughness: 0.80. No texture, noise, normal, bump, displacement, occlusion, or baked lighting.

Use the same base color inside, outside, underneath, and on the lip. Any contour in the drawing identifies a shape boundary only. Ceramic shading in the eventual app comes from scene lighting.

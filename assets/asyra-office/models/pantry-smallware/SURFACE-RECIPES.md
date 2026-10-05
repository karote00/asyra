# Pantry Smallware - Surface Recipes

## Lighting boundary

No cast shadows, contact shadows, ambient occlusion, highlight paint, reflections, directional brightness gradients or baked lightmaps. Drawing outlines must not become surface textures. Materials remain lit by the future app's scene; unlit review drawings do not require unlit runtime shaders. Every material is opaque, non-metallic, non-emissive, transmission 0, alpha 1 and clearcoat 0.

## Canister

Ceramic is uniform pale sage #B7BEA4 with roughness 0.85, including the inside, bottom and rim. Wood is #B68050, grain #95683E, roughness 0.85. On each horizontal lid face use local X/Y: f=0.5+0.5*sin(2*pi*(Y/0.003+0.08*sin(2*pi*X/0.03))); mix linear wood and grain colours by weight 0.10*f. Side, chamfers and plug are uniform wood. No knots, shadow under the lid, edge darkening, normal map or displacement.

## Cup

Paper body is cream #EEE7D8, lid ivory #E8E4DA, sleeve tan #B99468. Roughness respectively 0.95, 0.82 and 0.98. All colours uniform on each component; no texture noise, seam lines, logo, embossed lid symbols or artificial darkness inside the sipping hole. Real occlusion and illumination are computed by the scene. Hollow body and cut-lid faces retain their component colour; do not insert a dark plane to imitate depth.

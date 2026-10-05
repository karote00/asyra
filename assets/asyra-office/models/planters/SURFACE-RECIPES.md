# Planters - Surface Recipes

Use the JSON sRGB palette: terracotta #B98059, ceramic #E8DBC3, soil #554432, wood #805B3D, leaf #718752, lighter leaf #87974F, vine #526C3C and mount recess #514B41. All have roughness 0.95, metallic 0, alpha 1, transmission 0, emission 0 and no clearcoat.

All are uniform matte materials, with no texture noise, normal map, bark displacement, soil grains, cracks, veins, dirt or roughness variation. JSON assigns the lighter material to selected tree leaves; this is intrinsic colour variation, not directional lighting. Leaf backs retain the same colour. Interior walls and undersides retain the pot material.

The dark keyhole floor is an assigned flat surface inside a real recess; do not simulate the whole recess with painted shading. Soil is a real closed volume with a flat top, not ambient occlusion. Leaf folds are geometry. Do not use the rendered sheets as textures.

No cast/contact shadows, ambient occlusion, highlights, white background, annotation text or baked lighting may enter the materials. The app owns all scene lights and shadows.

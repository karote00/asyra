# Small Plants - Surface Recipes

Use the sRGB palette in JSON: ceramic #E8DBC3, terracotta #B98059, soil #554432, leaf #718752, stem #526C3C, cactus #78865B, areole #D8D0AB. All surfaces use roughness 0.95, metallic 0, alpha 1, transmission 0, emission 0 and no clearcoat. Convert sRGB to linear only as required by the renderer.

All regions are solid-colour matte materials. No noise, roughness variation, leaf vein texture, dirt map, pot grain, soil particles, normal map or displacement. Leaf backs use the same green as their fronts. Central leaf folds and cactus ribs come from geometry, not dark gradients. Areoles are the sole colour-mask detail and use the exact capsule dimensions/positions in JSON.

Pot interiors and undersides retain the same ceramic or terracotta material. Soil is intrinsically brown; it is not baked ambient occlusion. The cactus bulbous tips and leaf edges have no painted shine or dark outlines.

Never copy white sheet backgrounds, view labels, cast/contact shadows, glossy streaks or generated directional shading into assets. No light source, shadow plane or baked illumination is delivered; the app supplies all scene lighting.

# Sofa Variants - Surface Recipes

Reuse the approved sofa palette: sage #78836A (roughness 0.93) and dark wood #584333 (roughness 0.82). Metallic 0, alpha 1, transmission 0, emission 0, no clearcoat. All exposed upholstery and the undersides use sage; all feet use dark wood. No colour variation between cushions unless introduced by actual scene lighting.

Intrinsic cloth weave is optional for preview but fixed for future detailed material authoring: use object-local coordinates on the dominant-normal plane, selecting X/Z when abs(Ny) is largest, Y/Z when abs(Nx) is next largest, otherwise X/Y. Break ties in that order. For coordinates q1,q2, cell size s=0.002 m, define F(q)=q-s*floor(q/s). Where F(q1)<0.00012 or F(q2)<0.00012, multiply linear sage RGB by 0.97; elsewhere retain the base. No seed, texture displacement, fuzz meshes, normal map or roughness variation. At distances where weave is subpixel, ordinary filtering may average it away. Do not create textures or LOD models in this batch.

Feet are uniform dark wood with no painted gloss or grain. All shape rounding comes from geometry; no edge-darkening or fake cushion seams. Do not use rendered sheets as textures. Cast shadows, contact shadows, ambient occlusion, highlights and white backgrounds are excluded from materials. The app owns lighting.

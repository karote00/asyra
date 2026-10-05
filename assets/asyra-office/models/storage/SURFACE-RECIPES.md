# Storage Furniture - Surface Recipes

Base colours and roughness follow the [JSON](storage-model-spec.json). All alpha=1, metallic=0, transmission=0, emission=0. No shadows, AO, highlights, reflections, normal maps, displacement, or lights.

Side/back/door panels: front/back u=Z,v=X; sides u=Z,v=Y. Horizontal panel top/bottom u=X,v=Y; front edges u=X,v=Z; short ends plain oak. Plinths and wall-shelf socket surrounds use solid oak-dark; handles use solid dark.

Fixed grain: p=2π(v/0.024+0.035 sin(2πu/0.40)), g=((1+sin p)/2)^10, C=oak×(1−0.15g)+oak-grain×0.15g. Mix normalized sRGB, then convert to linear with c/12.92 when c≤0.04045, otherwise ((c+0.055)/1.055)^2.4. No random variants. Texture export uses 1024 px/m, pixel-centre sampling, and 8 px same-colour edge dilation.

Do not darken compartment backs/sides because of occlusion; retain only intrinsic grain/material colour. Generated dark corners, bright edges, and silhouettes are not materials. Door fields, holes, and seams are actual geometry, not black lines or shadows faking depth.

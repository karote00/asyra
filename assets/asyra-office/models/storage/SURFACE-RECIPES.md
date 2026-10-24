# Storage Furniture - Surface Recipes

Base colours and roughness follow the [JSON](storage-model-spec.json). All alpha=1, metallic=0, transmission=0, emission=0. No shadows, AO, highlights, reflections, normal maps, displacement, or lights.

Side/back/door panels: front/back u=Z,v=X; sides u=Z,v=Y. Horizontal panel top/bottom u=X,v=Y; front edges u=X,v=Z; short ends plain oak. Plinths and wall-shelf socket surrounds use solid oak-dark; handles use solid dark.

Fixed grain: p=2π(v/0.024+0.035 sin(2πu/0.40)), g=((1+sin p)/2)^10, C=oak×(1−0.15g)+oak-grain×0.15g. Mix normalized sRGB, then convert to linear with c/12.92 when c≤0.04045, otherwise ((c+0.055)/1.055)^2.4. No random variants. Texture export uses 1024 px/m, pixel-centre sampling, and 8 px same-colour edge dilation.

Do not darken compartment backs/sides because of occlusion; retain only intrinsic grain/material colour. Generated dark corners, bright edges, and silhouettes are not materials. Door fields, holes, and seams are actual geometry, not black lines or shadows faking depth.

## Snack cabinet appearance and resizing

The [construction specification](SNACK-CABINET-SPEC.md) and JSON map every snack-cabinet part to its replaceable default. Oak panels retain #C7A376 with #AF895F grain, the plinth uses #A68760, and handles/mounts use #44443C. Resolve part, assembly-group and whole-unit overrides in that order before the preset. With no explicit colour override, retain the selected material's own colour. A replacement does not alter geometry or another cabinet instance.

For this cabinet, evaluate grain in final resized local metres before world placement. Recess floors and slopes inherit the door front mapping. Fillets retain the nearest adjoining surviving source face's region, with table-order ties. The original recipes for bookcase and wall shelf are unchanged. No internal duplicate faces are retained merely to store material regions.

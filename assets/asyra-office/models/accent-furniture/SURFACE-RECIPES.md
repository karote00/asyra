# Accent Furniture - Surface Recipes

Use the sRGB colours and material constants in JSON. All materials have opacity 1 and emission 0. No clearcoat, normal map or displacement is required.

## Stool

Cushion is uniform burnt orange #CB7135, roughness 0.90, metallic 0. Legs are uniform dark wood #60422E, roughness 0.85, metallic 0. Their small scale does not require grain. Underside remains orange, with no black fabric patch. Fine drawn boundary lines are annotations, not seams, painted stripes or modeled grooves.

## Side table

Wood base colour is #B9864E and grain colour #986B3D. In object-space metres, let f=0.5+0.5*sin(2*pi*(y/0.012+0.08*sin(2*pi*x/0.18))). Mix the two colours in linear colour space with grain weight 0.12*f. This produces restrained continuous grain along X, shared by top, chamfer, edge and underside. Do not bake the exact illustrative line strokes from the generated image.

Pedestal and base use uniform charcoal #383A38, metallic 0.15 and roughness 0.80. Bottom faces use the same material.

## Lighting separation

Do not bake cast shadows, contact shadows, AO, directional shading, highlights or reflections into any material. No shadow plane or background is part of either asset. Intrinsic colour and wood grain are the only surface variation. Scene lighting supplies all illumination and shading.

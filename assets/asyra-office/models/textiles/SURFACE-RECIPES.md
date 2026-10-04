# Textiles - Surface Recipes

Base colours are sRGB; convert to linear before any colour arithmetic. All materials have roughness 0.95, metallic 0, alpha 1, transmission 0, emission 0 and no clearcoat.

| Region | Colour |
| --- | --- |
| Green rug body | #758074 |
| Green binding | #606B5B |
| Round rug body | #858393 |
| Round binding | #706D7E |
| Both rug backs | #B8AD96 |
| Pillow body | #D4AC57 |
| Pillow seam | #C49D4E |

The palette is an authored visual approximation. Do not sample dark shadows or highlights from generated sheets into these values.

## Deterministic flat weave

Use a subtle intrinsic weave on rug top body regions, tan rug backing and the pillow body. Binding and seam remain solid colours. There is no fuzz geometry, normal map, bump or displacement.

For rugs use local coordinates q1=X and q2=Y. For the pillow select the dominant absolute component of the local surface normal: if abs(Ny) is largest, use q1=X,q2=Z; otherwise if abs(Nx)>=abs(Nz), use q1=Y,q2=Z; otherwise use q1=X,q2=Y. Break exact ties in the stated order. Coordinates are object-local and do not move with world placement.

Set cell size s=0.002 m, line width w=0.00012 m and F(q)=q-s*floor(q/s). At points where F(q1)<w or F(q2)<w, multiply the linear base RGB by 0.90; elsewhere retain the base colour. This defines a fixed, low-contrast crossing-thread motif with no random seed. No normal/roughness modulation. Projection transitions on pillow edges are accepted in this simplified recipe; there is no claim of physically woven topology.

If rasterized later, use sufficient resolution for the selected asset size and ordinary mipmapping so subpixel weave averages toward its base colour; do not generate such textures in this drawing-only batch. Never use a rendered sheet directly as a texture.

No contact shadow, cast shadow, ambient occlusion, directional gradient, baked highlight, white background or annotation belongs in a material. Future app lighting owns all illumination. Dark binding and seam are intrinsic assigned colours, not painted occlusion.

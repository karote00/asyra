# Architectural Components - Surface Recipes

Status: fixed modeling recipes approved for commit on 2026-10-04. Colour, roughness, metallic, alpha, and emission values follow materials in the [JSON](architecture-model-spec.json). These recipes describe intrinsic colour variation, not scene lighting.

## Shared calculations

Mix colours in normalized sRGB (0–1), clamp to 0–1, then use the JSON sRGB-to-linear formula for material nodes. Roughness and metallic do not vary with texture. No normal maps, displacement, AO, cast shadows, highlight maps, or emission.

Use component-local metres, independent of app world position. Each plane's origin is the projection of the assembly origin. Front/back use (u,v)=(X,Z), top/bottom (X,Y), and sides (Y,Z). Do not reverse signs on rear faces. Bevels use the plane corresponding to the largest absolute normal component; ties prefer Z, then Y, then X.

Reproducible discrete noise: i=floor(u/s), j=floor(v/s). Compute signed integer k=(73856093*i + 19349663*j + seed), then nonnegative modulo n=((k mod 104729)+104729) mod 104729 and h=n/104728. Do not substitute a tool's default Noise node or unseeded randomness.

## Plaster and stone

| Material | Colour formula | s (m) | seed |
| --- | --- | --- | --- |
| plaster | base × (1 + 0.018 × (2h-1)) | 0.006 | 17 |
| stone | base × (1 + 0.022 × (2h-1)) | 0.009 | 29 |
| cream-cap | JSON solid colour | unused | unused |

Variation must not depend on face orientation, nearby objects, recess depth, or lighting. When producing texture images, use 1024 pixels per metre sampled at pixel centres. Do not artificially darken seams or boundaries.

## Plank

Top: u=X, v=Y. Long sides: u=X, v=Z. Define:

- p = 2π × (v/0.014 + 0.035 × sin(2πu/0.45)).
- g = ((1 + sin(p))/2)^12.
- t = 0.08 × (0.5 + 0.5 × sin(2πu/0.7 + 0.4)).
- C = mix(mix(oak, oak-light, t), oak-grain, 0.28g), where mix(a,b,t)=a(1-t)+bt.

The underside and two short ends are plain oak. Add no knots, nail holes, stains, or cracks. Repeated instances use the same texture. Any app variants require a separate definition, not modeling-tool randomness.

## Door and window

Frames use door-frame; the left panel, right leaf, and recessed fields use door-wood, initially solid colours. Do not darken recesses to fake shadows. All handle parts use iron and all panes use glass, both solid colours. Glass has alpha=1, transmission=0, emission=0; no transparent backing or baked environment reflection. This is a stylized appearance choice, not physical glass simulation.

Textures do not define geometry: build recesses, seams, and bevels from the geometry document. Do not put source-image warm light or generated face shading into albedo. Unlit inspection should retain intrinsic texture without a fixed directional lighting pattern.

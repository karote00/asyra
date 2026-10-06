# Architectural Components - Surface Recipes

Status: 2026-10-04 baseline, with a floor material revision requested on 2026-10-06. The floor natural oak PNG and v7 sheet were approved for commit on 2026-10-06. Other materials retain the baseline recipes. Roughness, metallic, alpha, and emission follow the [JSON](architecture-model-spec.json). These recipes describe intrinsic colour variation, not scene lighting.

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

The user rejected the evenly spaced procedural grain shown in floor v6. Do not
use the former sinusoidal stripe recipe as the current appearance target.
Preserve the natural variation in spacing, fine fibres and gently flowing
longitudinal grain from the original floor reference, without its knot.

Geometry and material are independent. The approved replacement is the standalone
[natural oak PNG](materials/floor-natural-oak-v1.png), with its exact mapping in
the [floor material contract](materials/README.md). The PNG is intrinsic sRGB
base colour only; no geometry, lighting, shadows, AO, border or background.
It replaces the floor base-colour input; do not multiply it by the old oak colour
or regenerate it with the rejected formula. Other materials are unaffected.

The underside and two short ends remain uniform wood colour, using the active
PNG's mean sRGB colour for this candidate. No short-end grain, knots, nail holes,
stains or cracks. The same physical UV mapping is used in TOP and THREE-QUARTER.
The app owns material selection and future repetition/rotation options; swapping
the PNG does not change plank size, bevels, placement, or connections. This
document specifies the asset handoff, not an implemented app material editor.

## Door and window

Frames use door-frame; the left panel, right leaf, and recessed fields use door-wood, initially solid colours. Do not darken recesses to fake shadows. All handle parts use iron and all panes use glass, both solid colours. Glass has alpha=1, transmission=0, emission=0; no transparent backing or baked environment reflection. This is a stylized appearance choice, not physical glass simulation.

Textures do not define geometry: build recesses, seams, and bevels from the geometry document. Do not put source-image warm light or generated face shading into albedo. Unlit inspection should retain intrinsic texture without a fixed directional lighting pattern.

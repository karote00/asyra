# Architectural Components - Surface Recipes

Status: 2026-10-04 baseline, with floor and door surface revisions on 2026-10-06. The floor natural oak PNG and v7 sheet were approved for commit on 2026-10-06. The door uses the recolouring contract below; other materials retain the baseline recipes. Roughness, metallic, alpha, and emission follow the [JSON](architecture-model-spec.json). These recipes describe intrinsic colour variation, not scene lighting.

## Shared calculations

### Default appearance by component

Use these existing defaults when no appearance override is supplied. Hex values
are sRGB base colours and match the named materials in the numeric JSON.
Roughness, metallic and alpha remain those of the corresponding JSON material.
Plaster and stone retain their intrinsic variation recipes below.

| Component | Part or region | Default material and base colour |
| --- | --- | --- |
| Wall segment | Body | Plaster, `#E4D9C4` |
| Wall segment | Top cap | Cream cap, `#EEE4D2` |
| Floor plank | Top and long sides | Natural oak PNG from `materials/floor-natural-oak-v1.png`; oak material roughness 0.78 |
| Floor plank | Underside and short ends | Active oak PNG mean sRGB, following `materials/README.md` |
| Partition segment | Body | Plaster, `#E4D9C4` |
| Partition segment | Top cap | Cream cap, `#EEE4D2` |
| Stair step | All faces | Stone, `#D6D0C1` |
| Complete entrance door | Frame | Door frame wood, `#A9602B` |
| Complete entrance door | Fixed panel, leaf and recessed fields | Door wood, `#B96E2E` |
| Complete entrance door | Handle and its hardware | Iron, `#403C35` |
| Window | Frame, mullions and sill | Cream cap, `#EEE4D2` |
| Window | All four panes | Opaque stylized glass, `#ACBCC0` |

The floor PNG replaces the legacy oak base-colour input, as specified below;
do not multiply the PNG by `#D5B587`. Diagram face tones are not extra
per-face defaults. Every listed default remains replaceable without geometry
changes, and overrides must not mutate other instances.

Current scope - 2026-10-06: the [shared asset rule](../README.md#current-review-scope-and-configurable-appearance---2026-10-06)
limits current review to dimensions and geometry. Every recipe below is an
optional default, not a restriction against caller-supplied colours or materials.
The door's colour-only path preserves its existing material; an explicit material
override is also required by the shared rule. No appearance mismatch blocks this
geometry review, and no texture or runtime implementation is added here.

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

Door frames use door-frame; the left panel, right leaf, and recessed fields use
door-wood. Their JSON baseColorSRGB values are editable default colours, not
colours permanently baked into wood-grain images. The user changes colour while
retaining the existing wood material and its grain. This supersedes the earlier
solid-colour-only door recipe.

- Keep grain as fixed, neutral monochrome detail independent of the selected
  colour. A grain PNG, if supplied, is non-colour data; it must not contain the
  orange/brown paint colour, shadows, AO, highlights, outlines or hardware.
- Combine the selected colour and neutral grain in the material. Convert the
  selected sRGB colour to linear once; read the grain as linear data. Do not
  tint an orange reference image or multiply by the old default colour again.
- The left fixed panel, main leaf and both recessed fields share the door-wood
  colour parameter. The frame retains its door-frame colour parameter and
  existing darker default; it can be recoloured without changing its material.
- Recolouring preserves geometry, UVs, grain pattern, grain direction and scale,
  roughness, metallic, opacity and bevels. The iron handle remains independent.
  It requires no alternate model, replacement material or PNG for each colour.
- The future app owns per-door colour selection. Changing one placed door must
  not recolour unrelated doors through an unintentionally shared mutable value.
- Grain content, mapping and strength still require a separately reviewed asset
  or reproducible recipe. No door grain PNG or shader is delivered by this
  document change. Do not treat this colour contract as completed texture work.

Do not darken recesses to fake shadows. All handle parts use iron and all panes
use glass, both solid colours. Glass has alpha=1, transmission=0, emission=0;
no transparent backing or baked environment reflection. This is a stylized
appearance choice, not physical glass simulation.

Textures do not define geometry: build recesses, seams, and bevels from the geometry document. Do not put source-image warm light or generated face shading into albedo. Unlit inspection should retain intrinsic texture without a fixed directional lighting pattern.

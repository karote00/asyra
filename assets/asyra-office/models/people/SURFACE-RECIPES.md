# People - Material and Surface Specification

For the male puppet, use defaults from [man-puppet-model-spec.json](man-puppet-model-spec.json); for the female puppet, use [woman-puppet-model-spec.json](woman-puppet-model-spec.json). These are replaceable presets under the [shared appearance rules](../README.md), not locked colours or materials. Colours are sRGB. For linear conversion, each channel c=byte/255 uses c/12.92 when c≤0.04045, otherwise ((c+0.055)/1.055)^2.4. All materials use alpha=1, metallic=0, emission=0, transmission=0. No normal/displacement maps, AO, shadows, highlights, or environment-reflection maps.

## Parts

- Skin and nose use skin. The woman's cheeks use flat pale-pink blush circles without gradients; no blush on the man.
- Eyes are solid dark-brown/black eye ellipses without whites, layered pupils, or white glints. Eyebrows use each character's hair colour; mouth lines use mouth.
- The man's hair uses brown-hair; the woman's uses black-hair. Actual lock contours define separation, without painted shadows or fine strands.
- The man's shirt, collar, and cuffs use shirt. The woman's torso uses shirt, collar/cuffs use collar. Trousers and shoes follow character bindings.
- The man's frames use spectacle. There are no physical lenses; empty lens regions prevent fixed highlights covering the eyes. This is an explicit stylized geometry choice.
- The man's two shirt buttons use button; his waist button defaults to spectacle. His horizontal and vertical back seams use seam. The woman's front shirt and rear yoke seams use seam; her trouser waist line is the modeled waistband boundary, not an added stripe. Seams occur only at documented positions.
- Each male shoe has a closed recessed sole seam defined by `soleSeam` in the
  male numeric specification. Its integrated recessed surface inherits that shoe's material and
  colour override. Do not add a dark stripe, baked shadow or independent ring.

## Facial graphics and seams

Intrinsic graphics defined by geometry may be decals or matching thin surfaces, using JSON thickness/projection rules. If exported as textures, use 2048 × 2048 with independent 0–1 UVs per part and 8 px same-colour edge dilation. Do not project the whole reference image. Thin surfaces are preferred to prevent UV-tool differences from moving features. Line width is measured in m, not image pixels.

Head, body, and clothing backs use the same base colours. Paper backgrounds, image lighting, black outlines, and dimension text are not textures. The app computes scene lighting; inspect unlit base colour first during appearance review.

## Male modular appearance ownership

Skin anatomy and nose default to skin; eyes to eye; mouth to mouth; eyebrows
and each hair leaf to brown-hair. Glasses default to spectacle. Shirt body,
sleeves, full collar and cuffs default to shirt. Trousers/waistband default to
taupe-trousers; each shoe to brown-shoes. Defaults resolve in the male numeric
file. Each region accepts its own material/colour override and inherits its
group override when absent. Material selection precedes colour override.

Replacing clothes, hair or glasses does not recolour skin or modify geometry
implicitly. Shared materials must not mutate other instances. Apply explicit
whole-puppet XYZ sizing before texture placement. This document defines data
requirements only, not an implemented renderer or wardrobe API.

## Female modular appearance ownership

The female defaults use black-hair for cap, eight leaves and both eyebrows;
skin for complete anatomy and nose; eye for both eyes; mouth for the smile;
blush for the two independently replaceable cheek regions. Shirt body/sleeves
use shirt, collar/cuffs use collar, trousers/waistband use charcoal-trousers,
and each shoe uses dark-shoes. No eyewear, buttons or recessed shoe seam is
present by default. The optional eyewear socket does not create geometry.

The female numeric profile owns these defaults and its material regions.
Part/group material overrides resolve before colour overrides, without changing
geometry, fit or other instances. Cheek colour is intrinsic; image shadows and
highlights are never copied into a material. Source images stay unchanged.

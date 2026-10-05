# People - Material and Surface Specification

Use solid materials from [people-model-spec.json](people-model-spec.json). Colours are sRGB. For linear conversion, each channel c=byte/255 uses c/12.92 when c≤0.04045, otherwise ((c+0.055)/1.055)^2.4. All materials use alpha=1, metallic=0, emission=0, transmission=0. No normal/displacement maps, AO, shadows, highlights, or environment-reflection maps.

## Parts

- Skin and nose use skin. The woman's cheeks use flat pale-pink blush circles without gradients; no blush on the man.
- Eyes are solid dark-brown/black eye ellipses without whites, layered pupils, or white glints. Eyebrows use each character's hair colour; mouth lines use mouth.
- The man's hair uses brown-hair; the woman's uses black-hair. Actual lock contours define separation, without painted shadows or fine strands.
- The man's shirt, collar, and cuffs use shirt. The woman's torso uses shirt, collar/cuffs use collar. Trousers and shoes follow character bindings.
- The man's frames use spectacle. There are no physical lenses; empty lens regions prevent fixed highlights covering the eyes. This is an explicit stylized geometry choice.
- The man's two shirt buttons use button. The woman's front shirt seam and trouser waist line use seam. Seams occur only at documented positions.

## Facial graphics and seams

Intrinsic graphics defined by geometry may be decals or matching thin surfaces, using JSON thickness/projection rules. If exported as textures, use 2048 × 2048 with independent 0–1 UVs per part and 8 px same-colour edge dilation. Do not project the whole reference image. Thin surfaces are preferred to prevent UV-tool differences from moving features. Line width is measured in m, not image pixels.

Head, body, and clothing backs use the same base colours. Paper backgrounds, image lighting, black outlines, and dimension text are not textures. The app computes scene lighting; inspect unlit base colour first during appearance review.

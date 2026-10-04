# Desk Items - Image Generation Prompts

Generated with the built-in image tool. No external service, API CLI, Blender or model export was used. Both initial prompts used the existing approved central-office reference at `../../architecture/review/approved-office-reference.jpg` relative to this file.

## Laptop - initial sheet

```text
Use case: stylized-concept. Make one multi-view asset sheet of the single silver Apple-style laptop used by the black-haired worker at the LEFT DESK INSIDE THE CENTRAL OFFICE of the supplied reference. Match its cozy simple miniature appearance, not the outside storefronts. ONE open laptop, rounded slim silver aluminium base, charcoal compact keyboard, centered broad silver trackpad, silver display back with a small centered flat white apple-shaped emblem with a leaf and right bite, no wordmark. Display is a plain dark unlit rectangle with black bezel, NO interface, text, wallpaper or reflections. Fixed open angle 110 degrees. Base 0.30 m wide x 0.21 m deep x 0.012 m thick, lid 0.30 m wide x 0.19 m tall x 0.006 m thick. Consistent hinge, keyboard, trackpad, emblem, and proportions across FIVE views: FRONT (looking at screen), RIGHT (hinge angle visible), BACK (white emblem visible), TOP (keyboard and leaned-back lid), THREE-QUARTER (screen and keyboard visible). One same open laptop in every view, no closed variant. Keyboard simplified six tidy rows of dark rounded keycaps, one broad spacebar; key legends omitted. No cables, ports, charger, stickers, mouse, person, table or backdrop geometry. Clean white sheet with English title 'LAPTOP - SINGLE UNIT' and five English view labels. No numeric annotations needed. Flat diffuse material colors; NO cast shadows, contact shadows, ambient occlusion, gradients, glare or baked lighting. Whole object in every view, generous margins. The unseen front keyboard and screen are intentional simple completions of the reference's visible silver lid.
```

## Mug - initial sheet

```text
Use case: stylized-concept. Make a multi-view asset sheet for ONE simple warm off-white ceramic MUG matching the pale mug held by the green-beanie agent in the central office tea point and the pale cups on the central office coffee tables in the supplied reference. Cozy miniature, gently rounded cylindrical body tapering slightly toward the base, thick rounded lip, plain matte cream ceramic, ONE round C-shaped handle on the right in FRONT view. Empty open cavity with ceramic inner wall and visible bottom, no coffee or steam. Body height 0.09 m, rim outer diameter 0.084 m, bottom diameter 0.068 m, wall thickness 0.005 m approximately. Handle is one simple rounded ceramic loop, not a separate ring, joins the outer wall at upper and lower positions. FIVE views FRONT, RIGHT (handle edge-on, in front of body), BACK (handle appears left), TOP (empty cavity and handle to right), THREE-QUARTER. Same unit consistent in every view, no saucer, lid, teaspoon, coaster, desk or props. English title 'CERAMIC MUG - SINGLE UNIT' and English view labels; no numerical callouts needed. White sheet, neutral flat colors. NO cast/contact shadows, ambient occlusion, glazed reflections, dark fake hole, outlines, patterns, branding or baked lighting. Distinguish the real hollow interior with readable geometry only, not black fill. Exact dimensions and unseen underside are authored completions, appearance comes from the central office reference.
```

## Laptop - view correction

The first sheet showed an oblique view under RIGHT. It was not included in this deliverable. The correction used the first sheet plus the approved office reference. Final laptop file: `01-laptop-v2.png`.

```text
Edit the supplied laptop multiview sheet, preserving the laptop style, materials, white rear emblem, empty dark screen, text labels and layout. REQUIRED geometric corrections: the panel labelled RIGHT must be a TRUE ORTHOGRAPHIC RIGHT-SIDE PROFILE, camera along +X looking toward -X, showing a thin horizontal base and a thin lid leaning backward by 20 degrees from vertical, 110-degree interior opening angle. In that RIGHT panel no broad keyboard or display face can be seen, just their narrow edges; front of laptop points to image LEFT and back/hinge to image RIGHT, upper lid tip extends further RIGHT than hinge. The panel labelled TOP must be a TRUE overhead view, camera along +Z: base is a rectangle and the leaning lid projects as a shallow band extending past its rear, not an eye-level view of the whole screen. Keep FRONT front-facing, BACK with emblem, THREE-QUARTER as existing oblique view. Maintain ONE same open laptop, no closed variants, no ports or extra accessories. Six simplified key rows with a broad spacebar. Pure white background, neutral flat materials, NO cast/contact shadows or baked gradients. Add no text beyond existing labels. The provided office reference remains the source for the silver laptop appearance.
```

## Lighting revision - 2026-10-04

Edited the existing current sheets individually using imagegen. Preserved the original reference and historical files. The user authorized committing this output. Numeric specifications were not changed.

Files:

- `01-laptop-v2.png`
- `02-ceramic-mug-v1.png`

Submitted prompt:

Edit only the lighting in this exact design sheet. Keep every object, silhouette, view, part, label and colour family unchanged. Remove cast/contact shadows, ambient occlusion, dark seam halos, specular highlights and directional light gradients. Use UNLIT FLAT BASE COLOURS with existing intrinsic texture and thin contour lines. No darkened side faces or interiors caused by lighting; retain naturally dark materials. No redesign, new props, cropping or new text. White background unchanged. Scene lighting will be added later in 3D.

The mug required a second edit using its first revision as input:

Keep this exact mug reference sheet geometry, dimensions, five views, labels, handle and rim shapes. Remove ALL shading. Use uniform flat cream fill on every ceramic surface including inner cavity, handle, underside, rim and exterior. No darker interior, no highlights, no gradients, no ambient occlusion, no cast shadows. Explain openings, rim thickness and handle boundaries ONLY with fine contour lines, like a flat-colour technical diagram. White background. Do not redesign or change any lettering.

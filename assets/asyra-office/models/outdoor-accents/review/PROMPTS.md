# Outdoor Accents - Image Generation Prompts

Generated with the built-in image tool. Source: `../../architecture/review/approved-office-reference.jpg`. Final sheets are pending user review. No models were generated.

The bench result uses four seat slats instead of the initial three; documents follow the final drawing. The sign top view was corrected to the same open pose. Dimensions and hidden construction follow the JSON, not estimated pixels or image annotations. Wooden sign spreaders follow the generated appearance.

## Park bench - initial prompt

Use case: stylized-concept. Create a five-view sheet of ONE OUTDOOR PARK BENCH from the lower-right riverside park in the provided office reference, where the cap-wearing agent sits. Match warm wood slats and simple dark metal frame, cozy miniature look. No human, animal, cups or setting. One bench with exactly THREE horizontal wood seat slats and THREE horizontal wood back slats, four simple black metal legs, one rounded black metal armrest at each end. Slightly softened wooden edges; short practical proportions. Width 1.20 m, depth about 0.50 m, height 0.72 m, seat top 0.36 m. Hidden slat count and support structure are explicit simple completions. Five views FRONT, RIGHT (true side), BACK, TOP, THREE-QUARTER; same slats/frame/legs in all views. No ornamental iron scrolls, bolts, logos, cushions, floor or additional objects. Neutral white sheet with English title 'PARK BENCH - SINGLE UNIT', English labels, no dimension text needed. Intrinsic wood grain only, matte dark frame; no cast/contact shadows, ambient occlusion, glossy glints or baked lighting. Refer to the park bench in the image, not the indoor sofa or orange chair.

## Entry chalkboard - initial prompt

Use case: stylized-concept. Create one five-view asset sheet of the WOODEN A-FRAME CHALKBOARD standing beside the CENTRAL OFFICE entrance in the provided reference. Match its warm oak narrow frame, dark charcoal blackboard, four wooden feet/two leaning frames, simple top hinge, and handwritten white chalk words EXACTLY on FOUR lines: 'Good' / 'Ideas' / 'Live' / 'Here', with one simple arrow pointing RIGHT underneath. This is ONE complete freestanding folding-sign unit in its OPEN pose, not just the front blackboard panel. Compact approximate outer width 0.40 m, open depth 0.37 m, height 0.68 m. Five views FRONT (legible exact four lines and arrow), RIGHT (true A-profile showing both front and rear leaning panels), BACK (plain charcoal rear panel with wood frame, no lettering), TOP (narrow view of two frames and hinge), THREE-QUARTER (front wording, side support visible). Keep writing consistent, no extra slogan, no logo. Both leaning frames meet near the top, bottom feet spread apart, one simple horizontal side spreader on each side. No wheel, handle, plant, doorway, wall, ground, other sign or furniture. White sheet, English title 'A-FRAME CHALKBOARD - SINGLE UNIT', English view labels. Matte materials, subtle intrinsic wood grain, no shadows or ambient occlusion, no glare, no baked gradients. Source appearance and words are mandatory; hidden back and mechanical geometry are authored completions.

## Entry chalkboard - first top-view correction

Edit this asset sheet. Preserve FRONT, RIGHT, BACK and THREE-QUARTER exactly. Replace ONLY the TOP view: true orthographic overhead view of the SAME OPEN A-frame sign, width horizontal 0.40m and open depth vertical 0.37m. It must look roughly square in footprint, with the two leaning board panels visible as rectangles projecting from the narrow shared top hinge line at the middle toward the front and rear foot lines. Four wooden corner feet, two side spreaders. NOT two narrow vertical rails and NOT a folded sign. Keep all five labels and white background. No cast shadows. Remove the upper-right dimension annotation block; documentation owns exact dimensions. Keep the rest unchanged.

## Entry chalkboard - rectangular projection correction

The first edit incorrectly tapered rectangular boards into an hourglass. The following correction restores constant-width board projections.

Correct ONLY the TOP drawing in this sheet. It is geometrically wrong: the rectangular boards must NEVER taper into triangles or an hourglass. Replace TOP with a simple technical top orthographic projection: ONE SQUARE outline, four perfectly parallel straight vertical wooden rails at the left and right edges (front/rear halves share alignment). TWO DARK RECTANGLES stacked vertically, each SAME CONSTANT WIDTH. A full-width horizontal wooden hinge ridge across the exact middle. Horizontal wood bottom rails across the top and bottom outer edges of the square. NO diagonal lines, NO triangles, NO taper, NO central vertical barrel. The two rectangular board projections meet along a horizontal full-width ridge. Top view fills a 180 by 166 pixel rectangle. Preserve other four drawings and all text unchanged. White background, no cast shadows.

## Lighting revision - 2026-10-04

Edited the existing current sheets individually using imagegen. Preserved the original reference and historical files. The user authorized committing this output. Numeric specifications were not changed.

Files:

- `01-park-bench-v1.png`
- `02-entry-chalkboard-v1.png`

Submitted prompt:

Edit the supplied asset design sheet ONLY to remove illumination. Preserve EXACT existing object shapes, geometry, silhouettes, part counts, arrangements, cameras, labels, dimensions, text and intrinsic colour palette. Do not redesign anything. Remove all cast shadows, ground/contact shadows, ambient occlusion, dark crevice lighting, specular highlights, reflected light and directional shading gradients. Show flat intrinsic base colours plus original material grain/weave and fine contour/part-boundary lines to explain depth. Same material must have same base brightness across front/side/top, not a shaded side. Dark actual materials and actual gaps remain identifiable, but no soft dark halo or painted depth. Blank background stays blank. Do not add floor, props or decorations. Keep all views and sheet lettering. This is an UNLIT MODEL REFERENCE, scene lighting will be added later in 3D.

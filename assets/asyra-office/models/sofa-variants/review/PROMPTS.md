# Sofa Variants - Image Generation Prompts

Generated with the built-in image tool. Each call used the approved sofa sheet `../../furniture/review/03-sofa-v1.png` first and the original office `../../architecture/review/approved-office-reference.jpg` second, relative to this file. These are new shapes in the existing style. No external service, CLI fallback, Blender or model exports.

## sectional

```text
Use case: stylized-concept. Design ONE L-SHAPED SOFA in the exact visual family of the supplied approved green sofa sheet: muted sage upholstery #78836A, softly rounded thick cushions and armrests, short dark wooden feet #584333, cozy miniature proportions. The second image is the central office style reference; this new L shape is an authored extension, not an object already visible there. Top-view plan must be an L: a two-place wide rear seat with a chaise projecting FORWARD ON THE VIEWER'S RIGHT when looking at FRONT. Overall width 1.80 m, maximum depth 1.15 m, height 0.70 m, seat top 0.34 m. Rear straight section depth 0.65 m; right chaise total depth 1.15 m. Exactly TWO seat cushions: one shorter wide cushion on LEFT, one longer chaise cushion on RIGHT; exactly two back cushions along the rear, one continuous low rear shell, one arm at each outer side. No added loose pillows, buttons, quilting or cup holders. Six short dark round feet, positioned underneath the L footprint, not floating. FIVE views FRONT, RIGHT (right-side true profile showing longer chaise), BACK (rear shell), TOP (true plan showing L footprint and right chaise), THREE-QUARTER. Every view is the SAME right-chaise unit; never mirror it or separate the chaise. Neutral white sheet, English title 'L-SHAPED SOFA - SINGLE UNIT'. No dimensions text needed. NO room, floor, carpet, person, shadows, ambient occlusion or baked highlights. Subtle intrinsic woven fabric only, consistent soft bevels and rounded edges. Keep the family simple and faithful to the approved two-seat sofa.
```

## curved

```text
Use case: stylized-concept. Design ONE CURVED SOFA as a coherent variation of the approved green sofa in reference image 1, with the central office image 2 providing style only. Muted sage upholstery #78836A, rounded thick cushions and arm ends, short dark wooden cylindrical feet #584333, simple cozy miniature proportions. Plan shape is one 120-DEGREE ARC, concave FRONT and convex BACK; not a circle, not an L, not a straight sofa with decorative curved back. Same curved footprint in all views. Approximate total width 1.73 m and footprint depth 0.825 m, height 0.70 m, seat top 0.34 m. Exactly THREE equal curved wedge seat cushions and THREE matching curved back cushions. Continuous curved lower base and continuous curved rear shell. One rounded armrest at each end of arc, no intermediate armrests. Six short wooden feet under footprint. FIVE views FRONT (concave side), RIGHT (true side profile), BACK (convex rear shell), TOP (true overhead, clearly showing 120-degree annular-sector sofa), THREE-QUARTER (concave seating side). No loose pillows, buttons, quilting, table, rug, room or extra units. English title 'CURVED SOFA - SINGLE UNIT', five English labels, white sheet. No dimension annotations. No cast/contact shadows, ambient occlusion, glare or baked gradients; subtle intrinsic cloth weave. This is a new permitted shape in the approved sofa's style, not a claim that the original office already contained it.
```

## Lighting revision - 2026-10-04

Edited the existing current sheets individually using imagegen. Preserved the original reference and historical files. The user authorized committing this output. Numeric specifications were not changed.

Files:

- `01-l-shaped-sofa-v1.png`
- `02-curved-sofa-v1.png`

Submitted prompt:

Edit the supplied asset design sheet ONLY to remove illumination. Preserve EXACT existing object shapes, geometry, silhouettes, part counts, arrangements, cameras, labels, dimensions, text and intrinsic colour palette. Do not redesign anything. Remove all cast shadows, ground/contact shadows, ambient occlusion, dark crevice lighting, specular highlights, reflected light and directional shading gradients. Show flat intrinsic base colours plus original material grain/weave and fine contour/part-boundary lines to explain depth. Same material must have same base brightness across front/side/top, not a shaded side. Dark actual materials and actual gaps remain identifiable, but no soft dark halo or painted depth. Blank background stays blank. Do not add floor, props or decorations. Keep all views and sheet lettering. This is an UNLIT MODEL REFERENCE, scene lighting will be added later in 3D.

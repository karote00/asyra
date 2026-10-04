# Tea Furniture - Image Generation Prompts

Generated with the built-in image tool. Both calls used `../../architecture/review/approved-office-reference.jpg` relative to this file. No external service, CLI fallback, Blender or model exports.

## table

```text
Use case: stylized-concept. Create one clean five-view asset design sheet of the ROUND WOODEN TEA TABLE in the rear meeting nook inside the CENTRAL OFFICE of the reference, directly in front of the agent with black glasses and beside the orange chair, below the large clock. Do not use the low coffee table in front of the green sofa at the front of the office. Match warm light oak top, compact round silhouette, simple dark wood support legs, cozy miniature style. One table only. Diameter 0.68 m, total height 0.58 m, top thickness 0.035 m. Exactly four short straight slightly outward-splayed tapered wooden legs, evenly arranged in a square under the round top. Underside has a simple small square support apron between legs. Exact hidden support layout is an authored completion. Table top is plain empty wood, softly rounded rim, no inlay, drawer, metal fasteners or ornament. FIVE views FRONT, RIGHT, BACK, TOP (perfect circle), THREE-QUARTER (show four-leg construction). Same unit every view. No mugs, plant, people, chair, rug or floor. White sheet, English title 'ROUND TEA TABLE - SINGLE UNIT', five English view labels; footer 'Diameter 0.68 m | Height 0.58 m'. Subtle intrinsic oak grain, no baked lighting, no cast/contact shadow, no ambient occlusion or glossy reflection. Preserve the central office's simple rounded proportions.
```

## chair

```text
Use case: stylized-concept. Create one clean five-view design sheet of the ORANGE TEA CHAIR in the rear nook of the CENTRAL OFFICE reference, beside the round wooden table and facing the agent with glasses below the clock. Do not copy the lower orange lounge armchair beside the front sofa. A compact cozy miniature orange upholstered bucket-style chair, one continuous curved wraparound back descending into short low side arms, one plain softly rounded seat cushion, exactly four dark wood tapered legs slightly splayed. Muted burnt-orange fabric #BF753D. Width 0.44 m, depth 0.46 m, height 0.65 m; seat top 0.33 m. Front open for legs, back wraps around only the rear and sides. No separate cushion on back, no buttons, piping, loose pillow, footrest, desk wheels or metal base. FIVE views FRONT, RIGHT, BACK, TOP (clearly show continuous U-shaped rear shell and open front), THREE-QUARTER. Consistent same chair in every view, four legs with occlusion only. English title 'TEA CHAIR - SINGLE UNIT', five view labels, no dimension labels required. White sheet, no table, other chairs, person, cup, plant or floor. No cast/contact shadows, ambient occlusion, highlights or baked gradients; faint intrinsic fabric weave only. Back geometry and exact leg placement are explicit simple completions of the partially occluded source chair.
```

## Lighting revision - 2026-10-04

Edited the existing current sheets individually using imagegen. Preserved the original reference and historical files. The user authorized committing this output. Numeric specifications were not changed.

Files:

- `01-round-tea-table-v1.png`
- `02-tea-chair-v1.png`

Submitted prompt:

Edit the supplied asset design sheet ONLY to remove illumination. Preserve EXACT existing object shapes, geometry, silhouettes, part counts, arrangements, cameras, labels, dimensions, text and intrinsic colour palette. Do not redesign anything. Remove all cast shadows, ground/contact shadows, ambient occlusion, dark crevice lighting, specular highlights, reflected light and directional shading gradients. Show flat intrinsic base colours plus original material grain/weave and fine contour/part-boundary lines to explain depth. Same material must have same base brightness across front/side/top, not a shaded side. Dark actual materials and actual gaps remain identifiable, but no soft dark halo or painted depth. Blank background stays blank. Do not add floor, props or decorations. Keep all views and sheet lettering. This is an UNLIT MODEL REFERENCE, scene lighting will be added later in 3D.

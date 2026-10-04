# Wall Decoration - Image Generation Prompts

Built-in image generation was used; no external paid service or CLI fallback. One call per sheet. The primary reference supplied to each call was `../architecture/review/approved-office-reference.jpg` (resolved from the group directory). No Blender or model exports were produced.

## Clock

```text
Use case: stylized-concept. Create one clean multi-view asset design sheet for ONE large round wall clock, matching precisely the clock on the upper back wall of the CENTRAL OFFICE in the provided reference (not shop exteriors). Warm cozy miniature 3D style, simple smooth geometry. Dark brown/charcoal narrow circular rounded rim, warm ivory dial, exactly twelve short dark hour indices, NO numerals, NO lettering or logo on face, two dark tapered hands pointing to 1 and 7 (time 1:35), small dark center pin. No glass glare. Five clearly separated views of the SAME clock: FRONT, RIGHT, BACK, TOP, THREE-QUARTER, English labels only. Diameter 0.60 m, depth 0.055 m; consistent geometry and hand positions. Plain flush dark circular back with no battery compartment, screws, keyholes or ornament (hidden back is a deliberately simple design completion). In side/top views show thin flat cylindrical housing with slightly rounded front rim. Clean white sheet, flat diffuse neutral illumination for legibility only, NO cast/contact shadows, no ground plane, no ambient occlusion, no baked highlights, no wall or props. Main front view large, other four views well spaced; side and top thin but legible. Title 'WALL CLOCK - SINGLE UNIT'. Small footer 'Diameter 0.60 m | Depth 0.055 m'. Reference image is appearance authority; isolate only the clock.
```

## Vertical

```text
Use case: stylized-concept. Create a clean multi-view design sheet of ONE paper-thin VERTICAL WALLPAPER STRIP, for the cozy miniature CENTRAL OFFICE in the reference. Match the sage green and pale warm cream stripes on the central office tea-point wall. It is a single independently placeable flat rectangle, NOT a wall, NOT an assembled room. Width 0.40 m, height 1.20 m, thickness 0.001 m. Front pattern: leftmost 0.10 m cream, central 0.20 m muted sage green, rightmost 0.10 m cream: only ONE broad green stripe, no borders. These halves of cream allow seamless repeated strips. Back unprinted warm cream, edges cream. Perfect flat rectangular corners, no trim, backing board, curl, frame or bevel. FIVE views FRONT, RIGHT, BACK, TOP, THREE-QUARTER; consistent single strip in all views, with visually hairline thin side/top profiles. Color samples Sage #89977A and Cream #E7D7B4. English labels only; title 'VERTICAL WALLPAPER - SINGLE STRIP'; footer '0.40 x 1.20 m | Paper thickness 1 mm'. Clean white sheet; neutral flat color, NO cast/contact shadows, no ambient occlusion, no highlights or shaded wall. Keep face uniform and texture-free, no paper fibres. Only one strip per view. No complete wall or furniture. Source reference governs front colors and stripe character; back and exact sizes are design completions.
```

## Horizontal

```text
Use case: stylized-concept. Create a clean multi-view design sheet of ONE paper-thin HORIZONTAL WALLPAPER STRIP. This is a 90-degree in-plane rotated variant of the CENTRAL OFFICE tea-point sage-and-cream wallpaper in the reference; the rotation is an authored variation, NOT a claim the original has horizontal stripes. Single independent flat rectangle: width 1.20 m, height 0.40 m, thickness 0.001 m. Front pattern from bottom to top: 0.10 m cream, 0.20 m muted sage green, 0.10 m cream: exactly ONE broad green stripe running horizontally, no borders. Back plain warm cream, edges cream. Exact color samples Sage #89977A and Cream #E7D7B4. No wall, backing board, frame, raised trim, curl or bevel. FIVE separate views FRONT, RIGHT, BACK, TOP, THREE-QUARTER, consistent same geometry; side/top profiles hairline thin. English title 'HORIZONTAL WALLPAPER - SINGLE STRIP'; footer '1.20 x 0.40 m | Paper thickness 1 mm'. Clean white multi-view sheet with neutral flat colors, no fibres or texture. NO cast/contact shadows, no ambient occlusion, no glossy highlights. One strip per view, no assemblies, no other objects. The reference is the style and palette authority; only rotate the strip orientation.
```

## Clock correction - revision 2

The first clock sheet omitted two front indices and was not copied into the deliverable. Revision 2 used that sheet and the original office reference as inputs. The delivered clock sheet is `01-wall-clock-v2.png`.

```text
Edit the supplied wall clock multi-view sheet. Keep its composition, all English labels, dark rounded narrow rim, warm ivory dial, plain flat rear, dimensions and five views. Correct the front and three-quarter dial to show EXACTLY TWELVE short capsule hour indices, uniformly spaced at ALL 12 clock positions, one every 30 degrees; the previous front view accidentally omitted indices at approximately 1 o'clock and 10 o'clock. Every index must be visibly separate from the hands, which must end inside the inner edge of the indices. Keep exactly two tapered hands, hour hand at 47.5 degrees clockwise from 12, minute at 210 degrees, center pin. Front dial appearance is same as the CENTRAL OFFICE clock in the second reference. Remove cast shadows and dark contact-shading around the marks and hands; flat neutral ivory and brown materials without baked shadows, no gloss gradients. No extra dots, numerals, ticks, hands, borders, text changes, wall or props. Side and top remain thin clock profiles. This is an asset sheet, not a scene.
```

## Lighting revision - 2026-10-04

Edited the existing current sheets individually using imagegen. Preserved the original reference and historical files. The user authorized committing this output. Numeric specifications were not changed.

Files:

- `01-wall-clock-v2.png`

Submitted prompt:

Edit the supplied asset design sheet ONLY to remove illumination. Preserve EXACT existing object shapes, geometry, silhouettes, part counts, arrangements, cameras, labels, dimensions, text and intrinsic colour palette. Do not redesign anything. Remove all cast shadows, ground/contact shadows, ambient occlusion, dark crevice lighting, specular highlights, reflected light and directional shading gradients. Show flat intrinsic base colours plus original material grain/weave and fine contour/part-boundary lines to explain depth. Same material must have same base brightness across front/side/top, not a shaded side. Dark actual materials and actual gaps remain identifiable, but no soft dark halo or painted depth. Blank background stays blank. Do not add floor, props or decorations. Keep all views and sheet lettering. This is an UNLIT MODEL REFERENCE, scene lighting will be added later in 3D.

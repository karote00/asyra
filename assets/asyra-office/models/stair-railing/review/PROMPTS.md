# Stair Railing - Actual Prompts

Built-in imagegen was used; no fallback CLI. Initial calls were text-only supplementary designs. The baluster correction used its first generated sheet as an edit target. Only the selected corrected baluster is included in this handoff.

## 1. Stair baluster

```text
Use case: stylized-concept. Six-view single modular stair baluster reference sheet for cozy miniature office. White background. FLAT solid charcoal #383A38 intrinsic color on all faces, thin black contours. Absolutely NO shadows, shading, gradients, AO, ground, lights, reflections, attached stairs or rails. One simple narrow square metal post, 0.04m X width,0.04m Y depth, bottom horizontal at Z0, top slants upward toward +X: left top Z0.89m, right top Z0.91m. Top centre height0.90m. No baseplate, no foot, no knobs, no bevel, no hardware, no other parts. FRONT and BACK tall narrow silhouette, RIGHT narrow tall rectangle, TOP/BOTTOM small squares, THREE-QUARTER standing thin prism showing slanted cut on top. Enlarge a separate labeled TOP CUT DETAIL to make slope visible. Text English only: STAIR BALUSTER - SINGLE UNIT, 0.04 x 0.04 x 0.91 m. All view labels accurate, no array. It is one independently placeable post with angled top, not a complete railing.
```

## 2. Sloped handrail

```text
Use case: stylized-concept. Six-view standalone single sloped handrail segment reference sheet for cozy miniature office. White background. FLAT solid charcoal #383A38 intrinsic color on EVERY face with thin dark contours ONLY. NO shadows, lighting, shading, gradients, AO, reflections, floor, stairs or posts. A simple solid parallelepiped, horizontal X run0.30m, Y depth0.04m, rise0.15m, vertical thickness0.04m. Both end cuts VERTICAL, NOT perpendicular to slope. Lower end at X0 has bottomZ0 and topZ0.04; upper end X0.30 has bottomZ0.15 topZ0.19. Front elevation long thin bar sloping UP TO RIGHT26.565degrees, back slopes up LEFT when looking from back. RIGHT end view narrow rectangle0.04wide x0.19 projected overall height (far lower end may be shown with thin hidden contour), TOP/BOTTOM horizontal narrow rectangle0.30x0.04. THREE-QUARTER shows the same solid rising bar, absolutely no curve, bevel, posts, fittings or additional rails. Title SLOPED HANDRAIL - SINGLE SEGMENT. Caption RUN 0.30 m - RISE 0.15 m - DEPTH 0.04 m. English labels FRONT RIGHT BACK TOP BOTTOM THREE-QUARTER. Every view shows one segment only.
```

## 3. Baluster rear-view correction

```text
Correct ONLY the BACK VIEW (second tall post from left) in this technical reference sheet: its top must slope DOWN toward the RIGHT, upper LEFT edge at Z0.91 and lower RIGHT edge Z0.89, because rear viewing reverses horizontal direction. Keep the FRONT view ascending right, all other geometry, dimensions, labels, white background and layout unchanged. Maintain flat solid charcoal, no shadows or highlights. Do not change any other view.
```

## 4. Baluster top-cut correction - 2026-10-06

Input: `01-stair-baluster-v2.png`. Output: `01-stair-baluster-v3.png`.
Tool: built-in imagegen. Candidate awaiting user review.
The prompt requests preservation of the other views; this is an instruction,
not proof of pixel-identical preservation.

```text
Use case: precise-object-edit. Correct the supplied stair-baluster geometry reference sheet. Only edit the TOP CUT DETAIL inset on the right; preserve all main views, title, dimensions, locations, FRONT/BACK/RIGHT/TOP/BOTTOM/THREE-QUARTER. This is a shape consistency repair, no redesign or materials work.

The current TOP CUT DETAIL wrongly collapses the top to a triangle. Replace it with a zoomed version of the SAME FOUR-CORNER sloped top shown by the main THREE-QUARTER post. The solid has square footprint40x40mm. Its top is ONE planar rectangle, with four clearly visible and distinct vertices; two opposite edges run parallel at equal heights. Never draw a triangle, a ridge, a second cap, bevel, twisted saddle or tapered post.

Mathematical authority: X from-.02 to+.02 metres; Y from-.02 to+.02; top Z=.90+.5X. Front-left A=(-.02,-.02,.89), front-right B=(+.02,-.02,.91), rear-right C=(+.02,+.02,.91), rear-left D=(-.02,+.02,.89). A and D are the two low corners89cm; B and C the two high corners91cm. A-B-C-D forms the one sloped top rectangle. Extrude the corner vertical edges straight down out of inset. Select an elevated oblique camera so the whole four-sided top is broad and unmistakable; preserve consistent solid face geometry. Flat neutral charcoal face fills, crisp outlines, no cast shadows, no lighting gradients.

Inside inset: remove the old misleading leader arrows. Use four clear corner identifiers A,B,C,D at their corresponding vertices with short leaders if necessary. Under the top, in white annotation space, write exactly:
"A, D: Z = 0.89 m"
"B, C: Z = 0.91 m"
"Centre: Z = 0.90 m"
The centre value describes the face centre, not a corner; no arrow falsely points to an edge midpoint. Preserve TOP CUT DETAIL heading and boundary box. If needed make this inset taller downward using existing blank right-side area, without overlapping main THREE-QUARTER view.
All other main views and labels must remain. No new materials, shadows, accessories or model variants.
```

## 5. Handrail end-cut correction - 2026-10-06

Input: `02-sloped-handrail-v1.png`. Built-in imagegen output:
`02-sloped-handrail-v2.png`. This attempt was not accepted: its oblique
appearance remained ambiguous and its world datum was unverified.
The v3 calculated diagram instead uses `draw-handrail-projections.py`;
it has no image-generation prompt.

```text
Edit this sloped handrail reference sheet. Keep the FRONT, BACK, RIGHT, TOP and BOTTOM illustrations, labels, title and dimension text. Replace only the bottom-right THREE-QUARTER illustration with a clear engineering oblique illustration of the exact same sloped parallelepiped specified by FRONT and BACK. The crucial requirement: this is a SHEARED rectangular prism, NOT a rectangular cuboid rigidly rotated uphill. Both end cuts are world-VERTICAL planes, never perpendicular to the long axis. Long side face is a parallelogram with acute/obtuse end angles, not a rectangle. Top and underside rise 15cm for a horizontal run of 30cm; vertical thickness 4cm, transverse depth4cm. Eight vertices in metres are (0,+/-.02,0),(0,+/-.02,.04),(.30,+/-.02,.15),(.30,+/-.02,.19). Low end cut X=0 and high end cut X=.30 are vertical 4x4cm rectangles. All vertical edges remain screen vertical; show the low end and long side and broad top clearly. Use an elevated view from negative X and negative Y, with the long axis ascending toward screen right. Clearly slanted long edges meet vertical end edges, never 90-degree beam-end junctions. Flat charcoal fills with outline edges, white background, no shadows, lighting effects or ground.
To remove ambiguity add below or beside the replacement view a small labelled world-horizontal dashed datum, and label "VERTICAL END CUTS" with leaders to the vertical end edges at left and right. The datum must be horizontal in world coordinates and drawn in the same projection, not erroneously treated as a screen-horizontal line. If space is limited prioritize correct geometry and omit the datum. No new cap, bevel, post, fittings or rounded ends. Match a clean technical reference drawing. Do not redesign the other views. Main title and dimensions unchanged.
```

# Railing Transitions - Actual Prompts

## 8. Complete-sheet repair - 2026-10-07

The imagegen v7 attempt used the following prompt and was not selected.
The v8 final candidate is the requested direct replacement into the complete
sheet, reproduced by `draw-lower-post-oblique.py`.

```text
Repair this FULL reference sheet, editing only the THREE-QUARTER post in its upper right. User explicitly rejects the extra kink/notch in its far high top edge. Remove the extra vertex at the uppermost rear edge: the highest transverse end edge must be ONE straight unbroken segment from the highest back corner to the highest front corner. NO dip, dent, kink, step, ridge or bent line along that high transverse edge. Preserve exactly TWO quadrilateral top faces, low face level, high face inclined, with their shared transverse edge. Their top outer perimeter has six vertices total, not seven. The perimeter consists of a straight low transverse edge, two front longitudinal segments (level then ascending), a straight high transverse edge, and two back longitudinal segments (ascending then level when reversed). Both transverse end edges and the shared middle transverse edge must be parallel to one another in this orthographic oblique view. The two boundaries of the level half must be parallel; the two rising boundaries of the inclined half must be parallel. All three transverse edges have the same width. The rear high corner must lie directly where the existing uphill back side meets the straight high-end line, without an extra kink afterwards. Use light grey #C8CCD0 with black outlines and no shadows. Keep lower post body straight. Keep all other main views, enlarged front detail, labels, numeric dimensions, page layout, and DEFAULT #383A38 caption unchanged. Return the COMPLETE original multiview sheet, not a separate detail sheet.
```

Built-in imagegen, one text-only call per initial asset. The lower post was then edited using its initial sheet as the image target. Only selected final images are included. No fallback CLI was used.

## 1. Upper transition post

```text
Use case: stylized-concept. Technical multiview reference sheet of ONE very simple square charcoal stair transition post, for miniature office. White background, FLAT uniform charcoal #383A38 intrinsic color, contour lines only. No lighting, shadows, gradients, AO, highlights, textures, floor, stairs, rails, foot, collars or extra objects. Six labeled views FRONT RIGHT BACK TOP BOTTOM THREE-QUARTER plus a LARGE accurate FRONT TOP PROFILE DETAIL with dimension labels. All text English. Square footprint0.04 x0.04 m, flat bottomZ0. Top consists of two faces meeting exactly at X0, no gap or added block. Top view square split at centre X. Back is mirrored relative front. UPPER TRANSITION POST - SINGLE UNIT. Full bounds0.04 x0.04 x0.90m. Top profile FRONT: left edgeX=-0.02 Z0.89, centreX0 Z0.90, right edgeX+0.02 Z0.90. Thus LEFT HALF top rises toward right, then RIGHT HALF is flat. This is a clipped upper-left corner of an otherwise straight tall square post. BACK: LEFT HALF flat, RIGHT HALF slopes down right. RIGHT view tall rectangle. Big front detail must show rising-left-half followed by flat-right-half with dimension arrows 0.89m /0.90m /0.90m. Sloped face extends through full depthY. No rail attached.
```

## 2. Lower transition post

```text
Use case: stylized-concept. Technical multiview reference sheet of ONE very simple square charcoal stair transition post, for miniature office. White background, FLAT uniform charcoal #383A38 intrinsic color, contour lines only. No lighting, shadows, gradients, AO, highlights, textures, floor, stairs, rails, foot, collars or extra objects. Six labeled views FRONT RIGHT BACK TOP BOTTOM THREE-QUARTER plus a LARGE accurate FRONT TOP PROFILE DETAIL with dimension labels. All text English. Square footprint0.04 x0.04 m, flat bottomZ0. Top consists of two faces meeting exactly at X0, no gap or added block. Top view square split at centre X. Back is mirrored relative front. LOWER TRANSITION POST - SINGLE UNIT. Full bounds0.04 x0.04 x0.91m. Top profile FRONT: left edgeX=-0.02 Z0.90, centreX0 Z0.90, right edgeX+0.02 Z0.91. Thus LEFT HALF top is horizontal, then RIGHT HALF slopes upward toward right. BACK: LEFT HALF slopes downward right, RIGHT HALF flat. RIGHT view tall rectangle. Big front detail must show flat-left-half then rising-right-half with dimension arrows0.90m /0.90m /0.91m. Sloped face extends through full depthY. No rail attached.
```

## 3. Lower post correction

```text
Correct this lower transition post sheet. The LARGE bottom profile already correctly shows a horizontal LEFT HALF followed by an upward-sloping RIGHT HALF. Make the TOP OF THE FULL FRONT POST match it exactly: left half HORIZONTAL, then right half ascending. Make full BACK view mirror this: left half descending then right half HORIZONTAL. The three-quarter post must have TWO top faces and a visible centre boundary (one flat half, one sloping half), not a single slanted top. Keep flat dark charcoal, white background, every dimension and other view unchanged. Add small header LOWER TRANSITION POST - SINGLE UNIT if space permits. No lighting/shadows. Do not alter the correct large detail.
```

## 4. Upper post review recolouring - 2026-10-07

Input: `01-upper-transition-post-v1.png`. Output candidate:
`01-upper-transition-post-v2.png`. Built-in imagegen.
Review colour only; model default remains `#383A38`.

```text
Edit this existing engineering reference sheet ONLY to recolour the post surfaces. Replace the dark charcoal fills of the upper transition post in every main view and enlarged detail with uniform light grey #C8CCD0 for visual inspection. Preserve all silhouettes, vertices, the left-sloped/right-flat top geometry, geometric boundary lines, dimensions, annotations, view locations, text and layout. Keep contour and boundary lines black and clearly visible. White background. No lighting, no shadows, no gradients, no texture, no changes to geometry, no added bevels or parts. Add a small clear English caption in unused white space: 'REVIEW COLOUR ONLY - DEFAULT: #383A38'. This light grey is a review-display override only; the actual model's default remains the original charcoal #383A38. Keep all dimensions and all existing labels legible; no invented details.
```

## 5.Lower post review recolouring - 2026-10-07

Built-in imagegen. Input v2; output v3 rejected because the oblique top lost one face.

```text
Recolour this LOWER TRANSITION POST engineering reference sheet only. Change all charcoal object fills in every view and the enlarged front detail to light grey #C8CCD0. Keep the black outlines, dimensions, text, white background, view arrangement, and geometry. Top profile must remain LEFT HALF LEVEL at Z0.90 then RIGHT HALF RISING to Z0.91, with centre X0 at Z0.90. Do not change silhouettes or introduce cap, bevel or extra part. No shadows, gradients, lighting, reflections or textures. Add a small clear caption 'REVIEW COLOUR ONLY - DEFAULT: #383A38' in unused white space. The original charcoal #383A38 remains the model's default; grey is a review-display override. Preserve all numeric labels and geometric edges.
```

## 6. Lower post top-face correction - 2026-10-07

Built-in imagegen. Input v3; output v4 is a correction candidate.

```text
Correct ONLY the THREE-QUARTER post top in this light-grey lower-transition-post sheet. Recolouring accidentally removed the LEVEL half top face, turning it into a single slope. Restore TWO distinct top faces through the full depth: low half X=-.02..0 is HORIZONTAL at Z=.90; high half X=0...02 slopes from Z=.90 to .91. The front top edge must have TWO segments: first flat then rising, with an obvious intermediate corner. The back top edge has the same two segments. Connect their middle corners across depth as a visible line separating two quadrilateral faces. The top perimeter thus has SIX corners, not four. It is one solid post, no cap or groove. Change the top camera slightly if essential so both quadrilateral half-faces are clearly visible. Keep light-grey fill, black boundaries, full lower vertical body unchanged, all text and dimensions, other five views and enlarged detail unchanged. No single-plane diagonal top. Additionally straighten TOP view centre divider to a vertical line at exact half width (parallel to its left/right edges), instead of current tilted line. Keep DEFAULT #383A38 caption. No shadows or new geometry.
```

## 7. Lower post oblique correction - 2026-10-07

Actual imagegen v5 prompt:

```text
Edit ONLY the upper-right THREE-QUARTER illustration on this sheet; preserve all other five views, enlarged detail, text, dimensions, captions, grey colour and white background. Replace that entire small oblique post with a correct lower-transition post, with an elevated oblique camera exposing both quadrilateral top faces. The previous high half incorrectly collapses into a triangle. The top MUST have six distinct perimeter corners and an internal shared edge, two FOUR-SIDED faces, no triangular face. Numeric geometry: X=-.02..+.02, Y=-.02..+.02, bottom Z=0. Low half X=-.02..0 is level Z=.90; high half X=0...02 is Z=.90+.5X. At Y=-.02, top polyline A=(-.02,-.02,.90),B=(0,-.02,.90),C=(.02,-.02,.91); at Y=+.02, D=(-.02,.02,.90),E=(0,.02,.90),F=(.02,.02,.91). Top faces are A-B-E-D and B-C-F-E, shared edge B-E. Both faces must be fully visible, their four corners clearly separated, with visible bend in BOTH A-B-C and D-E-F perimeter polylines. Choose front-left elevated camera (negative X, negative Y, positive Z), high enough to avoid edge-on compression. Widen the oblique illustration within its existing white area if necessary for readability while preserving correct physical square footprint. Keep post tall. Do not add a top cap, groove, ridge, bevel or any extra solid. One continuous post. Light grey #C8CCD0 fill, black edge lines, no shadows or textures. Never depict a peaked roof or triangular wedge. Only two quadrilateral top surfaces meeting at their shared slope-change edge. The high-end edge C-F must remain a clearly visible transverse line, never a single point.
```

The built-in imagegen v5 attempt targeted six distinct top corners and two
quadrilateral faces but introduced an extra kink; it was rejected.
The v6 numeric replacement is generated by `draw-lower-post-oblique.py`,
without image generation or source-raster modification.


## 8. Lower post complete calibrated sheet - v9

No imagegen prompt: generated as a new technical diagram by
`draw-lower-post-sheet.py` from `../railing-transitions-model-spec.json`.
All six main views use 700 px/m; both detail views use 7000 px/m.
Oblique screen-right is (0.8,-0.6,0), screen-up is (0.36,0.48,0.8).
The cropped detail begins at Z=0.875 m and uses dashed display boundaries.
Output is `02-lower-transition-post-v9.png` (1800 x 1750 pixels), with a
separate diagnostic top crop. This supersedes the mixed-scale lower sheets;
it preserves the existing numeric solid and configurable default appearance.

## 9. Accepted lower-post single-sheet redraw - v14

The user accepted v14 on 2026-10-07. Built-in imagegen; edit target v12,
with the accepted v9 top-detail geometry as a supporting reference only.
v9-v11 layouts are superseded; the active reference is the single v14 sheet.
The pixel coordinates below were generation constraints, not replacement
model dimensions or a claim that imagegen reproduced exact pixel positions.

Actual prompt:

```text
Image editing task: keep the entire first sheet exactly as it is EXCEPT the upper-right THREE-QUARTER illustration. Redraw that post's TOP to be an exact scaled version of the approved top shown in image 2. The important feature is a visibly BENT profile: low half nearly horizontal then high half climbing sharply, on BOTH outer longitudinal edges. Not a single planar roof. Copy the SIX-corner outer silhouette of image 2 and its one dividing line directly. Top screen vertices in clockwise perimeter order: (1322,87), (1345,77), (1368,54), (1403,82), (1380,105), (1357,115). Close back to (1322,87). Draw the shared edge from (1345,77) to (1380,105). Each of the three across-depth edges is the SAME (35,28) vector. Six vertices, two obvious bends, two quadrilateral faces. No extra vertex on the highest edge from (1368,54) to (1403,82). Continue vertical post edges down from (1322,87), (1357,115), (1403,82). Top reference image 2 is authoritative; faithfully scale its shape, no interpretation. Do NOT make the two top faces coplanar, do NOT merge the two perimeter segments into a straight line, and do NOT taper the far edge. Preserve the full landscape single-page diagram, all other five views, dimensions, captions, gray fills, labels, and large bottom detail unchanged. Do not add a panel, shaft break, zoom inset, shadow, cap, or bevel.
```

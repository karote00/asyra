# Manhole Annotation Prompts

## Dimension synchronization - 2026-10-07

Tool: built-in image generation. Input: `05-manhole-annotated-v1.png`.
Selected final output: `05-manhole-dimensioned-v2.png`. Accepted dimensions and topology; final annotation layout user-approved on 2026-10-07. Earlier prompts below describe history, not current numeric authority.

### Dimension update prompt

Edit the supplied single manhole reference sheet. Produce ONE final sheet, preserving its four-view layout, object identity, grey iron appearance, six capsule recesses, separate cover/frame and title. This is a precise annotation update, not a redesign. All text English and large/readable.

Replace every TBD/pending label with the now-approved numeric specifications below. Preserve original four views in the upper region. Enlarge canvas vertically modestly if necessary for a clean numeric footer, do not split into sheets.

Bottom radial half-section between slots: C raised, 1 low, 2 raised, 3 low, 4 raised, outer field low, an EMPTY 4 mm gap, then separate frame. Critically C, 2, 4 and the frame must have EXACTLY THE SAME top height (Z=0); 1,3,outer field share Z=-1 mm. Cover underside Z=-21 mm, separate frame underside Z=-26 mm. Profile is schematic with exaggerated vertical steps to be legible, not to scale. No bridge beneath the gap and no extra lip. Raised regions are continuous with the cover body. Make step boundaries vertical with tiny rounded upper corners, not broad diagonal ramps. Add plain note "Raised C / 2 / 4: +1 mm above base" and retain "Nominal radial gap: 4 mm". Replace "Ring radii: TBD" with "Boundary radii from centre: 45 / 70 / 90 / 125 / 160 mm". Keep C,1,2,3,4 and OUTER FIELD labels above their correct regions, BASE PLANE arrow touching the low surface line.

Add a compact clean numeric footer with EXACT text:
"ALL DIMENSIONS IN mm - NOMINAL BEFORE BEVELS"
"Frame: outer R330 / inner R290 / height 26"
"Cover: R286 / base thickness 20 / maximum thickness 21"
"Raised C / 2 / 4: +1 above base; raised tops flush with frame"
"6 blind slots: 55 x 13 x 2 deep / centre R210 / 60 deg spacing"
"Upper relief bevel: 0.2; frame edges: 1.5; cover perimeter: 1"
"SCHEMATIC - NOT TO SCALE. Numeric specification controls geometry."
No TBD, pending or missing-dimension labels. Do not add any dimension line implying the whole central group is one radius. Do not alter topology, count or add through holes. Exactly one image.

### Final targeted annotation correction

Correct ONLY two annotations in this sheet, preserving all four views, text values, dimensions footer and the section profile exactly.
1. The BASE PLANE arrow currently points into the body. REMOVE the BASE PLANE text and its arrow completely. The correctly positioned dashed line labeled "Z = -1 mm" already defines the base plane unambiguously. Keep Z=0 and Z=-1 dashed lines.
2. REMOVE all horizontal chained dimension arrows and their short vertical extension lines underneath C,1,2,3,4. Keep ONLY the plain centered note "Boundary radii from centre: 45 / 70 / 90 / 125 / 160 mm" without arrows; these are cumulative radii, not individual band widths.
Do not change anything else, do not change geometry or colors or layout. ONE final image.


Tool: built-in image generation. Source: `05-manhole-cover-v2.png`.
Approved annotation sheet: `05-manhole-annotated-v1.png`, user-approved on 2026-10-07.
Original source unchanged; only the final annotation sheet is stored in this project.

## Initial annotation prompt

Use case: precise-object-edit. Edit the supplied original manhole four-view design sheet by adding engineering ANNOTATIONS, not redesigning or repainting the manhole. Preserve all four source views' shape, mottled grey/brown appearance, six radial capsule recesses, existing circular boundaries and open dark annular gap. Retain the 2x2 view arrangement, enlarge white margins and add a bottom annotation strip on this SAME ONE SHEET so text never covers important geometry. All text English. Title MANHOLE COVER - ANNOTATED REFERENCE. Rename FRONT VIEW to LOW FRONT OBLIQUE; keep THREE-QUARTER VIEW, TOP VIEW, SIDE VIEW.
On TOP, place small numbered callouts C,1,2,3,4 for the CENTRAL raised disk and the four concentric annular bands immediately outside it, not the outer slotted field or outer frame. Define clearly with a legend: C - RAISED CENTRE; 1 - BASE PLANE; 2 - RAISED RING; 3 - BASE PLANE; 4 - RAISED RING. Number from centre outward. Leader endpoints must point inside each band, not all at centre. The six capsule slots are recesses; label one with '6 RADIAL RECESSES - 60 deg SPACING'.
On THREE-QUARTER use thin leaders to label REMOVABLE COVER on inner disk, SEPARATE OUTER FRAME on outer ring, OPEN ANNULAR GAP pointing exactly at their dark separation. Add 'Nominal radial gap: 4 mm'. No connecting parts, hinges, screws or extra holes.
In the added bottom strip show ONE simple RADIAL HALF-SECTION SCHEMATIC from centre left to outside right, cut through a direction BETWEEN the six slots. A single continuous solid cover base has its top elevation step sequence LEFT TO RIGHT: C high, 1 low at base plane, 2 high, 3 low at base plane, 4 high, outer field low at base plane. Label each plateau C,1,2,3,4,OUTER FIELD. All five central regions must be drawn once only, no extra bands. The cover underside is flat continuous. At far right STOP the cover with a vertical wall; then show a truly empty white gap; then a separate rectangular frame section, with its OWN underside, NO bridging floor or connection. Mark gap 4 mm NOMINAL. Label 'SECTION BETWEEN RECESSES - SCHEMATIC, NOT TO SCALE'. Show an arrow to raised top 'Rise height(s): TBD' and one beneath C through4 'Ring radii: TBD'. A dashed reference line can label BASE PLANE through the low plateaus. Heights shown symbolically do NOT assign numeric rise or imply equal final heights. Footer 'Relief radii, rise heights and edge treatment pending. Original appearance retained. No model generated.' No new shadows. Keep fonts large and readable on one sheet. Do NOT change actual object geometry; this is annotated interpretation only.

## Schematic correction

Correct ONLY annotations and bottom schematic of this supplied annotated sheet, leaving the four original manhole appearances and their 6 slots intact.
1. Bottom schematic: BASE PLANE must be at the TOP SURFACE of plateaus labelled 1,3,OUTER FIELD. Current dashed line is wrongly buried inside the base. Move dashed BASE PLANE reference up to coincide exactly with those three low top surfaces. The rise-height arrow measures from this corrected level upward to C, not from inside the solid. Keep C,2,4 raised and 1,3,OUTER FIELD low. The right edge of OUTER FIELD must stay at that base-plane elevation all the way to the gap: REMOVE THE EXTRA UPTURNED LIP. End the cover with a plain vertical side wall straight down to its underside. Keep an actual white gap and the independent outer frame. Do not change ring ordering.
2. TOP leader endpoints: use a radial ray straight upward from disk centre, with C dot inside central disk, 1 dot centered in immediately neighboring first annulus, 2 centered in next second annulus, 3 centered in third annulus, 4 centered in fourth annulus. The current 1/2 dots appear too far outward. Each dot must land INSIDE the corresponding annular surface, not on a boundary or the slotted outer field. All five numbered leader labels must match the C,1,2,3,4 order from the centre outwards. Keep the legend.
3. OPEN ANNULAR GAP arrow in three-quarter must end IN the dark empty gap between removable cover and outer frame, not on the frame top outer edge. Maintain large readable English labels and one sheet. Do not introduce new geometry details or exact ring measurements. Section remains symbolic, not to scale, dimensions TBD.

## Final annotation cleanup

Make one final annotation cleanup of this sheet, preserving the four manhole views and bottom section.
The generated TOP numbered leader lines have become tangled and point outside the central bands. REMOVE ALL FIVE NUMBERED LEADER LINES AND ALL THEIR DOTS beside TOP, including all remnants. Do not redraw or change the top object. Keep the clean six-recess callout. Keep the C/1/2/3/4 legend but change its heading to 'RADIAL ORDER - CENTRE OUTWARD'. The C,1,2,3,4 labels on the bottom section already establish the exact ordered mapping, so no numbered leaders on the top picture are needed.
Remove the misplaced OPEN ANNULAR GAP leader arrow above the three-quarter object, but retain its text 'OPEN ANNULAR GAP - Nominal radial gap: 4 mm' as a plain note. The actual gap is unambiguously dimensioned in the bottom section.
Bottom section: keep current corrected low top level shared by 1,3,OUTER FIELD, no right lip, raised C/2/4, and separated frame. Move the BASE PLANE arrow tip up to meet the dashed reference line, not below it. Remove its ambiguous vertical rise-height dimension arrows; replace with plain note 'Rise height(s): TBD'. Add 'SHAPE ONLY - HEIGHTS AND WIDTHS NOT TO SCALE' small within section if space, no new numerical measurements. No extra views, no redesign, no geometry alterations. Keep text readable. The single resulting page is the only final review output.

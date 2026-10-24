# Street Lantern - Annotation Generation

## Current repair contract - 2026-10-08

The user rejected treating the generated companion as a passed final: the main
illustrations were redrawn and the frame angle used a distance arrow. The user
authorized the proposed independent-annotation-layer method. All image-generated
iterations below, including dimensioned-v1, are rejected historical drafts.

Replace this stage with deterministic annotation authoring: preserve the entire
1536 x 1024 original at native resolution, position it on a larger single sheet,
and place all annotations outside its rectangle. An editable SVG layer and a
project-local authoring script own the notes and numeric section diagrams.
Read sizes from the unchanged lantern JSON. Compute both angle arcs from its
slopes, the pane plan-section seat and the roof section from the specified planes.
The original drawing owns appearance; diagram labels identify numeric sections.

Scope: the annotation script/layer/final PNG, this record and direct lantern
reference links. Exclude model creation, app code, geometry/material changes,
new dependencies, commits and remote operations. Self-review gates are pixel
identity of the full embedded original, source-file identity, numerical section
and angle consistency, annotation-layer separation, readable final layout,
English content and relative links. Inspect only the final sheet visually.
The revised plan has been checked against the active geometry contract; it
replaces generative editing for this repair and leaves no shape invention to it.

Date: 2026-10-08. Tool: built-in image_gen.
Edit target: `07-street-lantern-v2.png`.
Scope: one annotated sheet with dimensions, slope baselines and two schematic sections.
The original remains the appearance source; numeric authority is `../LANTERN-SPEC.md`
and the lantern module of `../street-model-spec.json`. No modeling or runtime changes.

## Initial prompt

Edit the attached original STREET LANTERN reference into ONE carefully annotated engineering reference sheet. Use the attached image as the edit target. Preserve the original four object illustrations, their geometry, shapes, colours, orientation and order: THREE-QUARTER, FRONT, SIDE, TOP. Do not redesign, narrow, stretch, recolour, relight or replace the objects. Add annotation space around them and a bottom band with two small technical section details. One final sheet only, no second image or variants. White background, crisp restrained navy technical dimension lines, readable English labels. Aim for high resolution, about 3072 x 2304 if supported. Keep every existing main view large and legible.

Title: STREET LANTERN - DIMENSIONED REFERENCE
Subtitle: Dimensions in mm. Angles as labelled. Sections schematic; numerical specification controls construction.

MAIN-VIEW ANNOTATIONS:
FRONT: vertical dimension from flat ground base to finial tip "2740 overall". Horizontal across roof eave outer edges "530 eave". Horizontal across maximum foot width "440 base diameter". Leader to shaft: "Shaft diameter: 160 lower / 150 upper". No arrows ending in empty space.
SIDE: leader to sloped lantern-frame side "8.653 deg from vertical". Show a short dashed VERTICAL baseline beside that sloping side, with small angle arc between baseline and slope, not a horizontal baseline.
Roof hip slope: leader "36.607 deg from horizontal". Show short dashed HORIZONTAL baseline beside roof facet profile, angle arc to slope. This angle is a face-section pitch, not diagonal hip edge pitch.
TOP: preserve square roof; dimension one horizontal and one vertical edge "530". Leave finial appearance unchanged.
Small text near the head, unambiguous leader: "Frame outer side: 300 bottom / 440 top".
A small letter A at a front pane side/frame contact and B at roof with clear leaders to corresponding bottom insets.

BOTTOM DETAIL A: "A - PANE / FRAME SEAT - SCHEMATIC".
Enlarged clean 2D horizontal section through ONE front pane side edge entering a metal corner post. Amber pane extends from left, dark metal post on right with a fitted recessed seat; amber extends 4 mm beyond the visible opening edge into concealed metal seating, no interpenetrating solid hatching. Fine cut hatching only on dark metal. Label a dimension ALONG the pane into the seat "4 embed". Label pane thickness across its front and back "3 normal thickness"; supporting text "Thickness measured normal to sloped pane". Label "8 setback (horizontal)" on a short dimension from the frame's exterior face plane to the pane outer face plane, oriented perpendicular to the pane in this horizontal section. IMPORTANT: 3 mm is TRUE NORMAL thickness; horizontal cross-section projection is not the true dimension, so use a LEADER note for 3, not a misleading horizontal distance arrow. The drawing is schematic rather than a calibrated cut. Do not show 4 mm as an air gap. Do not invent gasket, hinge, screws or visible extra bracket.

BOTTOM DETAIL B: "B - ROOF CENTRE SECTION - SCHEMATIC".
Cut through the centre of the square hip roof along a face midline: wider horizontal eave bottom, two upward inward-sloping hip faces meeting a SHORT FLAT PEAK CAP (not pointed), enclosed hollow interior beneath. Closed thin horizontal underside lid, no opening through it. The top finial need not be drawn in this inset. Dark cut shell lightly hatched, cavity white. Leader perpendicular to a sloped shell wall "12 nominal wall (normal)". Dimension bottom closure vertical "12 bottom lid"; top closure vertical "12 top cap". Show frame top as two simple dashed vertical guide lines underneath the roof; eave projects "45 overhang each side". Do not add supporting geometry, bulbs or extra roofs. Nominal thickness before 3 mm exterior edge rounding.
Bottom footer: "Colours and materials are replaceable. No baked lighting. Geometry formulas: LANTERN-SPEC.md"
All dimension numbers must exactly match the prompt. No ground shadow, no new cast shadows, no UI, no decorative icons, no rulers or grids. Clean final readable single-sheet annotation retaining the original product design.

## First correction prompt

Correct the attached dimensioned STREET LANTERN sheet. Input 1 is the ORIGINAL lantern design, the only authority for the shape/proportions of the four main illustrations. Input 2 is the draft ANNOTATION LAYOUT to correct. Output only ONE final annotated sheet, keep the same readable main-view layout and all correct labels from input 2. All main views must faithfully preserve input 1's original lantern shapes/proportions. English only, white background, navy technical annotations. Do not redesign the lantern. High resolution.

FIX 1: The "2740 overall" dimension must start at the actual highest point of the FRONT finial sphere, and end at the actual lowest point of the base. Both extension lines must meet these precise silhouette extrema. Do not measure from the sphere centre.

FIX 2: In bottom inset A remove the "8 setback (horizontal)" dimension entirely. It is currently oriented incorrectly and is not needed in this visual. Keep the inset as a SCHEMATIC local section of a straight amber pane entering a dark metal recessed seat from the left. Show one obvious opening mouth: metal starts at one vertical line, above and below the glass. Glass continues a short distance to the right INTO metal. The "4 embed" horizontal dimension must run from that exact mouth/opening edge to the glass terminal right edge inside the seat. Its extension lines must align with those two physical edges. No labels measuring empty space. Label glass "3 normal thickness" with a SINGLE LEADER arrow to amber pane and explanatory text "(measured normal to sloped pane)". REMOVE the two dimension-arrow heads touching the upper/lower glass surfaces: a horizontal section is not the true-normal thickness section. Glass terminal edge flat, no extra beveled glass wedge, gasket, hinge or screws. Metal cut lightly hatched; glass amber; fitted seat no unexplained air gap. Title "A - PANE / FRAME SEAT - SCHEMATIC".

FIX 3: Completely correct bottom inset B to the precise roof construction: a single low hollow trapezoidal hip-roof shell with an enclosed cavity and ONE STRAIGHT FLAT UNDERSIDE across the ENTIRE roof width. No projecting foot shelves, no downward tabs, no stepped bottom lid, no supporting posts, no raised hat/box on the roof peak. Outer section contour: lower left corner, go VERTICALLY up the 45 mm eave band, then DIAGONALLY up and inward along hip slope, then a SHORT FLAT TOP of width 180 mm, then symmetrically down the other hip, vertically down the right 45 mm eave band, then one straight horizontal bottom back to the lower left. Outer width 530 mm. Show hollow interior inset by 12 mm from the sloping planes and 12 mm above the continuous underside. Top horizontal closure also 12 mm thick. Dark shell light hatching, interior white. "12 nominal wall (normal)" leader to slope shell, "12 bottom lid" at the flat bottom thickness, "12 top cap" at flat peak thickness. Both exterior/inner top horizontal planes are simple flat segments without an added raised box.
Below this section only TWO dashed vertical frame-top position guides, each inset 45 mm from its corresponding exterior roof edge (frame width 440, roof width 530). Label "45 overhang each side" with arrows between each outer eave edge and its dashed frame guide. Dashed guides are positions only, not additional geometry. Title "B - ROOF CENTRE SECTION - SCHEMATIC". Inset is schematic and magnified; do not add a finial there.

Preserve all correct main-view dimensions exactly:
530 eave, 440 base diameter, Shaft diameter: 160 lower / 150 upper.
Frame outer side: 300 bottom / 440 top.
8.653 deg from vertical for frame slope, with a vertical baseline.
36.607 deg from horizontal for roof face pitch, with a horizontal baseline.
TOP square width/depth 530 and 530.
Same title, subtitle and footer as input 2. Show all four views THREE-QUARTER, FRONT, SIDE, TOP. One sheet only. No new shadow or glow.

## Bounded revision after annotation review

Two image-generation iterations mislocated dimension endpoints. Retain the
original geometry authority and the single-sheet format. Replace misleading
overall-height and inset overhang dimensions with textual values; constrain the
roof section to a six-corner outer polygon and enclosed cavity. Review the
final generated labels and section topology before assigning it as a handoff.
No source geometry or numeric specification changes are authorized by this repair.

## Final correction prompt

Edit ONLY annotations and the lower-right inset of this sheet. Keep the four lantern illustrations, the lower-left pane inset, the layout, title and all other text unchanged. ONE final sheet.

REMOVE these misleading dimension graphics:
1. Delete the entire tall 2740 vertical dimension line and its top/bottom horizontal extension lines next to FRONT. Replace in that same blank space with a compact plain two-line text note "Overall height" and "2740 mm (base to tip)", no dimension arrows. Keep 530 eave and 440 base diameter as they are.
2. Inside lower-right roof inset, remove BOTH "45 overhang each side" arrow systems, ALL dashed position guides and the "Frame top (position only)" labels, and the bottom 530 dimension line. Do not draw any new construction outside the actual roof silhouette.

REBUILD the lower-right B inset as a SIMPLE geometric roof wall section. Title unchanged: "B - ROOF CENTRE SECTION - SCHEMATIC".
Draw a closed symmetrical polygon outer contour with precisely these 6 corners in relative inset coordinates: (0,100), (0,80), (38,20), (62,20), (100,80), (100,100), close. This is one trapezoidal hip roof with short vertical eave ends, a flat truncated peak, and a completely STRAIGHT FLAT bottom. IMPORTANT: The top corners (38,20) and (62,20) connect DIRECTLY to the diagonal hip faces. No extra shoulder, no step, no raised rectangular hat at the top.
Inside draw one enclosed matching cavity, offset inward, with a straight horizontal floor 12 nominal units above the outer bottom, the ceiling below the flat peak, parallel diagonal roof walls, and short inset vertical ends. All thickness schematic not to scale. Outer roof material is lightly hatched dark grey. Interior cavity white. No finial, no internal objects, no extra layers.
Use ONLY THREE simple leader notes, each with ONE arrow pointing to material, not two-headed measurement arrows:
"12 mm nominal wall - normal" points to the sloping roof wall.
"12 mm top cap" points to the short flat top shell.
"12 mm bottom lid" points to the straight flat bottom shell.
Below the figure write ONE plain text line: "45 mm overhang per side; frame width 440 mm; eave width 530 mm."
No arrows on this bottom sentence. No dimension extensions. No 530 line wider than the figure. Keep notes legible and non-overlapping. This is a section topology illustration with written nominal sizes; not a scale drawing.

Every other part of the sheet is unchanged. In particular, retain the corrected pane "4 embed" dimension from the visible seat mouth to the flat glass end and its 3 normal thickness leader, and preserve the main 8.653 and 36.607 degree notes. Output one image only.

## Rejected generated output and incomplete historical self-review

Selected project file: `07-street-lantern-dimensioned-v1.png`.
Only this final annotation sheet and the unchanged original `07-street-lantern-v2.png`
are presented for user review. Earlier generations are not production references.
Generated with the built-in image_gen tool using the final correction prompt above.

Reviewed the complete 1448 x 1086 output at its native resolution:

- All four main views remain present, in the original order.
- Labels agree with the spec: overall 2740 mm, eave 530 mm, base diameter
  440 mm, shaft diameters 160/150 mm and frame sides 300/440 mm.
- Angle notes correctly distinguish 8.653 degrees from vertical and 36.607
  degrees from horizontal. Values are rounded from the numeric formulas.
- Pane inset labels the 4 mm embed from seat mouth to pane end. The 3 mm
  true-normal thickness is a leader note, not a misleading section measurement.
- Roof inset shows a flat underside, enclosed cavity, flat peak and connected
  hip walls. The top cap, normal wall and bottom lid are labelled 12 mm.
- Overhang is a textual 45 mm per-side note with frame/eave widths 440/530 mm;
  misleading dimension extensions from earlier drafts are absent.
- The 2740 mm total height is a base-to-tip note rather than a misplaced arrow.
- No numeric specification changed. Original reference bytes remain unchanged.

The generated companion is schematic and does not preserve the source raster
pixel-for-pixel. Its illustration layout/scale must not override the original
appearance source or numeric dimensions. Self-review covers label consistency
and section meaning, not model validation. Awaiting user acceptance; not committed.

## Current deterministic output - 2026-10-08

Current final candidate: `07-street-lantern-dimensioned-v2.png`, 2560 x 2120.
Companion: `07-street-lantern-annotation-layer-v2.svg`, transparent editable layer.
Authoring source: `draw-lantern-annotations.py`; uses existing Pillow and reads
all geometric section inputs from the lantern module. No generative image edit
is used for this repair. The user authorized the independent-layer method.

The full 1536 x 1024 original is embedded at native resolution at (64,168).
After saving and reopening the final PNG, every RGB pixel in that rectangle was
compared to the original: zero mismatches. The annotation alpha channel has no
nonzero pixel in that rectangle. The original file SHA256 remains
`f41624689a0e081bed96be644933ea989b5cb9c921a59c00b1164de088083eef`.

Frame angle is an actual 8.652542-degree circular arc between a vertical ray and
the computed outward slope, labelled 8.653 degrees. Roof face angle is an actual
36.607075-degree arc relative to a horizontal ray, labelled 36.607 degrees.
No horizontal distance arrow substitutes for either angle.

The pane plan section uses the specified L-section post and a fitted 4 mm seat.
The normal thickness remains 3 mm; its horizontal cut thickness is correctly
3.034536554 mm. These are explicitly distinguished rather than labelling the
plan-cut thickness as exactly 3 mm. The 8 mm setback is measured in the XY plane.
The roof section is generated from the exterior planes and enclosed offset cavity,
with a continuous bottom lid, flat peak cap and 12 mm nominal walls. Dashed frame
positions lie 45 mm inward of the actual eave boundaries. Section fills identify
parts and do not change default model colours or materials.

Final layout review checks the four unchanged views, dimension notes, angle
baselines and section leaders. An initial local text overlap at the embed label
was corrected before handoff. The retained generator assertions check source
identity, alpha separation, saved-image identity and numerical angle/section
relationships on every rebuild. No modeling, runtime changes or tests, commit,
or push was performed. Only the final v2 sheet and original v2 source are to be
presented to the user; historical failed sheets are not current handoff images.

## Acceptance - 2026-10-08

The user authorized committing the deterministic v2 sheet after the annotation
and specification consistency review. Only v2 is the current dimensioned
reference; the rejected generated v1 image is excluded from this commit.
Acceptance covers the reference annotations, not a rendered 3D model.

# Street Sign - Projection and Appearance Revision

Date: 2026-10-08. Status: v2 rejected after proportion review; superseded by
[the v3 numeric drawing](STREET-SIGN-PROPORTION-REVISION.md). No model created.

## Bounded scope

Continue the Asyra Office asset-reference review. Correct RIGHT and TOP in the
existing sign sheet; document the same numeric geometry and per-region appearance
replacement. No changes to the bollard geometry, app, model exports or other
asset revisions. Keep the original for comparison. No commit or push in this step.

## Built-in imagegen edit prompt

Edit the supplied STREET SIGN reference sheet (Image 1 is the edit target). Produce ONE final complete five-view sheet, same white background, charcoal sign, title and five-view layout FRONT, RIGHT, BACK, TOP, THREE-QUARTER. English only. Preserve the original design, square post, round finial, two rectangular boards, labels Maple St above Riverside, blank backs. Do not redesign or add parts. Do not add shadows, glow, texture, scenery or extra views. Use thin dark outlines to distinguish coinciding dark parts.

Make precisely these two projection corrections:
1. RIGHT view is orthographic looking along -X from the board free ends toward the post. The post has width 45 mm in this projection. Each board is 18 mm thick and centred on the post's centreline, so each of the TWO short vertical rectangular end faces must appear INSIDE the post silhouette, centrally placed over the post at the respective heights, leaving 13.5 mm of post visible on EACH side. Absolutely no board rectangle sticking out beside the post. Remove the current two little rectangles outside the right edge, and draw them centered ON the post. Keep both post outer edges continuous straight lines. No text on these end faces. Move the 0.018 m dimension to a nearby clear area with extension lines measuring this centred 18 mm strip, without confusing it with post width.
2. TOP: preserve ONE narrow board extension to the right, centred on Y=0 (both boards exactly overlap). The top assembly must show the 60 mm diameter circular finial OVER the concentric 52 x 52 mm axis-aligned square collar. The circle is wider than the square along its axes but smaller than the square's diagonals; therefore all FOUR square corners protrude diagonally outside the circle. Draw exactly the exposed CORNER fragments of that square beneath the circle, NOT an outer enclosing square, not a second circle, no diamond. The square side is 52/60 of circle diameter. Keep circle as foreground fill hiding middle portions of square edges. The single board extension is 18 mm thick, no fork and no second parallel board.

Numeric dimensions remain unchanged: height 1.65 m; square post 0.045 m; square collar 0.052 m; finial diameter 0.06 m. Each board height 0.18 m, thickness 0.018 m, exposed width 0.48 m, hidden embed 0.002 m. Board centres Z=1.39 and 1.16 m. Both boards share centreplane Y=0. Front visible length from right post face to board tip=0.48 m. Metal default #383A38, letters #EEE9DD, colors replaceable. Keep FRONT, BACK and THREE-QUARTER appearances as in original. No added panels, badges, framing or alternate options. One landscape sheet with all views fully visible.

## Targeted annotation correction

Edit this sheet with ONE narrowly targeted correction only. Preserve ALL five illustrations and every other title, dimension and label exactly as they are. The centred two board end faces in RIGHT and the four visible square collar corners in TOP are correct: do not change them.

In RIGHT view, the current "0.018 m" horizontal arrows and white extension lines below the lower small board end face span too wide a distance and mislabel the post. Remove that entire arrow/extension-line measurement graphic. Restore the plain uninterrupted charcoal post underneath it; do not create slots or marks on the post. Keep BOTH correctly centred narrow end faces at their present heights and width. Replace the incorrect dimension graphic with just a simple two-line text note in clear white space to the RIGHT of the post: "Board thickness" and "0.018 m (centred)". NO arrows, leaders or extension lines for this note, so there is no false measurement. Position it near the lower end-face height without overlapping the post or BACK view.

Do not change FRONT, BACK, TOP, THREE-QUARTER, the finials/collars, board count, Maple St / Riverside text, or remaining dimensions. No new shading, objects or insets. One complete landscape sheet, unchanged format.

## Historical v2 review boundary

The first generated edit corrected the two projection defects but placed the
18 mm dimension extensions too far apart. It was not selected for handoff.
The final candidate replaces that misleading graphic with a plain thickness
note. Only `01-street-sign-v2.png` is the revised handoff sheet; v1 is the
original comparison reference. Numeric construction remains authoritative;
these illustrations are not calibrated CAD views or a validated 3D model.


## Historical v2 self-review - insufficient for proportion approval

Reviewed the full 1536 x 1024 sheet at native resolution. The two RIGHT end
faces are centred inside the post silhouette; no side-mounted rectangles
remain. TOP shows one extension and four exposed square collar corners.
The misleading thickness arrows are gone and the replacement text is readable.
FRONT and THREE-QUARTER retain the two front labels; BACK remains blank.
This verifies the corrected projection relationships, not exact pixel scale.

Compared JSON against the current commit: part sizes, centres, bounds, existing
material defaults, lettering paths and bollard geometry are unchanged. The
13.5 mm side margins and circle/square intersection values agree with the
existing dimensions. Seven appearance regions and their override precedence
are specified. Local document links resolve and the scoped diff has no
whitespace errors. The original v1 image matches its committed bytes.
No model or app validation has been performed; user acceptance remains pending.

The subsequent review found FRONT board/post width and TOP total width/finial
ratios inconsistent with the numeric specification. The topology-only review
above does not establish acceptance. V2 must not be used as the final drawing.

# Street Sign - Proportion Correction Plan

Current status: user-approved v6 retains these geometric projections, the restored original lettering, attached dimensions and review-only face colours.
See [lettering review](STREET-SIGN-LETTERING-REVIEW.md). Historical glyph-related
statements below describe v3 only and no longer define current appearance.

Date: 2026-10-08. This replaces the v2 local-edit approach within the existing
asset-reference task. Numeric part geometry and appearance defaults stay fixed.
The v2 topology correction did not establish proportional consistency: FRONT
shows roughly 6.56 instead of 10.67 for exposed board/post width, and TOP roughly
3.82 instead of 8.875 for total width/finial diameter. V2 is not accepted.

## Revised bounded approach

Redraw one complete five-view sheet from the existing numeric part dimensions,
using the original image only for identity and presentation. Specify a common
orthographic scale for FRONT, RIGHT, BACK and TOP, with a labelled orthographic
oblique view from the same geometry. Do not preserve the original exaggerated
post or finial widths. Keep two boards, centered RIGHT end faces, four visible
TOP collar corners, existing lettering, and the one-sheet five-view format.

Review the whole output and local silhouettes before handoff. Check exposed
board/post width = 480/45, board height/gap = 180/50, RIGHT board/post thickness
= 18/45, finial/post width = 60/45, and TOP total width/finial diameter = 532.5/60.
Allow only raster edge/outline measurement uncertainty, not unexplained shape
ratios. Numeric JSON and all existing dimensions must remain unchanged. Update
only the street-sign drawing, review record and direct reference links after a
candidate passes. If generation cannot satisfy the ratios, report that result;
do not label an illustrative mismatch as a calibrated result. No model creation,
Blender, app edits, commit, push or unrelated asset work.

## Revised method after the generated candidate failed

The generated candidate did not preserve the requested ratios and regressed
RIGHT to side-mounted board edges. It is rejected and is not a current reference.
Replace generative raster editing with a new numeric engineering diagram:
read the existing JSON, project the same parts into all five views, and produce
one PNG sheet plus its reproducible drawing source. This is diagram authoring,
not a new Blender model or app implementation. Keep all existing dimensions.
Review ratio calculations and the final diagram at native resolution; verify
that projection directions preserve the front text, blank backs, centred end
faces and four exposed collar corners. The numeric generator, diagram and
direct document links are the only additional authoring files in scope.

Self-review: this corrects the drawing's projection/proportion owner, not the
specification by changing dimensions to match a failed drawing. The scope and
checks are fixed to the observed failures and their five-view consistency.

## Final numeric sheet and self-review

Historical geometry candidate, rejected for lettering: [01-street-sign-v3.png](01-street-sign-v3.png), 3072 x 2048.
Authoring source: [draw-street-sign-projections.py](draw-street-sign-projections.py).
[Projection record](street-sign-projection-measurements.json) preserves the part
inputs, scale and five orthonormal viewing bases. Existing Pillow and NumPy are
used; no dependency was added. The drawing contains one five-view sheet, no
extra cutouts and no lights or directional surface shading.

Reviewed at native resolution. FRONT and BACK are mirrored geometry with text
only on FRONT; RIGHT shows two centred board end faces; TOP shows a single long
extension with four exposed collar corners; THREE-QUARTER resolves the same
parts and front text from its recorded camera direction. The visible stroke
lettering follows the unchanged numeric glyph paths, so it differs from the
original image's illustrative sans-serif font. This is explicit source usage,
not a new lettering design or geometry change.

Measured dark silhouette edges in the saved PNG, excluding labels:

| Check | Expected | Measured PNG |
| --- | --- | --- |
| FRONT post width | 36 px | 36 px, X=152..187 at Y=1000 |
| FRONT exposed board width | 384 px | 420 px combined span minus 36 px post, Y=530 |
| FRONT finial diameter | 48 px | 48 px, X=146..193 at Y=404 |
| RIGHT post width | 36 px | 36 px, X=832..867 at Y=1000 |
| RIGHT board thickness | 14.4 px | Boundary contours centre near X=842.5 and 856.5; raster edge uncertainty |
| TOP overall span | 426 px | 426 px, X=1786..2211 at Y=1050 |
| TOP finial diameter | 48 px | 48 px, matching the unobstructed vertical diameter |
| Board height / clear gap | 144 / 40 px | FRONT intervals Y=516..659 / 660..699 |

Therefore FRONT exposed board/post ratio is 10.6667 and TOP total width/finial
ratio is 8.875, rather than the rejected image's 6.56 and 3.82. Raster sampling
and contour antialiasing do not change the underlying exact projected geometry.
Numeric JSON part dimensions, bounds, glyphs, original defaults and the bollard
remain unchanged. No 3D model has been exported or validated in an app. User
acceptance remains pending; this work has not been committed or pushed.

## Rejected generative prompt

Built-in imagegen was attempted before switching to the numeric diagram. Its
output failed proportion and RIGHT-placement review and was not selected as a
reference. The final PNG is produced by the linked numeric drawing script.

Redraw ONE precise proportionally consistent engineering five-view sheet of this same simple street sign. The supplied image is IDENTITY AND PRESENTATION REFERENCE ONLY; its silhouette widths and top-view proportions are WRONG. The NUMBERS BELOW OVERRIDE those bad proportions. Do not merely copy and locally adjust it. English labels. White background, charcoal objects, ivory text, fine outlines, no shadows, no gradients. One landscape sheet with exactly five labelled views FRONT, RIGHT, BACK, TOP, THREE-QUARTER in the same left-to-right arrangement. Please produce high resolution 3072 x 2048.

This is a very SLENDER square post with two rectangular boards to its right and a SMALL round ball finial. No other objects. The ball is only 1.333 times post width, and exposed board length is 10.667 times post width. Prior image made post too FAT. Absolutely do not exaggerate post thickness or ball size.

EXACT GEOMETRY, mm:
Axes X right, Y depth, Z up. Post square cross-section45 x45, x,y=-22.5..22.5, z=0..1582.
Collar square52 x52, x,y=-26..26,z=1580..1596.
Sphere radius30, centre(0,0,1620), highest point1650.
Two rectangular boards: x=20.5..502.5,y=-9..9. Upper z=1300..1480, lowerz=1070..1250. Exposed length from post side22.5 to tip502.5 is480. Board height180, thickness18, vertical clear gap50. Text Maple St on upper and Riverside on lower; FRONT faces only, blank backs.

USE A CONSISTENT EXACT SCALE of 0.8 PIXELS PER MM for FRONT, RIGHT, BACK and TOP in the requested 3072x2048 sheet (if output resolution changes, scale EVERYTHING together). Thus each upright is1320px tall, post36px wide, ball48px diameter, collar41.6px wide, exposed board384px long, each board144px high, clear gap40px, board edge14.4px thick.
Concrete suggested image coordinates for the orthographic views at3072x2048:
ground y1660. FRONT post axis x280; post sides262..298, ballcenter(280,364), radius24. Upper board exposed x298..682,y476..620; lowerx298..682,y660..804. Collar x259.2..300.8,y383.2..396. FRONT post topy394.4.
RIGHT postaxisx940, same vertical scale and ground. Post sides922..958; two NEAR board end rectangles x932.8..947.2 at exactlyy476..620 and660..804, centered ON post silhouette, not alongside it. Ballradius24, collar41.6width.
BACK postaxisx1690, sameground/heights. Boards extend LEFT: x1288..1672 (visible), sameboardheights. Blank boards, no rear text.
TOP ball centre(1990,1020),radius24. Collar square x1969.2..2010.8,y999.2..1040.8 underneath the circle. FOUR tiny square corner fragments exposed beyond the disk. Single coincident board extension endsx2392,y1012.8..1027.2. Both boards coincide into one strip. VERY IMPORTANT TOP total horizontal span426px, circle48px, ratio8.875. Do NOT make the ball giant or shorten this strip. NOT a fork.
THREE-QUARTER on far right around x2600..2940, show SAME slim post/boards/small ball in an orthographic projection looking from (+X,-Y,+Z). Front words visible. Keep true proportions, thin slabs and small finial. All views fit clear margins.

Header "STREET SIGN - ONE COMPLETE UNIT", subtitle "Dimensions in mm - orthographic views share scale". Label views at bottom. Add neat numeric NOTES in blank spaces, without misleading dimension arrows: "Height 1650", "Post 45 x 45", "Finial diameter 60", "Boards: 480 exposed x 180 x 18", "Board centres: 1390 / 1160", "Clear gap: 50". Keep notes away from silhouettes. All five views are the SAME geometry. Preserve finial square collar, central plane Y=0, FRONT/oblique words and blank BACK. No extra insets. No decorative texture or lights.

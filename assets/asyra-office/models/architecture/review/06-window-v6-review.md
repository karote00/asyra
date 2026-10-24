# Window - Flush Longitudinal Ends

Status: v6 geometry and the reconciled specification approved by the user for
commit on 2026-10-06. No model or material approval.
Authority: the original v2 THREE-QUARTER view, enlarged without retouching in
06-window-quarter-authority-detail.png (source crop 920,525 to 1370,945; 2x).

## Failure and correction

V4 TOP represented the head inside a wider sill outline. The previous review
checked the rectangular silhouette but missed the inset end planes. The chosen
THREE-QUARTER reference is interpreted as flush longitudinal frame/sill ends,
with projection toward the front only. V5 corrected TOP, but FRONT still had
old projecting sill ears. V6 removes those FRONT ears as well.

TOP shows two visible horizontal surfaces: head top behind and exposed sill
in front, with equal X extents. Glass is hidden by the head in a true top view;
it is not a protruding slab. SIDE retains one vertical frame on a sill that
projects forward only. Recessed glass and cross mullions remain in FRONT and
THREE-QUARTER.

## Self-review evidence

Inspected the 1536 x 1024 sheet and two unretouched 2x crops:
- TOP: source (170,683)-(736,803), output 1132 x 240.
- FRONT lower junction: source (174,428)-(742,493), output 1136 x 130.

Checked that TOP has no inset U or stepped side ears and that FRONT has straight
outer side boundaries continuing into the sill. These checks cover the reported
end relationship, not precise image calibration or complete model readiness.
Image generation can alter fine texture and proportions; pixel-identical
preservation of the authority image is not claimed.

## Document reconciliation - 2026-10-06

Corrected the canonical sill width from 1.86 m to 1.82 m and X bounds from
/-0.93 m to +/-0.91 m. Updated the overview, catalogue and drawing index.
The geometry supplement records frame/sill bounds, 46 mm glass recess,
80 mm forward sill projection, pane openings and mullion joins. The later confirmed miter revision changes the side-member and bottom-rail
bounding boxes as recorded below; overall dimensions and material assignments
remain unchanged.

Geometry-only re-review: the user confirmed four 45-degree frame corner joints
and flat frame-to-sill contact. The JSON now defines four closed extruded
polygon profiles with paired miter faces and explicit bevel exclusions. The
geometry supplement records the same vertices; the old box construction is
superseded. Joint angles, common endpoints, area, bounds and unchanged pane
clearance were checked numerically. No mesh has been produced or verified.
Wood grain and solid colour differences are excluded by the new shared rule;
all assets must support caller-selected colours or materials independently of
geometry. Dimensions, flush ends, forward sill projection, glass depth, pane
openings and mullion placement were rechecked against the numeric specification.
No Blender model or production material has been changed.

## Tool and prompts

Built-in image generation; v5 uses v4 plus the enlarged original authority;
v6 uses v5. No shadow pass or Blender modeling.

### V5 prompt

Precise image edit. Input1 is the target full window sheet; input2 is the ORIGINAL approved THREE-QUARTER authority enlarged. Change ONLY the TOP drawing at lower left of input1. Preserve FRONT, SIDE and THREE-QUARTER views and their positions; do not redesign the window.

The exact mismatch to fix: target TOP has a small inset U-shaped head outline, creating narrow left/right sill ears. The authority THREE-QUARTER has longitudinal end planes of sill and outer frame FLUSH. Sill extends FORWARD ONLY, not left or right. Therefore correct TOP as follows:
The visible head top and the sill below MUST have EXACTLY THE SAME left and right X endpoints.
TOP outer silhouette is a single long rectangle. Draw just ONE straight full-width horizontal boundary across it (leftmost side to rightmost side) separating the rear/head region (upper portion about 56% of total depth) from the forward exposed sill (lower portion44%). The rectangle's top/back edge is shared/flush at rear. Erase BOTH inset vertical lines from previous TOP; do not draw the inset U outline, ears, rim, border frame or nested rectangle. There is no glass sheet sticking out: glass is recessed and occluded by head in true top projection. Retain pale warm wood appearance. TOP should read as two adjacent rectangular visible wood surfaces of the SAME LENGTH, the head top behind and exposed sill in front, with a single junction line.
Keep current TOP location and overall sheet dimensions. No shadows, no additional labels, no dimensional text. Reference proportions follow input2; do not retain old wider-sill specification. Draw with crisp lines for geometry review.

### V6 prompt

Precise tiny edit of full window multiview review image. Modify ONLY the FRONT view's bottom sill, upper left region of sheet. In FRONT, the sill currently extends approximately20pixels beyond each outer vertical frame edge. Remove those left and right projecting ears: sill left end must align EXACTLY with outer left frame at x194 and sill right end EXACTLY with outer right frame at x718 (coordinates for1536x1024 input). Sill top/bottom height remain y456..483. Continue the outer side silhouette straight vertically from frame into sill; no external ledges. Do NOT alter inner side posts, panes, crossbars, frame proportions, or front-view style. This makes FRONT match the authoritative THREE-QUARTER and corrected TOP, where sill width equals outer frame width; only sill depth projects forward.
Preserve the existing TOP, SIDE, and especially THREE-QUARTER without any geometry changes. Preserve text, composition, white background and colours. No new shading or shadows. Do not restore extra vertical lines in TOP. This is solely removing FRONT's two horizontal sill extensions; everything else is retained.

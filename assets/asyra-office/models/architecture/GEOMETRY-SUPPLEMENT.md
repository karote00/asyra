# Architectural Components - Geometry Supplement v2

This document and the JSON describe the 2026-10-04 design baseline with wall v5, floor v7, and partition v5 approved on 2026-10-06. They are not a model verification result. [architecture-model-spec.json](architecture-model-spec.json) is the sole numeric authority. Each component's sizeMetres, centreMetres, material, and bevelMetres define its base construction; this document defines operations that boxes alone cannot express.

## Coordinates and shared construction rules

- Units are m; use right-handed coordinates, +Z up, +X right, and -Y front. All positions are component-local.
- Origins are at the assembly's bottom centre except the window. Its origin is at the rectangular frame's bottom centre; the sill extends to Z=-0.035.
- A box size is its pre-bevel bounding size; centre is its geometric centre. Apply scale before construction. Bevels cut inward and must not increase bounds.
- All boxes are closed, including undersides and backs. Contact faces may remain, but exposed coincident duplicate faces are forbidden. Normals point outward. Specified seams are geometric gaps, not black textures; the wall cap/body contact joint below is not an added gap.
- General bevels are circular arcs with 2 segments. Keep planar face normals and interpolate bevel normals. bevelMetres=0 means no generic all-edge bevel; walls and partitions use the specific rules below.
- Add no lights, ground shadows, AO, emission, cameras, colliders, rigs, or animation. Geometry and materials belong to the asset; placement and interaction belong to the app.

## Wall and partition

The body and cap are two closed boxes with JSON dimensions and centres. Caps overhang each Y side by 0.015 m only; X ends remain flush for repetition.

Bevel only long edges parallel to X: the two upper body edges and two upper cap edges use radius 0.004 m and 2 segments. Do not bevel bottom edges, the four vertical edges, or transverse end edges. X ends must be closed and perpendicular, with the long-edge bevel profile included in their cross-section and no additional setback. Adjacent end faces align directly without filler posts.

The wall is 1 m wide and 2.5 m high; the partition is 2 m wide and 1.35 m high. The wide, low partition proportion is the selected design. The 1 m width in the generation prompt is historical, not authoritative. Front and back share plaster; caps are pale cream. Include no skirting, wooden cap, feet, or floor. The app owns corner joins and wall openings; this unit includes no corner assembly.

### Wall - approved v5 dimensions and joins

The current appearance authority is [wall v5](review/01-wall-v5.png). Earlier
wall drawings are superseded. Dimensions below retain the authored scale;
they are not measurements recovered from generated pixels.

| Part | Size X x Y x Z (m) | Centre (m) | X bounds (m) | Y bounds (m) | Z bounds (m) |
| --- | --- | --- | --- | --- | --- |
| Body | 1 x 0.24 x 2.42 | (0, 0, 1.21) | -0.5 to +0.5 | -0.12 to +0.12 | 0 to 2.42 |
| Top cap | 1 x 0.27 x 0.08 | (0, 0, 2.46) | -0.5 to +0.5 | -0.135 to +0.135 | 2.42 to 2.5 |

- Overall bounds: X=-0.5 to +0.5, Y=-0.135 to +0.135, Z=0 to 2.5 m.
- Length direction X: zero overhang at both ends. Cap and body end planes must
  coincide exactly. Do not add an end bevel, setback, lip, ledge or seam strip.
- Thickness direction Y: cap overhang is 0.015 m per side, 0.03 m total extra
  thickness. Front is -Y; rear is +Y. Never apply this offset along X.
- Cap underside is at Z=2.42 m and body top is at Z=2.42 m: no vertical gap or
  volumetric overlap. The existing upper long-edge bevel is an inward cut;
  it must not shift either X end plane.
- A cap/body joint line in the drawing is not a recessed groove, black texture,
  projecting bead or additional component. Retain the existing material split.
- A straight neighbouring unit translated by exactly (1, 0, 0) m meets the
  first unit at X=0.5 m with both body and cap aligned. This is an assembly
  example; deliver one unit, not a preassembled pair.

Review criteria for a future model: verify these numerical bounds and equal X
end planes, then inspect FRONT, SIDE, TOP and THREE-QUARTER at overview scale
and magnified at both cap/body end junctions. SIDE must preserve the thickness
lip; THREE-QUARTER must preserve the narrow end face without a longitudinal
cap step. The 0.001 m general dimension tolerance does not authorize an
intentional end mismatch: body and cap must use shared X coordinates. No
model has been validated against this newly approved drawing in this revision.

### Partition - approved v5 dimensions and joins

[Partition v5](review/03-partition-v5.png) supersedes earlier partition drawings.
The numeric dimensions are unchanged; the corrected SIDE projects along +X,
with horizontal +Y and vertical +Z. Use the other views for appearance, not
pixel-based dimension recovery.

| Part | Size X x Y x Z (m) | Centre (m) | X bounds (m) | Y bounds (m) | Z bounds (m) |
| --- | --- | --- | --- | --- | --- |
| Body | 2 x 0.14 x 1.29 | (0, 0, 0.645) | -1 to +1 | -0.07 to +0.07 | 0 to 1.29 |
| Top cap | 2 x 0.17 x 0.06 | (0, 0, 1.32) | -1 to +1 | -0.085 to +0.085 | 1.29 to 1.35 |

- Overall bounds: X=-1 to +1, Y=-0.085 to +0.085, Z=0 to 1.35 m.
- Both X ends are flush, using identical end coordinates. No end lip, setback,
  extra strip, or end bevel is allowed.
- The cap is centered in thickness and projects 0.015 m on both Y sides, not
  0.015 m total and not on only one face. SIDE has a symmetric T profile.
- Cap bottom and body top share Z=1.29 m, with no gap or volumetric overlap.
  The specified 0.004 m inward upper-edge bevel remains visible in section;
  it is not an extra gap or groove. Its two segments do not enlarge bounds.
- Body uses plaster and cap uses cream-cap from the JSON and surface recipes.
  Diagram outlines and magnified image texture are not production textures.
- A straight neighbour translated by (2, 0, 0) m joins at X=1 m. Deliver one
  unit; the app owns repetition and corner assembly.

Future model review must check both X end planes, both 15 mm Y lips, component
and overall bounds, cap/body contact, and the specified bevels. Inspect all four
views and magnified end junctions. The general 1 mm tolerance does not authorize
intentional end mismatch or asymmetric lips. No model is validated by this
reference and document review.

## Single floor plank

One closed 1.2 × 0.18 × 0.025 m plank, all edges beveled inward by 0.001 m with 2 segments. Grain runs along X. The underside is plain wood; do not add end-grain rings to the two short ends. No tongue-and-groove, backing slab, or prearranged boards. JSON connection points lie on the bottom placement plane Z=0, not at side-face geometric centres. The app may use them for alignment and choose gaps.

## Single stair step

One closed 1.2 × 0.3 × 0.15 m stone block, all edges beveled inward by 0.003 m with 2 segments. X is width and +Y is ascent. Repeated translation (0, 0.30, 0.15) illustrates assembly only; do not store an array in the asset. The scene supplies foundations or support when elevated. Do not add a whole staircase, railings, landing, or ground.

Document review - 2026-10-06: the user selected direct specification review for
this simple block. Retain the current drawing and numeric dimensions; no
additional shadow-assisted drawing is needed.

- One unit is one solid step, with no separate tread cap, projecting nosing,
  recess, groove, underside cavity, or surface relief.
- Origin: bottom centre (0, 0, 0); geometric centre: (0, 0, 0.075) m.
- Outer bounds: X=-0.6..+0.6, Y=-0.15..+0.15, Z=0..0.15 m.
- All 12 box edges receive the shared circular inward bevel: radius 0.003 m,
  two segments. Keep the six main faces planar and the mesh closed at corners.
  This small edge treatment does not increase the authored outer bounds.
- JSON front-bottom (0, -0.15, 0) and rear-top (0, +0.15, 0.15) coordinates
  are placement anchors on the pre-bevel envelope, not required mesh vertices
  or points on the rounded surface.
- Translation (0, 0.30, 0.15) m aligns the next step's front-bottom envelope
  anchor with the preceding step's rear-top envelope anchor. Beveled edges
  do not form a load-bearing face connection; the scene supplies support.
- Use the existing stone colour recipe on every face, including the underside.
  Image speckles are intrinsic colour, not holes or geometry. No normal map,
  displacement, baked shadow, or AO is required.

Self-review checked the JSON component size, centre, overall size, anchors,
bevel values, material assignment and surface recipe against this section.
All agree. This is document consistency review, not model verification or a
claim that the generated drawing is a calibrated dimensioned projection.

## Complete entrance door

The frame, narrow same-colour fixed left panel, main right leaf, and right-side handle form one placeable unit. Never omit the left panel, replace it with wall, or turn it into glass. The door is closed. The left panel is flat; the right leaf has two rectangular recessed fields, following the user's close-up.

- Outer frame: 1.64 m wide, 2.16 m high, 0.12 m deep. Side jambs are 0.06 m wide and the head is 0.06 m high. No bottom rail or threshold.
- Clear width 1.52 m = two side gaps of 0.004 + left panel 0.60 + meeting gap 0.012 + right leaf 0.90.
- Panel height 2.064 m; bottom gap 0.028 m and top gap 0.008 m give clear height 2.10 m.
- Left panel X range -0.756 to -0.156; right leaf -0.144 to 0.756. Front Y=-0.03, rear Y=0.03.
- Right field centre X=0.306. Lower field outer width 0.60, height 0.62, centre Z=0.61; upper width 0.60, height 0.76, centre Z=1.49.
- Retain a 0.025 m flat border around each field. Inner openings are 0.55 m wide and 0.57 / 0.71 m high. A 0.006 m wide slope transitions to a 0.006 m deep recessed plane at Y=-0.024. Recessed floors are therefore 0.538 m wide and 0.558 / 0.698 m high. Corners use intersecting right-angle slopes without decorative beading. Do not add a raised panel or cut through the leaf.
- Handle backplate, stem, and lever sizes and centres follow JSON. The short lever extends from the right toward -X; the frontmost point is Y=-0.086. All parts use dark iron. Bright image areas are not metallic-highlight textures.
- The rear is a flat same-colour panel with no second handle or recessed fields. Do not invent hidden details. Fixing the left panel is the explicit design decision where rear/mechanism evidence is unavailable.

Local Z=0 aligns to finished floor. Reserve a wall opening 1.66 m wide and 2.17 m high. Frame depth is independent of wall thickness; the app owns wall-side finishing during assembly. The door includes no plaster wall block. Hidden hinges, pivots, and opening interaction are outside this model-design scope.

Colour revision - 2026-10-06: preserve the existing door-wood and door-frame
material assignments and treat their JSON baseColorSRGB values as editable
defaults. The left panel, right leaf and recessed fields share one door-wood
colour; the frame has its own colour parameter. Fixed neutral wood detail is
independent of colour, following [the surface contract](SURFACE-RECIPES.md#door-and-window).
Recolouring must not require a new model, material replacement or a differently
coloured texture file. Hardware colour and all geometry remain independent.

## Single four-pane window

Use simple window-frame forms from secondary street shops; do not claim this is a clearly identifiable central-office component. The rectangular frame is 1.82 m wide, 1.28 m high, and 0.10 m deep. Side members are 0.08 wide, head/bottom members 0.08 high, and mullions 0.06 wide. Split the horizontal mullion into left/right parts to avoid overlap with the vertical member.

Each of four panes is 0.80 × 0.008 × 0.53 m, with X centres ±0.43 and Z centres 0.345 / 0.935. Front and back use the same four-pane structure. Glass is opaque muted blue-grey without room backdrops, reflection images, or gradients.

Sill size is 1.82 × 0.18 × 0.035 m, centre (0,-0.04,-0.0175), front Y=-0.13, rear Y=0.05. Frame bottom Z=0 is the mounting datum, not the overall lowest point; total height including sill is 1.315 m.

Document review - 2026-10-06: the user selected the original THREE-QUARTER
appearance as authority and requested document review of [v6](review/06-window-v6.png).
The former 1.86 m sill width introduced 20 mm lips at each X end. The revised
1.82 m width matches the frame; the sill centre stays unchanged.

| Element | X bounds (m) | Y bounds (m) | Z bounds (m) |
| --- | --- | --- | --- |
| Rectangular frame envelope | -0.91 to +0.91 | -0.05 to +0.05 | 0 to 1.28 |
| Sill | -0.91 to +0.91 | -0.13 to +0.05 | -0.035 to 0 |
| Whole unit | -0.91 to +0.91 | -0.13 to +0.05 | -0.035 to 1.28 |

- Overall dimensions are 1.82 x 0.18 x 1.315 m, including the sill.
- Frame and sill share both X end planes. Rear edges share Y=+0.05 m.
  Only the front projects: 0.08 m beyond the frame's Y=-0.05 m face.
- Glass spans Y=-0.004 to +0.004 m, recessed 0.046 m behind each frame face.
  Head and jambs occlude it in true external TOP and SIDE projections.
- Pane openings span X=-0.83..-0.03 and +0.03..+0.83 m, with
  Z=0.08..0.61 and 0.67..1.20 m. Each matches one 0.80 x 0.53 m pane.
- Horizontal mullion halves meet the vertical mullion without volumetric
  overlap. Sill top meets frame bottom at Z=0. Bevels remain inward; dimensions
  refer to pre-bevel envelopes, not a guarantee of seamless rounded contacts.

### Frame joints - confirmed 2026-10-06

The user confirmed the reference corner geometry. Keep the left member, right
member, head and bottom rail as four separate frame members. Both upper corners
and both lower corners of this rectangular perimeter use complementary 45-degree
miters. The complete frame's bottom remains flat on the sill. Do not build a
single U-shaped substitute, add decorative seam strips or miter the sill joint.
The central cross mullions retain their existing end-to-face joints; do not add
four separate trim frames around the individual panes.

Each frame member is a closed prism extruded through Y=-0.05..+0.05 m from the
ordered X/Z profile below. These profiles supersede the former box construction.
JSON sizeMetres and centreMetres now describe each prism's bounding box, not its
volume centroid. Profile vertices and extrusion limits are already in the
window assembly's local coordinates; do not add centreMetres to them again.
All coordinates are metres.

| Member | Ordered profile vertices (X, Z) |
| --- | --- |
| Left | (-0.91, 0), (-0.83, 0.08), (-0.83, 1.20), (-0.91, 1.28) |
| Right | (0.83, 0.08), (0.91, 0), (0.91, 1.28), (0.83, 1.20) |
| Head | (-0.91, 1.28), (-0.83, 1.20), (0.83, 1.20), (0.91, 1.28) |
| Bottom rail | (-0.91, 0), (0.91, 0), (0.83, 0.08), (-0.83, 0.08) |

Each diagonal changes X and Z by 0.08 m, making its angle 45 degrees in the
front X/Z plane. Paired cuts share the same plane across the entire frame depth.
No volumetric overlap, intentional gap, black painted seam or raised joint strip
is permitted. Separate frame parts remain available; joining vertices must not
change the visible rectangular envelope.

The existing 2 mm frame bevel affects exposed perimeter edges only. Keep miter
mating faces and seam edges exact, and leave the assembled frame bottom at Z=0
flat. Keep the sill's mating top region planar; bevel only its exposed edges.
Do not bevel each prism indiscriminately and create grooves at the miter joints.
The pane sizes, cross mullions, glass depth, frame outer size and sill position
remain unchanged. The union of the four pre-bevel profiles is the outer
1.82 x 1.28 m rectangle minus its 1.66 x 1.12 m opening.

Wood grain and colour are excluded from this review under the
[shared review and appearance rule](../README.md#current-review-scope-and-configurable-appearance---2026-10-06).
They are configurable defaults, not geometry acceptance conditions.

Reserve a wall opening 1.84 m wide and 1.30 m high, with 0.01 m clearance around the rectangular frame. The sill attaches outside the opening. The app chooses sill support and height above floor. Include no wall, curtains, shutters, pots, or interior backdrop.

## Future modeling comparison

These are acceptance criteria, not evidence that existing model drafts satisfy the current drawings. The wall v5 model comparison remains pending. Check each unit's bounds (tolerance 0.001 m), component count, origin, closed backs, and materials, then inspect orthographic unlit base-colour views in the four JSON directions. Additionally check the door's narrow left panel, two fields, and handle direction, and the window's four panes. Paper backgrounds and outlines are not asset content.

Generated views may differ in proportions or tones; pixels are not precision measurements. These dimensions define reconstruction, but finished models still need user appearance review. If the original reference and new shape differ materially, revise that component. Numeric documentation cannot override the user's original appearance requirement.

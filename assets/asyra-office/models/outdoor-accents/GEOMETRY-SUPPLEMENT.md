# Outdoor Accents - Geometry Supplement

## Shared conventions

Metres, +Z up, -Y front, X/Y/Z size order. Apply bevels inward and preserve full
bounds. Curves use smooth normals; slat faces remain flat. The bench uses an
explicit construction-to-asset translation before overall XYZ sizing. The sign
uses the unchanged coordinates below. Appearance and geometry remain separate.

## Park bench - procedural generation and unapproved V4 construction

All five [candidate views](review/01-park-bench-v4.png) project one construction.
[Original v1](review/01-park-bench-v1.png) remains the appearance reference.
V4 failed visual review. Its rear arm protrusion, front bend and support contours
remain unresolved; its height rationale is not calibrated. All bench numbers
and curves below, and the corresponding JSON, describe that unapproved proposal.
They must not be promoted to accepted geometry merely because numeric checks pass.

The selected production method is parameterized procedural generation of slats,
frame members and swept arm curves; Blender is optional. Preserve original v1
for appearance comparison and defer further illustrated redraws. Review the
future generated object in multiple views and enlarged details before acceptance.
Overall XYZ sizing and independently replaceable appearance still apply.
No Blender model,
mesh export, runtime implementation or manufacturing acceptance is implied.

### Source authority and revised defaults

Original FRONT object bounds are 556 x 302 source pixels. Normalizing its width
to the existing 1200 mm default gives 651.8 mm height. Select a rounded authored
650 mm height for the coherent construction. This is a visible-proportion guide,
not a calibrated camera measurement. The prior 730 mm default produced excessive
height in full-view comparisons and is superseded here.

Select authored seat top 340 mm. Keeping the 90 mm back boards and 100 mm global
Z pitch then leaves 17.549553 mm between the lowest rounded back edge and seat
plane, replacing the former 77.549553 mm opening. Recompute the entire frame,
arm heights, upper post endpoints and ground-centred envelope from these datums;
do not shrink screenshots or move a part separately in one drawing.

The original illustrations show elevated/perspective cues with unknown cameras.
The revised FRONT/RIGHT/BACK are true orthographic elevations. Ground contacts
therefore share a baseline, and seat upper faces are not artificially exposed.
TOP includes the backrest footprint omitted by original TOP. These explicit
projection corrections prevent retaining incompatible drawing conventions.
They do not prove that the original object cannot exist or that all source
camera parameters have been recovered.

| Quantity | Default value (mm) |
| --- | --- |
| Overall X / Y / Z | 1200 / 508.955165475 / 650 |
| Asset minimum XYZ | (-600, -254.477582737, 0) |
| Asset maximum XYZ | (600, 254.477582737, 650) |
| Construction-to-asset translation XYZ | (0, -39.477582737, 0) |
| Seat top / underside | 340 / 305 |
| Front-leg endpoint / arm crown / rear arm endpoint | 410 / 460 / 410 |
| Rear-post bend Z / highest terminal-cap rim | 290 / 640 |

With a=15 degrees, r=0.0225 m and H=0.65 m:

- Rounded back-board half-height is
  `(0.045-0.005)*cos(a)+(0.015-0.005)*sin(a)+0.005`.
- Top board centre Z is H minus that half-height; lower centres subtract
  0.1 and 0.2 m. Board centre Y is `0.18+(Z-0.29)*tan(a)-0.025`.
- Rear endpoint Z is `H-0.010-r*sin(a)`; Y is
  `0.18+(endpointZ-0.29)*tan(a)`.
- Maximum Y is `endpointY+r*cos(a)`; minimum Y is -0.215 m.
- Depth is `maximumY+0.215`; translation Y is `-(maximumY-0.215)/2`.
- Front-leg centres +/-0.5775 plus radius 0.0225 set width 1.2 m.

Equations and JSON doubles are authoritative; printed decimals are rounded.
Future default mesh dimensional tolerance is 0.5 mm. Apply the
[shared XYZ sizing contract](../README.md#overall-size-and-appearance---2026-10-09)
to the complete unit around its centred ground origin; scale gaps, radii,
bevels and overlaps together before resolving replaceable surfaces.

### Horizontal proportions and inclination

Original BACK supplies one common width-normalization basis:

| Feature | Source pixels | Span |
| --- | --- | --- |
| Front leg centres, row 420 | 967.5 / 1489.5 | 522 |
| Rear post centres, row 160 | 1008 / 1445.5 | 437.5 |
| Back wood, row 155 | 986..1469 inclusive | 484 |
| Seat wood, row 300 | 971..1485 inclusive | 515 |

Normalize all three widths by the same 1155 mm front-leg centre span.
Rear spacing / back width / seat width authored defaults are 970 / 1070 /
1140 mm. Their ratio errors versus the same source basis stay below 0.003.
Rear inset is 92.5 mm per side. The rear outer post surface is 27.5 mm inside
the back-board end before rounding. Do not move rear posts independently of
arm ends, side supports and crossrails.

Original RIGHT dark-post centreline spans (868,160) to (839,270), suggesting
atan(29/110)=14.77 degrees. The authored lean is 15 degrees for both post and
back boards. These estimates are appearance guides, not exact physical scans.

### Slats, supports and rails

| Part | Count | Full dimensions (mm) | Construction placement (mm) |
| --- | --- | --- | --- |
| Seat slat | 4 | 1140 x 100 x 35, XYZ | X=0; Y=-165,-55,55,165; Z=322.5 |
| Back slat | 3 | 1070 width x 30 normal x 90 local height | X=0; Z=403.774776497, 503.774776497, 603.774776497; Y from equation |
| Side support | 2 | 45 width x 372.861716013 length x 25 height | Right endpoints (577.5, -180, 294.5) to (485, 181.205771366, 294.5); mirror X for left |
| Front crossrail | 1 | 1155 x 25 x 25, XYZ | (0, -180, 294.5) |
| Rear crossrail | 1 | 970 x 25 x 25, XYZ | (0, 181.205771366, 294.5) |

Seat centre pitch is 110 mm with 10 mm clear gaps. Back local-up pitch is
100/cos(15deg)=103.527618 mm, leaving 13.527618 mm gaps. Width=(1,0,0),
up=(0,sin(a),cos(a)), front=(0,-cos(a),sin(a)).

Rounded boxes are the Minkowski sum of a core box reduced by twice the radius
and a sphere of that radius. Seat radius is 6 mm, back radius 5 mm and frame
box radius 3 mm. Default future meshes use three segments per quarter arc.
Support centre is its endpoint midpoint; local length is normalized end-start,
width=(lengthY,-lengthX,0), height=(0,0,1). Rear endpoint uses the inclined post
axis at support height, not its ground Y coordinate.

### Posts and caps

All leg/post/arm radii are 22.5 mm. Front legs at (+/-577.5,-180) mm run
Z=0..410 mm. Rear post X is +/-485 mm; its centreline YZ is
(180,0), (180,290), (272.221834383, 634.176571485) mm.
Union closed cylinders with a matching sphere at the internal bend only.
Ground caps are flat; the terminal cap is a flat disk normal to the upper axis,
not a sphere or hemisphere. Its highest rim is 640 mm, 10 mm below the top
back board. Future meshing uses 48 radial segments and a bend sphere with
48 longitude segments / 24 latitude intervals.

### Arm curve and wood exclusion

Four cubic segments define one arm. Right-side controls are below; mirror X
for the other side. The original RIGHT curve guides the rounded front rise and
descending rear profile. At Z=410 mm the rear-post centre Y is 212.153903 mm;
the endpoint is 22 mm behind it. The 240 mm rear turn replaces the earlier
260 mm turn to reduce unnecessary rear protrusion while retaining clearance.
This hidden return is an authored connection, subject to user visual approval.

| Segment | P0 (X,Y,Z), mm | P1 | P2 | P3 |
| --- | --- | --- | --- | --- |
| Rounded rise | (577.5, -180, 410) | (577.5, -180, 450) | (577.5, -155, 460) | (577.5, -120, 460) |
| Descending outside run | (577.5, -120, 460) | (577.5, 0, 460) | (577.5, 120, 455) | (577.5, 200, 440) |
| Rear turn | (577.5, 200, 440) | (577.5, 240, 432.5) | (570, 240, 410) | (530, 240, 410) |
| Post return | (530, 240, 410) | (515, 240, 410) | (500, 234.153903092, 410) | (485, 234.153903092, 410) |

Evaluate each cubic at t=i/32, i=0..32, using
`B(t)=(1-t)^3 P0+3(1-t)^2 t P1+3(1-t)t^2 P2+t^3 P3`.
Deduplicate shared endpoints: 129 points and 128 line segments. Union closed
radius-22.5 mm cylinders and equal spheres at all samples. Adjacent cubic
tangent directions agree (G1), though parameter speeds need not. Future meshing
uses 24 radial cylinder segments and spheres with 24 longitudes / 12 latitude
intervals. This construction is shared by every reference camera.

For each arm and all seven boards, subdivide every polyline segment at spacing
no greater than 0.5 mm. Evaluate exact rounded-box signed distance, subtract
tube radius and half the maximum sample spacing. The 1-Lipschitz distance
bound conservatively covers the whole capsule envelope. Require at least 2 mm
clearance for every pair, not just the centreline or endpoint. Both mirrored
arms currently have minimum lower bound 7.648688 mm.

### Required joins

- Frame box tops Z=307 mm overlap seat underside Z=305 mm before rounding.
  Positive-volume seat/support contacts remain after rounding.
- Crossrails terminate on their respective support axes. Both supports connect
  front legs and inclined rear posts at Z=294.5 mm.
- For each rear-post X and back-board Z, the point
  `(X, 0.18+(Z-0.29)*tan(a)-0.015, Z)` lies inside both board and post.
- Front arm endpoints meet front-leg tops. Rear arm endpoints connect to the
  existing post back side. A midpoint witness between the endpoint and nearest
  post-axis point lies about 11.875 mm inside both metal solids.
- Wood exclusion and metal contact are separate obligations. Do not notch wood,
  overlay a collision, add a patch connector or change draw order to pass.
- Fuse intersecting metal and remove hidden internal faces in future meshing.
  Seven wooden slats form an independent appearance region. Analytic contacts
  do not prove manifold topology of a future mesh.

### Projection and review handoff

`review/bench_geometry.py` owns one component construction.
`review/bench_projection.py` owns only projection and rasterization.
`review/compose-bench-reference.py` builds annotated five-view output.
FRONT/RIGHT/BACK are true elevations; TOP is overhead; THREE-QUARTER has azimuth
25 degrees/elevation 23 degrees. All views use uniform 800 px/m and 2x
antialiasing. Cameras and shared target are in the JSON.

Slanted back-board unrounded TOP depth is 52.271489 mm; Y pitch is 26.794919 mm.
Depth testing therefore overlaps the three back boards and occludes part of
the rear seat. This is not an independently placed TOP patch.

The report binds source/specification/generator/geometry/output hashes and
records six back/post contacts, sixteen frame/seat contacts, two arm joins and
fourteen complete arm/wood bounds. Permanent checks include the old penetrating
arm, the formerly flat profile, original-proportion default reconciliation,
and a geometry mutation that must change every view.

Source appearance remains distinct from these technical gates. Review full
views and local arm/post, cap and seat/support crops. The original illustrations
have no verified camera calibration; do not advertise pixel-perfect recovery.
Default wood #B68050, grain #95683E and metal #343633 remain independently
replaceable; see [surface rules](SURFACE-RECIPES.md#bench-defaults-and-replaceable-regions).

## A-frame coordinates and hardware - revised 2026-10-09

This revision retains the original chalkboard PNG. The complete fixed-open unit
is one asset. Exact hardware dimensions and hidden attachments below are authored
construction defaults guided by the visible reference, not calibrated pixel
measurements. No generated geometry or visual acceptance is claimed.

### Reference callouts

The [annotated sheet](review/02-entry-chalkboard-annotated-v1.png) preserves
all five original views at their existing positions and scale. Blue notes and
leaders are annotations, not geometry, shadows or material texture.

| Callout | JSON component | Meaning |
| --- | --- | --- |
| 1 | `hinge-covers` | Two outer tapered metal plates |
| 2 | `hinge-heads` | Two visible circular axle heads |
| 3 | `side-spreaders` | Two rounded wooden support bars |
| 4 | `spreader-fastener-heads` | Four visible heads, two per side |

Overall dimensions on the sheet are rounded to 0.001 mm for readability;
use the formulas and numeric specification for construction. The source PNG
and its historical dimension labels are unchanged. The added notes explicitly
identify 0.40 m as wooden-frame width and 0.37 m as an approximate old label.

### Frame, panel and ground

Use metres, +Z up and -Y front. Front origin P=(0,-0.17,0), rear
P=(0,+0.17,0). Width W=(1,0,0). Front up U=(0,sin14,cos14), front
outward N=(0,-cos14,sin14). Rear up U=(0,-sin14,cos14), rear outward
N=(0,cos14,sin14). Transform local (w,u,n) as P+w*W+u*U+n*N.
Each frame leans 14 degrees from vertical; the open angle is 28 degrees.

Each frame has two posts centred at w=+/-0.1825,u=0.35,n=0, sized
0.035 x 0.70 x 0.024 in width/up/normal. Two rails are centred at
(0,0.155,0) and (0,0.665,0), sized 0.33 x 0.035 x 0.024.
Join unrounded wooden mating faces before beveling exposed edges. Do not
bevel mating seams into holes. Post outer X faces remain at +/-0.200.

Wood edge radius is 2 mm. The circular quarter profile has three straight
segments with samples at 0, 30, 60 and 90 degrees, including both tangent
points. These samples must be present in the local up/normal silhouette;
a one-segment chamfer or an unspecified smoothing operation is not equivalent.
Clip below global Z=0 after beveling and cap each cut without another bevel,
leaving four flat feet. No final envelope rescaling is used to hide differences.

Each panel is 330 x 475 x 8 mm, centred at local (0,410,4) mm.
Its up interval is 172.5..647.5 mm, matching the lower rail's upper edge and
upper rail's lower edge. Its outward face n=8 mm is recessed 4 mm from the
wood face n=12 mm. Keep board and wood independently configurable.
The rear panel remains blank charcoal. Lettering and arrow geometry below
are unchanged.

### External hinge covers and axle heads

The former two buried cylinders do not reproduce the visible metal fitting.
Replace them with the following fixed, non-animated assemblies on both sides.
Numbers in this subsection are millimetres; left assemblies mirror X.

- Right cover: extrude the YZ trapezoid (-18,673), (18,673), (25,630),
  (-25,630) over X=199..202. Left X=-202..-199. Round profile corners
  inward with 2 mm circular fillets tangent to adjacent edges, using three
  equal angular intervals between each pair of tangent points. Bevel the
  axial edges 0.5 mm with two segments. The unrounded trapezoid bounds are
  construction guides; rounded corners are inset, not added outside them.
- Each cover overlaps the wood side by 1 mm before the edge bevel. Its top
  stays below the wooden frame top. At Y=0,Z=656 both frames provide wood
  behind the cover, so it must not float beside the frame.
- Axles: X-axis cylinders, centres (+/-198,0,656), radius 3.5, length 12,
  32 radial segments. Right X=192..204, left mirrored.
- Visible heads: centres (+/-202.5,0,656), radius 7, axial length 3,
  32 radial segments; 0.5 mm edge bevel with two segments. Right
  X=201..204. Join each head and axle. Do not add a screw slot or threads.

The cover's tapered silhouette and central round head are visible requirements.
The concealed axle length is an authored completion. These coordinates define
a static open pose, not a working hinge mechanism or a folding animation.

### Rounded spreaders and four fasteners

Each wooden spreader keeps centre (+/-203,0,300) mm and 10 x 198 x 26 mm
X/Y/Z bounds. Its YZ outline is a rounded rectangle, Y=-99..99 and
Z=287..313, with 4 mm circular corner radii and three equal segments per
quarter. Extrude along X and bevel only its front/back profile edges 1 mm
with two segments; do not round the YZ outline a second time.
Right X=198..208, left mirrored. The flat X faces at the fastener centres
remain intact. This specifies rounded ends instead of an ambiguous box.

At Z=300, the front/rear post centre lines are Y=+/-95.201599 mm.
Place each pair of visible fasteners at Y=+/-87,Z=300, within both the
post and spreader silhouettes. There are four heads in total, two per side.

- Shafts: centres X=+/-200.5, radius 3, axial length 15, 24 radial segments.
  Right X=193..208, left mirrored. Each shaft passes through wood from the
  frame into the spreader; no detached decorative discs.
- Heads: centres X=+/-208.5, radius 7, axial length 3, 32 radial segments.
  Right X=207..210, left mirrored. Bevel edges 0.5 mm with two segments.
  Each head embeds 1 mm into the spreader and projects 2 mm outside it.
- Union each shaft/head pair and remove buried faces in the final assembly
  while preserving material regions. No extra holes, slots or moving joints.

### Exact default envelope and scaling

| Quantity | Default (mm) |
| --- | --- |
| Wooden frame width | 400 |
| Width including spreaders | 416 |
| Complete width including fastener heads | 420 |
| Complete depth after the specified bevel | 362.319409848225 |
| Complete height after the specified bevel and ground cut | 681.626227349194 |
| Asset minimum XYZ | (-210, -181.159704924113, 0) |
| Asset maximum XYZ | (210, 181.159704924113, 681.626227349194) |

For a=14 degrees, the exact default depth in metres is
`2*(0.17 + 0.012*cos(a) - 0.002*sin(a))` and height is
`0.70*cos(a) + 0.010*sin(a)`. With the specified three-segment bevel,
the supporting arc sample for both extrema is the tangent endpoint;
the 30/60-degree samples do not extend farther in those directions.
The feet still intersect Z=0 before clipping. All new hardware lies within
the depth/height bounds; the four spreader heads determine the full width.

The PNG's 0.40 m annotation refers to the wooden frame only. Its historical
0.37 m depth annotation is approximate and is not a competing exact size.
The old 416 x 370 x 690 mm overall default is superseded. Use the full
420 x 362.319409848225 x 681.626227349194 mm box when resolving the shared
XYZ size override. The origin remains the ground-level footprint centre.
Allow at most 0.5 mm deviation per overall extent in a future generated mesh;
this is a validation tolerance, not permission to alter the design.

## Flat chalk lettering

Front wording is exactly Good / Ideas / Live / Here, one word per line, plus a right-pointing arrow below. JSON supplies every glyph as an SVG stroke path, so no external font is needed. Glyph cell width 50, tracking 8, stroke width 3, round caps/joins, no fill. SVG Y points down. For N letters, total advance T=50*N+8*(N-1), character i offset i*58. Use scale 0.00075 m per glyph unit: w=(offset+glyphX-T/2)*scale and u=lineTop-glyphY*scale. Line tops are 0.585,0.485,0.385,0.285. Draw on front plane n=0.008, centred per line.

Arrow is a flat stroke from (w,u)=(-0.07,0.19) to (0.07,0.19), with head through (0.045,0.21),(0.07,0.19),(0.045,0.17). Width 0.0025, round caps. Vector paths are deterministic authored handwriting, not recovered exact chalk contours. Do not extrude text, add a chalk dust shadow or print on the rear.

## Future checks

No models were built. Future checks: four seat/three back slats, four bench legs, two rounded arms, sign's four feet and two boards, correct outward normals, flat ground contacts, complete wording and right arrow, fixed open pose and no baked lighting. Bench defaults use the exact bounds above with at most 0.0005 m dimensional deviation; positive-volume joins must remain connected. The sign uses the exact revised envelope above with 0.0005 m dimensional tolerance; verify both covers, two hinge heads and four spreader heads, their visible contours and all attachments. Inspect five views plus undersides after modeling is separately authorized.

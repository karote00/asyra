# Small Plants - Geometry Supplement

## Coordinates and assembly

Metres, +Z up, -Y front; pot bottom centre is the origin. Plant azimuth is measured from +X toward +Y. Front view sees negative X on the left. Pot, soil, plant stems/leaves and cactus branches remain separate named parts inside one placeable unit. Concealed overlap at roots or branch attachments is intentional. Do not add outside roots or separate saucers.

## Pots and soil

Revolve each JSON closed radius/height profile about Z with 96 circumference segments. Connect profile vertices with straight segments and close the profile from last to first. Weld axis vertices. Apply inward edge bevel 0.0008 with three segments, preserving nominal bounds. Smooth circular normals. The flared lip is part of this section, not a loose ring.

The leafy pot has top diameter 0.14, height 0.12 and bottom diameter 0.094 at ground. The cactus pot has top diameter 0.13, height 0.11 and ground diameter 0.084. Interiors are real cavities with solid bottoms, not dark discs simulating holes. Both pot undersides are flat, closed and unmarked; no drain hole or glazed label.

Soil starts as an independent opaque cylinder at the radius and Z interval in JSON, then intersect its entire volume with the actual pot cavity. This removes buried soil/pot intersections along the tapered inner wall while preserving the declared flat top below the rim. Root stems overlap its upper face. The narrow clearance to the inner pot wall is intentional and should remain below 0.001 m. Do not add gravel, mounds, cracks or individual grains.

## Folded-leaf plant

Central stem is a capped tapered Z-axis cylinder, Z=0.10..0.29, radii 0.0035 and 0.002, 24 radial segments. Each generated leaf has a separate petiole from (0,0,attachZ) to (0.009*cos(a),0.009*sin(a),attachZ+0.005), radius 0.0015, 16 radial segments, capped and intersecting the stem and leaf base.

For each instance define er=(cos(a),sin(a),0), et=(-sin(a),cos(a),0). For t=0..1, radial coordinate R(t)=0.009+(tipRadius-0.009)*t; height H(t)=attachZ+0.005+(tipZ-attachZ-0.005)*t+0.008*sin(pi*t). Centreline C(t)=R(t)_er+H(t)_(0,0,1). Half-width W(t)=width/2*sin(pi*t)^0.85.

For q=-1..1, the leaf surface is C(t)+q*W(t)*et+0.003*(1-abs(q))*sin(pi*t)*(0,0,1). Make top and bottom surfaces offset by +/-0.0003 in Z, then close their boundary edges. Use 24 intervals along t and eight across q. Weld coincident width-zero vertices at each tip on each face and cap the thickness there. No disconnected cards or black backs. The central fold is actual geometry, not a painted vein.

The six JSON instances are the original shape scaffold with three opposite pairs. The owner superseded that fixed layout with the seeded recipe below on 2026-10-26. Drawings retain the approved blade and vessel style, not a mandatory six-leaf arrangement. Nominal height 0.32 m is a reference, not an exact bound for every seed; measure the generated geometry before requested whole-unit resizing.

## Cactus trunk and branches

Main trunk starts at Z=0.095, partly buried in soil. Its radial function is R(phi)=0.024+0.002*cos(8*phi); use 96 circumferential segments. Continue vertically to Z=0.274 and close the bottom. The top cap follows X=R(phi)*cos(v)*cos(phi), Y=R(phi)*cos(v)*sin(phi), Z=0.274+0.026*sin(v), v=0..pi/2, with 16 latitude intervals; weld the apex. This makes eight subtle ribs and one rounded tip, total height 0.30.

Each branch follows its four-point cubic Bezier B(t)=(1-t)^3*P0+3*(1-t)^2*t*P1+3*(1-t)*t^2*P2+t^3*P3. Use 32 path intervals and 48 circumference segments. Cross-section frame uses fixed +Y and the unit perpendicular to the tangent in X/Z. Radius is r+ribAmplitude*cos(8*phi). End-cap radial profile is multiplied by cos(v), while tangent displacement is r*sin(v), v=0..pi/2. Close and weld cap tips. Union the branch roots into the trunk or keep concealed intersections; do not leave floating seams.

Left branch is at negative X, ending near (-0.05,0,0.20); right is positive X, ending near (0.055,0,0.23). Handedness must not flip between views. One trunk and two branches only. No sharp spine geometry, flowers or fruit.

Areoles are flat cream capsule masks on the eight rib crests, at the listed main Z heights and branch curve fractions. Capsule length 0.003 along the local tangent and width 0.0015 around the surface. Round caps, no extrusion; omit masks hidden inside a branch intersection. Do not add areoles to the rounded cap tips. These are symbolic cactus markings, not a botanical spine system.

## Future validation

After modeling is authorized separately, compare front -Y, right +X, back +Y, top +Z and oblique (1,-1,0.8), plus pot undersides and empty pot cavities with soil hidden. Check pot bounds, ground contact, 6..9 leaves, two cactus branches, component names, flat soil and no baked lighting. Nominal dimension tolerance 0.001 m. No such model checks have been run in this drawing-only batch.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Potted foliage and cactus

The leafy plant uses one tapered stem, 6..9 thick folded leaves and one petiole per leaf. Width-zero endpoints must be welded on each skin independently, with closed thickness edges; never duplicate degenerate quads at a tip. Plant height is approximately 320 mm, and the actual constructed leaf bounds include the 0.6 mm thickness. Use those bounds for exact target-size scaling, not the approximate 260 mm crown span.

Both soil volumes are clipped to their pot cavities, retaining the flat upper surface; untrimmed cylinders penetrate the tapered inner pot walls. Preserve the intentionally small top clearance. The cactus retains eight ribs on its trunk and each of two branches. Branch roots overlap the trunk; areoles are flush surface masks, not separate spines.

LoD keeps every generated leaf, their thickness, cactus branches, pot cavities and ground contacts. Lower leaf grids and radial intervals first; preserve fold extrema and cap poles. Pot/soil/stem/leaf/cactus/areole appearance regions remain replaceable, with construction-time seeded variation only; LoD and camera changes never reroll foliage.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. The original drawing batch introduced no Blender export. The seeded recipe below now defines the app foliage construction; cactus modeling remains separate.


## Seeded individual growth - 2026-10-26

The potted-leaf module's `growth` object owns numeric ranges. It affects only
foliage; pot, soil, stem, materials and cactus remain unchanged. Accept unsigned
32-bit integer seeds, default 606. A local LCG starts at the seed and updates
`s=(1664525*s+1013904223) mod 2^32`; each sample is `(s+0.5)/2^32`.
No frame time, shared mutable RNG or render-dependent input is allowed.

Draw the integer leaf count N=6+floor(u*4), then initial azimuth phase=360*u.
Average the two members of each original pair to obtain three age profiles:
reach, width and rise=(tipZ-attachZ). For each i=0..N-1, draw the stratum jitter
in [0.2,0.8] and set age=(i+jitter)/N. Interpolate profiles linearly at age*2.
Then draw, in order: azimuth jitter +/-28 degrees, reach scale [0.80,1.15], width
scale [0.80,1.15], rise scale [0.65,1.25], arch scale [0.65,1.35], roll [-22,22]
degrees and lateral bend [-0.012,0.012] m. Continuous ranges are half-open.

Attachment Z=0.145+age*(0.270-0.145); azimuth=phase+i*137.507764+jitter.
Use the interpolated dimensions multiplied by their sampled scales. tipZ is
attachment Z plus scaled rise. Reference fold/thickness, grid and closures are
retained. In the blade formula above, multiply the centreline arch by archScale;
add bend*sin(pi*t)*et. Replace the transverse term q*W*et with
q*W*(cos(roll)*et+sin(roll)*(0,0,1)). Roll and bend vanish at the width-zero/root
endpoints; petioles still terminate at each actual blade root. Every leaf remains
a closed two-skin surface. The unscaled generated envelope is within
X/Y +/-0.18 m, Z 0..0.37 m, with leaf geometry above the pot rim.

Scene plant identity supplies a stable seed: FNV-1a uint32, initial 2166136261,
XOR each ASCII layout ID character followed by multiplication by 16777619.
Scene traversal, camera, reload and panel selection cannot change that identity.
Construction runs once for each scene session. Existing preview uses seed 606
through the same factory. No extra display-only foliage is permitted.

Keep 6..9 leaf meshes and the original fixed mesh grid; do not grow unbounded
leaf populations to conceal an unsuitable arrangement. Automated checks cover
seed diversity/repeatability, staggered roots, leaf/petiole attachment, vessel
preservation, finite geometry, bounded dimensions and scene identity diversity.
App screenshots establish visible arrangement separately from those checks.


### Soil-rooted indoor rosette

The approved full-office sink and lounge plants have broad leaves originating
near the vessel rim, rather than staggered leaves on a tall central stalk.
`growthVariants.rosette` retains the same closed vessel and blade construction,
but restricts root heights to 105-128 mm and the stem top to 130 mm. Older outer
leaves spread roughly 140-145 mm from the axis; younger central blades rise to
390-400 mm before seeded variation. Blade widths are 50-70 mm. These default
construction dimensions describe the reusable form; scene-specific pot and
foliage image bounds determine its final size. Hidden growth choices are authored,
not recovered measurements. The original stemmed default and exterior consumers
are unchanged. Colors and materials remain replaceable independently of form.

# Pantry Smallware - Geometry Supplement

## Coordinates and construction

Metres, +Z up, -Y front; origin is the centre of the bottom contact plane. Size order X/Y/Z. Front/right/back/top directions are -Y/+X/+Y/+Z; oblique is (1,-1,0.8). A rotational profile is an ordered closed polygon of (radius,Z). Revolve it around Z using 96 equal angular intervals. Connect matching ring vertices with quads; triangulate consistently. Collapse each radius-zero ring to one vertex to avoid degenerate faces. Close the profile to its first vertex. The resulting solid's boundaries include the specified hollow regions; do not fill cavities with extra cylinders. Smooth curved sides, retain hard normals at profile corners. No additional bevels unless stated; chamfers already appear in the profiles.

## Canister

Body profile in JSON defines a pale sage ceramic pot with a rounded-looking chamfered lower rim, straight sides, thick base and hollow interior. Maximum body radius 0.043, top Z=0.117, interior radius 0.039, interior floor Z=0.006. The short shoulder and rim are explicit profile segments. This is an opaque ceramic container, not glass. No label or handles.

The wooden lid is a separate rotational solid with a shallow locating plug. Plug radius 0.0385, Z=0.116..0.117; it fits inside the 0.039 opening with 0.0005 radial clearance. The upper disk reaches radius 0.045 and Z=0.125. The lid rests on the body's top rim at Z=0.117. Profile corners form small chamfers; no knob, gasket, hinge or latch. Underside uses the same wood material. Show the unit closed; hollow interior is specified so no tool must guess it later.

## Takeaway cup

Paper body is a rotational shell with flat bottom, tapered side, thickened top lip and a hollow interior. Follow JSON vertices directly. Its outer main wall between Z=0.0015 and 0.108 follows radius r(z)=0.026+0.011*(z-0.0015)/0.1065. The top lip reaches Z=0.112. The lower internal floor is Z=0.004. Body wall thickness follows the two profile sides; do not add a generic solidify modifier that changes bounds.

The kraft sleeve is a separate open-ended conical band over Z=0.035..0.075. Inner radius equals r(z), outer radius r(z)+0.001. Revolve the closed quadrilateral [(r(0.035),0.035),(r(0.035)+0.001,0.035),(r(0.075)+0.001,0.075),(r(0.075),0.075)]. It touches the cup surface without an air gap. Top/bottom annular edges are kraft; no corrugation, glued seam, logo or printed design.

The ivory lid is a separate rotational solid from the JSON profile, maximum radius 0.04, Z=0.111..0.12. Its shallow raised annular rim is at Z=0.12, while the central top disk is at Z=0.119. Its underside overlaps the body's lip slightly as an authored static fit; this is not a manufactured snap-fit or removable mechanism. Subtract one vertical elliptical prism centred (X,Y)=(0,-0.026), semi-axes (0.007,0.0025), Z=0.110..0.121, sampled with 48 perimeter segments. This creates a real through opening near the front, not a black decal or fake recess. Keep lid thickness at the hole, with no fill disk. All cut faces use the lid material. Do not add liquid, a straw or a second vent.

## Views and future model checks

The canister's front/right/back share the same silhouette; top is a wooden disk. Cup top shows one oval opening toward -Y, front is aligned with that opening, and rear does not gain a second opening. The cup bottom is cream and the jar bottom sage, both flat and undecorated. Hidden surfaces are determined by the profiles.

For the original standalone canister and takeaway cup, the following remains a modeling acceptance contract; it is not the implementation status of the scene-specific variants below. Modeling acceptance: profile dimensions within 0.0005 m; correct closed assembled silhouettes, real hollow interiors and sip opening, separate bodies/lids, one continuous sleeve, no extra components and no baked lighting. Inspect all five views and the underside after separate modeling authorization. Drawings are design references, not a claim of calibrated orthographic accuracy.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Lids, clearances and cup opening

Canister extent is 90 x 90 x 125 mm. Lid locating radius 38.5 mm fits the 39 mm mouth with 0.5 mm radial clearance, and its underside rests on the rim at Z=117 mm. Body floor is 6 mm thick. Keep lid and body separate.

Cup extent is 80 x 80 x 120 mm. Sleeve follows the same outer taper as the paper with 1 mm radial thickness. The 14 x 5 mm sip cutter exits the lid at both ends; it cuts only the lid, never the vessel wall or sleeve. Its nearest radial edge is well within the upper lid disk. Preserve the empty cup cavity beneath it. Lid/body overlap is the explicit static visual fit, not a verified removable seal.

Ceramic/wood or paper/lid/kraft remain replaceable regions. LoD preserves real mouths and sip opening, lid steps and sleeve separation; reduce angular sectors only and weld zero-radius endpoints. Never put a dark disk over either cavity.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. This original modular contract introduces no Blender export. The scene-specific variants below are also consumed by the app and its asset preview.

## Original pantry vessel variants

`sourceVariants` in the JSON owns the scene-specific vessel profiles, colours,
roughness, opacity and counter-bottle scale. The existing `pantry-canister`
module remains the separately approved plain canister, not the geometry for
every container. `pantryVessel` consumes each named source profile directly.

All dimensions below are metres in X/Y/Z. Profiles are radius/Z and revolve
around +Z, with bottom contact at Z=0. The original oblique pantry crop gives
relative silhouettes; its hidden cavities and exact cross-sections are authored
reconstruction, not physical measurements extracted uniquely from the image.

| Variant | Maximum envelope (X/Y/Z) | Visible source distinction |
| --- | --- | --- |
| Refrigerator night-light | 0.136 / 0.136 / 0.300 | Dark base, clear shade, warm diffuser, pale cap and top loop |
| Small shelf vessel | 0.100 / 0.100 / 0.120 | Brown plant pot, no lid; small foliage extends above this vessel envelope |
| Ivory shelf jar | 0.207 / 0.207 / 0.340 | Clear glass; ivory contents; yellow paper label; pale shallow lid |
| Ochre shelf jar | 0.182 / 0.182 / 0.285 | Clear glass; ochre contents; green paper label; gray lid |
| Brown shelf jar | 0.161 / 0.161 / 0.215 | Clear glass; brown contents; wide mouth and inserted tapered cork |
| Chili-style bottle | 0.061970588 / 0.061970588 / 0.1505 | Clear glass; ochre contents; shoulder, long narrow neck and small cap |
| Shelf succulent | 0.185 / 0.185 / 0.303 | Opaque blue pot, brown rim, fleshy leaves and dark flower bud |
| Blue-white floor jar | 0.128 / 0.128 / 0.200 | Rounded belly, blue neck/foot bands, knob |
| Counter green bottle | 0.086 / 0.086 / 0.160 before 0.9 instance scale | Independent retained bottle profile, not the revised shelf object |

The latest owner clarification identifies four transparent condiment containers
followed by one succulent pot. `reference-shelf-condiments.png` owns their shelf
order and relative appearance. For the third jar, the newer owner-supplied
[real cork-jar photograph](reference-cork-jar.png) overrides the blurry shelf
crop for the mouth, shoulder and stopper construction. The latest written owner
clarifications govern the first two paper labels and the fifth succulent. The
fifth-container assumption and the assertion that all green/yellow areas were
food are superseded: the first two jars carry yellow and green paper.

The first three glass bodies have a nominal 2 mm radial wall and a 6 mm bottom.
The fourth bottle scales both thicknesses proportionally as specified below.
Shoulders and rolled lips follow their explicit inner/outer JSON profiles rather
than a uniform-thickness modifier. Their shared defaults are neutral #E8F0EE
tint, alpha 0.16, roughness 0.10 and studio reflection intensity 0.30. Contents,
paper and closures are separate regions with independent color overrides. Do not
paint the glass to create ingredient color. Stable jar preview IDs retain their
historical color names; the obsolete `shelf-herb-jar` preview is replaced by
`shelf-succulent`, using the existing shelf-plant constructor family.

| Preview ID | Owner-confirmed appearance | Fill top / glass top (mm) |
| --- | --- | --- |
| shelf-cream-jar | Ivory contents #E9DFC7; yellow paper #C9AF63 | 239 / 297 |
| shelf-sage-jar | Ochre contents #B9A16A; green paper #7D8655 | 177 / 231 |
| shelf-brown-jar | Brown contents #8A6341; cork #A47B55 | 135 / 190 |
| shelf-amber-jar | Chili-style narrow-neck bottle; contents #C49346 | 90.3 / 139.286275 |

Ingredient names are not confirmed. The owner confirms color and container form,
not sugar, dried herbs or a specific spice. Papery labels are opaque closed curved
shells at body radius +0.5 to +0.9 mm, not full-circumference bands. The first
label spans Z=135-175 mm and angles -154 to -67 degrees. The second spans
Z=55-151 mm and -146 to -52 degrees. Their radii are 102.5 and 90 mm before
paper offset. These latest labels override previous no-label instructions for
these source instances; do not invent lettering from unreadable source pixels.

The third jar follows the owner-supplied `reference-cork-jar.png`. Keep the
161 x 161 x 215 mm assembly envelope, but use a wide opening instead of a narrow
bottleneck with a separate oversized disc. Body radius is 80 mm up to Z=145 mm;
the rounded shoulder gently narrows to radius 70 mm at Z=177 mm. The rolled glass
lip reaches radius 73 mm at Z=185-188 mm and ends at Z=190 mm. Its inner mouth
radius grows from 68 mm at Z=177 mm to 69 mm at Z=190 mm.

The cork is one continuously tapered stopper: bottom radius 66.5 mm at Z=176 mm,
radius 67.5 mm at Z=182 mm, 68.5 mm at the mouth plane Z=190 mm, and 70.5 mm
at Z=204 mm. Its rounded upper edge reaches radius 70.8 mm at Z=209 mm and
transitions to a flat top of radius 64 mm at Z=215 mm. Thus 14 mm of the stopper
sits inside the mouth, and 25 mm remains visible above it. The glass lip surrounds
the inserted cork with 0.5 mm radial clearance at the mouth; there is no exposed
thin stalk, wide ledge, detached cap, button or screw collar. The cork uses a
replaceable neutral fleck surface and planar top UVs, never radial fan mapping.
For this square cork texture, the UV extent is the maximum of the profile
maximum Z coordinate, diameter and circumference; both charts stay inside [0,1]. This prevents the
side texture from clamping into a blank band. The top and side use the same
physical texture scale.
Its brown contents remain unchanged in color; the lower fill radius has 1 mm
clearance from the interpolated glass interior. Measurements are scene-scale
construction dimensions derived from the photo silhouette, not product metadata.

The fourth bottle's complete height, including its cap, is 70% of the third
jar's 215 mm height: 150.5 mm. Uniformly scale its former 255 mm construction by
150.5 / 255 = 0.5901960784313725 on all three axes, about the bottom center.
This applies to the glass, contents, shoulder, neck, cap, wall and bottom
thicknesses together, not just the bottle body or vertical axis. Its final
maximum diameter is 61.970588 mm. The shelf contact and center remain unchanged;
colors, opacity, material choice and normalized texture proportions are retained.

The canonical JSON stores the final dimensions directly; do not apply this scale
again in the scene or preview. The following rounded measurements describe them:
body radius 30.985294 mm; shoulder Z=70.823529-106.235294 mm; neck radius
12.394118 mm over Z=106.235294-135.745098 mm; lip radius 14.164706 mm over
Z=136.925490-139.286275 mm. Cap radius is 15.345098 mm, spanning
Z=138.696078-150.5 mm. Contents stop at Z=90.3 mm and remain inside the
interpolated glass interior. Nominal wall and bottom thicknesses become
1.180392 and 3.541176 mm. Do not retain a full-width jar lid or a solid fill
that intersects the narrowed shoulder.

Ingredient surfaces use neutral albedo variation only, without baked lighting.
The 512 x 128 surface charts have aspect ratio 4; side and separate planar top
UVs remain inside [0,1] and preserve physical proportions. Glass reflection uses
the existing public Spatial API, without live refraction or scene capture.

### Fifth shelf object - succulent pot

`sourceVariants.shelfSucculent` owns the complete geometry. The opaque blue pot
uses #596B7A, with a thin brown #89654D rim at Z=197-205 mm. Maximum radius is
92.5 mm; soil radius is 81 mm at Z=197 mm. Twelve individually defined fleshy
leaves form staggered rings of seven and five, with varied tilt, length and green
colors. They reuse the existing rounded-petal geometry, not a solid leaf ball.
A green stem starts in the soil and reaches the dark #4D302C bud centered at
(24,4,277) mm. The bud uses radii (22,16,25) mm and a small tilt, staying within
the 303 mm height envelope. There are no glass walls, stored ingredients or lid.
The blue pot body ends at Z=197 mm, where the brown rim begins; the two
regions do not duplicate the upper surface. All part colors and overall XYZ
scale remain independently replaceable. The
fifth shelf anchor is unchanged; the two original left-side plants are preserved.

The blue-white floor jar keeps its replaceable `porcelain-floral` surface, a
512 x 256 blue flower/vine repeat on ivory glaze. Body V follows Z/body height;
U wraps once with matching seam pixels. The source motif is interpreted, not an
exact recovered painting.

The owner-confirmed refrigerator object is a night-light, superseding the jar
interpretation. `reference-fridge-night-light.png` is the visual authority and
`sourceVariants.nightLight` supplies inferred construction defaults in metres.
Base Z is 0-75 mm; the clear shade spans 75-225 mm with a 3 mm radial wall.
The warm diffuser spans 91-201 mm inside that enclosure. The lower ring spans
72-83 mm and the cap 222-263 mm. A 3 mm radius tube forms a 20 mm radius loop
centered at Z=277 mm, with its lower arc anchored inside the cap. Total height
is 300 mm and base diameter 136 mm. There is no paper label, stored contents,
pour spout or jar knob. Independent defaults: base #665447, glass #E2E5E2 at
alpha 0.22/roughness 0.16, diffuser #FFDBA0, ring/loop #B5ABA1, cap #D8D1CC.
All colors remain replaceable. The diffuser has emissive color #FFB35C and
intensity 1.75 through the public Spatial material contract. Changing its region
color also changes the emission color. The other regions remain non-emissive.
Emission makes the core luminous independently of scene lights. Office opts into
Preset emissive bloom at strength 0.315 and radius 8 CSS pixels for a soft halo.
This does not cast light onto nearby surfaces. Geometry and placement are unchanged.

Every region has independently replaceable appearance. Shelf profiles use
64 angular intervals and local label arcs 32. Each complete vessel stays below 6,500 master
triangles. All six shelf recipes retain `preserveFullDetail: true`: no independent
region decimation may intersect a label and its body. Other recipe distant meshes
remain as separately tested existing behavior. Performance gates never authorize
substituting visible source detail.

### Shelf flowering plant and small leafy plant

`sourceVariants.shelfPlant` owns the low ochre pot profile, soil datum and tapered
foliage transform. Pot diameter is 142 mm and height 108 mm. Soil top is 99 mm.
Nine unequal sprigs retain individual leaf meshes. Relative to the source shrub's
130 mm foliage datum, vertical distances scale by 1.25 from the new 100 mm datum;
radial spread interpolates from 1.5 to 0.55 over 240 mm of source height. This
creates a broad lower crown tapering upward. The owner confirmed this is a
flowering plant: five separately oriented blooms at 230-290 mm above the pot
bottom are distributed among the leaves. Petals default to pale yellow #EAD48C,
centers to ochre #C19D5A, and stems to green #526C3C. Each bloom uses five thick
rounded petals; exact species and petal count are construction inferences, not
recoverable source facts. Stems connect to the soil and heads retain independently
replaceable appearance. JSON owns individual positions, rotations and sizes.

The second shelf item is also a plant. Keep its existing 100 x 100 x 120 mm
brown vessel and add soil at 112 mm with radius 45 mm. A small stemmed plant
uses XYZ foliage scale 0.32/0.32/0.40 from the 130 mm source datum to the new
115 mm datum. It must remain shorter than the adjacent cream jar. The internal
`shelf-spice-jar` key now identifies its retained pot geometry, not an empty
spice container; the scene combines it with foliage.

These changes affect these shelf instances only,
not the refrigerator shrub or other plants. Scene support remains the shelf top.

### Visual verification

Geometry closure, support and size tests are engineering evidence. Production
screenshots must additionally be compared item-by-item against the enlarged
reference: silhouette, lid/shoulder, local label placement, relative size, spacing,
leaf crown and capped jar tops. Low-resolution hidden details remain uncertain;
do not claim exact recovered markings or full visual approval from passing tests.


## Additional framed night-light

The original night-light recipe and reference remain retained. The owner added
a second asset, `frame-night-light`, and selected it for the refrigerator.
See `FRAME-NIGHT-LIGHT.md` for its complete dimensions, two owner photographs,
single-part five-view reference, replaceable appearance and bottom light source.
The second photograph establishes perpendicular crossed arches, not parallel
frames. Both assets are available through the existing asset review route.

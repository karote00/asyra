# Modular Office Puppet - First Body Profile

Status: `office-man` documentation approved for commit after scoped numeric checks. No model,
Blender process, renderer, animation rig or wardrobe runtime has been produced.
This is the current male construction contract. The female baseline is separate.

## 1. Reference measurements and authority

Use [the existing male sheet](review/01-man-v1.png) for appearance and
[the measurement record](man-reference-measurements.json) for measurement inputs.
The front silhouette spans approximately pixels Y=283..782. With the retained
1.20 m styled height, scale is 1.20/499 = 0.002404809619 m/px. The front centre is
X=205 px. Default conversion is X=(px-205)*scale, Z=(782-py)*scale.
Picks are approximate (about +/-3 px), not exact camera calibration.

The measurement record separates `measuredMetres` (unrounded pixel conversion),
`referenceTargetMetres` (rounded visual target), and `modelDefaultMetres`
(construction input, with its numeric source). Never use the visual target in
place of the construction input. Differences are recorded against the unrounded
measurement and must stay within the 10 mm landmark tolerance.

Hair width measures about 279 px -> 670.94 mm; adopt a 672 mm target. Hand span
measures 266 px -> 639.68 mm; adopt 640 mm. These replace the old narrow-haired
proportions. The old sheet caption "head width approx. 0.52 m" is superseded;
it must be relabelled before treating the sheet as a dimensioned production
reference. Do not alter the silhouette to match that stale caption.

| Default | Value | Authority |
| --- | --- | --- |
| Styled height | 1200 mm | Retained design scale; hair bound must be verified |
| Hair envelope target | 672 mm wide | Front silhouette measurement |
| Bare skin head | 560 x 456 x 560 mm | Authored ellipsoid, X/Z fitted to visible face |
| Skin head centre | (0, 0, 836) mm | Authored under-hair completion |
| Chin elevation | 556 mm | Front chin landmark |
| Eye centres | X=+/-106, Z=721 mm | Front facial landmarks |
| Nose centre | X=0, Z=685 mm | Front facial landmark |
| Mouth end elevation | 642 mm | Front mouth landmark |
| Ear span | 634 mm | Authored rounded ears fitted to silhouette |
| Hand span | 640 mm | Front silhouette measurement |
| Shirt body maximum width | 316 mm | Front garment proportions |
| Shirt hem | 315 mm | Adopted geometry within 10 mm of 322 mm measured target |
| Waist button elevation | 303 mm | Front landmark |
| Shoe span | 346 mm | Front footwear proportions |
| Shoe top | 95 mm | Adopted geometry within 10 mm of 89 mm measured target |

All Y depths, under-clothing skin, garment interior surfaces, root coverage and
hidden connections are explicit authored choices in
[the numeric specification](man-puppet-model-spec.json). SIDE is qualitative
depth evidence; TOP is a tilted appearance view, not an orthographic source.
No document can establish exact reconstruction of hidden geometry from this
sheet. Defaults are deterministic reconstruction inputs, not verified results.

## 2. Independently replaceable groups

1. **Hair:** one replaceable root-coverage cap and 13 individual leaf-shaped
   locks. Twelve follow the scalp; one forms the crown tuft. Every lock uses
   a common construction recipe with its own path, width and depth. It is not
   thirteen copies with identical size/placement. Cap and leaves form one style.
2. **Eyewear:** two round rims, bridge and two temples. Default has no lenses.
3. **Head and face:** skin head, two ears, two eyes, nose, mouth and two eyebrows.
4. **Core body:** neck, torso and pelvis, all present beneath clothing.
5. **Limbs:** two upper arms, two forearms, two thighs and two shins.
6. **Extremities:** two rounded mitten palms and two rounded bare feet. No fingers
   or toes are required. Feet exist independently of shoes.
7. **Clothing:** shirt group, trousers group and two separate shoes. Shirt owns
   its collar, sleeves, cuffs, buttons and seams. Trousers own waistband/button.

Parts have separate logical identities even if a later renderer batches them.
Materials are independently replaceable per part/group. Removing an item must
not destroy another part. The full skin mannequin must be available when naked;
this replaces the old instruction to omit skin hidden by clothing.

### Limb and extremity defaults

The two sides share dimensions and mirror X. Limb lengths below are the
endpoint-to-endpoint centreline lengths; radii and positions remain in JSON.

| Part on each side | Default size | Meaning |
| --- | --- | --- |
| upper-arm | 117.414 mm | Excludes 12 mm end caps at each end |
| forearm | 80.262 mm | Excludes 12 mm end caps at each end |
| thigh | 106.075 mm | Excludes 12 mm end caps at each end |
| shin | 106.042 mm | Excludes 12 mm end caps at each end |
| Palm | 116 x 98 x 126 mm | Rounded ellipsoid; no separate fingers |
| Bare foot | 132 x 192 x 68 mm | Rounded ellipsoid; sole at Z=0 when barefoot |
| Neck | 88 x 68 x 126 mm | Embedded into head and torso |
| Ear | 82 x 66 x 126 mm | Separate rounded part embedded in head |
| Glasses rim | 198 mm outer diameter | 93 mm centreline radius + 6 mm wire radius |

## 3. Rest space, sockets and resizing

Use metres, +Z up, -Y front, +X right; left/right IDs mean negative/positive X.
Root is the ground midpoint between soles. Every coordinate in the numeric file
is in the same default rest space, including garment vertices and hair paths.

Each socket specifies its parent and rest position P. Default rotations are
identity. Convert a part vertex Q to its own anchor space as Q-P. Parent-relative
socket translation is Pchild-Pparent. Following the hierarchy reconstructs Q;
never add the rest position twice. Geometry is already oriented in rest space.
Future joint rotations are not an implemented rig or skinning system.

| Attachment family | Parent | Replacement responsibility |
| --- | --- | --- |
| Skin head, face, ears | Head/ear sockets | Keep facial attachment convention |
| Hair style / selected lock | Hair socket | Coverage cap and leaf relationships |
| Eyewear | Eyewear socket on head | Rims and temple fit; optional replacement lenses |
| Shirt | Torso shirt socket | Neck, shoulders, sleeves and hem fit |
| Trousers | Pelvis socket | Waist, crotch and both leg openings |
| Hands | Wrist sockets | Join radius and palm orientation |
| Feet and shoes | Ankle chain | Sole plane and declared foot fitting offset |
| Head/chest/back decorations | Named decoration sockets | Bounds and collision clearance |

Replacing a joint-bearing body part requires an adapter that updates its child
sockets and fitted garments. A different body shape cannot be made compatible
by a material change or silent nonuniform stretching. Same-profile accessories
share the declared rest pose, sockets and fit envelope. Unknown compatibility
is rejected until an adapter is supplied. This is a data contract, not an API.

Generate body/part choices and fitting offsets first. Apply explicit overall
XYZ scaling once about root after assembling the local hierarchy. Then apply
appearance/mapping and world placement. Children inherit scale once. Nonuniform
scaling can make glasses elliptical; do not silently counter-scale accessories.
No runtime dimensions are locked to 1.20 m.

## 4. Geometry recipes

### Closed ellipsoid

For centre C and radii (rx,ry,rz):
P=C+(rx*sin(theta)*sin(phi), -ry*sin(theta)*cos(phi), rz*cos(theta)).
Theta spans 0..pi, phi spans 0..2*pi. Merge poles; close the surface with outward
normals. All lengths/radii come from each part, not a reused old character.

### Z loft and garment shell

A row is [z,cx,cy,rx,ry]. For consecutive rows A and B, let t range from 0 to 1.
Set z=A.z+t*(B.z-A.z), s=3t^2-2t^3, and interpolate only cx,cy,rx,ry with s.
To evaluate at a given height, use t=(z-A.z)/(B.z-A.z). Never ease Z: easing Z
and radii together would leave a straight geometric profile. All four shape
components have zero first derivative at each row boundary, giving C1 joins
between the side surfaces. This does not round the intentional opening rims.
At each sampled row, P=(cx+rx*sin(phi),cy-ry*cos(phi),z). Connect equal indices.
Body lofts are capped; garment openings stay open but have rim thickness faces.

Retain every source row. LOD0 starts with four subdivisions per row interval,
not just endpoints and midpoint (which would miss this curve). Counts are
starting samples, never subdivision ceilings. Refine the actual triangles for
the 0.5 mm surface tolerance using the sampling contract below. Lower LODs may
approximate the curve after silhouette review; they do not change the formula
or authorize broken detail and joins.

For a wall thickness w, inner radii are rx-w and ry-w at the same row centre;
reject nonpositive radii. This defines radial wall thickness, not an ambiguous
normal-offset instruction. Union outer garment component volumes before
subtracting the union of inner volumes. Internal component caps disappear in
the Boolean result. Extend cavity end rows by 10 mm through intended openings
with the same end radii. Preserve named surface regions across the union.

For the shirt, union torso and both sleeve outer volumes; subtract corresponding
inner volumes. Open only the neck, hem and cuffs. Sleeve upper ends terminate
inside the joined shoulder envelope, not as external holes. For trousers, union
pelvis and both outer legs; subtract their inner union. Open waist and ankles;
keep the two-leg crotch opening below the pelvis. No solid filled crotch wedge.
Boolean approximation error must stay below 0.5 mm in default rest space.

Each revised sleeve continues through Z=510, 530 and 540 mm. Its final section
is centred at X=+/-35 mm with radii 8 x 20 mm, fully inside the torso cavity.
Keep that terminal cap internal; do not truncate the sleeve at Z=510 mm.
The enlarged intermediate sections enclose the shoulder and elbow instead of
masking skin to hide clipping. Numeric fit screening evaluates both limb bodies
and their end caps against the union of torso/sleeve cavities. The 3 mm default
clearance is an additional axis-wise inset of cavity radii, not a guaranteed
Euclidean distance. Exclude the intentional cuff exit from this inset check;
check its attachment and exposed skin separately in model review.

### Tapered limb

For endpoints A,B, T=normalize(B-A), D=(0,1,0), W=normalize(D cross T).
The default chains are in XZ, so D is perpendicular to T. Centre C(t)=A+t*(B-A).
Smoothstep-interpolate the two radius pairs to define
P(t,phi)=C(t)+rx(t)*cos(phi)*W+ry(t)*sin(phi)*D.
Close each end with half-ellipsoid caps of the specified axial endCapLength:
cap centre extends along +/-T by length*sin(u), radial dimensions multiply
cos(u), for u=0..pi/2. Merge each pole. Parent/child skin pieces overlap within
the joint. Preserve separate logical objects; remove hidden interior surfaces
only in a derived render mesh. Do not leave visible holes when clothing is off.

### Face placement

For head centre (0,0,cz) and radii rx,ry,rz, define
q=1-(x/rx)^2-((z-cz)/rz)^2. A face point requires q>=0; reject out-of-face
coordinates rather than clamping into a flat patch. Front y=-ry*sqrt(q).
Eyes are elliptical surface disks, each vertex projected to face y minus
surfaceOffset. Mouth/eyebrow cubic Beziers are evaluated in XZ, projected by the
same rule and swept with the supplied circular radius. Nose is an ellipsoid
centred on its face point, with its rear half embedded. Each is a separate part.
Default eyes have no white highlights; default mouth is a small closed smile.

### Hair cap and leaf generator

The scalp cap uses the ellipsoid formula and supplied centre/radii. Phi=0 front,
90 degrees +X side, 180 back. With a=acos(cos(phi)), smoothstep-interpolate the
boundary theta from front to side, then side to back. Sample theta=0..limit(phi).
Create an inner layer shellThickness inward along the ellipsoid normal and
bridge the boundary. The cap belongs to hairstyle and is removable.

For a scalp-leaf, evaluate a cubic Bezier in the stored (theta,phi) angle plane;
angles are degrees and must not wrap across +/-180 during interpolation.
Map each resulting pair onto the scalp ellipsoid to obtain S(t). N is the
normalized ellipsoid gradient there. Let T=normalize(dS/dt). Project N out of
T to form depth direction D; set W=normalize(T cross D). Use the continuous
outward sign. f(t) is smoothstep interpolation of the supplied widthSamples.
The centre is B=S+D*(depth*f/2-rootInset). Its closed elliptical section is
B+W*(width*f/2*cos(phiSection))+D*(depth*f/2*sin(phiSection)).
This embeds the leaf bottom slightly inside the coverage cap and keeps roots
from floating. Cap root sections and merge tips to one vertex. No thin alpha
cards, random strand duplication or painted shading.

For the free crown leaf, B(t) is the supplied cubic XYZ curve. Project frameHint
out of its tangent to get D and set W=normalize(T cross D). Use the same f(t)
and elliptical cross-section, without the scalp offset. If a frame direction
is degenerate, choose the Cartesian axis least parallel to T and project it;
maintain continuous sign. A hairstyle is a cap plus independently editable
leaves, not a post-build stretch to force an arbitrary silhouette.

Hair control paths and hidden back leaves are authored. The numeric target
width/height must be checked against the generated curve envelope. Any mismatch
is corrected in the relevant leaf/cap parameters, not by rescaling the whole
puppet or moving the eyes after review.

### Glasses

Rims are circles in XZ at their centres, with circular wire cross-section.
Bridge/temples are cubic Bezier wire sweeps with closed rounded ends. Use a
continuous frame derived from the least-parallel Cartesian axis and tangent.
Endpoint wire volumes must overlap the matching rim. Frames remain separate
from head skin. The default excludes lenses; replacements may supply them.

## 5. Clothing joins and visible details

The collar uses a **complete 360-degree elliptical band**, not a disconnected
rear semicircle. Inner/outer radii and Z interval define a closed annular solid.
For a front flap, interpolate phi along rootPhiDegrees. The root is the band
outer ellipse at rootZ, inset radially by rootEmbed. The free edge linearly
interpolates its two coordinates. The flap surface linearly spans root to free
edge, with half wallThickness to each side of its normal and closed edge faces.
Mirror X and reverse winding for the other flap. Roots overlap the continuous
band; no undefined side gap remains. The band attaches around the shirt neck.

Cuffs follow the sleeve rows over cuffZRange. Their inner radii equal the sleeve
outer radii plus cuffOffset; outer radii add cuffThickness. Keep the root edge
connected to the sleeve at the upper-Z cuff edge with an annular return face,
not a hovering ring. Close the lower cuff edge between its inner and outer walls. Cuffs remain shirt
children and default to shirt material. Waistband follows its own ellipse.

Project buttons to their garment's front surface; cylinder axes follow -Y,
with back faces inset 0.5 mm and front extent equal to the stated depth.
Back-yoke seams project to +Y; back-centre seam runs down to the hem. Projection
at (x,z) uses y=cy+/-ry*sqrt(1-((x-cx)/rx)^2) from the interpolated loft row;
reject positions outside that row. Seams are intrinsic thin curves with the
specified radius/offset. They are not painted shadows. The waist button is
separate from the two shirt buttons.

Shoes are loft shells with sole thickness and an open ankle. Start the interior
floor at soleZ+soleThickness using outer interpolated radii minus wallThickness;
continue inner rows to the ankle opening. Close the floor and rim, not the ankle.
Feet use the shoe's explicit +9 mm fitting offset while equipped; ankles stay
fixed and overlap the rounded feet. Removing shoes restores foot offset zero,
so naked feet have soles at Z=0 without moving the whole person. No toes or laces.

### Shoe sole seam

Each shoe owns one closed recessed seam centred at Z=13 mm. Generate it as
part of the outer shoe surface, using the same angular indices and connected
height rings. There is no independent Boolean cutter. The previous analytic
cutter could miss a coarse shoe polygon; increasing cutter depth would change
the design instead of correcting that sampling mismatch.

For a shoe row (z,cx,cy,rx,ry):

- P(phi)=(cx+rx*sin(phi),cy-ry*cos(phi),z), phi=0..2*pi.
- N(phi)=normalize((sin(phi)/rx,-cos(phi)/ry,0)) is the outward horizontal normal.
- Let u=(z-12.4 mm)/1.2 mm. For 0<=u<=1, d=0.5 mm*(1-cos(2*pi*u))/2;
  otherwise d=0.
- The final outer vertex is Q=P-d*N. The inner cavity is unchanged.

The maximum recess is exactly 0.5 mm at Z=13 mm. Depth and its first derivative
are zero at Z=12.4 and 13.6 mm, so the analytic profile joins the shoe smoothly.
At LOD0, insert all nine profile rings (eight initial intervals), including both ends
and centre. Merge coincident source/detail heights; do not duplicate faces.
Each periodic angular edge shares its vertices with adjacent cells. Join the
groove rings directly to the rest of the shoe, not as a separate overlay.

The recess uses the same material and override as its shoe. Both LOD0 and LOD1
retain the recess; LOD2 may omit it after silhouette review. Its sampled depth
error against the uncut mesh on the same grid must be <=0.05 mm at LOD0.
LOD1 starts with four profile intervals and allows <=0.10 mm detail error.
Check the whole triangulated shoe against the selected tier's surface tolerance and check that
the recessed outer faces do not touch the inner cavity. No baked shading.

### Shared mesh sampling and limits

The numeric `construction.meshSampling` record owns the algorithm; the selected
`lod.tiers[].sampling` entry owns precision values. Begin with the
tier's segment counts and keep one angular grid for each connected loft. For
maximum section radius R, add four angular samples until
R*(1-cos(pi/N)) <=angularChordTolerance (0.25 mm at LOD0). This is an angular starting criterion, not full
surface acceptance. Add the source rows, initial height subdivisions and all
detail rings. For each cell, use triangles (v00,v10,v11) and (v00,v11,v01),
where the first index is height and the second is angle. Correct outward
winding without changing the diagonal.

At cell coordinates u,v in {0.25,0.5,0.75}, measure the analytic surface point's
distance to the nearer triangle. Bisect height intervals exceeding
refinementThreshold (0.35 mm at LOD0).
If radial error prevents convergence, increase N by four and repeat. Validate
independently with u,v in {0.125,0.375,0.625,0.875}; every probe must stay within
surfaceTolerance (0.5 mm at LOD0). Compare groove and uncut triangles on the same
grid for the selected tier's separate detail tolerance. The larger final acceptance threshold reserves room
for error between refinement probes; it is not a mathematical global bound.

After at most 12 refinement passes, an unresolved error is a delivery failure.
Likewise, failing independent probes, topology/fit checks or the hard final
triangle budget blocks delivery. Never keep a broken groove, raise the budget,
or weaken tolerance to return a successful result. This document-level numeric
check does not certify a complete generated puppet or its rendered appearance.

| Tier | Surface error | Angular start error | Refinement threshold | Groove intervals / depth error |
| --- | --- | --- | --- | --- |
| LOD0 | 0.5 mm | 0.25 mm | 0.35 mm | 8 / 0.05 mm |
| LOD1 | 1.0 mm | 0.50 mm | 0.70 mm | 4 / 0.10 mm |
| LOD2 | 2.0 mm | 1.00 mm | 1.40 mm | Omitted |

Lower-tier approximation does not relax attachment continuity, wall separation,
clothing fit or topology. Failure of any of these checks still blocks that LOD.

Garment clearance is a required acceptance condition, not proven by having
numbers. Covered skin may be hidden only after a garment encloses it correctly.
Keep hands, exposed neck and forearms visible. Do not hide exposed clipping to
claim a fit pass. Clothes can be removed without exposing missing anatomy.

## 6. Defaults, replacement data and LOD

All default material keys resolve in the male numeric file. Skin, each feature,
hair style/leaf, eyewear and each garment have independent appearance regions.
Use part material over group material over preset, then explicit part colour
over group colour. Keep other instances unaffected. No baked light or shadows.

A replacement supplies its slot, anchor, body profile/fit adapter, material
regions, coverage regions, rest bounds and compatible LOD geometry. A colour
change does not change fit. Swapping a shirt removes its collar/cuffs/buttons
with it; it does not remove skin or trousers. Swapping hairstyle removes its
cap and leaves; eyebrows remain independently selectable facial parts.

| LOD | Whole dressed puppet triangle ceiling | Intended reduction |
| --- | --- | --- |
| LOD0 | 24,000 | Close review: leaf shapes, rounded glasses, garment edges |
| LOD1 | 10,000 | Lower tessellation, retain all major silhouettes |
| LOD2 | 4,000 | Coarse contours, tiny seams/buttons may become intrinsic decals |

Segment settings in JSON are starting samples that may increase for precision.
Only `maxTriangles` is a hard count ceiling. Count the final render mesh including
caps/interiors and details. If over budget, optimize the owning geometry while
preserving its tolerances and re-review; otherwise reject delivery. Never silently
raise ceilings. Socket transforms and logical replacement slots stay identical at all
LODs. Runtime thresholds, batching and animation remain app implementation work.

## 7. Review handoff

Document checks: source hash, measurement arithmetic, references, material keys,
part/socket uniqueness, acyclic parents, default spans and analytic joins.
For shoulder regression screening, the right upper-arm shoulder section contains
the point (164.197, 0, 519.493) mm. The old sleeve ended at 510 mm and did not
cover it. Check this point and the entire sampled arm/end-cap surface against
the torso/sleeve cavity union; checking the sleeve's maximum height alone is
insufficient. Both terminal sleeve sections must lie inside the torso cavity.
For interpolation, check an interval at t=0.25: Z advances by 25%, while each
shape component advances by 15.625%. Both sides of each source-row join must
have matching first derivatives. Verify the integrated groove stays connected
to the triangulated shoe and remains outside the foot cavity. Resolve every
measurement's model source before comparison.
These numeric checks are sampled geometry evidence, not proof of mesh quality
or an approved match to the reference silhouette. Changes to sleeve volume
still require the five-view model review below.
These are not rendered-model acceptance. First model review must show all five
views plus face, collar, wrist, crotch, shoes and hair-root close-ups; then repeat
with clothes removed and individual replacements. Use matched camera angles,
50% overlays where applicable, and separate overview/detail LOD reviews.

The user authorized committing this documentation stage after its scoped checks.
Model construction, image revision and runtime implementation remain separate
steps controlled by explicit user requests.

Run the retained numeric regressions from the worktree root:

```sh
python3 -B assets/asyra-office/models/people/review/test_puppet_spec.py
```

The checks retain the former coarse-cutter and four-subdivision failure cases,
then exercise the current construction inputs. They generate no model files or
images. Outer shoe triangle counts printed by the check exclude inner surfaces,
soles, rims and the rest of the puppet; they are not whole-puppet budget passes.

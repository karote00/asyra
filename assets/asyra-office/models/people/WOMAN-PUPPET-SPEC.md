# Modular Office Puppet - Female Bob Profile

Status: documentation approved for commit after scoped numeric checks. The existing female five-view sheet
is retained unchanged. No Blender model, exported mesh, rig, animation, renderer
or wardrobe runtime is produced or approved by this document.

## Authority and reference measurements

- Appearance source: [original female sheet](review/02-woman-v1.png).
- Construction values: [female numeric specification](woman-puppet-model-spec.json).
- Pixel picks, source hash and numeric evidence: [measurement record](woman-reference-measurements.json).
- Common equations: [male puppet contract](PUPPET-SPEC.md), sections 3 to 6.
  Reuse its coordinate/hierarchy rules, ellipsoid, Z-loft, limb, face, scalp-leaf,
  shell, collar/cuff and adaptive-sampling algorithms. Female cuff bridges and
  waistband unions below refine the attachment construction. Male dimensions, clothing
  details, glasses and hairstyle are not female defaults. The female JSON and
  the clarifications below own every female input.

The female FRONT silhouette runs from approximately Y=274 to Y=791 in the
1536 x 1024 source. Retaining 1.20 m total height gives 1.20/517 m per pixel.
The front origin is (206.5, 791) px: X=(px-206.5)*scale and Z=(791-py)*scale.
Picking uncertainty is approximately 3 px, or 6.96 mm. This is an illustrated
reference, not calibrated photogrammetry. SIDE supplies qualitative depth
evidence; the tilted TOP drawing is not an orthographic measurement source.

The approximate 0.52 m caption is superseded for construction, as in the male
review. Visible hair width measures 266 px, about 617.41 mm; use the 620 mm
hair target. The bare skin head is a separate 500 mm wide authored ellipsoid.
Do not shrink the hairstyle to match the old caption. Source pixels remain
unchanged pending a separately requested annotation revision.

| Default                  | Value              | Basis                                              |
| ------------------------ | ------------------ | -------------------------------------------------- |
| Styled height            | 1200 mm            | Retained scale; sampled hair crown at 1200 mm      |
| Hair width target        | 620 mm             | FRONT silhouette; sampled envelope about 621.70 mm |
| Bare head size           | 500 x 400 x 490 mm | Under-hair completion and visible face fit         |
| Bare head centre         | (0, 0, 872) mm     | Authored rest position                             |
| Chin                     | Z=627 mm           | FRONT chin landmark                                |
| Eye centres              | X=+/-106, Z=778 mm | FRONT features                                     |
| Nose centre              | X=0, Z=740 mm      | FRONT feature                                      |
| Mouth endpoints          | X=+/-30, Z=696 mm  | FRONT smile                                        |
| Ear span                 | 568 mm             | Authored ears fitted to visible silhouette         |
| Hand span                | 558 mm             | FRONT hand silhouette                              |
| Shirt body maximum width | 260 mm             | Excludes sleeves and hands                         |
| Shirt hem                | Z=410 mm           | FRONT waist landmark                               |
| Shoe pair span           | 306 mm             | FRONT footwear silhouette                          |
| Shoe top                 | Z=76 mm            | FRONT footwear landmark                            |

`measuredMetres`, `referenceTargetMetres` and `modelDefaultMetres` are distinct.
Resolve each `modelValueSource`; do not substitute a pixel target for a part
coordinate. Numeric defaults must remain within 10 mm of measured landmarks.
Depth, clothed interiors, naked anatomy and exact hair paths are authored.

## Independent part groups

| Group            | Parts                                                   | Removal/replacement boundary                                  |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Hairstyle        | Coverage cap, 3 fringe leaves, 5 side/rear bob leaves   | Replace the style or an individual leaf; skin head remains    |
| Optional eyewear | Empty by default; eyewear socket retained               | Do not instantiate the male glasses                           |
| Head and face    | Head, 2 ears, 2 eyes, 2 eyebrows, nose, mouth, 2 cheeks | Each has its own identity and appearance region               |
| Body             | Neck, torso, pelvis                                     | Complete skin remains under clothes                           |
| Limbs            | 2 upper arms, 2 forearms, 2 thighs, 2 shins             | Each limb segment is separate                                 |
| Extremities      | 2 mitten palms, 2 rounded bare feet                     | No fingers/toes; feet are separate from shoes                 |
| Clothing         | Shirt group, trousers group, left shoe, right shoe      | Shirt owns sleeves/cuffs/collar/seams; trousers own waistband |

There are 26 skin/face parts and 32 sockets. Optional accessories are not default
geometry. Appearance sample names do not restrict who may use a part.

## Coordinates, assembly and fitting

Use metres, +Z up, -Y front and +X right. Left/right part IDs mean negative/
positive local X, independent of how the reference side view is laid out.
Root is the ground midpoint between bare soles. All values share default rest
space; joint rotations are identity. Geometry is already oriented in rest space.

For a part vertex Q and its socket position P, store Q-P in socket-local space.
Parent-relative socket translation is Pchild-Pparent. Reconstructing the chain
must produce Q, without adding rest offsets twice. Every parent and anchor must
resolve, the hierarchy must be acyclic, and mirror pairs must retain their IDs.

This profile is `puppet-body-narrow-v1`; the male profile remains `puppet-body-v1`.
Matching slot names do not prove shared garment fit. A cross-profile replacement
requires an explicit fitting adapter for geometry, child sockets and garments.
A colour change or arbitrary stretching is not an adapter. A same-profile
replacement supplies its slot, anchor, coverage/material regions, rest bounds
and LOD variants. Unsupported compatibility is rejected before placement.

Assemble the selected body, fitting offsets and accessories first. Apply the
shared overall X/Y/Z scaling once about root, then appearance mapping and world
placement. Children inherit the same scale once. Every omitted extent keeps
its default; all requested extents must be finite and positive. Do not use
post-build normalization to force hair height or compensate accessory scaling.

### Skin geometry and joins

Head, ears, neck, pelvis, palms and bare feet use closed ellipsoids. Torso uses
the capped Z-loft. Limb centreline endpoints, paired radii and 10 mm end-cap
lengths are explicit in JSON. The common limb frame uses T=normalize(B-A),
D=(0,1,0) and W=normalize(D cross T). Joint volumes overlap; keep separate
logical parts even when a later render mesh removes hidden internal faces.

Centreline lengths, excluding the two 10 mm end caps, are 122.886 mm per upper
arm, 107.912 mm per forearm, 158.114 mm per thigh and 164.049 mm per shin. Their
endpoint coordinates remain the source of truth; do not reorient limbs from
length alone.

Palms are 100 x 84 x 100 mm. Bare feet are 116 x 168 x 64 mm, with centres at
Z=32 mm and soles at Z=0. The shin/foot intersection is checked in the barefoot
pose as well as the shoe-fitted pose. Never omit hidden skin to avoid a fit
problem. Undressing restores a complete mannequin.

### Face projection

For the head centre/radii, q=1-(x/rx)^2-((z-cz)/rz)^2 and y=-ry*sqrt(q).
Reject q<=0 for these feature samples; do not clamp onto a flat patch.
Project every eye/cheek vertex and every mouth/eyebrow curve sample, not just
feature centres. Apply `surfaceOffset` along -Y. Nose embeds its rear half in
the face. Keep one logical object per eye, eyebrow, cheek, nose and mouth.

Cheeks use centres X=+/-148 mm, Z=715 mm and 30 mm radii. These authored
surface-fitting values replace the first draft's larger/lower disks, whose
edges left the face. Cheeks remain removable intrinsic blush regions, without
gradients or baked shadows. No teeth, eyelashes, eye glints or open mouth.

## Hair construction

Use one removable root-coverage cap and exactly eight closed scalp leaves:
three swept fringe leaves, two side leaves and three rear leaves. Each leaf has
its own cubic angle path, width and depth, while sharing the male leaf recipe.
There is no male crown tuft, no repeated identical strand population, no alpha
cards and no painted separation shadows.

The scalp centre is (0,0,902) mm; radii are (289,244,298) mm. Its boundary angles
are 82 degrees front, 148 sides and 154 back, smoothstep-interpolated around
the scalp. Shell thickness is 6 mm. Phi=0 is front; +90 is +X. Interpolate
stored angles without crossing the +/-180 seam. The rear-centre leaf stays
at 180 degrees throughout its path.

For every leaf, derive tangent and outward scalp-normal frame as specified in
the shared recipe. Width/depth are diameters. The common smoothstep width
profile, 2 mm root inset, closed root and merged tip are explicit in JSON.
Fringe tips can extend beyond the cap boundary; their own surfaces stay closed.
The cap covers roots and belongs to hair, not the permanent skin head.

Evaluate 1025 centreline positions per leaf and exact elliptical section
extrema at those positions. Include the cap for width/top. Current sampled
envelope is recorded with a hash of the hair input; it is not a proof of
continuous extrema, inter-leaf intersections, face visibility or final mesh
silhouette. Those remain five-view and close-up model checks.

## Clothing and footwear

### Shared shell rules

Rows are [z,cx,cy,rx,ry]. Z is linear in t; interpolate the other four values
with 3t^2-2t^3. Keep all source rows. Cavity radii subtract the stated 3 mm wall
thickness; this is radial thickness, not an unspecified normal offset.

For shirt and trousers, union capped outer component volumes, then subtract
the union of inner volumes. Extend inner ends 10 mm through neck, hem, cuffs,
waist and ankles as applicable. Remove internal caps and duplicate faces.
Never extend a sleeve terminal into an external shoulder opening. Preserve
logical and material regions after the Boolean operation.

### Shirt, cuffs and collar

The shirt owns two sleeves, two cuffs, a full collar band, two collar flaps,
front centre seam and rear yoke seam. It has no default buttons. Sleeve roots
end at Z=612 mm, X=+/-26 mm with radii 10 x 14 mm, wholly inside the torso
cavity. Covered arms above Z=361 mm are screened against the torso/sleeve
cavity union with the declared 3 mm extra axis-wise inset. The covered-arm
threshold and extra inset come from `replacementContract.fitChecks`.
All body, limb and hand surfaces are additionally screened against each separate
garment shell, including points below the arm threshold. Being inside a different
garment cavity cannot excuse an intersection. `coverageRegions` lists candidate
regions; forearms and upper palms are partly covered, never whole-part masks.

Cuffs follow their sleeve rows over Z=358..390 mm. Inner radii equal sleeve
outer radii plus 1 mm; outer radii add 2 mm. The sleeve exit at Z=358 mm has
outer radii
49 x 40 mm and inner radii 46 x 37 mm. The former 41 mm outer X radius
intersected the upper palm; hand dimensions and hand span remain unchanged.

Close the cuff shell's upper/lower annular rims. Over the final
`cuffBridgeHeight`=2 mm below its upper edge (Z=388..390 mm), create a solid
bridge with outer radii equal to cuff outer radii and inner radii equal to
sleeve outer radii minus shirt wall thickness. Union bridge, cuff and sleeve
shells, removing internal faces. This positive-volume connection replaces an
unspecified zero-thickness return face; keep the cuff opening clear. Their
appearance defaults to `collar` independently of shirt fabric.

The collar band spans 360 degrees over Z=601..625 mm, with inner radii 46 x
38 mm and outer radii 55 x 47 mm. The chin is above its top at 627 mm. Construct
the left flap from its band-root angle range and free-edge coordinates; mirror
X and reverse winding for the right flap. The root is at Z=621 mm;
left free-edge endpoints are (-64,-89,575) and (-24,-102,550) mm.
Thickness is 3 mm along the local normal, split equally about the flap surface;
root embedding is 1.5 mm. Check both thickness-offset faces against the shirt.
The previous 609 mm root and -69/-82 mm free-edge Y coordinates buried part of
the flap in the shirt. The new root overlaps the band above the shirt neck.

Union the closed band and closed flap solids into the shirt shell and remove
internal faces, preserving the collar material region and open neck. All
flaps/band belong to the shirt replacement group; do not union them with skin.

Project the front centre seam and rear yoke onto the appropriate loft face
using their JSON positions, 0.8 mm radius and 1 mm offset. Do not add the male
back-centre seam or buttons. These lines are intrinsic detail, not shadows.

### Trousers and waistband

Trousers own a pelvis shell and two leg shells. They leave a crotch void below
the pelvis; do not fill it with a wedge. Waist, ankles and internal cavities
remain open as specified. There is no default waist button or buckle.

The waistband spans Z=393..421 mm, outer radii 145 x 89 mm and radial thickness
3 mm. Close both rims to form an annular solid, then union that solid with the
constructed trousers shell. Its upper region overlaps the pelvis shell by
positive volume; remove internal faces instead of adding a duplicate return
face. The waist remains open and the waistband keeps its named region.

The shirt hem at Z=410 mm sits inside both the pelvis cavity and waistband.
Over their shared Z interval, screen the entire shirt outer ring against each
cavity with the explicit 1 mm extra axis-wise inset. Keep shirt and trousers
independent. Skin screening checks the union of intended cavities and also
rejects skin points inside any individual garment's material volume.

Trouser hems start at Z=72 mm, overlapping shoe tops at 76 mm by 4 mm. Shoe
outer rings must fit inside the corresponding trouser cavity throughout that
interval, including the 1 mm axis-wise inset. The former 60 mm hems crossed
the widening shoe uppers. In barefoot mode, the 72 mm trouser hems remain in
place; the lower shin and bare foot are intentionally visible. Do not merge
shoes with trousers or extend the trouser hem when removing shoes.

### Shoes and barefoot mode

Each shoe is an independent closed shell with a 4 mm sole, 3 mm radial walls
and an open ankle at 76 mm. Inner floor starts at `soleZ + soleThickness`;
interpolate the outer row there, subtract wall thickness from its radii, then
continue the interior to the open ankle. Close the sole and rim, not the ankle.

While equipped, translate only the corresponding bare foot by (0,0,8) mm;
the ankle stays fixed. Removal restores zero offset and the bare sole at Z=0.
Fit screening samples the entire foot against the shoe cavity and floor.
Female shoes have no recessed sole groove: `soleSeam` is null and all groove
sampling counts are zero. Do not import the male shoe seam, laces or stripes.

## Replaceable defaults and LOD

All values resolve in the female numeric file. Skin and nose use `skin`; eyes
use `eye`; mouth uses `mouth`; eyebrows/cap/leaves use `black-hair`; cheeks use
`blush`; shirt uses `shirt`; collar/cuffs use `collar`; trousers/waistband use
`charcoal-trousers`; each shoe uses `dark-shoes`. Every group/part accepts
independent colour/material overrides under the shared rules. Preserve all
material properties not explicitly overridden and isolate instance changes.

No light, AO, shading, highlight or reflection is baked into materials.
The source image, outlines and dimension labels are not texture inputs.

Use the same whole-dressed-puppet ceilings as the male profile: LOD0 24000,
LOD1 10000 and LOD2 4000 triangles. Starting tessellation counts are not limits;
the final ceilings are. Precision is 0.5/1/2 mm respectively, with the shared
adaptive triangle probes and bounded refinement. Female shoes have no groove
error test because the default contains no groove. Hair silhouette, face
positions, coverage, part identities and socket transforms remain authoritative.

No full-puppet mesh counts or visual LOD acceptance are claimed. If precision,
fit and triangle ceilings cannot all be met, fail delivery rather than raising
budgets, removing required anatomy or hiding exposed intersections.

## Document review and next modeling gate

Run both retained numeric suites from the worktree root:

```sh
python3 -B assets/asyra-office/models/people/review/test_puppet_spec.py
python3 -B assets/asyra-office/models/people/review/__tests__/test_woman_puppet_spec.py
```

Checks cover source/hash arithmetic, slot/anchor identity, material resolution,
default bounds, facial projection, sampled hair envelope, garment cavities,
limb joins, barefoot/shod feet and plain-shoe triangle precision at all three
LOD tiers. The old oversized cheek disk, buried collar flap, intersecting
60 mm trouser hem and palm-clipping sleeve exit are retained as negative
regression cases. Numeric fit thresholds and wall thicknesses are read from
JSON, not duplicated in checks. These are specification checks, not rendered
acceptance. No model/image output is generated by the checks.

Current document checkpoint: 26 female checks and the existing 8 male checks
pass. Female plain-shoe sampled surface error is 0.3169 mm at LOD0, 0.6838 mm
at LOD1 and 1.3107 mm at LOD2, with no cavity crossings at the validation
probes. These figures cover the sampled shoe outer surface, not a complete
puppet mesh, Boolean shell, rig or visual approval. The male numeric inputs
and both original five-view images remain unchanged.

Future authorized modeling must show five matched views, overview and enlarged
face/hair-root/collar/wrist/crotch/ankle/sole views, then the same mannequin with
clothes removed and independently replaced. Use 50% overlays where comparable.
Review female geometry against the female image; do not substitute male views.
Exact hidden geometry and camera calibration are not recoverable from these
illustrations alone. The user approved this documentation for commit; rendered-model review remains pending.

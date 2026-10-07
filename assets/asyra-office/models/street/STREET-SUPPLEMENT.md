# Asyra Office - Street Component Reconstruction Specification - Group 2

After approving the v2 appearance on 2026-10-04, the user added two overriding rules: define each component as one placeable unit, and keep every road line and crosswalk stripe independent of asphalt or any other receiving surface. This delivery contains drawings and documents; no 3D models were built or verified.

The user also approved the four transparent v4 single-unit images. The specification is now 2.2.0. Road-line production follows the 2026-10-07 [path-marking decision](PATH-MARKINGS.md). Approval covers appearance and unit definitions; the following numbers and methods are production decisions derived from those approvals.

## Data authority

- `street-model-spec.json`: entry point for exact dimensions, coordinates, structure, and material values; its tree module delegates to `tree-construction-spec.json` and `TREE-CONSTRUCTION.md`.
- `SURFACE-RECIPES.md`: reproducible textures and the link to the canonical tree assembly recipe.
- `review/README.md`: appearance sheets, latest unit corrections, and approval status.
- `review/approved-office-reference.jpg`: original scene, prioritizing the central office surroundings.

The v2 sheets establish appearance; dimensions are authored production decisions, not measurements from images. Paint appearance now follows the four transparent v4 single-unit images, superseding v2/v3 arrays and backing surfaces. Some FRONT/SIDE labels still show oblique views; image perspective is not an engineering dimension. Use approved images for appearance and this document/JSON for geometry and hidden faces. These rules make production repeatable but do not guarantee 100% reconstruction of unknown original models or pixels; future models still require comparison.

## One unit

Seven categories retain eleven unit/preset entries, including three presets of one path-marking family. These are not eleven mandatory fixed meshes. Categories, presentation boards, and assembly examples are not inventory units.

| Category | One placeable unit | Dimensions (metres) |
| --- | --- | --- |
| Asphalt | One unmarked surface tile | X 6 × Y 4 × thickness 0.08 |
| Path-marking preset | Straight edge line | length 1 × width 0.10, zero thickness |
| Path-marking preset | Curved edge line | centre radius 1.05, width 0.10, 90-degree arc, zero thickness |
| Path-marking preset | Short dash | length 0.60 × width 0.12, zero thickness |
| Crosswalk | One white stripe | X 0.40 × Y 2.80, zero thickness |
| Pavement and curb | One paving slab | X 0.60 × Y 0.30 × height 0.05 |
| Pavement and curb | One straight curb block | X 0.30 × Y 0.16 × height 0.12 |
| Pavement and curb | One curved curb block | inner radius 0.69, outer radius 0.85, 18-degree arc, height 0.12 |
| Manhole | One cover-and-frame assembly | diameter 0.66, thickness 0.026 |
| Tree | One complete tree | maximum envelope X 3.00 × Y 1.90 × Z 3.55 |
| Lantern | One complete street lantern | maximum width/depth 0.38, height 2.74 |

The app chooses counts, arrangement, spacing, rotation, receiving surfaces, and foundations. Do not fix five stripes into a crosswalk or combine a row of lights or an L-shaped pavement into a basic unit. A manhole cover/frame and a lantern pole/head are named structural parts of their respective placeable units.

## Asset types

The asphalt tile is a model component with a separately replaceable material.
The three road-line entries are independently placeable presets of one path-marking
decal family; the crosswalk stripe is a rectangular decal. They are not thin
solid boxes or complete road materials. Shared paint supplies pigment; a path
and width generate a road-line contour. See [path markings](PATH-MARKINGS.md).
See the [classification](../ASSET-TYPES.md) for reviewed-component mappings.
Existing numeric identifiers and geometry remain unchanged.

## Paint is completely independent of its receiving surface

Paint contains only its own colour, contour, and alpha. Transparency must expose the actual surface beneath it; grey pixels must not simulate wear. Include no asphalt backing, stone texture, receiving material, shadows, or fixed base. The app may place markings on asphalt, red brick, stone slabs, or other materials.

Author paint at Z=0 with no side walls or thickness and normal +Z. On a flat surface use a 0.0005 m display offset to prevent z-fighting; this is not physical thickness. The app owns projection onto rough or uneven surfaces; this delivery does not implement a decal system. Transparent unit sheets need only top views because paint is planar. Do not attach a 3D road merely to provide more views.

### Orientation, connectors, and repetition

These are local unit connector coordinates, not fixed assembly examples; JSON stores the same values.

| Unit | Centreline start | Centreline end | Usage |
| --- | --- | --- | --- |
| Straight edge line | (-0.50, 0, 0) | (0.50, 0, 0) | Join endpoints to extend; the app may also leave gaps |
| Curved edge line | (-1.05, 0, 0) | (0, -1.05, 0) | Start tangent -Y, end tangent +X |
| Short dash | (-0.30, 0, 0) | (0.30, 0, 0) | Place one segment at a time; the app chooses gaps |
| Crosswalk stripe | (0, -1.40, 0) | (0, 1.40, 0) | Long axis Y; the app may repeat along X |

For ordinary planar placement, rotate about the origin before translating to the receiving surface; display offset follows its normal. Do not reset the geometry origin for connectors or save repeated objects back into the unit. Rotated strips in sheet layouts do not change local coordinates; reconstruct along JSON axes.

### Transparent texture and material delivery

Production PNG masks must use RGBA. Interpret base colour and alpha separately: alpha=0 shows no surface, alpha=1 shows marking colour, and intermediate values may antialias edges. General JSON material alpha=1 applies only to solids; paint masks override that default. Do not use black, grey, or white colour keys for transparency.

Approval of v4 images does not mean production masks are calibrated. Generate contours from dimensions using the recipe's pixel density and padding. Do not stretch a whole reference PNG to physical bounds, which would include transparent margins in marking size. RGB data in fully transparent pixels is not road, shadow, or emission content; production filtering is specified in the surface recipe.

Ground names are not component identifiers. Use the same marking data on asphalt, red brick, and stone; only the receiving surface changes. Do not create three variants with baked backgrounds.

## Coordinates and origins

Use metres, +Z up, +X right, front camera at -Y, side camera at +X. Angles start at +X and increase counterclockwise around +Z. Size arrays are X,Y,Z.

- Asphalt origin: top centre, top Z=0 and bottom Z=-0.08.
- Straight paint, dashes, and crosswalk stripes: individual marking centre; curved paint: arc centre.
- Pavers, straight curbs, trees, and lanterns: bottom centre; curved curbs: bottom arc centre.
- Manhole: frame top centre, geometry Z=-0.026 to 0, flush with receiving road.

Retain metre scale and apply scaling. Do not automatically recenter to bounding-box centres. Solid normals point outward; hidden faces are closed and continue the main material. Add no decorations absent from the reference.

## Category construction

### Asphalt

Closed box, 6 x 4 x 0.08 m, with origin at the top centre. Bevel only the
four bottom perimeter edges at Z=-0.08 by 0.003 m with two segments. Exclude
all top and vertical edges from bevel selection. Bottom corner blends must
remain within Z=-0.08..-0.077; the remainder of each vertical corner stays
sharp. Preserve the full rectangular top boundary X=-3..3, Y=-2..2 at Z=0.
The bevel must not change the outer bounds or cut gaps into the top corners.

For an aligned grid, translate origins by 6 m along X or 4 m along Y. Adjacent
top edges meet without gaps or overlap; bottom-edge relief is intentional.
No preset bend, paint, or manhole opening is included. Use the JSON fine-grain
recipe only as the default appearance, not as geometric bumps or displacement.

Default colour is sRGB #55545D, roughness 0.94 and metallic 0. Colour and the
entire material, including its grain texture, must be independently
replaceable through future creation parameters without changing bounds,
origin, bevel or another instance. A colour-only override changes the base
tint; a material override replaces the asphalt recipe rather than adding
asphalt grain on top of the replacement. Material overrides must preserve
the authored geometry. Road markings remain independent units.

### Road and crosswalk markings

Default straight and dash paths extend symmetrically along X. The default curve footprint is a planar annular sector with radii 1.00–1.10 m, angles 180–270 degrees, and 32 segments. These are path presets sharing paint, not separate authored fixed meshes or shape-specific textures. A crosswalk stripe is 0.40 × 2.80 m, long axis Y; traffic travels along Y and pedestrians cross along X, subject to app rotation. Do not fix total crossing width, repetition count, or spacing. Wear becomes alpha holes, not road-coloured dots. Maximum inward long-edge perturbation is 0.003 m.

### Crosswalk stripe - rectangular decal

The independently placeable unit is one rectangular decal, not a solid box or
an entire crossing. Its local footprint is X=-0.20..0.20, Y=-1.40..1.40 at Z=0;
the origin is its centre. There are no side walls or physical thickness. The
0.0005 m receiving-normal offset is only for display, not part of its dimensions.

Use the shared ivory-paint default: sRGB #E4DECF, roughness 0.86, metallic 0.
Keep this stripe's seed 303, wear coverage 0.025 and inward long-edge variation
of at most 0.003 m. Sharing pigment with a lane dash does not substitute the
lane dash's dimensions or wear settings. Colour/material changes preserve the
stripe's contour and transparency; wear exposes the actual receiving surface.

For an unrotated array along local X, centre spacing is 0.40 m plus the chosen
clear gap. Count and gap belong to the app/user; no array or fixed spacing is
stored in this unit. The v4 PNG is an appearance reference, not a calibrated
production mask or a source of baked glow, lighting or receiving-surface colour.

### Pavement and curb

Paver bevel is 0.004 m; both curb presets use the shared 0.008 m bevel, all with two segments. The curved curb is a closed annular-sector prism from 0 to 18 degrees, with 8 arc segments. Choose among the three JSON stone materials without changing shape. The approved L-shaped image illustrates material and laying style only, not a fixed L-shaped unit. The app owns foundations, joints, staggering, and arrangements. Arbitrary trimming is outside these fixed unit definitions.

### Paving stone - single model component

The new [single-unit sheet](review/04-paving-stone-single-v1.png) was approved on 2026-10-07. It depicts one paving stone from six views.
The [annotated layout](review/04-pavement-layout-v3.png) is an assembly reference
only; its mixed sizes, apparent front/side perspectives and arrangement must
not override the single-unit dimensions. The obsolete v2 image was removed; the annotated layout replaces it. No fixed L-shaped mesh is authored.

The existing dimensions remain X=0.60, Y=0.30, Z=0.05 m. With the origin at the
bottom face centre, bounds are (-0.30,-0.15,0) to (0.30,0.15,0.05). Use one
closed rectangular block with outward normals and a 0.004 m inward bevel on
all outer edges, two segments, preserving the overall bounds. Keep the top and
bottom planar apart from the edge treatment. No chips, cracks, recessed grout,
backing slab, mortar, neighbouring stones or curb geometry belong to this unit.

Default material is stone-cream, sRGB #D9CDBA, roughness 0.88, metallic 0.
Stone-pale and stone-grey remain selectable alternatives; their distinct JSON
properties must be preserved. Appearance is replaceable independently of the
block. Reference face tones and contour lines are not material instructions.

The clean surface in the review drawing is intentional for geometry review.
Fine stone grain, pores and roughness belong to the later replaceable material;
see the [surface-detail note](SURFACE-RECIPES.md#paving-stone-surface-detail-note).
Keep this block's geometry unchanged. Chipped or irregular silhouette variants
are separate future designs, not implied by its default texture.

For aligned placement, centre spacing is 0.60 m plus the selected X gap and
0.30 m plus the selected Y gap. Bevels create edge relief even at zero gap.
Rotation, staggering, counts, base elevation and supporting foundation are
app-owned. Do not distort a brick to fill a leftover boundary. Arbitrary edge
cutting or additional edge-shaped pieces require separate specifications.
Straight and curved curbs are presets of one planar path-generated solid family.

### Curbs - shared cross-section and planar paths

The [planar curb specification](PLANAR-CURBS.md) owns the shared section,
path frame, ends, bevels and generation limits. Both presets use a 0.16 m wide,
0.12 m high section with 0.008 m edge treatment. The former curved preset's
0.004 m bevel is superseded to make the cross-section consistent.

`curb-straight` retains its 0.30 m length and bottom-centre origin.
`curb-curved` retains its 0.77 m centreline radius, 0-to-18-degree span and
arc-centre origin; its nominal inner/outer radii remain 0.69/0.85 m.
These are generated examples, not independently authored fixed meshes.
The JSON retains their names and checking dimensions; no runtime API or
persisted model migration is implemented by this documentation change.

The [straight sheet](review/04-curb-straight-single-v1.png) remains illustrative,
not calibrated. The [shared section drawing](review/04-curb-shared-section-v1.png)
was approved on 2026-10-07 and is schematic, not a scale drawing. Use PLANAR-CURBS.md
and numeric dimensions. Separate straight/curved multiview sheets are not
required for this path-generated family.

### Round manhole

The [dimensioned reference sheet](review/05-manhole-dimensioned-v2.png) contains
the centre-outward legend and a radial half-section between the six recesses.
The user approved the earlier annotation topology and subsequently accepted the
numeric specification on 2026-10-07. This updated sheet synchronizes those
values; the user approved this final dimensioned sheet on 2026-10-07. The original v2 remains
the unchanged appearance source, and annotated v1 is historical evidence.
The bottom section depicts C raised, 1 flat, 2 raised, 3 flat, 4 raised, then
the outer base field, an open gap and the separate frame. C is not ring 1.
The dashed baseline represents the upper surfaces of rings 1/3 and the outer
field; it is not the cover underside. The drawing is schematic, not to scale.
Its symbolic slopes, heights and band widths are not numeric geometry. The
current sheet replaces the former TBD labels with the accepted dimensions.
The common 1 mm rise is an accepted modeling decision, not a height measured
from the source image.
The section passes between slots, so slots are not cut into this section.
Retain the independent cover and frame outlines; no supporting bridge is shown.

The [original reference](review/05-manhole-cover-v2.png) remains unchanged.
Magnified review on 2026-10-07 confirms six slots in both TOP and THREE-QUARTER.
The earlier four-slot finding was incorrect and is withdrawn; it is not a
reason to redraw or delete this sheet. FRONT is elevated, not a true eye-level
orthographic projection. See the [review findings](review/05-manhole-review.md)
for the user-confirmed ring topology and dimension provenance. Existing outer
dimensions remain authored decisions; the new ring radii use approximate image
proportions. Height and hidden geometry are explicitly specified below.

One placeable assembly contains two separately closed solids: an annular frame
and a circular cover. Origin is the centre of the frame top at road Z=0.
Frame radii are 0.29 to 0.33 m, spanning Z=-0.026 to 0. Cover radius is
0.286 m; its base body spans Z=-0.021 to -0.001. Thus the diameter is 0.66 m,
frame height 0.026 m, base-body thickness 0.020 m, radial clearance 0.004 m
(diametral clearance 0.008 m), and base-plane recess 0.001 m. Raised details
rise 0.001 m above that base plane to Z=0, flush with the frame top. The cover
maximum thickness is 0.021 m and the final assembly envelope remains
X/Y=-0.33 to +0.33 m, Z=-0.026 to 0 m.
These are nominal pre-bevel dimensions. Seal each solid's underside separately;
do not bridge the annular clearance with a shared bottom face. No supporting
ledge is specified or implied. The user confirmed that cover and outer frame
are separable: maintain independent meshes/transforms with no shared vertices,
welded ring, connecting bottom face or geometry filling the clearance. The
4 mm radial gap is real empty space, not a painted dark line; bevels may widen
its mouth. Moving the cover must leave the frame intact. No hinge, latch,
opening animation or physical support is specified or implemented.

Bevel the frame's four circular boundary edges by 0.0015 m and the cover's
top/bottom outer perimeter by 0.001 m, inward surface offset, two segments,
circular profile 0.5. Do not expand nominal envelopes or bevel tessellation
seams. Relief edges use the separate 0.0002 m definition below; slot edges
remain sharp. There are no narrow annular grooves.

The user confirmed the following radial order on 2026-10-07. The central disk
is not counted as ring 1; count annular bands outward from that disk.

All table values are millimetres. Radii are measured from the common axis;
heights are relative to the road/frame top at Z=0, before edge bevels.

| Region, centre outward | Inner radius | Outer radius | Radial width | Top Z |
| --- | --- | --- | --- | --- |
| Central disk | 0 | 45 | 45 | 0 |
| Ring 1 | 45 | 70 | 25 | -1 |
| Ring 2 | 70 | 90 | 20 | 0 |
| Ring 3 | 90 | 125 | 35 | -1 |
| Ring 4 | 125 | 160 | 35 | 0 |
| Outer field carrying six slots | 160 | 286 | 126 | -1 |
| Empty annular gap | 286 | 290 | 4 | No surface |
| Separate frame | 290 | 330 | 40 | 0 |

Flat bands are not blind circular grooves. Raised bands and the central disk
are relief on the same cover, not loose stacked objects. The former four
3 mm-wide circular grooves and their radii/depth are withdrawn. Do not reuse
their centreline radii as ring boundaries. Preserve the original image.

**Dimension derivation and authority:** use the original TOP view, not the
regenerated annotation, for proportions. Approximate original-pixel centre is
(1161,326); horizontal outer radius is about 235 px. Calibrating this to the
existing 330 mm outer radius gives approximately 1.40 mm/px. The five central
boundary radii are approximately 32,50,65,88,113 px, yielding roughly
45,70,91,124,159 mm. Freeze these to 45,70,90,125,160 mm respectively for the
model. These are visually estimated contours, not sub-pixel measurements or
manufacturing tolerances. Texture, strokes and the slightly elliptical TOP
projection limit precision. The drawing is illustrative: do not independently
rescale its apparent gap or outer frame to override the existing 286/290/330 mm
radii. The 4 mm gap is the numeric fit check, not proof of every image dimension.

Common rise is fixed to 1 mm for C/2/4 so all raised surfaces reach the road
plane without changing the assembly height. This height, the existing underside
and recess depths, and the edge treatment are authored construction decisions;
a single TOP image cannot determine them uniquely. The user accepted these
previously proposed numeric choices on 2026-10-07 and requested synchronized
documents and reference annotations. Acceptance fixes the construction contract;
it does not turn estimates into measured source dimensions.

At each listed relief boundary, use a vertical 1 mm step, then bevel only its
convex upper circular edge by 0.2 mm inward surface offset, two segments,
profile 0.5. Keep concave feet sharp and never lower the base plane to form a
groove. This produces 0.8 mm of straight vertical step below the bevel.
Do not bevel tessellation seams. The table specifies nominal pre-bevel boundaries;
the 0.2 mm rounding stays within the raised solid. Raised plateaus remain at
Z=0; low bands remain at Z=-1 mm. JSON boundary pairs follow the table order
through the outer field; the frame is defined separately.

Six blind capsule recesses have centres at radius 0.21 m and angles
30,90,150,210,270,330 degrees counterclockwise from +X. Their long axes
are radial. Total end-to-end length is 0.055 m, width 0.013 m, semicircle
radius 0.0065 m, and straight middle length 0.042 m. Vertical sides meet a
flat bottom at Z=-0.003: depth 0.002 m below the cover base plane. These are not
through-holes. Their radial extents are 0.1825 to 0.2375 m; the fourth raised
ring ends at 0.160 m, leaving 0.0225 m to the nearest slot end. Remaining
base-body thickness below slots is 0.018 m. No text, handles, screws or extra holes are specified.

Frame and cover default to iron, sRGB #49433F, roughness 0.65, metallic 0.55.
The existing edge-wear recipe uses iron-worn, #726456, roughness 0.72,
metallic 0.45. Both colour and material are replaceable independently of
geometry; no shading or surface grain creates additional recesses.

The app owns a receiving-ground cutout of radius 0.33 m and depth 0.026 m,
with the frame top flush to the road. Do not place the unit atop an uncut road.
Cutting, receiving-ground appearance and interactions are not implemented here.

### Street tree

One unit is one complete tree with origin at its trunk base, Z=0. Read
[TREE-CONSTRUCTION.md](TREE-CONSTRUCTION.md) and
[tree-construction-spec.json](tree-construction-spec.json) together. They replace
the old six-plus-six branches, twelve-guide layout, incomplete leaf outline and
uniform 0.75..1.15 scale recipe. Do not combine old and new construction rules.

The user selected the fuller bare tree and natural leaf cluster, then delegated
remaining dimensions and construction choices. The selected images are retained
unchanged. The new numeric layout is authored, not an inferred original mesh.

| Part | Current construction |
| --- | --- |
| Trunk | Seven stations, 2.55 m height, 0.23 m base diameter |
| Branches | Seven primary plus thirteen secondary; maximum depth two |
| Required relationship | B7 is a child of B11; the parent continues beyond the fork |
| Wood | Tapered curve fields with local smooth junctions and a flat ground base |
| Leaf prototype | One rounded closed surface; 100 x 58 mm, 1 mm shell translation, 3 mm bulge |
| Leaf instances | Uniform scale 0.30..1.20; no per-leaf geometry changes |
| Foliage | 23 groups, 1,744 instances; fixed seeded subgroup placement and orientation |
| Maximum envelope | X 3.00 x Y 1.90 x Z 3.55 m; never scale or clip to fill it |

The leaf's curves, shell, sampling and normals; branch attachments, radii and
junctions; and foliage frames, positions, rotations and colour selection are
explicitly defined in the linked contract. Hidden guide volumes do not render.
The default master leaf contributes 128 triangles per instance, 223,232 across
the assembly before wood. This authoring definition is not runtime LoD approval.

Defaults remain replaceable: bark #806144 and leaves #829347, #A7AD58, #596D3D.
No reference shadows, outlines or AO are baked. See the [document review](review/06-street-tree-review.md).
No model generation, runtime change or visual model acceptance is included.

### Street lantern

Lathe the base, neck, and finial from JSON Z/radius profiles and close endpoints. Pole Z=0.20–1.88 m, radius 0.037 m. Glass spans Z=2.05–2.45 m; lower outer width 0.20 m, upper 0.30 m, four panes each 0.003 m thick. Frame strips are 0.018 m square, joining corresponding corners of the lower and upper frames, with 0.002 m bevels. Roof eave width 0.38 m at Z=2.45–2.48 m, tapering to a 0.055 m square top at Z=2.62; shell thickness 0.012 m, underside closed. Finial maximum Z=2.74 m. Head is centred with no side arm. Glass uses opaque amber stylized material without emission, internal bulbs, or lights.

## Materials and lighting

JSON hex colours are sRGB; use its formula when assigning Blender linear colours. Produce only base colour, intrinsic texture, roughness, and metallic. No baked cast/contact shadows, AO, reflections, or glow. Do not bake sheet outlines into black lines. Leaf colour must not depend on light direction. The future app owns scene lighting, lantern illumination, and shadows.

## Future acceptance criteria

These model checks have not yet been performed:

1. Unit count and origins follow this specification; assembly arrays remain outside individual units.
2. General dimension error ≤0.001 m; paint display-offset error ≤0.0001 m.
3. Compare silhouettes, colours, and details using unlit base colour. Inspect paint on transparency and optionally on different grounds to verify holes, without storing receiving ground in the asset. Check the same marking data on asphalt, red brick, and stone: uncovered areas and wear holes reveal the current ground without old asphalt tint, dark borders, or halos.
4. Use orthographic front, side, top, and three-quarter solid views, directions from JSON, equal scale, and 10% padding. Planar paint needs a top view and contour dimensions only.
5. No lights, baked lighting, unintended backing slabs, overlapping faces, or undefined decorations.
6. Future lit review uses separate scene lights, not lights stored in the asset.

## Historical drafts and compatibility

Old complete 90-degree road bends, double-line arrays, five/six-stripe assemblies, spherical canopies, side-arm lights, and L-shaped pavement assemblies are not current specifications. `orthoviews/`, old overviews, and v1 remain historical only. Identifiers are neutral component names in documentation, not registered app/library identities. No persisted-data migration or runtime compatibility alias has been created.

## Complete modeling handoff

Provide this document, `street-model-spec.json`, `SURFACE-RECIPES.md`, the tree-specific `TREE-CONSTRUCTION.md` and `tree-construction-spec.json` when building trees, and the latest approved images identified in `review/README.md`. Prompt logs and old drafts are not production instructions. Confirm units, read dimensions and origins, create named structural parts, apply materials, then produce acceptance comparisons. This is the sequence for future modeling; no modeling was performed in this delivery.

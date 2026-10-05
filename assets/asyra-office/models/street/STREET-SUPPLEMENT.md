# Asyra Office - Street Component Reconstruction Specification - Group 2

After approving the v2 appearance on 2026-10-04, the user added two overriding rules: define each component as one placeable unit, and keep every road line and crosswalk stripe independent of asphalt or any other receiving surface. This delivery contains drawings and documents; no 3D models were built or verified.

The user also approved the four transparent v4 single-unit images. The specification is now 2.1.0. Approval covers appearance and unit definitions; the following numbers and methods are production decisions derived from those approvals.

## Data authority

- `street-model-spec.json`: sole authority for exact dimensions, coordinates, structure, and material values.
- `SURFACE-RECIPES.md`: reproducible textures and leaf distribution.
- `review/README.md`: appearance sheets, latest unit corrections, and approval status.
- `review/approved-office-reference.jpg`: original scene, prioritizing the central office surroundings.

The v2 sheets establish appearance; dimensions are authored production decisions, not measurements from images. Paint appearance now follows the four transparent v4 single-unit images, superseding v2/v3 arrays and backing surfaces. Some FRONT/SIDE labels still show oblique views; image perspective is not an engineering dimension. Use approved images for appearance and this document/JSON for geometry and hidden faces. These rules make production repeatable but do not guarantee 100% reconstruction of unknown original models or pixels; future models still require comparison.

## One unit

Seven categories contain eleven basic units. Categories, presentation boards, and assembly examples are not inventory units.

| Category | One placeable unit | Dimensions (metres) |
| --- | --- | --- |
| Asphalt | One unmarked surface tile | X 6 × Y 4 × thickness 0.08 |
| Road marking | One straight edge line | length 1 × width 0.10, zero thickness |
| Road marking | One curved edge line | centre radius 1.05, width 0.10, 90-degree arc, zero thickness |
| Road marking | One short dash | length 0.60 × width 0.12, zero thickness |
| Crosswalk | One white stripe | X 0.40 × Y 2.80, zero thickness |
| Pavement and curb | One paving slab | X 0.60 × Y 0.30 × height 0.05 |
| Pavement and curb | One straight curb block | X 0.30 × Y 0.16 × height 0.12 |
| Pavement and curb | One curved curb block | inner radius 0.69, outer radius 0.85, 18-degree arc, height 0.12 |
| Manhole | One cover-and-frame assembly | diameter 0.66, thickness 0.026 |
| Tree | One complete tree | maximum envelope X 2.36 × Y 1.80 × Z 3.55 |
| Lantern | One complete street lantern | maximum width/depth 0.38, height 2.74 |

The app chooses counts, arrangement, spacing, rotation, receiving surfaces, and foundations. Do not fix five stripes into a crosswalk or combine a row of lights or an L-shaped pavement into a basic unit. A manhole cover/frame and a lantern pole/head are named structural parts of their respective placeable units.

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

Closed box. Bevel vertical outer corners and bottom edges by 0.003 m with two segments. Keep the top boundary straight for planar tiling. No preset bend, paint, or manhole opening. Use JSON fine-grain texture.

### Road and crosswalk markings

Straight edge lines and dashes extend symmetrically along X. The curve is a planar annular sector with radii 1.00–1.10 m, angles 180–270 degrees, and 32 segments. Each is independent. A crosswalk stripe is 0.40 × 2.80 m, long axis Y; traffic travels along Y and pedestrians cross along X, subject to app rotation. Do not fix total crossing width, repetition count, or spacing. Wear becomes alpha holes, not road-coloured dots. Maximum inward long-edge perturbation is 0.003 m.

### Pavement and curb

Paver bevel 0.004 m, straight curb 0.008 m, curved curb 0.004 m, all with two segments. The curved curb is a closed annular-sector prism from 0 to 18 degrees, with 8 arc segments. Choose among the three JSON stone materials without changing shape. The approved L-shaped image illustrates material and laying style only, not a fixed L-shaped unit. The app owns foundations, joints, staggering, and arrangements. Arbitrary trimming is outside these fixed unit definitions.

### Round manhole

Frame radii 0.29–0.33 m; cover radius 0.286 m leaves a 0.004 m gap. Cover top is 0.001 m below frame top. Close the underside. Circular grooves have radii 0.065, 0.10, 0.14, 0.265 m, width 0.003 m, depth 0.0015 m. Six capsule-shaped blind slots lie at centre radius 0.21 m, starting at 30 degrees and spaced 60 degrees apart; each is 0.055 long, 0.013 wide, 0.002 m deep, aligned radially. Add no text, handles, or screws. The future receiving ground needs a diameter 0.66, depth 0.026 m opening; do not stack the cover on an uncut solid road. Ground cutting and opening interaction are not implemented here.

### Street tree

One tree includes a trunk, twelve branches, and leaves. JSON defines trunk centreline/radii, branch starts, and twelve canopy distribution regions. Use 12-sided trunk and 8-sided branch cross-sections; interpolate centrelines piecewise linearly and subdivide each trunk segment into 4. Transport cross-sections in parallel, initial reference axis +X, to avoid uncontrolled twisting. Each canopy region contains 96 leaves, totalling 1,152; formulas are in the surface/leaf recipe. Regions are not visible spheres. Include rear leaves and close the trunk bottom; no soil mound, pot, or exposed roots. This is a design master, not a runtime performance claim. No LoD or animation is implemented here.

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

Provide this document, `street-model-spec.json`, `SURFACE-RECIPES.md`, and the latest approved images identified in `review/README.md`. Prompt logs and old drafts are not production instructions. Confirm units, read dimensions and origins, create named structural parts, apply materials, then produce acceptance comparisons. This is the sequence for future modeling; no modeling was performed in this delivery.

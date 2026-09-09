# Water and crops

## Water

Soil surface is Y = 0. Each drain is a semicircular depression in soil with a small rounded soil lip and a vertical shoulder. The semicircle rim and flat water surface are Y = -0.05 m. Rounded lips remain inside the configured drain width; lip radius is min(0.01 m, width / 10). The semicircle radius is half the width minus the lip radius. Its bottom is 0.05 m plus that radius below soil. Soil continues beneath the entire curved channel and its exposed ends. Water fills the complete semicircular volume up to the inner rim. It has a horizontal top, a curved contact boundary, and filled end faces. The soil trough continues outside and beneath the water; water is not merely a thin top sheet. The section diagram uses the same profile and level.

## Planting

Bays 0 and 1 contain 1914 cucumber; bays 2 and 3 contain Yu-Nu cherry tomato. Roots follow each water-adjacent soil row. Measured from that water edge, root offset is the configured pole inset plus 0.05 m farther into soil. There are no plants where no soil is adjacent. Configuration must leave room for these roots; invalid layouts are rejected without mutation.

Plant longitudinal spacing is 0.20 m, starting at the configured front inset and ending no later than length minus rear inset. Defaults produce 248 plants per row, 24 rows, 5,952 plants total: 2,976 of each cultivar. Spacing is index-based; the final residual gap is allowed. Plants start at soil surface and climb toward their row's net.

Each cultivar has exactly 20 distinct reusable original geometry variants. Variants differ in climbing path, foliage arrangement, height, and fruit development/size. Assignment is deterministic pseudo-random sampling so camera/layer changes and history replay do not reshuffle plants. Both sets of 20 occur in the default scene. Variant height follows the configured net envelope; no growth simulation is implied.

## Occlusion and viewing detail

Variants include clear fruit, fruit screened by an attached leaf, and fruit behind the actual net plane at a horizontal strand's height when the configured net permits it. Occlusion is real geometry, deterministic and reproducible; it does not claim a robot detection result. Short or high-bottom nets cannot provide every occlusion case.

The full model is used for close inspection. A geometrically bounded distant representation preserves root transforms, cultivar, fruit placement and variant identity. The renderer chooses detail from projected geometric error (at most 2 pixels for the distant representation) and rejects off-screen instances using conservative bounds. Camera changes must not regenerate either model. Tests compare representations and verify switching, clipping, reuse and disposal.

## Appearance references

Observed original photographs, consulted 2026-09-09:

- <a href="https://www.suntech-seed.com.tw/product_detail.php?id=447" target="_blank" rel="noopener noreferrer">Suntech Seed - 1914 F1 cucumber</a>: slender glossy dark-green fruit, published mature length 20–24 cm, small dark-green leaves. The plant photo shows broad heart-shaped shallow-lobed leaves, palmate veins, climbing tendrils and yellow flowers.
- <a href="https://www.knownyou.com/tw/product-detail/166/" target="_blank" rel="noopener noreferrer">Known-You Seed - Yu-Nu tomato</a>: elongated oval red fruit, published fruit weight 18 g, large flower trusses and tall growth. The photograph shows pointed green calyces, compound serrated foliage and yellow flowers.
- <a href="https://tpbg.tfri.gov.tw/mobile/plant.php?rid=1615" target="_blank" rel="noopener noreferrer">Taipei Botanical Garden - cucumber</a>: tendrils and rough climbing stems support the visual interpretation.

The user's five close-up photographs additionally establish rounded Yu-Nu ends, downward racemes with alternating bent pedicels, narrow recurved sepals, and nonuniform green/yellow/orange/red patches on individual fruit. Maturity generally decreases toward each raceme tip rather than alternating cyclically.

- <a href="https://hort.nchu.edu.tw/var/file/1/1001/img/30/444533594.pdf" target="_blank" rel="noopener noreferrer">National Chung Hsing University - Yu-Nu ripening stages</a> describes stages by the proportion of red fruit surface.
- <a href="https://fae.moa.gov.tw/map/food_item.php?id=99&type=AS01" target="_blank" rel="noopener noreferrer">Ministry of Agriculture - cucumber</a> identifies fine white fruit spines and illustrates raised spine bases on young fruit. Modeled spine dimensions are illustrative, not cultivar measurements.

Leaves use curved shared-vertex blades and spatially varying green colors, with reflected daylight keeping their undersides readable. Fruit skin uses linear-RGB vertex colors; individual turning tomatoes retain green shoulders and uneven yellow/orange/red patches. Cucumber skins include irregular longitudinal relief, raised pale spines, and mottled green skin in close detail. Fine surface-attached bristles cover cucumber stems, petioles and both sides of leaves. These triangles are generated once with each full model; distant models omit the fine hairs without changing plant identity or fruit placement. Full cucumber variants stay below 18,000 vertices, enforced together with minimum bristle coverage and the existing runtime history time limit.

Models use original procedural geometry, not copied photograph textures. Plant heights, leaf sizes, tomato dimensions and developmental mixtures are visual modeling assumptions, not cultivar measurements. These models do not certify yield, maturity detection, contact safety, or harvesting physics.

## Product cases and completion

Formal cases cover multiple drain widths, flat water height, soil below the curve, rounded lips, the section consumer, exact root offsets, 20 cm spacing, both cultivars, all 20 variants, repeatability, empty planting rows, invalid narrow soil, and configuration-dependent regeneration. Rendering admission and resource tests cover shared instances, transformed bounds and disposal. Runtime tests prove view changes perform zero geometry rebuilds while Apply/Undo/Redo refresh the scene. Close-up browser review must distinguish the two leaf types, long cucumber fruit, oval clustered tomatoes, calyces and tendrils. Existing app tests, typecheck, lint, production build and current-head CI must pass.

## Unharvested cucumber development

All modeled fruit remain attached to their plant. No harvested appearance or post-harvest behavior is implemented. The eight visual stages are flowering, young, expanding, near-harvest, harvestable, early delayed harvest, late delayed harvest, and oversized. Harvestable means eligible for picking, not already picked. The last three stages represent continued expansion after missing the harvest window.

At the default net height, flowering fruit measure 2.5–4.5 cm, young fruit 6–8.5 cm, expanding fruit 10–13.5 cm, near-harvest fruit 15.5–19 cm, and harvestable fruit 20–24 cm. Early and late delayed-harvest fruit measure 26 × 4.5 cm and 28 × 6.2 cm (length × nominal diameter). The user's oversized endpoint is 30 × 8 cm. Intermediate dimensions are illustrative modeling choices. Dimensions scale with the existing model envelope for shorter nets.

Every cucumber variant includes the five pre-delay stages. Five of the 20 variants additionally include one delayed-harvest stage; all three delayed stages occur across the set. Young fruit have pale green skin, conspicuous fine spines and a yellow corolla at the blossom end. Flowers diminish into dry remnants as attached fruit expand. Oversized fruit develop gray-green mottling, based on the user's supplied photograph. The supplied seven cucumber photographs guide fruit relief, stem and leaf hairs, and flowering ovaries. These are visual stages, not a time-based growth simulation.

## Leaf surface detail

Cucumber leaves use a shared original 256 × 256 albedo/normal pair with five palmate primary veins, branching secondary veins, an irregular reticulate minor-vein network and puckered blade relief, guided by the user's cucumber leaf photograph. Tomato leaflets use a distinct pair with a central midrib, lateral branching and shallower reticulate relief. Each full/distant blade has matching UV coordinates; stem/petiole bristles remain physical geometry rather than painted marks. Maps do not change growth stages, silhouette, planting or vertex budgets.

Tomato reference: <a href="https://www.pubs.ext.vt.edu/SPES/spes-508/spes-508.html" target="_blank" rel="noopener noreferrer">Virginia Cooperative Extension - tomato morphology, Figure 3 leaf veins</a> and <a href="https://labs.plb.ucdavis.edu/rost/tomato/Leaves/veins.html" target="_blank" rel="noopener noreferrer">UC Davis - tomato venation and trichomes</a>. These establish the generic tomato venation structure; applying it to the modeled Yu-Nu leaflets is a botanical modeling interpretation, not a cultivar-specific measured texture. The user's supplied Yu-Nu photographs remain the cultivar appearance reference. No reference photographs are copied into runtime assets.

The invariant anatomy maps are generated once per module lifetime and shared across all variants/configurations. Admission detaches and validates RGBA byte buffers and finite per-vertex UVs. The engine owns one GPU map pair per live admitted surface, shares it across materials and frees it after the final owner is disposed. Formal tests cover pixel contrast/normal variation, distinct venation, UV mapping, pixel isolation, GPU sharing and release, and textured material binding. Real-app crop close-ups verify the final combination with stems and fruit.

## Vertical maturity

For this unharvested scene, lower fruit bands are older and larger than upper bands on every variant at different net heights. Cucumber retains its bottom harvestable or delayed-harvest fruit through the flowering ovary at the top. Tomato truss ripeness decreases with ascending nodes, with small deterministic variant differences and a smaller proximal-to-distal age gradient inside each truss. Fruit dimensions and the existing uneven skin coloration consume the same ripeness value. The upper/lower third of actual fruit centers must differ by more than 0.4 in mean ripeness and by more than 15% in mean length. These are scene modeling controls, not calibrated biological growth rates; planting, leaf textures, bristles and occlusion remain unchanged.

## Farm-wide overgrown fruit budget

Early delayed harvest, late delayed harvest and oversized cucumbers share a maximum of ten actual fruits across the entire farm. The layout samples one cucumber plant per 500 cucumber plants, capped at ten; the default 2,976 cucumber plants therefore include five overgrown fruits. Sampling is deterministic without replacement across all rows and bays. Eligible variants rotate through the five existing delayed-harvest models, each with exactly one overgrown fruit; all other cucumber plants use the fifteen normal variants. The shared layout policy also determines model eligibility. Tomato assignments, planting coordinates and twenty-model libraries remain unchanged. Counts apply before rendering, including hidden/off-screen instances and both detail levels; camera and visibility never change the population budget.

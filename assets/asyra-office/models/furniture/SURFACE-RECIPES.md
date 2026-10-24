# Basic Furniture - Surface Recipes

Colours and roughness follow materials in the [JSON](furniture-model-spec.json). All alpha=1, metallic=0, emission=0, transmission=0. No AO, shadows, highlights, environment-reflection textures, normal maps, or displacement. Do not bake generated fabric shading or bright edge lines into models.

## Wood grain

Tabletops use local u=X,v=Y; side edges u=X,v=Z. Short ends, undersides, wooden legs, and aprons initially use their solid base colours. Grain runs along X, including parallel grain on the round table rather than concentric rings.

Fixed recipe: p=2π(v/0.022+0.04 sin(2πu/0.37)); g=((1+sin p)/2)^10; C=oak×(1−0.18g)+oak-grain×0.18g. Compute in normalized sRGB, then convert to linear with c/12.92 when c≤0.04045, otherwise ((c+0.055)/1.055)^2.4. No random seed or camera-/lighting-dependent colour. Geometric surface orientation may select or blend the documented texture projections. Texture export uses 1024 px per metre, pixel-centre sampling, and 8 px same-colour edge dilation.

## Fabric and supports

sage covers all work-chair and green-sofa cushions/shells; orange covers all armchair cushions/shells. Use solid rough surfaces initially. Do not convert image weave into geometry or high-frequency normal maps. Intrinsic gaps are geometric, not painted black. Supports use dark-frame or dark-wood, including backs/undersides.

The specified materials define the default palette; desk replacement follows
the desk-specific contract below. Add no stains, creases, metallic glints, carvings, decorative studs, or painted black silhouettes. The app controls scene lighting.

## Writing desk replacement and resized mapping

The [desk contract](WRITING-DESK-SPEC.md) and numeric `appearance` fields define
separate tabletop, apron and leg regions. The listed materials are defaults,
not a prohibition on user-selected replacements. Use region material, otherwise
desk material, otherwise preset; then region colour, otherwise desk colour.
Isolate instance overrides and retain other material properties.

For the desk, evaluate the existing grain formula in resized local metres before
placement. Top faces use X/Y; long edge faces use X/Z; short ends, underside and
aprons use solid oak. A plain replacement material removes the grain. A base
colour override retains the selected material pattern, whose secondary grain
colour is independently configurable. Do not alter geometry to change appearance.

The desk's default wood transitions over rounded edges using the
[specified geometric-normal blend](WRITING-DESK-SPEC.md#grain-across-rounded-edges-and-corners).
Keep blend weights in default local normal space and grain sampling positions
in resized local metres. Lighting normals and replacement-material mappings
remain independent; do not switch abruptly between projections at bevel seams.

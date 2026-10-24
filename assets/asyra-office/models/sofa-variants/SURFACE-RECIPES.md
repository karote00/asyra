# Sofa Variants - Surface Recipes

Reuse the approved sofa palette: sage #78836A (roughness 0.93) and dark wood #584333 (roughness 0.82). Metallic 0, alpha 1, transmission 0, emission 0, no clearcoat. All exposed upholstery and the undersides use sage; all feet use dark wood. This is the default palette; per-component overrides may change it.

Intrinsic cloth weave is an optional separately selected material: use object-local coordinates on the dominant-normal plane, selecting X/Z when abs(Ny) is largest, Y/Z when abs(Nx) is next largest, otherwise X/Y. Break ties in that order. For coordinates q1,q2, cell size s=0.002 m, define F(q)=q-s*floor(q/s). Where F(q1)<0.00012 or F(q2)<0.00012, multiply linear sage RGB by 0.97; elsewhere retain the base. No seed, texture displacement, fuzz meshes, normal map or roughness variation. At distances where weave is subpixel, ordinary filtering may average it away. Do not create textures or LOD models in this batch.

Feet are uniform dark wood with no painted gloss or grain. All shape rounding comes from geometry; no edge-darkening or fake cushion seams. Do not use rendered sheets as textures. Cast shadows, contact shadows, ambient occlusion, highlights and white backgrounds are excluded from materials. The app owns lighting.

## L-shaped sofa replacement and default clarification

The [L-shaped sofa contract](L-SHAPED-SOFA-SPEC.md) takes precedence for this
module only. Sage and dark wood remain the same default colours and roughness.
Its default is solid colour; the weave above is an optional selected material.
Each upholstered part and each indexed foot can be overridden independently.
Resolve per-foot material, otherwise part material, otherwise sofa material,
otherwise preset; then apply colour overrides with the same priority and
preserve other properties. Isolate instances. Replacement materials own their
mapping under the shared resized-local-space rules. The original no-variation
statement describes the default palette, not a restriction on user overrides.
The curved sofa uses the independently specified replacement contract below.

## Curved sofa replacement and defaults

The [curved sofa contract](CURVED-SOFA-SPEC.md) defines solid sage upholstery
and dark wood as defaults, with the same palette and roughness above. Every
component and each indexed foot supports independent material and colour
replacement. Resolve each override independently from foot to component to
sofa to preset, then apply the resolved colour without changing other material
properties or instances. The optional weave recipe above is not required.
Surface mapping follows final whole-unit sizing. No shading is baked in.

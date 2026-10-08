# Asset Types and Reviewed Component Classification

Updated 2026-10-09. This is a documentation classification of existing assets,
not a directory migration, new model batch, implemented asset registry or API.
Existing identifiers, default dimensions, unit boundaries and drawing approval
states remain unchanged. Instance sizing follows the [shared overall-size rule](README.md#overall-size-and-appearance---2026-10-09). Scene categories such as architecture and street remain useful
navigation; the types below describe what an asset supplies.

## Three asset types

| Type | Supplies | Placement and appearance |
| --- | --- | --- |
| Model component | Authored geometry, dimensions, origin, joins and configurable material regions | Independently placeable as its defined unit; references default material assets |
| Material asset | A reusable surface recipe: colour, roughness, metallic and optional texture inputs with mapping requirements | Assigned to compatible model regions or decal pigment; has no independently placeable volume |
| Decal component | One independently placeable surface marking with physical size, contour, alpha mask, origin and orientation | References a default pigment material; receiving geometry is not part of the unit |

A material is independently selectable and reusable, but is not a physical
object by itself. A base-colour PNG is an input to a material, not a complete
material contract. Keep its colour space, physical coverage, UV mapping and
other material properties with it. Existing surface documents own defaults.
Recipes without a production texture file remain recipe specifications; this
classification does not claim that missing textures have been generated.

A decal includes placement information that an ordinary material lacks. Its
mask defines its independent contour and transparent wear. Changing colour or
material must preserve that mask and physical bounds. Explicit size edits may
resize the decal under the shared sizing rule; design edits remain separate. A material replacement must not fill transparent
pixels or introduce receiving-surface colour into the marking.

## Path-generated decals

Straight, arc and short road markings are presets of one path-marking decal
family, not separate fixed models or shape-specific materials. Each instance
uses a centreline, width and shared paint; the app derives its contour.
See [path markings](street/PATH-MARKINGS.md). Material replacement retains the
current contour, while explicit path/width editing changes geometry. Crosswalk
stripes remain independently placed rectangular decals sharing the ivory paint.

## Path-generated curb solids

Straight and curved curbs are presets of one shared cross-section swept along
planar paths. They remain solid model components, not paint decals or materials.
See [planar curbs](street/PLANAR-CURBS.md). One continuous run or independently
capped blocks are app-selected generation modes; no runtime generator exists
as a result of this classification update.

## Shared geometry families and selectable presets

Geometry family, selectable preset and material are different responsibilities.
A preset may reference a shared geometry family with its own default dimensions,
chamfer parameters and material recipe. It remains a placeable model preset;
changing its size or material does not require another geometry family.

| Existing preset | Shared geometry family | Default X/Y/Z (mm) | Default chamfer offset | Default appearance |
| --- | --- | --- | --- | --- |
| `red-clay-paver` | Convex box with planar edge chamfers and triangular corner patches | 200 / 100 / 60 | 1 mm | Matte terracotta #B86F53 |
| `masonry-block` | Same family | 300 / 180 / 140 | 6 mm | Warm grey stone #C6BFB3 with intrinsic flecks |
| `wall-coping-slab` | Same family | 320 / 220 / 55 | 3 mm | Cream limestone #EBE2CE with intrinsic flecks |

Decision: retain all three presets, identifiers, numeric files and reference sheets.
Their vertex and half-space recipes describe the same topology and generator
family, but they are not identical meshes separated only by material. Their
chamfer defaults differ. Scaling the clay preset to the stone dimensions uses
factors (1.5, 1.8, 7/3), so the original 1 mm setbacks become (1.5, 1.8, 7/3) mm,
not the stone preset's 6 mm setbacks. Choose the base preset before overall sizing.

One future parameterized generator can create all three default geometries, then
apply the shared overall-size and appearance contract. No shared generator,
registry, runtime factory, model deletion or asset migration is implemented
by this classification. This comparison does not approve unreviewed images or
change the classification of other catalogue entries.

## Reclassification of reviewed components

| Existing component or group | Component type | Independent appearance and source |
| --- | --- | --- |
| Wall segment and partition segment | Model component | Plaster body and cream cap defaults in [architecture surfaces](architecture/SURFACE-RECIPES.md); keep existing part regions |
| Floor plank | Model component | [Natural oak material](architecture/materials/README.md) is independent; its approved PNG is a material input, not a decal or another floor mesh |
| Stair step | Model component | Stone default in [architecture surfaces](architecture/SURFACE-RECIPES.md) |
| Complete entrance door set | Model component | Frame wood, leaf/fixed-panel wood and hardware defaults in [architecture surfaces](architecture/SURFACE-RECIPES.md); leaf and narrow panel remain one approved set |
| Window with sill | Model component | Frame/sill and pane defaults in [architecture surfaces](architecture/SURFACE-RECIPES.md); retain its approved assembly and joints |
| Square column and horizontal beam | Model components, one per unit | Defaults in [column/beam surfaces](column-beam/SURFACE-RECIPES.md) |
| Flat roof slab and rooftop parapet | Model components, one per unit | Defaults and body/cap regions in [roof surfaces](roof-modules/SURFACE-RECIPES.md) |
| Stair baluster and sloped handrail | Model components, one per unit | Painted-metal defaults in [stair railing surfaces](stair-railing/SURFACE-RECIPES.md) |
| Landing baluster and level handrail | Model components, one per unit | Painted-metal defaults in [landing railing surfaces](landing-railing/SURFACE-RECIPES.md) |
| Upper and lower transition posts | Model components, one per unit | Painted-metal defaults in [transition surfaces](railing-transitions/SURFACE-RECIPES.md) |
| Level handrail corner | Model component | Painted-metal default in [corner surfaces](railing-corner/SURFACE-RECIPES.md); the L-shaped solid remains one unit |
| Lounge armchair | Model component | Upholstery and wooden feet use the existing [default appearance](furniture/ARMCHAIR-DEFAULT-APPEARANCE.md); no new geometry or model approval is implied |
| Asphalt surface tile | Model component | Asphalt is a separate default material recipe in [street surfaces](street/SURFACE-RECIPES.md#asphalt-default-and-overrides); tile dimensions and bottom bevel remain geometry |
| Straight edge line | Path-marking preset | One 1.00 x 0.10 m marking; shared ochre paint; contour generated from path |
| Curved edge line | Path-marking preset | One quarter-circle marking, centre radius 1.05 m and width 0.10 m; shared ochre paint; contour generated from path |
| Short lane dash | Path-marking preset | One 0.60 x 0.12 m marking; shared ivory paint; contour generated from path |
| Crosswalk stripe | Decal component | One 0.40 x 2.80 m marking; ivory pigment and independent alpha mask |

Road marking dimensions, origins, masks and defaults remain defined by the
[street specification](street/street-model-spec.json), [geometry document](street/STREET-SUPPLEMENT.md)
and [surface recipes](street/SURFACE-RECIPES.md#paint-masks). Classifying the four
markings together does not approve their current sequential geometry review
or combine them into one placement unit. No other later batches are re-reviewed
by this update.

Matching colour names or hex values do not automatically merge material recipes.
For example, solid plaster and a plaster recipe with intrinsic variation can
share a base tint while remaining distinct surface definitions. Keep each
batch's current parameters and mapping; any future deduplication needs an
explicit equivalence check.

## Placement and replacement boundaries

- A floor plank or asphalt tile keeps its geometry when its material changes.
  Wood, brick or another appearance does not require duplicating that geometry.
- Markings contain pigment and transparency only. They may be placed on asphalt,
  brick, stone or another receiving surface. Wear reveals the actual surface.
- Existing road decals have zero authored thickness. On a flat surface, their
  existing 0.0005 m offset is a display separation, not an ultra-thin solid.
  A future renderer may use a plane or surface projection; implementation is
  app-owned and is not selected or built by this classification.
- Curved or uneven receivers require app-owned projection or conformance; an
  independent material alone does not provide that behavior.
- An actual raised strip would be a model component with explicit thickness.
  Do not silently turn the existing paint decals into thin boxes.
- Colour/material replacement preserves geometry, placement, unit boundaries
  and other instances. No baked shadows, lighting or receiving backgrounds.

## Catalog and handoff

The main catalog keeps the existing location-based order and points here for
type classification. Original drawing/specification counts remain historical
inventory counts, not a count of completed meshes or independently implemented
material assets. Do not move files, rename persisted identities, duplicate
sheets, generate models/textures or invent factory signatures for this update.

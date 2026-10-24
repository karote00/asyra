# Bookcase - Construction Specification

Status: construction documents approved by the user for commit. The [original five-view drawing](review/02-bookcase-v1.png) remains unchanged. No production model, boolean result, Blender export or app rendering is verified.

## Source, unit and coordinate system

This is the narrow wooden shelf associated with the sofa area. Its exact shelf count, backing and dimensions are authored completions. Use the retained sheet for design and the [numeric specification](storage-model-spec.json) for construction. Generated shading, grain variation and perspective are not new geometry or calibrated measurements.

One placeable unit is one bookcase with three empty open compartments, two intermediate shelves, closed backing and a recessed plinth. No books, plants, doors, handles, drawer, casters, separate feet or wall mounting hardware belong to this unit.

Default complete dimensions are **420 x 260 x 820 mm**. Use metres, X width, Y depth, +Z up and -Y front. Origin is (0,0,0), the body footprint centre at ground level. Bounds are X=-210..210, Y=-130..130, Z=0..820 mm. The plinth is offset 10 mm toward +Y; do not move the unit origin to the plinth centre.

## Component envelopes

All values below are millimetres. These are the same panel sizes and placements as the earlier numeric specification, with floating-point serialization noise removed. Each input retains its original identifier and default appearance. Inward edge treatment does not enlarge these envelopes.

| Part       | Size X,Y,Z (mm) | Centre X,Y,Z (mm) | Default material |
| ---------- | --------------- | ----------------- | ---------------- |
| side-left  | 22,260,785      | -199,0,427.5      | oak              |
| side-right | 22,260,785      | 199,0,427.5       | oak              |
| top        | 376,260,22      | 0,0,809           | oak              |
| bottom     | 376,260,22      | 0,0,46            | oak              |
| back       | 376,18,741      | 0,121,427.5       | oak              |
| plinth     | 360,200,35      | 0,10,17.5         | oak-dark         |
| shelf-1    | 376,242,25      | 0,-9,297          | oak              |
| shelf-2    | 376,242,25      | 0,-9,547          | oak              |

The top fits **between** the side panels: X=-188..188, Z=798..820 mm. Both sides reach Z=820 mm. Do not copy the snack cabinet's full-width cap arrangement or add an overhanging top. The lower board also fits between the sides at Z=35..57 mm. The back spans X=-188..188, Y=112..130 and Z=57..798 mm, closing all three compartments.

The plinth spans X=-180..180, Y=-90..110 and Z=0..35 mm. Its insets relative to the body are 30 mm on each side, 40 mm in front and 20 mm at the rear. It is one solid support, not four feet. A planar bottom area remains on Z=0 after the edge roundover.

## Contact graph and construction order

The eight source boxes are construction inputs to a **single closed body**. The top and bottom contact the side panels; the back contacts both sides, top and bottom; each internal shelf contacts both sides and the back; the plinth contacts the underside of the bottom board. Contact planes use identical authored coordinates. There are no positive-volume overlaps among the unrounded inputs.

Union the unrounded inputs first. Remove internal and duplicate contact faces, weld matching boundaries and preserve source face labels for replaceable appearance. Do not export eight individually rounded boxes and leave tiny channels along the side/shelf/back joints. A drawn join line does not authorize a groove, duplicate face or extra strip.

After union, apply a 3 mm inward circular roundover to exposed convex edges only. Use tangent quarter-circle edge profiles with compatible convex corner patches. Keep concave cavity edges and internal mating boundaries sharp. Do not fill open compartments or soften a hidden mating edge independently. Planar faces remain flat; curved surfaces use smooth normals, with no subdivision that moves the authored bounding planes.

The two sides and between-side top retain their distinct surface ownership even where the top surface is continuous after union. This keeps the approved construction and grain directions without adding disconnected geometry.

The original 2 mm overall-dimension tolerance is a future model acceptance limit, not a permitted joining gap. Matching input planes must agree within 0.01 mm at default scale, and the final body must be welded with no open boundary. This comparison tolerance does not permit bridging an intentional gap or adding filler geometry. No completed manifold mesh is claimed by specifying this order.

## Empty compartments and shelf spacing

All three clear openings share X=-188..188 and Y=-130..112 mm, giving a width of 376 mm and depth of 242 mm. Their heights intentionally differ; do not distribute the shelves evenly.

| Compartment | Clear Z interval (mm) | Clear height (mm) | Lower and upper boundaries            |
| ----------- | --------------------- | ----------------- | ------------------------------------- |
| Bottom      | 57..284.5             | 227.5             | Bottom board top to shelf-1 underside |
| Middle      | 309.5..534.5          | 225               | Shelf-1 top to shelf-2 underside      |
| Top         | 559.5..798            | 238.5             | Shelf-2 top to top-board underside    |

Each shelf is 25 mm thick. The rear of each shelf ends at Y=112 mm and meets the backing front, not the cabinet rear plane. Top and bottom boards extend to Y=130 mm; the back fits vertically between them. The three compartments are real voids open toward -Y. Do not substitute dark rectangles on a solid block. A rear view shows a continuous wooden backing, not visible stored contents or openings.

These clear envelopes are exact nominal planar dimensions. Exposed convex rounding removes material locally and may enlarge corner clearance; it must not reduce these clear spaces. No intermediate shelf or front lip is added.

## Replaceable appearance and default materials

Apply the [shared size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09). Resolve a part's material override, then a whole-unit override, then its preset. Resolve explicit part colour, then whole-unit colour; if no tint is supplied, retain the selected material's own colour. Material replacement owns its surface recipe and must not mutate other bookcases.

| Region                                        | Default appearance                 | Roughness |
| --------------------------------------------- | ---------------------------------- | --------- |
| Both sides, top, bottom, back and two shelves | oak #C7A376 with oak-grain #AF895F | 0.82      |
| Recessed plinth                               | solid oak-dark #A68760             | 0.85      |

All defaults have metallic 0, alpha 1, transmission 0 and emission 0. The [surface recipe](SURFACE-RECIPES.md) defines intrinsic wood grain without normal maps, displacement, shadows or baked lighting. Interior backing is the same wood appearance, not an occlusion-coloured insert.

Each input part retains an independently configurable surface region after union. Surviving exterior faces keep their source labels. New roundover faces inherit the closest adjoining surviving source face; exact distance ties use the component-table order. The colour transition does not require an extra face layer or reveal an internal face.

Use final resized local metres before world placement for grain coordinates. For vertical side/back surfaces, front/back-facing regions use (u,v)=(Z,X), while side-facing regions use (Z,Y). Horizontal board top/bottom regions use (X,Y), front edges use (X,Z), and short ends are plain oak. Rounded transitions inherit the selected source face mapping. Keep the default 24 mm grain spacing and 400 mm modulation wavelength physical rather than stretching them with the cabinet. World rotation does not change the local pattern phase.

## Overall resizing

Omitted target dimensions retain defaults. For finite positive (Wx,Dy,Hz), use S=(Wx/0.420,Dy/0.260,Hz/0.820) once about the bottom origin. Reject zero, negative and nonfinite extents. Scale all board centres, dimensions, the plinth offset, openings, roundovers and joining tolerances with the same transform. Do not resize individual boards a second time or keep thicknesses fixed after scaling.

The ground plane remains Z=0; left/right bounds remain symmetric, while the plinth's 10 mm rearward offset becomes 10*Sy mm. Independent X/Y/Z scaling may alter corner curvature and grain-region proportions. Transform normals by the inverse transpose and normalize. Appearance mapping follows final local dimensions; placement rotation follows local sizing. This contract adds no bending, terrain fitting, shelf-count changes or wall attachment.

## LoD requirements

| Tier | Circular edge intervals | Triangle budget | Measured triangles |
| ---- | ----------------------- | --------------- | ------------------ |
| lod0 | 3                       | 3000            | Not generated      |
| lod1 | 2                       | 1500            | Not generated      |
| lod2 | 1                       | 800             | Not generated      |

These are implementation admission targets, not measured counts for an existing mesh. All tiers must retain one closed body, the three real open compartments, two shelves at their specified elevations, full backing, between-side top, recessed plinth, exact bounds and origin. Reduce circular-edge subdivision only; never close a cavity or replace shelves with painted lines. Convex corner tessellation must meet adjacent edge samples without cracks.

Measure the actual union/bevel result before declaring a tier accepted. If a budget cannot be met while preserving these features, revise the tessellation within those constraints and review its evidence. Do not silently discard a part or claim a budget is satisfied by this document. The app owns screen-space switching thresholds and runtime performance checks.

## Verification boundary

The permanent [bookcase checks](review/__tests__/test_bookcase_spec.py) verify dimensions, top fit, plinth offsets, contact connectivity, lack of unintended solid overlap, exact unrounded union volume by coordinate-cell integration, open cavity samples, backing closure, two nonuniform resizing cases, default materials and document tables. They operate on numeric construction inputs and produce no exported geometry. They do not validate the rounded boolean topology or render quality.

After separately authorized implementation, compare front, right, back, top and oblique views against the retained sheet. Then inspect top/side, shelf/side, shelf/back, bottom/plinth and backing joints at close range. Verify a watertight body, no retained internal faces, no slits, correct appearance regions, unobstructed openings and measured LoD counts. Numeric document checks cannot replace that later visual and mesh review.

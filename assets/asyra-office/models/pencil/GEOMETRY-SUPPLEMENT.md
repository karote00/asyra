# Pencil - Geometry Supplement

## Coordinates and authority

Use metres, +Z up, -Y front and +X right. Origin is the bottom graphite apex at (0,0,0). The pencil points downward. Apply identity rotation and unit scale.

Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. The sheet's end details are enlarged; they are not at the elevation scale. Numeric geometry overrides illustrated proportions and facet-line placement.

## Hexagonal rings

For each radius r and height z, create six vertices (r*cos(k*pi/3), r*sin(k*pi/3), z), k=0..5. All rings share this orientation.

| Ring                | Radius | Z     |
| ------------------- | ------ | ----- |
| Graphite base       | 0.001  | 0.006 |
| Sharpened wood base | 0.0035 | 0.020 |
| Flat tail           | 0.0035 | 0.180 |

Connect the apex to the first ring with six graphite triangles. Connect ring 1 to ring 2 with six exposed-wood quads. Connect ring 2 to ring 3 with six sage-painted quads. Close the tail with a flat hexagonal face.

The overall length is 0.180. Corner-to-corner hex width along X is 0.007; width along Y is sqrt(3)*0.0035, approximately 0.00606218. The sharpened wood portion is 0.014 long, the graphite point 0.006 long and the painted body 0.160 long.

No bevel, subdivision, cylindrical rounding, extra paint rim, carved logo or hollow body. All facets have flat normals; winding faces outward. Ring connections are seamless. A single closed exterior is sufficient; do not add internal caps at material boundaries.

## Tail and graphite core

The tail at Z=0.180 is exposed wood with a centred graphite hexagon of circumradius 0.001, aligned with the outer hexagon. This can be a planar material region; no recessed hole or raised plug is present.

The internal core may be treated as implicit since there is no cutaway or breakage state. If a tool requires an explicit core, its regular hexagonal cross-section has circumradius 0.001 and runs from Z=0.006 to Z=0.180, joined to the exposed apex region. Remove internal overlap surfaces from any final single mesh.

From below, the graphite point and wood taper occlude the painted barrel end. There is no green band surrounding the sharpened end.

## Future acceptance

After modeling authorization, verify ring dimensions within 0.0001 m, closed tail, six facets, sharp apex, flush core marking and single-unit boundary. No model or export validation has occurred. Placement, writing, sharpening, wear, animation and alternate LOD meshes are outside this handoff.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Hexagonal size and tail

Default dimensions are 7 x (3.5*sqrt(3)) x 180 mm, approximately 7 x 6.062178 x 180 mm. Do not use 7 mm for both horizontal axes. Graphite apex, wood taper and paint share rings at Z=6 and 20 mm. The flat tail has a flush graphite hexagon inside exposed wood; it is not a hole. This is one closed six-sided object with three replaceable appearance regions. Preserve all six facets at every LoD; a small fixed mesh is sufficient, with no cylinder conversion or duplicated internal caps. Scaling the complete unit also scales the tip and tail mask.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

# Roof Modules - Geometry Supplement

## Coordinate and authority contract

All dimensions are metres. +Z is up, -Y is front, +X is right. Each object's origin is at its bottom footprint centre. Apply identity rotation and unit scale. Bounds and constructions below define all hidden faces. The numeric specification overrides apparent drawing proportions; do not trace raster pixels for measurements.

Front looks along +Y, back along -Y, right along -X, top along -Z, bottom along +Z. The omitted left elevation mirrors the right geometrically. The three-quarter view communicates volume only.

## Single roof slab

One closed rectangular box, X and Y from -0.50 to +0.50; Z from 0 to 0.18. Overall size: 1.00 x 1.00 x 0.18. Six flat faces, eight vertices, twelve triangles after triangulation. All faces use stone. The underside is completely flat and solid.

No bevel, overhang, edge lip, holes, tiles, grooves, supports, underside structure or attachments. Four identical vertical sides. Top and bottom have equal square footprints.

## Single parapet segment

Overall size: 1.00 x 0.27 x 0.65.

| Part | Minimum XYZ | Maximum XYZ | Material |
| --- | --- | --- | --- |
| Body | -0.50, -0.135, 0 | 0.50, 0.135, 0.62 | Plaster |
| Cap | -0.50, -0.135, 0.62 | 0.50, 0.135, 0.65 | Cream cap |

Each part is a closed box: six flat faces, eight vertices and twelve triangles. Retain both closed parts at their touching Z=0.62 plane. There is no volumetric overlap, gap or cap overhang. Group both parts as one placeable parapet; the cap is not a separate catalogue item. Bottom is solid plaster. End faces are flat, without sockets.

No bevel, posts, drains, railings, bricks, seams or attached roof. No subdivision. Use outward normals and flat face normals. Corner joining and special corner pieces are outside this batch.

## Placement reference

These are design coordinates for future assembly, not implemented app behavior.

- Adjacent slabs: translate a copy by (1, 0, 0) or (0, 1, 0) for edge-to-edge placement.
- Straight parapet run: translate a copy by (1, 0, 0).
- To place a parapet on this slab, its bottom Z is 0.18 in slab coordinates. Combined height is 0.83.
- To align a parapet with the slab's negative-Y edge, its centre Y is -0.365. For the positive-Y edge use +0.365. X remains 0.
- Counts, layout, openings, corner treatment, upper floors and camera cutaway are app concerns. Do not add unrequested geometry to these units.

## Reconstruction acceptance

Future models should match every bound within 0.001 m, preserve the individual placement unit, use the documented materials and contain no hidden extra parts. No geometry simplification is needed for these boxes; a future app can instance the same geometry at all distances. No authored LOD meshes or runtime policy is delivered here.

Actual model measurements, normals and export checks remain for the model stage. The drawings alone do not prove those checks.

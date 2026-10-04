# Pencil - Geometry Supplement

## Coordinates and authority

Use metres, +Z up, -Y front and +X right. Origin is the bottom graphite apex at (0,0,0). The pencil points downward. Apply identity rotation and unit scale.

Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. The sheet's end details are enlarged; they are not at the elevation scale. Numeric geometry overrides illustrated proportions and facet-line placement.

## Hexagonal rings

For each radius r and height z, create six vertices (r*cos(k*pi/3), r*sin(k*pi/3), z), k=0..5. All rings share this orientation.

| Ring | Radius | Z |
| --- | --- | --- |
| Graphite base | 0.001 | 0.006 |
| Sharpened wood base | 0.0035 | 0.020 |
| Flat tail | 0.0035 | 0.180 |

Connect the apex to the first ring with six graphite triangles. Connect ring 1 to ring 2 with six exposed-wood quads. Connect ring 2 to ring 3 with six sage-painted quads. Close the tail with a flat hexagonal face.

The overall length is 0.180. Corner-to-corner hex width along X is 0.007; width along Y is sqrt(3)*0.0035, approximately 0.00606218. The sharpened wood portion is 0.014 long, the graphite point 0.006 long and the painted body 0.160 long.

No bevel, subdivision, cylindrical rounding, extra paint rim, carved logo or hollow body. All facets have flat normals; winding faces outward. Ring connections are seamless. A single closed exterior is sufficient; do not add internal caps at material boundaries.

## Tail and graphite core

The tail at Z=0.180 is exposed wood with a centred graphite hexagon of circumradius 0.001, aligned with the outer hexagon. This can be a planar material region; no recessed hole or raised plug is present.

The internal core may be treated as implicit since there is no cutaway or breakage state. If a tool requires an explicit core, its regular hexagonal cross-section has circumradius 0.001 and runs from Z=0.006 to Z=0.180, joined to the exposed apex region. Remove internal overlap surfaces from any final single mesh.

From below, the graphite point and wood taper occlude the painted barrel end. There is no green band surrounding the sharpened end.

## Future acceptance

After modeling authorization, verify ring dimensions within 0.0001 m, closed tail, six facets, sharp apex, flush core marking and single-unit boundary. No model or export validation has occurred. Placement, writing, sharpening, wear, animation and alternate LOD meshes are outside this handoff.

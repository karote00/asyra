# Stair Railing - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front, +X right. The stair ascends toward +X. Front looks along +Y; back looks along -Y and reverses the screen-horizontal direction. Right looks along -X, top along -Z, bottom along +Z. Apply identity rotation and unit scale.

The numerical polygons are authoritative. Sheet dimensions are annotations; raster proportions are not measurements. Left-side geometry is fully defined by the polygons although not separately illustrated.

## Baluster

Origin is the centre of the bottom footprint. Extrude the following XZ polygon from Y=-0.02 to Y=+0.02, then close both ends:

| Vertex | X | Z |
| --- | --- | --- |
| A | -0.02 | 0 |
| B | 0.02 | 0 |
| C | 0.02 | 0.91 |
| D | -0.02 | 0.89 |

Overall bounds: 0.04 x 0.04 x 0.91. Top plane is Z=0.90+0.5X. Bottom is horizontal. The post is solid, with no base plate, finial, collar, hardware or hollow core. The rear elevation's top descends toward screen-right; this was corrected in the selected image.

## Sloped handrail segment

Origin is the midpoint of the bottom edge of its lower end: (0,0,0). This intentionally differs from the baluster's footprint-centre origin.

Extrude the following XZ polygon from Y=-0.02 to Y=+0.02, then close both ends:

| Vertex | X | Z |
| --- | --- | --- |
| A | 0 | 0 |
| B | 0.30 | 0.15 |
| C | 0.30 | 0.19 |
| D | 0 | 0.04 |

Bounds: X=0..0.30, Y=-0.02..0.02, Z=0..0.19. Horizontal run is 0.30; rise is 0.15; pitch is atan(0.5)=26.5650511771 degrees. Vertical thickness is 0.04, not thickness perpendicular to the slope. Perpendicular thickness is 0.04/sqrt(1.25), approximately 0.0357771.

Both end faces are vertical YZ rectangles, 0.04 x 0.04. The complete right orthographic silhouette is 0.04 x 0.19 because the sloping length projects behind the near end. Do not mistake that full silhouette for the size of one end face. Top and bottom projections are 0.30 x 0.04 rectangles.

No curvature, round profile, bevel, end cap, bracket, post or hardware.

## Mesh construction

Each object has eight vertices and six closed planar quad faces, or twelve triangles after triangulation. Join corresponding polygon edges to form side faces; ensure outward winding. Use flat face normals. No subdivision, bevel or hidden extra solids. All faces share one material.

## Interior joining reference

These coordinates explain an optional future assembly; no assembly code or model is delivered.

- Lower rail origin: (0,0,0.90).
- Next rail origin: (0.30,0,1.05).
- Interior post origin: (0.30,0,0.15).
- Both rail ends touch at X=0.30. Their underside follows the same plane as the post top, across the full post width.
- Repetition translation is (0.30,0,0.15). This matches the existing step's run and rise when the stair is oriented toward +X.

A rail segment contains no duplicate post. The example describes an interior join only. Open-run ends, landing transitions and alternative stair slopes require separate decisions and are not silently included. The app owns counts, placement, orientation, collisions and animations. This is a stylized visual asset contract, not a physical building railing specification.

## Future model acceptance

After model authorization, confirm polygon bounds within 0.0005 m, end-face directions, slope, origins, closed faces and intrinsic material. These simple solids need no alternate authored LOD mesh. Models and export checks remain a later stage.

# Cookie - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front and +X right. Origin is the bottom centre. Apply identity rotation and unit scale. Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z.

Dimensions are authored values, not measurements recovered from the source image. Use the numeric geometry rather than tracing drawing pixels.

## Closed body

Overall diameter is 0.070 and height is 0.012. The broad top and bottom are flat disks of radius 0.033. The outer cylindrical wall has radius 0.035 and extends from Z=0.002 to Z=0.010. Top and bottom rim fillets have radius 0.002.

Construct a surface of revolution around Z with 64 angular segments, starting at angle zero on +X. Use these meridian curves, sampled at five equally spaced angles per quarter arc (four intervals):

- Bottom rim: r=0.033+0.002*cos(t), z=0.002+0.002*sin(t), t=-pi/2..0.
- Straight side: r=0.035, z=0.002..0.010.
- Top rim: r=0.033+0.002*cos(t), z=0.010+0.002*sin(t), t=0..pi/2.

Merge duplicate rings at shared boundaries. Close the bottom and top disks with triangle fans from their centre vertices. Orient normals outward. Smooth the rim and side; flat disk normals are vertical. No further subdivision, holes, cracks, embossed logo or hidden cavity.

## Five flush chocolate spots

These are intrinsic color regions on the flat top, not separate raised solids. Each is a circle of radius 0.004. Centres in XY:

| Spot | X | Y |
| --- | --- | --- |
| Centre | 0 | 0 |
| Upper left | -0.014 | 0.014 |
| Upper right | 0.014 | 0.014 |
| Lower left | -0.014 | -0.014 |
| Lower right | 0.014 | -0.014 |

All spots lie entirely within the flat top disk at Z=0.012. Side, rim and bottom are plain dough. There is no colored region on the underside and no spot thickness. This design does not contain a volumetric chocolate filling.

## Future acceptance

When models are authorized, verify bounds within 0.0002 m, closed bottom, rounded rims, five spots in the specified positions, no chip protrusions and no extra props. Rendering with scene lights is future app work. No model reconstruction, export, LOD alternatives or animation has been performed.

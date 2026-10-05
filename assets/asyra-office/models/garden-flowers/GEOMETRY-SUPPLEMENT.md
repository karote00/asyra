# Geometry Supplement

## Shared construction

Metres, +Z up, -Y front, +X right. Each origin is the stem bottom center at ground Z=0. Use the [numeric specification](garden-flowers-model-spec.json) as dimension authority.

Stems are closed straight cylinders, radius 0.002, from Z=0 to the flower's headZ. Use 24 radial segments. Petals, flower centers and leaves are closed ellipsoids with 32 longitude sectors and 16 latitude intervals, welding each pole into one vertex. All radii refer to local X/Y/Z half-axes. Smooth curved surfaces; keep stem end caps flat. No subdivision or unlisted bevel.

Each petal is horizontal. For petal i, angle a=startDegrees+360*i/count. Its center is (centerRadius*cos(a),centerRadius*sin(a),headZ); apply Rz(a), aligning its long local X axis with the radial direction. Convert degrees to radians for trigonometry. Separate petals intentionally overlap the center ellipsoid.

## Yellow flower

- Total height: 0.250.
- Head center Z: 0.244.
- Five yellow petals, radial center distance 0.022, radii (0.018,0.009,0.002), start angle 90 degrees.
- Ochre center at (0,0,0.244), radii (0.009,0.009,0.006).
- Leaf one: center (-0.018,0,0.100), Ry(-45 degrees).
- Leaf two: center (0.018,0,0.150), Ry(+45 degrees).

Petal radial reach is 0.040. The nominal bloom diameter is approximately 0.080; the actual five-petal XY bounds follow the fixed angular arrangement, not a circular boundary.

## White flower

- Total height: 0.280.
- Head center Z: 0.274.
- Eight ivory petals, radial center distance 0.025, radii (0.020,0.007,0.002), start angle 0 degrees.
- Yellow center at (0,0,0.274), radii (0.010,0.010,0.006).
- Leaf one: center (0.018,0,0.115), Ry(+45 degrees).
- Leaf two: center (-0.018,0,0.170), Ry(-45 degrees).

The bloom has 0.090 overall width/depth because the eight-petal ring includes the cardinal directions.

## Leaves and hidden surfaces

Both plants use two olive leaves, local radii (0.008,0.002,0.025), with the long axis along local Z before rotation. Their centers and tilts above let their inner surfaces contact the stem; no separate branch or petiole is added.

The stem reaches the center of the bloom and intersects the center ellipsoid. All petals have real thickness; their underside uses the same assigned material. No veins, calyx, pollen dots, thorn, serration, exposed root, or extra underside disk. These simplified solids intentionally do not reproduce detailed botany.

Each plant is one placeable assembly, but keep stem, leaves, petals and center separately addressable. Do not merge the two species into one planter or patch.

## Views and future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. Both flowers face upward; an exact elevation sees the thin bloom edge rather than all petal faces. Oblique views can reveal the radial arrangement.

Future model review checks dimensions within 0.0005, one stem/two leaves/one bloom per plant, exactly five or eight petals, capped solids, hidden underside, ground origin and connecting intersections. No model or animation validation has occurred. Generated view-to-view geometry is not a calibrated reconstruction.

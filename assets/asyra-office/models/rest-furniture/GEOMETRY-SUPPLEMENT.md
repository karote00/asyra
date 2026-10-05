# Geometry Supplement

## Shared conventions

Metres, +Z up, -Y front, +X right. Each origin is centered on its base footprint at Z=0. For the pillow this is its bottom contact plane; for the daybed it is floor level. Dimensions and concealed details are authored. See the [numeric specification](rest-furniture-model-spec.json).

Rounded boxes are the Minkowski sum of the stated axis-aligned inner box and a sphere of the stated radius. Construct planar center faces, quarter-cylinder edge patches and spherical octant corners. Use 12 equal angular segments per quarter in both curved directions and weld shared boundaries. This preserves the exact outside dimensions. Smooth curved normals and retain planar faces. Do not replace the shape with an ellipsoid, subdivision cage, wrinkles, or an unspecified bevel.

## Nap daybed

Overall bounds: X +/-0.900, Y +/-0.375, Z=0 to 0.650. The headboard is at -X; there is no footboard.

Four straight wooden legs, each 0.060 square, are centered at X=+/-0.780 and Y=+/-0.255. They span Z=0 to 0.280. All are equal height, with flat bottom contact and no taper.

Wood platform: X +/-0.900, Y +/-0.375, Z=0.280 to 0.340. It is a closed solid slab, not an array of planks or a drawer.

Wood headboard: X=-0.900 to -0.860, Y +/-0.375, Z=0.340 to 0.650. It is a plain rectangular plank whose bottom meets the platform. No posts, holes, raised trim, footboard, or side rails.

The sage pad is one rounded box centered at (0.020,0,0.380), with outside size 1.740 x 0.710 x 0.080 and rounding radius 0.020. Its inner box is 1.700 x 0.670 x 0.040. Outside bounds are X=-0.850 to +0.890, Y +/-0.355, Z=0.340 to 0.420. There is a 0.010 gap between the headboard's inner face and the pad's leftmost end.

Keep four legs, platform, headboard and pad as separately addressable closed solids within the daybed assembly. No underside mechanism, hidden frame, fasteners, tufting, seam, zipper, cushion divisions, or adjustable back. This is a flat static rest surface.

## Sleeping pillow

One rounded box centered at (0,0,0.050), with outside size 0.500 x 0.320 x 0.100. Rounding radius is 0.040, inner box size 0.420 x 0.240 x 0.020. Bounds are X +/-0.250, Y +/-0.160, Z=0 to 0.100.

The broad upper and lower middle surfaces are flat, joined by the rounded edge/corner patches. No pointed corners, dents, gravity sag, seams, fabric weave, layered casing, fill simulation or deformation states. All hidden faces are fully defined by the same rounded-box construction.

Placement on the daybed is the application's responsibility. Do not bake a fixed pillow position into the daybed or add the pillow to its component count.

## Views and future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. RIGHT is the daybed foot-end view; the distant headboard may be visible above the pad. Rear projection reverses the headboard's image side without changing its -X location.

Future review checks dimensions within 0.001, four equal legs, underside/platform contact, headboard end, pad clearance and continuous rounded surfaces. Inspect pillow bottom and side silhouettes as well as upper views. No model, animation, comfort, physics or runtime behavior has been verified.

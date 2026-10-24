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

### Top cut - explicit geometry

The top plane does not depend on Y. Its four corners, in assembly-local metres,
are listed below. These corner labels refer only to the top face; they do not
replace the A-D labels in the construction polygon above.

| Top corner | X | Y | Z |
| --- | --- | --- | --- |
| A - front left | -0.02 | -0.02 | 0.89 |
| B - front right | 0.02 | -0.02 | 0.91 |
| C - rear right | 0.02 | 0.02 | 0.91 |
| D - rear left | -0.02 | 0.02 | 0.89 |

- Join A-B-C-D as one planar rectangular face. Opposite edges are parallel;
  adjacent edges are perpendicular in 3D. No corner collapses into another.
- A and D have equal height; B and C have equal height. There is no slope
  across Y, ridge, twist, separate cap or beveled top.
- Slope along +X is 0.02/0.04=0.5; pitch is 26.5650511771 degrees.
- Actual top-face edge lengths are sqrt(0.04^2+0.02^2), approximately
  0.04472136 m uphill, and 0.04 m across Y. Its horizontal TOP projection is
  nevertheless 0.04 x 0.04 m; do not use the inclined length as footprint width.
- Face centre is (0, 0, 0.90). The front-edge midpoint (0, -0.02, 0.90) has
  the same height but is a different point. Labels must distinguish them.
- FRONT rises toward screen-right; BACK falls toward screen-right. RIGHT sees
  a 0.04 x 0.91 m rectangular silhouette from the high end, which occludes the
  lower top edge. A low-end LEFT view also has a full 0.91 m silhouette, but
  its visible front face ends at 0.89 m and the top continues behind it.
- An unobstructed oblique top detail must show all four corners. At an exactly
  edge-on camera the whole planar face collapses to a line, not a triangle.
  The TOP CUT DETAIL must use the same projection as the main THREE-QUARTER
  view. Derive it by a direct crop and uniform enlargement; do not independently
  redraw it or introduce a different camera.

Review correction - 2026-10-06: the v2 TOP CUT DETAIL does not clearly show
the fourth corner and is not geometry authority. The numeric polygon and plane
remain unchanged. The v3 inset was also rejected for a mismatched projection.
The v4 inset is a direct 3x enlargement of the main THREE-QUARTER top.
Use the explicit coordinates for reconstruction and the matched inset for review.
This clarification establishes document consistency, not mesh verification.

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

### End cuts and side-face angles

This is a sheared prism, not a rectangular cuboid rotated uphill. Construct
the XZ parallelogram first, then extrude along Y. Do not rotate a box and retain
cuts perpendicular to its longitudinal axis.

- Lower cut: X=0, Y=-0.02..0.02, Z=0..0.04.
- Upper cut: X=0.30, Y=-0.02..0.02, Z=0.15..0.19.
- End normals are (-1,0,0) and (1,0,0). Each cut is vertical and rectangular.
- Longitudinal edges follow (0.30,0,0.15); end edges follow (0,0,0.04).
  Their dot product is 0.006, not zero: the side face is not a rectangle.
- The XZ polygon's interior angles at A and C are 63.4349488229 degrees;
  angles at B and D are 116.5650511771 degrees. These are geometry angles,
  not target pixel angles in an oblique drawing.
- The sloped top and bottom measure approximately 0.3354101966 x 0.04 m.
  Their horizontal projections remain 0.30 x 0.04 m.
- All four vertical end edges are parallel to world Z. With an upright
  orthographic camera they remain vertical on screen. Longitudinal slope on
  screen depends on both geometry and camera and cannot alone prove correctness.
- A review view should clearly expose a vertical end cut, the sloped top and
  the parallelogram side. View annotations are not model geometry.

The numeric specification already defines these cuts correctly. The drawing
correction clarifies their relationship; it does not change run, rise, depth,
thickness, joining coordinates or material options.

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

After model authorization, confirm polygon bounds within 0.0005 m, end-face directions, slope, origins and closed faces. Colours and materials are replaceable defaults under the shared asset review rule; they are outside this geometry acceptance. These simple solids need no alternate authored LOD mesh. Models and export checks remain a later stage.

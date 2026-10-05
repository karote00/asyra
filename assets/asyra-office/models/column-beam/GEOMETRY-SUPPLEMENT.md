# Column and Beam - Geometry Supplement

## Coordinates and source authority

Use metres, +Z up, -Y front, +X right. Each object's origin is its bottom footprint centre, with identity rotation and unit scale. Dimensions and bounds below are authoritative. The drawings are not calibrated projections; do not infer measurements from pixel proportions.

Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. Left matches right geometrically. The three-quarter view is a volume illustration.

## Closed solid geometry

| Independent unit | Size XYZ | Minimum XYZ | Maximum XYZ |
| --- | --- | --- | --- |
| Square column | 0.27, 0.27, 2.50 | -0.135, -0.135, 0 | 0.135, 0.135, 2.50 |
| Horizontal beam | 2.00, 0.27, 0.27 | -1.00, -0.135, 0 | 1.00, 0.135, 0.27 |

Each is exactly one closed box: eight vertices, six quad faces, twelve triangles after triangulation. Choose either diagonal consistently on each planar face. All faces have outward normals; use flat face normals. No subdivision, bevel, taper, hollow cavity, end socket, foot, cap, decorative band, screws or separate hidden part.

The column's four elevations are identical narrow rectangles, and its top and bottom are identical squares. The beam's front, back, top and bottom are identical long rectangles, while its two ends are squares. Every face uses the same plaster material.

## Optional placement example

These coordinates explain compatible placement only. No placement logic or assembled model is delivered.

- Place columns at origins (-0.865, 0, 0) and (+0.865, 0, 0).
- Place a beam at (0, 0, 2.50), with its long axis along X.
- The beam ends align with the columns' outer X faces at -1.00 and +1.00.
- Each column touches the beam underside at Z=2.50, with no volume overlap.
- Clear distance between the column inner faces is 1.46. Combined top is Z=2.77.
- To span along Y instead, rotate the entire example by 90 degrees about Z.

The 0.27 cross-section follows the earlier full-wall thickness; the column height follows its 2.50 height. The example does not redefine floor-to-floor height or require beams on every wall. Future app layout owns stacking, counts, visibility, collisions and connections. No structural load calculation is implied.

## Future model acceptance

Verify bounds within 0.001 m, a closed volume, correct origin, outward normals, the documented solid material and no extra parts. Both primitives need only twelve triangles each. Reusing their geometry at distance is sufficient; no alternative LOD meshes are designed in this handoff.

The current work contains reference images and documents only. Geometry measurements and export validation must occur when models are created.

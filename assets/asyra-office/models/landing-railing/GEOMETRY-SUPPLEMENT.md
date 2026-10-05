# Landing Railing - Geometry Supplement

## Coordinates and authority

Use metres, +Z up, -Y front and +X right. Apply identity rotation and unit scale. Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. Left is geometrically identical to right.

Written bounds define exact geometry, including unseen faces. Drawings communicate appearance and are not calibrated projections.

## Independent units

| Part | Origin | Minimum XYZ | Maximum XYZ | Overall size XYZ |
| --- | --- | --- | --- | --- |
| Landing baluster | Bottom footprint centre | -0.02, -0.02, 0 | 0.02, 0.02, 0.90 | 0.04, 0.04, 0.90 |
| Level handrail | Midpoint of bottom edge at negative-X end | 0, -0.02, 0 | 0.30, 0.02, 0.04 | 0.30, 0.04, 0.04 |

Each part is one closed box, eight vertices and six planar quads, or twelve triangles. Use outward face winding and flat face normals. Either consistent diagonal on each planar quad is acceptable.

Both baluster top and bottom are horizontal square faces. All four elevations are identical rectangles. The handrail has two vertical square end faces; its top and bottom are horizontal. The four long-face projections are identical rectangles.

No bevel, subdivision, hollowing, caps, collars, finials, sockets, mounting plates, holes or fasteners. Every face uses the same charcoal material.

## Straight interior join example

- Rail A origin: (0,0,0.90).
- Rail B origin: (0.30,0,0.90).
- Interior baluster origin: (0.30,0,0).
- The two rails touch at X=0.30 and together cover the post's flat top at Z=0.90.
- Rail top is Z=0.94. Repeat a level run by translation (0.30,0,0).
- Rotate the entire arrangement about Z for another horizontal direction.

This is a placement reference only, not app implementation. Units stay independent. An interior post must not be duplicated merely because two rail ends share it.

## Relationship to the stair group

The flat-top post is 0.90 high everywhere; the stair post has a sloped top with heights 0.89..0.91. The level rail has no rise; the stair rail rises 0.15 over a 0.30 run. Do not replace one with the other or flatten an approved stair part.

A sloped-to-level transition needs a separately specified joint or transition post. This batch does not claim that the two existing post tops support that transition without gaps. Outer ends, corners and transition fittings are outside this batch.

## Future model acceptance

Confirm bounds within 0.0005 m, correct origins, closed geometry, outward normals, flat tops and the uniform material when models are authorized. Twelve triangles per unit are sufficient; no alternate LOD mesh is designed here. No physical building safety or model-export validation is claimed. App placement, counts, collisions and lighting remain future work.

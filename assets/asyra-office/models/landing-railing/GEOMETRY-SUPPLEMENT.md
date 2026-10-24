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

No bevel, subdivision, hollowing, caps, collars, finials, sockets, mounting plates, holes or fasteners. By default, every face uses the same charcoal material; colour and material remain replaceable as defined in the surface recipe.

## Straight interior join example

### Level handrail reconstruction details

The level handrail is a rectangular cuboid, not the sheared prism used for
stairs. Its eight vertices are all combinations of X in {0,0.30}, Y in
{-0.02,0.02} and Z in {0,0.04}, in metres.

- Both end cuts lie in constant-X planes and are perpendicular to the
  longitudinal +X direction. End faces measure 0.04 x 0.04 m.
- All adjacent faces meet at 90 degrees. Top Z=0.04 and bottom Z=0 are
  horizontal; rise is zero across the entire 0.30 m length.
- FRONT, BACK, TOP and BOTTOM project to 0.30 x 0.04 m rectangles;
  RIGHT and LEFT project to 0.04 x 0.04 m squares.
- The origin (0,0,0) is the midpoint of the lower edge of the X=0 end,
  not the end-face centre (0,0,0.02) or object centre (0.15,0,0.02).
- An oblique drawing can show the rail extending diagonally on screen even
  though it is level in world space. Do not infer a rise from that screen slope.
- Keep all six faces closed and retain sharp edges, with no added end cap,
  seam groove or bevel. Diagram outlines are not geometry.

### Interior placement

- Rail A origin: (0,0,0.90).
- Rail B origin: (0.30,0,0.90).
- Interior baluster origin: (0.30,0,0).
- The two rails touch at X=0.30 and together cover the post's flat top at Z=0.90.
- Rail top is Z=0.94. Repeat a level run by translation (0.30,0,0).
- The example post spans X=0.28..0.32 and Y=-0.02..0.02. Rail A covers
  X=0.28..0.30 of its top and Rail B covers X=0.30..0.32. Together they
  cover the full top without a volume overlap; the shared contact plane is
  Z=0.90. Do not apply this interior example as an unspecified outer-end detail.
- Rotate the entire arrangement about Z for another horizontal direction.

This is a placement reference only, not app implementation. Units stay independent. An interior post must not be duplicated merely because two rail ends share it.

## Relationship to the stair group

The flat-top post is 0.90 high everywhere; the stair post has a sloped top with heights 0.89..0.91. The level rail has no rise; the stair rail rises 0.15 over a 0.30 run. Do not replace one with the other or flatten an approved stair part.

A sloped-to-level transition needs a separately specified joint or transition post. This batch does not claim that the two existing post tops support that transition without gaps. Outer ends, corners and transition fittings are outside this batch.

## Future model acceptance

Confirm bounds within 0.0005 m, correct origins, closed geometry, outward normals and flat tops when models are authorized. Default appearance is specified separately and is replaceable; colour and material fidelity are outside the current geometry review. Twelve triangles per unit are sufficient; no alternate LOD mesh is designed here. No physical building safety or model-export validation is claimed. App placement, counts, collisions and lighting remain future work.

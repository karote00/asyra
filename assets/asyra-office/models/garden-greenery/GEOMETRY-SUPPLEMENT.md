# Geometry Supplement

## Coordinates and authority

Metres, +Z up, -Y front, +X right. Origins are at the root center on Z=0. The [numeric specification](garden-greenery-model-spec.json) fixes authored construction; illustrations are not calibrated or recoverable leaf-by-leaf projections.

## Low leafy shrub

One closed brown trunk cylinder: radius 0.007, from (0,0,0) to (0,0,0.390), 24 radial segments.

Each olive leaf is a closed ellipsoid with local X/Y/Z radii 0.025/0.006/0.070. Use 24 longitude segments and 12 latitude intervals, weld poles, and smooth curved normals. The long leaf direction is local +Z; no veins, serration, or displacement.

Place three radial tiers:
- 10 leaves: radius 0.110, center height 0.160, outward tilt 55 degrees, start angle 0 degrees.
- 12 leaves: radius 0.120, center height 0.240, outward tilt 45 degrees, start angle 15 degrees.
- 8 leaves: radius 0.060, center height 0.330, outward tilt 25 degrees, start angle 22.5 degrees.

For tier index i, angle a=start+360*i/count. Place the leaf center at (r*cos(a),r*sin(a),height). Rotate by Rz(a)*Ry(tilt), applying Ry first. Angles are degrees in the table and converted to radians for trigonometry.

Add one upright leaf centered at (0,0,0.390), identity rotation. Total: 31 leaves, maximum height 0.460.

For every tier leaf, add a closed radius-0.0025 branch cylinder from (0,0,max(0,leafCenterZ-0.060)) to that leaf's center, with 12 radial segments. The top leaf meets the trunk directly. Branches end inside leaf solids. Leaf overlaps are intentional; no boolean union or generated extra foliage. The expected width is approximately 0.35 m; the exact silhouette follows the coordinates and ellipsoid radii, not the prompt's approximate width.

This is one plant, not a repeated hedge section. No exposed root ball, soil, pot, blossoms or berries.

## Ornamental grass tuft

Exactly seven independent closed blade solids, sharing a root center. Each row in JSON supplies angle a, height h and outward reach d.

For t from 0 to 1:
- Centerline C(t)=(d*t*t*cos(a),d*t*t*sin(a),h*t).
- Full width w(t)=0.016*sin(pi*t)^0.7+0.004*(1-t).
- Full thickness b(t)=0.001*(1-t).
- Transverse T=(-sin(a),cos(a),0).
- Normal N=normalize(-h*cos(a),-h*sin(a),2*d*t).
- Cross-section corners are C plus/minus w*T/2 plus/minus b*N/2.

Sample t at 0,1/16,...,1. Join corresponding rectangle corners, close the root section, and weld the four coincident tip vertices at t=1 into one. Orient winding consistently outward. Smooth blade faces; no subdivision. At the root, Z remains zero; do not add a support disk to hide the overlapping roots.

The longest blade reaches 0.240. Blades fan in the specified seven directions; there are no extra small blades, stems, flowers, exposed roots, or holes. Thickness is real geometry, not two-sided transparent planes.

## Future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. Oblique views and overlap are illustrative; numeric part counts govern concealed elements.

Future review checks dimensions within 0.001, 31 shrub leaves, 30 branches plus trunk, seven grass blades, capped solids, welded tips, intentional intersections, ground origin, and absence of bundled scenery. Inspect top, back, underside and close leaf silhouettes. No model, wind animation, physics, exact reconstruction or performance validation has occurred.

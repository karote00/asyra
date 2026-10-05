# Geometry Supplement

## Coordinate and construction rules

Use metres, +Z up, -Y front, +X right. The origin is the center of each assembly's total XY bounding rectangle on the floor. The [numeric specification](washroom-fixtures-model-spec.json) contains all part dimensions and positions.

Ellipse rings use x = rx*cos(t), y = cy+ry*sin(t), with 96 samples and t = 2*pi*i/96. Join corresponding vertices between rings with linear interpolation in Z. Cap solid ends; subtract stated cavity volumes before closing the material shell. Smooth loft side normals, keep planar caps flat, and do not subdivide.

Rounded rectangle rings use full width/depth and circular plan corners with 12 segments per quarter. Start at the same corner in every ring and join corresponding vertices. All rings are centered in X and translated by cy in Y. Rounded boxes use an inward four-segment bevel on all edges, preserving their stated bounds. Other bevels likewise stay within the original bounds.

## Toilet - one assembly

Overall dimensions are 0.380 x 0.680 x 0.780. The body is the ellipse loft given in JSON; it narrows to a floor pedestal and expands to the bowl rim at Z=0.395. Subtract the cavity loft through the top; its bottom at Z=0.200 is closed. It is a simplified display interior with no trapway, drain bore, water, hoses, screws, or internal plumbing.

The seat is a separate elliptical annular extrusion at Z=0.398, height 0.014. The closed lid starts at Z=0.414, height 0.016. Both are centered at Y=-0.080. Keep the real seat opening and the bowl cavity even though the review drawings show the lid closed.

Two small hinge barrels run along X near Y=0.169. Their centers, radius, and length are defined in JSON; cylinder length is symmetric about each listed center. The seat and lid have separate +X pivot axes. The app may animate them later, but no animation is included. The 0.010-radius barrels geometrically meet both pieces; no extra mounts are required.

The rounded tank occupies the rear, from Y=0.180 to 0.340. The tank, its removable top cap, and the centered flush button are separate parts. The top button ends at Z=0.780. The tank is a closed solid display form; unseen mechanical internals are not required. Preserve the rear silhouette and flat floor contact.

## Pedestal washbasin - one assembly

Overall width/depth/height are 0.500/0.400/0.940. The basin rim is at Z=0.820 and its underside at Z=0.680. Build the exterior rounded rectangle loft and subtract the inner loft, extending the subtraction above the rim. The interior floor at Z=0.725 is closed. The rear deck is wider than the front rim to hold the faucet.

The pedestal is a closed elliptical loft, 0.160 x 0.140 at floor contact. It intersects the basin underside by 0.020 to prevent a seam gap. Keep pedestal and basin as separately addressable parts. No structural braces, wall mounting plate, underside pipes, or cabinet.

Place the gray drain disk on the inner floor. It is a shallow solid disk, not a dark hole. The faucet has a vertical cylindrical body, hollow forward spout with a downward outlet, a small stem, and a rounded top lever. Cylinder positions in JSON are bottom-center unless explicitly stated otherwise.

Sweep the spout's circular section along its polyline. Replace the right-angle corner with a tangent radius-0.010 arc sampled in 12 equal angles; use 32 samples around the tube. Close the annular outlet rim, leaving its inner bore open. The connected end is buried inside the faucet post. The lever is aligned forward along Y in the neutral state; generated view-to-view lever rotations are illustrative inconsistencies, not alternative parts.

## Authority and limits

Front looks along +Y, right along -X, back along -Y, top along -Z; top places +Y upward. Three-quarter looks from (+X,-Y,+Z). Some generated elevations are slightly raised. Never measure pixel distances as model dimensions.

Numeric lofts are deliberate simplified geometry, not a guarantee of pixel-identical reproduction of generated curves. The closed toilet sheet does not visually review the open state; hidden geometry is specified for later modeling and will require a separate model review before acceptance. Do not fill the opening simply because it is hidden here.

## Future acceptance

Check dimensions within 0.001 m, origin, closed material shells, empty basin and bowl, separate seat/lid/pivots, faucet outlet, underside and back. Compare visible silhouettes at the stated views and inspect hidden geometry in a later model review. These are future criteria, not completed Blender validation.

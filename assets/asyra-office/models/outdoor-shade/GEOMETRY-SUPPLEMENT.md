# Geometry Supplement

## Coordinates

Metres, +Z up, -Y front, +X right. Origins are centered on each component's bottom. All dimensions are authored. See the [numeric specification](outdoor-shade-model-spec.json).

## Open parasol

Create a regular octagon with perimeter vertices (0.900*cos(a),0.900*sin(a),1.750), where a=2*pi*i/8, i=0..7. Apex is (0,0,2.050). Connect the apex to each adjacent perimeter pair, making eight planar triangles.

Duplicate the whole upper surface 0.004 downward in Z for the underside, reverse its winding, and connect corresponding perimeter edges with quad faces. The resulting canopy is a closed shell, open beneath its interior volume, with vertical thickness 0.004. Do not replace the shell with a solid pyramid or horizontal bottom disk. Preserve eight flat panels with no alternating colors, sag, pleats, seam relief or scalloped edge.

The centered charcoal pole is radius 0.0175, Z=0 to 2.050, with 48 radial segments and flat closed ends. It intersects the canopy apex; no cap finial.

Eight closed cylindrical ribs, radius 0.005 and 16 radial segments, start at (0,0,2.044). Rib i ends at (0.895*cos(a),0.895*sin(a),1.7456666666666667), using the same angles as canopy corners. This endpoint is just within the canopy edge. The ribs intentionally intersect the thin canopy and pole. They are support geometry, not painted panel lines.

Keep canopy, pole and ribs individually addressable in one placeable assembly. No base, crank, hinge, slider, tilt joint, vent, fastening details or closing state. The drawing's underside inset is an explanatory view for the support arrangement, not a separate object.

## Separate base

Disk: radius 0.210, Z=0 to 0.055, 96 radial segments.
Socket: radius 0.035, Z=0.055 to 0.240, 64 radial segments.

Subtract one centered radius-0.0185 cylinder from both parts, Z=0.015 to 0.241, with 64 radial segments. The hole opens through the socket top and continues into the disk. The closed hole floor is at Z=0.015. Nominal socket wall thickness is 0.0165. Cap all material boundaries, not the open bore.

Use flat tops/bottoms and smooth cylindrical sides. No bevel, decorative ring, bolt, retaining knob, feet, wheels, handle or second sleeve. The socket and disk meet at Z=0.055; welding their shared material boundary is allowed without changing geometry.

## Assembly reference only

The parasol's radius-0.0175 pole fits the radius-0.0185 bore with 0.001 radial clearance. With the pole bottom seated at base Z=0.015, the combined canopy apex is Z=2.065. This describes a possible transform only; do not bundle the two units, change their origins, or implement placement behavior.

No real-world structural or wind-load claim is made; these are miniature scene assets.

## Future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. The octagon is invariant under 90-degree rotations. Numeric geometry governs hidden ribs and bore depth.

Future model review checks dimensions within 0.001, eight canopy panels/eight ribs, closed shell topology, pole clearance, actual hollow socket and closed floor, flat ground contact, and no baked lighting. Inspect underside and bore close views. No model, fit simulation, animation or performance validation has occurred.

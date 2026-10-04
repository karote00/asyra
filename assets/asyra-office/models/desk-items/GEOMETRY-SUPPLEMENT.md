# Desk Items - Geometry Supplement

## Common contract

Metres; +Z up, -Y front. JSON sizes are X/Y/Z unless explicitly described as lid-local width/thickness/height. Local origins are at ground level, centred on the laptop base footprint or mug vessel axis. Round/bevel edges inward without expanding stated bounds. Preserve material regions and clockwise view conventions independently of generated sheet perspective.

## Laptop base and keyboard

Base bounds: X +/-0.15, Y +/-0.105, Z=0..0.012. Make a rounded rectangle in XY with corner radius 0.006, extrude, then bevel top/bottom edges inward 0.001 with three segments. Bottom is flat silver, no feet, ports, seams or hidden electronics. One dark hinge cylinder lies along X at (0,0.09,0.015), radius 0.003, length 0.25. It contacts the base and the bottom of the lid; its entire back is authored completion.

Keyboard: five standard rows at Y=0.063, 0.042, 0.021, 0 and -0.021. Each row has fourteen keys, X=-0.117+0.018*i for i=0..13. Each key is 0.015 x 0.014 x 0.001, centre Z=0.0125; corner radius 0.002 in XY and edge bevel 0.0002 with two segments. The sixth row at Y=-0.042 has six small keys at the X positions in JSON plus one centred 0.126-wide spacebar. Total 77 keycaps, six rows, no key legends. This simplified keyboard is normative even if the generated sheet suggests staggered or differently sized keys. No input behavior is implemented.

Trackpad is a rounded rectangular material region on the base top, centre (0,-0.078,0.012), width 0.126, depth 0.039, corner radius 0.003. Split the top surface instead of adding a coplanar floating plane. No outline groove is required.

## Lid and display

Lid pivot P=(0,0.09,0.018). Local width basis X=(1,0,0), up basis U=(0,sin(20deg),cos(20deg)), front basis N=(0,-cos(20deg),sin(20deg)). A local point (w,v,n) maps to P+w*X+v*U+n*N. The opening angle between the base's forward direction and U is 110 degrees. Lid bounds w=+/-0.15, v=0..0.19, n=+/-0.003. Corner radius 0.004 in its width/up plane; depth-edge bevel 0.0005 with three segments.

At n=+0.003 assign the silver surface's central rounded 0.294 x 0.184 region to black bezel (centre v=0.095, radius 0.003). The inner display is 0.276 wide by 0.157 high, centre v=0.0935, corner radius 0.001, on this same front surface. Display bounds are w=+/-0.138 and v=0.015..0.172. Split material regions into non-overlapping faces; do not stack coplanar surfaces. A single dark camera dot radius 0.001 is centred at (w=0,v=0.181), also a material region, without a recess.

Display UV is u=(w+0.138)/0.276, vUV=(v-0.015)/0.157. Viewed from front, (0,0) is bottom left and (1,1) top right. The display is a separately addressable material/surface region for future app content; no dynamic texture or screen logic is built here. Preview material is plain dark and non-emissive.

Rear emblem is a white flat colour mask at n=-0.003, centred w=0,v=0.10, in a 0.018 x 0.024 rectangle. JSON supplies two closed SVG paths and their viewBox; map SVG X left-to-right when looking at the rear, so positive SVG X maps to negative local w. SVG Y points down; map it to decreasing local v. Paths define a simplified apple silhouette, leaf and bite, not exact trademark vector data. No embossing, light or text.

Open-unit conservative bounds are X +/-0.15, Y=-0.105..0.1578026, Z=0..0.1975677 (unrounded formula values in JSON are authoritative). Do not confuse these open extents with the base depth. Front view faces -Y; true right profile is from +X; back from +Y; top from +Z. No closed-lid variant is specified.

## Hollow mug

The body is a surface of revolution around Z, with 128 circumferential segments. JSON defines an ordered closed profile in (radius,height): flat bottom, rounded outer heel, tapered outer wall, semicircular lip, tapered inner wall, rounded floor corner, flat inner floor and centre closure. For each profile arc, r=centreR+radius*cos(theta), z=centreZ+radius*sin(theta), sampling both endpoints with the indicated segment count. Join adjacent endpoints once. Connect the radius-zero endpoints to the axis without degenerate duplicate rings.

Outer diameter at the lip is 0.084 m; total height 0.090 m. Lip rounding radius is 0.0025; the opening narrows to radius 0.037 at Z=0.0875. Interior floor is Z=0.008, so the mug has real bottom thickness. The exterior heel reaches radius 0.034 at Z=0.003 and transitions to a flat ground contact disc radius 0.031 at Z=0. No separate foot ring or underside stamp. Smooth circumferential normals; preserve the declared profile and real empty cavity. The interior has the same cream material, never a black hole texture.

One handle lies in the X/Z plane on +X. Sweep a tube radius 0.005 over C(t)=(0.038+0.034*cos(t),0,0.049+0.028*sin(t)), t from +90 to -90 degrees, using 48 path segments and 16 tube segments. Cross-section basis is +Y and the unit in-plane normal to the tangent. Cap the tube ends, union it into the vessel, then subtract the vessel's defined interior cavity from the combined solid to remove any inward handle intrusion. No floating seam, separate ring or black opening plane. The opening is genuine empty space.

Handle centreline ends are (0.038,0,0.077) and (0.038,0,0.021). The furthest handle point is X=0.077, giving total width 0.119 from the body's left edge -0.042. Overall depth 0.084 and height 0.090. Front -Y shows the handle on the right; back +Y shows it on the left; right +X sees it edge-on; top +Z shows it to the right of the mouth.

## Future verification

Modeling has not been run. Later inspect all five views plus undersides, verify dimensions within 0.0005 m, origins, 110-degree lid angle, one display surface with correct UVs, 77 keys, one connected mug handle, one open cavity with real floor/wall thickness and absence of scene objects or baked lighting. Generated perspective and approximate key layouts are appearance references, not dimensional measurements.

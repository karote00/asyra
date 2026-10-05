# Small Plants - Geometry Supplement

## Coordinates and assembly

Metres, +Z up, -Y front; pot bottom centre is the origin. Plant azimuth is measured from +X toward +Y. Front view sees negative X on the left. Pot, soil, plant stems/leaves and cactus branches remain separate named parts inside one placeable unit. Concealed overlap at roots or branch attachments is intentional. Do not add outside roots or separate saucers.

## Pots and soil

Revolve each JSON closed radius/height profile about Z with 96 circumference segments. Connect profile vertices with straight segments and close the profile from last to first. Weld axis vertices. Apply inward edge bevel 0.0008 with three segments, preserving nominal bounds. Smooth circular normals. The flared lip is part of this section, not a loose ring.

The leafy pot has top diameter 0.14, height 0.12 and bottom diameter 0.094 at ground. The cactus pot has top diameter 0.13, height 0.11 and ground diameter 0.084. Interiors are real cavities with solid bottoms, not dark discs simulating holes. Both pot undersides are flat, closed and unmarked; no drain hole or glazed label.

Soil is an independent opaque cylinder at the radius and Z interval in JSON, with a flat top below the pot rim. Root stems overlap its upper face. The narrow clearance to the inner pot wall is intentional and should remain below 0.001 m. Do not add gravel, mounds, cracks or individual grains.

## Six-leaf plant

Central stem is a capped tapered Z-axis cylinder, Z=0.10..0.29, radii 0.0035 and 0.002, 24 radial segments. Each of the six leaves has a separate petiole from (0,0,attachZ) to (0.009*cos(a),0.009*sin(a),attachZ+0.005), radius 0.0015, 16 radial segments, capped and intersecting the stem and leaf base.

For each instance define er=(cos(a),sin(a),0), et=(-sin(a),cos(a),0). For t=0..1, radial coordinate R(t)=0.009+(tipRadius-0.009)*t; height H(t)=attachZ+0.005+(tipZ-attachZ-0.005)*t+0.008*sin(pi*t). Centreline C(t)=R(t)*er+H(t)*(0,0,1). Half-width W(t)=width/2*sin(pi*t)^0.85.

For q=-1..1, the leaf surface is C(t)+q*W(t)*et+0.003*(1-abs(q))*sin(pi*t)*(0,0,1). Make top and bottom surfaces offset by +/-0.0003 in Z, then close their boundary edges. Use 24 intervals along t and eight across q. Weld coincident width-zero vertices at each tip on each face and cap the thickness there. No disconnected cards or black backs. The central fold is actual geometry, not a painted vein.

JSON fixes three opposite pairs at attachment heights 0.16, 0.20 and 0.255. Rotations, tip radii, heights and widths are individual values. Exactly six leaves; occlusion may hide one in a sheet view. Approximate crown span is 0.26 and top height 0.32 (thin surfaces and the gentle arch may add less than 0.001). The concrete arrangement is an authored simplified completion, not a claim the original plant had six leaves.

## Cactus trunk and branches

Main trunk starts at Z=0.095, partly buried in soil. Its radial function is R(phi)=0.024+0.002*cos(8*phi); use 96 circumferential segments. Continue vertically to Z=0.274 and close the bottom. The top cap follows X=R(phi)*cos(v)*cos(phi), Y=R(phi)*cos(v)*sin(phi), Z=0.274+0.026*sin(v), v=0..pi/2, with 16 latitude intervals; weld the apex. This makes eight subtle ribs and one rounded tip, total height 0.30.

Each branch follows its four-point cubic Bezier B(t)=(1-t)^3*P0+3*(1-t)^2*t*P1+3*(1-t)*t^2*P2+t^3*P3. Use 32 path intervals and 48 circumference segments. Cross-section frame uses fixed +Y and the unit perpendicular to the tangent in X/Z. Radius is r+ribAmplitude*cos(8*phi). End-cap radial profile is multiplied by cos(v), while tangent displacement is r*sin(v), v=0..pi/2. Close and weld cap tips. Union the branch roots into the trunk or keep concealed intersections; do not leave floating seams.

Left branch is at negative X, ending near (-0.05,0,0.20); right is positive X, ending near (0.055,0,0.23). Handedness must not flip between views. One trunk and two branches only. No sharp spine geometry, flowers or fruit.

Areoles are flat cream capsule masks on the eight rib crests, at the listed main Z heights and branch curve fractions. Capsule length 0.003 along the local tangent and width 0.0015 around the surface. Round caps, no extrusion; omit masks hidden inside a branch intersection. Do not add areoles to the rounded cap tips. These are symbolic cactus markings, not a botanical spine system.

## Future validation

After modeling is authorized separately, compare front -Y, right +X, back +Y, top +Z and oblique (1,-1,0.8), plus pot undersides and empty pot cavities with soil hidden. Check pot bounds, ground contact, six leaves, two cactus branches, component names, flat soil and no baked lighting. Nominal dimension tolerance 0.001 m. No such model checks have been run in this drawing-only batch.

# Outdoor Accents - Geometry Supplement

## Shared conventions

Metres, +Z up, -Y front, X/Y/Z size order. Unit origin is at ground level near footprint centre. Apply bevels inward; do not expand bounds. Use smooth normals on curves and flat faces on slats. Hidden structural intersections are deliberate connected joins, not extra parts. Camera directions: front -Y, right +X, back +Y, top +Z, oblique (1,-1,0.8).

## Park bench

Four seat slats each measure 1.10 x 0.10 x 0.035, at X=0, Z=0.3425, Y=-0.165,-0.055,0.055,0.165. Bevel all edges 0.006 with three segments. Seat top Z=0.36; slat gaps are 0.010. The final drawing has four seat slats, overriding the initial prompt's three-slat proposal.

Three back slats measure width 1.14, depth normal to back 0.03, local height 0.09. Centres Z=0.45,0.55,0.65 and Y=0.18+(Z-0.31)*tan(7deg)-0.025, X=0. Local up is (0,sin(7deg),cos(7deg)); front normal is (0,-cos(7deg),sin(7deg)). Bevel 0.005 with three segments. No extra head rail or bolts.

Front legs are Z-axis cylinders at X=+/-0.575,Y=-0.18, Z=0..0.46, radius 0.0225. Rear posts follow the piecewise path (Y,Z)=(0.18,0),(0.18,0.31),(0.230350,0.72) at the same X positions, radius 0.0225. Use a continuous mitered join at the rear bend and close caps; cut all ground contacts flat at Z=0. Use 48 circumference segments. Slight rear inclination supports the back slats; no freestanding extra rear legs.

Under-seat rails are boxes size 0.065 x 0.43 x 0.025 at (+/-0.575,0,0.3125), bevel 0.003 with three segments. Their top meets the slat undersides at 0.325. For each rounded arm, use the cubic Y/Z control points in JSON at constant X=+/-0.575, radius 0.0225, 32 path intervals and 24 radial segments. Evaluate B(t)=(1-t)^3*P0+3*(1-t)^2*t*P1+3*(1-t)*t^2*P2+t^3*P3. Cross-section basis uses +X and the in-plane unit normal to tangent. Weld/union its start into the front leg and end into the rear post. It is a smooth capped rail, not ornamental ironwork.

Nominal overall envelope is 1.20 x 0.49 x 0.73, allowing the rounded rear post cap. Preserve exact part sizes rather than scaling to perspective pixels. Seat wood is separate from its dark frame. No underside ornaments or unseen crossbars beyond the stated rails.

## A-frame coordinates

Front origin P=(0,-0.17,0), rear P=(0,+0.17,0). Width W=(1,0,0). Front up U=(0,sin14,cos14), front outward N=(0,-cos14,sin14). Rear up U=(0,-sin14,cos14), rear outward N=(0,cos14,sin14). Angles are degrees. Transform local point (w,u,n) to P+w*W+u*U+n*N. This defines both leaning frames with four feet, not two independent signs.

Each frame has two side posts, local centres w=+/-0.1825,u=0.35,n=0, size 0.035 in width, 0.70 along up and 0.024 in normal. Rails have local centres (0,0.155,0) and (0,0.665,0), size 0.33 x 0.035 x 0.024 in width/up/normal. Bevel exposed wood edges inward 0.002 with three segments. Clip all geometry below global Z=0 so four feet lie flat.

Each dark panel has width 0.33, local height 0.475, thickness 0.008, centre (0,0.41,0.004). The outward face is n=0.008, slightly behind the wooden frame's outward n=0.012. Panel edges meet rails and side posts without holes. Rear panel is charcoal on all visible faces and has no lettering. No backing texture, easel handle or wheels.

Two short X-axis cylindrical hinges sit at (+/-0.1825,0,0.679207), radius 0.008, length 0.03, 32 segments. The leaning frame tops meet here; concealed intersections may be unioned. Two wooden side spreaders are the boxes specified in JSON at X=+/-0.203, Z=0.30, extending along Y. They are static bars for this fixed open pose. No moving joints, screws or folding animation are inferred.

Nominal sign dimensions are approximate display dimensions; the spreaders extend to X=+/-0.208, making exact maximum width 0.416. Geometry values take priority over the 0.40 m prompt estimate. Depth is about 0.37 and height about 0.69 including hinge caps. Ground origin does not change when the sign is moved by the app.

## Flat chalk lettering

Front wording is exactly Good / Ideas / Live / Here, one word per line, plus a right-pointing arrow below. JSON supplies every glyph as an SVG stroke path, so no external font is needed. Glyph cell width 50, tracking 8, stroke width 3, round caps/joins, no fill. SVG Y points down. For N letters, total advance T=50*N+8*(N-1), character i offset i*58. Use scale 0.00075 m per glyph unit: w=(offset+glyphX-T/2)*scale and u=lineTop-glyphY*scale. Line tops are 0.585,0.485,0.385,0.285. Draw on front plane n=0.008, centred per line.

Arrow is a flat stroke from (w,u)=(-0.07,0.19) to (0.07,0.19), with head through (0.045,0.21),(0.07,0.19),(0.045,0.17). Width 0.0025, round caps. Vector paths are deterministic authored handwriting, not recovered exact chalk contours. Do not extrude text, add a chalk dust shadow or print on the rear.

## Future checks

No models were built. Future checks: four seat/three back slats, four bench legs, two rounded arms, sign's four feet and two boards, correct outward normals, flat ground contacts, complete wording and right arrow, fixed open pose and no baked lighting. Check exact numeric parts within 0.002 m, treating stated envelopes as approximate rather than scale targets. Inspect five views plus undersides after modeling is separately authorized.

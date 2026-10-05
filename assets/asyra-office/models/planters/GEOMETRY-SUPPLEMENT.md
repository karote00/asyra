# Planters - Geometry Supplement

## Coordinates and components

Metres, +Z up, -Y front. Tree origin is the pot bottom centre. Wall planter origin is the centre of the bowl's bottom rear edge; Y=0 is its wall plane and vines extend below Z=0. Pot, soil and plant components stay distinguishable within one unit. Hidden overlaps at roots and branch junctions are intentional. No external root, saucer, wall or ceiling hardware.

## Small tree

Revolve the closed pot profile in JSON about Z with 96 radial segments, straight profile interpolation and inward edge bevel 0.001 with three segments. Weld axis vertices and close the bottom. This is a hollow tapered pot with a thick flared lip and flat unmarked underside. The numeric profile resolves its inner wall and floor completely. Soil is a separate cylinder radius 0.106, Z=0.163..0.205, with a flat brown top below the lip.

Trunk follows the four-point cubic in JSON. Evaluate B(t)=(1-t)^3*P0+3*(1-t)^2*t*P1+3*(1-t)*t^2*P2+t^3*P3 for t=0..1. Use 32 path intervals and 24 radial segments; interpolate radius from 0.015 to 0.009. Cross-section frame uses +Y projected perpendicular to the tangent, and the cross product of tangent with that projected axis. Close caps. The trunk starts in the soil and forks into the three straight tapered branch tubes with explicit start/end points. Branch radius tapers from 0.008 to 0.003. Keep connected intersections; no sphere canopy.

JSON enumerates thirty leaf ellipsoids in three clusters. Each leaf centre, major direction, half axes and material is explicit. Normalize the major direction M. Project +Y perpendicular to M and normalize to get minor axis U; use V=M cross U. Leaf surface is centre+0.055*cos(v)*cos(u)*M+0.023*cos(v)*sin(u)*U+0.0015*sin(v)*V, u=0..2*pi, v=-pi/2..pi/2. Use 24 longitude and 12 latitude intervals, weld seam and poles, smooth normals. The leaves are individual flattened meshes, not opacity cards or solid crown balls.

A capped petiole tube radius 0.0012 connects each cluster centre to its leaf's inner tip (leaf centre minus 0.055*M). No randomness or unspecified leaf scattering. Explicit instances are the geometry authority; the drawing's leaf overlap is illustrative. Crown span is approximately 0.40 m; height is about 0.71 m from the supplied instances. Do not stretch the tree to an image-derived bounding box.

## Flat-backed wall bowl

The bowl is a hollow quarter ellipsoid, open at the top and flat at the rear. Outer surface: X=0.10*sin(v)*cos(t), Y=-0.11*sin(v)*sin(t), Z=0.16-0.16*cos(v), with t=0..pi, v=0..pi/2. Inner surface: X=0.092*sin(v)*cos(t), Y=-0.008-0.094*sin(v)*sin(t), Z=0.16-0.152*cos(v), same angle ranges. Use 64 t intervals and 32 v intervals, welding each v=0 pole. The outer bottom is (0,0,0) and cavity bottom is (0,-0.008,0.008); this forms a rounded bowl floor rather than a flat tapered planter.

Join inner and outer boundaries at the top to make the rim. Close the rear with a planar outer face at Y=0 and cavity back at Y=-0.008, joined around their corresponding outlines. Keep the top open. Bevel exposed edges inward by 0.001 with three segments. Nothing projects behind Y=0. Inner and outer surfaces define actual material thickness and cavity geometry.

The keyhole is a blind recess cut from the rear to Y=-0.003. Union a circle radius 0.006 centred at X=0/Z=0.127 and a slot X=-0.0025..0.0025, Z=0.127..0.145. Use 48 circle segments. Its floor is dark material and sides ceramic, with no screw or bracket included. The 0.008 rear wall leaves 0.005 thickness behind the recess, so it does not puncture the pot cavity.

Soil is a D-shaped prism: half-ellipse X=0.086*cos(t), Y=-0.009-0.086*sin(t), closed at Y=-0.009, Z=0.125..0.143. Its upper face is flat. It overlaps the inner wall slightly near its lower edge only; trim that concealed lower portion to the exact cavity boundary when assembling, retaining the full top outline. Do not create a dark fake cavity or fill the entire bowl to its rim.

## Three trailing vines

JSON contains two joined cubic curves per vine. The first rises over the rim before descending outside the bowl; the second trails downward. Evaluate the same cubic formula as the tree, 24 intervals per segment, tube radius 0.0015 and 12 radial segments. Use a parallel-transport frame seeded with +X projected perpendicular to the first tangent; carry it along the curve without random twists. Weld joined endpoints and close terminal caps.

Five leaves attach to the second curve of each vine at t=0.12,0.30,0.48,0.66,0.84. For index i=0..4, side is -1 for even i and +1 for odd; invert it for the middle vine. Normalize D=(side*0.65,0,-1). Let E=(D.z,0,-D.x), a perpendicular unit vector in X/Z. For s=0..1 and q=-1..1, leaf position is attachment+0.043*s*D+q*0.013*sin(pi*s)*E-0.002*(1-abs(q))*sin(pi*s)*(0,1,0). Add top/bottom offsets +/-0.0004 along Y, close boundary, weld width-zero tips. Use 16 length and eight width intervals. Each leaf joins its vine at the base, without extra unspecified stems.

This fixes fifteen trailing leaves and three vine lengths. Six additional rim leaves attach to the first curve of each vine at t=0.25 and 0.55. Use the same leaf patch formula with length 0.035, half-width 0.012, and direction normalize(side,0,0.35), side=-1 then +1. For these rising leaves use E=(D.z,0,-D.x) as before. Thus the assembly has twenty-one leaves total; the left vine is longest, middle intermediate, right shortest. Nominal assembly envelope 0.25 x 0.15 x 0.44 m includes the over-rim stem arch and downward leaves; it is a conservative display envelope, not a filled box. Nothing may extend behind the rear mounting plane. The exact curve/leaf positions override approximate prompt heights and sheet overlaps.

## Future validation

Modeling is not performed. After separate authorization, compare front -Y, right +X, back +Y, top +Z, oblique (1,-1,0.8), undersides and empty pot cavities. Check pot dimensions within 0.001 m, flat tree ground contact, thirty tree leaves, three vines, fifteen trailing and six rim leaves, blind keyhole and flush mounting plane. Check no scene geometry or baked illumination. A numeric handoff does not establish model verification.

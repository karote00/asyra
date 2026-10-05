# Wall Accents - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front. Rear mounting plane is Y=0. Origin is bottom centre on that plane. Parts project toward -Y. JSON dimensions are X/Y/Z. Bevels remain inside nominal bounds. Use right-side view from +X, front from -Y, back from +Y, top from +Z and an oblique camera from (1,-1,-0.2) relative to the fixture centre when inspecting the shade underside. Camera choice is presentation only.

## Sconce plate and curved arm

Plate radius 0.05, centre X=0/Z=0.14, Y=-0.012..0. Use 96 radial segments and inward 0.001 edge bevel, three segments. Rear stays flat at Y=0. A centred brass-coloured disc radius 0.008 on that rear face is a material mask, not a protruding screw. There is no wall, bolt, bracket or cable.

The tube arm radius is 0.005. Its first centreline is the cubic Bezier in JSON from (0,-0.010,0.15) to (0,-0.04,0.185), evaluated with 24 intervals. Evaluate a cubic as (1-t)^3*P0+3*(1-t)^2*t*P1+3*(1-t)*t^2*P2+t^3*P3. It then follows the upper semicircle Y=-0.10+0.06*cos(t), Z=0.185+0.06*sin(t), X=0, t=0..pi, with 48 intervals. Finish with a straight downward segment to Z=0.145 at Y=-0.16. Weld path endpoints. Tube sections use +X and the unit normal in the Y/Z path plane, with 16 segments. Close end caps inside the connected plate and neck. Static overlaps may be unioned while preserving visible shape.

The semicircle reaches Z=0.245 on its centreline; the tube brings total height to 0.250. Arm endpoints meet adjacent parts; do not add exposed collars or electrical fittings not in JSON. The brass neck is a Z-axis cylinder radius 0.022 at (0,-0.16), Z=0.115..0.150, with 0.002 inward edge bevel and three segments.

## Shade and bulb

Revolve the closed radius/Z polygon in JSON about the vertical axis through (0,-0.16) with 128 circumferential segments. Connect consecutive profile vertices with straight segments, close last to first, and use smooth normals. The outer and inner profile sides form an actual hollow bell with a thin wall and open bottom. Outer rim radius is 0.070 at Z=0.020; its inner radius there is 0.066. The upper neck opening joins the brass part. No opaque disc closes the bottom; never simulate the opening with a dark texture.

Bulb is a cream sphere radius 0.0275, centre (0,-0.16,0.0275), with 64 longitudes and 32 latitude intervals. The stem cylinder radius 0.012 connects Z=0.045..0.120. Union or overlap the sphere/stem at their concealed join. The bulb reaches Z=0 and is partly visible below the shade. Its material is opaque and non-emissive; do not add a lamp cone, emissive mesh, glow card, lens or actual light source.

Overall bounds: X +/-0.07, Y=-0.23..0, Z=0..0.25. Plate back is flush with the attachment plane. Exact shade/arm profile is an authored completion of the small source fixture; sheet dimension arrows do not override these bounds.

## Frame and backing

Outer rectangle spans X +/-0.17, Z=0..0.46. Ring border width 0.018 gives opening X +/-0.152, Z=0.018..0.442. Extrude along Y=-0.022..0. Use four mitred rails with no gaps; apply an inward 0.001 bevel with three segments. Do not add a second frame, mat, glass or raised ornament.

Back panel is a 0.31 x 0.004 x 0.43 box centred at (0,-0.002,0.23). Its edges overlap the rear frame's inner edges by 0.003 and are concealed, creating a closed back. Support panel size 0.304 x 0.0115 x 0.424, centre (0,-0.00975,0.23), joins backing at Y=-0.004 and paper at -0.0155. Paper thickness 0.0005, front Y=-0.016, inset 0.006 behind the frame front. There is no hole, easel leg or projecting mounting hook. Top, bottom, left and right profiles share this construction.

## Lettering

Preserve exactly three lines: A / Brighter / Day. JSON contains the eleven required glyph outlines as open SVG stroke paths; no installed font, external glyph file or model is needed. Stroke width is 3 glyph units with round caps and joins, no fill. Glyph cell width is 50 units and inter-glyph tracking 8. For each line of N characters, total advance T=50*N+8*(N-1). Character i has offset i*58. Map each glyph point to X=(offset+glyphX-T/2)*scale, Z=topZ-glyphY*scale, using line-specific scale/topZ from JSON. Apply as a dark flat mask on the paper front. SVG Q and C have their standard quadratic/cubic meaning. The dot of i is a short stroke with round caps.

Letter contours are a deterministic handwritten-style completion, not an exact recovery of the original handwriting or generated print. The supplied wording, line order, alignment and flat ink treatment are fixed. A later modeling tool can rasterize this vector mask without inventing letter shapes. Paper front UV is u=(X+0.152)/0.304, v=(Z-0.018)/0.424, bottom-left origin viewed from -Y. No lettering is present on the rear.

## Future checks

No models have been produced. Future comparison must cover the five views, shade underside, plain print back, declared bounds within 0.001 m, one curved fixture, open shade, visible unlit bulb, one thin frame, exact three-line wording and zero baked illumination. The app owns placement and future lighting; no electrical safety or hardware installation specification is implied.

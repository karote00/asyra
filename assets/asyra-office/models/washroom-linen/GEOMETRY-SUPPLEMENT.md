# Geometry Supplement

## Coordinates and authority

Use metres, +Z up, -Y front, +X right. These are authored measurements, not recovered source-image facts. The [JSON specification](washroom-linen-model-spec.json) provides all dimensions. Do not infer measurements from sheet pixels.

## Hand towel - one cloth unit

The origin is the center of the virtual horizontal support axis. Width is 0.240 along X, from -0.120 to +0.120. Unfolded mid-surface length is exactly 0.500. Cloth thickness is 0.002.

Build a closed U-shaped cross-section in YZ and extrude across X:
- Front midline: Y=-0.011, Z from -0.230 to 0.
- Upper fold: Y=0.011*cos(t), Z=0.011*sin(t), t=0 to pi; 48 equal angular segments.
- Rear midline: Y=+0.011, Z from 0 down to -(0.500-0.230-pi*0.011), approximately -0.235442481.
- Offset the midline by 0.001 on either side. The arc inner and outer radii are 0.010 and 0.012.
- Close each hem with a flat 0.002-thick end, and cap both X ends. Straight panels stay straight with flat parallel edges.
- Smooth the upper arc; keep the panels planar. No subdivision, wrinkles, fringe, extra folded hem geometry, or bevel.

Overall bounds are X +/-0.120, Y +/-0.012, Z=-0.235442481 to +0.012. The rear hem extends about 0.005442481 below the front. This is one continuous cloth shell, not two separate towels.

The opening has radius 0.010 and fits a virtual rod of that radius. There is no rod in this asset. To place it on the existing rail, align its origin with the rail axis, for example local (0,-0.070,0) in the rail's coordinate frame. This transform is guidance only; placement belongs to the app.

The seam is pigment only, defined on unfolded cloth coordinates in the surface recipe. The cloth's hidden inner faces use the same base color. Drawing crease lines identify the curved bridge, not darkened shadow strips.

## Paper roll - one roll

Origin is the cylinder-axis center; axis is X. Width is 0.100, X=-0.050 to +0.050. Outer radius 0.055, giving total diameter 0.110.

Use two separate closed annular cylinders:
- Ivory paper: radial interval 0.019 to 0.055.
- Brown cardboard core: radial interval 0.017 to 0.019.
- Both run the full width, sharing the radius-0.019 interface without a gap.
- Use 96 equal angular segments, starting on +Y. Cross-section points use Y=r*cos(t), Z=r*sin(t).
- Close annular end faces, but leave the central diameter-0.034 bore open through the full width.
- Smooth curved cylinder surfaces and keep annular ends flat. No bevel or subdivision.

No attached spindle, holder, loose paper tail, perforations, spiral layers, embossing, or contents. This is a simplified intact roll, not an unrolling mechanism. To rest it on a floor, its origin would be 0.055 above that floor; the app owns placement.

## Views and future acceptance

FRONT looks along +Y; RIGHT along -X; BACK along -Y; TOP along -Z with +Y upward. The roll's circular opening is seen in RIGHT and oblique views, not FRONT. The towel's two layers and upper bridge are clearest in RIGHT.

Future model review must check dimensions within 0.0002, towel thickness and inner clearance, continuous capped cloth shell, rear hem length, and the roll's genuinely open bore. Check top, side, back and hidden surfaces. No model validation has occurred here. Generated views may be illustrative rather than exact orthographic projections; numeric geometry resolves ambiguity.

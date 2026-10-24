# Throw Pillow - Construction Specification

Status: construction documents approved by the user for commit. The original multiview drawing is retained. No production model, Blender export, visual match or runtime performance is certified.

## Source and unit

Use the [original five-view drawing](review/03-throw-pillow-v1.png), [numeric specification](textiles-model-spec.json) and [shared size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09). The authored dimensions and cubic control points define reconstruction; the image illustrates the intended cushion silhouette. Do not recover different dimensions from image panels with different display scales.

One unit is one closed cushion, independent of any sofa. Front and back are inflated surfaces sharing a single seam perimeter; they are not two overlapping closed pillows. Preserve the four slightly inset sides and fuller rounded corners. This is not a rounded cuboid or a cylinder. No zipper, button, extra base, raised piping, recess, wrinkle or asymmetric sag is added.

## Dimensions and landmarks

Coordinates use metres, +Z up, -Y front. The origin is (0,0,0), below the volume centre on its lowest support plane. The table uses millimetres. The pillow is upright for review; the app later chooses placement and rotation.

| Landmark                        | Default                               |
| ------------------------------- | ------------------------------------- |
| Overall X x Y x Z               | 320 x 110 x 320                       |
| Volume centre                   | (0, 0, 160)                           |
| Bounds X / Y / Z                | -160..160 / -55..55 / 0..320          |
| Front / back centre             | (0, -55, 160) / (0, 55, 160)          |
| Top seam midpoint               | (0, 0, 311)                           |
| Bottom seam midpoint            | (0, 0, 9)                             |
| Right / left seam midpoint      | (151, 0, 160) / (-151, 0, 160)        |
| Top-right corner-curve midpoint | (155.875, 0, 315.875)                 |
| Seam material strip along Y     | -0.75..0.75, full projected width 1.5 |

The four long-side midpoints are inset by 9 mm from their corresponding maximum bounding planes. The two bottom seam points (-142,0,0) and (142,0,0) touch the support plane; there is no flat bottom plate. Upper extrema occur at (+/-142,0,320), and right-side extrema at (160,0,18) and (160,0,302), with mirrored left points. Rounded corner midpoints are not the X/Z extrema. Thickness reaches 110 mm at the front/back centres and reduces to zero between the two patches at the shared seam, without an open edge.

## Exact outline and inflated surfaces

The JSON owns eight cubic segments in X/Z coordinates relative to (0,0,0.16). In stored order they are top side, top-right corner, right side, bottom-right corner, bottom side, bottom-left corner, left side and top-left corner. Preserve every control point and the clockwise order in the X/Z plane. For each segment:

```text
B(t) = (1-t)^3*P0 + 3*(1-t)^2*t*P1 + 3*(1-t)*t^2*P2 + t^3*P3
0 <= t <= 1
```

Adjacent segments share their endpoints. The original controls guarantee positional closure, not identical derivatives at every side-to-corner join. Do not claim exact C1 continuity, add a ridge, or move control points to enforce tangency. Smooth shading does not change the specified silhouette.

A numerically stable version of the existing radial patch uses a from 0 to pi/2:

```text
r = sin(a)
X = sin(a)*Bx(t)
Y = sign*0.055*cos(a)
Z = 0.16 + sin(a)*Bz(t)
sign = -1 for front, +1 for back
```

This is the same continuous shape as Y=sign*0.055*sqrt(1-r*r). At a=0 use one pole vertex per side. At a=pi/2 use exactly Y=0 and one shared seam ring, rather than two near-coincident rings caused by floating-point cosine. Weld curve endpoints and the closing outline edge. Do not cap each hemisphere separately.

At interior parameters the tangents are Pa=(cos(a)*Bx,-sign*0.055*sin(a),cos(a)*Bz) and Pt=(sin(a)*Bx',0,sin(a)*Bz'). Their cross product gives a normal after choosing outward orientation. At poles use (0,sign,0). At the seam the front and back limits agree. For the specified smooth-shaded mesh, normalize the sum of incident outward triangle area normals at each welded vertex, including side-to-corner joins; material or UV splits must share that shading normal. Preserve bounds without a subdivision modifier. After scaling, use inverse-transpose normal transformation and normalize again.

## Appearance, seam and mapping

| Region | Default material | Default sRGB | Default weave |
| ------ | ---------------- | ------------ | ------------- |
| body   | mustard          | #D4AC57      | Yes           |
| seam   | mustard-seam     | #C49D4E      | No            |

Defaults have roughness 0.95, metallic 0, alpha 1, transmission 0, emission 0 and no clearcoat. Body and seam remain independently replaceable. Select region material, then whole-pillow material, then preset; apply explicit region colour, then whole-pillow colour. If no colour override exists, retain the selected material's own colour. A material replacement owns its surface recipe and must not mutate another instance.

The seam is a material mask per surface sample where abs(Y)<=0.00075 in default local coordinates. Equality belongs to seam. All other samples use body. The strip follows the single shared perimeter at mid-thickness, including the hidden back; it creates no raised cord, recess or second surface. Its 1.5 mm width is measured along Y, not as a fixed surface geodesic width. On the analytic patch it begins at r=sqrt(1-(0.00075/0.055)^2), approximately 0.9999070205. It is narrow in a front projection and more visible from the side. Do not widen it to match the dark pixels in a rendered reference.

Use the [default weave recipe](SURFACE-RECIPES.md) on the body only. For repeat coordinates, use final resized local metres before world placement. Select a projection from the final local unit normal: if abs(Ny)>=abs(Nx) and abs(Ny)>=abs(Nz), use (X,Z); otherwise if abs(Nx)>=abs(Nz), use (Y,Z); otherwise use (X,Y). This fixes exact ties. The default 2 mm cell and 0.12 mm line remain physical-size details. Projection transitions are part of this simple recipe, not physical weave topology. No source-image shading, baked lighting, bump or displacement is introduced.

## Whole-unit resizing

Omitted dimensions retain defaults. For finite positive target extents (Wx,Dy,Hz), use S=(Wx/0.32,Dy/0.11,Hz/0.32) once about the bottom origin. Reject zero, negative and nonfinite extents. Scale the centre, poles, seam and all control-derived points together; do not scale the offset centre twice. The support plane stays Z=0. Nonuniform scaling intentionally changes corner and fullness proportions without changing connectivity.

Evaluate seam membership in inverse-scaled default coordinates, so the projected seam width becomes 1.5*Sy mm. Evaluate weave after resizing as specified above. Neither appearance replacement nor sizing adds draping, collision fitting, animation, attachment logic or cloth simulation.

## LoD construction and error

The old uniform sampling of 24 intervals on each of eight curves and 32 radial intervals would produce 24192 triangles. It is replaced by the following sampling of the same continuous surface. Long sides and short corner arcs use separate interval counts; every tier retains all segment endpoints and midpoints.

| Tier | Side intervals | Corner intervals | Radial intervals K | Triangles | Ceiling | Max surface error (mm) |
| ---- | -------------- | ---------------- | ------------------ | --------- | ------- | ---------------------- |
| lod0 | 16             | 4                | 20                 | 6240      | 6400    | 0.915                  |
| lod1 | 8              | 4                | 12                 | 2208      | 2300    | 3.104                  |
| lod2 | 6              | 2                | 8                  | 960       | 1000    | 6.128                  |

For a curve with n intervals, sample t=j/n for j=0..n-1; the next curve owns the shared endpoint. Let N be the total outline samples, equal to four times the sum of side and corner interval counts. Use a=pi*j/(2*K) for j=1..K-1 on each side and a shared ring at j=K. Collapse j=0 to one pole per side. Connect each pole by N triangles; split each annular quad into two consistently outward-wound triangles. The two sides share the seam. Total triangles are 2*N*(2*K-1)=N*(4*K-2); vertices are 2+N*(2*K-1).

For the stored clockwise outline, a front pole fan triangle is (pole, next ring vertex, current ring vertex). A front annular quad uses (inner-current, inner-next, outer-next) and (inner-current, outer-next, outer-current). Reverse all triangle winding on the back. Wrap next indices around each ring.

Within each cubic parameter cell, use a consistent diagonal; no cell crosses a curve join. A conservative same-parameter surface-to-triangle error bound is computed per curve:

```text
Q = max length(Pi)
M1 = 3 * max length(P(i+1)-Pi)
M2 = 6 * max length(P(i+2)-2*P(i+1)+Pi)
dt = 1/n
da = pi/(2*K)
E = M2*dt^2/8 + max(Q,0.055)*da^2/8 + M1*dt*da/4
```

Take the maximum E across the eight curves. Cubic derivative bounds control interpolation in t; the elliptical radial section controls interpolation in a; the last term bounds the difference between bilinear interpolation and the chosen triangles. The bound also covers the collapsed pole fan. Rounded-up values are in the table. These are conservative geometric bounds, not screen-space or image-match scores. All tiers preserve the exact bounding extrema; the 1 mm dimensional tolerance is separate from coarse-tier surface approximation. After scaling, multiply E by max(Sx,Sy,Sz).

The default sampling is lod0. LoD1/2 are for smaller screen-space sizes; the app owns switching thresholds and must check silhouette changes in actual rendering. Counts assume per-sample seam masking without additional mesh cuts. If a renderer requires seam-specific faces, split and recount that representation. No renderer support or frame-rate guarantee is implied.

## Review evidence and implementation boundary

Run the permanent [throw-pillow construction checks](review/__tests__/test_throw_pillow_spec.py) with the existing rug checks. They inspect the original reference checksum, outline closure and landmarks, closed outward topology, all three bounds, three-axis reflection symmetry, triangle counts, conservative error bounds, seam classification, resized ground contact, defaults and document tables. Test geometry is held in memory only.

After separately authorized modeling, compare front, right, back, top and oblique views, followed by closeups of side insets, corner transitions and the seam. Verify no added bottom plate, no duplicated shell, symmetric front/back fullness and no raised seam. Confirm normal continuity, material isolation and texture scale in the actual renderer. Passing numeric checks does not establish those future visual or runtime results.

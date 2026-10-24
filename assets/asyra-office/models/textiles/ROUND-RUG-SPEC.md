# Round Rug - Construction Specification

Status: construction documents approved by the user for commit. The original drawing is retained. No production model, Blender export, app rendering or runtime performance has been verified.

## Source and scope

Use the [original five-view drawing](review/02-round-rug-v1.png), [numeric specification](textiles-model-spec.json) and [shared size and appearance rules](../README.md#overall-size-and-appearance---2026-10-09). Dimensions, hidden backing and exact binding widths are authored construction definitions, not calibrated image measurements. The approved default is circular; the ellipse in the oblique view is projection, not a different outline. Front and right views describe the same rotationally symmetric thin profile. Their illustrated thickness is not a replacement for the 8 mm specification.

One placeable unit is one closed textile body. Binding is a material region on that surface, not an additional rim or raised cord. No floor, second base, underlay, fringes, pile geometry, concentric ridges or cloth deformation is included. This simple shape can be generated procedurally; Blender is optional for future implementation. The existing rectangular rug and throw pillow remain separate assets.

## Default dimensions

Use metres for construction, +Z up, -Y front. The origin is (0,0,0), at the footprint centre on the bottom plane. The following table uses millimetres.

| Quantity                                     | Default                      |
| -------------------------------------------- | ---------------------------- |
| Overall X x Y x Z                            | 1200 x 1200 x 8              |
| Bounds X / Y / Z                             | -600..600 / -600..600 / 0..8 |
| Maximum radius R                             | 600                          |
| Top and bottom circular edge radius b        | 1                            |
| Vertical side                                | Z=1..7, height 6             |
| Flat cap radius / diameter                   | 599 / 1198                   |
| Inner binding boundary radius / diameter     | 575 / 1150                   |
| Nominal binding width from maximum perimeter | 25                           |
| Flat binding width                           | 24 mm on both caps           |

The 25 mm nominal binding comprises 24 mm on the flat cap plus the rounded edge's 1 mm radial extent. It does not add height. The top is flat at Z=8 mm and the bottom at Z=0. Both caps have the same outline; their default materials differ.

## Exact rotational construction

Let R=0.6, H=0.008 and b=0.001. For u from 0 to pi/2:

- Bottom rounded edge: rho=R-b+b*sin(u), Z=b-b*cos(u).
- Top rounded edge: rho=R-b+b*cos(u), Z=H-b+b*sin(u).
- The vertical side has rho=R, Z from b to H-b.
- Close the flat caps at Z=0 and Z=H with radius R-b.

Revolve each profile point through theta from 0 to 2*pi: (X,Y,Z)=(rho*cos(theta),rho*sin(theta),Z). The maximum diameter and thickness remain exactly 1.20 m and 8 mm; the roundover is inward. Do not use a full torus for the edge, inflate the centre, or overlap separately capped cylinders.

With nXY=(cos(theta),sin(theta)), outward analytic normals are (sin(u)*nXY,-cos(u)) on the lower rounded edge, (cos(u)*nXY,sin(u)) on the upper edge, (nXY,0) on the vertical side and +/-Z on the caps. Preserve tangent continuity at shared boundaries. Use inverse-transpose normal transformation followed by normalization after nonuniform scaling.

## Default appearance and replaceable regions

| Region           | Default material | Default sRGB | Default weave |
| ---------------- | ---------------- | ------------ | ------------- |
| top-body         | lavender         | #858393      | Yes           |
| top-binding      | lavender-binding | #706D7E      | No            |
| sides-and-bevels | lavender-binding | #706D7E      | No            |
| bottom-body      | backing          | #B8AD96      | Yes           |
| bottom-binding   | lavender-binding | #706D7E      | No            |

All five regions are independently selectable for material and colour replacement. Defaults retain roughness 0.95, metallic 0, alpha 1, transmission 0, emission 0 and no clearcoat. The [surface recipe](SURFACE-RECIPES.md) supplies the intrinsic default weave without displacement, normal maps or baked lighting. These colours are defaults, not geometric acceptance conditions.

Follow the shared override rule: select the region's material override, otherwise the whole-rug material override, otherwise the region's preset. Then apply a region colour override, otherwise a whole-rug colour override. With no colour override, retain the selected material's own colour; do not tint a replacement material with the old preset colour automatically. A material replacement owns its surface recipe. Overrides do not modify geometry or other instances through shared mutable state.

### Binding mask and surface ownership

On either flat cap, calculate r=sqrt(X*X+Y*Y) in default local coordinates. Classify r<0.575 as body and r>=0.575 as binding. Exact boundary points belong to binding. All side and rounded-edge patches use binding, including their shared cap boundaries. There is one continuous annulus on each cap, with no extra ring geometry or darker intermediate band.

Evaluate the mask per surface sample, not by assigning whole spanning triangles or interpolating vertex colours. The top and bottom body regions use their respective default materials. A region boundary creates neither a seam ridge nor a second coplanar face. Do not infer a circular weave path or spiral from the rug's circular outline.

## Overall sizing and texture mapping

Omitted target dimensions retain their defaults. For finite positive target extents (Xsize,Ysize,Zsize), compute S=(Xsize/1.2,Ysize/1.2,Zsize/0.008). Reject zero, negative and nonfinite values. Apply this scale once to the entire unit about the bottom origin. World placement and rotation follow local sizing. No individual band or cap receives a second scale.

Different X and Y scales intentionally produce an ellipse. Both cap outline and inner binding boundary follow the same transform; at the cardinal directions nominal binding widths become 25*Sx and 25*Sy mm. The band is not a constant-width offset of the final ellipse at arbitrary angles. Edge radii and thickness scale with the same whole-unit transform; do not rebuild circular details after scaling. Z=0 stays on the support plane.

Recover default-space XY by inverse scaling to evaluate the binding mask. Evaluate the default weave in final resized local XY metres before world placement, retaining its physical 2 mm repeat and 0.12 mm line width. Thus the mask follows the shape while the repeating weave does not stretch with it. Appearance changes do not alter dimensions. No terrain fitting, bending or draping is implied.

## LoD sampling and limits

Use N equally spaced circumferential vertices at theta=2*pi*j/N for j=0..N-1. Do not duplicate the 2*pi endpoint. Every tier uses N divisible by four and starts at +X, so all four XY extrema are present. Each rounded edge uses m equal angular intervals over u=0..pi/2, yielding 2m+2 rings in total. Connect consecutive rings with two outward-wound triangles per quad and wrap the final circumferential edge.

Close each convex planar cap with N-2 triangles and no additional vertex. Reverse the bottom winding. Weld shared ring/cap vertices; normals and region labels may have renderer-specific vertex splits without adding triangles. Do not apply subdivision or displacement that changes the defined surface.

Triangle count is 2*N*(2*m+1)+2*(N-2)=4*N*(m+1)-4. A conservative default-scale surface error bound is R*(1-cos(pi/N)) + b*(1-cos(pi/(4*m))). Rounded-up bounds are listed below; they describe surface faceting, independently of the 0.5 mm overall-size tolerance.

| Tier | N   | m   | Triangles | Ceiling | Max surface error (mm) |
| ---- | --- | --- | --------- | ------- | ---------------------- |
| lod0 | 192 | 3   | 3068      | 3100    | 0.115                  |
| lod1 | 96  | 2   | 1148      | 1200    | 0.398                  |
| lod2 | 48  | 1   | 380       | 400     | 1.578                  |

LoD0 preserves the previously specified 192 circumferential segments and three edge segments. All tiers retain one closed component, the same bounds and cap heights, and the same surface mask. After resizing, multiply surface error bounds by max(Sx,Sy,Sz). The app owns screen-space switching thresholds; these counts do not certify rendering performance.

Counts assume per-sample region masking. A renderer that requires explicit mesh cuts at the binding boundary must triangulate those cuts and recount its representation; it must not apply these counts to added faces or colour an entire triangle across the boundary. No renderer capability has been assumed verified here.

## Verification and later visual acceptance

Run the permanent [round-rug checks](review/__tests__/test_round_rug_spec.py). They verify default dimensions and source preservation, cap and band relations, closed outward topology, positive volume, exact bounds, all LoD counts and error budgets, two nonuniform-size cases, appearance defaults, document tables and links. The helper constructs geometry only in memory; it exports no model and does not replace production tests.

For separately authorized future modeling, inspect top, bottom, front, right and oblique views before perimeter and edge closeups. Check a circular default silhouette, single flat backing, unraised annular binding, 8 mm height, 1 mm inward edge radius and no duplicate base. After nonuniform sizing, inspect the intentionally elliptical silhouette and unchanged ground contact. Test appearance isolation and texture scale in the actual renderer. These visual and runtime checks remain pending; passing the document checks does not certify a produced asset.

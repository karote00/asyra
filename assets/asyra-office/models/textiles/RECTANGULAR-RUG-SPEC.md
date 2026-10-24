# Rectangular Rug - Construction Specification

Status: construction documents approved by the user for commit. The original drawing is retained. No production model, Blender export, app rendering or performance verification is included.

## Authority and scope

Use the [original multiview drawing](review/01-rectangular-rug-v1.png) for the approved design, [JSON specification](textiles-model-spec.json) for numeric inputs and this document for construction. Dimensions and hidden construction are authored definitions, not measurements recovered from image pixels. Front and right strips may exaggerate thickness for readability; they do not change the 8 mm total height. This revision covers only the rectangular rug.

One unit is one closed textile body. No ground tile, underlay, pile geometry, raised binding, piping or tassels are included. The body, underside and binding are regions of this same surface. Simple procedural construction is sufficient; Blender is optional for a future implementation.

## Default dimensions

Coordinates are metres, +Z up, -Y front. Origin is the footprint centre on the bottom plane. Table values are millimetres.

| Quantity                                   | Default                      |
| ------------------------------------------ | ---------------------------- |
| Overall X x Y x Z                          | 1400 x 950 x 8               |
| Bounds X / Y / Z                           | -700..700 / -475..475 / 0..8 |
| Plan corner radius R                       | 25                           |
| Top and bottom edge radius b               | 1                            |
| Vertical side height                       | 6, from Z=1 to Z=7           |
| Flat top and bottom footprint              | 1398 x 948, corner radius 24 |
| Nominal binding inset from maximum outline | 12                           |
| Inner binding boundary                     | 1376 x 926, corner radius 13 |
| Visible flat binding width                 | 11 mm, on both caps          |

The remaining 1 mm of the nominal inset belongs to the rounded edge. The band is not an extra layer; the total height remains 8 mm everywhere at the flat top. All XY corner centres are (+/-675,+/-450) mm, including the inner binding contour.

## Exact edge construction

Let W=1.4, D=0.95, H=0.008, R=0.025 and b=0.001. Every horizontal contour uses corner centres (+/-(W/2-R),+/-(D/2-R)). At contour radius rho its size is (W-2R+2rho, D-2R+2rho). Join quarter arcs with tangent straight edges. Do not independently scale each contour, because that would move its corner centres.

For u from 0 to pi/2:

- Bottom rounded edge: Z=b-b*cos(u), rho=R-b+b*sin(u).
- Top rounded edge: Z=H-b+b*sin(u), rho=R-b+b*cos(u).
- Join the two full-radius contours at Z=b and Z=H-b with vertical sides.
- Close the lower and upper flat caps at Z=0 and Z=H, each with radius R-b.

This inward circular profile preserves all six bounding planes. The flat caps are horizontal, including the underside; do not add a domed centre or a second bottom plate. At a contour point let n be its outward XY unit normal. Analytic surface normals are (sin(u)*n,-cos(u)) on the bottom edge, (cos(u)*n,sin(u)) on the top edge, (n,0) on the vertical side and +/-Z on the caps. Transform normals with the inverse transpose after nonuniform scaling.

## Default appearance and replacement

These are defaults, not fixed geometry. Each region supports independent material and colour replacement.

| Region           | Default material | Default sRGB | Default weave |
| ---------------- | ---------------- | ------------ | ------------- |
| top-body         | sage             | #758074      | Yes           |
| top-binding      | sage-binding     | #606B5B      | No            |
| sides-and-bevels | sage-binding     | #606B5B      | No            |
| bottom-body      | backing          | #B8AD96      | Yes           |
| bottom-binding   | sage-binding     | #606B5B      | No            |

All default materials have roughness 0.95, metallic 0, alpha 1, transmission 0, emission 0 and no clearcoat. See [surface recipes](SURFACE-RECIPES.md). No image lighting, annotation, outline or background is baked into any material.

Resolve material and colour independently: region override, then whole-rug override, then region default. Apply the resolved colour as the selected material's base-colour tint. Replacing a material also replaces its surface recipe; the default weave applies only when the selected material retains that recipe. Instance overrides must not mutate another rug or the shared preset.

### Binding classification

Evaluate the binding mask per surface sample on each flat cap, not per whole triangle or by interpolating vertex colours. In default-space metres, let Wi=1.376, Di=0.926 and Ri=0.013:

```text
q = (abs(X) - (Wi/2 - Ri), abs(Y) - (Di/2 - Ri))
d = length(max(q, 0)) + min(max(q.x, q.y), 0) - Ri
body: d < 0
binding: d >= 0
```

The boundary belongs to binding. All sides and rounded-edge patches use binding regardless of this mask. Cap-edge ownership therefore agrees on both sides of each shared boundary. The mask is a surface classification, not displaced geometry or a second coplanar mesh.

## Whole-unit size changes

For finite positive requested dimensions (Wx,Dy,Hz), use S=(Wx/1.4,Dy/0.95,Hz/0.008) and apply it once about the origin after constructing default geometry. Reject zero, negative or nonfinite sizes. Do not additionally resize individual regions. Ground contact remains at Z=0. This contract supports three-axis scaling only, not cloth deformation or terrain fitting.

Use inverse-scaled coordinates for the binding mask so it follows the resized body. The default 12 mm inset scales along X and Y; it is not a fixed physical-width border at every size. Nonuniform scale produces elliptical corner arcs and scaled edge profiles. Evaluate the default weave in final resized local XY metres so its 2 mm repeat stays physical, then apply world placement. Material assignment does not alter bounds.

## LoD construction and bounds

Sample each quarter arc with n equal angular intervals, including both tangent endpoints. There are N=4(n+1) vertices per contour. In counterclockwise order use corner centres (+cx,+cy),(-cx,+cy),(-cx,-cy),(+cx,-cy) and angles 0..90,90..180,180..270,270..360 degrees. Straight segments connect consecutive arc endpoints, including the closing edge.

Sample each rounded edge with m equal u intervals. Keep 2m+2 distinct contour rings; connect consecutive rings with two outward-wound triangles per quad. Triangulate each convex flat cap with N-2 triangles without adding vertices. Weld all adjacent patch and cap boundaries. Analytic normals preserve tangent continuity; do not add subdivision that changes the bounds.

Total triangles: 2N(2m+1)+2(N-2)=4N(m+1)-4. The conservative surface error bound is R*(1-cos(pi/(4n))) + b*(1-cos(pi/(4m))). Table errors are rounded upward and apply to default geometry, independently of the 0.5 mm overall-size tolerance.

| Tier | n   | m   | Triangles | Ceiling | Max surface error (mm) |
| ---- | --- | --- | --------- | ------- | ---------------------- |
| lod0 | 12  | 3   | 828       | 850     | 0.088                  |
| lod1 | 8   | 2   | 428       | 450     | 0.197                  |
| lod2 | 4   | 1   | 156       | 180     | 0.774                  |

All tiers keep the exact bounding planes, one closed component, flat cap heights and the same binding mask. After scaling, multiply the error bound by max(Sx,Sy,Sz). The app owns screen-space switching thresholds; no distance or frame-rate guarantee is made here.

These counts assume surface-sample material masking without geometry splits. If a future renderer requires separate triangles for material regions, split the cap at the exact binding boundary and recount that representation. Do not assign an entire spanning triangle to one colour or claim these counts for additional cut geometry. UV/normal vertex splits alone do not change triangle counts.

## Review and verification

The permanent [construction checks](review/__tests__/test_rectangular_rug_spec.py) create only an in-memory analytic mesh. They check closed edge pairing, outward faces, Euler characteristic, positive volume, exact bounds, LoD counts and error limits, flat-cap/binding relations, scaling, document links and preserved source inputs. They do not establish Blender output quality, renderer support, visual likeness or runtime performance.

After separately authorized implementation, inspect the original top, bottom, front, right and oblique directions, then close up the four corners and the top/bottom binding. Verify 8 mm height at default scale, a single closed body, flat backing, no added seam ridge and no baked lighting. Geometric review and appearance customization are separate checks. User visual approval remains required for the produced asset.

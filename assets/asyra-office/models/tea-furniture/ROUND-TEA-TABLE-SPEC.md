# Round Tea Table - Construction Review

Status: revised documents approved by the user for commit. No Blender model, app render or
runtime performance is verified. The original tabletop, palette, reference
images and tea-chair inputs remain unchanged.

## Sources and scope

- [Original five-view reference](review/01-round-tea-table-v1.png).
- [Numeric specification](tea-furniture-model-spec.json), `modules[moduleId=round-tea-table]`.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md), [surface recipe](SURFACE-RECIPES.md)
  and [whole-unit sizing](../README.md).

One placeable table contains nine logical parts: one round top, four apron rails
and four splayed legs. Union the four rails into one closed hollow frame; the
top and four legs remain closed components with concealed assembly overlaps.
This yields six closed components and nine independently replaceable regions.
There is no central slab, fifth leg, upper mounting plate, screw or scene prop.

The source shows a compact round table and splayed wooden supports. The exact
four-leg arrangement and hidden apron are authored completions, not recovered
measurements. Front/right/back sheets use elevated views; apparent short rear
legs are occlusion, not different lengths. TOP shows the circular top alone.
Do not merge this taller tea table with the low lounge coffee table asset.

## Coordinates and dimensions

Metres in JSON; millimetres in tables. +Z up, -Y front, +X right. Ground origin
is (0,0,0), centred below the tabletop. Overall physical size stays
**680 x 680 x 580 mm**, with X/Y=-340..340 mm and Z=0..580 mm.

Tabletop radius 340 mm, Z=545..580 mm, thickness 35 mm. Its two inward circular
roundovers have radius 6 mm. Flat top/bottom radii are 334 mm. Between the rim
arcs, the vertical side is at radius 340 mm, Z=551..574 mm. No raised rim,
separate inset disk, hole or sloped centre face.

| Rail group       | Full XYZ size mm | Centres XYZ mm                | Roundover mm |
| ---------------- | ---------------- | ----------------------------- | ------------ |
| apron-front-back | 390, 25, 70      | (0,-182.5,520), (0,182.5,520) | 2            |
| apron-sides      | 25, 350, 70      | (-182.5,0,520), (182.5,0,520) | 2            |

Each rail is a true rounded box: inset its full box by 2 mm on every face, then
Minkowski-sum with a radius 2 mm sphere. All rail bottoms stay at Z=485 mm;
tops now reach 555 mm, embedding 10 mm into the tabletop. Side rails extend to
Y=+-175 mm instead of 170 mm, overlapping the front/back rails by 5 mm at each
corner. Rail height changes from 60 to 70 mm by extending upward only. These
changes repair flush-only joints without changing the visible table envelope.

| Leg index | Signs sx,sy | Bottom centre XYZ mm | Top centre XYZ mm |
| --------- | ----------- | -------------------- | ----------------- |
| 0         | -1,-1       | -220,-220,0          | -160,-160,555     |
| 1         | -1,1        | -220,220,0           | -160,160,555      |
| 2         | 1,-1        | 220,-220,0           | 160,-160,555      |
| 3         | 1,1         | 220,220,0            | 160,160,555       |

All legs have nominal bottom/top radii 17/22 mm, inward end-rim radius 2 mm and
height 555 mm. Top endpoints formerly stopped at 545 mm; the new height embeds
10 mm into the tabletop while retaining all XY endpoints and ground contacts.
The centreline moves 60 mm inward on each horizontal axis, leaning approximately
**8.692523 degrees** from vertical. The taper slope and centreline lean are
separate quantities. JSON endpoint arrays, in sign-pair order, own placement.

## Tabletop and tangent leg profiles

The top uses the same analytic rounded-cylinder construction as the
[coffee table](../furniture/COFFEE-TABLE-SPEC.md#tabletop-surface), with R=.34,
H=.035, b=.006 and base Z=.545 m. In canonical (rho,z), the bottom rim centre is
(R-b,b), with angle -pi/2..0; the upper is (R-b,H-b), angle 0..pi/2. Join their
side endpoints at rho=R and cap the flat discs. Translate Z after construction.

Do not tilt a completed cone to create a leg: that tilts its cap. Use the
[existing tangent profile and shear recipe](../furniture/COFFEE-TABLE-SPEC.md#tapered-leg-surface-and-flat-caps)
with these tea-table parameters:

```text
H=.555; r0=.017; r1=.022; b=.002
k=(r1-r0)/H; q=sqrt(1+k*k); alpha=-atan(k)
lower centre = (r0+k*b-b*q, b)
upper centre = (r1-k*b-b*q, H-b)
rho=rc+b*cos(theta); z=zc+b*sin(theta)
lower arc: theta=-pi/2..alpha
upper arc: theta=alpha..pi/2
straight side: rho=r0+k*z
```

Cap at z=0/H with radii equal to the corresponding fillet-centre radii.
The final flat cap diameters are **30.035874/39.963802 mm**, rather than the
nominal unrounded 34/44 mm widths. The arcs meet the taper tangentially;
ordinary quarter-circle fillets would not. For endpoint centres B and T:

```text
Cxy(z)=Bxy+(Txy-Bxy)*z/H
p=(Cxy.x+rho*cos(phi), Cxy.y+rho*sin(phi), z)
```

Every ring and both caps stay horizontal. The fillet is circular before shear;
it is not necessarily a radius 2 mm arc in every world-space section afterward.
Use transformed surface normals, with vertical cap normals. All four flat
bottom discs touch Z=0. The complete profile remains under the tabletop even
using the conservative bound `sqrt(.22²+.22²)+.022 < .334` m.

## Apron union and concealed assembly

The rounded rails must be united geometrically. Define each ideal rail solid by
its rounded-box signed field; the union interior is where the minimum of the
four fields is <=0. Its boundary is the exposed zero set. Perform an exact
solid union of the approximating rail meshes, including coplanar-face handling,
then validate it against that ideal union. Simply grouping four meshes leaves
duplicate exposed surfaces at the overlapped bottom/corners.

Keep one connected, closed frame with a central through-hole; do not use a
convex hull or fill the opening. The centred 340 x340 mm XY square is free of
frame material at its interior; rounding opens its boundary slightly. The hole
passes through the frame's full height, although the separately placed tabletop
covers it from above. No crossbar or central plate is added.

Retain per-rail surface ownership through the union. Exterior fragments keep
their source region. For coincident surviving fragments choose the first owner
in this order: front rail, back rail, left rail, right rail, matching the JSON
`apronUnionOrder`. Remove other coincident fragments; do not offset them. A CSG
intersection edge shares vertices and is not a new decorative seam or region.
Keep analytic smooth roundover normals and flat-face normals, with appropriate
splits at actual creases. Render attribute splits may duplicate vertices while
geometric adjacency remains welded. Do not duplicate an exposed face for UVs.

The tabletop, unioned frame and four legs are six closed components. Their
positive-volume overlaps are intentional and hidden; no coplanar exposed faces,
open caps or depth offsets are permitted. Do not trim the leg tops back to 545 mm
or lower the apron top to eliminate the newly defined embedment. This describes
virtual attachment, not a physical load-bearing certification.

## Twenty attachment witnesses

Use these points to verify interior overlap, not to add geometry. For leg i,
sx/sy are its sign pair and Cxy(z) is its centreline above.

| Joined parts                              | Witness XYZ (m)                     | Count |
| ----------------------------------------- | ----------------------------------- | ----- |
| each rail / top                           | (rail centre X, rail centre Y, .55) | 4     |
| each leg / top                            | (Cxy(.55), .55)                     | 4     |
| each leg / neighboring front or back rail | (Cx(.52), sy*.179, .52)             | 4     |
| each leg / neighboring side rail          | (sx*.179, Cy(.52), .52)             | 4     |
| adjacent rails at each corner             | (sx*.1825, sy*.1725, .52)           | 4     |

Each rail-corner witness has more than 2.4 mm interior margin in both rounded
rails. Rail/top and leg/top witnesses retain more than 4 mm margin; both
leg/rail witness types retain more than 5 mm. For legs, transform to canonical
coordinates and conservatively divide interior margins by the shear norm
`sigma=(sqrt(4+s*s)+s)/2`, where `s=length(Txy-Bxy)/H`.

Actual tier meshes must still contain the witnesses strictly inside each joined
solid. Distance error alone does not establish containment or manifoldness.
Require convex inscribed source primitive meshes before apron union; the union
itself is hollow and must not be convexified. Preserve all witness tests after
union and any refinement. No extra patch or shading may conceal a failed joint.

## Whole-unit sizes and appearance

Assemble the default unit, then apply requested/default X/Y/Z extents once about
(0,0,0). Omitted axes use defaults; reject nonfinite, zero or negative extents.
All endpoints, radii, fillets, joints and region boundaries share this transform.
Nonuniform scaling may make circles elliptical and change apparent splay; do
not independently refit legs or recreate constant-radius edges. Proportional
locks reject incompatible targets. Normal transformation follows final geometry.
Appearance is resolved after this sizing, per the shared asset contract.

| Region                   | Default   | sRGB    | Roughness |
| ------------------------ | --------- | ------- | --------- |
| tabletop                 | oak       | #D5B587 | .80       |
| tabletop secondary grain | oak-grain | #BD986B | .80       |
| each rail and each leg   | dark-wood | #584333 | .82       |

All defaults: metallic 0, alpha 1, transmission 0, emission 0, no clearcoat. Secondary
grain is a material parameter, not a mesh region. Preserve the existing tabletop
grain formula in the [surface recipe](SURFACE-RECIPES.md), evaluated in final
resized local X/Y metres across the top, rim and underside. Dark wood is uniform.
The illustrative sheet's lighter-looking supports do not silently change the
existing numeric default; colour/material replacement remains available.

There are nine independently replaceable regions: top; front/back rail indices
0/1; side rail indices 0/1; leg indices 0..3. Resolve material and colour
independently from indexed component, otherwise group, otherwise whole table,
otherwise preset. Apply resolved colour to material base colour, keeping other
properties and other instances unchanged. Replacements own secondary colours,
grain and UV/triplanar mapping; plain-colour materials may omit grain. No baked
reference lines, highlights, shadows, AO or background. Lighting and placement
remain app responsibilities.

## LOD recipe and validation targets

| Tier | Top radial | Leg radial | Rim segments | Rail corner segments | Pre-union triangles | Triangle ceiling | Top error mm | Leg error mm | Rail error mm |
| ---- | ---------- | ---------- | ------------ | -------------------- | ------------------- | ---------------- | ------------ | ------------ | ------------- |
| LOD0 | 128        | 48         | 4            | 3                    | 7024                | 9000             | .3           | .15          | .3            |
| LOD1 | 64         | 32         | 3            | 2                    | 3440                | 5000             | .7           | .35          | .5            |
| LOD2 | 32         | 16         | 2            | 1                    | 1328                | 2500             | 2.5          | .8           | 1             |

Sample azimuth uniformly from +X, retaining all cardinal tabletop supports.
Use m equal angular intervals on each rim arc, including the exact tangent
endpoints. Rail corner topology follows the
[normalized barycentric grid](../furniture/WRITING-DESK-SPEC.md#view-interpretation-and-lod)
with matching atan2 edge samples. This sampling supersedes the unspecified
rail bevel-segment convention; JSON primitive sampling values describe LOD0
unless a tier explicitly overrides them.

Before apron union, counts including closed caps are:

```text
(topRadial + 4*legRadial)*(4*rimSegments+4)
+ 4*(12+24*railCornerSegments+8*railCornerSegments²)
```

These are not final mesh counts. Union may remove faces and create intersection
vertices/faces; all resulting geometry and any extra samples count toward the
ceiling. Use the following conservative per-part error allowances:

```text
top: .34*(1-cos(pi/topRadial)) + .006*(1-cos(pi/(4*rimSegments)))
leg: sigma*(.022*(1-cos(pi/legRadial))
            + .002*(1-cos((pi/2+atan(k))/(2*rimSegments))))
rail: .002 * normalized spherical-corner/edge chord error
```

Primitive analytical bounds fit the table. The final union additionally requires
bidirectional surface checks against the ideal rounded-rail union; primitive
bounds alone do not certify Boolean intersections. Verify outward closed
components, welded frame intersections, preserved central void, material
ownership and all twenty witnesses. Default bounds tolerance is 1 mm while
support planes must remain exact: larger surface-error allowances do not permit
shrinking the tabletop or moving feet off Z=0. Error after nonuniform sizing is
bounded by the largest axis scale times default error.

If topology, error, contact or budget checks fail, refine the canonical geometry
within the ceiling or reject the tier. Do not delete rails/legs, fill the frame,
add patches or normalize individual LODs. Switching thresholds and rendering
performance belong to the app and remain unverified.

## Document checks and later review

```sh
python3 -B assets/asyra-office/models/tea-furniture/review/__tests__/test_round_tea_table_spec.py
```

Checks cover embedment, twenty witnesses, tangent fillets, feet and bounds,
central frame clearance, region ownership, Markdown/JSON values, analytical
sampling allowances and preservation of the chair, tabletop, palette and images.
They create no model or export and do not certify the future CSG implementation.

After modeling is authorized, inspect matched five views, then enlarged tabletop
rims, leg/apron corners, underside void and all four ground contacts. Preserve
the original source sheet; geometry tests cannot replace visual acceptance.

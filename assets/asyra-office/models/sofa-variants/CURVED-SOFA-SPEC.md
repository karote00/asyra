# Curved Sofa - Construction Review

Status: revised documents approved by the user for commit. No Blender model, app render or
runtime performance has been verified. The approved L-shaped sofa is unchanged.

## Source and unit boundary

- [Original five-view reference](review/02-curved-sofa-v1.png).
- [Numeric inputs](sofa-variants-model-spec.json), `modules[moduleId=curved-sofa]`.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md), [surface defaults](SURFACE-RECIPES.md)
  and [whole-unit sizing](../README.md).

One placeable sofa comprises **sixteen closed solids**: a base, rear shell,
two arms, three seats, three back cushions and six feet. The grouped JSON feet
entry expands to six solids. Keep every cushion independently addressable.
No loose pillows, tufting, piping cord, extra under-seat frame or central filler.

TOP fixes the curved footprint and three seating divisions. FRONT looks from -Y
into the concavity. BACK shows a continuous convex rear shell with three cushions
above it. RIGHT SIDE shows the rearward lean of the back cushion. The illustrated
front/top views are not calibrated orthographic measurements. Exact radii,
angles, rear inset and rounded construction below are explicit construction
choices, not quantities recovered uniquely from the pixels. Preserve the source
sheet; future matched-angle renders must still pass visual review.

## Coordinate system and physical dimensions

All JSON lengths are metres. +Z is up, -Y is front, and +X is the right side when
viewed from the front. Angle zero points to +Y; positive angles turn toward +X.
The angular envelope is -60 to +60 degrees, not a semicircle or ellipse.

The historical **1732.050808 x 825 x 700 mm** dimensions describe the unrounded
engineering envelope with radii 350..1000 mm. They are not the final physical
size and must not be used as the instance scaling denominator.

The rounded default physical size is **1723.245086 x 817.373398 x 700 mm**.
Future mesh bounds must match these physical extents within 2 mm at default size.
Ground origin is the centre of those rounded XY bounds, not the sector's circle
centre or area centroid. This overrides the shared unrounded-origin convention
for this module. Use the full-precision JSON values for construction.

- X: -861.622543..+861.622543 mm.
- Y: -408.686699..+408.686699 mm.
- Z: 0..700 mm; all three seat tops are Z=340 mm.
- Circle centre in final local coordinates: (0,-586.313301,0) mm.

Derive these values rather than measuring a low-detail mesh. On the right arm,
let b=.012, a=pi/3, and t range from 0 to pi/2. In pre-offset polar space:

```text
xMax = max((1-b+b*cos(t))*sin(a-b+b*sin(t)))
yMin = min((.35+b-b*cos(t))*cos(a-b+b*sin(t)))
yMax = .995
offsetY = (yMin+yMax)/2
physicalSize = (2*xMax, yMax-yMin, .7)
```

Both extrema are on the rounded arm boundary at intermediate Z; include their
analytic support samples in all LODs. The rear shell's centre arc supplies yMax.
A bounded root/extremum solver with 1e-10 m convergence is sufficient. Do not
normalize each LOD or alter radii to match its coarse triangulated bounds.

## Exact part dimensions

The radius columns below are **source-space** radial bounds before the back
shear. Z values are final heights. Bevel is the source rounded-box radius.

| Part           | Inner radius mm | Outer radius mm | Z min mm | Z max mm | Bevel mm |
| -------------- | --------------- | --------------- | -------- | -------- | -------- |
| base           | 375             | 970             | 70       | 250      | 18       |
| rear-shell     | 900             | 995             | 80       | 610      | 25       |
| left-arm       | 350             | 1000            | 90       | 560      | 12       |
| right-arm      | 350             | 1000            | 90       | 560      | 12       |
| seat-1         | 360             | 840             | 235      | 340      | 25       |
| seat-2         | 360             | 840             | 235      | 340      | 25       |
| seat-3         | 360             | 840             | 235      | 340      | 25       |
| back-cushion-1 | 800             | 930             | 300      | 700      | 25       |
| back-cushion-2 | 800             | 930             | 300      | 700      | 25       |
| back-cushion-3 | 800             | 930             | 300      | 700      | 25       |

Base and rear shell span [-59,+59] degrees. Arms span [-60,-53] and [53,60].
The base is inset beneath the arms/rear shell; its 250 mm top embeds the seats
by 15 mm. The rear shell starts at 80 mm and covers the back of this base.
Its outer radius is 5 mm inside the arm outer radius, and its ends are inset
1 degree. These deliberate seams prevent coincident exposed outer/end faces;
do not enlarge the shell back to the arm bounds. Keep intersections concealed
within the adjoining upholstery and preserve separate part identity.

For seating index i=0,1,2, the matching seat/back angle interval in degrees is:

```text
a_i = -53 + i*(106/3) + .2
b_i = -53 + (i+1)*(106/3) - .2
```

The three intervals are [-52.8,-17.8666666667],
[-17.4666666667,+17.4666666667], [+17.8666666667,+52.8]. Each spans
34.9333333333 degrees. Adjacent raw wedges have a .4-degree angular separation;
the arm/outer seat raw separation is .2 degrees. The seam is not a constant-width
slot: at radius r the raw adjacent-end separation is `2*r*sin(.2 degrees)`.
At r=.36/.60/.84 m this is approximately 2.513/4.189/5.864 mm. Rounded corners
increase the visible opening locally; do not replace them with an ink stripe.

## Rounded sectors and back lean

Use the same deterministic mapping for all ten upholstered solids. This is
an analytic recipe for a future generator, not a production implementation.

1. In Cartesian source coordinates (s,v,z), create a rounded box with bounds
   `[R*a, R*b] x [innerRadius, outerRadius] x [zMin,zMax]`, angles in radians,
   reference radius **R=1 m**. Its exact solid is the inner box inset by the
   listed bevel on all six faces, Minkowski-summed with a sphere of that radius.
   Equivalently, use the standard rounded-box signed distance. All source widths
   must exceed twice the bevel. This defines faces, cylindrical edges and
   spherical corners without an unspecified bevel modifier.
2. Let zCentre=(zMin+zMax)/2. Set k=0 for base, shell, arms and seats. For each
   back cushion use **k=tan(10 degrees)=.176326980708465**. Map each surface point:

```text
theta = s/R
r = v + k*(z-zCentre)
X = r*sin(theta)
Y = r*cos(theta)-offsetY
Z = z
```

3. This is a radial shear, not rigid rotation of the whole wedge. Back bottom
   shifts inward by 35.265396 mm and top outward by 35.265396 mm about Z=.5 m,
   a total 70.530792 mm. Its central radial section leans 10 degrees, its angular
   boundaries stay radial, and its bottom/top stay at Z=.3/.7 m. The actual
   rounded radial extrema need not occur at the top/bottom corners.
4. Map the entire closed source surface, including caps. The mapping is smooth
   and one-to-one because r remains positive and the angular span is below 360
   degrees. It does not flatten the concavity or join across the opening.
   The Jacobian determinant in source axis order (s,v,z) is **+r/R**.
   Preserve source outward triangle winding and transform normals by the
   inverse transpose. Do not copy source normals or reverse winding for this
   positive-determinant map.
5. Weld shared parameter-space patch boundaries, remove zero-area triangles and
   retain a closed two-manifold per solid. Do not use a convex hull of the entire
   sector; it would fill the curved front. No independently rounded trapezoids,
   duplicate seam faces or geometry added solely to hide a failed join.

The arms are curved end blocks. Their radial faces and corners follow this same
mapping, not rectangular boxes placed tangentially. No backrest lean is applied
to the rear shell or arms. Bevels are uniform in source space; the curved mapping
changes their apparent width by radius. They are not constant-radius Euclidean
fillets after mapping.

## Feet and attachment checks

Six vertical circular feet: radius 23 mm, Z=0..90 mm, inward rim radius 5 mm.
The side wall reaches radius 23 between Z=5 and 85 mm. Quarter-circle rim profiles
meet flat top/bottom discs of radius 18 mm. No splay, tilt or floating feet.

Use the same final polar origin as upholstery. In zero-based `polarCentres`
order the pairs (radius metres, angle degrees) are:

```text
(.46,-48), (.46,0), (.46,48), (.89,-48), (.89,0), (.89,48)
```

This gives two concentric rows, not two straight lines. Each foot intersects
the base through Z=70..90 mm. All six flat discs contact Z=0. All feet remain
within the footprint even where the drawing occludes them.

The following twenty attachment witnesses must lie strictly inside both named
solids. Points are (world radial distance before Y offset, angle degrees, Z),
in metres. These witness points are validation data, not added geometry.

| Pair                      | Witness (r, angle, z)                    | Count |
| ------------------------- | ---------------------------------------- | ----- |
| base / each seat          | (.60, matching interval midpoint, .2425) | 3     |
| each seat / matching back | (.815, matching interval midpoint, .322) | 3     |
| rear shell / each back    | (.925, matching interval midpoint, .54)  | 3     |
| base / rear shell         | (.94, 0, .20)                            | 1     |
| base / each arm           | (.60, -56 or +56, .20)                   | 2     |
| rear shell / each arm     | (.95, -56 or +56, .40)                   | 2     |
| base / each foot          | (foot radius, foot angle, .08)           | 6     |

Inverse-map witnesses to test the source rounded-box solid; source-space
interior margin exceeds 3 mm for the upholstery witnesses. That is not a claim
of 3 mm Euclidean distance after mapping. The foot tests also cover the full
radius 23 circle at Z=.08. Actual meshes must preserve strict intersections and
hide interior intersection surfaces; flat touching surfaces alone do not pass.

## Instance sizes and appearance

Assemble the default solids and apply the stated root offset first. Then scale
all components once by requested/default physical X/Y/Z extents about the ground
origin. Omitted axes retain their defaults. Reject zero, negative or nonfinite
extents. Do not separately fit cushions, preserve a fixed physical gap, or
recenter feet after scaling. Nonuniform XY sizing intentionally turns circles
into ellipses and changes apparent angles. It does not change the base polar
construction parameters or authorize terrain conformity. A proportional lock
must reject incompatible targets. Appearance resolution follows final sizing.

Default upholstery: **sage #78836A**, roughness .93. Default feet: **dark wood
#584333**, roughness .82. Metallic 0, alpha 1, transmission 0, emission 0 and no
clearcoat. The default uses solid colours. Cloth weave remains an optional
selected material, not mandatory geometry or a baked texture.

Every component and each foot by zero-based index is replaceable. Resolve
material and colour independently: per-foot override, otherwise component,
otherwise sofa override, otherwise preset. Apply the resolved colour to the
resolved material while preserving its other properties. Do not mutate shared
materials or other instances. Replacements own UV/triplanar mapping in resized
local space as appropriate. Do not bake shadows, AO, highlights, seams or the
reference sheet background into any surface. Lighting belongs to the app.

## LOD contract

| Tier | Corner segments | Max angular span degrees | Max radial triangle span mm | Foot radial/rim | Triangle ceiling | Surface error mm | Foot error mm |
| ---- | --------------- | ------------------------ | --------------------------- | --------------- | ---------------- | ---------------- | ------------- |
| LOD0 | 8               | 1.5                      | 100                         | 48 / 3          | 30000            | 1.5              | .3            |
| LOD1 | 5               | 3                        | 150                         | 32 / 2          | 14000            | 4                | .6            |
| LOD2 | 4               | 6                        | 200                         | 16 / 1          | 6500             | 9                | 2             |

Use the [normalized barycentric corner grid](../furniture/WRITING-DESK-SPEC.md#view-interpretation-and-lod)
for source rounded-box corners and matching edge samples. Subdivide **all**
source patches so each triangle also satisfies the table's angular span and
post-shear radial span. A rounded source face becomes curved after mapping;
its two original corner triangles are insufficient. Caps and hidden surfaces
are included. Midpoint refinement is evaluated on the analytic source surface,
not merely averaged from already mapped vertices. Include exact support samples
for the physical bounds, cushion tops and foot ground contacts, with conforming
adjacent patches. Never stretch an individual LOD to repair missing extrema.

A conservative error allowance is:

```text
E <= 1.2*b*Ecorner + 1.01*deltaTheta^2/8 + deltaTheta*deltaRadius/4
Efoot <= .023*(1-cos(pi/radialSegments))
       + .005*(1-cos(pi/(4*rimSegments)))
```

Ecorner is the maximum normalized unit-sphere chord error of the chosen corner
triangulation, including matching edge chord error. Use b<=.025 m. The factor 1.2
bounds the source-to-world map derivative over these parts; 1.01 m bounds the
radius. Delta values are the actual per-triangle angular and post-shear radial
spans, in radians/metres. The polar term bounds interpolation by Taylor expansion
and the bounded-coordinate variance/covariance of barycentric weights. Source
refinement must preserve the source approximation error bound. Compare adaptive
bidirectional distances to ideal surfaces per part after construction; an
analytic allowance does not certify an unexamined mesh.

Triangle ceilings are unverified production targets, not measured counts or
performance guarantees. Include hidden faces, caps and extra support/refinement
vertices. If a tier exceeds its budget or fails geometry/error checks, reject
it and improve its tessellation; do not merge seats, drop feet, fill concavity,
add patches or silently weaken the budget. At instance scaling, error grows by
at most the largest axis scale; the app owns switching distances and scheduling.

## Review and evidence limits

Run the permanent document checks:

```sh
python3 -B assets/asyra-office/models/sofa-variants/review/__tests__/test_curved_sofa_spec.py
python3 -B assets/asyra-office/models/sofa-variants/review/__tests__/test_l_shaped_sofa_spec.py
```

These validate dimensions, parameter domains, overlap witnesses, foot support,
seat division, source/table consistency, appearance regions, error allowances
and preservation of the L-shaped sofa and both reference images. They do not
produce or certify model topology, exact mesh triangle counts or performance.

Future visual acceptance requires matched five-view cameras and enlarged
front seams, arm/shell joins, back lean, underside and six foot connections.
First compare the full silhouette, then these local details; show only the
requested final comparison. Passing this document check does not replace the
user's review of the eventual model.

# Orange Tea Chair - Construction Review

Status: revised documents approved by the user for commit. No production model, app render
or runtime performance is verified. The approved tea table, palette, four leg
inputs and both original reference sheets remain unchanged.

## Sources and unit boundary

- [Original five-view reference](review/02-tea-chair-v1.png).
- [Numeric specification](tea-furniture-model-spec.json), `modules[moduleId=tea-chair]`.
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md), [surface recipe](SURFACE-RECIPES.md)
  and [whole-unit sizing](../README.md).

One placeable chair has seven closed components: one continuous wraparound
shell, one seat base, one conforming cushion and four wooden legs. The shell
includes both short arms and the rear backrest; do not split it into unrelated
arm/back pieces. The front remains open. No separate back pillow, piping cord,
button, zipper, wheel, crossbar, support plate or black underside patch.

FRONT shows one seat inside the shell. RIGHT shows the continuous shell height
rising toward the rear; BACK is the same curved outer shell. TOP reveals the
open front and separate cushion. The illustrated top view is elevated and may
show feet; a true vertical projection need not. Drawn lines indicate boundaries,
not mandatory seams or grooves. Curves, hidden surfaces and numeric sizes below
are authored construction choices, not uniquely recovered pixel measurements.
The original sheet remains the appearance reference for future model review.

## Coordinates and physical bounds

Metres in JSON; millimetres in tables. +Z up, -Y front, +X right. Ground origin
is (0,0,0), the centre of the declared overall XY footprint. Default physical
size stays **440 x 460 x 650 mm**, bounds X=+-220, Y=+-230, Z=0..650 mm.
The cushion's planar top stays at Z=330 mm.

The shell supplies X=+-220, rear Y=230 and highest Z=650. The cushion front
supplies Y=-230; all feet touch Z=0. These are actual ideal-surface supports,
not an unrounded engineering envelope. Include them in all LODs. Source-box
rounding does not remove those support points.

## Continuous shell and deterministic rounding

The original elliptical annular parameters remain: inner radii 170/180 mm,
outer radii 220/230 mm, angular interval -120..+120 degrees, bottom 235 mm,
rear top 650 mm and nominal end top 390 mm. Radius differences are 50 mm;
this is not a claim of exactly 50 mm wall thickness along every surface normal.

Use a rounded Cartesian source box in coordinates (s,v,zs):

```text
R=.2; a=2*pi/3; b=.012
source bounds: s=[-R*a,R*a], v=[0,.05], zs=[.235,.65]
source centre: (0,.025,.4425)
inner box size: (2*R*a-2*b, .05-2*b, .415-2*b)
source solid: inner box Minkowski-summed with a sphere of radius b
```

This supplies six flat source faces, cylindrical source edges and spherical
source corners with no unspecified bevel modifier. Map its entire closed
boundary, including both angular end caps:

```text
theta=s/R
h(theta)=.39+.26*(1-(abs(theta)/a)^4)
u=(zs-.235)/.415
X=(.17+v)*sin(theta)
Y=(.18+v)*cos(theta)
Z=.235+u*(h(theta)-.235)
```

Angle zero points rearward +Y; positive angles turn toward +X. The shell is a
mapped solid with a varying top, not a filled bucket. The seat cavity must
remain empty above the cushion. The shell has no additional rigid rotation,
back cushion or independent arm tilt.

Rounding occurs **before** mapping. Its 12 mm radius is a source-space value,
not a constant-radius Euclidean fillet after mapping. The nominal end height
h(120 degrees)=390 mm is reduced on the rounded end face; do not stretch the
end face back upward. At the rear, the top source face includes theta=0 and
v=.012..038, retaining exact Z=.65. Side/outer faces contain the X/Y support
points above. Include theta=0 and theta=+-90 degrees in the mesh sampling.

The mapping is one-to-one on this source box and its small clearance expansion:
all radii and h(theta)-.235 remain positive; the angular span is below 360 degrees.
Its Jacobian determinant is:

```text
((.17+v)*cos(theta)^2+(.18+v)*sin(theta)^2)/R
* (h(theta)-.235)/.415 > 0
```

Preserve outward source triangle winding. Transform normals using the inverse
transpose Jacobian, not source normals. The quartic height function has a broad, smooth centre crown; do not assume
uniform angular sampling alone satisfies a curvature/error bound. Refine against the analytic
surface and preserve the centre sample. No convex hull across the open front.

## Seat base and conforming cushion

| Component    | Width mm | Depth mm | Centre Y mm | Z min mm | Z max mm | Plan radius mm | Edge radius mm |
| ------------ | -------- | -------- | ----------- | -------- | -------- | -------------- | -------------- |
| seat-base    | 360      | 350      | -15         | 205      | 255      | 70             | 8              |
| seat-cushion | 360      | 425      | -17.5       | 245      | 330      | 70             | 25             |

The cushion row describes a **construction blank**, not a rectangular final
footprint. Its front stays at Y=-230 mm. Its back extends to +195 mm before
trimming, replacing the old +160 mm rear limit so the seat can meet the inner
back curve. Its bottom moves from 255 to 245 mm, creating 10 mm base overlap.
The base geometry and seven-part unit boundary are retained.

For either rounded-rectangle blank with width W, depth D, height H, plan corner
radius A and edge radius b, define a rounded-rectangle prism core with XY size
(W-2b,D-2b), plan radius A-b and Z height H-2b. Minkowski-sum that core with a
sphere of radius b, then translate to the documented centre. Require A>=b>0,
H>2b and min(W,D)>2A. This preserves full extents and gives exact curved rim
transitions; it is not a generic rounded box with a 70 mm radius on all edges.

A sign-correct distance formula for this blank, using centred coordinates, is:

```text
q=abs(p.xy)-(W/2-A,D/2-A)
dxy=length(max(q,0))+min(max(q.x,q.y),0)-(A-b)
dz=abs(p.z)-(H/2-b)
d=length(max((dxy,dz),0))+min(max(dxy,dz),0)-b
blank interior: d<0
```

Construct the final cushion in this order:

1. Create the rounded blank above.
2. Intersect its rear half (Y>=0) with the filled ellipse
   `(X/.19)^2+(Y/.20)^2 <= 1`; leave Y<0 unchanged. This is a shape envelope,
   not another visible component. Its boundary corresponds to shell source
   v=.02 at angles -90..+90 degrees and lies inside the shell over the cushion
   height. It removes rear outer offcuts before trimming. It introduces no
   exposed line at Y=0 because its 190 mm half-width exceeds the blank's 180 mm.
3. Expand the shell's **source** rounded box by delta=.002 m: preserve the same
   inner box and increase its sphere radius from .012 to .014 m. Map that expanded
   solid with exactly the same shell map. The map must be evaluated over the
   expanded domain, including its slightly extended angular and height bounds.
4. Subtract this mapped clearance solid from the clipped blank. Retain one
   connected, closed cushion including its trimmed boundary faces. Cut-face
   normals point into the removed clearance solid, opposite its outward normals;
   weld the resulting intersection boundaries geometrically. Do not
   keep exterior fragments, erase a failure by selecting an arbitrary largest
   piece, or omit a Boolean cut face. Correct the source recipe if connectivity
   or topology fails. The clearance solid is construction-only, never exported.

The clearance is 2 mm in source space, **not a uniform 2 mm world-space seam**.
The mapped expansion strictly contains the original shell, so a valid cut
cannot intersect the shell. At the rear centre the radial gap is approximately
2 mm; vertical/oblique clearances vary with the map. The cushion connects to
the base, not directly to the shell. Inspect the seam after actual tessellation;
the broad LOD surface allowance must never close it.

For deterministic membership checks, solve the monotone scalar equation
`(X/(.17+v))^2+(Y/(.18+v))^2=1` on v in [0,.05], or [-delta,.05+delta] for
the cutter. Points inside the smaller ellipse or outside the larger ellipse
are outside this shell band. Recover `theta=atan2(X/(.17+v),Y/(.18+v))`, reject
angles outside the source angular bounds, and recover
`zs=.235+(Z-.235)*.415/(h(theta)-.235)`. Apply the source rounded-box field.
This is a membership test; its returned source value is not a world-distance
oracle. Use genuine surface distances for final mesh error validation.

## Four unchanged legs and seven attachment witnesses

The existing four endpoint pairs remain, in JSON order:

| Index | Bottom XYZ mm | Top XYZ mm    |
| ----- | ------------- | ------------- |
| 0     | -175,-180,0   | -120,-120,230 |
| 1     | 175,-180,0    | 120,-120,230  |
| 2     | -175,145,0    | -120,105,230  |
| 3     | 175,145,0     | 120,105,230   |

Nominal lower/upper radii are 14/18 mm, rim radius 2 mm. Use the
[exact tangent tapered profile and shear](../furniture/COFFEE-TABLE-SPEC.md#tapered-leg-surface-and-flat-caps)
with H=.23, r0=.014, r1=.018, b=.002 and the endpoints above. The profile is
rounded before shear, with horizontal caps and positive taper. Do not rotate a
cone or use ordinary quarter-circle fillets that miss the taper tangent. No
crossbars or metal parts are introduced. All four flat bottom discs stay at Z=0.

| Joined components | Witness XYZ (m)                     | Count |
| ----------------- | ----------------------------------- | ----- |
| base / cushion    | (0,0,.25)                           | 1     |
| base / shell      | (-.175,0,.245), (+.175,0,.245)      | 2     |
| each leg / base   | (leg centreline XY at Z=.222, .222) | 4     |

The base/cushion point is inside the 10 mm overlap. Shell/base witnesses remain
inside both solids near the side attachments; no rear connection is invented
where the base ends before the rear shell. Each leg top penetrates the base by
25 mm. All witnesses must remain strictly inside the actual paired meshes at
every tier. Source-space shell margins do not imply equal physical margins;
verify actual containment, not just AABB overlap or surface distance.

## Scaling and seven independent surface regions

Assemble and trim at default dimensions first. Apply requested/default X/Y/Z
extents once about the ground origin to all seven components and clearances.
Omitted axes retain defaults. Reject nonfinite, zero or negative extents. No
negative mirroring, per-component fit, fixed-size gap restoration or terrain
conformity. Nonuniform scales intentionally alter apparent radii and leg splay.
A proportional lock rejects incompatible targets. Normals follow the transformed
geometry. Surface resolution follows final sizing under the shared contract.

Shell, seat base and cushion default to orange #BF753D, roughness .93. Each leg
defaults to dark wood #584333, roughness .82. Metallic 0, alpha 1, transmission 0,
emission 0 and no clearcoat. The existing cloth weave is the selectable default
material; it does not require extra geometry. No black underside patch.

Each upholstered component and each indexed leg has its own region. Resolve
material and colour independently from indexed component to group to chair to
preset. Apply colour to the selected material's base colour without changing
other settings or instances. Replacement materials own their mapping and may
omit weave. Keep source cut surfaces assigned to the cushion, not to the
construction cutter. No baked source seams, AO, shading, reflections or labels.
The app owns lighting, seating interactions, placement and runtime scheduling.

## LOD targets and mandatory local checks

| Tier | Initial shell angular intervals | Leg radial | Leg rim | Triangle ceiling | Broad surface error mm | Seam surface error mm |
| ---- | ------------------------------- | ---------- | ------- | ---------------- | ---------------------- | --------------------- |
| LOD0 | 120                             | 48         | 3       | 20000            | 1                      | .15                   |
| LOD1 | 60                              | 32         | 2       | 11000            | 2                      | .15                   |
| LOD2 | 40                              | 16         | 1       | 6000             | 4                      | .15                   |

These are **unverified generation targets**, not measured meshes. Angular counts
are initial subdivisions, not a claim that all source faces remain planar or
that uniform spacing meets the error limits. Map subdivided source patches and
refine against the analytic shell; include theta=0,+-90 and exact end caps.
Roundover source patches and rounded-seat profiles must share boundary samples,
with extra refinement around changing height and Boolean intersections. Keep
all physical supports and the 330 mm cushion top; never normalize each LOD.

Every tier must retain seven connected closed components, seven material
regions, four flat ground contacts, the open front and the seven joints.
The cut cushion must remain a single connected component. Remove no legs or
underside faces. Include all caps and Boolean-generated faces in the budget.

The .15 mm local surface tolerance applies to both sides of the entire
cushion/shell seam and to trimmed cusp regions. Independently require a strictly
positive gap and no triangle intersection there; error bounds alone do not
prove separation. The broader tolerance applies elsewhere. Require adaptive
bidirectional surface distance to the analytic solids, outward winding and
watertight geometric adjacency. Default dimension tolerance is 1 mm with exact
support samples; 4 mm LOD2 error does not permit shrinking the chair bounds.
After instance scaling, errors scale by at most the largest axis factor.

If a tier cannot satisfy local separation, attachment, topology and budget
simultaneously, reject it and refine the canonical surface/Boolean algorithm.
Do not relax seam checks, bridge the cavity, drop disconnected offcuts without
repairing their cause, add patches or invent a replacement silhouette. Runtime
switching thresholds and performance are outside this document review.

## Checks and evidence limits

```sh
python3 -B assets/asyra-office/models/tea-furniture/review/__tests__/test_tea_chair_spec.py
python3 -B assets/asyra-office/models/tea-furniture/review/__tests__/test_round_tea_table_spec.py
```

Checks cover seven analytic contacts, mapping orientation and membership,
clearance nesting, sampled cushion-section connectivity at Z=.246/.26/.29/.32/.329,
physical support points, tangent leg rims, source tables and preserved table,
feet, palette and images. The section grid is a diagnostic sampling proof, not
an exhaustive manifold certificate or proof of a particular Boolean engine.
No production mesh or model file is created. Actual exports must pass the
stronger topology, seam distance, material and budget checks above.

Future visual review uses matched five-view cameras, then enlarged arm ends,
back rim, cushion seam, underside contacts and feet. Numeric consistency cannot
replace comparison with the original image or the user's model approval.

## Front-crown reconciliation - 2026-10-27

The approved FRONT/BACK sheet has a broad crown rather than the pointed centre
produced by exponent 1.6. The revised height law uses exponent 4, retaining
650 mm rear height, 390 mm end height and the original elliptical shell radii.
Across X=+-120 mm the crown remains above 640 mm. This is a reference-guided
curve correction, not a newly surveyed measurement. The documented cushion
clearance remains intentional and must not be erased by unioning the cushion
into the shell. Other default sizes, foot contacts and replaceable regions stay.

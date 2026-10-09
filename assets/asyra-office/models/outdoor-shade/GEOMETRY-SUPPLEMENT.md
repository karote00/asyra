# Geometry Supplement

## Coordinates

Metres, +Z up, -Y front, +X right. Origins are centered on each component's bottom. All dimensions are authored. See the [numeric specification](outdoor-shade-model-spec.json).

## Open parasol - procedural generation

The user selected direct programmatic generation on 2026-10-10. No Blender
intermediary is required. This document specifies the construction; it does
not implement a generator or claim rendered-model approval. Keep three
addressable groups: one main pole, eight equal ribs, and one canopy shell.

### Inputs and shared skeleton

- H: main pole length, default 2.043 m. The pole is a closed Z cylinder from
  0 to H, radius 0.0175 m, 48 radial segments, flat ends.
- L: each branch's centreline length, default sqrt(0.9^2+0.3^2) =
  0.948683298050514 m. This is sloped length, not horizontal radius.
- theta: branch angle downward from horizontal, default atan(0.3/0.9) =
  18.434948822922 degrees. Length alone cannot determine canopy slope.
- Eight branches, one every 45 degrees. Initial angle is 22.5 degrees to
  match the original TOP's flat edges along X/Y; the old zero-degree setting
  is superseded. Each rib is a closed cylinder, radius 0.005 m, 16 segments.

Root C=(0,0,H). For i=0..7, a_i=22.5 degrees+i*45 degrees and
P_i=C+L*(cos(theta)*cos(a_i), cos(theta)*sin(a_i), -sin(theta)).
Each rib follows C to P_i. Join every adjacent pair of endpoints with C to
form eight triangles (C,P_i,P_(i+1 modulo 8)). These triangles are the shared
canopy skeleton; do not independently place or resize the eight fabric panels.

### Finite thickness and joins

Finite-radius ribs cannot be centred on the exposed fabric surface. Let
m=tan(theta)/cos(pi/8) and define upward surface offset
`delta=max(0.007, poleRadius*m+0.0005, ribRadius*sqrt(1+m*m)+0.0005)`.
The top canopy is the shared triangle skeleton translated upward by delta.
Duplicate it 0.004 m downward in Z for the reversed underside and join the
perimeter faces. This creates a thin closed material shell, not a solid
pyramid or a horizontal bottom disk. Keep eight planar panels without sag,
scallops, vents, seam relief or a finial.

The pole ends at H, below the exposed apex at H+delta. At the default values,
delta=7 mm and the pole cap clears the upper canopy by at least 0.686 mm
vertically around its rim. Ribs connect at the pole top and overlap the canopy
underside. Their ideal cylindrical upper clearance from either adjacent panel
is approximately 1.585 mm measured normal to the panel. These are authored
construction clearances, not details measured from the illustration.

At the perimeter, intersect each closed finite rib cylinder with the vertical
prism defined by the canopy octagon and cap its cut. Its centreline endpoint
remains P_i; trim only the finite-radius excess outside the canopy footprint.
Repeat the same finished rib eight times at 45-degree intervals. Check joins
and eliminate exposed interior faces during model construction without losing
the three independently configurable groups. No extra hub, slider or cap is
introduced as a substitute for the specified joins.

### Parameter constraints and derived dimensions

Lengths/radii must be finite and positive; 0 <= theta < 90 degrees. Require
L*cos(theta)>poleRadius+ribRadius and H-L*sin(theta)-ribRadius>0.
Also require `0 < (delta-0.004)/sqrt(1+m*m) < ribRadius`: the ribs must overlap
the underside while remaining below the top. Reject invalid combinations;
do not silently clamp requested values or insert an extra supporting part.

| Default quantity | Metres |
| --- | --- |
| Pole length H | 2.043 |
| Equal branch centreline length L | 0.948683298050514 |
| Horizontal branch radius | 0.900 |
| Branch end Z | 1.743 |
| Canopy top apex / edge Z | 2.050 / 1.750 |
| Canopy opposite-vertex span | 1.800 |
| Complete X / Y / Z bounds | 1.662983158520316 / 1.662983158520316 / 2.050 |

The original 1.80 m label denotes the opposite-vertex span, not the X/Y
bounding-box width. With the corrected 22.5-degree orientation, X and Y span
1.8*cos(22.5 degrees). The earlier 1.8 x 1.8 bounds are superseded. The
original illustration remains an appearance guide, not calibrated projections.

Changing H or L regenerates the shared skeleton, shell and rib endpoints;
changing H alone preserves canopy radius and slope. Resolve actual generated
bounds before the shared whole-unit XYZ scaling, then apply colour/material
options independently to canopy, pole and ribs. Equal branch lengths and
45-degree pitch describe the base generated geometry; later nonuniform overall
XYZ scaling may alter final lengths and angles, as the common sizing rule
allows. Do not silently regenerate symmetric branches after such scaling.

Keep the fixed open state and independent base. No folding, placement, physical
simulation, new model, or app implementation is part of this specification work.

## Separate base

Disk: radius 0.210, Z=0 to 0.055, 96 radial segments.
Socket: radius 0.035, Z=0.055 to 0.240, 64 radial segments.

Subtract one centered radius-0.0185 cylinder from both parts, Z=0.015 to 0.241, with 64 radial segments. The hole opens through the socket top and continues into the disk. The closed hole floor is at Z=0.015. Nominal socket wall thickness is 0.0165. Cap all material boundaries, not the open bore.

Use flat tops/bottoms and smooth cylindrical sides. No bevel, decorative ring, bolt, retaining knob, feet, wheels, handle or second sleeve. The socket and disk meet at Z=0.055; welding their shared material boundary is allowed without changing geometry.

## Assembly reference only

The parasol's radius-0.0175 pole fits the radius-0.0185 bore with 0.001 radial clearance. With the pole bottom seated at base Z=0.015, the combined canopy apex is Z=2.065. This describes a possible transform only; do not bundle the two units, change their origins, or implement placement behavior.

No real-world structural or wind-load claim is made; these are miniature scene assets.

## Future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. The octagon is invariant under 90-degree rotations. Numeric geometry governs hidden ribs and bore depth.

Future model review checks dimensions within 0.001, eight canopy panels/eight ribs, closed shell topology, pole clearance, actual hollow socket and closed floor, flat ground contact, and no baked lighting. Inspect underside and bore close views. No model, fit simulation, animation or performance validation has occurred.

# Street Tree - Construction Contract

Updated 2026-10-08. Scope: one shared solid leaf, one bare-tree assembly and one
repeatable foliage assembly. The user delegated the missing numeric construction
decisions after selecting the fuller bare tree and natural leaf cluster.
No reference image is changed by this contract. No model has been built or
visually accepted against these values.

## Authority and handoff

Read this document with [tree-construction-spec.json](tree-construction-spec.json).
The JSON owns numbers and ordered tables; this document owns their mathematical
interpretation. [BARE-TREE.md](BARE-TREE.md) is the readable branch inventory.
The street module links to these files rather than maintaining a second recipe.

Use these existing pictures together:

- [Single leaf](review/06-single-leaf-v1.png): rounded, broad distal end and narrow rounded base.
- [Selected natural cluster](review/06-leaf-cluster-v2.png): mixed sizes, overlapping groups and irregular outline.
- [Selected bare tree](review/06-bare-tree-selected-v1.png): fuller branching with two levels beyond the trunk.
- [Original complete tree](review/06-street-tree-v2.png): overall miniature broadleaf character.

The branch coordinates, hidden depth, leaf positions and exact curves are authored
construction decisions, not recovered measurements or a claim of an exact hidden
original mesh. The single-leaf SIDE arch is illustrative: use the numeric 3 mm
bulge, not its exaggerated drawn height. Do not simplify the selected bare tree
to the superseded six-primary/six-secondary example. B7 remains a child of B11.

Units are metres. +Z is up, +X is right, the front camera is at -Y, and origin is
the trunk base centre. Maximum bounds are (-1.50,-0.95,0) to (1.50,0.95,3.55).
These are a rejection bound, never a target for scaling, clipping or stretching.
The former 2.36 x 1.80 m bound is superseded to accommodate the fuller layout.

## Shared leaf geometry

Local +X runs from the narrow base to the broad tip, +Y is width, +Z is the
front normal. Nominal length is 100 mm, maximum width 58 mm, rim plane Z=0,
front centre Z=3 mm, and the matching back is translated by -1 mm in local Z.
Thus total Z extent is -1 to 3 mm; 1 mm describes shell translation, not the
leaf's total bounding height or a constant thickness along surface normals.

The four cubic Bezier arcs in JSON form one closed counterclockwise boundary.
For each arc with controls P0..P3, use
`b(t)=(1-t)^3*P0+3*(1-t)^2*t*P1+3*(1-t)*t^2*P2+t^3*P3`.
For any boundary point b and radial coordinate rho in [0,1], define:

```text
front(rho,b) = (rho*b.x, rho*b.y, 0.003*(1-rho^2)^2)
back(rho,b)  = front(rho,b) - (0,0,0.001)
```

Use one centre vertex per face, shared by all radial sectors. Join front and back
at rho=1 with a closed rim. No stem, vein, notch, serration, extra bevel, individual
leaf deformation or procedural outline noise is part of this prototype.

The default authoring mesh samples each arc at t=0,0.25,0.5,0.75, producing 16
boundary directions, and samples radial rings at rho=0.5 and 1. Each face has 33
vertices. For counterclockwise sample i and j=(i+1) mod 16:

- Front centre fan: (centre, inner_i, inner_j).
- Front annulus: (inner_i, outer_i, outer_j), (inner_i, outer_j, inner_j).
- Back: same connectivity with reversed winding.
- Rim: (front_i, back_i, back_j), (front_i, back_j, front_j), using outer rings.

This gives 66 vertices before normal splits and 128 triangles. Smooth
area-weighted normals separately within front, back and rim; split their shared
boundaries. The continuous formula remains the shape authority for close-up
refinement. Uniformly subdividing each arc and radial interval may refine the
master without changing its curve or silhouette. Use planar front/back UVs
`((x+0.05)/0.10,(y+0.029)/0.058)`; rim U is normalized sampled perimeter length,
V is 0 at the back and 1 at the front, with a UV seam at the first boundary point.

Instances apply uniform scale 0.30..1.20 to all axes. Length therefore ranges
30..120 mm, width 17.4..69.6 mm, shell translation 0.3..1.2 mm and bulge
0.9..3.6 mm. Every instance uses the same prototype vertex/index buffer.

## Trunk centreline

The seven JSON stations are [x,y,z,radius]. The trunk's centreline ends at
Z=2.55 m, its ground diameter is 0.23 m and its top diameter is 0.024 m.
Branches may extend above the trunk; never stretch the trunk to the highest tip.

Interpolate x(z) and y(z) by cubic Hermite curves. For either coordinate f, use
one-sided secant derivatives at the two end stations and
`m_i=(f_(i+1)-f_(i-1))/(z_(i+1)-z_(i-1))` at an internal station.
Within interval i..i+1 let d=z_(i+1)-z_i and u=(z-z_i)/d:

```text
f(z) = (2*u^3-3*u^2+1)*f_i + (u^3-2*u^2+u)*d*m_i
     + (-2*u^3+3*u^2)*f_(i+1) + (u^3-u^2)*d*m_(i+1)
T(z) = (x(z),y(z),z)
r(z) = (1-u)*r_i + u*r_(i+1)
```

The tangent is normalize((dx/dz,dy/dz,1)). Radius is linear between stations.
No extra trunk noise, roots, soil, pot, terrain or hidden stand is included.

## Branch graph and curves

The JSON fixes 7 primary and 13 secondary branches. Each has exactly one parent.
Evaluate all primaries in increasing numeric ID, then all secondaries in increasing
numeric ID. IDs are documentation-local labels, not persisted application IDs.
Level means graph depth, not height. Secondary branches are terminal; no level 3.

For a primary, S=T(attachmentZ). For a secondary, S=Q_parent(parentT).
The listed E is a terminal cap centre, not its outermost surface. Define:

```text
C = (S+E)/2 + (0,0,controlLift)
Q(t) = (1-t)^2*S + 2*(1-t)*t*C + t^2*E
Q'(t) = 2*(1-t)*(C-S) + 2*t*(E-C)
```

The control lift is 0.10 m for primaries and 0.035 m for secondaries. Parameter t
is not arc length. Downward terminal branches are intentional; do not force every
endpoint above its attachment. A parent continues beyond its child attachment.

Evaluate the parent's radius at the same analytic attachment parameter:

```text
primary root = min(0.055, 0.82*parentRadius)
secondary root = 0.58*parentRadius
primary tip = min(0.007, 0.22*root)
secondary tip = min(0.004, 0.28*root)
r(t) = tip + (root-tip)*(1-t)^1.2
```

Never attach to a nearest sampled mesh vertex, reset a child to the trunk, or
substitute a common radius. These formulas make every child thinner than its
local parent. The branch table defines the geometry at every point; ring counts
or a tool's default smoothing must not redefine it.

## Wood surface and junctions

For any centreline Q with its radius r, define the swept-ball field
`D(p)=min_t(length(p-Q(t))-r(t))`, over the entire closed parameter interval.
For the trunk, minimize over z=0..2.55 and apply
`D_trunk(p)=max(D(p),-p.z,p.z-2.55)` to make its ends flat. Each branch has rounded
terminal caps from the same field. Find global minima with absolute field-value
error no greater than 0.00001 m; one nearest curve sample is insufficient.

Start with the trunk field and fold branches in the graph evaluation order above.
For each branch root S and root radius r0, let q=length(p-S)/r0. Define fade=1
when q<=1.5 and fade=0 when q>=4. Between them, let v=(q-1.5)/2.5 and
`fade=1-(3*v^2-2*v^3)`. With A as the accumulated field and B the branch field:

```text
k = 0.65*r0*fade
if k == 0: result = min(A,B)
otherwise:
    h = max(k-abs(A-B),0)/k
    result = min(A,B) - k*h*h/4
```

This is a local smooth union at real attachment points. Outside each root's
support, use an ordinary union; do not add decorative collars, visible spheres,
separate capped intersections or post-mesh smoothing. Finish with
`F(p)=max(accumulatedField(p),-p.z)`; the surface is F=0 and the interior F<0.
The blend is deliberately fixed rather than left to a sculpting guess.

Use adaptive surface extraction with a maximum 1 mm cell near thick wood and
refinement to at most min(1 mm,local minimum contributing radius/3) near small
tips and forks. The target maximum surface deviation from F=0 is 0.25 mm,
including minimization error. Preserve all terminal tips and the flat base.
A mesher may change topology to meet this tolerance; it may not change the field,
curve, taper or branch graph. Weld shared boundaries and produce one closed,
consistently outward-facing wood surface. Normals follow the outward field gradient;
use one-sided normals at the intentionally sharp flat trunk-end rims.

These are authoring tolerances, not a claim that a mesh has already passed them.
Do not allocate a dense 1 mm grid for the entire empty bounding box. Tool choice
and sparse meshing implementation belong to the later model task; the geometric
surface is completely defined here independent of that choice.

## Foliage positions and frames

JSON lists 23 ordered groups: one near each of the 20 branch tips and three on
the trunk. Primary groups contain 96 leaves, secondary groups 64, and trunk
groups 80: 7*96+13*64+3*80=1,744. No guide sphere or ellipsoid is rendered.

At the listed owner attachment, let w be its normalized tangent. Let a be the
normalized projection of +X onto the plane perpendicular to w; if its length is
below 1e-6, project +Y instead. Let b=w cross a. The orthonormal frame is (a,b,w).
A group's centre is the owner curve point plus its localOffset expressed in this
frame. Its JSON radii R and subgroup offsets use the same local axes.

Each group has its own 32-bit LCG, initial state `(606+1009*groupIndex) mod 2^32`,
where groupIndex starts at zero in JSON order. For each uniform draw, first update
`state=(1664525*state+1013904223) mod 2^32`, then return
`u=(state+0.5)/2^32`. Draw exactly eight uniforms u0..u7 for each leaf, in index
order. Appearance overrides must not change random consumption.

For leaf i, subgroup j=i mod 5. Generate:

```text
z = 1-2*u0; theta = 2*pi*u1
v = (sqrt(1-z*z)*cos(theta),sqrt(1-z*z)*sin(theta),z)
localPosition = R * subgroup[j] + 0.35 * R * v * cbrt(u2)
```

Here `*` between vectors is componentwise multiplication. Transform localPosition
by (a,b,w) and add the group centre to obtain the leaf centre P. Uniform ellipsoid
volume sampling, offset subgroups and mixed sizes create overlapping patches
and gaps; they do not place every leaf on an identical sphere or radial rosette.
Leaf intersections are permitted in foliage. No placement depends on the camera.

For subgroup 2, scale=0.30+0.25*u3. Otherwise use the following conditional mixture:

| u3 interval | Uniform scale |
| --- | --- |
| [0,0.45) | 0.30+0.20*u3/0.45 |
| [0.45,0.85) | 0.50+0.35*(u3-0.45)/0.40 |
| [0.85,1) | 0.85+0.35*(u3-0.85)/0.15 |

The 45/40/15 percentages apply to non-bud groups, not the complete tree.
Subgroup 2 contains smaller emerging leaves. The size spread replaces 0.75..1.15.

## Foliage orientations and colours

Construct a second unit sphere direction v2 using z=1-2*u4 and theta=2*pi*u5.
The leaf's local normal is normalize(v+v2); if its length is below 1e-6, use v.
Transform this normal by (a,b,w) to obtain world normal N. Let U be the normalized
projection of w onto the plane perpendicular to N; if shorter than 1e-6, project
a, then b. Let V=N cross U. For angle alpha=(2*u6-1)*80 degrees, define:

```text
longAxis  = cos(alpha)*U + sin(alpha)*V
shortAxis = -sin(alpha)*U + cos(alpha)*V
worldVertex = P + scale*(x*longAxis + y*shortAxis + z*N)
```

Here (x,y,z) is a prototype vertex. Leaf front, back and narrow edge views arise
from these rotations. No billboarding, per-leaf stretching or camera-facing normal
is permitted. Supports are distribution guides, not additional visible stems or
new branch levels; the stylized leaf cloud need not attach every blade to a twig.

Each subgroup has one dominant material. Use a separate one-draw LCG with initial
state `(606+1009*groupIndex+65537*(j+1)) mod 2^32`. Map that draw to material slots
olive/pale/deep with probabilities 0.50/0.30/0.20. For each leaf, u7<0.75 selects
the dominant slot. For u7>=0.75 select the two other slots in ascending slot order,
first for [0.75,0.875), second for [0.875,1). This makes locally related colours
without baking light direction into pigment. Use the entire prototype surface's
chosen slot; rim shade comes from scene lighting, not a separate dark outline.

## Defaults, appearance replacement and delivery

Defaults are bark #806144 with roughness 0.94, and leaves #829347, #A7AD58 and
#596D3D with roughness 0.90; all metallic 0, opaque and non-emissive. Hex values
are sRGB; convert to linear when required by the target material API. Default
geometry has no displacement. Optional bark texture is replaceable appearance,
not required geometry. A complete material override replaces the previous shader
and textures. A colour override changes tint without altering geometry.

Bark and all leaf slots are independently replaceable. A caller may assign one
material to all leaves without changing their positions, scale, random stream or
branch geometry. Reference shadows and highlights must never be baked into base
colour. Scene lighting owns shadows and ambient occlusion.

The default master leaf mesh contributes 1,744*128=223,232 triangles across its
instances, before wood. Sharing buffers reduces storage, not the number of
triangles drawn. This is an authoring reference, not an approved runtime budget;
LoD, visibility, export and performance implementation remain a separate stage.
Do not silently reduce the authored canopy to meet an assumed runtime budget.

Future model review must use the same constructed geometry in front, back, side,
top and three-quarter views. Check the bare trunk/branches first, the individual
leaf second, then the selected cluster's size hierarchy, depth, overlap and
outline, and finally the complete tree. Magnify forks, leaf rims and narrow tips.
Numeric completeness does not itself establish visual acceptance. Do not reopen
settled geometry as arbitrary tool defaults during that later implementation.

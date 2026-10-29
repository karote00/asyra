# Street Tree - Construction Contract

Updated 2026-10-25 (irregular branching revision 4). Scope: one shared solid leaf, one bare-tree assembly and one
repeatable foliage assembly. The user delegated the missing numeric construction
decisions after selecting the fuller bare tree and natural leaf cluster.
No reference image is changed by this contract. The foliage revision corrects the sparse first rendered canopy against the selected
images. Numeric validation and agent review are not owner visual approval.

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
the trunk base centre. Maximum bounds before whole-unit scaling are (-1.50,-1.50,0) to (1.50,1.50,3.55).
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

Instances apply uniform scale 0.65..2.20 to all axes, including emerging leaves.
Length therefore ranges 65..220 mm, width 37.7..127.6 mm, shell translation
0.65..2.2 mm and bulge 1.95..6.6 mm. Every instance uses the same prototype vertex/index buffer.

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

The JSON scaffold fixes 7 primary and 13 secondary branches before the bounded
random additions described below. Each branch has exactly one parent.
Evaluate all primaries in increasing numeric ID, then all secondaries in increasing
numeric ID. IDs are documentation-local labels, not persisted application IDs.
Level means graph depth, not height. Secondary branches are terminal; no level 3.

For a primary, S=T(attachmentZ). For a secondary, S=Q_parent(parentT), using
the transformed parent curve. Apply the radial growth transform below to the
listed endpoint and control lift before evaluating the branch. E is the resulting
terminal cap centre, not its outermost surface. Define:

```text
C = (S+E)/2 + (0,0,transformedControlLift)
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

JSON lists 23 core anchors. Their reference counts (160 primary, 128 secondary,
160 trunk) provide allocation weights, not final cluster populations. Revision 4
apportions the fixed 3,264-leaf total across core and generated clusters. Primary attachments use
branch t=0.72 and secondary attachments t=0.80. Their ellipsoid radii in world XYZ
are respectively (0.65,0.65,0.72) and (0.56,0.58,0.60) m; trunk groups use
(0.75,0.75,0.70) m before count-dependent core-radius scaling. Existing trunk attachments remain
unchanged. These overlapping
volumes replace isolated tip tufts; no guide sphere or ellipsoid is rendered.

At the listed owner attachment, w is its normalized tangent. Let a be the normalized
projection of +X perpendicular to w (use +Y if degenerate), and b=w cross a.
The centre is the owner point plus localOffset in (a,b,w). Lobe radii and subgroup
positions use world XYZ, so lateral branch inclination cannot collapse crown depth.

Each group has its own 32-bit LCG, initial state `(seed+1009*groupIndex) mod 2^32`,
where groupIndex starts at zero in JSON order. For each uniform draw, first update
`state=(1664525*state+1013904223) mod 2^32`, then return
`u=(state+0.5)/2^32`. Draw exactly eight uniforms u0..u7 for each leaf, in index
order. Appearance overrides must not change random consumption.

For leaf i, subgroup j=i mod 5. Generate:

```text
z = 1-2*u0; theta = 2*pi*u1
v = (sqrt(1-z*z)*cos(theta),sqrt(1-z*z)*sin(theta),z)
localPosition = R * (0.65 * subgroup[j] + 0.24*v*cbrt(u2))
```

Here `*` is componentwise multiplication. Add localPosition directly to the centre.
The five filled offset subgroups overlap; their volume guides are never rendered.
Random volume depth and irregular subgroup offsets avoid a hollow spherical shell.
Each blade retains its own rotation and uniform scale. Intersections are permitted. There is no camera-dependent placement.

Subgroup 2 uses scale=0.65+0.45*u3. Other leaves consume JSON sizeMixture in order:
25% uniform 0.65..1.00, 50% uniform 1.00..1.60 and 25% uniform 1.60..2.20.
For interval starting at probability c with width p, linearly interpolate its scale
endpoints using (u3-c)/p. This is the canonical leaf size, not a scene multiplier.

## Foliage orientations and colours

Construct a second unit sphere direction v2 using z=1-2*u4 and theta=2*pi*u5.
The outward ellipsoid gradient is G=normalize(v/R), with componentwise division.
World normal N=normalize(G+0.65*v2). This bounded perturbation retains outward
orientation while avoiding uniform leaf faces. Let U be the normalized
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
state `(seed+1009*groupIndex+65537*(j+1)) mod 2^32`. Map that draw to material slots
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

The base four-sample master contributes 3,264*128=417,792 triangles before wood.
The app uses the permitted eight-sample refinement: 3,264*256=835,584 near
triangles, or 3,264*32=104,448 distant triangles before wood. Sharing buffers reduces storage, not the number of
triangles drawn. This is an authoring reference, not an approved runtime budget;
LoD, visibility, export and performance implementation remain a separate stage.
Do not silently reduce the authored canopy to meet an assumed runtime budget.

Future model review must use the same constructed geometry in front, back, side,
top and three-quarter views. Check the bare trunk/branches first, the individual
leaf second, then the selected cluster's size hierarchy, depth, overlap and
outline, and finally the complete tree. Magnify forks, leaf rims and narrow tips.
Numeric completeness does not itself establish visual acceptance. Do not reopen
settled geometry as arbitrary tool defaults during that later implementation.

## Revision 2 visual calibration and verification

The original complete tree has overlapping foliage from the lower forks to the
apex, visible broad leaves and a filled side/top crown. The first numeric recipe
instead produced isolated tiny tip tufts. Revision 2 changes only foliage assembly;
leaf geometry, wood graph, colours, source pictures and whole-tree transforms stay
unchanged. This is an authored 3D interpretation, not a claim to recover hidden
geometry from pixels. Source-space regressions require at least 78% leaf coverage
inside fixed central crown ellipses in front, side and top projections, with at most
3,600 instances. A second oracle requires over 85% surface coverage in the central
80%-diameter ellipse of the first cluster from all three axes. The ellipses are conservative interior review windows, not visible
geometry or clipping masks. Actual Core views remain required to assess silhouette,
leaf overlap and the natural irregular perimeter. Revision 3 expands the Y validation envelope to match X for radial growth.
Near/far leaf prototypes retain 256/32 triangles and projected-error switching;
instance size participates in projected error. Wood fusion remains an open modeling
requirement independent of canopy density.

## Radial growth and individual variation - revision 3

The owner's three-dimensional growth instruction supersedes the flat endpoint
layout. The branch table is a shape scaffold (relative lengths, heights, parent
links and curve lifts), not the final XYZ coordinates. The original images still
define the Q-style leaf/wood character; they do not constrain branches to an
illustration plane. The seven-primary/thirteen-secondary scaffold remains, including B7 growing from
B11; revision 4 adds branches without adding a third level.

Use the same 32-bit LCG described above, with an independent growth stream seeded
by the supplied unsigned 32-bit seed (default 606). Iterate primary branches in
numeric ID order. Draw exactly three values u0,u1,u2 per primary; children consume
no growth draws. Let O=T(attachmentZ) for that primary and E0 its scaffold tip:

```text
phi = radians(25 + primaryIndex*137.507764 + (2*u0-1)*12)
delta = phi - atan2(E0.y-O.y,E0.x-O.x)
r = 0.90 + 0.20*u1
h = 0.94 + 0.12*u2
D = scaffoldEndpoint - O
E = O + (r*(cos(delta)*D.x-sin(delta)*D.y),
         r*(sin(delta)*D.x+cos(delta)*D.y), h*D.z)
transformedControlLift = h*controlLift
```

Each secondary inherits its primary ancestor's O,delta,r,h and transforms its own
scaffold endpoint with that transform. Its root is evaluated on the already
transformed analytic parent, never an old endpoint or nearest mesh vertex.
The trunk is unchanged. Leaf cluster centres follow these new curves. Foliage
random streams use the same supplied seed but remain independent of growth draws.
All shape variation is camera independent and repeatable for the same seed.
The validation envelope is now [-1.5,-1.5,0] to [1.5,1.5,3.55] m before requested
whole-tree scale. It is a limit, not a target size or clipping instruction.

The scene selects six fixed seeds and uniform whole-tree scales; this is separate
from branch generation. It constructs variants once per scene session. A batch
shares one near/far leaf prototype pair across all trees; changing view, zoom,
selection or panels does not regenerate branches or foliage. Tests check all four
quadrants, comparable XY wood spread, parent-root attachment, deterministic but
non-identical relative branch distances, scene height diversity, shared prototypes
and invariant construction work counts. Density tests still apply.

## Irregular branch additions and distributed foliage - revision 4

The owner rejected one terminal tuft per fixed radial spoke. After constructing
the revision 3 scaffold curves, grow real additional branches. Use an independent
LCG seeded with seed+104729 (uint32); all ranges below are uniform, inclusive for
integer counts and half-open for continuous values. Draw the added-primary count
N in [4,7]. For i=0..N-1 draw u and set attachment height
Z=0.95+(i+u)/N*(2.30-0.95). Then draw angle in [0,2*pi), horizontal reach [0.55,0.95],
rise [0.32,0.68], and control lift [0.03,0.12], in that order. Roots lie on the
actual trunk curve. Name these primary-i; level is 1.

For every primary (core numeric-ID order, then additions in creation order), draw
K in [1,2]. For each child j draw u and set parent parameter
t=0.35+(j+u)/K*(0.82-0.35). Draw side sign (- for u<0.5, + otherwise), divergence
angle [28,78] degrees, reach [0.22,0.45], rise [-0.04,0.24], then control lift
[0.03,0.12]. Add divergence to atan2 of the horizontal vector from root to parent
tip. Name secondary-PARENT-j. These are level 2 and never generate children.
There are 35..55 branches in total (excluding trunk), depending on the seed.

For all added branches, S=parent.at(t), E=S+(cos(angle)*reach,sin(angle)*reach,rise)
and C=(S+E)/2+(0,0,lift). Use the same quadratic curve and 1.2-exponent taper as
core branches. Primary root radius=min(0.055,0.82*parentRadius), secondary root
radius=min(0.032,0.58*parentRadius); tip=min(levelLimit,0.22*root), with levelLimit
0.007 or 0.004 respectively. Their roots consume the parent's analytic curve,
not sampled vertices. Curves are construction-local and generated once per tree.

Foliage uses a separate LCG seeded seed+130363. Start with the 23 core anchors,
weight=referenceCount*0.55. Append one interior cluster to each primary at uniform
t in [0.35,0.55], weight 48 and radii (0.42,0.42,0.45). Then append one outer
cluster to every added branch at uniform t in [0.72,0.90]; primary weight/radii
are 48/(0.42,0.42,0.45), secondary 32/(0.34,0.34,0.36). Every generated cluster
uses localOffset=(0,0,0.025) in its owner curve frame. Insert in branch creation
order; each insertion consumes exactly one random draw.

Normalize weights to totalInstances=3264. Floor each exact allocation; distribute
remaining leaves to descending fractional remainders, breaking ties by insertion
index. For each core cluster, multiply its reference radii by
sqrt(allocatedCount/referenceCount/1.25). This retains local overlap despite a
smaller allocation; new groups occupy real intermediate branch positions. The
same leaf sampling/material rules then apply to every cluster. No visible guide
ellipsoid, extra leaf mesh, camera condition or added global leaf budget is used.
Tests guard variable branch counts, depth/attachment, interior and outer foliage,
repeatability, projected overlap, shared near/far geometry and the total budget.

# Street Tree - Two-Level Branching

Updated 2026-10-25. The user selected the fuller bare-tree picture and delegated
remaining numeric construction decisions. The selected picture is unchanged.
Use [TREE-CONSTRUCTION.md](TREE-CONSTRUCTION.md) for formulas and
[tree-construction-spec.json](tree-construction-spec.json) for exact values.
Revision 4 distributes the scaffold radially and adds seeded primary/secondary
branches at varied heights, angles and lengths. The original appearance reference remains unchanged.

## Selected structure

[The selected bare tree](review/06-bare-tree-selected-v1.png) remains the sole
current bare-tree appearance reference. The simplified two-level v2 and the
all-primary draft are historical. The previous six-plus-six example is superseded.

The core scaffold has seven primary and thirteen secondary branches. Revision 4
adds 4..7 primaries plus 1..2 secondaries per primary, giving 35..55 branches in
total. One level-0 trunk supports the resulting level-1/level-2 graph. Level 2 is terminal. A parent continues beyond each child
attachment; multiple children on a primary are allowed. **B7 grows from B11**.
The numeric layout is an authored interpretation of the selected fuller tree;
hidden depth and exact coordinates are not measurements from the illustration.

The trunk is 2.55 m high, with 0.23 m base diameter and 0.024 m top diameter.
It uses the seven centreline stations in JSON and cubic Hermite interpolation.
Branch endpoints may be higher than the trunk. Their rounded caps extend past
the listed centreline endpoints by the local radius. Whole-tree maximum bounds
are 3.00 x 3.00 x 3.55 m before whole-unit scaling; never stretch geometry to fill them.

## Branch scaffold table

Scaffold coordinates and attachment heights are metres. These are not final
model endpoints: apply the radial-growth transform in TREE-CONSTRUCTION.md to
each primary subtree, then evaluate child roots on transformed parent curves. Secondary attachment t is the
parent's quadratic Bezier parameter, not arc length. The construction guide fixes
control-point lifts, tapered radii and local smooth-union junctions. Thus endpoint
coordinates alone are not an instruction to create straight sticks.

| ID | Level | Parent | Attachment | Endpoint (X, Y, Z) |
| --- | --- | --- | --- | --- |
| B1 | 1 | trunk | Z=1.00 | (-0.95, 0.30, 1.55) |
| B2 | 2 | B1 | t=0.55 | (-0.53, 0.48, 1.78) |
| B3 | 2 | B1 | t=0.76 | (-0.86, 0.13, 1.65) |
| B4 | 2 | B1 | t=0.38 | (-0.68, -0.12, 1.18) |
| B5 | 1 | trunk | Z=1.08 | (0.98, -0.28, 1.73) |
| B6 | 2 | B5 | t=0.62 | (0.68, -0.48, 1.88) |
| B7 | 2 | B11 | t=0.68 | (0.72, 0.48, 2.31) |
| B8 | 2 | B5 | t=0.78 | (0.91, -0.10, 1.43) |
| B9 | 1 | trunk | Z=1.43 | (-0.92, -0.20, 2.48) |
| B10 | 2 | B9 | t=0.34 | (-1.09, -0.34, 1.85) |
| B11 | 1 | trunk | Z=1.46 | (0.98, 0.22, 2.26) |
| B12 | 2 | B9 | t=0.52 | (-0.96, -0.04, 2.09) |
| B13 | 2 | B11 | t=0.43 | (0.37, 0.08, 2.35) |
| B14 | 2 | B11 | t=0.20 | (0.18, 0.38, 2.13) |
| B15 | 2 | B9 | t=0.72 | (-0.56, -0.12, 2.32) |
| B16 | 1 | trunk | Z=2.05 | (-0.48, 0.35, 2.72) |
| B17 | 2 | B16 | t=0.60 | (-0.30, 0.52, 2.66) |
| B18 | 1 | trunk | Z=2.37 | (0.26, -0.32, 2.66) |
| B19 | 1 | trunk | Z=2.43 | (0.16, 0.06, 2.93) |
| B20 | 2 | B19 | t=0.68 | (0.06, -0.10, 2.94) |

## Assembly and surface checks

Evaluate primaries before secondaries, each level in increasing numeric ID.
Evaluate roots on analytic parent curves, never the nearest mesh vertex.
Every child root is thinner than the local parent. Downward terminal twigs are
intentional; do not rotate them upward. The wood is one closed surface with
local smooth junctions, not intersecting capped cylinders or visible collars.
The base is flat at Z=0. Do not add root flares beyond the defined field, pots,
soil, terrain or a hidden base. All shape formulas are in the construction guide.

Colour and material are independently replaceable. Bark defaults to #806144,
roughness 0.94 and metallic 0. Reference shading is not baked into the material.

Numeric review checks the graph, local thickness, finite curves and bounds.
Later visual review must still inspect the actual model at overall and close-up
scales. Document review does not approve a future mesh, canopy or runtime LoD.

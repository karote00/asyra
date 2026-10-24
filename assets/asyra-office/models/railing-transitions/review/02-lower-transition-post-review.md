# Lower Transition Post - Accepted Reference Review

Date: 2026-10-07. The user accepted `02-lower-transition-post-v14.png`.
Scope: inspect the accepted single sheet and reconcile its direct geometry,
surface and review documents. No redraw, dimension change, model generation,
app implementation or commit is included.

## Current reference

The current sheet is v14, 1536 x 1024 pixels. It retains the original FRONT,
RIGHT, BACK, TOP, BOTTOM and THREE-QUARTER arrangement and the large annotated
front top-profile detail on one page. v3-v12 attempts, including the broken
shaft and split-sheet layouts, are superseded and are not construction inputs.
The numeric JSON remains the exact dimensional authority. The illustration
is an accepted appearance reference, not a calibrated engineering projection.

## Visual inspection

Reviewed the full sheet and a 140 x 108 pixel top region enlarged 6x to
840 x 648 pixels (`02-lower-transition-post-v14-top-inspection.png`). The crop
is inspection evidence only, not a second design sheet or a replacement layout.

- FRONT has a level left half and rising right half. BACK reverses the profile.
- RIGHT is an uninterrupted rectangle. TOP has a centre divider; BOTTOM does not.
- THREE-QUARTER shows six top perimeter corners and two quadrilateral faces
  joined along one shared edge. The high outer edge is straight, without the
  earlier extra kink; neither face collapses to a triangle.
- Enlarged inspection shows the low, shared and high depth edges with matching
  direction and extent within raster line thickness. This is a visual check,
  not proof of exact pixel or engineering tolerances.
- The complete post is continuous, with no added cap, pedestal or shaft break.
- Existing dimensions and default-colour caption remain present. Their numeric
  values agree with the JSON. Arrow positions and illustrated aspect ratios
  are schematic; see the geometry supplement for the height-datum clarification.

## Numeric specification cross-check

Units are metres; +Z is up, -Y is front, +X is right. The origin is the bottom
footprint centre. The ordered XZ polygon is (-0.02,0), (0.02,0), (0.02,0.91),
(0,0.90), (-0.02,0.90), extruded across Y=-0.02..0.02.

- Bounds: 0.04 x 0.04 x 0.91 m.
- Low and centre top heights: 0.90 m; high top height: 0.91 m.
- Left top: Z=0.90; right top: Z=0.90+0.5X, with no slope across Y.
- Each half has 0.02 m horizontal run and 0.04 m depth. The sloped half rises
  0.01 m, giving 26.5650511771 degrees and length 0.0223606798 m.
- The low, shared and high depth edges all have vector (0,0.04,0).
- Ten vertices, seven polygon faces and sixteen triangles form a closed solid;
  no bevel, cavity, additional part or subdivision is specified.
- Level rail origin (-0.30,0,0.90) and sloped rail origin (0,0,0.90) keep their
  undersides in contact with the corresponding top halves. Vertical rail end
  faces meet at X=0, Z=0.90..0.94.

## Replaceable appearance

Default sRGB colour remains #383A38, metallic 0.15 and roughness 0.80. Colour
and material overrides remain independent of geometry. Review grey #C8CCD0,
contour lines, guides and image shading must not become baked model details.

## Documentation corrections

The gallery now selects v14 only. Obsolete v9/v11 current-version claims,
shaft-break presentation and split-sheet instructions have been removed from
the active handoff. The geometry supplement clarifies exact depth edges and
height annotations. The accepted redraw's actual prompt is recorded in
PROMPTS.md. Numeric JSON values and the accepted image remain unchanged.

This review covers drawings and specifications only. It does not claim a
Blender model, mesh export or app rendering has been validated.

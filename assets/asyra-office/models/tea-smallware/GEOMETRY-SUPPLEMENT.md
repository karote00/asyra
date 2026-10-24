# Tea Smallware - Geometry Supplement

## Coordinates

Metres, +Z up, -Y front. Saucer origin is at its axis on the bottom plane. Spoon origin is the centre of its plan bounds on the lowest exterior plane. Spoon bowl points toward -Y and handle toward +Y. All dimensions in JSON are final values rather than measurements extracted from the pictures.

## Saucer

Revolve the ordered closed (radius,Z) JSON profile around Z with 96 equal angular segments. Close the last profile point back to the first. Collapse each radius-zero ring to one vertex; connect other adjacent rings with quads. No duplicate axis cylinder or extra solidify operation.

The bottom contact disk has radius 0.0325 at Z=0. Its upper central well is flat at Z=0.003 to radius 0.0325. The rim slopes upward through the specified profile vertices to maximum radius 0.065 and height 0.012. Outer lip chamfers are already defined; add no extra bevels, foot ring, decorative groove or cup-sized recess.

Smooth circumferential normals; retain profile creases. Underside is fully closed ceramic. Front/right/back have the same silhouette. The drawn inner circle indicates the slope transition, not a painted line.

## Teaspoon

Build one continuous closed shell using JSON stations (Y, half-width, top-centre Z). Linear interpolation between stations defines the longitudinal shape. Subdivide each station interval into ceil(intervalLength/0.001) equal steps, preserving every listed station exactly.

At each positive half-width w, sample X uniformly from -w to +w using 24 intervals. Define top surface Z = centreZ + (0.005-centreZ)*(X/w)^2. Bottom surface is top Z minus 0.001. This specifies a real concave bowl and its convex underside, with constant vertical thickness. The central bowl minimum top Z is 0.001 and exterior minimum Z is 0. The rim and handle top remain at 0.005.

At the bowl tip Y=-0.06, half-width is zero: use one top vertex and one bottom vertex, then triangle fans to the next rows. Do not divide by zero or produce degenerate quads.

The handle remains half-width 0.0035 from Y=-0.020 to +0.0565, top Z=0.005 and bottom Z=0.004. Complete its rounded end with a semicircle in plan centred at (0,0.0565), radius 0.0035, from right edge to left edge through positive Y. Sample 16 equal arc intervals. Triangulate the end top and bottom faces and connect the boundary with side faces. Maximum Y=0.060 gives total length 0.120.

Join adjacent top rows and bottom rows consistently, and close all perimeter sidewalls. The bowl-to-handle transition shares vertices; do not overlay a separate bowl and handle. No cut seam, embossed rim, logo or additional grooves. Smooth normals across longitudinal station transitions and across each surface, keeping the thin rim side boundary distinct. No extra bevel or subdivision may change the bounds.

The listed stations deliberately determine the final silhouette; the drawing is not a scan of that mesh. A single inset drawing contour explains concavity, not an engraved ring.

## Views and future acceptance

Saucer: front, right, back, top and oblique. Spoon: top, bottom, right, front end-on and oblique. Spoon bottom must include the bowl back; front end-on is a short shallow bowl-width profile. Do not treat the long top silhouette as the front elevation.

After separate modeling authorization, check bounds within 0.0002 m, saucer well/rim and closed underside, spoon length/width/thickness, connected concave shell without holes, five views and no baked lighting. No models have been made or verified. Placement, contact behavior and interactions belong to the app.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Saucer and spoon

Saucer extent is 130 x 130 x 12 mm; the 65 mm diameter central well has a 3 mm floor. A cup is not included. Spoon extent is 25 x 120 x 5 mm, with exactly 1 mm vertical shell thickness and a bowl-floor exterior at Z=0. The handle ends at Y=60 mm after its radius-3.5 mm semicircle. Zero-width tip rows collapse separately on top and bottom, never into one zero-thickness vertex pair shared across the shell.

Ceramic and spoon metal remain independent replaceable defaults. LoD preserves saucer profile stations, spoon outline stations, concavity, one continuous handle connection and true shell thickness. Intermediate longitudinal subdivisions can be reduced; fixed station positions cannot. No painted inner contour is extra geometry.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

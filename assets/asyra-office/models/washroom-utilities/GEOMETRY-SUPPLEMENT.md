# Geometry Supplement

## Shared rules

Metres, +Z up, -Y front, +X right. Each origin is specified below. Numbers are authored design decisions. See the [numeric specification](washroom-utilities-model-spec.json) for exact part data.

Cylinders have closed flat caps and the stated radial segmentation. Revolutions join consecutive profile points linearly, use smooth side normals and flat end faces, and collapse radius-zero rings into axis vertices. No subdivision or unspecified bevel.

## Empty paper holder

Origin: rear mounting disk center on wall plane Y=0. Exactly one disk on the left and one continuous bent rod.

The disk is radius 0.025, extending from Y=0 to -0.008. Use 64 radial segments. The rod has radius 0.006 and follows centerline points (0,-0.008,0), (0,-0.080,0), (0,-0.080,-0.018), (0.120,-0.080,-0.018), (0.120,-0.080,0). This adds the short downward neck shown between the projecting arm and spindle.

Replace all centerline right-angle corners with tangent arcs of radius 0.006. Each arc uses 16 equal angle segments; sample the rod cross-section with 48 vertices and transport the cross-section frame continuously along the path. Cap both free path ends. The arm's first cap touches the disk front; the final cap faces upward. Do not add a second mount, cover, spring, screw, or decorative tip.

Bounds: X=-0.025 to 0.126, Y=-0.086 to 0, Z=-0.025 to 0.025. The mounting disk sets the total 0.050 height. The rod and disk may remain separate closed solids in one placeable assembly.

The existing 0.100-wide paper roll can center at (0.060,-0.080,-0.018), axis +X. Its bore radius is 0.017, leaving clearance around the radius-0.006 spindle. The straight spindle lies between the tangent positions X=0.006 and 0.114. This positioning note does not bundle the roll into the holder or implement placement behavior.

## Soap pump bottle

Origin: center of bottom contact face. Revolve the closed radius/Z profile in JSON about Z with 96 angular segments. The body diameter is 0.070; its bottom is flat, shoulders taper into a neck, and the top closes at Z=0.145. This is a simplified opaque display body, not a functional fluid container.

Separate parts:
- Sage collar: radius 0.017, Z=0.145 to 0.153.
- Sage stem: radius 0.005, Z=0.153 to 0.171.
- Sage round head: radius 0.014, Z=0.171 to 0.180.
- Sage nozzle: capped cylinder, radius 0.006, extending from Y=0 to -0.045 at X=0, Z=0.172. Use 48 radial segments.
- Downward outlet tip: radius-0.0035 cylinder at X=0, Y=-0.040, Z=0.161 to 0.168, intersecting the nozzle. Subtract a radius-0.002 blind recess from Z=0.161 to 0.166 with 32 radial segments, leaving a closed roof. There is no forward-facing hole.

The nozzle overlaps the head as a joined pump assembly. Keep these parts addressable for future app use, but do not add internal springs, tubes, liquid, or animation. No opening or pouring state is delivered.

Complete bounds: X +/-0.035, Y=-0.045 to 0.035, Z=0 to 0.180. The nozzle points forward (-Y) in every view. The caption's 0.070 diameter describes the bottle body; total depth including nozzle is 0.080.

## Views and future acceptance

FRONT looks along +Y; RIGHT along -X; BACK along -Y; TOP along -Z with +Y upward. Oblique views are illustrative. Occlusion must not create additional parts.

Future model review checks bounds within 0.0005, the holder's single mounting disk and continuous rod, fit with the separate paper roll, real nozzle outlet recess, closed bottom/back surfaces, and separate pump parts. Check all views and close details. No model, fit simulation, or runtime behavior has been validated at this stage.

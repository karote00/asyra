# Fridge Accessories - Geometry Supplement

## Coordinates

Metres, +Z up, -Y front. Unlike floor-standing units, both origins are the centre of the rear mounting face on Y=0. Front is viewed from -Y, right from +X, back from +Y and top from +Z. Objects extend toward negative Y from the mounting plane.

## Note sheet

One closed axis-aligned box, full size X=0.055, Y=0.0002, Z=0.070, centre (0,-0.0001,0). Corners are square; no bevel, curl, folded corner, layered stack, adhesive strip or hidden reinforcement. Front and back are blank pale yellow. All four thin edges use the same paper material.

The right and top views exaggerate thickness for legibility; actual thickness is exactly 0.0002. Do not derive a thicker cardboard object from those edge strokes. No painted border.

## Complete magnet

Revolve the ordered closed (radius,Y) profile in JSON around Y with 96 equal angular segments. For angle theta use X=r*cos(theta), Z=r*sin(theta). Close the profile to its first point. Collapse each zero-radius ring to one vertex, join adjacent nonzero rings with quads and form triangle fans at axis vertices. Keep outward normals; smooth circumferential sides and flat front/back disks. No additional bevel.

Profile indices are zero-based. Segments 5->6 and 6->7 form the charcoal backing side and rear disk. Every other visible segment is sage. The backing diameter is 0.014 and extends from Y=-0.0008 to Y=0. Sage housing reaches radius 0.009 and front Y=-0.005. Its front and rear outer edges have 0.0003 straight chamfers. One continuous exterior uses face material assignments; do not overlay two coplanar disks.

The initial prompt requested flush backing. The selected drawing instead shows a small rear projection. Final specification deliberately uses 0.0008 projection and 0.0042 housing depth, preserving total depth 0.005. This is an authored completion pending review. No spring, socket, lettering or separate mounting plate.

Front is a plain sage circle; rear is a charcoal circle within a sage annulus. Right and top show the projected charcoal backing. No physical magnetic simulation or attachment mechanism is specified.

## Placement example and future acceptance

A note rear face can lie on a vertical receiving plane at Y=0. A magnet placed over it would put its rear face at Y=-0.0002, with any chosen X/Z offset within the paper. This explains thickness only; it is not app snapping behavior or a bundled arrangement.

After separate model authorization, verify note dimensions within 0.00002 m and magnet dimensions within 0.0001 m, closed surfaces, correct blank backs/materials, five views and no baked lighting. No model has been generated or validated in this batch.

# Wooden Wall Peg - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front and +X right. Origin is the centre of the rear mounting disk, not a bottom-plane origin. The peg projects along -Y. Apply identity rotation and unit scale.

Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. Top/bottom can use matching screen-up orientation because the object is rotationally symmetric. Numerical dimensions govern reconstruction; views are uncalibrated appearance drawings.

## Single surface of revolution

Let d be distance outward from the wall, so Y=-d. Revolve the following distance/radius profile around -Y:

| Ring                  | d     | Radius |
| --------------------- | ----- | ------ |
| Rear base edge        | 0     | 0.030  |
| Base front outer edge | 0.012 | 0.030  |
| Base front inner edge | 0.012 | 0.009  |
| Stem front edge       | 0.045 | 0.009  |
| Head rear outer edge  | 0.045 | 0.018  |
| Head front edge       | 0.055 | 0.018  |

For each ring create 64 vertices using X=r*cos(a), Y=-d, Z=r*sin(a), where a=2*pi*k/64. Join neighboring rings with quads. Close the rear and front disks with centre triangle fans. Do not add internal disks where the stem joins the base or head.

This defines a base diameter of 0.060 and thickness 0.012, an exposed stem diameter of 0.018 and length 0.033, and a head diameter of 0.036 and thickness 0.010. Total projection is 0.055.

Bounds: X=-0.030..0.030, Y=-0.055..0, Z=-0.030..0.030. The rear cap is completely flat and closed. The front sees the base outer circle and head outer circle; the stem is hidden. The back sees only the base disk.

Use outward winding, smooth normals around cylinders and flat normals on caps/annuli. Keep profile corners sharp. No bevel, subdivision, curved hook, hole, screw, grain relief or separate fitting.

## Placement reference

The back disk lies at Y=0. Place the origin directly on the desired wall surface and rotate the entire object so its -Y axis points away from the wall. The origin Z is the mounting centre height.

The app controls placement, item attachment and any interaction. No load simulation, mounting hardware or hanging garment is specified.

## Future acceptance

After model authorization, verify profile dimensions within 0.0002 m, closed caps, one-unit boundary and absence of internal junction faces. No reconstruction, export or runtime validation has occurred. No alternate LOD mesh is included.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Mount and head

Default overall size is 60 x 55 x 60 mm about the rear-centre origin. Base/stem/head diameters are 60/18/36 mm; axial lengths are 12/33/10 mm. One continuous revolved exterior has no internal caps. A 64/32/16-sector construction has 768/384/192 triangles respectively when using two centre-fan caps; these are analytic topology counts, not exported model measurements. All profile stations and both closed caps remain in every tier. Wood is a replaceable default, not a restriction on material type. Scale the mounting plane and head offset together; origin remains on the wall.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

# Geometry Supplement

## Shared coordinates

Metres, +Z up, -Y toward the viewer, +X right. Both origins are at the center of the rear mounting plane, not at the floor. A wall would lie on Y=0; the component projects toward negative Y. No wall belongs to either component.

The [JSON specification](washroom-accessories-model-spec.json) contains exact part geometry. Dimensions are authored decisions. Generated views are not calibrated measurements.

Rounded rectangles lie in XZ, centered on X=Z=0. Width and height are full dimensions; corner radii are circular. Use 16 equal angular segments per quarter corner and straight sides. Extrude along Y. Cylinders have 64 radial segments and closed flat caps. Smooth curved sides; do not subdivide, add bevels, or change bounds.

## Wood-framed mirror

Overall bounds: X +/-0.200, Z +/-0.280, Y=-0.025 to 0.

The frame is an extruded rounded rectangular ring:

- Outside: width 0.400, height 0.560, corner radius 0.040.
- Inside aperture: width 0.350, height 0.510, corner radius 0.015.
- Both are concentric. Their difference creates a constant 0.025 border, including corners.
- Extrude the ring through the entire Y depth.

The pane fills the inner aperture from Y=-0.020 to -0.017. Its front is recessed 0.005 from the frame's front. The backing fills the same aperture from Y=-0.005 to 0, producing a flat wooden rear surface together with the frame. The remaining internal space is empty.

Keep frame, pane, and backing as separate parts within one placeable assembly. Shared boundaries meet without clearances or overlap. Use closed solids for all three parts. No mounting hooks, screws, trim, illumination, or wall geometry. Use the intrinsic grain recipe without relief or decorative join grooves.

The pale blue-gray field is an unlit review representation of the mirror. Do not model a reflected room or paint diagonal shine marks onto it. Runtime reflection behavior belongs to the application.

## Towel rail

Overall bounds: X +/-0.230, Y=-0.080 to 0, Z +/-0.025.

Exactly five closed cylindrical parts:

- One horizontal crossbar, radius 0.010, from X=-0.230 to +0.230 at Y=-0.070, Z=0.
- Two arms, radius 0.008, at X=-0.200 and +0.200, Z=0. Each extends from Y=-0.008 to -0.070.
- Two mounting disks, radius 0.025, at those same X/Z centers, extending from Y=0 to -0.008.

Arms penetrate the crossbar up to its centerline so the joints do not leave gaps. Keep the primitive parts addressable inside one assembly; a later model can union them without changing the exterior. No decorative collars or separate end caps: the crossbar's own flat faces close its ends. No towel, holes, fasteners, or wall.

Front shows the horizontal bar with mounting disks behind it. In the right view both mounts overlap; do not add a third support to explain occlusion. Back shows the disk faces; top shows the horizontal bar and two arms.

## Views and future review

FRONT looks along +Y; RIGHT along -X; BACK along -Y; TOP along -Z, with +Y upward. THREE-QUARTER is illustrative from (+X,-Y,+Z). Resolve drawing perspective or occlusion ambiguity through the numeric specification.

Future model acceptance checks: overall bounds within 0.0005 m, mounting plane at Y=0, closed solids, correct part counts, pane recess, flat backing, rail projection, and absence of baked lighting or attached props. Verify front, side, top, rear, and close views. No model or reflection behavior has been validated in this drawing stage.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Frame and mounting

Mirror extent is 400 x 25 x 560 mm, outer corner radius 40 mm and aperture radius 15 mm. The 25 mm border is constant, including rounded corners. Pane front is Y=-20 mm, 5 mm behind the frame front. Backing spans Y=-5..0 mm; the hidden air gap is 12 mm between backing and pane, bounded laterally by the frame. Keep the pane aperture closed by the pane, without adding glass thickness a second time.

Towel rail is 460 x 80 x 50 mm. Its bar radius is 10 mm, wall-arm radius 8 mm and mounting disk radius 25 mm. Five construction solids intentionally meet/intersect; remove hidden intersection faces in a welded static output, retaining named regions. The separate towel's 10 mm inner fold radius fits this default bar exactly; scale both coherently if retaining that fit.

LoD retains the frame recess, pane, two mounts and rail clearance. Frame/backing wood, mirror pane and metal remain replaceable; app reflections are not baked into the reference.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

# Mini Spinning Top - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front and +X right. Origin is the centre of the bottom tip disk at Z=0. Apply identity rotation and unit scale. The shape is rotationally symmetric about Z.

Front looks along +Y, right along -X, back along -Y, top along -Z and bottom along +Z. The three elevations have identical geometric silhouettes. Generated drawings are uncalibrated; numerical dimensions override pixel proportions.

## Single closed surface of revolution

Revolve the following ordered radius/Z profile around Z using 64 equal angular segments, starting at angle zero on +X:

| Ring | Radius | Z | Surface to next ring |
| --- | --- | --- | --- |
| 1 | 0.001 | 0 | Sage conical underside |
| 2 | 0.030 | 0.025 | Sage vertical rim band |
| 3 | 0.030 | 0.030 | Sage horizontal upper annulus |
| 4 | 0.006 | 0.030 | Wood-colored handle cylinder |
| 5 | 0.006 | 0.070 | End of profile |

Join adjacent rings with quads. Close ring 1 with a flat sage disk and ring 5 with a flat wood-colored disk, using centre triangle fans. All winding faces outward. This produces one closed exterior mesh without internal caps at the body/handle junction.

Bounds: X and Y=-0.030..0.030, Z=0..0.070. The handle is 0.012 in diameter and its exposed height is 0.040. The underside is a straight truncated cone, not a curved bowl. Its tiny bottom contact disk is 0.002 in diameter; there is no extra foot or nub.

The top annulus is flat at Z=0.030. The rim band is 0.005 high. No edge rounding, bevel, subdivision, cavity, seams, grooves, stripe, logo or extra insert.

Smooth normals around the rotational axis on the cone and cylinders. Keep the profile boundaries sharp; use vertical normals on the horizontal disks and annulus. Use the material assignments in the table; the transition to wood occurs at the handle base.

## Hidden surfaces and unit boundary

The bottom view is a sage circle with the tiny contact disk visible at its centre. The handle is occluded. The top view is a sage circle with the wood-colored handle top at its centre.

Body and handle are parts of one toy, not separately placeable catalogue items. No stand or display base is implied by the upright drawing. The app decides placement and any future motion.

## Future acceptance

After model authorization, verify bounds within 0.0002 m, all profile rings, closed caps, material boundaries and absence of the rejected extra bottom nub. No reconstruction, export or runtime verification has been performed. Alternate LOD meshes, rigging, rotational animation and physics are outside this handoff.

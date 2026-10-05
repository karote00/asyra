# Wall Decoration - Geometry Supplement

## Coordinates and authority

Use metres, +Z up and -Y toward the viewer. The rear attachment plane is Y=0, with all thickness extending toward -Y. Clock origin is the rear centre; wallpaper origin is the rear bottom centre. Dimension order is X/Y/Z. JSON values are normative. Preserve separate clock hands; wallpaper is one closed six-face box per unit.

Camera directions: front from -Y, right from +X, back from +Y, top from +Z, oblique from (1,-1,0.8). Aim at the clock origin or the wallpaper face centre. Views may have different display scales; do not derive scale from their pixel bounds. Underside and left side are fully defined below even without separate pictures.

## Round wall clock

Overall bounds are X/Z +/-0.30, Y=-0.055 to 0. Housing is a Y-axis circular cylinder radius 0.30, from Y=-0.04 to 0. The annular front rim has outer radius 0.30, inner radius 0.273, Y=-0.055 to -0.038. Bevel circular edges inward by 0.002 with three segments, without expanding bounds. Use 128 radial segments for these parts. Internal overlaps between static housing/rim/dial are intentional and may be unioned for export; preserve all visible surfaces.

The ivory dial is a filled cylinder radius 0.274, Y=-0.043 to -0.039. Its outer 0.001 m is covered by the rim, avoiding a visible perimeter gap. Rear is the plain solid housing cap at Y=0. No battery recess, keyhole, bracket, screw, glass, logo or raised decorative seam is specified. This unseen back is a deliberate simplified completion.

Create exactly twelve dark capsule-shaped marks at a centre radius of 0.239. Each has radial length 0.029 including end caps, tangential width 0.008, and extrusion Y=-0.045 to -0.043. Each end cap is a semicircle radius 0.004 with eight segments; the straight centre segment has length 0.021. Mark angle is k*30 degrees for k=0..11, measured clockwise from +Z in the front view. For local tangential/radial coordinates (t,r), transform X=t*cos(a)+r*sin(a), Z=-t*sin(a)+r*cos(a). Add the radial centre offset before transforming. Include all marks even where a hand partly obscures one.

Hands use the closed polygons and extrusion intervals in JSON. Coordinates are tangential/radial about their pivot; apply the same transform. Pose the hour hand at 47.5 degrees and minute hand at 210 degrees (1:35). Apply a 0.0005 m edge bevel with two segments without expanding polygon bounds. The hour hand spans Y=-0.048 to -0.046, minute hand -0.051 to -0.049. Centre pin radius is 0.012, Y=-0.053 to -0.043; bevel its circular edges by 0.001 with three segments and use 48 radial segments. There is no second hand. A sheet's approximate hand angle does not replace these fixed angles.

Front-most extent is the rim at -0.055; hands and pin stay behind that lip. Hand pivots are documented for later app use, not an animation deliverable. The clock has no floor or wall geometry. Body curvature continues identically around its top, bottom, left and right.

## Wallpaper - one strip per unit

Vertical: X=-0.20..0.20, Y=-0.001..0, Z=0..1.20. Horizontal: X=-0.60..0.60, Y=-0.001..0, Z=0..0.40. Six planar faces, sharp corners, zero bevel, no backing board, no adhesive mesh, no curled edges. This is decorative paper, not a wall segment.

For front UV coordinates u=(X+width/2)/width, v=Z/height, assign sage to 0.25 <= u < 0.75 on the vertical strip and 0.25 <= v < 0.75 on the horizontal strip. Assign cream elsewhere. Back, top, bottom and side faces are entirely cream. Front normal is -Y; back normal is +Y. All faces opaque.

Thus the vertical face has cream/green/cream widths 0.10/0.20/0.10 m, while the horizontal face has cream/green/cream heights 0.10/0.20/0.10 m. Two adjacent half-bands form one full cream band. The seam has no gap, overlap, raised line or bevel. A material boundary has no depth. The horizontal variant rotates the motif, not an entire wall assembly.

One physical strip includes one motif. Material colour slots allow later solid-colour variants without changing geometry; the delivered sheets show only the sage/cream version. Placement count, slicing around openings, stacking, host-wall clearance and avoiding coplanar surfaces belong to the app. No hard-coded scene offset or underlying asphalt/wall is included in this asset.

## Future model acceptance

After modeling is separately authorized, compare the same mesh from all five sheet directions and inspect the hidden faces. Required checks: specified bounds (clock tolerance 0.001 m; paper tolerance 0.0001 m), clock centre origin and paper bottom-centre origin, twelve marks, two separate hands, plain rear, correct band ratios, exactly one strip, no wall or shadow plane, and no baked lighting. Paper thickness must remain 0.001 m even if a sheet makes its silhouette look thicker. No such model checks have been run in this drawing-only batch.

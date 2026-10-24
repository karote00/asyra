# Roadside Bollard - Recolour and Document Review

Status: v3 proportion correction approved by the user; local commit authorized. Earlier review sections below are historical. No push authorized.

Current sheet: [revised v3](02-roadside-bollard-v3.png).
Historical recolour: [v2](02-roadside-bollard-v2.png).
Original: [v1](02-roadside-bollard-v1.png).

## Scope

The user requested explicit defaults, a lighter review drawing and supplemented
construction documents. The original raster was edited with imagegen. The
five-view layout, labels and dimension values remain; no model was generated.
The numeric primitives, bounds and shared metal default are unchanged.

## Editing instruction

Recolour only the original five-view sheet: shaft target #D7E0E6, collar target
#9DADB9, finial target #BCCBD5. Keep outlines, silhouettes, typography, view
positions, dimensions and white background. TOP remains one finial disk.
Retain the title and add `REVIEW COLOURS ONLY - DEFAULT METAL: #383A38 -
CYLINDRICAL SHAFT` below the height subtitle. Do not add panels, shadows or
other parts. Preserve the original form cues without baking them into materials.

## Review

Inspected original and result at native 1536 x 1024. The result retains five
views and the visible cylindrical shafts, collars and spherical finials; all
original dimension labels remain readable. TOP remains a single circle. The
new header separates the runtime default from the review palette. This is a
visual edit review, not a claim of pixel-identical geometry or calibrated scale.

Recomputed numeric construction: 480 mm total height; shaft diameter 45 mm,
construction height 404 mm and exposed height below collar 400 mm; collar
diameter 58 mm and height 21 mm; finial diameter 65 mm and centre Z=447.5 mm.
Overlaps are 4 mm at shaft/collar and 6 mm at collar/finial. The top collar
shoulder surrounds the sphere's 18.8148877 mm cross-section radius, out to
29 mm. Bounds remain 65 x 65 x 480 mm. No gap or added base is specified.

Default metal #383A38, metallic 0.15 and roughness 0.80 apply to all three
regions, with opacity 1 and emission 0. The JSON and surface recipes now define
independent region overrides, precedence, union ownership and instance isolation.
Review colours and shading are not runtime material input. The approved street
sign is unchanged. Final model geometry, normals and LoD require later validation.

## Subsequent review - drawing/specification mismatch

The earlier review checked recolouring and numeric self-consistency but missed
within-view proportions. This is a failed construction-reference review, not a
pass excused by the word "illustrative". Do not model from this handoff until
the original appearance and the numeric specification have been reconciled.

At native 1536 x 1024 resolution, scan dark contours in the FRONT object region.
At Y=350 the shaft spans X=292..359 (68 px including outlines). At Y=195 the
v2 sphere spans X=284..367 (84 px). Its overall vertical extent is approximately
Y=156..510 (355 px). Thus height/shaft is about 5.22, versus 480/45=10.67 in
the specification. Sphere/shaft is about 1.24, versus 65/45=1.44. Antialiasing
and outline thickness cannot account for these differences. Original v1 shows
essentially the same inconsistency: 353 px overall height, 68 px shaft width
and 83 px sphere width at the same scanlines. The recolour inherited the issue.

The FRONT bottom is visibly elliptical, so this is not a strict level front
orthographic projection. Do not infer exact 3D dimensions from that drawing
without defining its camera. The height dimension's upper extension also lies
below the sphere's highest visible point. These drafting issues must be resolved
alongside the proportions. Different scale between TOP and FRONT is not itself
a shape error; the failed ratios above are measured within FRONT.

Default metal and override rules remain consistent, as do numeric overlap and
bounds calculations. Geometry values and images were not changed in this review.
Required next correction: reconcile dimensions to the original intended form,
then produce consistent projected views and correctly attached dimensions.
Do not silently choose a thinner form merely to satisfy the existing numbers.

## Authorized correction plan

Preserve the original compact silhouette and total height 480 mm. Use the v1
FRONT contour widths and vertical landmarks as proportional design evidence,
not its former diameter labels. Set rounded construction dimensions: shaft
92 mm diameter, collar 110 mm diameter and sphere 112 mm diameter. Set the
collar bottom at Z=340 mm and top at Z=374 mm; retain 4 mm shaft embed and
6 mm sphere embed. This yields shaft Z=0..344 mm and sphere centre Z=424 mm.
These values replace the inconsistent narrow dimensions, not the original form.

Author a deterministic five-view reference drawing from these primitives. Use
level orthographic FRONT/RIGHT/BACK, true TOP and an elevated orthographic
THREE-QUARTER view at a common scale. Preserve the original three-over-two
sheet arrangement, review palette and default-colour note. Numeric projection
changes to remove the original illustrative ellipses are intentional. Do not
edit or export a Blender model, runtime code, other assets, commit or push.

Self-review gates: all view inputs share the revised JSON; recompute extents,
overlaps and ratio agreement to v1; inspect the full sheet and joins at native
resolution; verify arrows target total extents; ensure current links and material
contracts are consistent. Original v1 and recoloured v2 remain historical evidence.

## V3 correction result

The current dimensions are 480 mm overall height; shaft diameter 92 mm and
construction height 344 mm; collar diameter 110 mm and height 34 mm; sphere
diameter 112 mm at centre Z=424 mm. Collar Z=340..374 mm. Embeds remain 4 mm
and 6 mm. Sphere/collar intersection radius is 25.2190404 mm. The exposed
shaft is 340 mm high. These supersede the previous numeric construction.

| Ratio | Original v1 contour evidence | Revised specification | Relative change |
| --- | --- | --- | --- |
| Total height / shaft diameter | 5.19118 | 5.21739 | +0.505% |
| Sphere diameter / shaft diameter | 1.22059 | 1.21739 | -0.262% |
| Collar diameter / shaft diameter | 1.19118 | 1.19565 | +0.376% |

A deterministic drawing source projects cylinders and the sphere directly from
JSON. All five views share one scale; level orthographic FRONT/RIGHT/BACK have
straight bottom edges. Original tilted/illustrative edge shapes are not copied
into physical geometry. TOP is the sphere's single disk; THREE-QUARTER shows
the annular shoulder and round shaft. The final handoff remains one complete
sheet with original three-over-two arrangement, labels and numeric annotations.

Native-resolution inspection caught the misleading draft table label "Shaft box
height"; it was corrected to "Shaft construction height" before handoff. The
shaft is cylindrical. Source-reference ratios, joins, default appearance and
current links were rechecked. The approved street-sign contract is unchanged.
The review applies to the reference and specification, not a built model.

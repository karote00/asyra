# Manhole Reference - Drawing and Specification Review

Date: 2026-10-07. Scope: existing reference versus its current numeric and prose
specifications. The original source image is unchanged; a separate annotation sheet is added. No model or runtime validation.

## Evidence

Original: `05-manhole-cover-v2.png`, 1536 x 1024 pixels, unchanged.
Inspection crops use original pixel coordinates (left, top, right, bottom),
resized 2x for inspection only. Enlargement adds no source detail.

| View | Original crop | Inspection size | Evidence |
| --- | --- | --- | --- |
| TOP | (910,85,1420,585) | 1020 x 1000 | [Top detail](05-manhole-inspection-top.png) |
| THREE-QUARTER | (120,175,685,510) | 1130 x 670 | [Oblique detail](05-manhole-inspection-quarter.png) |
| FRONT | (110,735,710,870) | 1200 x 270 | [Low-angle detail](05-manhole-inspection-front.png) |

These are inspection crops, not alternative designs or replacement references.

## Findings and proposed ownership

1. **Slot count - correct the review documentation, not the drawing.** TOP has
   six slots at approximately 12, 2, 4, 6, 8 and 10 o'clock. THREE-QUARTER also
   has six. The earlier statement that TOP has four was a review error. The
   existing count 6 and 60-degree spacing need no change on that basis.
2. **Ring topology - resolved by the user; correct the specification.** The
   centre disk is raised; count outward annuli as rings 1 to 4. Rings 2 and 4
   are raised, rings 1 and 3 are flat at the base plane. Replace the former
   narrow concentric-groove interpretation, retaining the original image.
   Numeric boundaries and edge treatment are now specified in the supplement.
   Rounded radii follow original TOP proportions; height and bevel are authored
   decisions, not dimensions uniquely recovered from pixels.
3. **View labels - clarify camera meaning.** FRONT exposes the top surface,
   while SIDE is near edge-on. This demonstrates differing camera elevations,
   not necessarily different solids. Keep FRONT as a low front oblique reference
   in documentation. If an orthographic sheet is required later, correct the
   camera/label rather than altering the object to reproduce that projection.
4. **Dimensions - retain base values, distinguish added relief.** Diameter
   0.66 m, frame height 0.026 m, cover base-body thickness 0.020 m, radial gap
   0.004 m and base-plane recess 0.001 m remain. Slots leave 0.018 m of body.
   Raised regions mean the former cover-top Z is now the base-plane Z;
   the specified 0.001 m rise brings raised regions to Z=0. The cover maximum
   thickness is 0.021 m; assembly height remains 0.026 m.
5. **Separation - expressly confirmed by the user.** Cover and outer frame
   must remain independently movable closed solids with a real annular gap.
   Do not join them with shared vertices, bottom faces or fill geometry.
   No hinge, support ledge or runtime opening interaction is prescribed.
6. **Surface - outside current shape review.** The mottled appearance is not
   evidence of additional cracks, cutouts or geometric displacement. Existing
   replaceable iron and iron-worn material defaults remain unchanged.

## Result

Correct the documents' concentric-groove interpretation using the user-confirmed
alternating raised/flat topology. Keep the original drawing and six recesses.
The topology question is resolved. The supplement and JSON now fix all five
ring boundaries, common rise and relief edge treatment for model construction.
These authored dimensions are not a claim of exact geometric recovery from a
raster reference, nor evidence that a model has been built or validated.
No model generation or runtime validation is part of this documentation review.

## Dimensioned sheet review

Current handoff: [05-manhole-dimensioned-v2.png](05-manhole-dimensioned-v2.png).
The user approved the earlier annotated v1 topology and accepted the proposed
numeric dimensions on 2026-10-07. The new v2 annotation layout was self-reviewed and subsequently approved by
the user on 2026-10-07; the user authorized committing the completed documents. Original v2 remains unchanged as the appearance source;
annotated v1 is historical approval evidence, not the current numeric handoff.
The built-in image tool output is not pixel-identical to its source or a
calibrated orthographic drawing.

Reviewed the final 1536 x 1024 sheet for:

- Six recesses in each upper view; unchanged C/1/2/3/4 radial order.
- C/2/4 and frame top aligned at Z=0; 1/3/outer field at Z=-1 mm.
- Independent frame extending below the cover; visible empty 4 mm nominal gap.
- Cumulative boundary radii shown as one plain note, not chained band widths.
- Frame R330/R290, cover R286, heights 26/20/21, slots 55 x 13 x 2 at R210,
  60-degree spacing and edge bevels 0.2/1.5/1 matching the specification.
- No remaining TBD or pending-dimension labels. The misplaced BASE PLANE arrow
  was removed; the dashed Z=-1 mm line specifies that plane.

Section heights and widths are deliberately schematic and must not be measured
from the illustration. The footer and numeric specification control geometry.
The cover underside is Z=-21 mm, derived from its Z=-1 mm base surface minus
20 mm body thickness; frame underside is Z=-26 mm. No model has been generated
or visually validated in this document task.

## Numeric completion review

The original TOP horizontal radius (approximately 235 px) is calibrated to the
existing 330 mm frame radius. Approximate central boundary samples
32/50/65/88/113 px become nominal radii 45/70/90/125/160 mm after rounding.
The user accepted these numeric choices on 2026-10-07. The supplement records
the method and its limitations; the 4 mm gap alone
does not determine hidden surfaces or vertical dimensions.

Check the completed numeric contract as follows:

- Concentric boundaries increase strictly: 0/45/70/90/125/160/286 mm.
- Cover/frame radial gap: 290 - 286 = 4 mm; diametral gap: 8 mm.
- C/2/4 top: -1 + 1 = 0 mm, flush with frame; 1/3/outer field: -1 mm.
- Cover underside: -21 mm; frame underside: -26 mm; assembly height: 26 mm.
- Slot range: 210 +/- 27.5 = 182.5 to 237.5 mm.
- Ring 4 to slot clearance: 182.5 - 160 = 22.5 mm; slot to cover edge:
  286 - 237.5 = 48.5 mm, before the outer perimeter bevel.
- Slot floor: -1 - 2 = -3 mm; remaining body: -3 - (-21) = 18 mm.
- Relief upper bevel: 0.2 mm, less than the 1 mm rise; no concave-foot bevel
  or added circular groove. Frame/cover outer bevels retain their own values.
- Six equal radial recesses remain on the cover; there is no bridging face
  between the independently closed cover and frame.

This is a document and arithmetic review, not a rendered-model acceptance.

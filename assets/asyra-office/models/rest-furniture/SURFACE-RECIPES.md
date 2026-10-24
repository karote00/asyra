# Surface Recipes

| Material     | sRGB base color | Metallic | Roughness |
| ------------ | --------------- | -------- | --------- |
| Wood         | #B9864E         | 0        | 0.80      |
| Sage pad     | #899B85         | 0        | 0.90      |
| Ivory pillow | #EEE9DB         | 0        | 0.90      |

Emission and transmission are zero. Sage and ivory are uniform on all surfaces.

Optional-looking grain in the sheet is resolved by this fixed intrinsic wood recipe: grain color #A77945; metre coordinates u along grain, v across it; q=sin(2*pi*(v/0.003+0.10*sin(2*pi*u/0.060))); mix base toward grain by 0.08*max(0,q)^8 in linear RGB after sRGB conversion.

Platform top/bottom use u=X,v=Y; long sides u=X,v=Z; short sides u=Y,v=Z. Headboard broad faces use u=Y,v=Z; top/bottom u=Y,v=X; end faces u=Z,v=X. Legs use u=Z,v=X on front/back and u=Z,v=Y on sides; end caps u=X,v=Y.

No fabric texture, seam, normal, bump, displacement, or occlusion map. No baked shadows, AO, gradients, highlights, reflections or glow. Reference previews are unlit. Drawing contours are not painted outlines or engraved joints. The app supplies lighting later.

## Daybed sizing and replacement regions

The [daybed contract](DAYBED-SPEC.md) defines seven independently replaceable
regions. Legs, platform and headboard use the existing wood default; pad uses
uniform sage. All have opacity 1, zero transmission, emission and clearcoat.
For the daybed, evaluate the existing wood mapping in final resized local metres
before world placement. Resolve material and supplied colour independently from
component to group to daybed to preset. Apply colour after material selection,
retaining other properties and isolating instances. Replacement materials own
mapping and may omit grain. The separate pillow surface is unchanged.

## Sleeping pillow appearance

The [sleeping pillow contract](SLEEPING-PILLOW-SPEC.md) defines one `body` region,
defaulting to uniform ivory #EEE9DB, roughness .90 and metallic 0. Opacity is 1;
emission, transmission and clearcoat are zero. There is no default fabric texture.
Resolve material and supplied colour independently from body to pillow to preset,
apply colour after material selection, retain other properties and isolate instances.
Replacement surfaces own their mapping in resized geometry before placement.
No seam, casing, displacement or extra geometry is implied by appearance options.

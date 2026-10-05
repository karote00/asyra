# Surface Recipes

| Material | sRGB base color | Metallic | Roughness |
| --- | --- | --- | --- |
| Wood | #B9864E | 0 | 0.80 |
| Sage pad | #899B85 | 0 | 0.90 |
| Ivory pillow | #EEE9DB | 0 | 0.90 |

Emission and transmission are zero. Sage and ivory are uniform on all surfaces.

Optional-looking grain in the sheet is resolved by this fixed intrinsic wood recipe: grain color #A77945; metre coordinates u along grain, v across it; q=sin(2*pi*(v/0.003+0.10*sin(2*pi*u/0.060))); mix base toward grain by 0.08*max(0,q)^8 in linear RGB after sRGB conversion.

Platform top/bottom use u=X,v=Y; long sides u=X,v=Z; short sides u=Y,v=Z. Headboard broad faces use u=Y,v=Z; top/bottom u=Y,v=X; end faces u=Z,v=X. Legs use u=Z,v=X on front/back and u=Z,v=Y on sides; end caps u=X,v=Y.

No fabric texture, seam, normal, bump, displacement, or occlusion map. No baked shadows, AO, gradients, highlights, reflections or glow. Reference previews are unlit. Drawing contours are not painted outlines or engraved joints. The app supplies lighting later.

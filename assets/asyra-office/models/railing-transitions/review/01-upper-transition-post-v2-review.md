# Upper Transition Post - Geometry and Review Colour

Date: 2026-10-07. Scope: upper post specification review and reference recolouring.
Status: recoloured sheet and document updates approved for commit on 2026-10-07.

## Numeric review

The existing numeric geometry is consistent. The post is 0.04 x 0.04 x 0.90 m,
with its origin at the bottom footprint centre. Top heights at X=-0.02, 0 and
0.02 are 0.89, 0.90 and 0.90 m, independent of Y. The inclined half rises
0.01 m over 0.02 m and joins the level half without a gap.

The documented upper sloped rail origin (-0.30,0,0.75) yields the same underside
plane as the inclined top half. The level rail at (0,0,0.90) contacts the other
half. The rail ends meet at X=0 over Z=0.90..0.94. Ten vertices and seven
polygon faces triangulate to sixteen triangles. No dimension changes are needed.

The geometry supplement now states the six top points, shared boundary,
inclined length, view directions and full-depth contact explicitly.
A strict RIGHT orthographic view is a plain rectangular silhouette; any
thin top strip in the generated drawing must not become a cap or bevel.

## Appearance authority

The original charcoal reference remains the default appearance authority.
The existing JSON and surface recipe specify sRGB base colour `#383A38`,
metallic 0.15 and roughness 0.80. These are replaceable defaults.
The proposed light grey `#C8CCD0` is a review-display colour only.
Do not sample raster shading or the recoloured sheet as the default albedo.

No model generation, Blender execution or app implementation is included.

## Image inspection

Inspected the 1536 x 1024 recoloured sheet. Main silhouettes, mirrored front/back
profiles, top boundary and dimension text remain visually consistent with v1.
The default-colour caption is present. Pixel-identical geometry preservation
is not claimed. The original RIGHT top-strip artifact remains a drawing issue,
not a construction feature; the numeric right silhouette is a plain rectangle.
No full geometric approval is inferred from this colour-only edit.

# Park Railing - Surface Recipes

Both assets default to one uniform charcoal-painted-metal material.

| Property | Value |
| --- | --- |
| Base colour, sRGB | #383A38 |
| Metallic | 0.15 |
| Roughness | 0.80 |
| Opacity | 1.00 |
| Emission | 0 |
| Normal/displacement texture | None |

Use the same material on tops, bottoms, backs and cut faces. No rust, scratches, wear, directional gradients, baked AO, contact shadows or specular marks. No image textures or UV-dependent detail are required. Drawing outlines are explanatory strokes and must not become texture stripes or modeled grooves.

Runtime lighting supplies all shadows and reflections. The flat reference-sheet treatment does not require an unlit runtime shader; use the material values above with the future scene's lighting.

## Replaceable appearance

Apply the [shared sizing and appearance contract](../README.md#overall-size-and-appearance---2026-10-09).
Each unit has one whole-unit material region, including the post shaft, collar
and finial or all panel members. Colour and material are replaceable independently
of geometry and other instances. Default surfaces require no texture mapping;
replacement materials declare their own stretch/repeat mapping after sizing.

## Post review colours only

The following light palette applies only to the post reference sheet. The panel
default remains charcoal-painted metal `#383A38` with the shared properties
above. Its two rails and five pickets use the same material on every surface.
The original dark panel image is not a texture asset: gradients or shadows in
that illustration must not be sampled into the material. The later panel v2
correction uses the separate review palette below.

The current light-colour sheet uses this diagram palette to distinguish parts
and planar faces. It does not request separate runtime material regions.

| Diagram region | Target sRGB |
| --- | --- |
| Shaft front-facing face | #D7E0E6 |
| Shaft perpendicular face | #B7C7D3 |
| Collar front face | #9DADB9 |
| Collar top face | #DCE5EC |
| Collar perpendicular face | #899DAD |
| Spherical finial | #D9D2C3 |

Image-generation colour variation is not a new surface recipe. Build from the
default values above, not sampled review pixels. Face colours, outlines, labels
and leaders must not become baked shading, texture stripes or modeled seams.

## Panel review colours only

Panel v2 uses flat part/face colours for readability. They do not create
additional runtime material regions or alter the shared charcoal default.

| Diagram region | Target sRGB |
| --- | --- |
| Rail elevation face | #9DADB9 |
| Rail perpendicular face | #899DAD |
| Rail top face | #DCE5EC |
| Picket elevation face | #D7E0E6 |
| Picket perpendicular face | #B7C7D3 |
| Picket top cap | #C1D0DD |

There is no directional light, AO, cast shadow, texture or reflection in the
numeric sheet. Dark contour lines and text are diagram annotations only.

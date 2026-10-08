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

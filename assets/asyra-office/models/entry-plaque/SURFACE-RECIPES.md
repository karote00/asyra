# Entry Wall Plaque - Surface Recipes

| Region | sRGB base color | Roughness |
| --- | --- | --- |
| Plate | #52677C | 0.85 |
| Front marks | #EEE4D2 | 0.85 |

Both use metallic=0, alpha=1, IOR=1.5, with coat, transmission, subsurface, anisotropy and emission all zero. No normal map or displacement.

On the front face only, assign ivory inside either documented XZ rectangle; otherwise use blue-gray. Use face identity so marks cannot repeat onto the back. A procedural mask or intrinsic-color texture is acceptable. For a texture, use u=(X+0.09)/0.18 and v=Z/0.20 with at least 512 x 512 pixels and antialiased edges.

No baked shadows, AO, highlights, gradients, reflections, wear or grain. Future scene lighting owns illumination. Sheet contours, labels and minor raster variation must not become surface detail. Convert sRGB normally to the working space.

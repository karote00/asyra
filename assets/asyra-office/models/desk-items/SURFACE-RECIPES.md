# Desk Items - Surface Recipes

Use the exact sRGB colours and roughness/metallic values in JSON. Convert sRGB to linear only where required by the renderer. All materials have alpha 1, transmission 0 and emission 0. Disable clearcoat. No normal/bump textures, noise, brushed grain, dirt, fingerprints, patina or roughness variation.

Silver is #BFC1C4, trackpad #B1B3B7, keys #303236, bezel #242629, display #313335, emblem #F6F4EE and ceramic #EEE8D9. These are authored approximations of reference colours, not calibrated measurements. Metal reflections come only from future scene lighting; do not paint gradients into colour maps.

The rear emblem is the flat vector mask specified in JSON. Apply a single white colour inside its two paths and silver elsewhere; do not add a wordmark or glow. Keyboard caps have no legends. Trackpad and display are non-overlapping surface/material regions, not shadow textures. Screen UVs are defined in the geometry supplement for later app replacement.

Mug inside, outside, lip, handle and underside use the same opaque cream ceramic material. The cavity and handle opening must be actual geometry, not dark painted shapes. No coffee, liquid fill, steam, saucer or hidden black backing.

White sheet backgrounds, dark outlines, contact shading and specular highlights in generated views are not textures. No cast-shadow plane or baked ambient occlusion. All runtime lighting belongs to the app.

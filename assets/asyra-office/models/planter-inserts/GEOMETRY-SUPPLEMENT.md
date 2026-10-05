# Geometry Supplement

## Coordinates

Metres, +Z up, -Y front, +X right. Each origin is centered on its bottom contact plane. All dimensions are authored. See the [numeric specification](planter-inserts-model-spec.json).

## Empty rectangular planter

Start with the closed box X +/-0.300, Y +/-0.130, Z=0 to 0.240. Subtract a box X +/-0.275, Y +/-0.105, Z=0.025 to 0.241, exiting through the top.

The result is a closed material shell with an open cavity: outer size 0.600 x 0.260 x 0.240, inner opening 0.550 x 0.210, wall and floor thickness 0.025. The inside floor is at Z=0.025. All corners and edges are square, all planes flat. No bevel, subdivision, rolled rim, separate lip, drain hole, handle, foot, raised panel or texture relief.

Underside is one closed flat rectangle. The cavity is real geometry, not a dark painted opening or solid top. Do not bundle soil into this asset.

## Soil insert

One closed box, X +/-0.273, Y +/-0.103, Z=0 to 0.190. Overall dimensions 0.546 x 0.206 x 0.190. Flat top, sides and underside; no bevel, mounds, stones, roots, holes, tray walls, or subdivision.

This volume is a separate insert, not a planter or terrain assembly. Top pigment speckles from the surface recipe do not add vertices or physical bumps.

## Fit reference only

Place the soil origin at (0,0,0.025) in planter coordinates:
- Bottom rests on the planter floor.
- Each horizontal side leaves 0.002 clearance.
- Soil top reaches Z=0.215, 0.025 below the planter rim.

Do not change either local origin or merge the assets. Future plant placement can use the soil's top plane, but no plants, transforms, growth, watering or app placement logic are delivered here.

## Views and future acceptance

FRONT looks along +Y, RIGHT along -X, BACK along -Y, TOP along -Z with +Y upward. Oblique views are illustrative.

Future model review checks dimensions within 0.0005, actual planter cavity, 0.025 wall/floor thickness, separate closed soil volume, planar contact and clearance. Inspect underside and cavity floor as well as exterior. No model, assembly-fit simulation or physical horticultural behavior has been verified.

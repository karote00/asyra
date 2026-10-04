# Wall Accents - Surface Recipes

JSON defines sRGB colours and PBR constants. Convert colour values to linear only as required by the renderer. All materials have alpha 1, transmission 0, emission 0 and no clearcoat. Bulb and shade are opaque ivory surfaces; brightness, warmth and cast shadows must come from future scene lights, not these files.

Bronze #695237, brass #A18450, shade #E9DEC2, bulb #E8DFC9, oak #BB9469, paper #EDE2CD, backing #BEAC8E and ink #39352F are authored palette choices. No brushed-metal texture, scratches, dirt, patina, glossy streak or painted occlusion.

Frame grain: use the rail's length coordinate L and across-width coordinate W in metres. Define phase=2*pi*(W/0.003+0.08*sin(2*pi*L/0.12)). Multiply linear oak RGB by 0.98+0.02*sin(phase). Vertical rails use L=Z,W=X; horizontal rails use L=X,W=Z. The same rule continues around each rail's exposed faces; mitred joints delimit rail direction. No normal map, displacement, random seed, knots or edge-darkening. The grain is intrinsic colour only.

Paper and rear backing are uniform matte solids. Print artwork is the flat vector stroke mask in JSON; draw ink at full opacity with ordinary antialiasing, and no extrusion or shadow. Never use the whole generated sheet as a texture. Annotation text, white margins and displayed object highlights are not part of an asset.

The fixture rear disc is a flat brass-coloured mask. All other fixture regions are uniform materials. No glow map, light cone, halo geometry, ambient-occlusion bake or shadow receiver is delivered.

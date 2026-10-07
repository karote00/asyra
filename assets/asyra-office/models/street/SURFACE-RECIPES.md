# Street components - repeatable surface and foliage recipes

Authoring recipes only; no executable models. Dimensions and seeds are in
street-model-spec.json. All color variation is intrinsic pigment, never lighting.

## Asphalt default and overrides

For `road-asphalt-straight`, the default is sRGB #55545D, roughness 0.94 and
metallic 0, matching the JSON asphalt material. The grain and macro variation
below are default appearance recipes only. They do not create geometric
bumps, normals or displacement, and are not baked into the mesh.

Future creation parameters must allow a base-colour override or replacement
of the complete material independently of geometry. A complete material
replacement disables the default asphalt grain and macro recipe. Overrides
must not change dimensions, origin, bottom bevel, tiling boundaries or other
instances. Scene lighting and independently placed markings remain separate.
The current reference image is unchanged and illustrates the default surface;
it is not a production texture to be stretched over the mesh.

## Paving stone defaults and overrides

The single paving stone defaults to `stone-cream`: sRGB #D9CDBA, roughness 0.88,
metallic 0. `stone-pale` (#E3D9C9, roughness 0.88) and `stone-grey` (#C9C4B9,
roughness 0.90) remain alternatives, both metallic 0. Values match the numeric
material definitions. Existing seed 404 grain is an optional default colour
recipe, never geometric bumps or baked lighting.

Colour and complete material are independently replaceable without changing
bounds, origin, bevel or other instances. A replacement material replaces the
stone grain recipe as well. The simplified review sheet's face shading and
outlines must not be sampled as material features. The assembled layout does
not require assigning random colours or generating grout in each stone.

### Paving stone surface-detail note

The smooth single-unit drawing establishes dimensions, silhouette and bevels;
it is not a requirement for a polished or visually featureless final stone.
Keep the current model geometry. Later replaceable stone materials may add
intrinsic grain, roughness variation and small-pore shading using normal or
bump maps, without adding vertices or changing the silhouette. Such maps must
not contain baked shadows, ambient occlusion or directional highlights.

This is a future material option, not a completed texture or a newly enabled
default. The current colour-grain recipe and zero default normal strength
remain unchanged. Map scale, strength and close-up appearance require a later
material specification and review; do not infer them from drawing shading.
Do not convert this note into geometric displacement. Chipped corners,
irregular outer edges or visible surface depressions that change geometry
require separately specified model variants rather than a material override.

## Random sequence

Use unsigned 32-bit integer state initialized to the listed seed. Each sample:
state = (1664525 * state + 1013904223) modulo 4294967296;
u = (state + 0.5) / 4294967296. Use integer arithmetic before division.
Restart per component. Subpart j uses seed + 1009*j modulo 4294967296.
Do not use wall-clock or tool-specific default random values.

## Grain

Create a repeating 1 m square color tile at 2048-square pixels. Radius is
uniform in half the listed diameter range [a,b]. For coverage f, use
N = ceil(f / (pi * (a*a + a*b + b*b) / 3)). Coverage is an expected density
before overlaps, not an exact pixel count. For each dot consume four samples:
x, y, diameter, color multiplier. Wrap coordinates across tile boundaries.
Multiply base linear RGB by the sampled multiplier and clamp to [0,1].
Composite in generation order with a one-pixel antialiased edge.
Do not generate AO, directional gradients, normals or displacement from dots.

Map one metre of object surface to one tile repeat with box projection in
object coordinates, blending weights proportional to abs(normal)^4. A later
model may bake this COLOR ONLY into nonoverlapping per-part UV charts: 1024
pixels per metre, 8-pixel gutters, maximum 4096-square pages; add pages instead
of reducing density. This document does not create those textures.

Asphalt macro variation uses a wrapped grid with the listed macro cell size,
seed + 7919, row-major random values and bilinear interpolation. Adjust the
cell spacing to divide each complete tile dimension evenly, using ceil(size /
requestedCellSize) cells. Shared boundaries use identical samples. Multiply
color by the listed small macro variation, without changing alpha or normals.

Metal edge wear uses wearMaterial in a 0.002 m band along only the specified
geometric edges. Seeded dots of diameter 0.001 to 0.003 m cover the requested
fraction of that band. It is pigment and never follows the light direction.

## Paint masks

Road straight/arc/dash presets share paint independently of their contour.
See [path markings](PATH-MARKINGS.md): the app derives contours from path and
width, while pigment and default wear are reusable. v4 PNGs are appearance
references, not seamless source materials. Production texture coordinates must
follow physical path distance, retaining speck scale as length changes.


These masks belong to independent decal components. Ochre or ivory is the
default pigment material, separately replaceable from the receiving surface.
Colour/material overrides must retain the decal contour, physical dimensions
and alpha-mask coverage, including transparent wear. A material override must
not turn a masked marking into an opaque rectangular patch. No backing mesh
or receiving-surface pixels belong to this material. See the
[shared classification](../ASSET-TYPES.md).


Paint has uniform intrinsic ochre or ivory pigment, not asphalt grain.
Use the dot algorithm only to cut transparent wear holes. Outside the marking
and in wear holes, alpha=0 and RGB=0; opaque pixels retain pigment RGB. Use
straight alpha storage. Never fill holes with grey, stone or brick pixels.

Zebra long-edge irregularity samples seeded signed offsets every 0.04 m,
interpolated linearly. Use abs(offset) inward, up to the JSON maximum, keeping
first/last samples zero. Short ends remain straight. The maximum authored
rectangle is unchanged. No paint extrusion or side faces.

For optional baked/exported per-instance masks (not the reusable path material), use density 1024 pixels/metre with 16-pixel
transparent padding, round image dimensions upward to a multiple of four.
Keep local UV axes aligned to local X and Y; record padding separately.
Generated review PNGs illustrate appearance, not calibrated production masks.
Their widths must not override the numeric component dimensions.

For a unit with XY bounding size W,H, production image dimensions are
4*ceil((ceil(W*1024)+32)/4) and 4*ceil((ceil(H*1024)+32)/4).
Place the geometric footprint at the image centre; any rounding surplus is
split equally around it. Map local +X to image right and local +Y to image up.
Record the physical bounds and UV footprint excluding padding. A curve uses
its full annular-sector bounds, not only the centerline bounds. Keep its arc
centre as the object origin even though it is outside the visible paint.

Store production source images as straight-alpha RGBA. Sampling/compositing
must weight RGB by alpha before filtering and unpremultiply afterward where
alpha is nonzero. Mipmaps must follow the same rule. This prevents transparent
black RGB from bleeding into an edge. An engine needing RGB dilation must
derive it from the nearest valid pigment texel, never from a road background;
alpha remains unchanged. These are future integration requirements, not an
implemented texture pipeline or permission to change the approved PNGs.

Review assets may contain RGB in zero-alpha pixels. Those pixels are invisible
with correct alpha compositing; never infer light emission from their RGB.
The numeric mask recipe, not hidden reference-image RGB, is the production
source of transparent edge data.

## Tree leaves

Use the twelve ellipsoid guides in listed order; guides never render.
Each has 96 leaves. For i=0..95, set u=(i+0.5)/96, z=1-2*u,
theta=i*2.399963229728653 + clusterIndex*0.73;
d=(sqrt(1-z*z)*cos(theta), sqrt(1-z*z)*sin(theta), z).
Even i uses radial factor 1; odd i uses
0.55+0.4*fract((i+1)*0.618033988749895).
Position = guide center + componentwise(guide radii * d * radial factor).

Start the sequence at foliage seed + 1009*clusterIndex. Consume three samples
per leaf: length within the JSON range, rotation in [0,2*pi), material choice.
Choose materials[0] for q<0.5, [1] for 0.5<=q<0.8, [2] otherwise.
Choice is independent of normal, location, camera and lighting.

Normal = normalized(d.x/rx,d.y/ry,d.z/rz).
T = normalized(cross(+Z,normal)); if its length is below 0.000001, use
cross(+X,normal). B=cross(normal,T). Rotate T and B by the sampled rotation.
Map the six normalized outline points in JSON onto T and B using length and
width. Add the centre raised along normal by the bulge amount. Form six front
triangles. Duplicate vertices offset minus thickness along normal, reverse
back faces, and close the six side edges. Leaves are closed geometry.
Do not add visible spheres, leaf stems, veins, clusters or a soil pedestal.

Each branch starts at the trunk centreline interpolated at its listed Z.
Its endpoint is the corresponding guide center; midpoint and radii are given
in JSON. Cap branch ends. Trunk base is a flat closed face.

## Reconstruction limit

These formulas settle construction choices and permit repeatable authoring.
They do not recover an unknown original mesh or guarantee identical pixels.
Future modeling still requires visual comparison with approved references.

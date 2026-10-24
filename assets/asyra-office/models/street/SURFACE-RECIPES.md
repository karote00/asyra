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

The sole current tree geometry and assembly recipe is
[TREE-CONSTRUCTION.md](TREE-CONSTRUCTION.md), using
[tree-construction-spec.json](tree-construction-spec.json).
It defines one rounded solid leaf, 23 groups and 1,744 shared instances,
including size mixtures, subgroup offsets, orientations and fixed random streams.
The previous twelve-guide/1,152-leaf recipe is superseded; do not reuse it.

### Tree defaults and overrides

Bark defaults to #806144, roughness 0.94, metallic 0. Leaves use olive #829347,
pale #A7AD58 and deep #596D3D, all roughness 0.90 and metallic 0. These are
replaceable intrinsic colours. Their spatial correlation is specified in the
construction guide and never follows scene lighting. No default displacement.

Independent bark and leaf colour/material overrides preserve seed, positions,
dimensions, branch graph and normals. A full material override replaces prior
textures/shaders. All leaf slots may use one replacement material. Still consume
the same eight uniforms per leaf and the separate subgroup palette draws, so
appearance changes cannot alter geometry. No baked cast/contact shadows, AO,
highlights or drawn reference outlines. The scene owns illumination.

## Street lantern appearance

Use [LANTERN-SPEC.md](LANTERN-SPEC.md#default-appearance-and-independent-replacement)
and the lantern module's appearance overrides. Seed 707 metal grain applies to
the default structural and lower-collar materials only; amber panes use uniform
intrinsic pigment. Full material replacement removes prior shader/textures;
colour-only changes preserve the selected material's other properties. Do not
bake reference shadows or outlines, or alter geometry through displacement.

## Reconstruction limit

These formulas settle construction choices and permit repeatable authoring.
They do not recover an unknown original mesh or guarantee identical pixels.
Future modeling still requires visual comparison with approved references.

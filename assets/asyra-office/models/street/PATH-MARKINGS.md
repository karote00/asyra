# Path Markings - Shared Paint and Shape Presets

Status: documentation decision authorized on 2026-10-07. No path renderer,
projection system, production texture, mask or model is implemented here.
This supersedes treating straight, curved and short road lines as three fixed
models or three separately authored shape-specific paint materials.

## Asset boundary

A path marking is one independently placeable decal defined by a centreline,
width, origin, orientation and a shared paint material. The app derives its
contour and render geometry/mask from the path. An instance may use a straight,
arc or future editable free-form path; it does not require a new material for
each shape. The paint has zero physical thickness and no receiving road mesh.

Existing module and part identifiers are retained in the numeric document.
The three entries in `road-marking-segments.pieces` now describe shape presets,
not mandatory standalone mesh/PNG deliverables. Their default dimensions,
origins, endpoints and tangents remain unchanged. This is an asset-authoring
specification change, not a persisted app-data migration or finalized API.

## Existing shape presets

| Existing identifier | Default path and width | Default material |
| --- | --- | --- |
| edge-line-straight | X=-0.50..0.50, Y=0; width 0.10 m; centre origin | ochre-paint |
| edge-line-curve | Centre (0,0), radius 1.05 m, angles 180..270 degrees; width 0.10 m; arc-centre origin | ochre-paint |
| lane-dash | X=-0.30..0.30, Y=0; width 0.12 m; centre origin | ivory-paint |

Each preset creates one marking. It does not require a repeated group or lock
future path editing to its initial dimensions. The arc's existing 32 segments
are its documented default tessellation only, not a universal sampling rule
for arbitrary curves. The arc's default inner/outer radii remain 1.00/1.10 m.
Existing preset ends are flat, perpendicular to the local path tangent.

A short dash is a short path instance. Repetition, gaps and joining multiple
instances remain app decisions. Editing path or width deliberately changes
shape; changing colour/material alone must not do so. Irregular filled shapes
may instead use an independent contour mask; they are not automatically paths.

## Shared material, separate contour

Use the existing material definitions from `street-model-spec.json`:

- ochre-paint: sRGB #C5A055, roughness 0.86, metallic 0.
- ivory-paint: sRGB #E4DECF, roughness 0.86, metallic 0.

These are colour variants of the same paint surface recipe. A material stores
pigment/surface properties; it does not store a straight or curved outer border.
The path generates the contour mask. Existing road-line wear settings (seed
202, coverage 0.02, diameter 0.001..0.004 m) remain defaults shared by the three
presets. Wear is transparency, never grey road-coloured pixels. Final coverage
combines the contour with the wear mask; replacing pigment must preserve it.

If a reusable texture is produced later, it must be authored without a baked
straight outline and repeat seamlessly along path distance. Use physical
arc-length coordinates along the centreline and physical transverse distance
across its width. Maintain texture scale per metre as path length changes;
repeat/crop rather than stretching an entire reference PNG around the curve.
Do not scale speck sizes with the total path length. Production repeat period,
UV layout and curve/join sampling require a later implementation contract;
this document does not claim those assets or algorithms have been validated.

The existing v4 straight/arc/dash PNGs remain appearance and preset examples.
They are not certified seamless material tiles, fixed model requirements or
production masks to warp onto arbitrary paths. The earlier per-unit PNG sizing
recipe in SURFACE-RECIPES.md applies to optional final mask export, not the
shared material or a requirement to store one PNG for every shape.

## Already-reviewed assets and the crosswalk

The approved asphalt tile retains its box geometry, bottom-only bevel, origin
and replaceable default material. Natural oak remains an independent material
input used by a separate plank model. Neither becomes a decal, and the oak PNG
is not newly certified for seamless repetition. Other approved model components
and their material regions are unchanged.

The crosswalk remains one independently placeable rectangular decal, 0.40 x
2.80 m, with its existing origin, ivory-paint default and seed 303 / 0.025 wear
coverage. It can share the ivory pigment recipe without adopting a road-line
path preset or its wear settings. A crossing array is still app-owned.

## Receiving surfaces and future verification

The same path marking may be placed on asphalt, brick or stone. Flat placement
retains the 0.0005 m normal offset to avoid z-fighting. Curved/uneven receiving
surfaces need app-owned projection or conforming geometry; shared paint alone
does not implement surface attachment. No thin solid backing is introduced.

Before future implementation is called complete, verify preset endpoints and
widths, continuous paint scale along edited paths, transparency on different
receivers, and absence of stretched reference backgrounds. Joins, tight bends,
self-intersections, free-form path representation and surface projection need
explicit implementation rules and tests at that stage. They are not silently
resolved by making more fixed asset variants now.

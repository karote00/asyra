# Frame night-light

## Identity and reference authority

Asset ID: `frame-night-light`. Factory: `frameNightLight()`.
This is a second asset, not a revision of `pantryNightLight()` or its
`sourceVariants.nightLight` specification. The refrigerator now selects this
new asset; the original remains available through `?review=pantry-night-light`.
The new model is independently viewable through `?review=frame-night-light`.

- `reference-frame-night-light.png`: owner-supplied primary photograph.
- `reference-frame-night-light-second-angle.png`: owner-supplied additional angle;
  establishes two perpendicular arch straps crossing above the cylinder.
- `frame-night-light-reference.png`: five projections of the same constructed
  geometry, for single-part review. This is implementation evidence, not a
  replacement for either owner photograph or an assertion of owner approval.
- Numeric construction source: `sourceVariants.frameNightLight` in
  `pantry-smallware-model-spec.json`.

## Scale and coordinates

All dimensions below are millimetres. The machine-readable JSON uses metres.
Origin: centre of the bottom contact plane. X: width, Y: depth, Z: up.
Default overall extent: 148 x 148 x 300. The photographs have no physical scale;
300 mm retains the existing tabletop-light height. Other dimensions follow the
photographed silhouette proportions. Hidden construction is a defined model
interpretation, not a measurement of the manufactured product.

The whole assembled asset supports independent XYZ scaling through the existing
scene placement contract. Region appearance is applied separately from geometry.
Uniform scale preserves the photographed proportions. Nonuniform scale changes
those proportions intentionally without regenerating unrelated assets.

## Component dimensions

| Region | Geometry and placement | Default appearance |
| --- | --- | --- |
| Base | Revolved circular base; Z 0-69; max radius 74; bottom radius 59; bevels and narrow annular grooves at Z 23-25, 34-36, 52-54 | Bronze #79684E; metal; metalness 0.85; roughness 0.18 |
| Reflector | Annular flared insert; Z 65-76; radius 41-52; central opening retained | Brass #B69850; metal; metalness 0.85; roughness 0.16 |
| Light core | Low domed diffuser; Z 68-90; max radius 42; central crown Z 90 | #FFDBA0; emission #FFB35C at 1.75; roughness 0.50 |
| Glass cylinder | Hollow revolved wall; outer radius 46; inner radius 44; Z 76-246; rounded upper lip | #E6DED0; alpha 0.13; roughness 0.12 |
| Glass top | Transparent 2 mm top face, Z 244-246, radius 45.5 | #E6DED0; alpha 0.10; roughness 0.12 |
| Glass rim | Annular top edge; radii 43.5-46; Z 244-246 | #CFBB87; alpha 0.36; roughness 0.25 |
| Width frame | Inverted U strap in XZ, centred Y=0; outside width 120; bottom Z 59; top Z 294 | Bronze #79684E; metal; metalness 0.85; roughness 0.18 |
| Depth frame | Same arch construction rotated 90 degrees around Z; centred X=0; bottom Z 59; top Z 300 | Bronze #79684E; metal; metalness 0.85; roughness 0.18 |

Both straps use 9 mm band width, 7 mm extrusion thickness and 14 mm outer
upper-corner radius. The inner corner radius is 5 mm. Each upper quarter-circle
uses 10 intervals. The two arches produce four uprights at 90-degree intervals;
they are not two parallel handles. The top bridges cross with a 6 mm top-height
offset, giving a defined overlapping joint rather than coincident surfaces.
The uprights enter the base at Z 59, below its upper seating surface.
Minimum radial clearance from glass to an upright is 5 mm (46 to 51 mm).
The shorter arch underside is Z 285, leaving 39 mm above the glass top.

The radius/Z arrays in JSON define every revolved contour, groove and lip;
revolution uses 64 angular intervals. The glass wall is hollow rather than an
opaque cylinder. The central air region stays open. Only the low diffuser is
an emissive source; do not fill the tall cylinder with a luminous solid. There
is no hanging loop, separate shade cap, label or full-height diffuser.

## Appearance and light behavior

Every region has a stable ID and independently replaceable color. The factory
accepts a region-to-color map; a light-core color override also replaces its
emission color. Material kind, metalness, roughness and transparency remain separate
AssetPart fields and can be replaced without changing vertex positions.

Base, reflector and both frame straps use `environmentIntensity: 1` through the
public spatial material contract. Preset generates one shared studio reflection
map lazily per engine lifetime; other materials remain at zero. Reflections are
view-dependent lighting, not highlights baked into the asset. Glass and the
light core do not opt in.

Use the existing public emissive material and Preset bloom pipeline. Office
bloom stays at strength 0.315 with radius 8 CSS pixels. Preserve the owner's
previous dimming choice. Light originates at the base. No new point light,
animation, particle, texture-baked glow, or global lighting change is required.
The single-part reference uses the standard neutral preview lighting, while
pantry screenshots demonstrate the actual Office glow. These lighting contexts
must not be mistaken for different geometry.

## Review and preservation

Inspect front, right, back, top and three-quarter views from one geometry.
Top must show crossing straps over the round glass, not parallel bars. Front
and right must show an open frame above a transparent cylinder. Check the base
grooves, bottom emitter, 5 mm upright clearance and 39 mm top clearance in close
views. Confirm the model stands on the unchanged refrigerator top anchor.

Formal tests cover finite geometry, component bounds, crossing strap orientation,
low emission, transparent glass, independent color replacement, preservation of
the original asset, and fridge placement. `e2e/night-lights.spec.ts` captures both
assets and produces the five-view sheet; `e2e/pantry.spec.ts` captures the live
Office close-up and two additional angles. Passing capture tests does not replace
visual comparison with the two owner photographs.

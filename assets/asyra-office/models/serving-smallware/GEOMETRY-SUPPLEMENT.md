# Geometry Supplement

## Shared conventions

All measurements are metres. Use +Z up, -Y front, +X right. Each origin is the center of its bottom contact plane. Each asset is a separate unit. Preserve real empty interiors and closed material shells; an open container does not mean an open or non-manifold mesh.

The numbers below are authored design decisions. They resolve unseen surfaces and image ambiguities; they are not measurements recovered from the original office illustration. If the sheets appear inconsistent, follow these dimensions and document the visual difference before modeling changes.

## Wooden serving tray

- Overall bounds: X = -0.140 to 0.140, Y = -0.090 to 0.090, Z = 0 to 0.025.
- Start with that rectangular solid.
- Subtract a rectangular volume: X = -0.132 to 0.132, Y = -0.082 to 0.082, Z = 0.006 to 0.030. The subtraction exits through the top.
- Result: 0.006 thick floor; 0.008 thick continuous side walls; interior depth 0.019.
- The plan corners are square. No bevel, rounding, handles, holes, feet, partitions, or fasteners.
- The underside is one flat closed rectangle. The interior floor is flat.
- Sheet corner strokes indicate surface boundaries, not incised miter seams. Do not cut decorative grooves.
- Surface regions can have separate wood coordinates but must not create physical gaps.

## Ivory snack bowl

Revolve this closed radius/Z profile around Z. Each pair is [radius, height]:

```json
[
  [0, 0],
  [0.03, 0],
  [0.033, 0.003],
  [0.04, 0.012],
  [0.048, 0.025],
  [0.055, 0.04],
  [0.06, 0.053],
  [0.059, 0.055],
  [0.056, 0.055],
  [0.051, 0.04],
  [0.044, 0.025],
  [0.036, 0.012],
  [0.029, 0.005],
  [0, 0.005]
]
```

- Use 96 equal angular segments, starting at angle zero on +X.
- Connect consecutive profile points with straight segments; close the profile from the final axis point to the first.
- Merge each radius-zero ring into a single vertex. Do not leave an axis hole.
- Maximum outside diameter: 0.120. Total height: 0.055. Flat external bottom diameter: 0.060.
- Central floor thickness: 0.005. The side walls have nominal radial thickness 0.004; the profile governs transitions and the lip. This is not constant thickness measured normal to the curved wall.
- Smooth side-wall shading around the circumference and across profile rings. Keep planar base and interior floor flat. No subdivision or extra bevel changes the defined silhouette.
- The cavity is open and empty. No foot ring, separate saucer, handle, decorative ring, food, or contents.
- Front, right, and back silhouettes are identical because the object is rotationally symmetric.

## View mapping

FRONT looks along +Y; RIGHT looks along -X; BACK looks along -Y; TOP looks along -Z with +Y toward the top of the sheet. THREE-QUARTER is an illustrative view from (+X, -Y, +Z).

The provided images label these views, but generated elevations include slight downward viewing. They are appearance references, not dimensioned technical projections. Interior contour lines denote actual floor/rim boundaries; no dark lighting bands are part of the material.

## Future modeling acceptance

Check overall dimensions within 0.0002, origin placement, closed shell topology, empty cavities, and absence of bundled props. Compare the tray plan and bowl profile against the numeric specification. Inspect the bottom as well as visible faces. This is a future checklist; no model or Blender verification was performed in this batch.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Hollow tray and bowl

Tray interior is 264 x 164 x 19 mm, above a 6 mm floor with 8 mm walls. Its volume is empty; no hidden full-height box remains after subtraction. The four rim grain regions meet without grooves. Bowl extent is 120 x 120 x 55 mm, floor 5 mm, flat ground contact diameter 60 mm. The 4 mm side thickness is nominal radial thickness; lip transitions follow the complete ordered profile.

Tray honey wood and grain, and bowl ivory ceramic, use the explicit surface recipe defaults. Both interior and exterior remain independently addressable without forced dark tints. LoD retains the tray cavity and every bowl profile station; reduce only the bowl's angular samples. The tray's planar topology needs no dense subdivisions.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.

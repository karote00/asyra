# Water and crop architecture flow

This flow maps the [product specification](../../specs/water-and-crops.md); it is not an execution log.

## W - Water domain and projection

- Owner: FieldScope drain profile and its presentation consumers.
- Inputs: validated strip width, strip location, greenhouse length and terrain depth.
- Outputs: rounded soil cross-section, water level/inner rim, soil triangles, closed water-volume triangles, matching section diagram.
- Conditions: drain strips only; soil strips bypass channel construction.
- Allowed contributors: configuration/layout, TriangleBuilder, section projection.
- Forbidden contributors: camera, diagnostics, guessed blue curved surfaces, crop geometry.
- Boundary/allowlist: `domain/drain-profile.ts`, triangle emission in `domain/mesh.ts`, `domain/__tests__/drain-profile.test.ts`, drain portions of `render-app/site-projection.ts` and `ui/workbench.tsx`, matching E2E water assertions.
- Spec: Water and water product cases. Failure owner: drain domain, or its incorrect consumer if the profile is correct.
- Cache dimensions: none.

## C - Crop domain

- Owner: FieldScope crop geometry and planting layout.
- Inputs: validated FarmConfiguration, canonical water-adjacent soil rows and deterministic variant seeds.
- Outputs: exactly 20 models per cultivar, material-part triangle buffers, cultivar/variant metadata and root transforms, with full/distant shapes and real occlusion geometry. Layout assignment enforces the farm-wide maximum of ten delayed-harvest cucumber fruits across actual instances, using the same eligibility policy as the models.
- Conditions: only soil-adjacent drains yield rows; empty rows yield no placements. Invalid root clearance is rejected at configuration admission.
- Allowed contributors: domain layout, shared support-row calculation, TriangleBuilder and observed cultivar references.
- Forbidden contributors: Three.js, camera state, renderer decisions, wall-clock randomness, robot physics.
- Boundary/allowlist: `domain/crop-models.ts`, `domain/crop-fruit.ts`, `domain/crop-hairs.ts`, `domain/leaf-surface.ts`, `domain/crop-layout.ts`, crop tube subdivision in `domain/mesh.ts`, the crop review export script, row portions of `domain/planting-supports.ts`, `domain/farm-configuration.ts`, matching domain tests.
- Spec: Planting, appearance references, valid/empty/invalid and repeatability cases. Failure owner: crop domain or configuration admission respectively.
- Cache dimensions: none; models are completed configuration-lifetime products. Immutable cultivar leaf anatomy maps are shared module-lifetime constants.

## R - Spatial rendering and integration

- Owner: FieldScope site projection, spatial admission and Three.js adapter.
- Inputs: completed crop models/root transforms and existing site descriptors.
- Outputs: admitted immutable instance descriptors, GPU instances, complete transformed bounds, crop layer visibility projected-error detail selection, conservative instance culling, and released resources on retirement.
- Conditions: instance descriptors use instanced rendering; ordinary meshes retain their existing route. Hidden layers retain geometry. Configuration replacement retires the previous product.
- Allowed contributors: completed domain outputs, SpatialLayer, current runtime configuration lifecycle, existing view controls and browser tests.
- Forbidden contributors: rederiving cultivar identity/placement in the engine, expanded per-plant CPU meshes, camera-driven crop regeneration, renderer fallback plants.
- Boundary/allowlist: `engine/spatial-contract.ts`, `engine/surface-textures.ts`, `engine/three-engine.ts`, `engine/graphics.ts`, their tests; `render-app/site-projection.ts`, `render-app/spatial-layer.ts`, `render-app/camera-navigation.ts` and tests; direct `runtime/bootstrap.ts`, runtime tests, `ui/workbench.tsx`, `ui/configuration-editor.tsx`, its icon tests, `playwright.config.ts`, and `e2e` consumers.
- Spec: shared model rendering, all planting cases, configuration and view lifetime, visual completion. Failure owner: admission/engine for rendering, projection for composition, runtime for invalidation.
- Cache dimensions: none beyond the existing admitted immutable scene lifetime; bounds reduce each shape once per measurement. GPU surface maps are shared by admitted surface identity while materials retain them, and released with the last material.

W and C feed R with completed geometric products. The section view consumes W directly. UI edits enter configuration validation before any W/C/R replacement; camera and visibility changes bypass W and C.

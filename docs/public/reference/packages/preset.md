# `@asyra/preset`

Optional official design-tool baseline with selectable defaults and render
profile policy.

## Owns

- strict Preset profile/default resolution and catalog metadata
- official dependency expansion and deterministic install order
- official design-tool component, property, selection, Group, render, UI, and
  input defaults
- the current `2D` Pixi provider selection and rollback of partial install

Solid nonzero compound Vector paths preserve transparent holes and nested
islands according to contour winding. Their fill and hit region share the same
render projection, while the canonical cubic controls remain editable.

## Does not own

Core lifecycle, app-domain behavior, UI command policy, custom engine
implementation, provider ids as dynamic imports, or speculative unavailable
profiles.

## Compose when

Compose it when an app wants some or all official design-tool defaults. Skip it
for a fully custom Framework product. Selecting one default installs its
declared dependency closure; an empty list installs none. Profile and defaults
are independent choices.

## Public entrypoints and prerequisites

Use `@asyra/preset` with a composition-open Core. Public surfaces include
`applyPreset(...)`, `PresetProfiles`, `PresetDefaults`, `PresetCatalog`,
`PresetApplyError`, and official adapters such as Group behavior. Apply exactly
once before `core.start(...)`.

## Lifecycle, inputs, outputs, and failure

Preset validates the complete selection, installs defaults in catalog order,
optionally binds the profile provider, and returns a frozen result. It does not
start Core or publish ready. Validation fails before mutation. Installer or
provider failure rolls back resources in reverse order; retryable cleanup
failure remains explicit.

With a lifecycle-aware Core, successful apply retains its resource cleanup
through `registerRuntimeCleanup`. Core awaits it during complete runtime reset;
Preset releases resources in reverse order and reports incomplete cleanup.
The result still exposes no disposer, and the old Core cannot apply again.
A fresh successor may install the same defaults. Legacy adapters lacking this
capability keep ordinary apply behavior, not complete replacement support.

## Relationships

Core exposes a strict Preset install surface. Preset `2D` binds
`@asyra/render-engine-pixi` through the engine contract. UI Context and Design
System remain distinct: Preset registers capabilities; the Design System is an
optional React presentation package.

## Maintained use path

Follow [Compose the official 2D baseline](../../start/preset-2d.md) for both the
complete Preset call and selective dependency expansion.

## Replacement and disabled behavior

Choose `PresetProfiles.CUSTOM` for an app-owned engine provider. Apps may
replace registered strategies/capabilities through declared Core lifecycle.
Without Preset, none of its defaults, selections, Group adapters, input maps,
or provider policy is installed.

## Support, migration, and deprecation

Official `2D` and `3D` providers are available; `HYBRID` remains unavailable.
`3D` requires explicit empty/INPUT defaults and optionally admits neutral
`spatial` light/shadow settings. Omitted or incompatible defaults reject before
mutation. Migration from all-defaults to selective defaults
must name the desired catalog entries and respect dependency expansion.

## Canonical sources and release inventory

- [Package contract](../../../ai/framework/packages/preset.md)
- [Package manifest](../../../../packages/preset/package.json)
- [Preset composition guide](../../../ai/framework/golden-paths/preset-composition.md)

The root entrypoint, version, catalog dependencies, and package relationships
are release-checked; version metadata remains generated from the manifest.

## Optional spatial picking

The optional spatial engine supports full-shape queries through Render/Core.
Picking retains source instance index and stable ID across LoD/culling;
hidden/nonselectable objects are excluded, while transparent selectable geometry
remains eligible. Screen overlays take precedence. Queries reuse owned geometry
and do not create GPU resources or solver evidence. Apps keep camera modes,
angles, input actions and selection policy. Queries work through official `3D` and compatible CUSTOM providers.

## Opt-in mesh definitions and pose presentation

Import `registerSpatialMesh` from `@asyra/preset/spatial` and call it with Core
before startup to register a generic mesh property, schema, component and Render
strategy. Compose the ordinary Core state/projection channels separately, as in
[custom composition](../../start/custom-composition.md). No catalog default,
Camera, navigation mode or tree UI is added. Exported definitions support normal
Core customization; failed registration cleans up in reverse. The returned
cleanup is for open composition; Core `resetRuntime` retires successful runtime
registrations. Schema-invalid runtime writes reject; invalid loads use defaults.

Instances require stable IDs and quaternion poses; meshes and instances accept
positive scale. Explicit `castShadow`/`receiveShadow` are independent of
selection. Apps configure lights and supply full/distant shapes plus geometric
error and optional `pixelError` (2 physical pixels by default). Pose, material
and placement-count updates retain unchanged geometry/material resources.

Use `SpatialPosePresentation.retarget`, `advance`, `cancel` and `dispose` for
optional pose transitions. The caller supplies progress, tolerance and reduced
motion and chooses targets; the mechanism has no clock or document writes.

For transient transform editing, use `transformSpatialPose` or capture an
App-authorized target/revision with `previewSpatialEdit`, then call
`resolveSpatialEdit` inside the App Feature immediately before its transaction.
The shared mechanism supports translation, explicit local/world axis rotation,
positive scale capability, absolute poses and optional plane/grid snapping.
Apps discard previews on cancel and own domain validity, feedback and history.

Use the explicit `@asyra/preset/spatial-assets` entry for restricted static,
self-contained GLB decoding. `decodeRestrictedGlb` returns detached immutable
triangles/bounds/source digest; `RestrictedGlbPreviewWorker` takes your bundled
Worker factory and handles bounded request lifetime/cancellation. This is the
existing `restricted-glb-v0` profile, not full glTF. Apps retain original bytes,
source binding, canonical acceptance and storage; decoding never edits a scene.

## Self-emissive spatial materials

Mesh descriptors accept optional `emissive` (24-bit sRGB color) and
`emissiveIntensity` (finite, nonnegative multiplier). Both default to zero,
preserving non-emissive materials. Preset admission rejects malformed values;
the official Three adapter applies emission on construction and appearance
updates, retaining unchanged geometry/material resources and copying the same
material to distant instances. Emission adds radiance independently of scene
lights. It does not create a light source that illuminates other surfaces and
does not enable bloom. App code supplies neutral values through public spatial
descriptors, never renderer-specific material objects. Restricted GLB import
continues to reject emissive materials; its import contract is unchanged.


## Optional emissive bloom

Set `spatial.bloom: { strength: 0.45, radius: 8 }` when applying the 3D preset
to give emissive surfaces a soft screen-space halo. The default is disabled.
`strength` must be finite in [0, 2]; `radius` must be finite in (0, 64] CSS
pixels, independent of device pixel ratio. Invalid settings are rejected.

The official provider renders an HDR emission-only mask, applies separable
Gaussian blur and adds the result before screen overlays. Ordinary lit surfaces
contribute no glow. Opaque geometry occludes the mask and transparent geometry
attenuates it by opacity. This is an optical halo, not illumination of neighboring
surfaces. The normal scene lighting and color pipeline are unchanged.

Preset owns the two resize-aware render targets and cached mask materials.
Masks are refreshed from current source materials and released on source disposal;
engine destruction releases all bloom resources. Failed passes restore scene
materials and renderer state. Bloom runs only with an existing scene frame and
adds no animation loop. Injected drivers must support render targets, clear-state
queries and rendering; unsupported drivers fail explicitly.

## Optional spatial environment reflections

Mesh descriptors accept `environmentIntensity`, a finite, nonnegative multiplier
that defaults to zero. Positive values opt the material into a shared studio
reflection map. The renderer generates this map lazily once per engine lifetime,
reuses it across meshes and updates, and disposes it at engine teardown. Changing
the multiplier does not regenerate the map. Setting zero detaches it from that
material. Invalid values are rejected at admission.

This is a studio reflection source, not a live scene capture. It never sets the
global scene environment or changes non-opted-in materials. Combine it with the
existing `metalness` and `roughness` fields to control metal highlights; it does
not change emission or bloom. The standard and distant material paths retain the
same reflection settings.

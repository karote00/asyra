# Package: @asyra/preset

## Responsibility

Provide selectable official framework defaults and preset-owned render-engine
profile policy before Core startup. Preset does not own app policy or runtime
readiness.

Preset also owns official vector-editing presentation defaults shared by the
installed editing layer and an app using that preset: vector point and segment
selection-id encoding, plus synthetic handle derivation for missing control
points. These helpers do not create canonical vector data or move editing
policy into Utils.

The official Vector component accepts the existing canonical render snapshot
without requiring a new coordinate-space marker. Its render strategy derives
engine-local draw geometry on a geometry/style miss and declares the generic
transform-only property capability for position, dimension, rotation, scale,
and skew. Transform deltas retain existing path/fill/stroke/hit geometry;
selection and path-edit overlays continue to follow the same Render result.

Vector contours are projected into disjoint filled regions according to their
explicit nonzero or evenodd rule. The same retained coverage supplies mesh
triangles and hit testing. Curves remain canonical editable controls; existing
render-only adaptive subdivision uses a 0.05 local-unit flatness bound and a
16-level recursion guard. Geometry preparation is retained by immutable points,
segments, networks and fill rule. Fill-only edits replace material; transforms
do not rebuild coverage or paint. Empty/no-fill coverage is not replaced by a
bounding rectangle. The fill mesh precedes the vector's base-stroke projection.

All vector paint uses the neutral mesh paint contract. One solid layer uses
the existing constant color/alpha paint without a parameter texture. Ordered
multiple layers use the material descriptor, including solid,
linear, radial, angular and diamond modes, alpha layers and hard stops. All
faces share the actual local geometry bounds as their material coordinate domain.
No topology-dependent native/raster routing, dimension equality admission,
source snapping or CPU color image is used. Canonical data and shared references
remain unchanged. Engine-owned parameter resources are shared for their live
reference-counted lifetime; renderer internals remain behind Core APIs.

Fill and Stroke child-record adapters preserve sparse patches. They do not
expand creation defaults into updates of existing children; component defaults
supply initial values and canonical setters own change/Undo records.

## Public Contract

```ts
import {
  applyPreset,
  PresetCatalog,
  PresetDefaults,
  PresetProfiles
} from '@asyra/preset'

const result = applyPreset(core, {
  profile: PresetProfiles['2D'],
  defaults: [PresetDefaults.BASIC_SHAPES, PresetDefaults.SELECTION]
})
```

- `profile` selects only preset engine policy.
- `defaults` selects only official product modules.
- `applyPreset(core)` selects profile `2D` and all eight available defaults.
- Omitting `defaults` selects all available defaults for every profile;
  `defaults: []` installs none.
- Explicit defaults are set-like input. Duplicate, unknown, or unavailable ids
  fail before mutation. Preset expands public dependencies and installs in
  catalog order.
- The returned `PresetApplyResult` contains only `profile`, `presetEngineId`,
  `selectedDefaults`, and `appliedDefaults`. It and its arrays are detached and
  deeply frozen; it is not a lifecycle handle and exposes no disposer.

`PresetProfiles` contains `2D`, `3D`, `HYBRID`, and `CUSTOM`. `2D`, `3D` and `CUSTOM`
are available. `HYBRID` remains unavailable and fails before mutation. `2D`
registers the Pixi provider; `3D` registers the deferred spatial provider;
`CUSTOM` registers no provider. Official profiles reject an existing provider.

For `3D`, pass explicit `defaults: []` or `[PresetDefaults.INPUT]`. Omitted
defaults still resolve to all eight and reject with `INVALID_OPTIONS`; unsupported
selected/applied defaults are identified before mutation, never filtered.
Optional `spatial: { lighting?, softwareShadowFallback? }` settings are 3D-only,
validated and detached before installation. `SpatialLighting` and
`SpatialPresentationOptions` are neutral types. Apps retain light values, Camera
angles/modes and scene policy; provider/platform callbacks remain CUSTOM-only.
The spatial SDK loads only during asynchronous engine initialization, with no
fallback after import/WebGL failure. Separate runtimes own separate engines.

`PresetDefaults` contains, in canonical order:

1. `BASIC_SHAPES`
2. `CONTAINERS`
3. `VECTOR`
4. `INPUT`
5. `SELECTION`
6. `VECTOR_EDITING`
7. `VIEWPORT`
8. `UI_CONTEXT`

`VECTOR_EDITING` publicly requires `VECTOR` and `SELECTION`; `UI_CONTEXT`
requires `SELECTION`. Property, event, channel, projection, observer, and
subscription prerequisites are private and never appear as selectable ids.

`PresetCatalog` is deeply frozen. Profile entries expose `id`, `available`, and
`presetEngineId`; default entries expose `id`, `available`, and `requires`.
Catalog engine ids are diagnostics, not dynamic-import paths.

Official managed-property names have one public typed owner:
`PresetSystemPropertyKeys`. The viewport, input, selection, and vector-editing
group exports retain responsibility boundaries; `PRESET_SYSTEM_PROPERTY_KEYS`
is derived from the flattened object for cleanup and lifecycle iteration. Apps
that install these Preset defaults reuse the exported keys rather than declaring
parallel string constants. App-only properties remain app-owned.

## Composition Order

```text
resolve and validate strict request
-> install selected default dependency closure in catalog order
-> bind the profile-owned provider when profile is 2D or 3D
-> publish frozen PresetApplyResult
-> app uses ordinary Core APIs for optional customization
-> core.start()
```

All customization and any app-owned provider binding must finish before the
first `core.start()`. A custom engine uses `profile: CUSTOM`, followed by
`core.setRenderEngineProvider(() => engine)`; custom providers never pass
through preset.

## Failure and Cleanup

`PresetApplyError` exposes one stable code from `PRESET_APPLY_ERROR_CODES`:

- `INVALID_OPTIONS`
- `UNKNOWN_PROFILE`
- `UNAVAILABLE_PROFILE`
- `UNKNOWN_DEFAULT`
- `UNAVAILABLE_DEFAULT`
- `DUPLICATE_DEFAULT`
- `COMPOSITION_CLOSED`
- `ALREADY_APPLIED`
- `ENGINE_PROVIDER_CONFLICT`
- `DEFAULT_INSTALL_FAILED`
- `CLEANUP_FAILED`

Validation failures mutate nothing. Installation or provider failure rolls back
all acquired preset-owned resources in reverse order. If cleanup fails, the
error reports frozen `completedCleanup` and `pendingCleanup` arrays plus the
original cause. The next apply on that Core retries only pending cleanup before
new validation or mutation.

A successful apply is permanent for that Core composition. A second apply
fails; apps customize successful defaults through ordinary Core APIs.

When Core exposes `registerRuntimeCleanup`, successful apply transfers its
retained cleanup entries to that lifecycle owner. Core invokes them after
canonical/graph retirement. Preset attempts every remaining resource in reverse
order, skips completed entries, and reports `CLEANUP_FAILED` with the first
cleanup cause and frozen completed/pending keys. The apply result stays a frozen
description, not a disposer. Complete reset may leave an already-retired layer
unregister as an idempotent no-op; no old resource is reactivated.

The old Core is never reopened or removed from the successful-apply guard. A
fresh successor may apply the same profile/defaults once. Failure to register the
lifecycle handoff follows ordinary failed-apply rollback. Older adapters without
this capability preserve existing apply behavior, but do not claim complete
runtime replacement support. Preset does not coordinate Core reset or own App
recovery policy.

## Ownership Boundary

- Core owns composition lock, registration graph, provider facade, startup,
  default renderer, and teardown facade.
- Render owns instance-local abstract provider storage and engine orchestration.
- The concrete engine package owns SDK runtime and resources.
- Preset owns the fixed catalog, official module installers, private
  prerequisites, profile policy, apply result, failed-apply rollback, and
  retained cleanup of successful installation resources.
- App owns which preset choices to request and any later Core customization.
- The preset-owned applied-event subscriber routes completed canonical add,
  remove, scalar, ordered batch, and record-patch envelopes to the matching
  public Render scene-tree store operation without composing or retaining a
  snapshot. Scene Tree structural batches arrive through `SCENE_TREE_CHANGED`
  once after their canonical handoff, before a dependent mutation; computed
  events use the existing local route. Shared-channel echoes do not render again.
  Both local structural consumers filter the Scene Tree instance-local
  `projectionOwner` symbol. UI receives that same ordered evidence at the outer
  transaction end by default; explicit immediate previews flush the same scoped
  sequence once before outer completion. Shared echoes cannot reorder hierarchy.
  ADD and REMOVE forward canonical `parentId` and sibling `index`
  unchanged so Render can maintain exact parent membership and order. Scalar and
  batch routes preserve each canonical `raw` or `computed` owner together with
  its complete before/after evidence; Preset does not infer ownership. It records
  the structured Render projection outcome for bounded diagnostics. Initial
  registration and every re-registration install the
  observer first and then invoke the public Render full-rebuild route so changes
  committed during an observer gap cannot leave stale output. Its idempotent
  disposer clears Render projection state and every Scene Tree-projected visual
  node once, including their abstract engine handles/resources. If the rebuild
  fails, registration fails and the existing cleanup rollback unregisters the
  observer and clears any partial projection. File-load completion invokes the
  Render rebuild through a synchronous lifecycle handler so a rebuild failure
  propagates to the caller; UI-context and vector-editing file-load work remains
  on their separate observer route.
- The preset-owned UI-context Scene Tree observer derives
  `flattenedElementIds` and `elementDataMap` from canonical Scene Tree state.
  Each exact Core/Factory batch projects once: structural changes update
  affected entries and hierarchy order, display-property changes replace only
  affected entries without rebuilding flattened hierarchy, and unrelated
  geometry changes do not republish either projection. Validated file load
  remains the sole full canonical refresh; its depth-first index follows each
  canonical child list regardless of container type (including Frame and custom
  containers), preserving the same descendants and order as incremental updates.
  These values are App-facing
  projections only and never validate, repair, reorder, or become a second
  canonical hierarchy.
  The observer retains derived identity membership only while its exact published
  map and flattened-array identities remain current. Later structural batches
  update affected memberships without rereading unrelated rows. Complete ordered
  flattened identity output is still materialized once per structural publication.
  Proven fresh depth-first tail additions consume their admitted delta without
  rediscovering roots or traversing unchanged subtrees. This does not defer
  publication or mutate earlier snapshots. Interior edits and invalidated or
  incomplete preparations still require complete ordered derivation. Formal
  tests distinguish hierarchy work from necessary immutable output copying and
  preserve every intermediate result, observer isolation and replay semantics.
  Reseeding, load, foreign publication, failure and disposal invalidate retained
  preparation; incomplete membership is not reused as a complete projection.

Preset must not accept app-provided installers, disposers, dependency objects,
engine ids, custom providers, extension callbacks, or replace semantics.

## App Customization Route

```ts
applyPreset(core)

core.removeComponentPropertyRelation('rect', 'fills')
core.unregisterRenderStrategy('rect')
core.registerRenderStrategy('rect', productRectangleStrategy)

await core.start(container, renderOptions)
```

Official config-mode property types can be inspected and redefined through
`core.getPropertyTypeDefinition()` and `core.redefinePropertyType()` after
`applyPreset(core)` and before the first `core.start()`. The successful property
owner transfers to the app while existing graph relations remain. Preset adds
no extension object, deep-import path, field mapping, or replace registry.
Constructor-mode types and complete capability replacement retain the explicit
unregister-then-define route.

## Release-Blocking Group Operations

`CONTAINERS` installs the single official invisible Group component and its
Render projection. Preset also exports the ID-driven Group adapters defined by
`../plans/completed/group-component-and-hierarchy-behaviors-plan.md`.

- The adapters use public Core/Scene Tree/property boundaries and never mutate
  hierarchy or computed data directly.
- `prepareGroupOperation(...)` and `prepareUngroupOperation(...)` produce
  canonical plans; `groupElements(...)` and `ungroupElement(...)` execute them
  inside one transaction.
- `moveElementsWithGroupGeometry(...)` delegates hierarchy validation/mutation
  to Core and performs coordinate conversion plus derived bounds-cache
  normalization when direct official Group membership is involved.
- Vector Group/ungroup/reparent updates contain only hierarchy and bounded
  element geometry values. They never include Vector point/control/segment/
  network record patches.
- `deriveGroupBounds(...)` and `normalizeGroupsForElements(...)` provide the
  one direct-child rectangle-union path. Explicit Group/Ungroup and
  identity-preserving reparent operations may apply the result deepest-first
  inside their transaction.
- Group `x` and `y` are canonical container translation. Group `width` and
  `height` are operation-produced snapshots retained for document
  compatibility; descendant-only geometry changes do not refresh those
  fields, rebase siblings, or walk ancestor Groups.
- A consumer that needs the current Group content bounds derives them
  read-only from current descendants or the current engine-neutral
  presentation projection. That projection does not write canonical data,
  create History, publish changes, or participate in persistence.
- Direct geometry updates normalize only when the explicit mutation target is
  an official Group and that operation's contract requires normalization.
  Selecting or hovering a Group remains read-only.
- `projectGroupGeometryPropertyUpdates(core, updates,
explicitGroupElementIds)` receives the caller-resolved official Group target
  ids explicitly. An empty Group-id list returns the updates unchanged without
  reading Scene Tree or computed data.
- Preset owns 2D coordinate normalization and direct-child Group bounds for the
  registered canonical `x`/`y`/`width`/`height` contract. Rotation, scale, or
  skew may participate only after the component, persistence, and Render
  contracts register the same canonical fields.
- Preset does not choose selected ids, register shortcuts or app commands,
  define post-operation selection, or own hover/click/hit/UI behavior.
- Apps may replace the official Group capability through the ordinary
  pre-start composition route without patching Preset internals.

## Validation Checklist

- imports are side-effect free;
- profile and defaults resolve independently;
- every module is independently selectable and private prerequisites dedupe;
- unselected modules install no product registrations or state;
- unknown, unavailable, duplicate, legacy, closed, conflict, and duplicate-apply
  inputs fail before mutation;
- failed apply leaves no stale registration, property, event, selection,
  channel, observer, subscription, layer, or provider;
- the root entry and 2D composition do not import the optional spatial runtime;
  reserved 3D/Hybrid profiles remain unavailable.

## Pure Group bounds entrypoint

`@asyra/preset/group-bounds` exports `deriveGroupBounds` and `GroupBounds` without
loading Core, Render, DOM or component registration. It is the same bounds owner
used by ordinary Preset Group operations and server-side design preparation.
The runtime root export remains available. Empty input returns zero bounds;
nonfinite geometry values are rejected. Rectangles retain their existing union
semantics. An oval may provide its existing type and rotation (radians); the owner
unions its analytic rotated extents while callers retain the original local
origin. Other rotated shapes are not certified by this optional oval contract.
This helper does not apply transactions, normalize hierarchy or register components.

## Optional shared spatial foundation

Spatial data types and `RenderEngineCapabilities.SPATIAL` belong to
`@asyra/render-engine`. `@asyra/preset/spatial-contract` exposes detached,
immutable descriptor/shape/instance/surface admission and shape equality without
loading Core, Render, DOM or Three.js. The `spatialV0` property identity is
unchanged. Only owner-issued receipts bypass repeat numeric scans.

`@asyra/preset/spatial-engine` exposes `ThreeEngine`, `createSpatialRenderEngine`,
its explicit platform/options seam, graphics helpers and texture resource store.
This concrete entry may load Three.js. The factory returns synchronously and
initializes asynchronously; its pure internal adapter loads the concrete engine
only during initialization. Retirement during loading rejects startup after
settlement and disposes the late delegate without publishing a surface. Import,
capability and initialization failures remain explicit; no fallback is installed.

`@asyra/preset/spatial` exports `SpatialLayer`, `SpatialBoundsOwner` and neutral
projection types, without importing a concrete SDK. `SpatialLayer` atomically
admits ordered visual records, coalesces model/camera submissions, retains mesh
identity and skips unchanged descriptors. Explicit visual/entity identity is
independent of display labels. Camera-only submissions never rewrite meshes.
`SpatialBoundsOwner` retains local shape extrema only for admitted immutable
shape receipts within its lifetime. It transforms eight local-bound corners per
instance and mesh pose on every query; empty input returns `null`. These are
conservative presentation AABBs, not collision geometry. Disposal clears retained
state and rejects later use. Apps choose visible inputs, camera policies and
canonical data; root/2D and pure contract imports do not load the spatial SDK.
CUSTOM composition explicitly selects its provider; official 3D remains
unavailable. Apps retain scene composition, stricter validation, lighting,
camera choices and interaction policy. Generic lifecycle conformance belongs to
Preset; App tests retain their rendering and product preservation obligations.

Directional shadow receiver offset follows the orthographic shadow texel size:
normal offset is 1.5 times the frustum width divided by map width, with a small
negative depth bias (-0.0001). This prevents planar self-shadow stripes when
the light covers a large scene; the provider retains cast/received shadows and
does not change canonical geometry or install application-specific exceptions.

### App-directed spatial camera controls

The optional spatial entry supplies pure perspective mechanisms:
`moveSpatialCamera`, `panSpatialCamera`, `orbitSpatialCamera`,
`lookSpatialCamera`, `dollySpatialCamera`, `zoomSpatialCamera`,
`projectSpatialCamera`, `fitSpatialCameraBounds` and `frameSpatialCameraPoints`.
`readSpatialCamera` reuses shared admission and `spatialCameraDistance` measures
an accepted view. Inputs and results use neutral spatial types; there is no SDK
or browser dependency in the control implementation. Invalid operations throw
before publication. Only perspective projection is supported.

Apps supply numeric deltas, polar limits, FOV/aspect policy, logical CSS viewport,
selected bounds/points, padding and clipping margins. Point framing uses an
oriented view-space prism; bounds framing uses corner constraints. Empty valid
fit input preserves the Camera. These helpers choose neither App mode nor angle.

`SpatialCameraPresentation` holds one admitted target. `retarget` replaces it;
`advance` consumes the current Camera plus explicit progress and App tolerance /
reduced-motion policy. `cancel` retires the target; `dispose` clears it and
rejects future work. Invalid retarget/advance preserves the accepted target.
Follow supplies the current target pose through this same contract. The owner
has no clock, timer, document reads/writes, history or mesh publication.

## Shared agent activity contract

`@asyra/preset/agent-activity` exposes version-1 semantic activity admission and
entity-scoped read projections. A connection declares structured, local,
cooperative or synthetic evidence. The archive adapter acknowledges the whole
validated batch before projection; a rejected write publishes no state.
Source sequence deduplicates replay, attempt numbers protect newer work, and
bounded presentation flushes notify only changed agents. The module creates no
provider connection, credential, task execution, reward grant or React state.
Apps own authorized transport, durable history, retention, source permissions
and scene policy. This optional subpath does not load a rendering engine.

### Shared vector coverage preparation

The vector coverage owner accepts the declared `nonzero` or `evenodd` fill rule
independently of paint. It produces disjoint filled faces and a matching hit
predicate from line/cubic contours; holes contain no filled faces and overlapping
interiors are emitted once. The default remains `nonzero` for existing compound
callers. Preparation preserves source anchors/controls; empty contours produce
empty coverage. GPU material integration must preserve these same coverage
semantics and must not select topology from the gradient mode or opacity.

## Full-shape spatial queries

The optional concrete spatial engine implements the separate spatial-query
capability. Ray hits use admitted full geometry and source instance transforms,
independent of distant-detail geometry or compacted visible slots. Queries borrow
owned geometry/material resources and create no GPU resources. Nearest hits are
ordered by distance, then current submitted visual/source-instance order.
Hidden/nonselectable visuals are excluded; opacity alone does not exclude a hit.
Interactive screen graphics precede scene hits. Bounds reuse owned local geometry
bounds and apply source-instance/world poses; no input or solver policy is inferred.
Apps consume the named Render/Core facade and retain action, capture and cancel
policy. These mechanisms do not activate the reserved `3D` profile.

## Optional spatial content and presentation

`registerSpatialMesh(core)` explicitly registers `SPATIAL_MESH_SCHEMA`,
`SPATIAL_MESH_PROPERTY_DEFINITION`, `SPATIAL_MESH_COMPONENT_DEFINITION` and
`SPATIAL_MESH_RENDER_STRATEGY` before startup. The exported definitions remain
customizable through ordinary Core registration. They do not join the Preset
catalog or install projection channels, a camera, navigation, or a tree UI.
Compose the normal Core state/projection channels for a canonical document App;
domain Apps can continue supplying completed `SpatialLayer` submissions.

The `spatial-mesh-data` property contains schema-backed `descriptor` and `visible`
values. The `spatial-mesh` component exposes them to a strategy retaining one
mesh child with explicit element/visual identity. Runtime invalid values reject;
load validation uses declared defaults. Installation failures reverse completed
registrations and report cleanup failures. The returned cleanup is for open
composition; Core `resetRuntime` owns successful runtime retirement. No second
registration or editing runtime is installed.

Neutral instances require unique stable IDs, normalized local quaternions and
optional positive scale; mesh scale is applied once after each instance pose.
`castShadow` and `receiveShadow` default to false independently of selectability.
Apps supply explicit lighting colors, intensities, positions, shadow range and
software-renderer policy. Invalid lighting rejects before driver allocation.
The shared default lighting is neutral; each existing App supplies its own style.

Distant geometry has `maxError` and optional `pixelError` (default 2 physical
pixels). Retained detail depends on current world pose, placements, full geometry,
view/projection, height, DPR and both error values. Hidden meshes resume with
current inputs. Material/pose/instance-count changes retain unchanged geometry
and material ownership; capacity changes retire only old instance buffers.
Full-shape bounds and queries remain independent of detail selection.

`SpatialPosePresentation` interpolates one admitted position/quaternion/scale
target from caller-provided progress and tolerance/reduced-motion policy.
Retarget replaces, cancel drops and dispose retires the target. It owns no time,
canonical state, geometry or scheduling. Camera choices remain App-owned.

## Generic spatial editing and restricted assets

`@asyra/preset/spatial` exports `transformSpatialPose`, `previewSpatialEdit` and
`resolveSpatialEdit`. Commands translate in world space, rotate about an explicit
axis in local/world space, apply positive scale where permitted, or admit an
absolute pose. Translation can project onto supplied orthogonal plane axes and
snap relative to a supplied origin/positive two-axis spacing; half-grid ties use
JavaScript rounding toward positive infinity. Preview values are detached and
immutable. They contain target ID/revision, never a canonical document copy.

Apps own target authorization, revision, preview lifetime/cancel, validation and
Feature routing. Resolve immediately before the existing finite transaction:
stale/deleted targets, revoked scale capability or rejected App constraints return
neutral rejection; an equivalent pose returns `unchanged`. No helper owns a
transaction, session, clock, history or persistence. Office uses these mechanisms
for its existing half-unit placement/proposals. Sim uses absolute transforms for
original-part preview/acceptance, retaining its stricter placement validation.

`@asyra/preset/spatial-assets` exports `decodeRestrictedGlb`, `GLB_LIMITS`,
`VisualAsset` and `RestrictedGlbPreviewWorker`. This optional entry preserves the
existing `restricted-glb-v0` subset, baked complete triangles, bounds, appearance
and SHA-256 source identity. Unsupported external resources, compression,
textures, animation and skins reject; there is no network fetch or GPU startup.
Root/2D imports do not import this entry. The Worker owner requires an App-supplied
Worker factory; Sim retains its bundled worker script. It owns request IDs,
result admission, cancellation, five-second deadline and termination. Source
bytes, archive receipts, domain/solid analysis, canonical acceptance and storage
acknowledgement remain App-owned. No transaction spans decoding.

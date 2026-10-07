# Package: @asyra/render-engine

## Responsibility

Engine-independent contract shared by `@asyra/render`, concrete engines, and
custom engine implementations.

## Owns

- engine/surface lifecycle and one-shot frame-scheduling contracts;
- semantic create, update, hierarchy, draw, resource, viewport, resize, and
  flush commands;
- engine-neutral queries for bounds, coordinate conversion, and hit testing;
- opaque object/resource handles;
- an opaque runtime identity returned from initialization for compatibility
  facades; the contract does not define or inspect its concrete SDK type;
- normalized pointer interaction events;
- capability identifiers and deterministic unsupported-capability errors;
- engine-independent contract-test utilities.

## Must Not Own

- Pixi, DOM, or another concrete engine SDK;
- framework state subscriptions, render layers, or feature decisions;
- a default engine singleton;
- speculative production modes without an implemented engine and formal use
  case.

## Public Surface

- `RenderEngine`, `RenderEngineProvider`;
- `RenderEngineCommand`, `RenderEngineCommandResult`, and the named command
  variants composed by `RenderEngineCommand`;
- `RenderEngineDrawOperation` and its named operation variants;
- `RenderEngineQuery`, `RenderEngineQueryResult`, and their named query/result
  variants;
- `RenderEngineObjectHandle`, `RenderEngineResourceHandle`;
- `RenderEngineInitializeOptions`, `RenderEngineInitializeResult`,
  `RenderEngineDestroyResult`;
- `RenderEngineInteractionEvent`, `RenderEngineInteractionListener`;
- `RenderEngineCapabilities`, `assertRenderEngineCapabilities(...)`;
- `UnsupportedRenderEngineCapabilityError`.

`initialize(...)` may be asynchronous. `execute(...)`, `query(...)`, and
`destroy()` are synchronous so render orchestration observes deterministic
command results and cleanup. `RenderEngineInitializeResult.runtime` is
`unknown`: adapters may forward its identity through an existing compatibility
API, but may not branch on its concrete type.

`requestFrame(callback)` owns one pending one-shot scheduling slot. A concrete
engine consumes that callback before invoking it, so it cannot become a
permanent loop; `cancelFrame()` prevents the pending callback. Scheduling never
draws by itself. Concrete output occurs only when Render submits the explicit
`flush` command.

The engine-neutral Graphics operations include a `poly` path primitive with
ordered points and an explicit close flag. It represents one linear path inside
one Graphics object; it does not merge canonical elements or introduce a
multi-object Render command. Concrete engines may translate it to their native
single-path primitive while curved topology continues to use the ordered
move/line/Bézier operations.

## Capabilities

`RenderEngineObjectProperties.transformGroup` is an optional boolean hint for
an independent transform domain. It preserves child coordinates, painter order
and interaction identity. Engines may ignore the hint while producing identical
output; it is not a persisted document Group or a new capability requirement.
The Render adapter requests it for its camera container, not screen overlays.

The current contract exposes only capabilities backed by current formal cases:

- `objects`;
- `graphics`;
- `interaction`;
- `resources`.

Call `assertRenderEngineCapabilities(...)` before initialization. Missing
requirements throw `UnsupportedRenderEngineCapabilityError`; no adapter may
inspect a concrete engine or fall back to Pixi.

## Contract Testing

Import `RecordingRenderEngine` and `runRenderEngineContract(...)` from
`@asyra/render-engine/testing`. The adapter verifies lifecycle, semantic
commands, opaque handles, normalized events, capability failure, cleanup, and
instance isolation without depending on a concrete SDK.

## Dependency Boundary

- `@asyra/render` -> `@asyra/render-engine`;
- concrete engine -> `@asyra/render-engine`;
- no dependency between `@asyra/render` and a concrete engine;
- non-render framework packages do not depend on this package unless they own
  composition types.

### Optional retained transforms

`RenderEngineCapabilities.TRANSFORM_GROUPS` (`transform-groups`) advertises
support for the optional boolean `transformGroup` object property. Render
forwards this optimization hint only to engines advertising that capability.
Engines without it continue receiving ordinary position/scale commands; an
unsupported hint-only update sends no command. It is not a startup requirement
and does not change required-capability errors, painter order or coordinates.

## Mesh material descriptors

`RenderEngineMeshMaterial` is transient engine-neutral paint data for the mesh
`material` property. Its ordered fills are solid RGBA or gradient descriptors
(linear/radial/angular/diamond, start/end/optional side, ordered stops). RGBA
channels are straight values in [0,1]. UVs supplied with mesh geometry define
one object-local material domain across all triangles. These descriptors never
contain Pixi objects, document IDs, shape topology or editable canonical state.
The concrete engine owns GPU representation and resource lifetime. Omitting a
material retains existing solid mesh tint/alpha behavior. This is an additive
runtime property contract, not a saved-file format change.

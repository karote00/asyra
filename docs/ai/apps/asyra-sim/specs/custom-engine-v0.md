# CUSTOM Spatial Engine Contract

## Scope

The App composes the shared Preset Three.js adapter using the ordinary
`Core -> Render -> RenderEngine` boundary. Preset composition uses `CUSTOM` and
explicitly selected defaults. Official `3D` and `HYBRID` profiles remain
unavailable. This is not a public Framework 3D guarantee.

The engine owns SDK objects, camera projection, rasterization, visual ray
selection, GPU resources, and normalized pointer events. It imports only public
`@asyra/render-engine` contracts and its own engine-neutral spatial descriptor;
the concrete implementation cannot import Core, Render, workcells, trajectories, solvers, or UI. Sim supplies its rigid admission and lighting policy through a narrow App adapter.

## Spatial Projection

The App registers one custom layer through `core.registerRenderLayer`. Its
RenderContainer/RenderMesh wrappers project explicit versioned spatial data
through the existing public object-properties command surface. They never
extract or invoke the engine runtime from Core.

Spatial descriptors are typed, validated data: perspective camera configuration,
rigid pose, primitive dimensions or indexed triangle geometry, appearance, and
selectability. Coordinates are right-handed, Y-up, and measured in meters.
Quaternions use `[x, y, z, w]`; rotations and poses are computed by the App domain,
not inferred from robot data by the engine. Nonuniform scale is not a pose.

Each body projection has its own opaque engine handle. Camera and mesh updates
travel through Render commands; camera is a spatial container descriptor, not a
fake mesh or a second canvas. The descriptor uses the neutral shared spatial capability, with narrower rigid
App admission; generic `Record<string, unknown>` typing alone is not evidence
that arbitrary engines support it. Unknown versions and malformed descriptors
fail explicitly before changing an accepted object.

Spatial admission returns detached, deeply immutable descriptors and shapes.
Only owner-issued admission receipts permit reuse of those exact immutable
products; caller identity, shallow freezing or user-provided flags never bypass
validation. New poses and appearance values still pass descriptor admission,
while an unchanged admitted shape does not rescan or copy its triangles. Weak
receipts retain no dead geometry and create no document or solver cache.

Framework 2D containers and graphics remain an independent screen-space bridge.
Spatial nodes receive complete domain world poses and do not reinterpret the
Framework's 2D affine `worldTransform` as 3D. They may be grouped for resource
ownership, but the engine must not recompute the canonical robot hierarchy.

The projection owner retains complete admitted local shapes for one detached
workcell and source input. Shared domain kinematics produces each new pose;
camera, selection and playback do not rebuild unchanged triangles. A new
workcell/source/binding input creates a fresh projection, including import
preview, Undo/Redo and historical replacement. Missing sources remain errors.
Camera-only submission touches only the spatial camera container. Pending
model and camera submissions preserve accepted call order and invalidate the
existing Framework frame once; no second draw loop or canonical state appears.
Screen queries retain the public 2D query semantics; visual spatial hit testing
casts a camera ray and returns the nearest selectable visible handle. No visual
query is collision evidence.

This App does not claim full interoperability with the Design renderer. Its
small screen bridge supports translation/rotation/scale, visibility, solid
fills and one-device-pixel lines. It rejects screen skew, non-unit container
alpha, thick lines, unknown property keys, and meshes without spatial
descriptors. These limitations do not reduce the supported 3D primitives or
their explicit opacity. Unsupported requests fail before replacing accepted
content; silently ignoring a requested effect is not conformance. General 2D
rendering parity is outside R0 and must be revisited before generic extraction.

The runtime's App-facing `pick(x, y)` accepts DOM client coordinates and calls
Core's `pickSpatialAtClientPoint` facade. Render converts client coordinates once using
the actual canvas bounds and logical surface size; it gives eligible screen
overlays precedence, then resolves spatial hits through explicit visual/entity
identity. The old `getElementIdAtClientPos` retains its surface-local semantics
and is not the Sim DOM picking route. Outside or zero-sized surfaces return no
hit. CSS scaling and DPR do not change model coordinates. Visual hit results
remain separate from original-source collision evidence.

## Lifecycle

Composition stores the provider without constructing an engine. Startup creates
one owned surface. Rendering occurs only on an explicit Framework `flush`.
`requestFrame` owns one cancellable, one-shot callback; it does not draw or start
a permanent engine animation loop. Resize updates surface and camera aspect.

The App observes its host's CSS dimensions and calls the public
`core.resizeRenderer(width, height)` facade. Core validates finite positive
dimensions and forwards to the active `IRenderer`; Render retains surface-command
ownership. This minimal facade supports both 2D canvases and CUSTOM 3D surfaces.
It adds no 3D semantics or Preset enablement. Hidden zero-size hosts defer their
request at the App boundary; invalid public requests throw before forwarding.

Destroy is idempotent and releases geometry, materials, renderer, pointer
listeners, resources, and pending callbacks. Destroyed or foreign handles fail;
no late callback may draw a destroyed engine. Initialization failures clean up
their partial resources and remain errors, without a Pixi or no-canvas fallback.

Pose-only and appearance-only updates retain each live mesh's GPU geometry and
material. Geometry replacement compares validated shape values, not caller
object identity; changed shapes release their previous resources exactly once.
This is per-handle resource ownership, not a workcell or solver cache.

The default driver uses tone-mapped studio lighting and one bounded 1024-pixel
shadow map for the central metre-scale workspace. Only opaque selectable meshes
cast shadows; wireframe proxies do not. Shadowed surfaces, light frusta and
lighting are display choices, never collision or enclosure evidence. Light
shadow resources are released on teardown along with ordinary mesh resources.

## Product Cases and Done

Permanent tests cover provider/startup isolation, shared engine contract
conformance, perspective projection, depth-aware selection, quaternion poses,
primitive dimensions, camera/resize updates, explicit flush scheduling,
invalid/foreign handles, hierarchy operations, and repeated resource cleanup.
A normal Core/custom-layer integration case proves the handoff rather than
testing only direct SDK calls. Browser evidence must exercise the real WebGL
surface; a stubbed graphics driver is unit-test evidence only.

M0 succeeds only after the normal pipeline and numerical feasibility proofs
pass. This contract does not turn a rotating cube into a completed R0 product.

## Shared implementation

Pure admission lives in `@asyra/preset/spatial-contract`; incremental projection,
bounds and Camera controls live in `@asyra/preset/spatial`; concrete SDK execution
and resource cleanup live in `@asyra/preset/spatial-engine`. Sim's wrappers retain
only layer identity, rigid descriptor restrictions and studio-lighting policy.
Its original source, GLB binding, analysis and playback owners are unchanged.
The restricted GLB decoder remains App-owned until the separately scoped asset
extension task. This migration does not activate the official 3D profile.

The CUSTOM engine advertises only its implemented object, graphics, interaction,
resource and spatial capabilities. The optional framework snapshot query is not
supported and fails with UnsupportedRenderEngineCapabilityError before projection
or drawing. Adding a framework capability does not opt this engine into it.

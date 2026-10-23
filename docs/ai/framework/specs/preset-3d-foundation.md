# Preset 3D Foundation Contract

## Status and authority

Target contract for [Preset 3D Foundation and App Migration](../plans/preset-3d-foundation-plan.md),
Task 1. Reviewed against planning source
`47302dcea86e525a23500f6344eb859631264952`. APIs and entries described as target
surfaces below are not claims about currently exported capabilities.

This specification owns behavior. The associated
[flow document](../plans/preset-3d-foundation/preset-3d-foundation.flow.json)
owns architecture, implementation boundaries, task dependencies and current
evidence. Runtime criteria remain unverified until their implementation tests
run. No production change is part of Task 1.

## Single architecture and App policy

All 3D consumers use Feature -> API -> canonical state -> projection -> Render
-> engine. Canonical Scene Tree, properties, transactions and replay have their
existing Framework owners. A visible tree panel is optional App UI and never
selects a different runtime/model. Derived geometry remains a projection of its
canonical source; rendering many instances does not require one editable
document element per vertex or instance. Stable visual identities map back to
App/canonical identities through explicit registration, not labels.

Apps own content, geometry generation, validity policy, saved identity/migration,
camera angles/modes/targets/bindings and UI. Preset provides neutral optional
mechanisms. No App name, crop type, robot joint, task status, reward or room rule
is an input to a shared renderer/control decision.

User/command intentions enter Features. Camera and presentation intentions may
update runtime-only state without document history; subsequent interpolation
frames consume accepted targets and time, not new domain decisions. App-specific
simulation/evidence clocks remain App-owned. Load/replay use state-apply owners
and do not re-execute Features.

## Composition

Keep `applyPreset` synchronous and keep the existing eight `PresetDefaults`
identities, dependency closure and ordering. Omitted defaults still resolve to
all available defaults; `[]` still resolves to none. Do not add spatial modules
to that auto-selected catalog in this plan. Neutral spatial definitions,
projection layers and control helpers are opt-in exports composed through
ordinary Core registration before startup. This is optional foundation reuse,
not a caller-supplied installer callback or a new installation runtime.

At Task 8, `3D` binds the official spatial provider. Supported combinations are
`defaults: []` and an explicit selection containing only `INPUT`. `INPUT` owns
normalized input properties/events, not an App navigation policy. Existing
`BASIC_SHAPES`, `CONTAINERS`, `VECTOR`, `SELECTION`, `VECTOR_EDITING`, `VIEWPORT`
and `UI_CONTEXT` install 2D-specific behavior and are not supported by the
official 3D provider in this contract. `UI_CONTEXT`'s selection dependency does
not bypass this restriction.

Resolution first computes the unchanged selected/applied lists. Before any
registration/provider mutation, a `3D` combination containing an unsupported
default fails with `PresetApplyError` code `INVALID_OPTIONS`, identifying the
incompatible selected/applied defaults. Thus omitted defaults under `3D` reject
explicitly; they are never filtered. Documentation must show explicit `[]` as
the minimal 3D composition. Profile availability changes provider policy and
request admission, not defaults resolution. `2D` and `CUSTOM` behavior remains
unchanged. CUSTOM callers remain responsible for their provider's capabilities.

Both official profiles reject an existing provider before installation.
Unavailable `3D`/`HYBRID` still fail with `UNAVAILABLE_PROFILE` until activation.
Duplicate apply, composition lock, reverse failed-apply rollback and successful
installation cleanup retain their existing owner. Optional spatial registrations
acquire lifecycle cleanup through Core; cleanup errors are not swallowed.

The provider factory remains synchronous. A pure lazy adapter advertises only
the declared supported neutral capabilities; its asynchronous `initialize`
loads the concrete spatial implementation. Render already awaits initialization.
Commands cannot run before successful initialization. Destroy during loading
retires that generation; a late-loaded delegate is disposed without publishing
a surface. The startup promise settles before a replacement runtime starts.
No engine fallback occurs after import/WebGL/capability failure.

2D execution must not evaluate/load the spatial SDK. A build may emit a separate
3D chunk, but must not include it in the eagerly loaded 2D entry/chunk graph.
Catalog inspection and pure contract imports load no concrete renderer.

## Target public boundaries

| Boundary                         | Target content                                                                            | Constraints                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `@asyra/render-engine`           | Neutral spatial data, query/result and capability contracts                               | No Three.js types, admission state, registries or SDK imports    |
| `@asyra/preset/spatial-contract` | Pure admission and neutral data exports                                                   | No Core, Render, DOM or SDK runtime imports; one receipt owner   |
| `@asyra/preset/spatial`          | Shared projection/control mechanisms and optional component/property/strategy definitions | Ordinary Core/Render APIs; no concrete renderer exports          |
| `@asyra/preset/spatial-engine`   | Concrete adapter and explicit CUSTOM factory/platform test seam                           | SDK-specific helpers/types remain here, not App/domain APIs      |
| `@asyra/preset/spatial-assets`   | Restricted GLB decoding and detached asset output                                         | No rendering, network, canonical writes or storage policy        |
| Core/Render facade               | Spatial queries by registered projection identity                                         | No public raw engine/SDK access or generic unchecked command bag |

These subpaths are proposed additions/refinement of existing exports, not new
packages/dependencies. Migrate current consumers together and remove superseded
re-exports; this plan does not add legacy compatibility aliases. Existing
`spatialV0` data and App persisted/wire identifiers are not renamed merely to
move code. Neutral capability constants have one Render Engine owner; existing
App restrictions become explicit App admission, not a shared capability named
after an App.

The optional model definitions cover a neutral mesh component with schema-backed
local shape, complete pose, appearance and visibility/selectability properties,
plus its Render strategy. They use ordinary `definePropertyComponent`,
`defineComponent` and render-strategy registration. Domain Apps may keep their
existing canonical components and feed the same projection contracts. This is
one model/projection architecture, not a second document mode. No default
canonical camera, room, robot, tree panel or navigation mode is installed.
Apps that persist a named camera view do so through their own canonical schema.
Selection registration reuses the existing selection APIs/channels and optional
spatial overlays; it does not install the 2D `SELECTION` catalog module.

## Spatial data and admission

Use right-handed Y-up coordinates, meters at the projection boundary,
quaternions `[x,y,z,w]`, radians for control rotations and degrees for camera
vertical field of view. App imports perform declared unit conversion once.
Geometry uses local positions with indexed triangles. Colors are finite
normalized components; texture byte channels are integers in [0,255].

Preserve box, sphere, capsule, triangles, vertex colors, UV, albedo/normal surface,
opacity, roughness, metalness and wireframe. Descriptor and surface admission
detaches untrusted arrays, validates the exact captured values and freezes the
accepted result. Only owner-issued immutable receipts bypass repeat admission;
caller identity/freezing cannot. Invalid runtime input rejects before replacing
accepted output. Empty scenes are valid; an invalid/empty triangle shape is not
silently replaced by a box. Existing geometry/texture limits are preserved.

Meshes supply complete world position/rotation and optional positive scale
(omission means unit scale). Zero/negative/nonfinite scale and shear reject.
Render hierarchy owns resource grouping/visibility, not additional 3D parent
transform accumulation. Local-to-world applies the mesh pose exactly once.
App canonical hierarchy/kinematics remains the sole source of completed poses.

Instances supply unique stable string IDs, local position/quaternion and optional
positive scale. App adapters convert existing yaw placement once at the admitted
placement boundary. Array index/compacted GPU slot is not an instance identity.
Changing placements preserves shared shape identity; removing IDs invalidates
their interaction mapping. Scale changes are pose changes, not geometry baking.
Sim may reject scale or features outside its rigid-part product contract.

Pure structural admission is shared; App validators may impose narrower domain
constraints before accepting their model. They may not redefine neutral units,
poses or shape equality. Canonical property schemas retain runtime rejection and
document-load fallback semantics. App envelope/asset migration precedes canonical
load; a missing external source remains a reported error, not invented geometry.

## Projection and resources

A scene submission contains one App-selected camera and ordered visual records:
stable visual ID, optional canonical entity ID, admitted mesh descriptor and
visibility. Validate the entire submission before replacing accepted pending
work; duplicate IDs, invalid identity and malformed records reject atomically.
One source may produce multiple visual records. Use Render interaction targets
and explicit reverse mapping; labels remain presentation only.

Latest accepted scene/camera call order wins. Coalesce pending frame requests
without discarding the latest accepted model. Camera-only submissions do not
resubmit meshes; unchanged descriptors do not issue mesh updates. Removal
releases the visual once. Pose/material-only changes retain geometry. Domain
shape generation and source retention stay in their current App owners.

Adapter resources belong to one runtime. Shared surface textures remain alive
until the final owning material is released. Geometry/detail replacement and
teardown release buffers/materials/textures/lights and listeners exactly once.
No cross-runtime mutable cache is introduced. Existing proven retention remains
at its owner; no new cache is authorized without profiling and explicit
dimensions/invalidation in the flow.

Local shape bounds are independent of pose; world/instance bounds include every
current transform. Camera fitting uses the eight world-bound corners and current
aspect/clipping, not every vertex per instance. Output equals a fresh complete
calculation after any real dependency change. Invalid/retired input is never
served from retained results.

## Camera control

Support one active perspective camera per surface initially. Validate finite
position/target, nondegenerate direction, normalized up basis, valid FOV and
`0 < near < far`. Preserve existing Y-up nonparallel-direction restrictions
until a separately reviewed up/roll capability exists. Unsupported projection
modes reject explicitly; an orthographic screen overlay is not a world camera.

Controls accept explicit camera values, dimensions, deltas and App limits;
return a valid camera or a structured rejected operation. Mechanisms include
pan, orbit, look, dolly, translation, fit and explicit target interpolation.
The App chooses when to invoke them and supplies mode, speed, padding, target
and limits. No mode is inferred from the scene or selected entity type.

An empty fit set preserves the camera. Fit includes selected visible bounds
chosen by the App; near/far must include that set. CSS viewport dimensions and
DPR have distinct roles. Camera transitions keep at most one current target;
retarget/cancel retires the old target without a queue. Reduced-motion input
settles to the accepted target without animation. Follow consumes current target
poses; it does not read tasks or decide destinations. No per-frame React document
publication, geometry rebuilding or extra permanent draw loop is introduced.

## Spatial queries and input

Add typed spatial queries to Render Engine and expose them through Render/Core:

- World projection: world point -> surface-local CSS point, depth and in-frustum
  flag; behind-camera points never masquerade as valid visible positions.
- Screen ray: finite surface point -> world origin and normalized direction;
  points outside the surface return no ray.
- Spatial point conversion: local/world point for a registered visual and
  optional instance -> converted 3D point, applying the complete pose once.
- Spatial bounds: local/world AABB or null for empty content; projected 2D bounds
  remain a distinct query. Do not change old `get-bounds`/`to-local` meanings.
- Spatial ray hit: ordered visible eligible hits with visual identity, optional
  entity/instance identity, distance and world point. Triangle detail is not
  required by this contract. Equal-distance ties use stable submitted order.

At the engine boundary, handles remain opaque; Render maps them to registered
visual/entity IDs. Unknown/foreign/retired handles reject. No hit is an explicit
empty result. Picking ignores hidden/nonselectable geometry; transparency alone
does not make a selectable object unpickable. Interactive screen overlays have
explicit precedence over scene hits. LoD/culling slot changes preserve instance
identity; interaction tests use the admitted full shape for selectable instances
so detail choice does not change selection semantics. These are visual queries,
never collision or physical-clearance evidence.

DOM client-to-surface conversion occurs once using actual bounds and logical
size; zero-sized/outside surfaces yield no hit. Existing legacy facade names do
not authorize duplicate conversion. Pointer IDs, modifiers, capture/loss and
cancel follow Input/Feature owners. Selection state uses existing selection
channels; no 2D overlay is implicitly installed to obtain the selection owner.

## Presentation and editing

Light/shadow controls are neutral and explicit. Separate `castShadow`,
`receiveShadow`, visibility and selectability. Preserve each App's current
lighting/software-renderer policy by explicit App composition; no shared code
chooses an App style. Shadow degradation may follow an explicit supported
quality policy, never conceal missing geometry or unsupported capabilities.

App-supplied full/distant geometry and geometric error remain completed inputs.
LoD uses explicit pixel-error policy and current view/projection/viewport/DPR,
world pose and instance placements. Camera/visibility changes recompute only
dependent work; no texture generation or domain simplification runs per frame.
Hidden output resumes from current accepted state. Canonical source geometry
remains unchanged for all analysis/export consumers.

Generic editing operates on App-authorized target IDs and supplied axes/plane,
grid origin/spacing and transform constraints. Positive-scale support is optional
per target capability; rigid Sim targets reject it. Incomplete preview is runtime
state. Commit validates current target/revision and applies one existing
transaction; cancel discards preview with no document/history entry. Failure
rolls back atomically. Snapping is deterministic relative to the supplied grid,
not a room/crop/robot validity rule. Apps own placement validation and feedback
wording. Input intent still enters a Feature; these helpers are not a second
session runtime. Selection outline/grid/axes/handles remain optional render output.

## Restricted assets and persistence

Preserve Sim's current `restricted-glb-v0` limits and supported topology/material
rules. Do not silently expand to full glTF, compressed geometry, external URLs,
skins or animation. Decode supplied bytes into detached meshes, bounds and source
digest; preserve original source bytes/identity for App binding and storage.
Cancellation may discard an unfinished decode/worker result; no canonical
transaction spans parsing. Acceptance rechecks App revision/source policy in a
Feature before a finite transaction. Stale/invalid/oversized input cannot attach
a partial scene. Storage acknowledgement remains separate from canonical commit.

Save canonical data and App-owned asset references, not camera transit, movement,
handles or GPU objects. Load, Undo/Redo and local shared changes project through
the same owners without echo or duplicate feature execution. Tree visibility
and current camera mode cannot change serialized model meaning.

## Verification cases and gates

Each case below is a required executable behavior specification for the named
owner. Existing test locations are preservation anchors, not claims that new
assertions already exist. Implement missing permanent assertions before the
corresponding production slice; run a failing regression first for any bug fix.
Flow runtime criteria use the supported custom producer boundary to publish
only actual source-bound test evidence, never a successful command alone.

| Case                       | Inputs and expected result                                                                                                                                     | Permanent test owner / gate                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01 composition            | `2D`/`CUSTOM` unchanged; `3D` `[]`/`[INPUT]` accepted after activation; omitted/2D defaults reject before mutation; HYBRID unavailable                         | `packages/preset/src/__tests__/apply-preset.test.ts`, `preset-request-resolution.test.ts`, `profile-provider.test.ts`; Preset test:local             |
| C02 lazy lifetime          | Import pure/2D entries without SDK evaluation; reject commands before ready; initialize failure/destroy-during-load settles and releases late delegate         | Preset spatial engine tests plus `packages/core/src/__tests__/render-engine-provider.test.ts`, `core-start-render.test.ts`; package tests and builds |
| C03 admission              | Mutable/malformed/oversized shapes and instances reject atomically; detached admitted input cannot be changed; strict Sim restrictions remain                  | Shared spatial admission tests and both Apps' `src/engine/__tests__/spatial-admission.test.ts`                                                       |
| C04 projection             | Scene A -> camera B -> invalid scene C keeps A/B; valid C supersedes; repeated camera/descriptor submits do not resend meshes                                  | Shared layer tests, `apps/asyra-sim/src/render-app/__tests__/spatial-layer.test.ts`                                                                  |
| C05 bounds/pose            | Rotated/scaled/instanced local geometry gives correct world bounds/conversion; one pose application, empty bounds null; no vertex scan per instance            | Shared bounds tests and FieldScope `camera-navigation.test.ts`                                                                                       |
| C06 camera                 | Two Apps choose different modes/angles; same mechanisms preserve policy; empty fit no-op; aspect/clipping correct; retarget/cancel has no stale motion/history | Shared controls tests, Sim viewport-camera and FieldScope camera-flight/navigation tests                                                             |
| C07 queries                | DPR/CSS scale/outside surface, near/far depth, transparent selectable, hidden/unselectable, instance reorder/LoD, foreign handles                              | Shared engine tests, Render interaction/facade tests, actual App E2E picking                                                                         |
| C08 resources/detail       | Pose/material reuse; last texture consumer releases; current visibility/LoD state; explicit shadow policy preserved; no domain regeneration                    | Both Apps' engine suites, FieldScope surface-textures and source profile tests                                                                       |
| C09 editing                | App constraint rejects; preview cancel no writes; valid commit one Undo; stale target rejects; Undo/Redo/load restore output                                   | Shared editing integration tests and Office runtime layout/proposal/history tests                                                                    |
| C10 assets                 | Current restricted fixtures decode identically; invalid/unsupported/oversized reject; cancelled/stale results do not attach                                    | Sim `src/engine/glb/__tests__/decode.test.ts`, `preview-worker.test.ts`, `runtime.browser.spec.ts`                                                   |
| C11 state/app preservation | Tree UI visibility independent; Sim original-source/playback meaning, FieldScope update isolation, Office proposal/save acknowledgement remain                 | Existing affected App runtime/domain preservation suites through their supervisors                                                                   |
| C12 integrated lifecycle   | Real Core composition -> edit -> render -> pick -> replay -> save/load -> retire/restart; local shared projection once; separate instances isolated            | Core/Render/Preset integration plus all three App real-WebGL E2E; synchronized visual review                                                         |

Future task commands: `yarn workspace @asyra/preset test:local`; affected Core,
Render and Render Engine `test:local`; App `test:local`, `typecheck`, `build`
and `test:e2e` scripts. Sim/FieldScope retain their supervisor and heavy/profile
guards. Run `yarn lint:naming`, affected lint/dependency/document checks and
source-space oracles before visual closure. Exact file/title selections belong
in each step card; no speculative test runner or new dependency is needed.

Cold/repeated/changed/deleted/retired input sequences must prove both correct
output and meaningful work counts. New caching is not implied by these counts.
Synthetic graphics drivers prove contracts, not actual WebGL output. Runtime
criteria remain missing until published evidence is bound to the actual tested
source. Task 1 validates design and admission only.

## Definition of done

All C01-C12 obligations and affected accepted behavior pass on one integrated
source; each architecture owner/handoff has valid evidence. The three Apps use
the shared mechanisms, keep their policies and saved identity, and no longer
retain superseded shared implementations. Official `3D` activates only after
its prerequisites; HYBRID remains unavailable. Task 9 extensions and final
integration remain required for whole-plan closeout. Unsupported features are
documented; no full-glTF, physics, solver, multiview or orthographic claim is made.

# Preset 3D Foundation and App Migration

## Status and task association

Created: 2026-10-24.

Status: Tasks 1-6 complete within their bounded contracts; stopped for user
inspection before Task 7. Task 1 produced the reviewed specification and full
architecture flow. Tasks 2-3 delivered pure admission, resource ownership and
shared incremental projection/bounds with direct App preservation checks.
Tasks 4-5 add App-directed shared Camera controls and typed spatial queries with
shared picking. Task 6 adds opt-in mesh definitions, generalized instance/pose
presentation, explicit lighting/shadows and physical-pixel detail controls.
Tasks 7-10 remain unexecuted;
official 3D activation and whole-flow runtime acceptance remain pending.

Planning base: local `main` at
`eaddcdba2c1705dca6646a730cd87818ae214d56`.
Planning branch: `codex/preset-3d-foundation-plan`.
Closeout owner: the coordinating agent in the originating Preset 3D conversation
with Asa. Individual task completion does not close this plan.

Future work selects an exact Task heading below using
[task context](../../workflows/task-context.md). Select a base containing this
plan and the accepted prerequisite changes; the planning base above does not
already contain the new plan. Record the actual base SHA, prerequisites and
reviewed flow revision at handoff. Repository Git and execution rules apply.

The existing [3D and Hybrid activation plan](preset-2d-3d-init-profile-plan.md)
continues to own profile activation prerequisites. This plan owns the bounded
3D foundation, consumer migrations and evidence that satisfy its 3D gate.
HYBRID activation remains outside this plan. No current availability or runtime
contract changes merely because this plan exists.

## Binding product decisions

1. **One 3D architecture.** There are no separate document-editor and
   domain-presentation framework modes. All Apps use the same canonical owners,
   Feature/API boundaries, derived projection and rendering contracts. Whether
   an App exposes a Scene Tree panel, and how it presents that structure, is an
   App UI decision. Tree visibility cannot select a different state model,
   persistence path, interaction runtime or rendering architecture.
2. **App-controlled camera policy.** The App chooses camera angles, projection
   mode, navigation mode, targets, view presets, bindings, speeds and follow
   behavior. Framework/Preset provides neutral camera control mechanisms and
   supported capabilities. It does not choose an overview, orbit/fly mode,
   selected-agent view or a product-specific camera preset.
3. **Generic foundation only.** Preset supplies optional official defaults and
   shared mechanisms. Domain geometry, simulation, decisions, assets and product
   workflows stay in Apps. Shared code must not branch on an App identity.
4. **Preserve existing Asyra ownership.** No second canonical scene store,
   selection runtime, transaction journal, history stack or engine-owned domain
   model is introduced. A derived mesh is not automatically a new canonical
   element; existing App model granularity remains App-owned within the single
   architecture, independently of whether a tree is displayed.

## Objective and bounded scope

Deliver a reusable Preset 3D foundation consumed by Asyra Sim, Asyra FieldScope
and Asyra Office, followed by evidence-gated official `3D` profile activation.
Keep existing product behavior, saved identities and `2D`/`CUSTOM` composition
intact. Deliver the agreed generic editing and restricted asset extensions as
separate bounded tasks; profile activation alone is not whole-plan completion.

The implementation family is `packages/preset`, required engine-neutral
contracts in `packages/render-engine`, their direct Render/Core facade owners,
and the three Apps' composition, spatial projection, camera, interaction and
asset adapters. Include direct permanent tests, package/public documentation,
reviewed flow artifacts and applicable release metadata. Task 1 narrows each
slice to an exact allowlist before implementation; this family is not blanket
permission to refactor Framework or App domains.

Discovery is limited to those owners, their current public APIs, the sources
listed below, affected tests and direct consumers. After each slice begins,
review only its diff, affected consumers, regressions and frozen gates. Stop an
affected slice if it requires a new domain decision, unsupported public API,
unreviewed architecture change or an out-of-scope dependency. Preserve independent
in-scope work without inventing a fallback or weakening acceptance.

## Current source and behavior to preserve

The planning baseline has a shared `@asyra/preset/spatial` CUSTOM adapter, not
an available official `3D` profile. `3D` and `HYBRID` remain unavailable.

| Consumer   | Current behavior and foundation needs                                                                                                        | App-owned semantics                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Sim        | Primitive/original triangle meshes, rigid poses, perspective depth picking, camera navigation/fit, restricted GLB preview, playback feedback | Robot joints/FK, trajectories, source bindings, collision/clearance analysis, experiments, evidence and persistence policy  |
| FieldScope | Procedural site/crop/robot output, vertex colors/UV/maps, repeated instances, LoD, visibility/opacity, navigation and bounds                 | Farm/crop generation, placement, source geometry, harvesting/walking/observation models and engineering decisions           |
| Office     | Room/object composition, canonical layout editing, semantic activity presentation, movement, focus/follow and camera transitions             | Room/furniture/character/pet content, destinations, task-to-behavior decisions, placement validity, rewards and permissions |

Office's complete decorating, floor construction, snapping and advanced detail
requirements are requirements, not existing verified behavior. Preserve its
implemented layout/history/save boundary while introducing only the generic
mechanisms selected by this plan.

Direct source anchors:

- [Preset contract](../packages/preset.md),
  [engine contract](../packages/render-engine.md),
  [Framework architecture](../ARCHITECTURE.md).
- [Shared spatial entry](../../../../packages/preset/src/spatial.ts),
  [descriptors](../../../../packages/preset/src/spatial/spatial-contract.ts),
  [Three adapter](../../../../packages/preset/src/spatial/three-engine.ts).
- [Sim architecture](../../apps/asyra-sim/ARCHITECTURE.md),
  [CUSTOM contract](../../apps/asyra-sim/specs/custom-engine-v0.md),
  [Sim layer](../../../../apps/asyra-sim/src/render-app/spatial-layer.ts).
- [FieldScope architecture](../../apps/asyra-fieldscope/ARCHITECTURE.md),
  [rendering](../../apps/asyra-fieldscope/modules/rendering.md),
  [FieldScope layer](../../../../apps/asyra-fieldscope/src/render-app/spatial-layer.ts).
- [Office implementation](../../apps/asyra-office/implementation.md) and
  [product requirements](../../apps/asyra-office/asyra-office-product-plan.md).

Observed design constraints to resolve, not unproven bug claims:

- Sim and FieldScope retain similar SpatialLayer implementations; FieldScope
  additionally skips unchanged admitted descriptor submissions.
- The spatial entry mixes pure admission/contracts and concrete SDK exports.
- Sim retains narrower admission and distinct lighting/capability policy.
- Spatial local/global queries explicitly reject the ordinary 2D query route;
  projected screen bounds are not world-space bounds.
- Current spatial transforms consume completed world poses. Render ownership
  parenting must not silently become transform parenting.
- Current world camera support is a single perspective camera. The screen-space
  orthographic bridge is not a public orthographic world camera capability.
- Instance transforms currently use position/yaw. Shadow casting currently
  depends on selectability, and LoD includes a fixed screen-error threshold.
  Decide neutral mechanisms and explicit defaults without changing App output
  accidentally.
- App-local engine tests are preservation evidence sources; their presence is
  not proof that the shared owner or a new official profile has passed.

## Ownership and intended flow

| Owner                        | Responsibility                                                                                                          | Forbidden responsibility                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| App                          | Domain model/geometry, product validation, scene contents, tree UI, camera choices, input policy and persistence policy | A parallel canonical graph, SDK mutation through Core internals |
| Feature System               | Intent execution, sessions, cancellation and interaction coordination                                                   | Camera style, robot/office/farm decisions                       |
| Core                         | Registration, composition lock, public facade, startup and lifecycle coordination                                       | Concrete SDK inspection or App-specific presets                 |
| Scene Tree / Props / Factory | Canonical hierarchy/properties, validation, transactions, replay and history                                            | GPU objects or per-frame animation state                        |
| Render                       | State-to-output adaptation, layers, handle mapping, normalized interaction and frame orchestration                      | Domain geometry generation or concrete engine dependency        |
| Render Engine contract       | Neutral commands, queries, capabilities, resources and lifecycle                                                        | Three.js types or product behavior                              |
| Preset foundation            | Optional generic registrations, admission, projection/control helpers and official provider policy                      | Domain decisions or replacement runtime ownership               |
| Concrete spatial adapter     | SDK objects, buffers, materials, textures, camera execution, drawing and release                                        | Editable state, physics truth or App camera decisions           |

Intended connected routes for Task 1's exact flow design:

1. App composition chooses explicit defaults/provider policy and supported
   capabilities through Preset/Core before startup. Preset validates before
   mutation and owns rollback of acquired registrations; Core owns startup.
2. Input/commands enter Features, then approved App/shared APIs. Canonical edits
   use existing validation and transactions. Invalid edits preserve state.
3. Canonical changes, load and replay reach their existing state owners and
   projections. Load/replay are state-apply paths, not fresh product decisions.
4. App domain owners produce completed neutral geometry/poses. Shared admission
   validates at the actual trust boundary and produces detached immutable data.
   Projection retains derived identities and submits only required changes.
5. Render maps objects/layers and submits abstract commands. The concrete
   adapter owns SDK resources and draws only on explicit Render flush.
6. Camera intentions use App-selected values and neutral control mechanisms.
   Presentation interpolation consumes explicit time and target inputs; frames
   do not rerun product decisions, write documents or create history.
7. Engine hits/coordinates cross neutral queries and Render/Core mapping back
   to App/Feature interaction. Picking is visual evidence, never collision or
   safety evidence. Scene Tree panel visibility does not change this route.
8. Retirement closes admission, cancels owned work, drains/invalidates pending
   callbacks and releases resources through their existing lifecycle owners.
   Retired work cannot mutate a successor runtime.

These routes are design inputs, not an admitted Inspector or runtime evidence.
Task 1 supplies exact conditions, bypasses, contributors, boundaries, handoffs
and failure owners using the current supported Flow Inspector format.

## Capability scope

Names below identify responsibilities, not approved public identifiers or
selectable module IDs. Resolve names and existing owners before introducing APIs.

| Capability                      | Required outcome                                                                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spatial contracts and admission | Versioned neutral vectors, quaternion/pose, shapes, cameras, material/surface and instances; finite values, index/size limits, detached immutable output and owner-issued receipts             |
| Coordinates and transforms      | Explicit handedness, axes, units and quaternion order; local/world/screen distinctions; preserve completed world-pose semantics and review any scale/hierarchy addition                        |
| Geometry                        | Existing box/sphere/capsule/indexed triangles with topology, colors and UV preserved; additional primitives only for selected real consumer cases                                              |
| Model defaults                  | Optional neutral schemas/components/render strategies through existing registration APIs; no alternate 3D state architecture or forced conversion of derived primitives into document elements |
| Spatial projection              | Stable visual/entity identity, atomic accepted submissions, create/update/remove, visibility, camera-only updates, coalescing and unchanged-output reuse                                       |
| Bounds                          | Correct local/world/screen and instance-aware bounds, shared preparation at its valid lifetime, no per-instance full vertex expansion                                                          |
| Camera controls                 | App-supplied pose/projection parameters, resize/aspect, pan/orbit/dolly/fly/look/fit/focus calculations and cancellable interpolation/follow primitives; App chooses modes, angles and targets |
| Queries and interaction         | Neutral ray/projection/hit contracts, depth and eligibility, stable element/instance mapping, normalized pointer coordinates and cancellation through existing owners                          |
| Selection and overlays          | Existing selection authority, generic highlight/handle/grid/axes mechanisms when required by real cases; App chooses selection policy and UI                                                   |
| Materials and lighting          | Existing appearance and texture features, neutral light/shadow controls, replaceable defaults; separate casting, visibility and selectability semantics                                        |
| Instancing and LoD              | Shared geometry, stable instance mapping and transforms, completed detail geometry selection, culling and current results after visibility changes; App supplies content/detail policy         |
| Presentation updates            | Explicit timing, pose interpolation, stop/cancel/retarget and reduced-motion input; no simulation authority or independent permanent draw loop                                                 |
| Generic editing                 | Transaction/session-safe transform gestures, plane/grid snapping, preview/commit/cancel and neutral validity feedback; App owns placement/domain constraints                                   |
| Restricted assets               | Bounded supported GLB decoding/admission, detached neutral meshes, source identity, cancellation/stale-result handling and disposal; App owns acceptance and storage                           |
| Lifecycle and composition       | Partial-failure cleanup, idempotent retirement, runtime isolation, capability failures, selected-module isolation and ordinary Core customization                                              |

## Composition constraints and readiness findings

Profile continues to select provider policy; defaults continue to select
official modules independently. App custom providers remain a `CUSTOM`
composition through Core. Do not add App installers, arbitrary callbacks or a
parallel extension registry to `applyPreset`.

The current omitted-defaults contract selects every available default. Adding
3D modules or binding a 3D provider must not silently change existing `2D`
behavior, install incompatible 2D features, or filter defaults by profile.
Task 1 resolves this through explicit optional spatial entries, without adding
catalog modules or changing defaults resolution. Official `3D` supports `[]`
and explicit `INPUT`; other existing modules, including omitted defaults that
resolve to all eight, reject with `INVALID_OPTIONS` before mutation. No module
is silently filtered. See the [composition contract](../specs/preset-3d-foundation.md#composition).

Pure spatial data/control imports must not initialize or load a concrete
renderer. The ordinary 2D runtime import/bundle path must not acquire Three.js
execution through the new profile. Validate actual runtime/module boundaries,
not merely package names. Keep the currently approved Preset spatial adapter
boundary unless reviewed evidence requires a separately owned provider package;
do not create one speculatively.

Shared capabilities describe implemented mechanics, not App identities. Preserve
saved/wire identities where applicable and put necessary migration at the App
load owner. Remove superseded internal paths after consumer cutover; do not
retain unrequested legacy runtime fallbacks.

## Task 1 - Review the product contract and complete flow

Prerequisites: this plan is present in the selected base.

Scope: this plan, the activation reference, directly affected package contracts,
existing Preset composition architecture and the new spatial flow representation.
No production changes. Inspect current Flow Inspector authoring support before
choosing file/target identities; do not copy old acceptance or fabricate admission.

Work: refine the thin public product contract; resolve composition/defaults,
capability ownership, pure/SDK entries, transform/query semantics and App camera
control boundaries. Map every required outcome to a bounded owner and executable
product case. Review each producer/consumer pair, whole-flow feasibility,
failure/retirement routes and accepted behavior preservation. Declare exact
implementation allowlists and gates for later tasks.

Acceptance: reviewed flow and product contract agree; source-backed design
findings are resolved; actual supported admission/evidence references are
recorded. Readiness was established for the bounded target design by the review
below; it does not satisfy any runtime criterion. A missing tool mapping
blocks the affected proof claim, not permission to invent another ledger.

### Task 1 design review - 2026-10-24

Selected base: `47302dcea86e525a23500f6344eb859631264952`, containing this plan.
The repository task-context preflight passed on `codex/preset-3d-foundation-plan`.
Reviewer: coordinating agent in this conversation (self-review, not independent
or human approval). Scope: product specification, complete owner flow, concrete
source/API feasibility and preservation gates only.

- Product authority: [Preset 3D Foundation Contract](../specs/preset-3d-foundation.md).
- Architecture and current evidence:
  [preset-3d-foundation.flow.json](preset-3d-foundation/preset-3d-foundation.flow.json).
  This is a public schema-v1 flow document containing schema-v2 architecture,
  not an old Factory proof target or a copied accepted baseline.
- The `design` node records this Task 1 review through the supported
  revision/binding-checked flow API. All implementation and integration criteria
  remain missing until actual source-bound evidence is published.

Resolved findings from step, connection and whole-flow review:

1. **Defaults collision:** `resolve.ts` selects every available default when
   omitted; selection/viewport installers contain 2D-specific behavior. Keep the
   eight-module catalog unchanged, compose spatial definitions explicitly, and
   reject incompatible official-3D combinations before mutation. This preserves
   the existing composition Inspector's resolution semantics; the new flow owns
   the future 3D combination admission and activation. No old accepted evidence
   is promoted to evidence for that new behavior.
2. **SDK loading:** `RenderEngineProvider` is synchronous but engine `initialize`
   may return a Promise, and Render awaits it. A pure lazy provider adapter can
   load Three.js during initialization without changing the provider signature
   or eagerly loading it for 2D. The flow distinguishes initialization request,
   initialized surface and ready-runtime artifacts; no startup step requires its
   own ready result. Late initialization must dispose after retirement.
3. **Query mismatch:** current spatial `to-local`/`to-global` explicitly reject,
   and bounds return a projected 2D rectangle. Add typed neutral spatial queries
   with explicit spaces through Render/Core. Query request and mapped result are
   separate handoffs; no request depends on a previous result or SDK escape hatch.
4. **Identity and LoD:** GPU instance slots are unstable after detail compaction.
   Stable submitted instance IDs and full-shape visual picking preserve selection
   meaning across detail changes. Render owns reverse identity mapping; labels
   are not the identity authority. This does not become collision evidence.
5. **Transforms:** current nodes receive completed world poses. Keep that contract
   and use render parenting only for ownership/visibility. Do not accidentally
   multiply App kinematics twice. Positive scale is an explicit supported
   transform; rigid App contracts retain their stricter rejection.
6. **Update ownership:** preserve FieldScope's unchanged-submission and admitted
   shape reuse, Sim's pending-camera ordering, and Office's separation of save
   acknowledgement from layout geometry. Shared bounds feed camera controls as
   a completed artifact. Existing retained bounds/detail dimensions are declared
   in their owner steps; no new cache family is authorized.
7. **Camera/product policy:** shared controls accept explicit App choices. No
   renderer-selected angle, mode or tree-visibility branch remains in the target
   contract. Runtime presentation routes make no canonical/history writes.
8. **Evidence support:** current Flow Inspector admits full architecture, custom
   automated selectors and manual review. Use that supported path; do not require
   the legacy Factory-only proof service or claim it has admitted this target.
   Future runtime selectors identify bounded C01-C12 obligations; external
   actions name actual project gates, and missing future assertions are explicit.

Whole-flow review covered composition/startup, edit/replay, source admission,
incremental projection, App camera control, rendering, query/interaction,
asset acceptance and failure/retirement. Each artifact has one producing owner,
declared consumers and an explicit route. Runtime feedback routes are distinct
from the acyclic implementation prerequisites. No unresolved design blocker was
identified within this target; future implementation may reopen an assumption
only with concrete in-scope evidence under the existing iteration rules.

### Task 1 implementation handoff boundaries

Each flow step's `implementationBoundary` is the allowlist; its `specRefs`,
conditions, bypasses and failure owner are mandatory. Existing file globs permit
only the named mechanism, not unrelated code in those directories. Planned new
files are target locations, not claims they already exist. C01-C12 in the spec
define the assertions and existing test owners; a worker adds the missing formal
cases before implementing the affected behavior.

| Plan task | Flow owner steps                                                      | Required cases and gate                                                                     |
| --------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 2         | `admit`, `engine` initialization/resource slice                       | C02-C03, C08; Preset/engine contracts, both App admission/engine suites, entry/build checks |
| 3         | `project`, `render` projection slice                                  | C04-C05; layer/bounds tests and affected Render integration                                 |
| 4         | `camera`                                                              | C06; shared and existing App camera tests, no geometry/history work counts                  |
| 5         | `queries`, `interaction`, `render` identity slice                     | C05, C07; engine/Render/Core facade and App input cases                                     |
| 6         | `compose` optional definitions, `engine` content/detail slice         | C01, C08; registration/resource/detail tests and existing source profile guards             |
| 7         | `canonical`, `domain` preservation; `fieldscope`, `sim`, `office`     | C11-C12 plus affected C03-C09; existing App supervisors, typecheck/build and real-WebGL E2E |
| 8         | `compose` official request admission, `startup`, `retire`, `activate` | C01-C02, C12; profile/lifecycle/shared-channel/instance-isolation and consumer proof        |
| 9         | `edit`, `assets`                                                      | C09-C10; Office transaction/revision cases and Sim restricted import/worker/browser cases   |
| 10        | `closeout` and flow-level `integration`                               | All C01-C12 and final same-source bounded/visual review                                     |

The task table sequences delivery slices; flow `dependsOn` describes completion
prerequisites for full owner acceptance, not a prohibition on implementing an
independent typed sub-slice. For example, the startup protocol can be tested
under CUSTOM before official-profile activation, and an engine contract can be
implemented before App migration. Each slice still has one owner and its step
card; no production implementation is authorized by this design-only delivery.

Validation entry points (run from repository root):

```sh
node tools/flow-inspector/flow-files/cli.cjs validate docs/ai/framework/plans/preset-3d-foundation
node tools/flow-inspector/flow-files/cli.cjs context docs/ai/framework/plans/preset-3d-foundation preset-3d-foundation design
node tools/flow-inspector/flow-files/cli.cjs serve docs/ai/framework/plans/preset-3d-foundation
```

The source CLI opens only this selected flow directory; no global config or
dashboard selection is overwritten. Validation checks structure; the expected
whole-flow verdict remains incomplete because production evidence is missing.

Task 1 validation: repository task-context preflight passed; the real Flow
Inspector `openProject().snapshot()` admission/evaluator accepted the document
and its architecture; local document links/spec anchors and every declared
artifact-consumer route were checked; `yarn lint:naming` passed all 15 cases;
scoped Prettier and `git diff --check` passed. The design review is the sole
accepted observation. Nineteen runtime owner criteria plus integrated runtime
and final review obligations remain unfulfilled. No production, App build,
browser or runtime acceptance result was produced by this documentation slice.

Design evidence declares a SHA-256 over the final specification, plan and flow
definition, in addition to the recorded code baseline. Future changes to those
inputs require republishing the declared source and re-reviewing the affected
design. Flow-file readers do not automatically fingerprint repository source.

## Task 2 - Consolidate spatial contracts and resource ownership

Prerequisites: Task 1 design/readiness for this owner.

Scope: Preset spatial contracts/entries/adapter/resource owners, required neutral
engine types and the three Apps' direct imports/admission adapters.

Work: separate pure contracts from SDK execution; consolidate shared admission
without widening Sim's product admission; preserve geometry/material/texture
lifetimes and explicit capability failures. Move generic conformance coverage
to the common owner while retaining App-specific preservation tests.

Acceptance: invalid updates are atomic; caller mutation/freezing cannot bypass
admission; admitted unchanged geometry avoids repeated scans/copies; cleanup
and foreign/retired-handle cases pass. Pure imports and unchanged 2D imports do
not load the spatial SDK. Existing App rendering contracts remain supported.

Task 2 execution contract (base `2d92dc69b01600eedfdedc0d5e83ba876542faaf`):
work sequentially on `admit`, then the `engine` initialization/resource slice.
Direct imports, exports, permanent conformance tests and current API docs are
in scope. No projection, camera, query, instance-format or profile activation
work is included. Discovery is limited to these owners, existing direct
consumers and their tests. Required gates: naming, focused/shared owner tests,
three App preservation suites, package builds, App typecheck/build, scoped lint
and formatting, entry isolation and Flow Inspector admission. Stop on an
unresolved owner mismatch or a necessary out-of-scope behavior change.
The `foundation` criteria distinguish this delivery from later whole-owner
acceptance. The direct-consumer allowlists and delivery boundary were reviewed
before implementation; they do not authorize adjacent App refactors.

### Task 2 result and inspection checkpoint

Delivered neutral data/capability ownership in Render Engine; pure Preset
admission and separate concrete engine entries; one shared numeric admission
owner with Sim's existing whitelist projection; synchronous provider creation
with deferred initialization/retirement; common engine conformance tests.
All three Apps now import the appropriate entries. Lighting, software-shadow
policy, shape/pose/material behavior, camera policy and saved identities remain
unchanged. No new dependency, cache family, canonical model or compatibility
alias was introduced.

Verification on this implementation:

- Preset full suite: 31 files, 250 tests passed; final expanded spatial suite:
  4 files, 35 tests passed, including real deferred-adapter initialization.
- Render Engine: type-signature gate and 10 tests passed.
- Sim: 7 selected preservation files, 43 tests passed through its supervisor;
  final admission/engine recheck after type derivation: 19 tests passed.
- FieldScope: 8 selected preservation files, 52 tests passed through its
  supervisor, including surfaces, detail/instance rendering, projection and
  camera controls. Office: full 3-file suite, 14 tests passed.
- Render Engine, Render dependency and Preset builds passed. All three App
  TypeScript checks and production builds passed.
- Scoped ESLint, naming (15 cases), test placement (3 cases), dependency
  validation and generated public documentation checks passed.

Initial new-entry tests failed because the entries did not exist, then passed
after implementation. Existing App engine/admission baselines passed before
changes. A stale Render declaration required rebuilding the existing dependency.
Some local command shims reference an old App directory or omit Vite; equivalent
commands used the repository's installed Node CLIs without changing dependencies
or bypassing the Sim/FieldScope test supervisors. Build warnings about existing
large chunks and mixed static/deferred concrete imports are retained; concrete
CUSTOM consumers intentionally still import the engine eagerly.

Bounded review found no remaining Task 2 owner or behavior mismatch. Inspector
`admit/foundation` and `engine/foundation` record the actual source-bound subset.
Their complete `runtime` criteria remain unfulfilled: instance IDs/scale,
query/content changes and full integration are later tasks. No real-WebGL E2E,
visual approval or whole-product performance acceptance is claimed by Task 2.
The user inspection checkpoint is the stop condition; do not start Task 3.

## Task 3 - Share incremental spatial projection and bounds

Prerequisites: Tasks 1-2.

Scope: shared Preset projection/bounds owners and direct Sim/FieldScope/Office
layer integration; domain builders remain unchanged.

Work: consolidate SpatialLayer identity/reconcile/submission semantics; retain
pending model/camera ordering, unchanged-descriptor skipping and entity mapping.
Share correct bounds computation with instance transforms and bounded lifetime.

Acceptance: invalid/duplicate IDs leave accepted pending output intact;
camera-only submissions do not resubmit meshes; pose/material changes retain
topology resources; removals release exactly once. Instance bounds include
current transforms without rescanning each instance's source vertices. An App
with no tree panel uses exactly the same canonical/projection flow.

Task 3 execution contract: base `698b080b5c2dc9b46f57d47d8e343aa4d2911f38`.
Complete the bounded Render identity handoff, then Preset projection/bounds and
its direct App consumers. Discovery is frozen to those owners, current entry
consumers and preservation tests. Required gates are regression-first owner
tests, Render/Preset tests, App projection/camera/runtime preservation tests,
package and App type/build checks, naming, scoped lint/format, dependency and
generated-doc checks, and source-bound Inspector evaluation. Exclude Task 4
controls, Task 5 spatial queries/instance mapping, domain algorithms and profile
activation. Stop for user inspection after Task 3 or on an unresolved boundary.

### Task 3 result and inspection checkpoint

Completed shared incremental `SpatialLayer` and lifetime-owned `SpatialBoundsOwner`.
Sim and FieldScope now configure the shared layer; Office submits its existing
scene assets and presentation motion through it. Explicit Render visual/entity
identity drives picking independently of labels, while existing App labels remain
unchanged. FieldScope uses the shared bounds owner; domain builders and Camera
policies remain App-owned. No new SDK, dependency package or profile activation.

Regression-first evidence reproduced label-derived picking, numeric visual IDs,
sparse pending submissions and Office's missing shared projection. The existing
Sim workcell test also detected a label preservation regression; retaining its
presentation labels resolved it without coupling picking to labels again.

Verification on the Task 3 source:

- Preset: 33 files / 261 tests; final shared layer/bounds recheck: 9 tests.
- Render: 23 files / 271 tests, including explicit identity handoff.
- Sim: 7 selected files / 44 tests through its supervisor; 13 guard tests passed.
- FieldScope: 7 selected files / 32 tests through its supervisor; 8 guard tests
  passed. Camera fit, instance work counts, motion and history remain covered.
- Office: full 4 files / 15 tests. Camera-only mesh writes are zero; motion writes
  only 11 actor/companion parts; furniture reorder retains visual objects.
- Render/Preset builds and all three App typechecks/production builds passed.
- Naming (15), dependency validation (29 workspaces / 6 tests), test placement
  (3), scoped formatting/lint and public-doc generation/check/validation passed.
  Scoped lint retains one pre-existing Render console warning and no errors.

Bounded self-review checked the `project` and `render` owner contracts, direct
consumers, caller mutation isolation, transform order, lifetime disposal and
preserved App policies. Source-bound `project/projection` and `render/projection`
record only this Task 3 delivery; refreshed foundation evidence covers unchanged
Task 2 admission/engine behavior on the same source. Whole-flow runtime criteria,
new spatial queries/instance formats, real-WebGL visual approval and profile
activation remain pending. Stop for user inspection; do not start Task 4.

## Task 4 - Share App-directed camera control mechanisms

Prerequisites: Tasks 1-3.

Scope: neutral camera helpers/projection updates and direct App camera callers.

Work: share navigation/fit/projection math and cancellable transition/follow
mechanisms. Apps retain mode selection, angles, projection choices, presets,
targets, speed, bindings and reduced-motion policy. Do not introduce a global
camera mode or choose a mode from App identity or tree visibility.

Acceptance: existing App framing/navigation remains correct across aspect,
resize, clipping and coordinate boundaries; rapid retargeting cancels obsolete
presentation; camera changes do not create canonical writes, history or mesh
rebuilds. Unsupported projection modes fail explicitly. No world orthographic
support is claimed from the existing screen bridge.

Task 4 execution contract: continue from Task 3 commit `e8e769735` in the same
worktree and branch. The `camera` owner supplies pure numeric controls and one
cancellable presentation target through the optional spatial entry. Direct App
callers retain mode/angle/limit/binding choices and scheduling. Preserve Sim's
indexed-point framing and FieldScope's world-bounds framing and narrow-viewport
FOV policy as explicit inputs to general mechanisms. Office retains its 0.12
per-frame interpolation and 0.005 settlement tolerance. No canonical writes,
new cache, SDK, independent draw loop, query extension or profile activation.
Required gates: shared C06 controls/transition tests, affected three-App camera,
projection and runtime tests under existing supervisors, Preset suite,
package/App builds, naming, scoped lint/format, dependencies, generated docs
and source-bound Flow Inspector evidence. Stop for user inspection before Task 5.

### Task 4 result and inspection checkpoint

Completed pure perspective pan, local translation, orbit/look, dolly, optical
zoom, aspect projection and bounds/point framing through `@asyra/preset/spatial`.
`SpatialCameraPresentation` owns one admitted target with retarget/cancel/dispose
and explicit progress/tolerance/reduced-motion inputs. It owns no clock, draw
loop, canonical write, history or mesh submission. All work remains in the same
worktree on `codex/preset-3d-foundation-plan`.

Sim retains wheel normalization, orbit limits, indexed visible/selectable point
selection and 32px framing. FieldScope retains its presets, narrow-aspect/FOV
policy, 24px framing, speed and near-plane dolly restriction. Office retains its
existing angles, 0.12 interpolation, 0.005 tolerance, reduced motion and current
pose follow. Rapid focus/follow replacement never queues an obsolete target.

Formal regression-first cases proved missing controls, unsafe camera accessor
rereads and an incorrectly shared App dolly limit before their owner corrections.
Shared tests additionally cover local axes, clipping, aspect, empty fit, invalid
input, unsupported projection, singular interpolation, target snapshots and
independent lifetimes. Office proves focus/follow changes produce zero mesh
updates while motion remains independent.

Verification: Preset full suite 34 files / 269 tests passed before the final
App-limit case; final shared camera suite 9 tests passed. Render full suite
271 tests passed. Sim 4 selected files / 38 tests and FieldScope 4 selected files /
21 tests passed through their supervisors; their 13 and 8 guard tests passed.
Office full suite 4 files / 16 tests passed. Preset build and all three App
TypeScript/production builds passed. Naming (15), dependency validation (29
workspaces / 6 tests), placement (3), scoped lint/format and public-doc
regeneration/check/validation passed. Source-bound Inspector evidence records
C06 and refreshed tested predecessor slices. Whole-flow integration, real-WebGL
visual approval, new spatial queries and profile activation remain pending.

Bounded self-review found no remaining Task 4 owner mismatch. Stop for user
inspection; do not start Task 5. No push or dependency change was performed.

## Task 5 - Complete neutral spatial queries and interaction

Prerequisites: Tasks 1-4.

Scope: necessary Render Engine query/capability types, Render/Core facades,
spatial adapter and direct picking/selection consumers.

Work: define distinct 3D ray/projection/bounds queries; preserve existing 2D
query meanings. Resolve element/instance identity, visibility/selectability,
hit ordering and App input handoff through public owners. Reuse selection and
Feature session/cancel mechanisms.

Acceptance: CSS scale/DPR/resize and outside/zero-sized surfaces have defined
results; depth and instance identity remain correct through LoD; unsupported
queries fail without fallback. UI/Apps never extract SDK objects to implement
queries, and visual hits never become solver evidence.

Task 5 execution contract: base `3eeb2f634`, same worktree and branch. Implement
neutral typed spatial query contracts and explicit unsupported-engine rejection;
then optional instance identity admission, concrete full-shape queries, public
Render/Core mapping and the direct Sim picking consumer. Keep existing Feature,
Input and Selection owners; do not install another session runtime or 2D overlay.
Discovery is bounded to those owners and their current direct consumers/tests.
Required gates: owner query/admission tests, 2D preservation, Render/Core/Preset
suites, three-App picking/navigation/runtime tests under existing supervisors,
package/App builds, naming, lint/format, dependencies, docs and source-bound
Inspector evidence. No scale/roll/content extension, editor tool, assets,
activation or real-WebGL visual acceptance. Stop for inspection before Task 6.

### Task 5 result and inspection checkpoint

Completed separate spatial-query capability and typed projection, surface ray,
local/world conversion, local/world bounds, world-ray intersections and
screen-overlay-first picking. Render resolves explicit visual/entity IDs; Core
exposes named delegates. Source instance indices and optional stable IDs survive
LoD compaction and submission reorder. Queries borrow full geometry/materials
without allocating GPU resources. Pixi and the default recording engine reject
unsupported spatial queries; legacy 2D contracts remain intact.

Sim now uses the public client-point facade, removing its duplicate DOM
conversion. Existing Feature selection, pointer capture/modifiers/cancel and
Camera policies remain App-owned. FieldScope and Office gain no new picking
behavior. Query execution leaves undo history unchanged. All changes remain in
the same worktree and branch.

Regression-first tests exposed invalid instance bounds being accepted on empty
content and stale hits being accepted after replacement with the same visual ID.
Both now reject at their canonical query owner. Permanent cases cover near/far
and eye-plane projection, CSS/DPR/resize, outside/zero-sized surface, foreign and
detached handles, transparent/hidden/nonselectable geometry, overlay precedence,
instance pose/bounds, LoD/full geometry, source reorder and resource reuse.

Verification: Render Engine 11 tests, Pixi 49, Render 273, Core 272 and Preset
276 passed. The final shared query suite has 5 tests. Sim 6 selected files / 57
tests and FieldScope 5 selected files / 48 tests passed through existing
supervisors; their 13 and 8 guard tests passed. Office full suite 4 files / 16
tests passed. All five affected package builds and all three App TypeScript /
production builds passed. Naming (15), dependency validation (29 workspaces /
6 tests), test placement (3), scoped lint/format and public documentation checks
passed. Existing console warnings remain unchanged. Source-bound Inspector
evidence records only the verified bounded slices, not whole-flow acceptance.

No real-WebGL visual acceptance, selectable content extension, editing/assets or
reserved-profile activation is claimed. Stop for user inspection before Task 6.
No push or dependency change was performed.

## Task 6 - Complete selectable content and presentation mechanisms

Prerequisites: Tasks 1-5 and the resolved defaults design.

Scope: neutral component/schema/strategy installers, material/light/instance/LoD
owners and their direct App composition.

Work: expose optional reusable model defaults within the single architecture;
separate shadow casting from selectability; retain texture sharing and immutable
geometry. Generalize only required instance transforms/detail controls and
explicitly timed pose presentation. Apps supply geometry, detail alternatives,
camera choices and domain-driven targets.

Acceptance: unselected defaults register no product state; explicit defaults
have deterministic dependencies/cleanup; App customization uses public Core
registration. LoD affects presentation only; hiding/showing uses current inputs;
material/pose updates do not regenerate geometry. No camera mode or domain
animation policy is installed by the foundation.

Task 6 execution contract: base `04552ae09`, same worktree and branch. Deliver
opt-in mesh property/schema/component/strategy registration, positive mesh and
instance scale with stable instance IDs/quaternions, explicit shadow flags,
configurable pixel-error detail and caller-timed pose presentation. Keep existing
FieldScope yaw domain inputs in its admission adapter; convert once to neutral
projection receipts. No domain algorithm, saved identifier, Camera mode, catalog
selection or profile activation changes. Discovery is limited to the named owner
slices, direct three-App consumers, their tests and contract docs. Gates: neutral
admission/bounds/query/resource/registration/presentation tests, scoped Render/Core
and three-App preservation suites under supervisors, affected builds, naming,
lint/format, dependency/placement/docs and source-bound Inspector evidence.
Real-WebGL integration remains Task 7. Stop for inspection before Task 7.

Task 6 bounded test revision: the optional-registration lifetime case must load
an empty document through public Core APIs before starting the renderer and
creating canonical content. The failed fixture omitted this ordinary document
initialization; Core startup does not create a workspace without a load source.
Re-audit of the compose step, Task 6 opt-in lifecycle contract, and the existing
Core runtime-reset integration fixture confirms no production Core change is
needed. Limit this revision to the registration test: load, start, transact, save,
and reset; prove the focused case and then the Preset suite. Self-review found
no owner or behavior change, fallback, or expansion beyond the compose contract.

Task 6 result: explicit mesh schema/property/component/strategy installation uses
public Core registration, rollback and runtime reset. Permanent tests prove
canonical creation/save and cleanup, invalid-write/load behavior, retained mesh
identity and visibility-only isolation. Neutral instances now carry stable IDs,
quaternions and positive scales; FieldScope converts its unchanged yaw domain
receipts once. Sim and FieldScope retain rigid domain restrictions. All Apps
explicitly retain their former lighting and shadow policies.

Shared bounds, queries and uploads use the same transform order. Detail selection
uses physical-pixel error and invalidates on current pose, placements, viewport,
DPR and policy; unchanged inputs reuse the result. Instance-count changes replace
only instance containers, retaining geometry/material resources. Caller-timed pose
presentation supports retarget/cancel/reduced motion without canonical writes.

Validation: Preset 37 files / 289 tests; Render 273; Core 272; Render Engine 11.
Sim 6 files / 58 tests plus 13 supervisor guards; FieldScope 7 files / 86 tests
and source-profile 23 tests, each with 8 supervisor guards; Office 4 files / 16
tests. Naming 15, dependency validation 29 workspaces / 6 tests, placement 3,
scoped lint/format, affected package and three App TypeScript/production builds,
public documentation and Flow Inspector admission pass. Lighting rejection and
instance-count resource retention were proved red before owner fixes. No real
WebGL acceptance, default catalog/profile activation or Task 7 completion is
claimed. Stop here for user inspection.

## Task 7 - Complete the three App migrations

Prerequisites: Tasks 2-6 integrated; incremental consumer proofs accompany each
earlier owner slice rather than waiting for this checkpoint.

Scope: FieldScope, Sim and Office composition/projection/control adapters and
their existing affected behavior tests/docs.

Work: complete FieldScope's high-reuse projection/resource migration, Sim's
strict geometry/admission integration, and Office's scene/control presentation
integration sequentially. Delete superseded duplicate mechanisms after each
cutover. Do not rewrite domain algorithms or saved data for cosmetic naming.

Acceptance: all three Apps use the shared foundation on the same source. Preserve
Sim's complete original geometry and analysis/playback evidence boundaries;
FieldScope's configuration/pose/visibility update isolation; Office's layout
transaction, proposal revision and save acknowledgement semantics. Tree UI and
camera modes remain App choices. Run their affected real-WebGL workflows.

## Task 8 - Activate the official 3D profile

Prerequisites: Tasks 1-7 and every applicable 3D prerequisite in the existing
activation plan; no unresolved composition/defaults finding.

Scope: Preset catalog/provider policy, direct lifecycle/composition tests,
consumer startup and support documentation. HYBRID remains unavailable.

Work: bind the production provider through Core using the reviewed loading
boundary. Verify explicit/empty/omitted defaults, failure rollback, startup and
runtime isolation, load/replay/local shared channels and real App operation.

Acceptance: profile/default independence and existing `2D`/`CUSTOM` behavior
pass; no unsupported capability falls back to Pixi, fake geometry or a
placeholder surface. Real production use and synchronized visual evidence pass.
Record actual evidence before reporting profile availability. This milestone
does not close the remaining generic extension tasks.

## Task 9 - Deliver generic editing and restricted asset extensions

Prerequisites: reviewed Task 1 cases and Tasks 2-7; these mechanisms may be
verified under CUSTOM before Task 8 without activating a profile early.

Scope: neutral transform/snapping/preview mechanisms, bounded restricted asset
decoding and the direct real App consumers selected during Task 1.

Work: deliver move/rotate and supported scale controls, plane/grid snapping,
preview/commit/cancel and generic interaction feedback. App validators decide
legal placement. Extract Sim's restricted GLB mechanics without expanding its
format claims or transferring App storage/source-binding authority. Include
grid/axes/handles only where the accepted interaction requires them.

Acceptance: one intended edit has one history boundary; invalid/cancelled edits
preserve canonical state according to the declared session policy; replay and
save/load reproduce accepted edits. Rejected/oversized/unsupported assets create
no partial scene; stale async completion cannot attach to a retired runtime.
Every mechanism has a real consumer and permanent behavior evidence. Broader
formats and orthographic/multiview support require a separately selected scope.

## Task 10 - Integrated verification and closeout

Prerequisites: Tasks 1-9 and all required same-source evidence.

Scope: final affected tests, public/package/App documentation and this plan's
closeout under the existing workflow; no new feature discovery.

Acceptance: each task, upstream handoff, whole target and preservation obligation
passes on the integrated source. Review generated documentation and package
entry/dependency boundaries. Report remaining unsupported capabilities honestly.
Close the plan only through the existing closeout workflow after review; profile
activation, a green generic CI job or one App's passing suite is insufficient.

## Required product cases and verification

- Shared architecture: show/hide an App tree panel without changing canonical
  identity, history, projection or persistence; derived mesh count does not
  force a document-mode switch.
- Camera ownership: two consumers choose different angles/modes/targets through
  the same controls; the foundation does not override either App's choices.
- Geometry/admission: valid, empty-by-contract, invalid, oversized and mutated
  input; quaternion/units/index/UV/color correctness; unchanged admitted reuse.
- Projection: accepted call ordering, duplicate identity rejection, unchanged
  output skipping, pose/material-only updates, removal and instance mapping.
- Queries: screen/world/local distinctions, depth, CSS scaling, DPR, clipping,
  visibility, instances and capability errors.
- Canonical operations: edit, failed edit, cancel, Undo/Redo, load validation,
  serialization and local shared-channel projection parity without echo.
- Resources: shared texture lifetime, geometry replacement, partial startup
  failure, idempotent teardown and stale callbacks across runtime replacement.
- Work counts: camera updates perform no geometry generation/admission/copy;
  pose updates retain topology; bounds do not scan vertices per instance;
  unrelated UI/locale/save acknowledgements do not rebuild scenes. Verify
  invalidation and output equivalence, not just helper calls or FPS.
- Composition: unavailable profiles fail before mutation; selected defaults
  remain independent; pure/2D imports exclude spatial execution; separate
  runtime resources do not leak across instances.
- Visual: real WebGL cameras, materials/transparency/shadows, dense instances,
  LoD transitions, selection and editing at relevant scale. Semantic geometry
  oracles precede screenshots; synthetic drivers alone do not prove rendering.

Task 1 selects exact permanent cases and test commands at their current owners.
Run focused cases first, then affected package/App tests, types, lint, builds,
dependency and documentation checks, and real E2E/visual gates at complete-slice
checkpoints. Preserve existing App test supervisors and resource guards.
Use the existing naming gate before new identifiers propagate. Bug discoveries
follow formal test-first rules; optimization requires meaningful operation counts
and justified lifetime/invalidation evidence. Do not add caches without evidence.

## Exclusions and completion boundary

Excluded: robot FK/IK, simulation/solver algorithms, crop/room/character assets,
task-to-animation decisions, rewards/achievements/permissions, full glTF,
skeletal animation, general physics/pathfinding, multiview and HYBRID activation,
and any new external dependency or tool upgrade without separate authorization.
Orthographic support remains an explicitly unsupported or separately scoped
capability until a reviewed real consumer requires it; the App still owns the
choice among supported projection modes.

Complete means the shared foundation, all three migrations, official 3D
activation and agreed generic extensions satisfy their reviewed cases with
existing behavior preserved. It does not mean every possible 3D engine feature,
Office roadmap feature or simulation capability has been implemented.

## Planning validation

The planning delivery requires English project prose, valid local references,
unique task headings, an indexed plan, consistent activation cross-references,
and a scoped diff/format review. It does not claim production test execution,
Inspector admission, implementation readiness or runtime completion.

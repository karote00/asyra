# Office rebuild - Technical proposal

Status: rebuild implementation authorized on 2026-10-25; first asset slice in progress. The [product plan](plans/office-rebuild-plan.md)
owns intended experience and acceptance. This replaces claims about the deleted
Office implementation. No App runtime, new model, connector or accepted rebuild
baseline exists from this planning task. Existing shared Preset capabilities
remain; the App source is intentionally empty.

## Foundation

Use the maintained [custom composition guide](../../../public/start/custom-composition.md)
and Starter responsibility boundaries. Compose Core initialization, registered
Features, common APIs, controllers, semantic projections/hooks, views and render
layers as separate owners. Use official 3D composition where supported; custom
providers must use the documented CUSTOM route through Core. The selected route
must be represented consistently in the replacement Inspector before coding.

Verified local source entrypoints:

- `@asyra/preset/spatial-contract`: descriptor/admission contracts.
- `@asyra/preset/spatial`: shared projection, bounds, camera presentation and
  editing mechanisms; Office owns domain composition and constraints.
- `@asyra/preset/spatial-engine`: shared concrete spatial engine boundary.
- `@asyra/preset/agent-activity`: provider-neutral source evidence and projection.
- `@asyra/preset/spatial-assets`: a restricted GLB decoder/preview worker.

The existing asset decoder is not a general animated-model pipeline.
`packages/preset/src/spatial/assets/schema.ts` rejects textures/images, skins,
weights, animations and morph targets. Reusing it unchanged does not satisfy
textured furniture or dressable animated people. Before implementation, review
supported render contracts and design the missing shared asset capability at
its proper owner. Do not remove preview admission guards, invent public APIs,
import private Three.js state into Office, or add a second renderer as a shortcut.
Any required shared-code change is a separately bounded, approved future slice.
This restricted decoder finding applies to that entrypoint, not a claim that
all Preset rendering rejects textures or that a general loader already exists.
Prove one representative of each needed capability class through the intended
public path before producing many assets that depend on it. Keep this proof
inside the authorized asset work; do not build Office product features to make
a model review possible.

## Source reset and preserved evidence

`apps/asyra-office/src` was deliberately removed in PR #361. Package files,
reference images, specifications, outer app configuration and old E2E scaffolding
remain. Their existence does not prove a runnable App. Restore relevant build,
lint, test and browser gates alongside the new source when authorized, replacing
obsolete cases from the approved behavior rather than restoring the discarded
implementation to satisfy old tests. Preserve other Apps and shared foundations.
The one-time permission to submit the reset with expected failures is not a
standing exemption for the rebuild.

## Asset construction boundary

The asset catalog owns defaults, geometry families and current reference paths.
Production uses procedural sources for regular geometry and background Blender
jobs where complex topology/rigging requires them. PNG sheets remain references;
they are not geometry or a source of baked scene shadows. Retain modular parts,
local axes, origins, material regions and stable IDs for wardrobe/placement.

Each import/generation boundary must declare source units and up/forward axes
and the explicit conversion to the rendering convention. Do not assume all
batches share an axis convention. Apply unit/axis conversion, authored local
size and world placement at their distinct boundaries; verify local extents,
normals, handedness and attachment positions rather than swapping width/depth
to improve a screenshot. Use the catalog's material/color override precedence.
Uniform and nonuniform whole-unit scaling include joints, bevels and gaps; do
not silently regenerate a nominal 45-degree join after scaling. Construction
parameter changes and whole-unit transforms remain separate operations.

The handoff must contain the construction-source revision, numeric/default
configuration, measured mesh bounds, named parts/regions, required attachment
information, supported LoDs, resource costs and accepted comparisons. Extend the
existing batch records; do not create a second asset authority. Runtime meshes
are outputs of these inputs. Use GLB only for features actually supported by the
chosen importer; keep the original source and specifications. No USD is required.
A minimal asset harness is an early import/render/LoD acceptance tool, before
complete scene assembly. Verify at least one wall/regular assembly first, then
the first textured furniture and clothed/rigged character before repeating their
production. A passing Blender render alone is not runtime acceptance. Any new
reference correction follows the product plan's established review sequence;
recorded superseded image captions are not new unresolved conflicts.

## Integration and projections

Provider adapters translate permitted data; the external runtime owns execution
and its task outcomes. Existing `ActivityProjection` and `ActivityArchive` are
reusable evidence boundaries, not live connectors or a complete task database.
The current activity statuses are idle, working, waiting, completed, failed and
offline. A last-activity record cannot represent all unstarted tasks, assignment
history, accepted rewards, or a complete task list. Do not fabricate missing task
states from actor animations; define the task-feed/evidence extension explicitly
before implementing Tasks and progression. Where completion acceptance is not
provider-verifiable, support an explicit human acceptance with its own attribution;
do not relabel cooperative reports as authoritative provider evidence.

Admit each event with connection identity, sequence/attempt and evidence class.
Namespace source identities so equal local task/agent IDs from different
connections cannot collide. Keep source task status, membership, connectivity
and simulated activity separate. A task may name several agents; focus resolves
its explicit primary assignee or asks the user to select an assignee, with no
task-detail panel.

The archive acknowledges the entire accepted batch before authoritative
projection changes. Invalid batches fail atomically; duplicate and superseded
attempts cannot regress task state or grant rewards. Surface disconnected,
cooperative and synthetic sources honestly. Define ordering/replay, retention
and reconnection at the connector boundary, including a missing sequence range.
If a source cannot pause or replay, expose an explicit evidence gap; do not label
its history lossless. Preserve already acknowledged events and do not calculate
exact streaks or missing reward grants across unknown history. Restore confidence
only from verified resynchronization or a clearly declared new evidence boundary.

The current projection retains in-memory history. Do not claim it supplies
bounded durable paging/backpressure for the full office. Plan a storage-backed
history boundary with bounded visible pages, bounded pending admission, replay
and an explicit storage-error state; verify the owner contract before wiring it.
Coalesce only intermediate display progress. Logs/tasks consume keyed projections
and bounded viewport queries; no whole-history clone or per-token scene update.

## Office interaction

Separate external work state, simulation state and rendered pose. Office owns
life activity decisions, destination/occupancy rules, navigation and room/floor
connectivity. Agent-selected destinations use the same bounded activity action
interface as local simulation, without LLM work in the frame loop. Preset owns
reusable spatial mechanics. Renderer interpolation
consumes the completed route/pose intent and never decides task completion.

Places resolve region bounds; Agents/Tasks resolve an existing agent target.
Selection retargets a single camera transition; manual camera input cancels
follow. Occlusion handling respects cutaway/floor state. An unassigned task has
no follow target. An offline actor that still exists remains focusable; loss of
connectivity is neither deletion nor dismissal. Provider work updates immediately
even while the actor walks.
Laptop activity is a sanitized, low-rate projection, updated only on content
change and readable only at the intended viewing distance. Search resolves the
same stable place/agent/task targets; it does not create a separate focus policy.

Office membership owns hiring/dismissal, stable identity and work-anchor
assignment, with separate seat occupancy for shared/rest spaces. Removal preserves
earned history and never terminates a provider process implicitly. Grant the
human first-agent and office first-hire achievements in the successful membership
action from the first functional release. Synthetic visual-preview fixtures are
isolated from live membership and award storage. Rejoin, replay and failed admission
must not duplicate grants. Later life features record eligible firsts when they
happen, independently of whether the full achievements collection is visible.

Shared navigation is derived from actual layout revision and traversable links.
A change invalidates affected routes, seat availability and bounds; a camera
change invalidates none of those. Simulation can continue meaningful state
while hidden presentation is culled. Stop unnecessary animation and subscriptions
at document/runtime disposal, and ignore callbacks from the retired session.

## Layout and persistence

Core's canonical document owners store rooms, floor connections, placements,
whole-unit extents, appearance choices and stable object relationships. Wardrobe
stores selected profile/parts and overrides, not a duplicate character mesh.
Controllers dispatch Features; App APIs validate the complete candidate before
one canonical transaction. Views and agent proposals cannot bypass that route.

A proposal carries expected layout revision, actor attribution, relevant policy
and complete change intent. Reject stale revision, invalid dimensions, collisions,
blocked required passages, unsupported fit and insufficient funds before commit.
Validation uses declared support/attachment/contact rules, not blanket rejection
of every bounding-box intersection. Preserve intentional contacts such as wall
finishes, rugs and joined model parts.
Preview is detached and cancel leaves canonical state unchanged. Do not keep a
second editable document in React to make rendering easier.

The proposed first release is local single-user. One App document-session owner
retains ordered canonical publications, acknowledges local persistence and owns
recovery. Keep explicit save/export checkpoints distinct from incremental writes.
No full-world serialization on every frame or status event. Validate versioned
loads before replacement, preserve the previous valid office on failure, and
separate credentials and external event archives from portable world exports.

Office economy and layout spending need one local atomic command boundary:
validate price/revision/authority, debit and apply together, then persist their
publication. Define eligible purchase reversals explicitly: remove the acquired
benefit and compensate cost once, or reject a consumed/dependent reversal without
partial writes. Moving an already owned object does not create a purchase refund.

Externally accepted work rewards and first achievements use attributable grant
identities. Layout Undo must not replay or erase their source evidence. Ordinary
document history must not accidentally reverse a later independent grant through
an earlier layout snapshot. Before economy implementation, verify the public
transaction/history route can preserve these semantics and specify the exact
reversal cases; a generic Core Undo call is not proof. Retain the grant identities
and event evidence durably before enabling onboarding, and prove the expanded
spending/recovery boundary before purchases or autonomous expansion. Do not defer
all achievement persistence until the later rewards UI stage.

## Proposed owner handoffs

This is a design proposal for the replacement flow, not an admitted Inspector.
Each producer owns validation and errors for its output; consumers cannot
reconstruct upstream meaning from raw provider text or screen pixels.

| Route                 | Producer and input                                                     | Output and consumers                                              | Failure/constraint                                                          |
| --------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Asset creation        | Asset construction source + approved numeric/profile inputs            | Verified geometry/regions/attachments to runtime asset admission  | Unresolved drawing/spec conflict or unsupported feature stops import.       |
| External work         | Connector + permitted source events                                    | Admitted retained events to keyed task/activity projection        | No prefix on invalid batch/archive failure; source fidelity never upgraded. |
| Navigation/follow     | Office selection + current place/agent state                           | Single focus/follow intent to spatial camera presentation         | Missing target is visible; no fabricated actor or task-detail view.         |
| Life activity         | Office simulation + work projection + valid layout routes              | Semantic activity/route to actor renderer and labeled ambient log | Work is never gated on arrival; invalid paths remain simulation failures.   |
| Decorate/dress/build  | Human/agent Feature + detached candidate + revision/policy             | Valid intent to canonical document transaction                    | Invalid/stale/unauthorized proposal writes nothing.                         |
| Canonical publication | Core-owned accepted transaction/replay                                 | Entity projections, scene reconciliation and persistence queue    | No render-owned writes; no duplicate history on load/replay.                |
| Reward/achievement    | Proven membership/task/life outcome + versioned rules + grant identity | Attributed grant and balances/history to economy/UI               | Duplicate events, invalid evidence and unqualified failures grant no money. |
| Render                | Admitted assets + derived scene/pose/camera                            | Visible office through supported spatial provider                 | Unsupported rendering is a reported capability gap, not fallback geometry.  |

## Computation and performance responsibilities

Asset geometry changes only with relevant construction inputs or asset revision;
instance placement/whole-unit transform uses supported transforms where equivalent.
Material/color replacement preserves other instances. Outfit changes affect that
agent's assembly, not every agent. Bounds/routes update with their actual geometry
or layout dependencies. Query/filter work belongs to the task/log projection
owner, not individual rows. Camera interpolation belongs to the rendering clock.

Plan permanent work-count assertions for camera-only frames (zero document
writes and topology generation), one-agent progress (zero unrelated-agent
notifications), color override isolation, invalid proposal (zero writes), event
replay (zero extra grants), and route invalidation after structural edits.
Correct output alone is insufficient; verify generation/query/notification counts.
Add a bounded cache only after profiling proves cost and exact invalidation.
Do not introduce `React.memo` or props-comparison wrappers to conceal broad
updates; use fine-grained subscriptions and composition at actual consumers.

LoD combines screen footprint, visibility and selection; use stable transitions.
Treat animated rigs, alpha foliage, dynamic laptop textures, shadow maps, draw
calls and GPU memory separately. Instance only compatible geometry/materials;
unique overrides and skeletons need their own strategy. Hidden floors retain
canonical updates while stopping nonessential presentation. Proposed load scales
and provisional budgets are in the product plan; none are measured capacity.

## Cases and verification

Future formal suites must cover schema/size validation, unit/axis conversion,
procedural assembly, exact default bounds and contact geometry; garment fit and
socket transforms; source evidence/replay/attempt transitions; scoped projections;
stateful selection and invalid targets; navigation/occupancy invalidation;
transaction/cancel/Undo/Redo; persistence errors/recovery; source-identity
collisions and unrecoverable gaps; immediate onboarding grants and preserved
identity after rejoin; eligible purchase reversal versus consumed goods; reward
deduplication and individual/aggregate attribution. Review fit in multiple animated poses.

Visual gates use the actual model/renderer from one source revision: five matched
cameras, 50 percent overlays, enlarged detail inspections, approved default
appearance, overview/room/rear-agent/exterior/floor cases and LoD transitions.
Record actual reference/render/crop resolutions and calibrated cameras. Use
reference-left/actual-right final multiview sheets with the established layout;
keep opacity overlays and failed iterations as evidence, showing them when asked.
Two independent generated pictures are not evidence of a consistent 3D object.
A successful build or an existing screenshot is not visual acceptance.

Run affected typecheck, lint, build, permanent tests and synchronized browser
review when those owners exist. Prove preservation of shared Preset consumers
for changes there. Keep deterministic work checks separate from machine-specific
profiling. Only the documentation checks apply to this planning update.

## Review and remaining obligations

The existing [Office Inspector](../../../../tools/flow-inspector/inspectors/asyra-office-flow-inspector.data.cjs)
records the retired implementation's seven-step flow and deleted file boundaries.
Its render-step title still says CUSTOM; the shared foundation now also provides
an official 3D path. It has no complete clothing, growth, reward or asset-admission
flow. Its static contract test proves structural links only. It does not admit
this rebuild, and no accepted dynamic Office baseline is claimed.

Before production implementation, update that existing Inspector against the
approved product contract, with exact owners, inputs/outputs, failure routes,
boundaries and executable product cases for each slice. Treat the old map as a
record to replace, not an implementation authority for the deleted source. Full
flow design is required, but admission and proof follow the actual slice: static
asset work must not wait for provider credentials or a completed reward economy. Review whole-flow
handoffs and feasibility, then use the supported admission/evidence path. The
previous contract records a Factory-specific admission limitation: recheck the
current tool, resolve a necessary gap in an authorized slice, and stop affected
runtime work if admission is still unavailable. Do not label planning complete
as implementation admission, add a self-certifying ledger, or silently bypass it.

The principal unresolved proofs are textured/skinned asset delivery, profile
fit/rigging, bounded durable source history and full task feed, exact persistence
and economy atomicity, live-provider capabilities and target-device budgets.
The owner subsequently authorized implementation. The bounded first slice below
is active; later asset subgroups still require their visual review checkpoints.

## Stage 1 - Wall asset harness

Task association: the product plan's Delivery sequence and acceptance, Stage 1.
The user authorized implementation on 2026-10-25. The user remains the design
acceptance and whole-plan closeout owner. This first slice stops at one wall
segment and its real renderer review; it does not implement the complete office.

Scope: app-owned procedural wall construction, a disposable read-only asset
harness, permanent geometry/lifecycle/browser checks, and the corresponding
Inspector contract. Preserve CI scheduling, approved asset inputs and shared
packages. No new dependencies, Blender jobs, provider connectors or save format.
The harness is a review tool, not the final Office UI. Its local view controls
change presentation only and cannot create layout, membership or rewards.

The current Flow Inspector public flow-file path supports this App without
Factory-specific proof admission. Use the supported schema validator and current
flow document, retaining unfulfilled automated/manual criteria until real
results or user approval exist. The static architecture remains an ownership
map, not an execution record. No dynamic Factory evidence is reused.

Owner segment `construct-asset`: consume architecture spec 2.0.5 wall-segment
and optional whole-unit local XYZ extents/appearance. Produce two closed,
outward-facing triangle meshes with named body/top-cap regions, UVs, physical
bounds and a distant shape. Reject nonfinite/nonpositive extents and invalid
appearance before publication. The canonical asset specification is immutable;
these are detached generated review inputs, not editable Office document state.
Default body is 1 x .24 x 2.42 m; cap is 1 x .27 x .08 m, resting at Z=2.42.
Both X end planes are exactly +/- .5 m. Only top edges parallel to X have
inward .004 m radii with two segments; no end bevel, lower lip or decorative seam.
Convert authored (X,Y,Z) to renderer (X,Z,-Y), preserving handedness. Whole-unit
nonuniform scale is applied after construction, including radii and overhangs.
Default colors/roughness come from the existing material entries. Optional group
or per-region color/material overrides retain that precedence without modifying
other outputs. UVs use metres before requested scaling; whole-unit dimensions
update physical repeat distances. No baked lighting or texture generation.

Owner segment `preview-asset`: consume admitted wall descriptors once per
preview session; publish them to SpatialLayer and submit camera changes through
its camera-only API. Core owns official 3D startup, renderer resize and disposal.
View buttons use one registered Feature/API route; no direct engine imports.
Core's supported runtime system-property invalidation requests rendering. No
per-frame canonical reads, topology rebuilds or React frame broadcasts. This
slice has no document mutations, so save, Undo and rewards are inapplicable.
Dispose the observer, layer and Core even after startup failure; retired
callbacks cannot touch a successor. Presentation exceptions remain visible.

First-slice cases: exact dimensions and joins; outward winding/closed topology;
4 mm profile and radius segment count; replacement appearance isolation; XYZ
scaling and invalid sizes; physical UV repeat; distant error bound; five camera
views of the same asset; camera-only updates cause zero geometry rebuilds;
retired-session rejection and cleanup. The regular wall uses a two-tier LoD:
near preserves edge profile, distant drops only the 4 mm bevel under the shared
projected-error threshold/hysteresis. The two named parts remain separate.

Gates: naming baseline and final; static Inspector and public flow validation;
focused Vitest; app typecheck/lint/build; real-browser desktop/mobile review and
five-view captures including a magnified cap join. Technical pass does not grant
user visual acceptance. The provider currently exposes perspective cameras only;
record that limitation and do not call near-orthographic captures exact
orthographic calibration. Stop if geometry, public rendering support, or tested
lifecycle contradicts the approved contract. Do not expand to the next asset.

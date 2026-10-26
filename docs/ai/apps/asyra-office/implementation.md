# Office rebuild - Technical proposal

Status: rebuild implementation authorized on 2026-10-25; complete reference-scene slice authorized. The [product plan](plans/office-rebuild-plan.md)
owns intended experience and acceptance. This replaces claims about the deleted
Office implementation. The first procedural wall and its asset harness are now
implemented using existing shared Preset capabilities. No complete Office runtime,
provider connector or user-accepted rebuild baseline is claimed. The source reset
preceded this slice; deleted behaviour is not restored.

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

### Current interior composition

The live app currently selects `INTERIOR_REVIEW_STAGE = 'structure'`. This
intentional authoring stage renders the foundation, one finished floor, stepped
walls, coplanar cream/green partitions, the flush white pantry floor band and the
complete entrance assembly. The owner-approved entrance includes the fixed left
panel, operable right leaf, frame, gaps and hardware at one uniform scene scale.
Interior furniture, decorative finishes,
wall art and indoor actors are omitted from the submitted scene at composition time. Exterior objects and exterior actors are unchanged. The UI
labels this state `Structure review - one floor`. Furnished authoring data and
its outstanding visual failures are retained for the next stage; it is not an
approved room layout. The active goal is the entire building structure only;
furniture work requires a later, separately selected task. The rejected furnished composition path has been removed; factory defaults now match the live structural stage.

#### Rejected objects - admission before room work

The owner explicitly rejects the following currently authored objects. A catalog
factory, passing geometry test or earlier drawing approval does not accept its
current scene appearance. Except for the complete entrance now admitted by the approved structure, the live structure stage omits them. There is no whole-room furnished fixture to bypass per-object admission. Asset factories, specifications and source measurements are retained. Room work
must admit reviewed objects individually after the structural checkpoint.

| Object                               | Required correction from the approved reference                                                                                            | Construction route                                       | Current status                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------ |
| Complete entrance door               | Warm reference colour, frame, narrow same-colour fixed left panel, right main leaf, two recessed fields and hardware must match as one set | Procedural solid/recess geometry; no Blender requirement | Complete approved assembly admitted in structure |
| Upper-left meeting table             | Reference tabletop, legs, dimensions and position                                                                                          | Procedural                                               | Deferred with the meeting room                   |
| Upper-left upholstered chairs        | Continuous rounded upholstered seat, arms and back, reference proportions and legs                                                         | Blender                                                  | Procedural approximations not admitted           |
| Left work desk                       | Reference tabletop, support geometry and placement                                                                                         | Procedural                                               | Deferred with the work room                      |
| Left upholstered work chair          | Reference curved upholstery and seat/back silhouette                                                                                       | Blender                                                  | Procedural approximation not admitted            |
| Laptop                               | Correct reference size relative to desk and occupant, screen/body proportions                                                              | Procedural                                               | Deferred; current scale rejected                 |
| Work rug                             | Reference oval outline, size and floor position                                                                                            | Procedural                                               | Deferred; current placement rejected             |
| Low stool against work-room wall     | Restore the omitted separate stool using the accent-furniture square-low-stool reference and specification                                 | Procedural base and cushion                              | Missing; must be included in work-room review    |
| Lower-right sofa and lounge armchair | Reference cushions, continuous curves, arms, back and leg placement                                                                        | Blender                                                  | Procedural approximations not admitted           |
| Upper-right refrigerator             | Correct body/door proportions and orientation; no flattened depth to satisfy a projection fit                                              | Procedural                                               | Deferred; current proportions rejected           |
| Upper-right water dispenser          | Correct cabinet/bottle proportions and attachment                                                                                          | Procedural body and rotational profiles                  | Deferred; current proportions rejected           |

Blender work is deferred, not started by this classification. Retain approved
images, dimensions, replaceable appearance contracts and future LoD/animation
requirements. Do not substitute generic boxes or approximate soft furniture in
the live scene while waiting. The owner will review structure first, then each
room. This update does not change exterior objects or start interior furnishing.

The owner rejected the former authored room schedule and requires the approved
complete image to control proportions. All rooms are on one first floor, as explicitly confirmed by the owner.
The former split-level interpretation is rejected. Perspective screen heights
must not become independent room elevations.

#### Approved construction authority

`scene/reference/office-structure.json` is the numeric construction input for
this stage. It promotes the owner-approved snapshot
`assets/asyra-office/models/architecture/review/office-single-floor-structure-proposal-v1.json`
(SHA-256 `d86f7e7b55db77a90a75bf4ff7449581d8cd53c0aa58753722a89c93b239cd5d`).
The app consumes dimensions and connection rules, not the review drawing meshes.
`office-layout.ts` exposes these values; `office-interior.ts` constructs the
normal catalog assets and joined wall meshes. No image fitting or geometry
reconstruction runs during rendering or camera movement.

The original full image remains visual authority. The owner-approved correction
resolves the earlier inconsistent single-image interpretation; do not rerun the
old fitting commands to overwrite this accepted construction. Source pixels and
`interior-fit.json` remain authoring evidence for deferred furnishings. They no
longer control live wall placement. The overview uses the approved correction's
view direction; source-space artwork still uses its original image camera.
Neither camera is evidence of surveyed real-world dimensions.

The construction contract is:

- A complete rectangular foundation includes the lounge area hidden by plants.
  All four rooms share finished-floor Z = 0.38; the slab top is 0.355 and the
  floor finish is 0.025 thick. No indoor risers or room-specific elevations.
- Cream and green partitions share one center plane. Their accepted heights
  above the floor are 1.959505 and 1.763554, with a 0.312835 clear opening. Do not
  enlarge that opening to impose a future gameplay clearance requirement.
- The frontage has separate thin and thick members. The full entrance uses the
  approved 1.66 by 2.17 nominal rough opening and uniform scale from the snapshot;
  the fixed left panel and right leaf preserve their 0.60:0.90 width ratio.
  There is no duplicate frame or overlay covering the opening. The header keeps
  the neighboring wall cap height instead of compressing an entire wall asset.
- The lounge rear has three ascending, horizontal sections. The left side has
  a low front section and higher return, with accepted lengths 0.828869 and
  0.614667. The perpendicular rear branch is a separate member. No sloped crown
  substitutes for the steps.
- The white pantry edge is a floor finish at the common datum. Wood planks are
  clipped out of its footprint, avoiding coplanar overlapping surfaces. No
  pantry east parapet is present.
- Equal-height rear corners use complementary 45-degree ends. Unequal-height
  contacts terminate at the host body's face; caps use their corresponding
  contact plane. Both near and distant representations retain the same joints.
- Exterior assemblies, labels and entrance steps are preserved. Furniture,
  lighting and diagonal shadow-band corrections are outside this stage.

`approved-structure.test.ts` compares the actual composed body/cap extents of
all sixteen approved wall groups, in both mesh detail levels, with the frozen
independent snapshot. It also checks every entrance component and the floor-band
replacement. `wall-joins.test.ts` checks actual joint coverage;
`structure-stage.test.ts` checks shared floor, foundation and stage admission;
`entrance-structure.test.ts` checks opening fit and clearances.
`structure-circulation.test.ts` checks the accepted physical openings without
claiming future character-sized navigation. The previous all-room path test
imposed a door-leaf-derived character radius not present in the accepted design;
that is not a reason to widen walls or alter the owner's proportions.

Actual-app hardware review records the normal production composition at overview
and two normal zoom-in actions. Its metadata identifies the URL, viewport and
GPU. Screenshots complement the geometry tests; a passing screenshot capture
alone does not certify visual equivalence. Shadow banding remains deferred by
the owner. Future per-room cutaway/LoD visibility remains a separate task.

The refrigerator doors face east; the striped pantry field stops at the measured
boundary before the plain poster field. Furnishing remains deferred.

The sofa-side planter retains the traced vessel bounds `[656, 443, 676, 468]`,
with foliage separately measured at `[649, 423, 684, 449]`. The sink and lounge
coffee-table plants also have independent vessel/foliage bounds in
`interior-landmarks.json`. `indoor-plants.ts` selects the explicit soil-rooted
rosette recipe, fits the vessel and foliage independently around their common
soil pivot, and retains named closed parts. This replaces the incorrect tall
central stalk for those three interior instances. Exterior plants and the reusable
stemmed default remain unchanged. An envelope fit alone does not certify every
leaf silhouette or the final material appearance.

The pantry shelf uses corresponding top corners instead of an object box. Its
right corners are `[879, 267]` and `[893, 261]`; left corners partly occluded by
plants are ranges, not exact measurements. The exposed corner residuals are
below one source pixel. Three separately lidded canisters consume the approved
`pantry-smallware` body/lid profiles with different measured radial and vertical
sizes. They rest on the shelf and remain inside its support rectangle. The two
small source shelf plants and jar label details still need visual reconciliation.

The sink is fitted from named countertop corners, excluding faucet and contents
from its size evidence. Whole-instance XYZ scaling follows the measured top plane;
its lower construction and hidden support are not independently recovered. The
fit records corner residuals and keeps the pot on the solid right strip of the
counter rather than inside the basin. The cabinet-front recipe now follows the visible left door, two stacked drawers
and narrow right end panel. It replaces the former equal-door subdivision; its
actual-app appearance remains subject to the same source comparison.

The lounge armchair retains the user-approved 713 x 610 x 690 mm default recipe.
Its rear foot centers were corrected from the approved SIDE drawing; the scene
instance has a separate measured pose and XYZ scale. Visible foot contact is an
exact landmark; plant-occluded contacts are intervals. Bounding-box-only fitting
previously selected a wrong-facing pose, so contact evidence and physical floor
support are mandatory. The existing upholstered shape remains under visual review.

Six real paper rectangles carry the source's small photographs. The three main
framed artworks carry only their rectified printed interiors, including the
original lettering and small printed symbols. `artwork.ts` decodes the approved
source once per runtime and reuses its pixels; it does not create environment,
furniture or shadow billboards. Replacement artwork remains a surface parameter.
The lounge quote uses actual cut-out glyph geometry directly on the wall, without
an opaque backing or invented frame. Its exact font and heart mark remain open.

The exterior snapshot excludes the office foundation and office-facade labels.
Re-inserting the previous slab into the current exterior-only calculation
reproduced `87ab192aa76fb863ff103aee9b586558f49831af07b26d4c19ff3d3c752745dc` exactly.
The unchanged 404 exterior assemblies and exterior labels now have digest
`80813db1260c607ae83dcb757d7ad60c8ddad9c3dd33c7566417f080265a3076`.
This boundary change authorizes the office slab, not street, tree, lamp or park
changes. No exterior snapshot may be accepted without the corresponding proof.

Reproduce measurements from the repository root with the existing environment:

```sh
node_modules/.bin/tsx apps/asyra-office/scripts/export-interior-meshes.ts
python3 apps/asyra-office/scripts/fit-interior.py
```

The fitter uses already installed NumPy/SciPy; it does not install dependencies.
It writes the completed result atomically so a live app cannot load a partial fit.
The export is production catalog geometry in `tmp/setup/office-fit-meshes.json`.
Generated input, source landmark data and permanent tests are retained in the app.

`e2e/interior.spec.ts` captures the live APP_URL overview, four room views,
oblique views, three rear-follow views and an exact 845 x 756 scene viewport.
The measured-reference case uses normal app controls and the production renderer.
`scripts/compare-interior.py <canvas-path>` places that canvas beside the matching
source crop and produces a 50% overlay without warping, independently resizing
objects or replacing the app output with a drawing. Inspect enlarged wall joins,
floor edges, furniture supports and the overlay; passing E2E only proves the
browser cases, not visual parity. Existing individual model fidelity, texture
banding, global appearance and foreground follow-view occlusion remain separate
open visual requirements. Whole-product visual acceptance remains open.

The reported-defect regressions cover wall continuity, oval contour, the full
foundation outline, common floor datum, absence of indoor risers, sofa visibility and
solid clearance, rug/furniture support, refrigerator face direction, wallpaper
coverage, bottle bounds and sofa-side pot bounds/support. Six fixed source-coordinate comparison crops supplement
the full overlay. Inspect these before marking any individual defect corrected;
small aggregate endpoint errors cannot substitute for this review. Model detail,
lighting and unrelated follow-camera occlusion remain separate open requirements.

An earlier bounded structural checkpoint passed 17 structure/joint/opening
cases, six projection/exterior cases, app types/lint and the naming gate. Six
live-browser cases pass at APP_URL, covering overview, four rooms and a measured
845 x 756 canvas. Evidence is under
`apps/asyra-office/test-results/office-floor-containment/`. The current live app
remains structural-only. The matched-camera overlay was inspected; whole-room
proportions, complete wall graph and architectural frames are not yet accepted.

Visual limitation: Playwright currently forces SwiftShader, and the spatial engine
disables shadow maps for software renderers. Its screenshots therefore cannot
validate hardware shadow quality. The owner's live screenshot and the explicit hardware review show regular
diagonal banding on walls and floors, consistent with shadow acne but not yet
isolated by a shadow on/off comparison. The app has no stripe postprocess, and
its plaster albedo has noise rather than directional lines. ACES tone mapping
is enabled in the provider. Keep this hardware-only artifact unresolved; passing
software screenshots is not evidence that it has been repaired.

Run the maintained hardware case with
`OFFICE_HARDWARE_REVIEW=1 yarn workspace @asyra/asyra-office test:e2e e2e/structure-hardware.spec.ts`.
It overrides only the browser launch arguments, retains the ordinary APP_URL and
production scene, records WebGL backend metadata, and rejects software fallback.
The overview and two-step zoom captures reproduce the reported banding. This
closes the evidence mismatch, not the rendering defect. No shadow toggle or
bias correction has been applied; a controlled on/off comparison is still needed
before treating the suspected shadow-acne cause as established.

The earlier structural correction passed 19 interior regressions and 26 scene, surface,
lifetime and keyboard cases, plus nine live interior browser cases. Lint,
typecheck/build, naming and update guidance pass. The final 845 x 756 canvas,
50% overlay, six enlarged source-coordinate comparisons and lounge orbit were
inspected. Source hashes match the approved image and measured inputs. Build
retains its existing large-chunk warning. The shared wall crown, foundation
termination, oval work rug, stepped lounge enclosure, fridge orientation,
wallpaper boundary and bottle proportions are corrected in this bounded pass.
Sofa/armchair silhouettes, decorative details, foliage silhouettes and the
constrained lounge-rug image residual remain visibly different; neither these
results nor the numeric gates grant whole-scene visual acceptance.

Session-lifetime tests use a small nonempty production-mesh fixture to verify
construction counts, cleanup, failure recovery and camera-only updates. Full
scene geometry remains covered by the separate scene/interior suites and live
E2E. This removes unrelated repeated model construction from the lifecycle
cases without increasing their timeout or changing the production runtime.

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
profiling. The initial planning update used documentation checks; each implementation
slice must additionally pass its runtime gates below.

## Review and remaining obligations

The [Office Inspector](../../../../tools/flow-inspector/inspectors/asyra-office-flow-inspector.data.cjs)
now describes the rebuild's asset, source, membership, life, layout, persistence,
reward and rendering ownership. The retired source is not an authority. Its
static contract test checks structure and links, not runtime correctness.

The [current public flow document](../../../../tools/flow-inspector/inspectors/office-rebuild/rebuild.flow.json)
records the bounded wall slice and its unfulfilled technical/manual criteria.
Full-office integration remains unaccepted. The supported flow-file admission
path is available; no Factory-specific dynamic evidence is claimed. Before each
later slice, review its exact owner boundary and executable product cases.

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
near preserves the edge profile; distant drops only the 4 mm bevel. The preview
controller owns projected-error hysteresis (enter distant below .4 px, return
near above .6 px). Inspection views force near detail. The asset declares the
shared distant descriptor contract, but the preview submits the selected retained
shape without instances/distant so a second renderer policy cannot override this
review state. The shared renderer does not itself promise hysteresis. The two
named parts remain separate. The narrow-lens camera clips around the subject
instead of using a .01-to-500 m depth range; formal tests bound 24-bit depth
quantization at the target below .01 mm.

Gates: naming baseline and final; static Inspector and public flow validation;
focused Vitest; app typecheck/lint/build; real-browser desktop/mobile review and
five-view captures including a magnified cap join. Technical pass does not grant
user visual acceptance. The provider currently exposes perspective cameras only;
record that limitation and do not call near-orthographic captures exact
orthographic calibration. Stop if geometry, public rendering support, or tested
lifecycle contradicts the approved contract. Do not expand to the next asset.

## Complete scene - Current execution contract

The complete scene remains the product objective. The owner's latest execution
order requires structural review first, followed by one room at a time. Preserve
the wall factory as a tested asset; the default app route currently renders the
structure stage described in Current interior composition above, with the
existing exterior unchanged. The prior furnished preview is not accepted.

Step `construct-asset`: input current catalog component specs and explicit preview
placements; output named reusable mesh parts with dimensions, materials and authored
axes retained. Files: src/assets/. Tests cover finite topology, specification
component dimensions and assembly identities. No baked reference pictures, shadow
textures or alternative renderer. Geometry recipes missing from a primitive must
be implemented explicitly, not silently skipped. Renderer descriptors consume
completed assets. Materials/text artwork are independently replaceable surfaces.

Step `compose-office`: input completed assets and a frozen synthetic reference scene
with named rooms, actors and tasks; output the complete SpatialFrame and subscribed
UI selection state. Files: src/scene/, src/ui/, src/main.tsx. Static preview data
does not enter live membership, rewards or activity archives. Camera-only changes
reuse mesh artifacts; UI filters cannot rebuild geometry. Source/destination units
are explicit; local asset Z-up converts once to renderer Y-up. The existing official
3D provider owns actual rendering, soft directional shadows, textures and disposal.

Product cases: default view includes work/pantry/lounge/shared-table zones, complete
door set, furniture, people, planted sidewalks, street, park seating,
canal and neighboring shops. Both tab pairs work; task filtering and search work;
agent/task focus uses a rear view, overview restores composition, drawers are
reachable on mobile. Synthetic status is visible. Runtime stops observers and
releases its Core generation on disposal. No real provider or editor is claimed.

DoD: scoped unit/E2E/type/lint/build/naming checks and full-size real-renderer
overview plus closer room inspection. User still owns visual acceptance. This
execution contract does not claim all asset sheets or full product completion.

### Current preview corrections and scope

The owner constrained this round to code-generated work, without Blender. Compare
implemented objects against the approved image; do not block on optional global
color grading or cinematic effects. This does not relax component geometry or
substitute a filter for construction correctness. Final visual acceptance remains
with the user.

Construction corrections have permanent regressions for normalized box face UVs
(the current texture provider clamps edges), the lantern's 2.74 m / 0.53 m bounds,
the lounge chair's own U shell and four feet, seating at an explicit surface datum,
and projection of the entire eye patch onto the head. Scene regressions cover the
vertical clock rim, entrance side joins and upright text surfaces. Procedural
preview face UVs are local 0..1 coordinates; the wall harness retains its physical
UV contract. Full catalog physical-repeat mappings are not claimed complete.

Leaf construction now retains one near and one distant prototype, plus per-leaf
positions, bases, sizes and colors. A session places the shared prototypes via
public instancing and projected-error LoD. The current numeric distribution is 3,264
leaves per tree, including the scene. Unauthorized canopy growth parameters have
been removed. Near/far prototypes contain 256/32 triangles. The 10 mm local error allowance covers the
sampled silhouette deviation plus the 3 mm bulge; pixel threshold is 0.75 and the
renderer accounts for instance scale. This does not establish LoD for every other
part or target-device performance. Camera-only operations reuse constructed data;
formal work-count assertions cover repeated focus/follow/overview and teardown.

The scene is a procedural preview, not an accepted production model set. Hidden
joins, garment/skin and hair intersections, complex smooth unions, every catalog
material recipe, animation and final per-asset five-view fidelity are not verified.
No live work, editing, progression or provider behavior is inferred from demo data.
Review imagery must be actual app output, with overview and close-ups inspected;
technical passes must not be promoted to manual visual acceptance.

### Foliage correction and deferred animal modeling - 2026-10-25

Task association remains the complete-scene slice. The current bounded correction
is owned by `construct-asset`: consume the approved small-plant and street-leaf
contracts, produce reusable closed leaf surfaces, and verify source geometry plus
actual scene close-ups. App asset sources/tests, the foliage browser case and
these implementation notes are the mutation boundary. Existing scene placement,
public renderer, approved reference/spec files and filters are preserved. No
Blender process, new dependency, provider, rig or procedural animal reconstruction
is included. Failed geometry cases precede fixes; passing automation is not visual
acceptance. Stop on a source-contract conflict or unsupported renderer capability.

Street leaves split rim vertices from both skins, preventing rim normals from
contaminating skin shading. The later reconciliation refines the near outline
to 256 triangles while retaining the 32-triangle distant prototype.
Potted foliage uses the six approved folded blades, paired attachment heights,
petioles and declared pot profile instead of twelve spindle ellipsoids. The later
reconciliation adds bounded 0.8 mm profile rounding. Blades have real thickness,
but their authored orientation and whole-scene planting density/placement
fidelity remain open; a six-leaf pot is not a substitute for every
shrub, hanging plant or dense planter in the reference.

The owner explicitly assigns complex animals to the later Blender stage because
animation is required. The latest owner direction removes the rejected cat/corgi geometry and generator
entirely. No temporary animal remains in the scene. Earlier TODO checks against
the removed factory are superseded by formal absence and source-preservation
regressions; approved Blender inputs remain unchanged. The next animal stage must establish
anatomy, deformation topology, named materials, skeleton, weights and motion
validation. The existing restricted GLB preview decoder does not admit skins or
animations. Runtime import/playback support must be proved through the public
renderer boundary before claiming animated animal delivery. App state owns motion
selection and world navigation; authored animation belongs to the asset pipeline.

### Current correction contract - animal removal, tree rebuild and camera movement

Owner direction on 2026-10-25 supersedes retaining temporary animals: remove their
scene instances and rejected generator; retain approved source images/specifications
for a later Blender asset stage. First segment `compose-office` consumes existing
scene artifacts and keyboard camera intents. It removes the three animal instances
and implements camera-relative ground-plane movement via the existing public
Preset camera API. WASD/arrows move; Shift accelerates; text input and modified
browser shortcuts bypass movement. Movement must not reconstruct scene assets.
Allowed files are app scene/UI code and focused tests. Rejected animal generator
removal belongs to the following `construct-asset` segment. No renderer writes,
provider data, live membership or replacement animal geometry are allowed.

Next segment `construct-asset` rebuilds the street-tree representation from the
approved leaf/cluster/bare-tree images and current geometry contract, followed by
`compose-office` placement and actual near/full-scene review. Preserve named
geometry, two-level branch ownership, replaceable appearance and explicit LoD.
Inspect tree topology, silhouette, leaf orientation and density; do not count
passing tests as visual acceptance. App asset code, scene composition, associated
unit/browser cases and these docs are the bounded scope. No new dependency,
Blender job, filter or unrelated object redesign is included. Stop on a concrete
source-contract conflict or unsupported public render capability.

Gates: formal rejection of animal scene artifacts, camera translation/direction/
disposal and text-input isolation tests, tree geometry tests, real app screenshots
at overview and close range, app lint/type/build and naming. Technical evidence
must describe any unclosed tree requirement; user visual acceptance remains open.

The earlier canopy-density iteration is superseded: it diverged from the source
recipe and its tests validated those extra parameters. The current scene uses 3,264
leaves per tree, or 19,584 across six trees. Near/far foliage totals are
835,584/104,448 triangles per tree before wood. Instancing reduces storage/draw
overhead, not triangle work; no target-device FPS guarantee is claimed. Wood
still uses separate swept branch parts; the authored fused-junction extraction
and submillimetre error certification remain unclosed model requirements.

Camera movement reuses Preset `moveSpatialCamera`; the app combines its up/forward
basis contributions so world height and viewing direction remain fixed. The input
adapter updates only camera and target from elapsed frame time; native key repeat
does not create additional movement. There is no idle animation loop. The app
owns matching movement keys in capture phase
before canvas input consumes them, leaves text/IME/browser shortcuts alone, and
removes all input listeners and cancels its active animation frame on disposal.
Formal tests cover the focused-canvas regression,
relative direction after rotation and zero asset reconstruction during movement.

### Smooth keyboard camera correction - 2026-10-25

This bounded follow-up belongs to the existing rebuild plan and owner step
`compose-office` (static Inspector, inputs/conditions and implementation boundary).
Input is manual camera intent plus the browser frame clock; output remains the
retained camera projection through the existing feature and public Preset API.
Replace native key-repeat stepping with elapsed-time movement, normalized diagonal
input and short acceleration/deceleration. Shift selects three times the target
speed. Release settles; blur, hidden document, text focus and disposal stop
immediately. No movement loop runs when idle. Long stalls cannot cause a catch-up
jump. Geometry is constructed once per scene, never per movement frame.

Allowed contributor and failure owner: Asyra Office / `compose-office`. Allowed
changes: app camera UI adapter, its direct controller/runtime consumers if needed,
unit/browser regressions, README and matching Inspector/evidence/release notes.
No geometry, filters, animal, framework, dependency or persisted identity changes.
Renderer-owned canonical writes and direct renderer manipulation remain forbidden.
Keyboard text/IME/modifier shortcuts bypass movement. Existing selection, orbit,
zoom and camera-relative ground height must remain valid.

Gates: first prove repeat-independent movement fails on the old input adapter;
then deterministic 30/60/120 Hz displacement, smooth start/stop, diagonal speed,
Shift, cancellation and idle scheduling tests; retained scene construction counts;
live camera browser regression on APP_URL; app lint/type/build, naming and scoped
document review. Stop for a public API or ownership conflict; complete only when
these bounded cases pass. Whole-scene visual acceptance is not part of this fix.

Keyboard velocity uses 90 ms acceleration and 60 ms release time constants,
with exact exponential integration at 12 controller units/second (Shift: 36).
Velocity decay follows real elapsed time; integrated travel is scaled down for
frames longer than 50 ms to prevent stall catch-up jumps without extending release.
The adapter retains only held keys, velocity and one pending frame callback; it
consumes the existing feature API and never rebuilds or caches scene geometry.

Bounded validation replan: live software rendering exposed that capping elapsed
velocity time also stretches the release tail at low frame rates. Keep the same
owner/API; use real elapsed time for velocity decay and cap only integrated
single-frame displacement. Add a stalled-release regression before the correction.
Split browser proof into held movement, release, and text cancellation cases;
retain their existing per-case/global guards and only the two captures needed for
each comparison. No geometry reduction or application-specific test output is
allowed. Screenshot throughput is not the product motion-speed oracle.

Validation: 47 unit cases and four focused live-browser cases pass. The browser
cases separately prove continuous held input after orbit, release settling, text
focus cancellation, and the retained tree review route. Rendered movement captures
were inspected at the same APP_URL (1024 x 768 camera viewport). Unit oracles
prove rate independence and idle/cancellation work counts; screenshots alone do
not certify hardware FPS. App lint/type/build and naming remain required.

### Vegetation specification reconciliation - bounded model iteration

The previous canopy-density iteration is superseded. Under the existing rebuild
plan, compare only street-tree and small-leaf-plant construction, their placement,
and direct preview/render consumers against the selected asset documents/images.
The first incorrect owner is `construct-asset`: ad-hoc growth parameters and
hardcoded plant values replaced the authored recipe, while separate capped wood
tubes were retained despite the union requirement. The tests then encoded those
choices rather than checking the source contract. Numeric document review was
incorrectly treated as if it established visual model acceptance.

Step card - `construct-asset`: inputs are the approved tree and small-plant JSON,
mathematical supplements and requested whole-unit transforms; outputs are named
asset parts. Only app asset construction/tests may change in this segment.
Preserve default leaf counts, seeded palette/order, uniform instance scale,
curve attachments, shell geometry, pot cavity and appearance defaults. Add
independent numeric acceptance checks before correcting implementation. Forbidden:
new silhouette blobs, density/leaf-size patches, altered reference sheets, ignored
geometry clauses, renderer-only repairs, Blender or new dependencies. Missing
wood extraction is a real model limitation, not a passed contract.

Next step card - `compose-office` / `preview-asset`, executed only after focused
construction gates: consume those same completed assets, remove unauthorized
canopy overrides, preserve whole-unit proportions, and review individual leaf,
plant, bare tree and complete tree from multiple cameras using the official Core
renderer. Camera changes must not reconstruct assets. Allowed files are the direct
scene/preview/UI entry consumers, permanent tests and these owning docs. No other
furniture, characters, filters or product behavior is included.

Gates: source numeric oracles (including foliage counts/bounds/palette and plant
stem/soil/pot dimensions), appearance data, focused unit tests, actual app macro
and close views, app lint/type/build, naming and update guidance. Stop visual
closure on a conflict between the constructed numeric contract and the selected
image; report it instead of inventing another hidden multiplier. Keep reference
images and model acceptance separate. This iteration does not authorize changing
the approved numeric recipe to fit a single camera.

#### Reconciliation findings and retained limits

Numeric regressions failed before the corrections: scene leaf population, rim
UV arc length, plant stem tip radius, material values and pot construction. The
implementation now uses the source recipe, a 2 mm stem tip, 24/16 stem/petiole
segments, 96 pot sectors, bounded three-segment 0.8 mm profile fillets, welded
axis vertices and soil clipped against the rounded inner cavity. Leaf rim UVs
follow perimeter distance. Eight samples per cubic arc resolve the near outline
within 0.5 mm without changing the authored Bezier shape. The original four-sample
seed envelope remains an independent regression; finer curve points can extend
that sampled envelope without changing the analytic silhouette.

The isolated Core review uses the same factories and retains geometry across
view changes. A narrow lens requires near/far planes fitted to the asset depth;
fixed 0.0001/1000 planes caused preview depth artifacts and were replaced after a
failing depth-resolution regression. Review screenshots are real app output.

At the first reconciliation checkpoint, image comparison did not pass. Revision 1
used 23 clusters / 1,744 leaves that were
sparser than the approved cluster and tree images. The plant's defined radial
XY leaf surfaces and azimuths expose edge-on blades from the front. Its stem ends
at Z=0.290 while the highest petiole starts at Z=0.260, leaving a 30 mm exposed
stub. These followed the revision 1 numbers. The subsequent owner instruction accepts
the potted plant unchanged and authorizes tree-only foliage calibration.
The numeric supplements themselves explicitly distinguish authored construction
choices from measured reconstruction and visual acceptance. Do not call their
completeness proof of image fidelity. A future approved numeric calibration must
resolve these conflicts across views; hidden scene multipliers are not a fix.
Wood union is a separate implementation gap, not a source-image discrepancy.

Reconciliation validation: 53 unit cases and nine live-browser cases pass, along
with app lint, type/build, naming and update guidance. Screenshots cover leaf,
cluster, bare tree, full tree and plant at front/top/three-quarter (842 x 700
viewport captures), plus office foliage/tree and retained wall review routes.
The final near leaf has a smoother analytic outline; pot cavity and lip remain
visible. At that checkpoint, tree branch joins, canopy density and plant silhouette
were not marked accepted; see the subsequent owner instruction below. Build retains its existing large-chunk
warning; no runtime FPS conclusion follows from these gates. No approved source
image or numeric asset specification was rewritten during this reconciliation.

### Tree canopy calibration - 2026-10-25

Owner instruction accepts the potted plant and requests a fuller tree against the
original image. This supersedes the previous freeze on foliage numeric changes.
Only street-tree foliage construction, its numeric contract, direct tests and
review evidence may change. Keep the accepted plant, wood graph, shared leaf
shape, scene placement, camera, animals and materials unchanged. Wood fusion
remains a separate open requirement; it is not part of this density correction.

Step card: `construct-asset`, using TREE-CONSTRUCTION's foliage sections and the
selected complete-tree/cluster images, produces the same named instanced asset
for both Office and `preview-asset`. Input is the revised deterministic assembly
recipe; no camera input, rendered guide geometry, scene-only multipliers or new
cache is allowed. @asyra/asyra-office owns construction and failures. The existing
Inspector's assets boundary admits the implementation; documentation owns the
revised recipe. Preserve immutable reference images. Calibrate overlapping lobes
and outward leaf surfaces in three dimensions, not extra copies at old tip points.

The current tests assert the sparse 1,744-leaf recipe and cannot detect the visual
failure. Add a source-space projected leaf-coverage oracle for front, side and top
before changing the recipe. Then check shared prototypes, deterministic output,
instance budget (at most 3,600), LoD and existing plant tests. Inspect actual Core
multi-view, close cluster and live Office screenshots. Run app lint/build, naming,
update guidance and diff checks. Finish this bounded density correction only when
coverage and multi-view inspection pass; retain explicit remaining wood limits.

Construction gate: the new fixed-window coverage test fails all three axes on
revision 1 (including side 43.3% and top 25.6%) and passes revision 2. All 56 app
unit cases pass. Proceed to the existing `preview-asset` and `compose-office`
consumers for read-only verification: same canonical assets, no new runtime
behavior or scene transforms. E2E evidence adds the right view to existing front,
top and three-quarter captures. Use APP_URL=http://127.0.0.1:5194; inspect cluster
close-up, full tree and live Office. Accepted plant is unchanged.

Bounded calibration revision: whole-crown coverage hid hollow individual lobes.
The added close-cluster oracle failed at 57.7% top coverage for shell sampling.
Use filled, overlapping subgroup volumes instead. Reducing subgroup scatter from
45% to 28% raises front/side close coverage to 84.3/84.9%, still below the unchanged
85% floor. Retain the existing instance budget and leaf size; set scatter to 24%
of each declared lobe radius to provide overlap margin. No broader scope, new
owner, image replacement or per-view rule is introduced. Recheck the same close
and whole-crown gates, then actual render views; density alone is not acceptance.

Final density checkpoint: revision 2 contains 3,264 uniformly scaled instances,
23 owner-attached clusters, and five filled subgroups per cluster. The original
images, bare-tree graph, leaf prototype, accepted plant and scene placements are
unchanged. All 59 unit cases pass, including six crown/close-cluster coverage
oracles. Six live-browser cases, app lint/type/build, naming and update guidance
pass. The existing build chunk-size warning remains; no hardware FPS is certified.

Visual evidence command:
`yarn workspace @asyra/asyra-office test:e2e e2e/vegetation.spec.ts e2e/tree.spec.ts`.
Base URL is APP_URL=http://127.0.0.1:5194. Isolated assets use front/right/top/
three-quarter with 1200 x 1000 pages and 842 x 700 viewport captures; Office uses
1440 x 960, the Street trees place, one zoom step and an orbit. No diagnostic
geometry, reference backgrounds, grading or camera-facing leaves are present.
Final captures are under `apps/asyra-office/test-results/`, especially
`vegetation-tree---same-authored-geometry-in-multiple-views/tree-front.png`,
`tree-right.png`, `tree-top.png`, the cluster three-quarter capture, and the live
`tree-tree-inspection-uses--cc0e5-fice-from-overview-and-side/tree-near.png`.

Agent screenshot review: density and local overlap improved; hollow-shell lobes
are removed and the front/quarter crown is substantially more continuous. The
side silhouette is still narrower than the reference and the unchanged wood
junctions still lack fusion. This checkpoint covers foliage density, not full
asset fidelity or whole-office acceptance. The owner has not approved this tree
revision. No commit or push is performed.

### Volumetric tree growth and variation - 2026-10-25

The owner requests branches growing around the trunk in all directions and
recognizably different tall/short trees. This supersedes the earlier wood-layout
freeze. Scope: tree growth geometry/specification, scene tree selection and sizing,
their tests and actual app evidence. Preserve parent graph (including B7 -> B11),
maximum depth two, leaf prototype/materials/counts, accepted plants, other objects,
camera controls and source pictures. Wood fusion remains separate from radial
growth. No Blender, dependency, filter, renderer repair, commit or push.

Step card `construct-asset`: consume the catalog scaffold and deterministic seed;
produce named wood and leaf parts. Redistribute primary subtrees radially around
the trunk with bounded seeded angle/reach/height variation. Evaluate each child
root on its transformed parent curve. No camera-dependent geometry or branch-level
expansion. The app asset owner constructs each variant once; all variants share
one near/far leaf prototype pair within a batch. Add failing tests for wood XY
aspect and four-quadrant reach, distinct relative branch shapes and determinism,
parent attachments and prototype construction counts before implementation.

Next card `compose-office`: consume six completed tree variants with explicit
uniform sizes, replacing the repeated single asset. Keep locations and other
scene data unchanged. Tests require at least four distinct heights and at least
1.5 tallest/shortest ratio, plus distinct normalized branch shapes. Existing
camera work-count tests must continue to prove zero reconstruction on navigation.

Read-only `preview-asset`/Office verification: inspect bare tree front/right/top,
full tree front/right/top/quarter and six scene trees. Retain density/LoD gates;
run app unit/lint/type/build, naming, update guidance and scoped diff review.
Stop for a required public API change; no such change is expected from these
existing owner boundaries. Tests alone do not certify tree visual acceptance.

Growth owner checks passed: default branch width/depth ratio exceeds 0.75,
all four XY quadrants have primary branches, different seeds change pairwise
branch-tip distances, all secondary roots equal their analytic parent curve, and
six variants sample the leaf Beziers exactly eight times (one near/far pair).
Proceed to `compose-office`: six fixed seeds and uniform scales
0.68, 1.12, 0.82, 1.28, 0.95, 0.73, with existing positions/yaws. No per-frame work.

Final radial-growth validation: 70 unit cases, seven live-browser cases, app lint,
type/build, naming and update guidance pass. All six seeds independently pass
four-quadrant and XY aspect checks; scene geometry has six distinct normalized
branch signatures and trunk heights. Tallest/shortest uniform scale ratio is
1.28/0.68 = 1.882. The original source-space sparse-wood ratio was 0.347 and the
old scene exposed only two heights; the new regressions failed before correction.

Visual review uses APP_URL=http://127.0.0.1:5194 and
`yarn workspace @asyra/asyra-office test:e2e e2e/vegetation.spec.ts e2e/tree.spec.ts`.
Inspected bare-tree top and quarter, full-tree front/right/top/quarter, Office
close view and an overview with two zoom-out steps. Evidence is in the app's
`test-results/`: `vegetation-bare-tree---sam-862aa--geometry-in-multiple-views/`,
`vegetation-tree---same-authored-geometry-in-multiple-views/`, and
`tree-wide-overview-exposes-6f24a-owns-in-the-same-live-scene/tree-variation-overview.png`.
Review confirms spatial branch reach, a non-flat crown and visible scene size
variation. Screen framing/occlusion means not every whole tree is unobstructed in
one overview; six-instance diversity is additionally verified from scene geometry.
The plant remains unchanged. Wood union/fork surface smoothing remains an existing
separate limitation; this is not full catalog or full reference-image approval.
No commit or push is performed.

### Irregular branching and distributed foliage - 2026-10-25

The owner rejects the fixed spoke-and-tip-tuft structure and requests more,
less regimented branches. Bounded scope is the `construct-asset` tree branch and
foliage assembly, numeric/readable contracts, direct tests and live review evidence.
Keep the existing two-level limit, individual scene seeds/heights, shared leaf
shape/LoD/materials, accepted plant, other assets, source pictures and camera.
Wood fusion remains outside this distribution correction. No new dependency,
Blender, screenshot substitution, scene-only repair, commit or push.

Step card: inputs are the revised catalog growth recipe and stable seed; outputs
are real named branch meshes plus leaf instances. Retain the original branch
scaffold, then generate a bounded variable number of primary and secondary
branches at varied attachment heights, azimuths and lengths. Each child attaches
on its actual parent curve. Redistribute a fixed 3,264-leaf budget along branch
interiors and ends, using smaller overlapping groups rather than one terminal
ball per branch. Randomness is object-local, repeatable, and independent of views.
Only the app asset owner contributes; no renderer or React-derived geometry.

First prove the fixed branch count and tip-only population fail new regressions.
Then validate variable counts, maximum graph depth, attachments, deterministic
output, fixed leaf budget, sharing/work counts, density and LoD. For downstream
read-only verification use existing preview/Office routes, including bare/full
front/right/top/quarter and close foliage. App unit/lint/type/build, naming,
update guidance and diff review are gates. Compare actual images for clustered
holes and repeated spoke patterns; source-space coverage alone is insufficient.

Revision 4 validation: 77 app unit cases and seven actual-app browser cases pass;
app lint, TypeScript/build, naming and update guidance pass. The strengthened
35..55-branch range regression was rerun after the complete unit suite and passes.
The original implementation failed the added branch-count regression at 20.
An initial redistribution failed the close-cluster coverage oracle; count-dependent
core radii corrected it without increasing the 3,264-instance budget. Existing
batch work-count, LoD, deterministic growth and accepted plant tests remain green.
The production build retains its existing large-chunk advisory.

Actual screenshots were captured at APP_URL=http://127.0.0.1:5194 by
`yarn workspace @asyra/asyra-office test:e2e e2e/vegetation.spec.ts e2e/tree.spec.ts`.
Reviewed bare-tree top, full-tree quarter/right/top, close cluster, Office close
view and wide overview. Asset screenshots are 842x700 px; Office screenshots are
1440x960 px. Evidence remains in `apps/asyra-office/test-results/` under the
vegetation/tree test directories. The new branch graph and overlapping intermediate
foliage reduce the repeated spoke-and-terminal-ball pattern. Side views still
expose irregular openings and some outlying tips; this is not an assertion of a
solid crown, exact reference fidelity or owner approval. Existing separate wood
junction surfaces remain an unclosed modeling limitation. The app uses the same
canonical geometry as these previews. No commit or push is performed.

### Individual potted foliage - 2026-10-26

The owner now requests less regimented potted plants. This explicitly supersedes
the prior plant freeze and exact six-leaf layout, preserving the accepted pot,
soil, central stem, broad folded blade shape, materials and scene locations/sizes.
Scope is plant construction, scene identity-to-seed selection, existing preview
copy, numeric/readable plant contracts and direct tests/evidence. No tree changes,
Blender, dependency, filter, animal, new UI control, commit or push.

Step card `construct-asset`: approved plant scaffold plus deterministic vegetation
seed and scale/appearance produce named plant parts. App assets alone own bounded
6..9-leaf growth, staggered heights, uneven azimuths, blade reach/width/rise and
small roll/lateral curvature variations. Petioles must connect actual blade roots
to the retained stem. No invalid input bypass, camera-dependent generation,
renderer-owned geometry or global cache. Boundary: assets/plants.ts and its growth
helper/tests. Spec: small-plants numeric recipe and geometry supplement. Failure
owner: construct-asset. First prove seed-independent copies fail formal tests;
then verify repeatability, diversity, bounded dimensions/counts, finite closed
blades, attachment and unchanged vessel geometry. Stop for a required framework
API or unapproved asset-shape replacement.

Next card `compose-office`: existing scene layout identities select stable seeds
and consume completed plant assets. Boundary: scene/reference-scene.ts and direct
scene tests. Require distinct normalized foliage geometry for actual scene pots,
repeatable reloads and no generation during camera changes. Preserve positions,
scale, materials and other scene assets. `preview-asset` remains a read-only
consumer of the same default plant; only its explanatory copy changes.

Closure: app unit tests, lint/type/build, naming, update guidance and diff review;
actual APP_URL plant front/right/top/quarter and Office lounge/riverside screenshots
from the existing vegetation and foliage Playwright suites, inspected at full
resolution. Do not substitute automated pass status for visual acceptance.

Plant construction checkpoint: new regression failed because all seeds yielded
the same leaf count/layout. The construction owner now passes 14 focused plant
and vegetation-contract cases, retaining the exact pot/soil/stem and closed blade
thickness. Advance to `compose-office` under the card above: stable plant identity
selects a construction seed once; camera, scene placement and other assets remain
unchanged. Verify normalized actual scene foliage differs before/after wiring.

Individual plant closure: 84 app unit cases pass. After lint-driven test cleanup,
17 focused plant/scene cases pass again; lint, typecheck, production build, naming
and update guidance pass. The build retains the existing large-chunk advisory.
The old scene failed the normalized diversity test with one shared layout; all
actual scene planters now have distinct normalized foliage signatures and at
least three leaf counts. Existing runtime/preview tests retain one construction
through camera, resize and appearance operations. No new per-frame work or cache.

Base URL: http://127.0.0.1:5194, from the app-owned APP_URL. Visual scope:
`yarn workspace @asyra/asyra-office test:e2e e2e/vegetation.spec.ts e2e/foliage.spec.ts --grep 'plant|live foliage'`.
Two browser cases pass. The first run's foliage case used a separate five-second
readiness assertion and expired during startup; it now waits for the same ready
state under the unchanged 30-second case/150-second suite guards, as the tree
suite already does. This is a readiness check, not a machine-speed acceptance gate.

Runtime state: plant default seed 606 in the actual Core asset preview; Office
plants use stable layout-ID seeds in the actual scene. Four plant directions
were captured at 842x700 px inside a 1200x1000 browser; Office overview/lounge
(three zoom steps)/riverside were captured at 1440x960. No selection handles or
substitute renderer. Artifacts: `apps/asyra-office/test-results/` directories
`vegetation-plant---same-authored-geometry-in-multiple-views/` and
`foliage-reviews-the-same-l-1b6d4-at-overview-and-close-range/`.

Agent screenshot review inspected quarter/top/right and both Office near views.
The plant retains broad folded blades and the accepted pale vessel; staggered
roots, unequal blades and angled faces remove the paired-copy arrangement.
The riverside scene shows different silhouettes among adjacent pots. Occlusion
still hides some leaves in individual projections; the asset count and attachment
checks are source-space evidence. Main stem and pot remain intentionally uniform,
while foliage varies. This is bounded plant arrangement review, not whole-scene
reference fidelity or user visual approval. No commit or push is performed.

### Full implemented-object reference pass - 2026-10-26

The owner requests sequential correction of every implemented object in the
conversation inventory, using the approved references. This is a single ongoing
visual correction task, not authorization to mark every object accepted after a
code pass. Source priority remains later approved per-part sheet, numeric hidden
construction, and complete-office composition. Preserve references and approved
plant/tree individual variation. Exclude live integrations, rewards, unrelated
framework work, dependencies, filters, commit and push. Complex asset production
must keep the established modeling boundary; do not revive rejected animals.

Fixed discovery: inspect only the inventory's scene factories, linked current
specs/sheets, direct tests and renderer/preview consumers needed to expose them.
Sequence: architecture; furniture; pantry/work equipment; decorations; plants and
street/environment; people. For each, compare source fields to actual geometry,
add failing source-space assertions for omissions, correct its canonical asset
owner, then inspect the real app at matching views and detail scale. Composition
changes follow completed asset corrections. Read-only review may leave an already
correct part unchanged, but cannot label it 90% without sufficient visual evidence.

Step card `construct-asset` / architecture: approved architecture JSON, geometry
supplement and door/wall sheets are inputs; complete named geometry is output.
Implement the specified door panel recess in the door surface itself, not an
attached patch. Reuse the tested wall contract for scene walls in the subsequent
composition step. Allowlist: assets geometry/catalog/architecture helpers and
formal tests; direct spec clarifications only if an actual conflict is isolated.
No renderer-owned geometry, extra fills, reference replacement or hidden bypass.
Failure owner is construct-asset. Gate: front recess dimensions, unchanged flat
rear, cap endpoints/overhang, closed finite meshes and existing asset tests.

Read-only review support may extend `preview-asset` to inspect an existing
catalog object via its exact production factory and retained meshes. It must not
create alternative appearance/geometry to satisfy screenshots. `compose-office`
then consumes those completed assets, preserving the explicit synthetic scene,
manual camera contract and no-rebuild work counts. Those owner segments get their
focused tests before mutation. Final gates are app unit/lint/type/build, naming,
update guidance, scoped diff review and per-object actual-app captures.

The prior inventory is a conservative audit, not a measured similarity score.
Do not fabricate percentages or treat a missing image/numeric authority as a
license to invent a different design. Keep unresolved items explicit until their
source conflict or visual defect is actually resolved.

Architecture asset checkpoint: the actual door front failed the 6 mm inset oracle
before correction. Both recesses now pass centre, sloped edge and flush border
rays, preserving the flat rear and eight-part door assembly. Next `compose-office`
segment consumes the existing tested wall generator through an author-coordinate
adapter. Input remains approved wall dimensions plus scene size/rotation; output
is body/cap with local-X flush ends and local-Y-only overhang. No new wall profile
or scene-only bevel approximation. A failing scene regression covers the rotated
left wall before replacing the duplicate construction. Positions stay fixed.

`preview-asset` segment: extend the existing retained asset controller's source
selection to exact production factories. The catalog-door regression first shows
that an unsupported selection otherwise constructs a tree. Replace that implicit
fallback with an explicit source registry. Inputs are a registered asset ID,
viewport and review view; outputs are actual Core meshes/cameras. Allowed files
are preview/, main route selection and their E2E/unit tests. No scene alternatives,
reference overlays, model-specific camera repair, or per-camera reconstruction.
Gate: catalog geometry triangle equality, existing retained-build/lifecycle tests,
unknown-ID rejection through the registry and five actual camera captures.

Furniture construction findings in the same `construct-asset` segment:

- The tea shell used `(1 - abs(theta)/a)^1.6` instead of the specified
  `1 - (abs(theta)/a)^1.6`, and rounded the full section into an ellipse.
  It now maps the rounded source box, with a separate base and trimmed cushion.
- Tube sections flipped at a bend when the world-axis reference changed.
  Parallel transport now retains section orientation. A permanent bend oracle
  fails the previous generator. Bench slat counts, back inclination, support
  rails and arm paths now consume the current numeric inputs; retained V4 is
  rejected reference evidence, so v1 remains the visual authority.
- Tea-table aprons were omitted. Table and leg fillets now use the tangent
  profile from the coffee-table specification rather than unrounded cones.
- The armchair's approved wider image and old numeric shell conflicted. The
  user selected 713 x 610 x 690 mm. The new documented side-panel construction
  retains that image, independent parts and the existing material defaults.
  A sampled implicit prototype was rejected for excessive topology; a bounded
  rounded extrusion is used instead. Local contour curvature bounds the edge
  radius to prevent inset folds. Width, topology and feet have regression tests.
- Each factory runs only during construction. Preview retains its output across
  cameras. The scene must reuse completed tea-chair output for its two instances;
  live camera and UI updates must never rerun solid sampling.
- Visual inspection remains open. Test success does not certify whole-scene
  fidelity, unioned internal frame topology, or 90% appearance matching.

Street detail segment uses `construct-asset` for the approved manhole profile
and independent rim/cover, then `compose-office` for its real road recess.
The accepted street JSON controls radii, raised regions, six blind slots and
4 mm radial separation. The scene regression rejects the old separate tube
rings. Preview and scene must consume this same factory. No road-face patch may
cover the receiving hole; the street top is rebuilt with the opening instead.

Appliance iteration replan: the source rounded housing and specified serving-bay
subtraction remain authoritative. Flat-side rays/area and float32 winding pass,
but the actual five-view capture still exposes dark gaps near the rounded skin.
Removing shared normals did not resolve them. Replace that shading hypothesis
with an exterior-surface coverage oracle: sample the untouched rounded source
faces and verify the subtraction preserves them. Scope stays catalog/solid
construction and their formal tests; renderer changes, patch skins and alternate
review geometry are excluded. Repair only the first failed construction step,
then repeat the coffee-machine actual-app capture before broader appliance work.
Self-review: the frozen construct-asset boundary, existing source subtraction,
preview consumer and these focused gates agree; no new product scope is added.

The appliance root cause was upstream of Boolean subtraction: floating-point
endpoint calculation sometimes exceeded the rounded box's half extent, and the
sample filter removed an entire boundary row. Exact endpoint assignment now
passes the permanent pre-subtraction closed-edge test. A second oracle exposed
1,493 unmatched cut edges: adjacent BSP polygons carried T junctions. Construction
now aligns boundary subdivisions before a centroid fan, retaining the original
rounded surfaces. All cutters run before this one triangulation pass; repeatedly
triangulating between six slots was rejected for multiplicative topology growth.
The final coffee-machine close capture has no previous open strips or speckled
skin. Exterior coverage, outward orientation, float32 stability and closed-edge
checks pass together. No renderer fallback or covering geometry was introduced.

Additional implemented-reference corrections in this same bounded pass:

- Tea cushion/base use radial sections of the specified field instead of the
  rejected dense implicit sampler. The master stays within 20,000 triangles.
- Work-chair rear supports and cushion share the documented normalization.
- Four-pane windows use separate exact mitred frame members and recessed panes;
  planar edges retain separate normal domains. Shop windows consume that source.
- Awning sections preserve the adjustable slope, vertical valance and fractional
  last strip. One 5.3-strip width produces five full strips and a 0.3 strip.
- Pillows use the documented inflated outline patches, with a 6,240-triangle
  master and 960-triangle distant tier. Placement and material batching retain
  distant geometry and scale its error by the maximum instance axis.
- Pantry factories now retain rounded cuts, six blind capsule slots per tray,
  the sink's 4 mm recessed door fields, and the bottle's smooth profile/two rings.
- Female default face regions no longer inherit male spectacles. Garment loft
  interpolation, collars, cuffs, buttons, spectacles temples and sampled hair
  widths now consume their numeric fields. This is not rig/animation acceptance.
- Clock, manhole, bench, chalkboard and receiving road geometry use the detailed
  component recipes described above. Named appearance regions remain replaceable.
- Scene book rows sit on their real shelf datums inside the bookcase. Pillows
  replace the former rectangular cushion block. Plant placement keeps approved
  deterministic variation while its whole-unit scale matches the composition.
- The overview uses a longer lens/distance to reduce the exaggerated foreground
  scale difference. This is scene camera composition, not image postprocessing.

Review limits remain explicit. These changes do not close the complete object
inventory or prove 90% visual fidelity. The armchair back/arm transition and
upholstery surface still differ from the approved sheet. Puppet hair, face and
clothing remain visibly different from the intended finished characters; the
Blender/rig production boundary remains open. Secondary construction details
also still need review: laptop material domains, mug handle
union, unioned bench/apron interiors, exposed window cut-edge bevels, chalkboard
hinge covers and per-family distant meshes. Do not mark the scene or any missing
construction feature accepted merely because its screenshot test completed.

Validation checkpoint: 119 app unit tests passed after the rounded-box and
conforming-cut repairs. Actual-app five-view capture batches cover architecture,
furniture, pantry, street details, people, window, awning and pillow. These are
review evidence, not automated appearance acceptance. The final source must also
pass app lint/build, naming and documentation guidance. No commit or push.

Desk-item follow-up retains the approved source dimensions: the laptop now has
77 caps across six rows (including its spacebar), hinge and four support pads.
The mug follows its arc/line lathe profile with a 128-segment master and a
32-segment distant tier. Its default is empty; coffee is a separately requested
scene part. Existing pantry shelf mugs remain empty. These changes do not imply
that the remaining material-domain or handle-union requirements are closed.

Final local checkpoint for this source: 121 unit tests pass; app lint, typecheck
and build pass; naming and declared update guidance pass. The 27-asset five-view
batch plus neutral appliance capture passed 28 E2E cases, followed by seven
latest desk-item/camera/scene cases. The earlier held-camera case timed out:
its trace attributed about 8 and 9 seconds to locator screenshots while motion
continued. Capturing the same already-visible canvas rectangle directly through
page screenshots retains both image-difference assertions and the 30-second
whole-case guard. The focused rerun and complete seven-case rerun pass without
extending timeouts or stopping the held motion. This is capture overhead evidence,
not a hardware-independent runtime FPS claim. Vite retains its existing large
chunk warning. All reference fidelity limitations above remain open.

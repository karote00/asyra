# Office rebuild - Technical proposal

Status: the procedural reference-scene preview is implemented. On 2026-10-29 the
owner requested consolidation of the current building shell, discussion room,
work room and pantry for PR #361. See the [partial merge checkpoint](plans/office-rebuild-plan.md#merge-checkpoint---2026-10-29).
The complete Office product remains open; this is not formal plan closeout.
Provider data remains synthetic, complex deferred assets remain absent and
navigation performance is not universally certified.

Read the later named correction sections below as the current recipe for their
scope. Earlier stage descriptions record superseded construction work, not
alternative current layouts. In particular, the approved pantry layout and
four-room expansion supersede the earlier west-wall/contact and small-basin
arrangements. New tabletop recipes supersede generic mug/pitcher interpretations.


## Persistent visual acceptance

Follow the product plan's source authority and `apps/asyra-office/AGENTS.md` for
every room and asset. References govern visible results; later owner corrections
override specific details. Numeric documents must be updated when their output
conflicts with the approved reference. Neither regular code construction nor a
performance budget permits simplifying or replacing visible details. A clean
build and passing geometry tests cannot close a visual mismatch. Inspect the
source angle and enlarged item crops and explicitly retain unresolved differences.

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
registers movement keys through Core's `registerInputKeyCombinations` with
`keyboardMode: 'held'`. InputSystem owns native listeners and normalized held
snapshots, including capture-phase releases and cancellation. Scene lifetime
owns registration and unregisters before controller/Core disposal. The app owns
editable-target, IME and modifier admission plus velocity integration; it installs
no native keyboard listeners and cancels its active animation frame on disposal.
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

### Tables and chairs admission

The accepted structural checkpoint remains unchanged. The default scene admits
three objects: the writing desk, round tea table and round coffee
table. The two wraparound tea chairs and lounge armchair have been visually
rejected and are absent pending reviewed Blender assets. The standalone green
work-chair asset is also absent: its approved sheet is a different design from
the dark chair visible behind the work-room actor. Catalog approval does not
prove reference-scene identity. Do not recolour or substitute it; its mostly
occluded replacement requires separate source-specific review. Existing exploratory
upholstery files are not approved scene assets. Other indoor furniture, actors
and decorations remain deferred. Explicit `structure` composition has no indoor
furniture.

`reference/office-seating.json` owns the admitted poses. The placement generator
consumes `reference/seating-measurements.json` and the current accepted room
bounds. Work, discussion and lounge table anchors retain respectively 52.17%,
69.05% and 47.40% of source clear depth measured from the front boundary. All headings and XY
positions remain those accepted for the deeper rooms; all origins are Z=0.38.

Per-asset review sheets and numeric specifications own component proportions.
The former independent-axis source-image fit stretched the desk depth from
0.60 to 1.11 scene units and compressed furniture heights. It is superseded.
Keep each admitted object's recorded X scale as its source-width anchor and
apply that factor uniformly to XYZ: desk 1.0294345669971572, tea
table 1.385086825168228, coffee table 1.1648233314304999. This preserves the
2:1 desk top, specified tabletop thickness/height ratios and leg cross-sections.
It does not disable the general app's configurable XYZ extents contract.

The source image's historical pixel observations and old local frames remain
in the measurement file, explicitly marked as rejected independent-axis-fit
acceptance criteria. Do not refit them by distorting reviewed component shapes.
`deferredInstances` records removed chairs' source placement evidence;
it is never consumed by scene composition or the pose generator.

Regenerate admitted poses from the repository root:

```sh
python3 apps/asyra-office/scripts/fit-room-seating.py --apply
```

The standard-library generator is deterministic and performs no runtime fitting.
Composition builds each requested asset once per construction call; camera
updates reuse the completed scene. No rejected upholstery factory is invoked
by this stage. Source-width tests inspect the actual composed meshes; independent
shape tests check XYZ component ratios against approved drawing dimensions.
Room fractions, wall clearance, grounding and unchanged
structure/exterior checks remain required. Actual-app enlarged table/leg views
are separate visual evidence, not proof of full-scene fidelity. Lighting banding
and material appearance remain deferred.

### Lower-room depth revision

The owner reopened work/lounge room proportions after the seating review.
`reference/lower-room-measurements.json` records the original east floor run,
partially occluded contact picks and uncertainty. Projecting the divider contact
along the front-to-rear run estimates a 46.88% lower-room share. Applying it to
the fixed shell interior depth shifts both lower-room rear boundaries inward by
0.877807 scene units, preserving their stagger. Clear work depth changes from
1.642963 to 2.520770; clear lounge depth from 1.443536 to 2.321343. These are
normalized scene dimensions and a reference-guided interpretation, not surveyed
metres or a claim of exact recovery of obscured floor corners.

The shell, front facade, entrance, foundation outline, common floor, exterior,
wall heights/thickness, camera and lighting remain unchanged. Lounge left low/high
wall runs grow at their retained length ratio; terminal abutment thickness stays
constant. All three rear steps and the short rear return translate together.
The flush pantry floor band follows that boundary and wood coverage is regenerated.
The shared boundaries reduce the rear rooms' foreground space; wall and seating
clearance checks cover those rooms too. The initial depth-revision checkpoint translated the work desk/chair with their
rear wall and retained lounge seating positions. The subsequent owner-requested
pose correction above replaces those provisional placements with room-relative
anchors. The later shape correction above replaces nonuniform scales without
changing those anchors. No new furnishings are added by the depth revision.

The old approved structural snapshot is retained as historical acceptance evidence.
Formal geometry checks apply the source-derived authorized depth change to only
the affected coordinates, while preserving every other accepted coordinate.
The current JSON explicitly marks this new depth revision as awaiting visual review.
The offline work seating frame follows the same translation, so rerunning its
solver cannot silently restore the rejected shallow-room placement.

### Procedural room furnishings

The default scene stage is `room-furnishings`. It adds regular indoor assets in
work, discussion, pantry, lounge order. `structure` and `tables-and-chairs` remain
explicit inspection stages. The approved shell, floor, room-depth solution,
entrance, exterior and three table transforms are unchanged.

The original 1280 x 800 `approved-office-reference.jpg` governs the selection and
relative arrangement. Room source regions are work X=285..626/Y=185..440,
discussion X=438..763/Y=70..296, pantry X=695..1004/Y=140..406, and lounge
X=588..1007/Y=330..580. These are inspection regions, not image backdrops or
unique metric reconstructions. Scene placements fit the accepted room boundaries;
asset dimensions remain governed by their numeric specifications.

| Room       | Regular additions                                                                                                                                | Source and support constraints                                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Work       | Open laptop, mouse, cup, oval rug, orange low stool, three wall shelves, books, framed print, small side table and plants                        | Laptop lid/desk-edge ratio 41/89; uniform laptop scale. Actual desk top supports all desktop items. Shelves attach to the west interior face; their 35 mm thickness scales uniformly by 1.22. Rug is 1.55 x 1.08 x 0.012 m. Stool uses the approved 0.36 x 0.36 x 0.30 m asset at uniform 1.15 scale. |
| Discussion | Left wood wall boards, framed print, clock, small rear calendar, rear console, low side bookcase, cups, book and plants                              | Clock wall stays cream. Clock scale 1.35. Console top is 0.8375 m above the common floor. Table decorations consume the already constructed table's top plane.                                                                                                                                        |
| Pantry     | Left-only alternating wallpaper, right print, fridge, dispenser, coffee counter, sink cabinet, coffee machine, shelf, canisters, mugs and plants | Wallpaper ends at X=1.90; the right print is on plain wall. Fridge/dispenser rotate 90 degrees to face +X. Their scales are 1.35 and 0.95. Counter height is 0.80 m above floor. Sink accessories rest on the solid right strip outside the basin, not in its opening.                                |
| Lounge     | Oval rug, narrow two-tier side table, framed side print, six clipped photographs, wall lettering, lamp, table book/cup and plants                | Rug is 2.05 x 1.70 x 0.012 m. Side print remains below the low return's 1.131485 m top; the lamp head stays below the adjacent 1.57716 m wall top. Coffee-table and floor supports derive from the accepted table and shared floor.                                                                   |

All room floor origins remain Z=0.38 m. Composition computes each admitted table
once and passes its actual top plane to the furnishing composers; it does not
rebuild a table to place a cup. The lifetime is one scene composition, not camera
updates. Permanent tests verify invocation counts across two independent scenes,
mesh contacts, source-relative proportions, appliance orientation, wall clearance,
unchanged baseline meshes, and rejected-asset absence.

The fridge's tall upper/short lower door split corrects the contradictory pantry
numeric specification: lower Z=0.060..0.488, upper Z=0.500..1.140 m; 12 mm gap.
Body bounds, feet and overall dimensions remain unchanged. The room uses a
replaceable grey cabinet/door appearance; catalog defaults remain available.
The low stool has separate cushion/leg material regions, explicit underside leg
openings, closed exterior topology and a bounded distant representation. The
existing catalog wall-sconce geometry is shared by legacy and current composers.

Small lounge photo surfaces use only printed-art quadrilaterals from the original
reference, through the existing artwork rectification path. They do not replace
walls, furniture, or the scene with an image. Their detail is limited by the
original low-resolution printed images.

Rejected work/discussion chairs, lounge sofa/armchair, indoor people and animals
remain absent pending Blender modeling and review. Do not add primitive stand-ins.
These omissions also mean this stage is not a claim of complete reference parity.
Lighting banding, filters, exterior refinement and live agent integration are
outside this furnishing slice. Visual acceptance requires inspection of the
actual app's overview, room views and enlarged details in addition to tests.

### Pantry source correction - historical pre-layout revision

The pantry furnishing owner compares the original crop left to right. It uses the
revised dispenser height split, refrigerator-top shrub/jar, six individually sized
and colored shelf vessels, preparation plant/rear insulated tumbler/handled pitcher/preparation basin, wood sink top,
dark left door, a single-brush cup and white floor-band jar. The unsupported
soap pump is absent from the scene. The unsupported box
coffee machine is absent. Numeric composition defaults and source uncertainty
are recorded in `assets/asyra-office/models/pantry/GEOMETRY-SUPPLEMENT.md`.

`pantry-smallware` exposes independent body/lid color without modifying geometry.
`pantry-accessories` retains reusable utensil and pump constructors.
`preparation-sink` owns the recessed bowl and matching countertop/body aperture. The small-plants `shrub` recipe reuses the closed blade generator
with a compact crown and bounded triangle count; existing default plant forms
stay unchanged. All work occurs during scene construction, never camera frames.
The accepted structure, other rooms and exterior are outside this correction.

### Translucent catalog assets

Catalog material alpha is preserved as optional AssetPart opacity; omitted alpha
means the existing opaque contract. Composition passes it to the public spatial
mesh descriptor for both ordinary and instanced meshes. Opaque material batching
is preserved; each translucent object has its own sortable draw item. Translucent
parts do not cast opaque shadows. The existing preset renderer owns transparency
and depth-write behavior. The inverted dispenser jug is the first catalog user,
with four reinforcing ribs, a separate opaque cap and no sticker. This is alpha
translucency; physical transmission/refraction is not claimed.

### Pantry source vessels

`assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json`
keeps the approved plain canister separate from the pantry's named
`sourceVariants`. `src/assets/pantry-vessels.ts` constructs their glass shell, contents, cap and collar
regions once and exposes named colour overrides. Shelf regions retain full detail;
only other verified recipes expose distant meshes.
`src/scene/pantry-furnishings.ts` places those same production parts on existing
support planes; it does not approximate every vessel by scaling one cylinder.
The asset preview uses the same factory and owns no alternate geometry.

Pantry detail interpretation (updated 2026-10-28): four clear containers follow
the original two plants. The first holds ivory contents with yellow paper; the
second holds ochre contents with green paper. The third has a gently inset
shoulder, wide mouth and inserted tapered cork, following the newer owner photo
`reference-cork-jar.png`; the glass lip surrounds the inserted portion. The fourth
has a long narrow chili-style bottle neck. Its complete height is 150.5 mm,
70% of the third jar, with all regions uniformly scaled and its shelf anchor
retained. The fifth
object is a blue/brown succulent pot with a dark flower bud, not a container.
This latest owner interpretation supersedes previous opaque-jar, no-label,
green-herb-content and fifth-peppercorn-jar assumptions. Exact ingredients remain
unconfirmed. Original left-side flowering and leafy plants are unchanged.
Porcelain body decoration uses the same replaceable production surface in the
office and asset preview, with height-based UVs; neutral preview removes the
surface. Pantry lanceolate foliage is a separate form from lounge rosettes;
shrubs use nine unequal sprigs bearing small, individually pitched leaves.
The rejected ellipsoid-covering foliage and opaque-crown acceptance oracle
have been replaced by branch connectivity and individual-blade constraints. The sink
and its two clearance cuts, drain and faucet move 60 mm left together. Local
placement remains supported and within the approved pantry. Shadow acne is
corrected by the Preset shadow provider, not scene geometry or a filter.

### Pantry contact with the west wall - superseded by approved layout

The shelf and preparation worktop start at the accepted west-wall inside face
(X=0.1776932207). The shelf ends at X=2.0 and redistributes its supported
contents across that span. The preparation worktop ends at X=1.77, retaining
a 7.5 mm joint with the independent sink cabinet. Both worktops have depth 0.625 m and aligned front/back edges. The whole
refrigerator moves forward 0.0739004823 m (including attachments and supported
objects) to retain 20 mm rear clearance. Cabinet fronts follow the full depth;
do not shorten the preparation counter to avoid the refrigerator. Formal room tests check wall contact,
appliance clearance, corner-plant spacing, supported contents and the sink join.
No shell, other room or exterior change is required.

### Night-light emission

The refrigerator light core uses replaceable emission color #FFB35C at intensity
1.75 through AssetPart and the public Spatial descriptor. The glass remains alpha
0.22. Material batch identity includes emission color and intensity, so equal
albedo never spreads emission to unlit parts. The official provider owns shader
material creation and updates. Office opts into public `spatial.bloom` with
strength 0.315 and radius 8 CSS pixels. Preset renders and blurs an emission-only
mask, respects opaque occlusion and transparent attenuation, and composites it
before overlays. This provides a soft warm halo without changing surrounding
illumination, geometry or App SDK ownership. Preset owns target resizing, cached
mask lifetime, failure restoration and disposal; no additional animation loop
is introduced.


### Framed night-light addition

Retain `pantryNightLight()` and its original recipe/reference. Add
`frameNightLight()` from `sourceVariants.frameNightLight`; its two owner photos
and complete component dimensions are in `pantry-smallware/FRAME-NIGHT-LIGHT.md`.
The frame uses two perpendicular rounded arch straps, four radial uprights,
a transparent cylinder, grooved bronze base and a low bottom emitter. Only the
fridge assembly changes asset selection, at the unchanged support anchor. Both
assets are available through the existing `?review=` route. The new source keeps
emission intensity 1.75 and the existing Office bloom settings.

The bronze base and straps use metalness 0.85 and roughness 0.18; the reflector
uses roughness 0.16. These regions opt into Preset studio reflections with
`environmentIntensity: 1`. AssetPart forwards explicit metalness and reflection
intensity through ordinary and instanced descriptors, with both fields in the
opaque batching identity. Existing parts retain their previous metalness defaults
and zero reflection intensity. Preset owns one lazy reflection map per engine;
the app does not access Three.js or create a separate render loop. Geometry,
light-core intensity and global scene lighting are unchanged by the finish fix.


### Shelf condiment identification

`sourceVariants.vessels` owns four clear containers with independent glass,
contents, labels and closures. `pantryVessel` uses the existing lathe/label helpers
and public material descriptors. `sourceVariants.shelfSucculent` is constructed
by `pantryShelfSucculent()` from the existing shelf-plant primitives and appears
at the fifth anchor. Its `shelf-succulent` preview uses the same production parts.
The previous fifth jar recipe is removed, without a compatibility alias for an
unpersisted synthetic preview. Current dimensions, default colors and the source
crop are documented in `pantry-smallware/GEOMETRY-SUPPLEMENT.md`. Shelf positions,
original two plants and unrelated room geometry remain unchanged.


### Countertop group and approved pantry layout - 2026-10-28

`pantry-counterware.ts` consumes `sourceVariants.countertopReview` for hollow
pitcher geometry, fitted-lid tumbler, brush and distinct plant crowns. The
approved numeric scene layout lives in `scene/reference/pantry-layout.json`;
production does not import review diagrams or evidence. Compose-office reuses
existing catalogAsset, meshBounds, block and placement helpers. Each retained
asset is built once at scene creation and measured once for envelope alignment.
No render/cache/framework changes are required.

Refrigerator retains 1.35 scale, rotates to face the aisle, and moves into the
rear-left space. Top plant/light and front papers/magnet follow its new position
and orientation. The dispenser retains 0.95 scale and west-wall orientation at
the outer wall end; its complete footprint is outside the reserved 90-degree
fridge-door sector. This is geometric planning clearance, not an opening UI.

Preparation width is 0.83781 m with one left-hinged door, right-side handle and
uncut 0.625 m deep worktop. The preparation-sink instance is absent; its geometry,
specification, aperture utility and formal asset tests remain reusable. Full-size
main sink stays at 1.25 scale, translates +0.0375 m in X, and ends at X=2.94.
Its accessories translate with it. The separate floor jar remains unchanged.

Retain the countertop plant, pitcher and tumbler at approved staggered anchors;
the older 10/20 cm straight-row requirement is superseded. The green bottle moves
to the clear front-left strip to avoid the pitcher. The shortened 1.05 m shelf
retains the flower pot, small plant, ochre jar, cork jar and succulent at original
sizes. Store the large white jar and tiny bottle without deleting their assets.
The shelf extends above the main sink's left region as shown in the approved plan.

Hardware pantry review uses the existing production scene and camera controls,
with enlarged shelf, appliances and countertop crops. Formal layout checks cover
full-size sink geometry, support, separation, stored asset availability and the
fridge/dispenser sector. Image inspection remains separate from automated passes.

### Four-room depth expansion - 2026-10-28

The owner's explicit metric expansion supersedes the earlier image-derived depth
allocation, but not retained asset appearance. The front remains Y=-2.42 and
the rear wall moves from Y=2.702099517721014 to 3.702099517721014. Intermediate
cream/green and lounge walls move +0.50 Y, retaining their stepped heights and
X extents. West wall runs, pantry divider, lounge high return, foundation and
white floor band extend continuously; every room remains at Z=0.38.

Using inner-wall rectangular zones, with open boundaries projected along the
existing room edges and without deducting furniture:

| Zone | Width (m) | Clear depth (m) | Rectangular area (m2) |
| --- | ---: | ---: | ---: |
| Work | 3.00480 | 3.02077 | 9.07680 |
| Discussion | 2.95769 | 2.77133 | 8.19674 |
| Lounge | 2.73520 | 2.82134 | 7.71695 |
| Pantry | 2.76231 | 2.99076 | 8.26139 |

These are comparable scene zoning estimates, not surveyed enclosed-room areas.
The pantry return occupies approximately 0.07889 m2 within its rectangle.

The existing fit-room-seating.py maps table anchors by their retained source
depth fractions into the expanded rooms; scales, yaw and X positions stay fixed.
Tabletop attachments follow their table. Lower-room rugs move +0.25 Y; items
attached to the shifted rear partitions move +0.50 Y. Rear-wall attachments
and the complete approved pantry layout move +1.00 Y. The dispenser now fits
fully along the pantry divider, while retaining its fridge opening clearance.
All asset recipes, stored small sink/jars, light intensity and materials remain.

The rear neighborhood separately moves +2.00 Y: rear road, five shop groups
including signs/windows/awnings, three rear-row trees and two rear corner lamps.
The sidewalk base and rear paving continue to the relocated road. The front
street, side street, entrance, riverside and other side trees remain fixed.
Rear road near edge is Y=5.30, leaving 1.51790 m from the new slab rear edge.
This is the owner's temporary rear-neighborhood arrangement for later revision.

The pre-expansion numeric fixture is test-only. Production reads only current
scene reference specifications; no review artifact or historical geometry is
loaded as a fallback. Formal room-depth/support/clearance tests and hardware
whole-building/pantry review cover this revision. No opening animation is added.

### Discussion-room reference furnishings - 2026-10-28

The upper-left discussion room retains its expanded shell, common floor,
round-table geometry/placement and deferred upholstery. This pass corrects
regular furnishings using the approved 1280 x 800 image region
[438,66]..[770,330]. Measurements below are construction dimensions mapped into
the expanded room; the low-resolution image does not uniquely determine hidden
backs or physical scale. Existing asset recipes remain authoritative for mugs,
pointed leaves, pots and the round table. Other rooms do not consume these local
storage/foliage compositions.

| Item | Current construction and source relationship |
| --- | --- |
| Left print | 1.15 m along wall x 1.50 m high; center Y=2.46, Z=2.04; thin existing frame on the west interior face. Owner requires crisp artwork rather than enlarged reference blur. `src/scene/reference/discussion-poster.svg` reauthors the four lines Better / Agents / Happier / People and small ochre smile on cream paper. SVG source is 768 x 1008; its full extent is sampled to an explicit 512 x 512 albedo/neutral-normal surface, with the physical frame restoring the portrait aspect. No scene, shadows or furniture pixels are projected. |
| Left conifer | Floor-supported at west interior X+0.36 and Y=1.48, nominal height 2.26 m, crown-radius budget 0.33 m, seed 37. The owner's clear conifer photo supersedes the previous broad-leaf interpretation. Dense connected fine foliage, irregular three-dimensional branches, a pointed apex and charcoal tapered pot. The owner's branch-first instruction supersedes shrinking the whole tree. Branch reach is determined independently of height, then fine foliage is attached to the branches. The floor pot remains 0.28 m wide and 0.24 m high. Inspect the foreground-occluded base from the elevated room view. |
| Rear calendar | 0.38 x 0.48 m, center X=-1.04/Z=2.26; frame left edge X=-1.23 is derived from the console left edge, not independently positioned. Frame dimensions and wall mounting retained. Clear authored `src/scene/reference/discussion-note.svg` (512 x 660) replaces the photographic crop and uses a 512 x 512 surface. Owner correction identifies this object as a calendar, not a text poster. Static October 2026 artwork has a Monday-first seven-column grid, 31 dates, and October 1 on Thursday. Month/year are reconstruction choices because the reference cannot resolve them; this is not a live date widget. |
| Rear console | 1.08 x 0.29 m, 35 mm top thickness; center X=-0.69, 160 mm from rear wall. Top center is actual table top +0.23 m. Four 33 mm legs terminate at the underside and floor. |
| Console contents | Owner-corrected order: small brown-potted pointed plant at X=-1.02, white perfume bottle at X=-0.65, and larger tapered plant at X=-0.43. All bases consume the actual console top. Plants sit 160 mm from the rear wall; perfume sits 180 mm from it. Their horizontal envelopes do not overlap. The larger plant uses the same full-depth conifer recipe at nominal height 0.8588 m, crown-radius budget 0.125 m and seed 71. Its crown retains a clear rear-wall gap and stays inside the console footprint. |
| Table contents | Dark-brown pointed-leaf pot at table +[0.12,0.22]; cream handleless wide-mouth cup at +[0.27,0.01]; tapered transparent Americano tumbler at +[0.02,-0.06], before the notebook; short white sugar jar at +[-0.015,-0.18], beside the glass. Cream notebook remains at +[-0.16,0.06]. All consume the existing table top. |
| Left side table | Owner-approved interpretation of the enlarged source: open wooden side table, empty gray vessel on top and one upright ivory rectangular basket below. Table footprint 0.56 x 0.34 m, tabletop height 0.55 m, top thickness 25 mm. Four 30 mm square legs centered at local X=+/-0.24 and Y=+/-0.13 reach from floor to the top underside. No side/back boards or lower shelf. Rotated 90 degrees along west wall at Y=2.16, west interior X+0.19, beside the tree below the print. |
| Side-table contents | One open fabric basket, 0.30 x 0.23 x 0.39 m, centered below the table on the floor. Wall/base thickness 12 mm; open top with 135 mm clearance to the tabletop underside. One empty gray ceramic vessel, maximum diameter 216 mm and height 150 mm, placed at local [0,-0.015,0.55]. The vessel has a 10 mm rim, recessed interior and 22 mm solid bottom; no handle, soil or plant. |
| Right low cabinet | Same outer dimensions, separate inset front field and four frame rails. Front faces the aisle; right edge stays 10 mm inside the pantry divider face. Center Y=1.98; small pot on its top and separate floor plant to its front-left. |

Storage default wood is #B49164 and inset field #B59774. The left side table
has #705739 legs, one #D4C6B0 fabric basket and a #89868B empty ceramic vessel.
The source cannot establish the hidden item identities; this interpretation
was explicitly accepted by the owner. Dimensions above are construction values
within the retained table footprint, not recovered photographic measurements.
Conifer defaults are #536B36/#718344/#8B9B50 for three foliage regions,
#4D5935 for stems, #393638 for the charcoal pot and #3F3428 for soil.
Table pot default remains #42372D. These are separable material regions;
color/material overrides remain presentation inputs. Existing whole-instance
XYZ placement remains supported; the crown is generated from independent height, branch reach and pot dimensions before scene placement.

The clear owner reference is retained at
`assets/asyra-office/models/small-plants/review/discussion-conifer-owner-reference.png`.
It defines the new plant type and visible silhouette. Hidden branch topology
and absolute size are reconstruction choices, not measured botanical facts.
The owner clarified that available space should control branch lengths before
foliage grows. That supersedes the temporary uniform-shrink assumption. The
floor/console heights are restored to 2.26/0.8588 m; anchors and surrounding
furniture remain fixed. The tree can be tall and narrow without stretching
individual leaves or reducing the whole object.

Current generator inputs (metres, before placement):

| Profile | Nominal total height | Crown-radius budget | Pot diameter | Pot height | Seed |
| --- | --- | --- | --- | --- | --- |
| Reference construction | 1.20 | 0.44 | 0.26 | 0.22 | Supplied by caller |
| Floor tree | 2.26 | 0.33 | 0.28 | 0.24 | 37 |
| Console tree | 0.8588 | 0.125 | 0.1064 | 0.0912 | 71 |

The height and radius are construction inputs, not a claim that every generated
leaf tip lies exactly on that envelope. Clearance checks use expanded final
geometry, including rotated needle instances. The narrow room profiles adapt
the reference's branch/foliage type to the available footprint; they do not
preserve the photograph's original crown-width-to-height ratio. Do not infer
photo-identical proportions or owner appearance approval from passing geometry
tests.

The reference recipe has nominal height 1.20 m and crown-radius budget 0.44 m. The open tapered pot has maximum
diameter 0.26 m, height 0.22 m and base diameter 0.17 m; its lathed profile
includes an inner wall and solid bottom. Soil lies at Z=0.20 m. For a requested height H, pot height Hp and crown radius R, let F=R/0.44
and Vh=(H-Hp)/0.98. Branch count N=ceil(96*max(1,Vh/F)) and core count
C=ceil(36*max(1,Vh/F)) maintain foliage spacing as the trunk becomes taller.
The trunk runs from 0.55Hp to H-0.04F and ends inside the leader foliage.
For branch index b=0..N-1, t=b/(N-1) and V(i)=(sin(i*91.73+seed*17.17)+1)/2:

- Canonical base z=0.245+0.765t+(V(b+309)-0.5)*0.045.
- Azimuth=b*2.39996+V(b)*1.1 radians.
- Radial reach=(0.315*(1-t)^0.76+0.012)*(0.83+0.17*V(b+71))*F m.
- Tip rise=-0.035+0.11t+0.085*V(b+109) m. Branch centerline
  P(u)=[cos(azimuth)*reach*u, sin(azimuth)*reach*u, Hp+(z+rise*u*u-0.22)*Vh].
  Tube stations include every spray attachment u, so foliage consumes the actual
  branch centerline rather than a separately approximated curve.
- Five paired spray ranks attach at u=0.17+0.18r, r=0..4, plus one tip
  spray per branch. Side sprays face 0.75 radial + 0.65 signed tangent
  horizontally and -0.15+0.65t+0.7V(b*17+r+side) vertically. Their scale is
  (1.16-0.64t)*(0.8+0.2V(b*13+2r+side))*F. Tip sprays have upward component
  -0.05+0.8t and uniform scale (0.9-0.5t)*F.
- C upright core sprays cover Z=Hp+0.05F..H-0.075F, at a 0.012F radial offset.
  Each spray additionally
  rolls around its own axis by (V(sprayIndex+907)-0.5)*2.1 radians, avoiding
  identical flat fans and repeated empty branch tiers.

Each shared spray contains one 120 mm central twig, six paired lateral twig
nodes, and 85 closed tapered needles. Each needle is 18 mm long, 7.2 mm wide
and 4.4 mm thick before local rank scaling. Its six-vertex closed geometry
has eight triangles. The 12 lateral twigs carry six rank needles and one
terminal needle each; the central twig has one terminal needle. Sprays are
geometric parts, not alpha cards, opaque crown fillers or baked foliage images.

The reference recipe has 1,092 spray instances (96*11+36), 92,820 needles and
742,560 leaf triangles. The taller narrow floor tree has 264 branches and 99
core sprays (3,003 instances, 2,042,040 leaf triangles); the console tree has
265 branches and 100 core sprays (3,015 instances, 2,050,200 leaf triangles).
These are near-detail construction counts, not a scene performance budget. The same leaf mesh is shared by all three tint groups;
twig geometry is likewise instanced. Main branches/trunk and pot remain regular
meshes. This uses the existing public Asyra instance contract and prevents
color batching from expanding the foliage into an invalid oversized geometry
array. Instancing reduces stored geometry and submission work, not the number
of rendered triangles; no performance or distant-LoD claim follows from it.
Construction runs once per scene lifetime, never per camera frame. The existing
single-asset review route `?review=discussion-conifer` calls the same factory
at the floor-tree size and seed, with no separate demonstration geometry.

Height changes trunk/branch attachment elevations. Crown radius changes branch
reach and the isotropic size of attached sprays, with space reserved for their
full leaf extent. It does not squash a completed mesh. Branch and core counts
increase with vertical span relative to spray size to prevent sparse ladders.
Needle prototype coordinates remain identical across profiles. Each instance
has one scalar scale and an orthonormal basis. Pot geometry is sized separately:
floor diameter/height 280/240 mm, console diameter/height 106.4/91.2 mm.
The outer placement is applied once at the unchanged anchors. Other plants,
walls, lighting, furniture and exterior geometry are unchanged.

Source-space regression coverage includes support contacts, crown depth,
wall/neighbor clearance, fine leaf edges, apex coverage, stable instance counts,
and final scene admission through the public spatial contract. A 64 x 64 front
projection requires at least 85% foliage coverage inside the inner tapered
silhouette, with coordinates normalized to each profile's branch height/radius.
It covers reference, floor and console profiles. The original sparse reference
was 61.6%; restoring room heights without adapting branch spacing yielded 65.2%
for both room profiles and was also rejected. This predicate detects excessive gaps but does not replace reference
comparison of the actual front, right, three-quarter and close-up app renders.

Formal regression cases verify source-relative print/crown height, tabletop
support/plant identity, console height, floor-supported storage and rear foliage
wall clearance. Hardware source-angle, overhead and enlarged storage captures
cover occluded contacts. Rejected chairs and people remain absent; this is not a
claim that the complete furnished room matches the reference yet.
Additional source-space cases reject a planar middle crown, an overly narrow
upper crown, an apex wider than the body, and a cabinet on the wrong side of
the tree. Their numeric bounds describe the documented construction envelope;
reference appearance still requires visual inspection.

The large print defaults to paper #F2EADC, lettering #493E34 and smile #B58A4F.
Its editable SVG uses a handwritten font stack (Chalkboard SE, Comic Sans MS,
cursive); the exact glyph family depends on fonts available on the host, without
installing or bundling a third-party font. Artwork preparation decodes this
source once per scene. The generic artwork `resolution` input uses the existing
validated 2..512 range; omitted values retain the previous 64-pixel crop behavior.
The rear calendar uses the same cream paper and dark ink, with Arial/Helvetica
sans-serif dates, fine grid lines and muted terracotta Sundays. Its full SVG
extent is sampled through the same preparation path. Existing discussion-note
asset identity, frame size, placement and console-left alignment are preserved. Other room
artwork remains unchanged.

Rear-console perfume construction: 100 x 75 x 230 mm overall, rounded ivory
body 165 mm high with 12 mm corner radius, narrowing circular shoulder to a
28 mm neck. A 33 x 28 x 42 mm champagne-metal cap spans Z=188..230 mm,
overlapping the neck to form a seated closure. A small 62 x 52 mm warm-ivory
front label carries no invented branding. Defaults: body #ECE5D8, label
#DCD1C0, cap #B79A61 (metalness 0.75, roughness 0.28). Parts retain independent
material/color replacement and whole-instance XYZ sizing. These hidden-shape
and physical-size details are explicit construction choices from the enlarged
reference and owner's perfume identification, not recovered measurements.

### Discussion tableware correction - 2026-10-28

Owner interpretation of the enlarged table reference supersedes the pitcher
and handled mug: tapered clear Americano tumbler before the notebook, a short white
sugar jar beside it, and a wide-mouth handleless cup next to the rear-right
plant. The table and plant remain unchanged. The notebook sits above-left of
the coffee in the initial camera, at table
+[-0.16,0.06], retaining its 150 x 220 mm X/Y footprint. The glass remains
at +[0.02,-0.06]. Screen directions override the superseded world-Y gap rule.
From the initial camera, the coffee base is above and to the right of the sugar
jar base. Use actual initial-camera projection to verify this relation, not
world-axis labels. The sugar jar stays at +[-0.015,-0.18]; the notebook keeps
its 150 x 220 mm orientation behind the glass.

Dimensions below are explicit construction defaults inferred for the existing
table, not measurements recoverable from the low-resolution image. The reusable
asset recipes live in `src/assets/discussion-tableware.ts`; existing Asyra asset
parts, lathe geometry, placement and public spatial material contracts remain the owners.

| Object | Geometry and contents | Default appearance | Table-relative XY (m) |
| --- | --- | --- | --- |
| Americano | 90 mm maximum diameter, 105 mm tall; 64 mm lower body, 2.4 mm radial wall and 14 mm clear rounded base. Separate coffee volume extends from Z=15 to 96 mm, leaving 9 mm headspace; seven floating ice cubes displace liquid; no ice is suspended at the bottom. Separate physical lip/base regions meet the shell without overlapping faces. No handle, milk, foam or label. | All optical regions use opacity 1 and transmission 1. Glass #FFFFFF, roughness 0.08, IOR 1.5, wall/lip thickness 0.0024 m and base thickness 0.014 m, capture layer 2; environment intensity 1.00 on the wall and 0.40 on lip/base. Liquid white albedo with #332218 attenuation, IOR 1.33, attenuation distance 0.06 m, layer 1; body thickness 0.055 m/roughness 0.035; surface thickness 0.075 m/roughness 0.015/environment intensity 0.005. Ice #FFFFFF, IOR 1.31, thickness 0.02 m, roughness 0.04, environment intensity 0.50, layer 0. Glass/ice attenuation is white at 1 m. Ordered screen-space approximation; visual acceptance remains open. | [0.02,-0.06] |
| Sugar jar | Low round-bellied body: 112 mm maximum diameter, 44 mm high, 82 mm mouth opening and 6 mm base. Separate 94 mm lid gives a closed total height of 60 mm. Default is open, with lid leaning against the front of the jar and touching the tabletop. Sixteen individual 12 mm cubes and one concave metal teaspoon remain separate parts. | White ceramic #F5F1E7, roughness 0.32; sugar #FFFAF0; spoon #C5C9CA, metalness 1.00, roughness 0.16, environment intensity 1.00. | [-0.015,-0.18] |
| Handleless cup | 100 mm mouth diameter, 85 mm high, 4 mm wall and 6 mm base; open hollow tapered vessel, empty interior, no handle or spout. | Cream ceramic #E8DBC0, roughness 0.38. | [0.27,0.01] |

All bases consume the actual meeting-table top. Glass/coffee and ceramic colors
are recipe parameters; each region retains its separate replaceable material.
The liquid side/base and top surface partition one closed boundary, without
duplicate caps. Liquid, glass and ice use full-coverage physical transmission
with ordered captures. Glass walls, lip and base remain separate colorless
regions. Existing whole-instance XYZ sizing applies before placement. This is
not full nested refraction.
The coffee color parameter controls attenuation, not the liquid surface albedo.
The owner-corrected default #332218 is dark coffee brown rather than the previous
red-orange #87360F. This changes liquid absorption only; glass and ice remain
colourless. It does not resolve repeated absorption in nested optical captures.

#### Owner-selected tapered tumbler - 2026-10-29

Reference: `assets/asyra-office/models/desk-items/review/americano-tapered-glass-owner-reference.png`.
Use its wide mouth, tapered sides and rounded heavy base. The photograph is a
shape/material reference; retain Americano contents, omit its water bubbles and
checkerboard background. Dimensions are inferred construction defaults because
the photo contains no scale. Whole-instance XYZ scaling and replaceable glass
and coffee colors remain available through existing asset contracts.

All profile pairs below are [radius, height] in millimetres; revolve 360 degrees
with 64 radial segments. The origin is the base centre on the tabletop.

| Region | Profile |
| --- | --- |
| Outer wall | [32,14] -> [45,102] |
| Inner wall | [42.6,102] -> [29.6,14] |
| Rounded lip | [45,102], [45,103], [44.2,105], [43.2,105], [42.6,103], [42.6,102] |
| Heavy base | [0,0], [26,0], [28,0.6], [30,2.5], [31.2,5], [31.7,9], [32,14], [29.6,14], [0,14] |
| Coffee base/side before ice displacement | [0,15], [29.3,15], [41.3,96] |
| Coffee surface before ice displacement | [41.3,96] -> [0,96] |

Wall, lip and base share exact boundary rings without overlapping faces.
The liquid has at least 0.3 mm radial clearance and 1 mm bottom clearance from
the cavity. Its surface is a separate real boundary region, not a duplicate
cap. The thickness is actual geometry, with no painted reflection highlights.
The cup uses full-coverage glass transmission with environment reflections
and a separate liquid optical medium. It does not reproduce photographic nested refraction or caustics;
the supplied photo must not become a texture on the cup.

#### Iced Americano contents - 2026-10-29

Use `assets/asyra-office/models/desk-items/review/iced-americano-owner-reference.png`
for brown translucent liquid, high fill and irregular ice. Retain the previous
owner-selected tapered tumbler and table pose, not this new photo's rounded
stemless glass or coaster. These are inferred construction defaults, not
physical measurements from the photo. No milk, foam, bubbles or painted lighting.

Seven independent rounded ice solids use 3 mm corner radii. Dimensions, centres
and rotations are below in mm and XYZ degrees. The owner correction requires
all seven cubes to float: each crosses the Z=96 mm liquid plane, remains mostly
below it and has its highest point below the 105 mm rim. Two smaller centre
pieces fit between the five larger pieces without intersecting neighbouring ice
or the glass. This is a static arrangement, not a buoyancy simulation.

| Ice | XYZ size | XYZ centre | XYZ rotation |
| --- | --- | --- | --- |
| 0 | 19,20,20 | 27,0,87 | 12,-8,17 |
| 1 | 20,19,21 | 8,24.7,86 | -9,11,61 |
| 2 | 19,21,20 | -21,15.3,88 | 8,7,-23 |
| 3 | 21,19,22 | -21,-15.3,86 | -12,-6,38 |
| 4 | 19,20,20 | 8,-24.7,87 | 9,-13,85 |
| 5 | 11,10,12 | -7,-1,91 | 18,14,29 |
| 6 | 10,11,12 | 7,1,91.5 | -16,9,-31 |

Subtract the ice solids from the closed liquid boundary, then partition its
horizontal top into the separate liquid-surface material. Do not draw a full
opaque disc through the ice. Ice, coffee and glass retain independent geometry
and appearance parameters. Everything is static; no melting or fluid simulation.
Liquid CSG provenance distinguishes original external faces from ice-contact
faces. Contact faces retain geometry with zero alpha to avoid duplicate tint;
indexed vertices remain shared within each region for smooth normals. Optical
liquid meshes are excluded from static opaque batching and opaque shadow casting.
The renderer supports screen-space transmission and attenuation, but not complete
nested-media transport. Do not imitate amber highlights using emissive ice or
baked lighting. The current ordered capture shows the tabletop through glass in the live room,
but the submerged portions of floating ice can still produce dark regions because the enclosing absorption
is sampled again by the outer liquid. This appearance is not approved and
photographic equivalence is not claimed. Passing automated gates does not close
this visual limitation.

#### Removable sugar lid and future character interaction

The owner selected the open option B from
`assets/asyra-office/models/desk-items/review/discussion-sugar-options.png`, with
a subsequent correction: the lid must lean against the jar and table, rather
than being absent or lying flat. The image is a design comparison, not app
render evidence; the latest leaning instruction overrides its missing lid.

`sugarJar(color, lidPose)` accepts `leaning` (default) and `closed`. Both poses
use identical vessel, lid, teaspoon and cube geometry. The lid alone receives a
rigid pose change; it is not resized, clipped or replaced between states. In
the default pose it rotates 65 degrees about local X. Its lowest mesh point
is translated onto local Z=0 (the supporting tabletop). Its Y translation is
derived from the jar's outer radial profile using lid vertices and triangle
interior samples, with 0.05 mm clearance at the closest jar contact. The knob
faces outward. The front-side placement avoids the coffee, notebook and cup.

Ceramic body and lid use authored unit normals derived from the radial profile
tangents. Boolean slot cuts interpolate those normals over the retained curved
surface, including new polygon-centre vertices; cutter faces keep separate
plane normals. Normal transformation uses inverse scale then rotation, with
no translation. Both static batch passes and Preset triangle admission preserve
these normals. Do not regenerate them from the irregular CSG triangulation: that
produces radial starbursts and triangular creases. This is geometry shading, not
a ceramic texture; material, dimensions, slot and lid support remain unchanged.

The body and fitted lid retain a 10 mm wide spoon slot on local +X, from
Z=37.5 mm upward. The teaspoon has a concave 30 x 20 mm bowl inside the jar,
a connected rising handle through the slot, and a rounded tip at local
[95,0,65] mm. Its part identity remains separate in canonical asset data.
Sugar retains 16 separate cubes in supported layers of 9, 5 and 2. Each cube
has a different frozen yaw and XY offset; do not render aligned rows of cubes.
Nominal support centres use 18 mm spacing with offsets up to 0.4 mm per axis,
centres at Z=12/24/36 mm, 12 mm cube edges and 1 mm edge rounding. The top
cubes reach Z=42 mm, visible below the 44 mm rim and below the seated lid.
Yaw uses ((index * 137.508 + 17) % 80) - 40 degrees; XY offsets use
[sin(index * 2.41), cos(index * 1.73)] * 0.4 mm. This deterministic static
arrangement preserves identities across rebuilds. Cubes must remain supported,
inside the inner wall, mutually non-intersecting and clear of the spoon bowl.

Future interaction requirements (specified, not implemented in this stage):

1. Pick up the lid by its knob, lift clear of the rim, then place it in the
   leaning pose with both supports preserved.
2. Pick up the teaspoon; place exactly one existing cube into its bowl, then
   transfer that cube to the explicitly selected destination cup.
3. Return the spoon to the jar through its slot.
4. Pick up the leaning lid, lift it clear of the table/jar, align the slot with
   the resting spoon, and seat the lid on the rim.

Keep the part identities `vessel`, `lid`, `teaspoon`, and `sugar-cube-N` separate
in canonical asset data. A future interaction owner must track lid pose, utensil
attachment, cube identity/count and destination-cup identity; cubes must neither
be duplicated nor disappear during handoffs. Interrupted actions retain the
last valid attachment state. Current static rendering may batch compatible
materials and does not provide independently animated render nodes, grasping,
IK, collision physics or these actions yet. Runtime interaction work must
resolve that ownership without replacing the reviewed geometry.

### Ordered optical capture

The current coffee correction supersedes the failed alpha/physical hybrid.
Spatial optics may declare captureLayer (nonnegative integer). Lower layers are
captured before enclosing higher layers; peers are excluded from their own
capture. Higher enclosing back faces contribute through native background
sampling, never through unfinished custom targets. Enclosing back faces render
outermost first without depth writes, then original sides/order/depth writes are
restored. The same Core renderer owns all passes and resource cleanup. Linear
capture prevents repeated tone mapping. This supports nested visible contents
but does not claim recursive physically exact refraction. Geometry and existing
room placement remain unchanged. Full coverage (opacity 1) is the coffee asset
baseline; attenuation, not alpha paint, controls liquid absorption.

### Per-flush shadow reuse

After projection and instance-detail updates, Preset renders a synchronous set of
optical and main passes. Geometry, transforms, lights and instance partitions
remain fixed during that set. Visible shadow caster identities and material
visibility, side and shadowSide are compared between passes, including visible
descendants. Identical configurations share Three's completed shadow maps; changed
configurations and explicit dirty requests recompute. Manual shadow scheduling
remains native. This state is discarded at the end of every flush, so camera,
scene and asset edits cannot retain stale shadows into another frame. Renderer
auto-update state is restored even when a draw fails. Resolution, geometry,
materials, optical sampling and shadow quality remain unchanged.

Enclosing optical passes retain a back-face material variant per active source
material instead of repeatedly changing the original material's side and shader
version. Each variant synchronizes source values and shares optical uniforms;
source program version changes invalidate its program. Removed or disposed
sources, removed capture layers and engine teardown release the variant. Final
rendering and error recovery restore the original material reference.

### Camera-visible optical capture

Ordered captures admit recipient ranks through the current camera frustum,
camera layers, material visibility and explicit frustum-culling opt-out. World
matrices update before admission, so camera return and parent movement cannot
reuse stale visibility. Only ranks with visible recipients redraw their capture;
scene-present targets retain their allocation while offscreen and refresh before
being used again. Removing a rank or destroying the engine releases its target.
Ordinary native transmission adds no engine-owned prepass. Multiple admitted
ordered ranks use the same-flush sharing described below. No captured pixels
are retained across flushes. Geometry, resolution, optical material math,
shadow quality and the keyboard movement contract are unchanged.

### Same-flush opaque work in ordered optical rendering

When multiple ordered optical ranks are visible, Preset captures opaque radiance
and depth once at full resolution with linear half-float color and four-sample
antialiasing. Later native optical passes sample that completed opaque result,
preserving depth occlusion and applying tone/color conversion at their own output
boundary. The allocation is reusable; pixels are always recomputed per flush.
Ordinary transmission and single-rank scenes add no opaque target or prepass.
Non-opaque shadow casters and scene override materials retain native rendering
because their shadow/pass inputs cannot use this prepass contract. Renderer
state and source material visibility are restored even on failure. The replay
mesh is removed before bloom and overlays. This does not alter asset geometry,
materials, physical resolution or camera integration.

### Lower-left work room - reference review

The owner's 2026-10-29 room crop is the visual authority for this correction.
The approved expanded room envelope, desk transform and exterior remain intact.
The green divider keeps its accepted total height and thickness. Its separate
white top region is now **0.020 m high**, with the green body extending to the
cap underside; no white overlay or white side panel is introduced. This is a
construction estimate from the visible thin rim, not an exact measurement from
the low-resolution source. The previous proportional cap was 0.0564 m high.
`reference/office-structure.json` owns this instance's cap height. `createWall`
accepts optional physical `capHeight` after whole-unit sizing; omission keeps
the catalog default. Validate finite positive heights and bevel clearance for
both regions. Near and distant meshes share the same outer extents and seam.

Room inventory and placement:

- Three wooden wall shelves remain. The upper shelf holds two plants (white
  and terracotta pots); the middle holds three (white, terracotta, white).
  Their pot bases rest on the actual shelf top; the pots remain inside its
  footprint. Foliage must clear the wall and the underside of the next shelf.
  Use distinct plant forms and stable variation identities.
- The lower shelf has seven individually sized book spines. The source supports
  different heights and colors; the exact count is a reconstruction of the
  visible spines, not a readable title/count guarantee. Heights range from
  0.19 to 0.28 m; widths range from 0.035 to 0.070 m.
- Keep the silver laptop, dark cup and mouse on the main desk, the terracotta
  floor plant under the poster, the green oval rug and the orange low stool.
- Restore the rear wooden work surface between the west wall and the separate
  plant table. It follows the main desk's top elevation, with 0.32 m depth,
  0.032 m top thickness and four dark supports. A small terracotta plant sits
  below the shelves. The pale notebook belongs on this rear surface toward
  its right end, not on the separate small plant table. The inferred surface
  is kept separate from the accepted main desk asset.
- The side table retains its white potted plant. The work poster uses a clear
  768 x 1008 SVG with the reference's three text lines and ochre heart; the
  renderer samples it at 512 pixels, without baking the reference blur.

All appearance remains replaceable. Geometry is independent of lighting.
The source actor, sleeping cat and rejected desk chair remain missing by prior
owner instruction, pending reviewed Blender assets; do not count these as
completed or insert procedural stand-ins. This review does not certify pixel
equivalence to the reference or resolve the separate navigation-performance
issue.

### West-wall floor planter

The owner crop `small-plants/review/work-floor-square-planter-owner-reference.png`
is the shape authority for `work-floor-plant`. It is not the generic round pot.
`small-plants-model-spec.json`, variant `broadleaf-square`, supplies the actual
construction recipe: a 0.32 m square mouth, 0.24 m square base, 0.25 m height,
16 mm rim wall, 18 mm bottom, 6 mm rounded plan corners and 2 mm section bevel.
Soil ends at 0.224 m, below the open rim. These metric defaults reconstruct the
visible proportions; the photograph does not provide absolute measurements.

Ten to twelve broad, tapered, closed blades grow from a short soil-rooted stem:
outer blades reach outward and arch before their tips; inner blades stand
higher. The fixed scene seed is 606, the floor anchor stays (-2.68, -1.11, 0.38),
and foliage must clear the west wall. Leaf widths are 0.105-0.13 m before bounded
variation; the highest inner tips are approximately 0.84-0.86 m above the base.
The section and growth spec define hidden geometry explicitly instead of
interpreting foreground occlusion as a missing portion of the planter.

Terracotta defaults to #A4714E and foliage to #647336. Appearance remains
replaceable through existing asset appearance/scene transforms; other variants
and all other scene plants retain their original outputs. Construction reuses
the existing closed-leaf builder and section topology and runs only at scene
creation, with no camera-dependent vegetation work. Source-space tests verify
square corners, actual cavity, blade tiers, finite nondegenerate triangles,
floor support and wall clearance. Work-room hardware E2E records the live
scene's overview and a normal-control close-up for visual inspection.

### Five reference botanical work-shelf planters

The latest owner reference is
`small-plants/review/work-shelf-botanical-reference.png`. It supersedes the
previous straight-cylinder shelf-plant appearance, but preserves each pot's
color, anchor and uniform instance scale. The upper-left reference plant maps
to the scene's upper-right position; the reference's lower-left plant maps to
scene upper-left; the reference's lower-right cat planter maps to all three
middle-shelf positions. The hanging plant in the reference is not included.

| Position | Preserved anchor (m) | Pot default | Botanical recipe | Uniform scale / seed |
| --- | --- | --- | --- | --- |
| Upper left | (-2.79, -0.10, 2.0827) | Ivory #EEE5D7 | fittonia | 1.00 / 701 |
| Upper right | (-2.79, 0.25, 2.0827) | Terracotta #9B6543 | snake | 1.10 / 702 |
| Middle left | (-2.79, -0.14, 1.8027) | Ivory #EEE5D7 | succulent | 1.00 / 703 |
| Middle centre | (-2.79, 0.09, 1.8027) | Terracotta #9B6543 | succulent | 0.95 / 704 |
| Middle right | (-2.79, 0.31, 1.8027) | Ivory #EEE5D7 | succulent | 1.05 / 705 |

`shelf-botanical-model-spec.json` owns the hollow radial vessel sections, soil
height, relief, leaf-ring counts and dimensions, fleshy blade thickness, cat
features and pebble settings. These metric values reconstruct the selected
appearance at the existing shelf scale; they are not absolute measurements
recoverable from the photograph. `shelf-botanical.ts` constructs the assets;
no renderer-specific geometry or per-frame growth is involved.

- Fittonia: 0.128 m nominal upper diameter, 0.112 m vessel height, rounded
  narrowing base with shallow chevron relief; 17 broad curved leaves in three
  overlapping tiers, dark green pigment with white branching veins.
- Snake plant: 0.128 m nominal upper diameter, 0.115 m vessel height, 32 shallow
  vertical flutes and rounded lower body; five upright pointed sword leaves,
  irregular green bands, yellow margins and 32 small pale stones. The scene
  applies its retained 1.10 uniform scale to the entire asset.
- Succulent: 0.130 m belly diameter, 0.091 m body height, 0.113 m ear-tip height;
  rounded open cat vessel, two tapered ears, two support feet and a dark face
  directed into the room (+X). The body begins 4 mm above its local origin;
  the feet, rather than the belly, contact the shelf. Twenty-one thick pointed
  leaves form three staggered rosette tiers. Different seeds vary azimuth and
  small leaf dimensions without changing the vessel or the accepted anchors.

Relief is geometry, not painted light. `botanical-surface.ts` creates replaceable
512 x 256 leaf pigmentation with neutral normal maps through the existing
Preset spatial-surface contract. The scene registers each completed surface
once through its existing surface table. Pot colors remain caller parameters;
all three shapes support uniform scale and the existing assembly transforms.
All five pots retain real cavities, recessed soil and closed leaves. Formal
checks cover nondegenerate triangles, feet-to-shelf contact, wall clearance,
upper-shelf clearance, exact color/anchor preservation and the existing mesh
budget. Hardware E2E captures the same live app at normal and enlarged views.
Other plants, books, shelves, room structure, lighting and exterior remain
unchanged.

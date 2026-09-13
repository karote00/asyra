# Harvest robot owner flow

Product authority: [harvest robot](/docs/ai/apps/fieldscope/specs/harvest-robot.md).
Physical evidence: [hardware concept](/docs/ai/apps/fieldscope/specs/harvest-hardware.md).
This architecture contract is not a test ledger or a physical safety certificate.

## A - Feasibility domain (current M1)

Owner: app harvest-domain assessment functions.
Inputs: validated farm configuration, explicit stowed vehicle envelope, route
candidate, measured or unknown survey, load/CoG data, battery/return-energy estimates and hazard observations.
Outputs: lane, load and energy reports with reasons and unresolved obligations; prioritized
advisory hazard action. The advisory function consumes completed load/energy actions as well as hazard
observations. No motor commands or inventory mutations.
Conditions: always validate caller input; unknown evidence stays unknown. No bypass.
Allowed contributors: existing farm validator, configurationSite/createLayout,
createPlantingRows and CROP_LAYOUT.rootOffset; deterministic local arithmetic.
Forbidden: Core mutation, React, engine/Three, crop mesh builders, hidden fruit
truth, clocks, network, cached model assumptions and physical controller commands.
Boundary: `apps/fieldscope/src/domain/harvest-assessment.ts`,
`harvest-load.ts`, `harvest-energy.ts`, `harvest-policy.ts` and their `domain/__tests__` files.
Spec: A feasibility, crate/load, energy admission, hazard policy and M1 DoD sections.
Failure owner: A rejects invalid inputs; reports geometry/ground/data restrictions.
Cache dimensions: none. Two bounded layout passes (including the existing row helper) and one row preparation per assessment;
results reused within that invocation, no work per plant or animation frame.

## B - Mission document composition (M2)

Owner: app runtime through registered Core Features/APIs.
Inputs: robot/route/patrol edits; validated farm configuration with unique stable
strip IDs; completed A reports. Strip mission bindings use stripId, never array
position as identity. B resolves current ordinal for A and returns a null lane
when the selected ID is absent. Reorder/deletion of other IDs preserves binding.
Outputs: canonical robot/mission settings, the completed immutable positional
`route` for A consumers (null for missing identity/invalid interval), and scoped
derived UI values; one edit
per intended history action. M2 has no run; M3 must invalidate incompatible runs.
Conditions: admission must succeed; failed edits leave prior canonical state intact.
Replay bypasses intent dispatch, uses normal Core state apply and projections.
Allowed: Core SceneTree/Props, Feature/API transaction path and A reports.
Forbidden: second React mission model, private Factory internals, render-derived
clearance or actuator commands. Cannot turn `screened` into `safe`.
Boundary: app runtime robot/mission composition and formal runtime tests, plus
locale and mission editor consumers of the approved API.
Spec: B - M2 editable design workspace. Public actions: patchRobot, getRobot,
subscribeRobot, existing undo/redo. One-shot exclusive priority 100 Feature.
Boundary files: domain/farm-configuration.ts (strip schema/defaults/admission),
domain/robot-configuration.ts, runtime/robot-workspace.ts, runtime/bootstrap.ts,
ui/configuration-editor.tsx (identity-preserving strip actions),
ui/robot-editor.tsx, ui/workbench.tsx, locale catalogs and their formal tests.
Direct app test fixtures may adopt the required strip schema without changing
their geometry expectations. A positional lane schema and layout algorithms
remain unchanged. Registered settings type: robot-configuration.
Derived reports live until the next relevant canonical edit; reads do no work.
Failure owner: B owns validation/history/replacement; A owns assessment reasons.
Cache dimensions: none proposed.

## C - Robot, crate and fruit projection (M2 implemented; M3 planned)

Owner: app render projection, engine consumes admitted spatial products.
Inputs: canonical admitted robot definition, mission settings and completed
simulation poses/fruit states; existing farm spatial output stays separately owned.
M3 preparation also consumes the existing domain cultivar/planting outputs and
completed farm geometry once at the owning scene boundary.
Outputs: dimensioned concept geometry and state projection through SpatialLayer;
M3 immutable scene revision, per-instance fruit identity, source-shape partitions
and installed transforms for D observation/collision consumers.
Conditions: pose updates alter transforms only; definition changes replace affected
geometry. Blender exports, if used, must match canonical dimensions and ownership.
Allowed: completed robot geometry/pose products, existing spatial admission/engine;
existing canonical crop/layout generation only inside its scene preparation owner.
Forbidden: perception decisions, harvest success inference, force/soil conclusions,
rebuilding cultivars per tick or private diagnostic geometry as product output.
No substitute primitive fruit, altered botanical formula, duplicate generator,
visibility-filtered collision scene or geometry simplification to admit motion.
Boundary: render-app/robot-projection.ts, domain/robot-model.ts, runtime/bootstrap.ts
composition, formal geometry/runtime/browser tests and canonical Blender export.
M3 scene preparation allowlist (relative to apps/fieldscope/src):
`domain/crop-models.ts` (source triangle partitions/metadata, near/distant
correspondence, cucumber spines and tomato calyx/distal synthetic pedicel ownership),
`domain/crop-hairs.ts` (optional source-triangle/generated-range provenance only;
no formula, traversal, density or geometry change),
`domain/crop-layout.ts` (plant-instance identity), `render-app/site-geometry.ts`
(retain completed metadata/shapes/assignments), `render-app/site-projection.ts`
(owned fruit instances and full-scene handoff), `runtime/bootstrap.ts` (revision
and lifecycle wiring), their direct domain/render/runtime formal tests and
existing crop/robot browser evidence. `domain/crop-fruit.ts` source formula,
A assessment, engine contracts and other app/Framework owners remain unchanged.
D state production and B/UI session controls are not part of this C slice.
Spec: C - M2 dimensioned concept projection and C - M3 scene identity and geometry
handoff. focusRobot remains presentation-only through the existing camera Feature.
M3 fruit disposition/working-pose integration follows D's completed outputs in a
later C execution card; preparation itself removes no fruit or admits movement.
Definition geometry lifetime: width/length/height/tool; dock position is a transform.
Route projection lifetime: completed lane report. Robot pose does no crop preparation.
Scene handoff lifetime: admitted canonical scene revision and botanical dimensions;
metadata and shapes share the existing SiteGeometry owner. C -> D passes completed
source geometry with identities, not configuration bags for regeneration. D -> C
returns admitted poses/dispositions for those identities. A replaced scene retires
old evidence; camera/locale/layer visibility/read/clock/pose do not regenerate it.
Failure owner: projection/admission failure is visible; no substitute safe geometry.
Cache dimensions: none proposed; topology lifetime is the robot definition.

### C working-rig source handoff

Owner: the same app robot definition/projection owner. Inputs: admitted robot
width/length/height/tool and its existing chassis-local source parts, then bounded
joint inputs for that definition. Outputs: immutable definition revision, unique
rigid part ownership, rest pivots/axes/fixed chain, approved joint bounds/speeds,
tool contact reference and candidate forward-kinematic body transforms.
Conditions: exact zero-state source identity; full lift-envelope validation; no
partial result for invalid/nonfinite/out-of-bounds/stale-definition input. Dock,
mission and presentation changes bypass definition preparation. No hardware bypass.
Allowed: existing robot-model source formulas, engine-neutral rigid transforms,
readSpatialShape admission and completed definition products. Forbidden: Three
kinematics authority, D-generated robot geometry, unconstrained Cartesian reach,
link stretching, per-pose shape generation, live motion without D admission,
physical safety or harvest-quality inference, and unapproved joints/parameters.
Boundary: domain/robot-model.ts (shared source frame definitions),
domain/robot-kinematics.ts (app-owned rig preparation and pure FK),
render-app/robot-projection.ts (definition lifetime and source read handoff),
runtime/bootstrap.ts (read-only rig source API/lifecycle), and their corresponding
domain/render/runtime formal tests plus existing robot browser checks. App API
and architecture docs describe the implemented read handoff. D modules and UI
motion controls are excluded from this source slice.
Spec: C - M3 synthetic working-arm source; approved five DOFs and explicit speed
bounds only. C -> D supplies the actual immutable rig/source and candidate FK;
D later returns admitted same-revision joints/fruit retention for C presentation.
Failure owner: C reports unsupported lift/definition or invalid joints and retains
parked design output; D later owns reach planning, speed/timing and swept admission.
Lifetime: once per robot width/length/height/tool definition. Repeated FK and reads
reuse its admitted source shapes/frames. Retirement/disposal rejects old handles.
Cache dimensions: none proposed; rig is a completed definition product.

### C installed dock source handoff

Owner: existing RobotProjection station geometry and installed projection.
Inputs: its completed admitted createDockModel output and B's dock X/Z.
Outputs: immutable DockSource revision and distinct installed meshes shared by
rendering and subsequent D queries. No aggregate bounds or route annotation.
Conditions: dock placement changes retire the installed handle, preserving shapes;
robot definition/mission/view changes bypass station preparation. clear/disposal
retires source identity. No movement or contact-admission bypass.
Allowed: existing station source, spatial admission, immutable placement product.
Forbidden: D station regeneration, primitive proxies, altered model geometry,
blanket platform/charger exclusions or inferred electrical/contact safety.
Boundary: render-app/robot-projection.ts, runtime/bootstrap.ts read-only source
access/currentness and their direct render/runtime formal tests; API_SURFACES and
existing robot browser checks. No domain generator, simulation or UI edits.
Spec: C - M3 installed dock source handoff. Failure owner: C unavailable/stale
source; D later owns precise support/contact and interval-query decisions.
Lifetime: local station geometry once per projection; installed source per dock
X/Z. Repeated consumers reuse the completed product. No additional cache.

### C source material-region provenance

Owner: canonical C source construction/preparation and completed handoff.
Inputs: existing primitive operations and unchanged near/distant source arrays.
Outputs: immutable source-local region identities, original triangle ranges and
producer-declared sheet/closed-solid/open-shell semantics, carried with original
robot, cultivar, farm and installed station products. No geometric replacement.
Conditions: every triangle covered exactly once; source closure evidence precedes
closed-solid claims. Missing/overlapping/unclassified metadata is unavailable.
Mixed builders preserve primitive regions; no whole-plant or layer shortcut.
Allowed: original TriangleBuilder construction provenance, source producer region
declarations, existing spatial shape admission and C lifecycle/products.
Forbidden: new caps/welding/thickness, changed source formulas or materials,
ray/occupancy decisions, blanket physical exclusions, manufactured watertight fruit,
per-frame generation and private diagnostic geometry.
Boundary: domain/source-occupancy.ts (app-local region contract/admission),
domain/mesh.ts (record original primitive ranges), domain/robot-model.ts,
domain/crop-models.ts, domain/crop-fruit.ts and domain/crop-hairs.ts (metadata-only
producer declarations); render-app/site-projection.ts, cultivation-projection.ts,
site-geometry.ts and robot-projection.ts (same completed metadata handoff).
domain/robot-kinematics.ts may only admit/detach region metadata in admitPart,
preserving already admitted products; FK, body assignment and limits are unchanged.
Direct formal source/render/runtime tests and fixtures may adopt the new metadata
without changing unrelated behavior or geometry expectations. API_SURFACES and
existing robot/crop browser checks describe/prove the handoff. No engine/framework,
B settings, D production, session/action or UI behavior change in this C segment.
Spec: C source material-region provenance; original C geometry/retention DoD.
Failure owner: C rejects incomplete provenance; D later resolves query ambiguity.
Lifetime: original source definition/scene, with existing installed-pose retirement.
No new cache; metadata is produced once with canonical geometry and reused.

## D - Deterministic simulation (M3, planned)

Owner: app simulation session, composed through the registered Core Feature/API
boundary. Helpers below prepare or query inputs; none owns a competing session.
Inputs: B's immutable admitted mission/revision and completed design A reports;
pre-run synthetic dispatch evidence bound to mission/scene revisions and validity;
run-bound observations/action confirmations; monotonic simulation clock inputs;
completed scene geometry and exact swept-motion query results.
Outputs: immutable session read snapshot, ordered transition evidence, completed
pose intents, stable target inventory, crate ledger and explicit faults/reasons.
Conditions: no overlapping run; at most one pending patrol. No bypass around B
or movement admission. Paused clock inputs advance schedule/evidence time only;
resume never catches up paused motion. Cancel/dispose/replacement closes the
old generation before accepting successor inputs. Changed canonical mission/farm
state invalidates the run even on history replay; view-only changes bypass D.
Allowed: A load/energy/hazard policy, B completed canonical snapshots, a declared
synthetic observation adapter and engine-neutral collision queries over completed
scene products; Core Feature/session lifecycle and app API composition.
Forbidden: hidden fruit truth as perception, Three/React authority, direct physical
side effects, wall-clock scheduling, auto-restart after fault, private Core APIs,
geometry generation per tick or arbitrary leaf/crop/net pass-through.

Boundary (all paths relative to `apps/fieldscope/src`):

- `simulation/contracts.ts` owns app-local transient schema, identities and
  admission; `simulation/session.ts` owns transitions, scheduling and ledgers.
- `simulation/geometry.ts` owns the shared prepared source representation used
  by observation and collision; it performs no detection or clearance decision.
- `simulation/observations.ts` owns observation admission and the synthetic
  viewpoint/occlusion adapter; scene truth cannot escape as successful detection.
- `simulation/collision.ts` owns exact movement-query admission over completed
  geometry/interval envelopes. Unknown geometry or leaf motion remains unknown.
- `runtime/harvest-session.ts` owns Core Feature/API composition and lifecycle;
  `runtime/bootstrap.ts` wires B snapshots, disposal and completed D output only.
- Corresponding `simulation/__tests__` and `runtime/__tests__` files own formal
  scenario, admission, lifecycle and work-count evidence.

Hand-off: B -> D receives completed mission/report on relevant canonical updates.
D admission -> A supplies validated pre-run synthetic evidence and consumes fresh
assessments before run creation. B reports retain their unknown design evidence;
D cannot treat B defaults as fresh sensing or mutate B to enable dispatch.
Existing domain/site owners -> observation/collision adapters supply completed
engine-neutral geometry with identity and revision; D cannot clone the farm
layout/crop generator. D -> C supplies completed poses/dispositions only; C never
recreates harvest decisions. C's fruit/working-pose implementation and B/UI session
controls require their own next owner cards before code changes.
Spec: harvest-robot section D, including session/clock, observation evidence,
conservation, motion admission and M3 acceptance; M3-tagged Gherkin cases.
Failure owner: D rejects invalid inputs atomically, retains unresolved/fault state
for missing evidence and blocks stale generation writes. A retains ownership of
assessment reasons; adapters retain observation/collision reasons. Projection
errors remain C errors and cannot manufacture a D success.
Lifetime: mission and static scene products survive a run until their source
revision changes; evidence expires by its explicit simulation validity interval.
Pose queries use current motion/leaf inputs. Reads consume completed snapshots;
no crop preparation or full accumulated-ledger scan per read/tick.
Cache dimensions: none proposed. No persisted/wire format is introduced; session
identities are neutral, run-scoped and unrelated to design entity identities.

### D injected target observation admission

Owner: observations.ts target-reading admission, with no competing session.
Inputs: composition-issued context binding original current HarvestSession
snapshot, canonical mission and issued GeometrySource; actual session read API,
required context/mission currentness predicates and QueryGeometry current read.
Caller input is a labeled synthetic-injected target reading, with run/generation,
all source revisions, observation/validity times and explicit unknown fields.
Outputs: immutable admitted assumption and original existing target identity.
Conditions: same-update tuple and actual snapshot identity current before/after
work; the composition context predicate guarantees mission ownership by this run,
not merely individually current objects. Snapshot alone cannot prove that link.
Active running/paused/faulted run only, finite valid times, current target
membership and known cultivar consistency. A valid earlier observation has no
current-time-equality requirement. Detached snapshot validation precedes use.
No bypass for cloned contexts, invalid generation, missing target or expired data.
Allowed: actual HarvestSession.getSnapshot, canonical/source currentness checks,
existing source membership, detached schema validation. Repeated input does not
create a target; the session remains evidence-refinement/inventory owner.
Forbidden: hidden maturity/visibility/quality as observations, ray hit as detection,
source generators, A assessments, lifecycle/clock/inventory mutations, real optical
claims, assumed quality from retention, or accepting a caller-written action ID.
Boundary: simulation/observations.ts and its direct permanent
`simulation/__tests__/observations.test.ts`; API_SURFACES records the handoff.
No session/contracts/geometry/ray, C, UI, runtime or framework production changes.
Spec: D Observation and action evidence, Fruit/crate conservation and M3 DoD.
Failure owner: this helper rejects malformed/stale assumptions atomically; later
viewpoint interpretation and expected-action confirmation are separate slices.
Lifetime: context's current actual session snapshot and source tuple; evidence
expires explicitly. No target ledger or retained cache is owned here. Reads never
run observation work; the next adapter owns camera projection/sample occlusion.
Gates: forged/current-source-old-run, replacement/cancel/clock expiry, wrong target
or cultivar, getter snapshot, valid earlier evidence, null quality independence,
confirmation rejection, same-target identity and no session/A/generator mutation.

### D synthetic viewpoint adapter

Owner: observations.ts synthetic camera sampling over actual near sources.
Inputs: current actual-run ObservationContext and labeled request with matching
run/generation/source revisions, observation validity, explicit candidate target
IDs/sample count, camera world pose, rectilinear slopes/range and leaf state.
Outputs: immutable requested source samples, actual ray witnesses and separate
visible/occluded/outside-view/unknown counts; no inferred maturity/quality/actions.
Conditions: same admission currentness before/after work; a new view samples the
current snapshot time, without reconstructing past poses. Previously recorded
earlier readings retain their separate admission validity. Candidate mappings
are exact. No bypass for bad source mapping, unknown dynamics or stale context.
Sampling: evenly spaced source triangle ordinals in original mesh/partition order,
up to requested count without repetition, at most 64 rays per request. This is a
computation cap, not sensor coverage. Empty input returns zero samples and no ray
call. Actual computed rays, not ideal centroid intersections, are authoritative.
Allowed: QueryGeometry's completed near source/bounds, original C sample placement,
current session base/joints, one RayQueries batch, shared conservative frame math.
Current foundation is world-aligned base/empty-held/all-attached; other dynamic
dispositions need their own completed handoff, never fabricated poses.
Forbidden: UI orbit camera truth, guessed physical camera mount, source generators,
hidden fruit success, opacity pass-through, same-target hit as pedicel visibility,
invented confidence/quality or session/action/inventory mutations.
Boundary: simulation/observations.ts and its direct observations.test.ts; minimal
ray-query.ts frame helper exports reuse existing inverse/direction arithmetic
without changing predicates, occupancy, ordering or numerical guarantees. Its
direct tests may cover shared frame equivalence. The existing selected/refined
hit interval is exposed read-only as distanceBounds alongside the compatible
distance midpoint; no interval is reconstructed from that midpoint. Non-target
occlusion requires hit upper < requested sample-distance lower; rear/overlapping
hits remain unknown. Direct interval-handoff and behind/overlap cases are required.
API_SURFACES records these handoffs.
No geometry/arithmetic/C/session/runtime/UI/framework production changes.
Spec: Synthetic viewpoint sampling, near-source ray, observations and M3 DoD.
Failure owner: observation rejects malformed/context inputs, propagates geometric
unknowns and reports bounded sample coverage; ray owner retains intersection
reasons. No result authorizes an action or physical quality conclusion.
Lifetime: one current request; camera inverse once, eligible rays one batch/FK,
source bounds reused. No retained sample/result cache or world geometry copies.
Gates: source sample identity/order, actual C visibility/occlusion and front/back,
frustum boundaries, malformed/empty/stale input, current dynamic pose and unknown,
zero generation/bound scans and unchanged numeric ray tests; app gates and review.

### D dispatch admission

Owner: D contracts admission. Inputs: composition-issued current canonical receipt
and identity predicate, completed B report including `route`, captured
canonical farm/mission revision, original current C scene/robot handles, finite
clock time and explicit synthetic dispatch bundle. Output: immutable admitted
mission/evidence, fresh A lane/load/energy screens and held/accepted decision;
no run, clock advance or canonical write. Source identity/currentness and evidence
validity are checked before downstream work. The receipt binds same-update B/farm/C
inputs, not an arbitrary revision number. Admission constructs required stowed
requests from dock -> route start -> end and end -> dock with exact purpose and
source/interval binding; only a usable rig and complete matching query coverage
can pass. Missing/empty/wrong-purpose/wrong-route evidence has no bypass.
Allowed: existing A functions, B's completed positional route, current-source
predicates and the composition-owned exact movement-query dependency against C.
Forbidden: D strip identity resolution, cloned source handles as fresh originals,
caller-asserted clearance, default always-clear adapter, source generation and
silent evidence renewal. Actual query construction/solver remains the D collision
owner; this contract slice does not substitute synthetic shapes for that provider.
Boundary: simulation/contracts.ts and `simulation/__tests__/contracts.test.ts` only;
API_SURFACES documents the completed admission API. Session/runtime/UI, A/B/C
production and persisted schemas are outside this slice.
Spec: D dispatch admission boundary and existing session/clock/motion requirements.
Failure: D rejects identity/time/schema faults atomically; A retains its reasons;
the query provider owns movement reasons. No failure creates a run. Reads reuse
completed products; A/query work occurs only on an explicit admission intent.
Lifetime: captured canonical revision and current C handles; evidence [from,until)
never gains time from pause, resume or source replacement. No caches proposed.

### D session clock foundation

Owner: D session. Inputs: canonical receipt/currentness, internally issued
prepareMission product, explicit
simulation time and generation-bound intents, required dispatch movement provider
and distinct current-state resume provider. Output: immutable current run/lifecycle,
clock/active elapsed/schedule state and ordered transition evidence. Start invokes
admitDispatch internally; it never accepts an arbitrary accepted-result object.
Pause/clock preserve completed pose/retention/remaining intent. Resume requests
come only from the current paused snapshot and bind run/generation/source/time;
late, held, expired or mismatched decisions cannot mutate it. Cancel/replace/close
retire the old generation before successor work. Internal synchronous replacement
validates the successor before retiring; duplicate current receipts are no-ops
and rejected receipts cannot invalidate a still-valid run. No bypass of admission.
Allowed: completed D admission and C rig rest products, source-currentness checks,
finite clock arithmetic and immutable transition products. Forbidden: implicit
clock sources, motion extrapolation, evidence renewal, initial-dock replay for
Resume, source rebuild, second run or provider-free clearance.
Boundary: simulation/session.ts and `simulation/__tests__/session.test.ts`;
API_SURFACES may describe the implemented contract. Runtime/UI, A/B/C and real
observation/collision/action implementations are outside this foundation slice.
Spec: D session/clock, session admission/pause and existing motion requirements.
Failure owner: session rejects malformed/stale intents atomically; admission and
resume providers own their reasons. A held result never resumes physical motion.
Lifetime: explicit generation and current canonical/source receipt; pause retains
run identity. Reads reuse snapshots and immutable transition links with no full
ledger scan/copy or A/geometry work. No caches proposed.

## E - Physical adapter (M4-M6, blocked on physical evidence)

Owner: separately authorized hardware integration and safety engineering.
Inputs: verified calibration, tested components, validated stopping/protection
functions and authenticated/time-bounded commands.
Outputs: measured observations and acknowledged physical actions.
Conditions: physical qualification and separate authorization; no simulation bypass.
Allowed: reviewed controller interface and independent machine protection system.
Forbidden: direct browser-to-motor actuation, simulation truth as sensor evidence,
software-only E-stop or unverified safety claims.
Boundary: none admitted for implementation yet. Hardware contract owns requirements.
Failure owner: physical protection system; app reports rather than masks faults.
Cache dimensions: none.

### D shared query geometry preparation

Owner: D geometry preparation, one completed source representation for observation
and collision consumers. Inputs: composition-issued opaque receipt binding original
current C PreparedScene, RobotSource and DockSource from one canonical update;
receipt and individual source currentness predicates. Outputs: immutable owner-issued
geometry product with unique near shape records, installed placements, source
triangle/fruit ownership and robot rigid-body/station-piece identity.
Conditions: receipt and all handles current before preparation/publication/use;
unchanged receipt bypasses preparation only after currentness checks. Replacement
retires the old output; failed preparation has no partial publication. No bypass
for missing physical geometry, revision lookalikes or visibility/opacity.
Allowed: admitted source arrays/descriptors/instances, C's canonical fruit partition
and rig ownership products, pure engine-neutral placement composition. D consumes
completed C outputs and never regenerates their geometry or resolves B routes.
Forbidden: detection/harvest decisions, A/clock/session mutations, bounding-volume
proxies as physical shapes, distant LOD clearance, per-query world-mesh copies,
blanket tire/joint/tool/fruit exemptions and physical quality inference.
Boundary: simulation/geometry.ts and `simulation/__tests__/geometry.test.ts`;
API_SURFACES documents the implemented handoff. No changes to C/domain generators,
engine, B or runtime/UI. For shared local bounds only, the direct ray-query.ts
consumer may replace its local preparation with the completed owner output;
its formal test may prove equivalence and work counts. Ray numerical, occupancy
and nearest-result semantics remain unchanged.
Spec: D shared query geometry source and motion/evidence/quality clauses.
Failure owner: geometry rejects stale, inconsistent or unsupported source; later
observation/collision owners decide unknown/blocked evidence, not this source.
Lifetime: one composition source receipt; unique source shape registration and
local vertex/non-sheet region bounds preparation once, with original immutable
shape and region identity. Conflicting region mappings cannot share a record.
Instance placement references and completed local bounds are reused on queries.
Cache dimensions: current issued receipt, original shape and region metadata;
only source-local bounds are retained in its completed geometry product. The
measured repeated 612096 vertex and 1719909 region-index visits justify this
bounded preparation handoff. Same current receipt reuses it; replacement rebuilds,
failure publishes nothing, and retirement/clear rejects old output and releases
owner retention. Dynamic poses/rays/time are excluded from this static product.
No cross-receipt cache, ray-local cache, world copy, BVH or query-result retention.

### D near-source ray query

Owner: D geometry query helper, before observation interpretation. Inputs: issued
current shared geometry, synthetic batch time/validity, current robot base transform
and joints, explicit leaf source-pose/all-fruit-attached state, finite rays/ranges.
Outputs: immutable batch-bound nearest source hit/within-range miss/unknown;
original mesh/instance/triangle identity, barycentric coordinates and metre distance.
Geometric unknown output may carry at most two immutable representative source
witnesses (one ambiguous triangle or two nearest-order candidates), bound to the
same source/batch with conservative distance bounds; never an exhaustive ledger.
Conditions: source receipt/currentness and detached dynamic/ray schema checked
before work and before publication; unknown motion/disposition/expired evidence
has no valid-hit bypass. No session clock change or caller-forged completed result.
Allowed: QueryGeometry read handoff, original near source arrays/placements, C FK
once per batch, C material-region provenance, deterministic engine-neutral
triangle/rigid-transform arithmetic with conservative propagated bounds.
Conditions: per-region source occupancy precedes nearest-hit publication; unresolved
origin occupancy has distance lower bound zero. Bounds only reject candidates and
do not declare material. Only conclusive arithmetic signs classify outside; exact
operation proofs are generic, and unresolved nearest-distance overlaps are unknown.
Forbidden: source generators, D detection or quality claims, Three raycast,
UI camera input as sensor truth, opacity/distant/visibility filtering, blanket
camera/robot/support exclusions, AABB occupancy or endpoint-only motion clearance.
Boundary: simulation/ray-query.ts, simulation/query-arithmetic.ts and their direct
formal tests in `simulation/__tests__/`. No geometry.ts production change in this
uncached correction; its shared completed-bounds step remains separate.
API_SURFACES documents the
implemented query. Other D/session, C, runtime/UI and engine production are excluded.
Spec: D near-source ray evidence plus existing shared source/motion/quality clauses.
Failure owner: ray provider rejects malformed/stale batches and reports unknown
for missing state or unresolved geometric ambiguity; observation interpretation
and full interval collision remain their subsequent owners.
Lifetime: current shared source; dynamic transforms/validity belong to the batch,
FK once per batch, query-local work reset per batch. No retained query results.
Cache dimensions: none in this ray slice. Measured repeated bound scans are the
input to a subsequent QueryGeometry preparation step shared by ray and collision,
not authorization for a ray-local cache. That next card must define source lifetime,
bounds/disposal and uncached equivalence before implementation.

### D static source surface pairs

Owner: `simulation/collision.ts`, a geometry-evidence helper for D movement queries.
Inputs: current issued GeometrySource; clone-once synthetic time/validity and
mesh/instance/triangle ordinals bound to that source; explicit robot base/joints,
leaf source-pose or unknown, fruit all-attached or unknown. Resolve only original
source witnesses and original source-region ownership; no caller geometry proxy.
Outputs: frozen complete batch with surface-separated/surface-intersection/unknown,
original pair witnesses/reasons and bounded work counts. These are not body-free,
material occupancy, contact allowance or movement-clear results.
Conditions: all references/schema valid before geometry work; source current before
and after; [from,until) validity. Missing dynamics/degenerate/uncertain arithmetic
remain unknown. No same-body, joint, tire-ground or tool-target contact bypass.
Allowed: completed QueryGeometry, C FK and existing query arithmetic/frame producer;
strict interval separation/intersection proofs and generic singleton exact dyadic
fallback. Original instance→descriptor and body→base transform ordering retained.
Forbidden: generation, rounded-world singleton claims, EPS patches, layer opacity
exemptions, volume inference, ray hits as surface-pair proof, endpoints as sweep,
IK/action/session/UI changes or new caches.
Boundary: `simulation/collision.ts`, `simulation/__tests__/collision.test.ts`,
API_SURFACES; minimal `simulation/ray-query.ts` shared forward/instance-frame
handoff and its direct regression file only. Existing ray inverse and predicates
retain behavior; collision does not duplicate quaternion/instance arithmetic.
Spec: static source surface-pair evidence and motion/quality clauses. Failure owner:
D source query rejects malformed/stale inputs; uncertainty remains its own reason.
Lifetime: one batch only, original issued source lifetime; no retained cache.
Gates: exact and uncertain source-pair cases, nested-volume counterexample,
actual C transformed/instanced and robot/dock pairs, zero generation/bounds scans,
FK/frame reuse, original ray suite, full app unit/type/lint/naming/build and review.

### D continuous translation surface pairs

Owner: `simulation/collision.ts`, extending the same source-pair evidence helper.
Inputs: issued current GeometrySource and clone-once source-bound triangle pairs,
starting synthetic robot pose, each pair's two finite world displacements, shared
closed [from,until] interval, and leaf/fruit state explicitly valid throughout.
Displacement means start→end translation at fixed orientation and common t∈[0,1].
Outputs: immutable swept-separated/swept-intersection/unknown with original pair
witnesses, reasons and work counts; supported contact fraction/time is an enclosure
of an occurrence, not earliest contact or an admitted pose.
Conditions: 0<=from<until finite; validFrom<=from and until<validUntil. All source
references/schema valid before work, source current before and before publication.
No instant-leaf-pose bypass, sampling-only separation or contact/body exemptions.
Allowed: existing source/forward-frame/FK preparation; complete static triangle
SAT axes including coplanar axes; shared query arithmetic; generic singleton
exact rational clipping. For nonpoint data, common outer possible interval empty
proves separation; common inner guaranteed witness proves intersection; otherwise
unknown. Zero/degenerate/uncertain axes never invent separation or intersection.
Forbidden: articulated FK interpolation, rotation, full-body/volume/contact
clearance, EPS, rounded-exact claims, geometry/cache/UI/session/action changes.
Boundary: `simulation/collision.ts`, `simulation/__tests__/collision.test.ts`,
API_SURFACES and current readiness docs. No ray/frame/arithmetic producer change.
Spec: continuous fixed-rotation source-pair sweep and motion/quality clauses.
Failure owner: D query admission rejects invalid/stale input; unresolved continuous
geometry stays unknown. Lifetime: batch only, no retained outputs or new cache.
Gates: continuous middle/brief/endpoint/coplanar controls, relative/common motion,
non-overlapping axis time windows, uncertain source transforms, validity/clone
and retirement, original static/ray tests, work counts, full app gates and review.

### D fixed-joints whole-source surface coverage

Owner: `simulation/collision.ts`, same source query helper; no session authority.
Inputs: issued GeometrySource, clone-once fixed-heading/start-joints pose and common
robot displacement, closed interval/validity, throughout leaf/fruit assumptions,
explicit empty-held or unknown retention, and nonnegative integer triangle budget.
Pair domain: every original robot part×every physical farm/dock instance, plus all
distinct robot-part pairs including same-body parts. No name/layer/contact bypass;
no self-triangle pairs within one original part. No omitted crate/tool/tire source.
Outputs: immutable inventory and queried/bounds-excluded/unvisited counts,
surface-intersections/surface-separated/unknown, explicit completeness, and at most
one original intersection plus one uncertainty witness. No motion-clear/volume/
contact approval. Unknown retention or partial work cannot produce separation.
Conditions: count domain before Cartesian traversal; safe exact integer counts or
atomic unsupported rejection. Whole closed interval validity; original source
current before work and publication. Budget limits predicate work, not truth.
Allowed: completed QueryGeometry local bounds and original buffers, existing C FK,
query forward frames and continuous source-pair predicate. One query-local placement
bounds product reuses original transforms, no source-sized world vertex copy.
Forbidden: AABB occupancy/contact, blanket self/support exemptions, partial-clear,
rotation/IK/session/action/UI edits, new geometry, persistent cache or unmeasured
BVH/index. Material containment/open shells/contact remain subsequent obligations.
Boundary: `simulation/collision.ts`, `simulation/__tests__/collision.test.ts`,
API_SURFACES and these current docs. No geometry/C/frame/arithmetic producer edits.
Spec: whole-source surface coverage plus motion/quality clauses. Failure owner:
D rejects malformed/stale/unsupported domain, retains uncertainty and unvisited
coverage. Lifetime: one query; source buffers retain original issued lifetime.
Gates: independent pair inventory, small complete source cases, actual C full
inventory/bounded profile, hidden layers/dock/tool/crate/tire, same-body contacts,
mid-interval/unknown/budget/retirement, one FK/placement reuse/zero generation,
static/sweep controls, full app unit/type/lint/naming/build and independent review.

#### D coverage original-region refinement

Same owner, input/output and allowlist as whole-source coverage above. Actual
source profiling measured 86,913,056 mesh-surviving triangle pairs; reusing existing
region bounds leaves 14,371,872 in 57,773 region pairs, with 794 unprepared regions
retained using mesh bounds. No new source/index producer is justified by this step.
Allowed: complete origin.regions spans, exact prepared-region identity lookup,
existing forward arithmetic and one query-local swept bound per placement/region.
Forbidden: omitting sheets without prepared bounds, relying on region names or
shape identity alone, rebuilding local bounds, persistent caches or changed
continuous predicates. Missing region bounds conservatively retain candidates.
Gates: passive actual-source profile, independent full domain accounting, mixed
prepared/unprepared region fixture, exact-touch non-exclusion, complete-query
relation equivalence, budget controls, original mapping/lifetime and work counts.
No material/contact permission or new movement output is introduced.

### D admitted synthetic quality assessment

Owner: observations.ts, consuming its own target admission once per request.
Inputs: the existing current ObservationContext and TargetReading, with required
independent quality.pedicel (intact/lost/null). Missing transient fields reject;
no persisted input migration or hardware protocol is introduced.
Outputs: original admitted observation, immutable per-dimension requirement results,
synthetic overall satisfied/not-satisfied/unknown and physical integrity unverified.
Conditions: current run/source/time/target and clone-once schema precede assessment;
known observed cultivar chooses applicable preservation dimensions, never C truth.
Unknown cultivar stays overall unknown; unrelated input fields are preserved.
A failed applicable requirement dominates other unknowns for a known cultivar,
without hiding their individual states. Original assumption/evidence identity stays.
Allowed: existing admit/currentness helpers and pure dimension interpretation.
Forbidden: A policy/query/source generation, session mutations, new ledgers/caches,
market grading, placement/action approval or inferred post-pick retention.
Boundary: observations.ts, direct observations.test.ts, API and these contract docs.
No session/contracts/C/material/collision/viewpoint/runtime/UI behavior changes.
Failure owner: observations rejects malformed/stale inputs; dependent action owner
continues to own all confirmation and movement requirements.
Gates: per-dimension independence, missing pedicel red, unknown cultivar, expiry/
context/clone-once, zero query/source/session work, existing observation controls,
app unit/type/lint/naming/build and independent review. No retained computation.

### D explicit joint-segment admissibility

Owner: simulation/motion.ts, a candidate-evidence helper, not the session.
Inputs: current issued GeometrySource and clone-once labeled synthetic start/end
five-joint values with finite 0<=from<until. No run, action or clearance receipt
is fabricated. Original rig.limits/speeds are the sole numerical authority.
Outputs: immutable original source/input, each joint's limit/speed checks and
admissible/invalid candidate status. QueryGeometry rejects unavailable rigs before source issuance;
this helper cannot accept a forged or unsupported replacement handle.
Conditions: q(t) scalar linear with no angle wrap; endpoints within limits and
absolute delta<=speed*duration proved with existing interval/dyadic arithmetic.
Malformed/time inputs reject before calculation; source current before/after work.
Allowed: original issued rig metadata and query-arithmetic finite dyadic/interval
primitives. No copied FK chain, numeric limits or speed defaults.
Forbidden: FK/query/source work, session/material/contact mutations, acceleration
policy, pose interpolation/command, TCP reach or complete sweep/clearance claims.
Boundary: simulation/motion.ts, `simulation/__tests__/motion.test.ts`, API and
these thin contract docs. No C/session/collision/arithmetic producer changes.
Failure owner: this helper rejects malformed/stale data and reports proven scalar
violations; future source/sweep/action owners retain their separate obligations.
Lifetime: one request, issued-source currentness; no retained cache or ledger.
Gates: five-axis exact/just-over limits/speeds, no-wrap, extreme finite arithmetic,
invalid/upstream-unavailable/stale/clone-once cases, zero FK/query/source work, full app
unit/type/build/lint/naming and independent review.

### C canonical FK algebra handoff

Owner: domain/robot-kinematics.ts, one private rotate/compose/about/body chain.
Inputs: original prepared rig and either existing numeric point joints or new
clone-once numeric domains with exact keys/finite ordered original-limit endpoints.
Outputs: unchanged point API bits/references; generic results over a caller's pure
scalar algebra, retaining original part/source/body ownership. New evaluateRobotDomains
uses range/literal/add/subtract/multiply/divide/sin/cos; it does not accept a new chain.
Conditions: new numeric-domain validation before any adapter callback; original
point validation/acceptance stays unchanged. Preserve original angle/2, operation
order, signed zero and fixed/shared transform references. No quaternion normalize.
Allowed: one C formula implementation and an original-number adapter. Adapter scalar
soundness belongs to its subsequent D numerical owner, not to this generic API.
Forbidden: D chain duplication, interval/trig proof claims, geometry/material edits,
new joints/limits/speeds, global rig registry, source cloning or runtime/UI changes.
Boundary: domain/robot-kinematics.ts, its direct robot-kinematics.test.ts and existing
snapshot fixture, API/spec/Inspector/plan/BDD. No D/arithmetic producer edits.
Failure owner: C rejects malformed numeric domains or propagates callback failure
without publication; current-source checks remain existing projection/query owners.
Lifetime: existing rig definition/source; no new retained expression graph or cache.
Gates: pre-edit Float64 point oracle (including signed zero), original source hashes/
references/rest reconstruction, singleton adapter equality, domain/failure/ownership
cases, existing rig/projection tests and full app unit/type/build/lint/naming/review.
This segment closes chain sharing only, not complete interval or movement evidence.

### Shared scalar arithmetic ownership

Owner: domain/scalar-arithmetic.ts, the single engine-neutral scalar computation
module. The established simulation/query-arithmetic.ts path remains a direct
re-export facade with unchanged public types and function identities.
Inputs/outputs: existing Interval/Dyadic and interval/add/subtract/multiply/divide/
squareRoot/dyadic/fractionInterval contracts and exact original Number behavior.
Conditions: move the entire implementation unchanged; only one copy of private
DataView/state and arithmetic functions exists. No wrapper or second implementation.
Allowed: C and D consumers can use the common domain owner; existing D imports
continue through the supported facade, without migration or deprecation.
Forbidden: changing any arithmetic/predicate, adding trigonometry/conversion policy,
changing C point semantics, source state, material/contact rules or query outcomes.
Boundary: domain/scalar-arithmetic.ts, simulation/query-arithmetic.ts, its existing
query-arithmetic.test.ts and API/Inspector/plan. Existing independent exact/ray/
collision/motion tests are regression gates, not mutation targets.
Failure owner/lifetime: original scalar failure and uncertainty behavior unchanged;
module scratch state remains synchronous/shared, with no new cache or lifecycle.
Gates: pre-move body hash/export inventory, exact body preservation, facade/shared
function identity, original independent arithmetic and consumer controls, full app
unit/type/build/lint/naming and scoped independent review. No new product capability
or numerical proof follows merely from moving this owner.

### Shared bounded polynomial scalar evidence

Owner: domain/kinematic-trigonometry.ts; exact binary64 conversion belongs to the
existing shared domain/scalar-arithmetic.ts, not a second dyadic engine.
Inputs: sin/cos kind and finite |x|<1 scalar, or clone-once finite ordered interval
with both endpoints strictly in (-1,1); converter accepts exact bounded rationals
and declared nearest-even/down/up mode. No source, rig or trajectory input.
Outputs: immutable rounded S19/C20 value or certified extrema bounds and per-call
work. Analytic error bounds are distinct from canonical polynomial rounding.
Conditions: fixed 20! coefficients/exact Horner, monotonic/extrema proof, exact
normal/subnormal conversion, signed zero, all temporaries <=24000 bits. Invalid
inputs fail before polynomial work; overflow conversion has explicit binary64
semantics, never a hidden approximate fallback. No Math.sin/cos error assumption.
Allowed: original shared dyadic decomposition, new exact converter and independent
formal rational/rounding/analytic bounds tests. Original query facade retains its
exact eight-function/two-type export list and unchanged functions.
Forbidden: C point switch, chain/normalization changes, interval FK/rotation sweep,
material/contact policy, scene/session reads or mutation, dynamic degree search,
result cache and unbounded BigInt growth.
Boundary: domain/scalar-arithmetic.ts, new domain/kinematic-trigonometry.ts, their
direct domain tests, `simulation/__tests__/query-arithmetic.test.ts` only for the
shared-versus-facade export assertion, API/spec/Inspector/plan. Existing consumers
and independent old numeric tests are regression gates only.
Failure owner: scalar admission/budget rejection; no partially published result.
Lifetime: immutable fixed coefficients reused as program constants; each call owns
its temporary work, with no retained result keyed by input.
Gates: permanent exact point/interval/rounding regressions before production, old
consumer arithmetic controls, independent direct-sum oracle, domain/±0/subnormal/
ties/overflow/extrema/analytic-error cases and clone-once rejection; four fixed
100-pose/800-evaluation profile batches (normal first/repeated, subnormal first/
repeated), 1s each and 10s overall, all temporary widths <=24000 bits. Elapsed guards
are cooperative, not synchronous-operation preemption. Then full app unit/type/
build/lint/naming and independent review. No C point or whole-motion closure.

Direct work handoff: roundFraction may report actual guarded temporary widths to
an optional synchronous read-only observer. Validate its function type before
work; exceptions abort publication. Each conversion keeps call-local arithmetic
state under reentry. Formal with/without bitwise equality, normal/subnormal shifts,
rounding temporary widths and observer failure prove this reporting boundary;
no conservative width estimate is mislabeled as measured work.

### C completed-pose affine handoff

Owner: domain/robot-kinematics.ts, over the existing completed point pose.
Inputs: original rig and original point joints/validation. Outputs: unchanged
completed pose, parts retaining source/body/transform identity with frozen affine
matrix/translation, work fk=1 and actual unique-transform conversion count.
Conditions: final raw quaternion plus unit scale only; reproduce installed Three
Matrix4.compose coefficient operation order, map column-major to row-major.
Each unique part.transform reference is converted once per call, including fixed
when present; matching parts consume the same completed affine object.
Allowed: existing one C chain and its point evaluation, original source references,
installed Three only as an independent direct-test coefficient oracle.
Forbidden: per-joint matrix-chain replacement, quaternion normalization, polynomial
point switch, changed old point/tool bits, renderer/runtime/D consumer migration,
material/contact assumptions or exact orthonormality/transpose-inverse claims.
Boundary: domain/robot-kinematics.ts, its existing direct test and snapshot only for
new evidence (never rewriting the original 56-pose oracle), API/spec/Inspector/plan.
Failure owner: original C point validation; no partially returned affine pose.
Lifetime: one completed pose/call, no cross-source registry or pose cache. Freeze
new containers only; retain original source/position refs without deep mutation.
Gates: missing-entry red; installed Three coefficient Object.is/Float64 comparison
for rest/limits/asymmetric/nondefault/±0; unchanged old point/tool/source oracles;
actual unique-reference work counts, same-frame reuse and zero source generation;
full app unit/type/build/lint/naming and independent review. This prepares a C
handoff only: no consumer adopts it yet, so no unified query/render authority or
interval/movement proof follows from these gates.

### D robot-body completed-affine query adoption

Owner: simulation/ray-query.ts prepareQueryAffineFrame/prepareQueryAffineInverse
and its existing simulation/collision.ts consumer. Inputs: current issued C geometry/rig, one C
completed affine pose per batch, original query intent and same currentness guards.
Outputs: existing body ray/surface evidence under C completed coefficient authority;
work fk/bodyMatrices forwarded from the actual C invocation, shared per-affine
forward/inverse frames. No second pose or source product is generated.
Conditions: exact singleton C binary64 coefficients and original position, existing
body→base/world order. Forward uses outward interval apply; inverse uses actual
matrix cofactors/determinant, with unresolved determinant retaining unknown.
Allowed: evaluateRobotAffinePose and its immutable affine identities, original
shared scalar operations and unchanged query predicates/lifetime checks.
Forbidden: body raw-q matrix reconstruction, per-joint chain, transpose inverse,
normalization, polynomial switch, material/contact exemptions, base/camera/farm/
instance changes or GPU/full-scene authority claims.
Boundary: ray-query.ts, collision.ts, their direct tests, API/spec/Inspector/plan.
The existing test-only source-hierarchy.ts may change only its direct robot-body
pose/frame input if required for the same authority; no index/tree/pruning change.
Failure owner: existing D invalid/source-retired/unknown paths; a supported outcome
change needs independent new-matrix source evidence, not fallback or snapshot edits.
Lifetime: one query batch/C affine pose; no result or frame cache across calls.
Gates: formal missing-adoption/work counter red, actual C/Three coefficients and
source-vertex enclosure, independent body ray/surface pair/witness, true inverse
and singular-uncertainty controls, affine identity reuse, one C call/actual work,
retirement and zero geometry/bounds generation. Preserve other transform and
numerical controls, then full app unit/type/build/lint/naming and independent review.
Do not interpret this fixed-pose adoption as articulated or material clearance.

### C polynomial point integration

Owner: domain/robot-kinematics.ts numeric sin/cos adapter. Inputs: existing rig and
validated numeric joints; each existing rounded half-angle. Outputs: the same
point/affine shapes under shared S19/C20 nearest-even scalar semantics. Conditions:
keep the single chain and every non-trig operation/association; no normalization.
Allowed: existing domain/kinematic-trigonometry.ts and scalar conversion products
without changing their implementation; actual read-only projection and D consumers
only as regression gates. Forbidden: runtime model flags, legacy fallback, D
predicate/base/camera changes, joint-interval proof, material/contact exemptions.
Boundary: robot-kinematics.ts, its direct test and existing snapshot, a permanent
robot-point-model.test.ts with its snapshot, API/spec/Inspector/plan/BDD. No other
production contributor is allowed. Failure owner: existing input rejection, scalar
resource rejection and unresolved consumer regressions; no partial publication.
Lifetime: call-local computation, no trig/pose cache or new shared mutable counters.

First freeze pre-switch 56-case numeric outputs and original hash/source evidence.
Test-only historical Math algebra must use the same chain, never duplicate it.
New formal evidence proves scalar integration, signed zero/subnormal half-angle
rounding, all approved limits, source/body mapping and identities, rest, Three
coefficients, exact global norm-bound recurrence and independent consumer outcomes.
Observe actual eight scalar calls/result work; full evaluateRobotAffinePose includes
point/tool/frame and matrix work. Four fixed 100-pose batches (normal first/repeated,
nonzero subnormal first/repeated) must each stay within 1 second, overall 10 seconds,
and every scalar temporary within 24000 bits. These are cooperative guards on a
prepared rig, not process-cold claims or hard preemption; never raise them to pass.
After focused correctness, run app unit/type/build/lint/naming and bounded review.

Current execution restriction: root has released the completed baseline and
authorized this one C point production integration and its frozen gates. Freeze
after completion; no joint-interval or further owner begins. The quota stop
instruction takes precedence over remaining gates.

### C joint-domain interval pose preparation

Owner: domain/robot-kinematics.ts, new evaluateRobotIntervalPose entry and private
interval algebra over the existing evaluateRobotDomains/single chain. Inputs:
original C rig plus closed numeric JointDomains. Outputs: original rig/source/body
references, detached domains, interval frames/tool/part transforms and final affine
coefficients, with actual call-local chain/scalar/trig/matrix work. This is point-
model set enclosure, not time trajectory or movement admission.
Conditions: validate/clone domains before any adapter work; preserve signed-zero
and half-angle subnormal rounding. Basic arithmetic uses the existing shared
scalar owner; trig uses boundPolynomialTrig. Generic final-affine extraction must
preserve every current number operation/order and source/translation identity.
Allowed: existing scalar and polynomial APIs unchanged, one generic C chain and
one generic final-affine formula; direct formal independent point/Three/rational
oracles. Forbidden: duplicated chain/matrix formula, Math trig with EPS, endpoint
interpolation, inverse-as-transpose, per-joint matrix product, D solver/runtime
wiring, world-space geometry copies, material/contact exemptions or pose cache.
Boundary: robot-kinematics.ts and its existing direct
test, new `domain/__tests__/robot-intervals.test.ts`, API/spec/Inspector/plan. Existing
scalar/poly tests and D consumers are regression gates, not mutation contributors.
Failure owner: existing domain/scalar rejection; unresolved intervals stay unknown
for subsequent consumers. Never clamp or publish a partial interval pose.
Lifetime: one call; original rig/source refs are not cloned/frozen incidentally.
Owned interval values and containers are frozen. Reuse final affine work by actual
transform identity, count converter execution rather than Map size. Source
retirement is checked by the eventual consuming owner, not a new C registry.

Gates: missing-entry red; singleton rest/limits/asymmetric/nondefault/±0 and
subnormal domains enclose actual point/affine outputs; interior domain samples
plus independent exact arithmetic/trig proof (sampling alone is not the proof).
Include zero-crossing trig extrema, rounded half-angle underflow, narrow versus
full approved boxes, source/body/reference/order preservation, malformed/sparse/
accessor clone-once rejection before scalar work, frozen outputs and no source
generation. Exact rest and singleton results must remain usefully bounded; no
blanket infinite enclosure. Numeric zero containment does not promise signed-zero
point-bit identity. No all-operation exactness is assumed at rest.
Predeclared tightness uses DEFAULT_ROBOT: both the rest singleton and the
nonzero singleton (lift=.02, yaw=.3, shoulder=-.4, elbow=.5, wrist=-.2) permit
maximum position width <=1e-10 metres and
maximum quaternion/tool-direction/affine coefficient width <=1e-10. Around that
same centre, each joint expanded by ±1e-6 has corresponding maxima <=1e-3 metres
and <=1e-3 dimensionless. Refinement to ±1e-7 must not increase either maximum
and must remain <=2e-4 in the corresponding units. These fixed test thresholds
measure enclosure usefulness; they are not runtime geometry/contact tolerances.
Current point/source/historical snapshots remain
unchanged. Count one chain, eight bound-trig calls, actual polynomial evaluations/
terms/maximum bits and unique affine conversions; no numeric point re-evaluation.

Fixed profile: one full approved box as a small control, then four batches
of 25 boxes (normal narrow and nonzero subnormal, first/repeated). Each batch has
200 bound-trig calls and at most 400 actual polynomial evaluations; retain 24000-
bit guards, 1 second per batch and 10 seconds total, cooperatively checked. Measure
all validation/adapter/chain/affine/work cost on a prepared rig, not just trig.
No parameter search or guard increase. After focused proof, run full app/type/
build/lint/naming and independent numerical review. Current authorization is
one C interval-pose implementation slice after root release of readiness commit
36ec0a102. Complete only its declared gates, then freeze and stop for root quota
review. No subsequent owner is authorized; a quota stop overrides remaining work.

### D joint segment point-time domains

Owner: simulation/motion.ts, JointSegments.enclose with one private exact point-
time producer. Inputs: current issued GeometrySource, original synthetic raw
JointSegmentInput, and numeric queryFrom/queryUntil/validFrom/validUntil. Outputs:
original source/admitted segment references, detached frozen window, its two
point joint tuples and closed JointDomains, with actual call-local exact work.
No C pose, source surface or movement authorization is produced.
Conditions: internally assess the raw segment once; consume its once-cloned input
only if admissible. The window is also cloned/validated once. An object containing
caller status/checks is not a substitute for this admission. Source currentness
is checked before work and after exact calculations, before result publication.
Allow a zero-length closed window; require finite nonnegative window/validity
values, validFrom < validUntil, segment containment and strict queryUntil < validUntil. Endpoint values preserve original ±0; interior rational
zero follows the converter's +0. Original ideal speed checks are not redefined.

Allowed: existing dyadic/roundFraction shared scalar APIs, exact finite-integer
assembly with checked pre-operation shifts/products, existing admission and source
read. Forbidden: duplicated converter, float ratio/duration interpolation, clamping,
Math/EPS patches, point/interval FK, mesh generation, C/scalar changes, session or
material/contact decisions, result caches or new current-source registries.
Implementation boundary: simulation/motion.ts and its direct
`simulation/__tests__/motion.test.ts`, API/spec/Inspector/plan. No other producer
may change. Failure owner: existing segment/source rejection, window schema/range
rejection and 24000-bit resource rejection; no partial publication. Returned
frozen evidence remains non-authorizing: the later consumer must perform its own
bound current-source admission rather than trusting a copied result.
Lifetime: one request; at most two distinct endpoint evaluations, shared when
queryFrom=queryUntil, five axes each. Preserve source identity, freeze only owned
containers, count actual rational conversions and temporary widths (including
shared converter work). No FK, bounds preparation or scene generation is allowed.

Gates: formal missing-entry red, independent exact rational point/domain oracle
for increasing/decreasing/constant axes, endpoints, subwindows, midpoint ties,
signed zero, subnormal and extreme finite times. Verify monotone endpoint-domain
proof separately from sampled containment. Include zero-length windows, segment
end admitted only with sufficient validity, validity endpoint rejection, future/
outside/invalid windows, inadmissible or forged-status segments, accessor source
retirement and clone-once mutation isolation. Preserve existing exact speed and
source lifetime controls. Fixed work bounds: at most two point evaluations and
ten scalar conversions per request; endpoint passthrough does not count as a
conversion. Fixed profile: 100 normal windows and 100 extreme/subnormal windows
on one prepared source, at most 1000 conversions per batch; 1 second per batch,
10 seconds overall and unchanged 24000-bit guards. Include complete admission/
conversion/domain/work cost; never raise guards or add a cache to pass. After
focused proof, full app/type/build/lint/naming and independent numerical review.

Root released readiness commit a06511279 for this one D motion enclose
implementation and its declared gates. Freeze and stop after completion for root
quota review. No source-affine consumer or subsequent owner is authorized.

### D robot source point-time affine bounds

Owner: new simulation/motion-bounds.ts, RobotMotionBounds.enclose. Inputs: original
issued GeometrySource, raw segment/window for internal JointSegments.enclose, and
explicit synthetic assumptions with nonempty explanation, base kind fixed-pose
with a complete RigidTransform, rigid-source-shapes throughout
and empty-held throughout. Missing/unknown/other modes reject; no implicit state.
Outputs: admitted domain evidence, original C interval pose/part and GeometryMesh
references, every robot mesh envelope and original region envelope, finite-bounded
or unresolved status, plus actual call-local work. No environment/pair/material/
contact/clearance output. All robot parts, including fixed, tool, crate and tires,
remain covered regardless of body identity or presentation visibility.

Conditions: source read before work; clone/validate assumptions once before FK;
internal segment/window admission once; C interval pose once using that source rig;
match parts to meshes by original part.source identity and verify body agreement,
never by shape/name alone. Reject missing/duplicate correspondence atomically.
Use original C interval affine matrix/position directly, then the fixed base frame
through existing prepareQueryForwardFrame/transformQueryPoint operation order.
Base admission uses collision's existing finite-slot and finite Math.hypot norm
condition with |norm-1|<=1e-12; validate every slot (including sparse-array holes)
on the detached input. No normalization, new trig or orthogonality assumption.
The same explicit base transform remains constant throughout the entire window. Only cached GeometryBounds
are inputs: eight corners per distinct (original affine identity, local bounds
identity); reuse mesh-envelope for unprepared regions. Lookup prepared regions by
original region identity and retain all original index spans. No scans or copies
of source vertices/indices, no point FK samples in production. Actual computation
counters increment at work execution; Map size alone is not an execution counter.

Allowed: existing motion, C interval, shared scalar and query forward/apply APIs
unchanged. Boundary: new `simulation/motion-bounds.ts` and
`simulation/__tests__/motion-bounds.test.ts`, API/spec/Inspector/plan. The direct
ray-query transform helper may receive a readonly type-signature clarification
only if required to accept C's existing interval frame; no arithmetic or other
query behavior changes. Forbidden: C/scalar producers, collision predicates,
region generation/index/BVH, base motion, held transforms, material/contact policy,
UI/session or a second source registry. Failure owner: source/admission/schema or
correspondence rejection; numerical nonfinite envelope remains unresolved, with
no partial public result before the final source read. Freeze only owned outputs.

Lifetime: one request, no cache across source replacement or window changes.
Expose nested original domain/C work and actual part/region/envelope/corner work;
FK=1, trig calls=8, actual C affine conversions unchanged, at most two point times
and ten rational conversions. Corner work equals eight times actual distinct
frame/bounds conversions; repeated parts sharing both references reuse output.
Source/bounds preparation and source vertex/index visits must remain zero.

Gates: missing-entry red; independent actual Three completed point-affine/source
vertices at window endpoints and interior times enclosed for rest/nonzero/narrow/
subnormal and nondefault robot inputs; independent interval proof remains the
soundness authority, sampling is regression only. Check all original robot meshes
and region spans, same-shape/different-region mappings, unprepared sheet regions,
source/body identity, frozen outputs, caller mutation/clone-once sparse rejection,
forged/stale sources and retirement during downstream work. Explicit moving
base/unsupported shape/held assumptions reject before FK. Include nonzero fixed
heading and near-unit admitted raw quaternion against the existing base frame
model; verify no silent heading-zero substitution. Arithmetic overflow remains unresolved.
Predeclared usefulness: DEFAULT_ROBOT rest and nonzero singleton at
(lift=.02,yaw=.3,shoulder=-.4,elbow=.5,wrist=-.2), base position [1,0,2] and identity quaternion, mesh envelope excess
beyond independent completed point affine local-box corner extrema <=1e-8 metres
per face. Same centre +/-1e-6 joint window: excess beyond the union of endpoint
point-box extrema <=1e-2 metres per face. These are test-only limits, not runtime
contact tolerances or a general correlation theorem. One full approved-domain
control must retain finite robot envelopes without claiming tightness.

Fixed profile: actual prepared DEFAULT_ROBOT source, four batches of ten complete
entries (normal narrow first/repeated and nonzero subnormal first/repeated), 80
bound-trig calls and at most 160 polynomial evaluations per batch; 1 second each,
10 seconds total and unchanged 24000-bit guards. Include admission, C interval,
all robot mesh/region envelopes and freezing/work costs; report actual counts and
no source rebuilds. After future focused proof, full app/type/build/lint/naming and
independent numerical review. Root released readiness commit 6432d959b for this one implementation and its
frozen gates. Freeze and STOP after completion for root quota review; no later
owner is authorized.

### D point-time surface domain exclusion - readiness

Owner: simulation/collision.ts, SurfaceQueries.coverMotion. Inputs: original
current GeometrySource, raw motion segment/window/robot assumptions and separately
once-detached environment request: source=synthetic, nonempty assumption,
shapes=source-shapes-throughout or unknown, poses=source-poses-throughout or unknown,
leaves=source-pose-throughout or unknown, fruits=all-attached-throughout or unknown. All declarations bind the same full closed query window, with
its existing half-open validity. Numeric maxMeshPairs/maxRegionPairs are required
nonnegative safe integers. Malformed environment input rejects; recognized unknown
environment state returns all domain unvisited/unknown without FK or source sampling,
with null motion evidence (no claim that unused raw motion inputs were admitted).
Known environment state delegates all raw motion/window/robot validation to the
internal RobotMotionBounds entry. Outputs: original source, detached environment
request, internally admitted motion-bounds evidence or null, complete safe-integer inventory,
excluded/candidate/unresolved/unvisited triangle counts and actual work. Status is
surface-separated only when excluded equals the entire domain; otherwise unknown.
No intersection/first-contact/time-of-impact, material or movement output exists.

Conditions: current source read before work and immediately before publication;
never accept caller-issued motion-bound/domain results. For known state call
RobotMotionBounds.enclose once; reuse every original robot mesh/region envelope.
Prepare environment geometry through the existing geometryFor path with no robot
pose request, preserving instance then descriptor order, zero displacement and
original prepared bounds. Original region identity controls lookup; missing sheet
region bounds use the existing whole mesh envelope, explicitly preserved in any
reported provenance. Unknown/nonfinite bounds never qualify for strict exclusion.

Inventory and original mesh-pair ordering have one shared producer inside this
existing coverage owner, consumed by both cover and coverMotion. A minimal private
extraction must preserve old cover outputs and work; do not copy its inventory
formula/traversal into a second implementation. All robot parts cross all physical
farm/dock instances, plus distinct-part unordered self pairs, without body/contact
exceptions. Count safe totals before any Cartesian comparison; allocate no full
pair array. Traverse original mesh order, then original region order. A strict
mesh exclusion accounts for its full triangle product; otherwise region products
partition it exactly. Each compared finite non-separated region product is a
candidate; a nonfinite one is unresolved. Remaining products after budgets are
unvisited. No triangle-pair enumeration or narrow predicate runs in this slice.
After the region budget ends, account the current mesh domain remainder by safe
subtraction of already classified counts, without visiting remaining region pairs.
Remaining mesh comparisons may still strictly exclude whole domains until the
mesh budget ends; account the rest from the global total without traversing the
remaining mesh Cartesian domain. Do not double-count or perform hidden comparisons.

Allowed: current motion-bounds/C interval products as consumers only, cached
QueryGeometry bounds and existing static environment frame/bounds arithmetic.
Boundary: collision.ts, its direct `simulation/__tests__/collision.test.ts`,
API/spec/Inspector/plan. No C/scalar/ray/motion-bounds/source producers may change.
Forbidden: index/BVH/new local bounds, source-buffer copies/scans, endpoint-only
separation, fixed-joint sweep substitution, session/runtime/material/contact edits.
Failure owner: existing source/request rejection, missing-state unknown and explicit
numeric/resource unresolved; no partial public publication. Original source/mesh/
region references remain unchanged; only newly owned records are frozen.

Lifetime: one call. Reuse original robot envelope output and each environment
placement/local-bounds product, with original descriptor/instance frame identity.
Expose actual nested motion/C work, mesh/region comparisons, environment bounds/
corners/frames and zero narrow-triangle work. No second robot FK and no cross-call
cache. Budget values count actual comparison executions, not attempted or skipped
pairs; no counter based solely on cache size.

Gates: formal missing-entry red; independently enumerate a small complete original
triangle-pair domain and prove category partition/count conservation for two joint
windows and fixed nonzero base poses. Exact interior-window overlap must remain
candidate/unresolved even when endpoints are separated; touch/coplanar and same-
body pairs cannot be excluded by a blanket rule. Include complete separated,
finite-overlap candidate, nonfinite unresolved, empty domain, zero/exact budgets,
partial budgets and unknown/expired window assumptions; no incomplete result can
report separation. Actual C farm/dock/film/net/leaves/soil/robot part inventory must
match original sources, including multiple instances, unprepared sheets and
same-shape different-region mappings. Verify getter clone-once, forged/stale source,
retirement during work, caller isolation and zero source vertex/index generation.
Preserve all existing cover/ray/static/translation controls without new predicates.

Fixed cost gate uses the existing actual C coverage-profile source and its canonical
inventory (43,429,284,640 triangle pairs), a rest singleton and a centre +/-1e-6
joint window with explicit fixed base, budgets 300000 mesh comparisons and 10000
region comparisons each. Each complete entry stays within 1 second, combined
10 seconds, and original 24000-bit limits; do not raise budgets/guards after a
failure. Report total/excluded/candidate/unresolved/unvisited, actual mesh/region
work, environment preparation and nested C costs. No claim of full narrow coverage
or speedup follows from candidate reduction. Future focused proof precedes full
app/type/build/lint/naming and independent review. Current authorization is three-
doc readiness only: freeze and STOP for root quota review; no implementation.

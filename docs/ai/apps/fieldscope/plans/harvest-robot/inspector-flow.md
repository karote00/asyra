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

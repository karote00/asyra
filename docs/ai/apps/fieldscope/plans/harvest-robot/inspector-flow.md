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
Outputs: canonical robot/mission settings and scoped derived UI values; one edit
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
`domain/crop-models.ts` (source partitions/metadata, near/distant correspondence),
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

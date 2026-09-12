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
Inputs: robot/route/patrol edits; validated farm configuration; completed A reports.
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
Boundary files: domain/robot-configuration.ts, runtime/robot-workspace.ts,
runtime/bootstrap.ts, ui/robot-editor.tsx, ui/workbench.tsx, locale catalogs and
their formal tests. Registered settings type: robot-configuration.
Derived reports live until the next relevant canonical edit; reads do no work.
Failure owner: B owns validation/history/replacement; A owns assessment reasons.
Cache dimensions: none proposed.

## C - Robot, crate and fruit projection (M2; fruit states remain M3)

Owner: app render projection, engine consumes admitted spatial products.
Inputs: canonical admitted robot definition, mission settings and completed
simulation poses/fruit states; existing farm spatial output stays separately owned.
Outputs: dimensioned concept geometry and state projection through SpatialLayer.
Conditions: pose updates alter transforms only; definition changes replace affected
geometry. Blender exports, if used, must match canonical dimensions and ownership.
Allowed: completed robot geometry/pose products, existing spatial admission/engine.
Forbidden: perception decisions, harvest success inference, force/soil conclusions,
rebuilding cultivars per tick or private diagnostic geometry as product output.
Boundary: render-app/robot-projection.ts, domain/robot-model.ts, runtime/bootstrap.ts
composition, formal geometry/runtime/browser tests and canonical Blender export.
Spec: C - M2 dimensioned concept projection. focusRobot is presentation-only through
the existing camera Feature. Fruit projection remains deferred to M3.
Definition geometry lifetime: width/length/height/tool; dock position is a transform.
Route projection lifetime: completed lane report. No crop preparation.
Failure owner: projection/admission failure is visible; no substitute safe geometry.
Cache dimensions: none proposed; topology lifetime is the robot definition.

## D - Deterministic simulation (M3, not implemented)

Owner: app simulation session.
Inputs: admitted mission, completed A reports, explicit observation adapter outputs,
simulation clock and synthetic contact/cut/retention confirmations.
Outputs: finite-state transitions, pose intents, target inventory and crate ledger.
Conditions: no overlapping runs; stale/missing evidence interrupts action; emergency
priority wins. Cancellation/disposal prevents late writes. No path around B admission.
Allowed: A advisory policy, declared observation adapter, canonical mission snapshot.
Forbidden: hidden fruit truth as perception, hardware side effects, implicit wall
clock scheduling, auto-restart after fault, arbitrary leaf/crop pass-through.
Boundary: app simulation modules and formal scenario/session tests; concrete state
schema and observation contract must be ready before implementation.
Spec: future user-facing contract and Gherkin acceptance cases.
Failure owner: simulation session retains unresolved/fault state and reason.
Cache dimensions: none proposed.

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

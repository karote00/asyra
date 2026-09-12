# Harvest robot and crate logistics

Status: IN PROGRESS
Started: 2026-09-12 (Asia/Taipei)
Base: origin/main at `4144a25d7`
Worktree: `.worktrees/fieldscope-harvest-robot`

## Bounded objective

Develop a realizable greenhouse harvesting concept and implement it incrementally
in FieldScope. This is not a promise that simulated motion proves successful
harvesting or machine safety. First deliver a tested feasibility domain; then
compose mission editing and robot/crate projection through Core. Subsequent
milestones require measurements and physical tests before actuation.

Authorized scope: `apps/fieldscope` and its app documentation, tests and existing
build/test tooling. No Framework changes, added dependencies, hardware purchases,
controller connection, automatic deployment, publication or changes to other apps.
Discovery: existing layout/support/crop owners, current Core composition APIs,
primary harvesting research and manufacturer specifications. Later review stays
within this diff and its direct consumers. Do not port Sim's analysis engine.

## Product and architecture

- [Product contract](/docs/ai/apps/fieldscope/specs/harvest-robot.md)
- [Hardware concept and field trials](/docs/ai/apps/fieldscope/specs/harvest-hardware.md)
- [Owner flow](/docs/ai/apps/fieldscope/plans/harvest-robot/inspector-flow.md)
- [Scenarios](/docs/ai/apps/fieldscope/bdd-features/harvest-robot.feature)

## Milestones and dependencies

### M1 - Feasibility and conservative operating rules

DONE - [stage closeout](/docs/ai/apps/fieldscope/plans/completed/harvest-feasibility/plan.md).

Implement owner A: straight-lane geometry screening from the existing layout,
vehicle envelope and measured/unknown ground admission; payload, box-change and
quasi-static lateral reserve calculations; battery/return-energy admission;
conservative hazard arbitration.
Use explicit SI inputs and return reasons, never a certified-safe flag. Prove
30 cm drains, central shared-column obstruction, plant-row clearance, insufficient
headlands, missing survey, growing payload and tip/obstacle/contact priorities.
Deliver formal domain tests, app typecheck/lint and existing app regression tests.
This is a headless engineering foundation, not yet a visible or moving robot.

### M2 - Editable robot and mission workspace

IMPLEMENTED - local acceptance passed; PR integration is a separate gate.

After M1, implement B then C: Core-owned robot/mission settings (footprint, tool,
crate, route lane and longitudinal interval, one-side/both-side scan choice,
patrol period, battery capacity/energy budget, charge station). Project a dimensioned base, folded/working
mast and arm (working pose and session controls follow in M3), camera, latched crate and end exchange station. Label concept
geometry and show unresolved route restrictions. Use existing icons, units,
locale catalogs and immediate editing with Undo/Redo. An invalid edit cannot
silently clear a stop or start physical motion. Editing invalidates a simulation
run; real-world events are append-only and never undone.

DoD: runtime transaction/history and localized subscription tests; camera/locale
changes build no robot/farm geometry; robot pose updates rebuild no crop meshes;
route/robot edits invalidate only their own outputs; bilingual desktop/mobile
visual review with the existing farm loaded. No success based only on overview.

### M3 - Deterministic patrol, picking and crate simulation

Implement D and C's pose projection. A configurable closed simulation clock drives
finite route segments and scan checkpoints, not wall-clock UI frames. Missed
periods coalesce to one pending patrol; no overlapping runs or burst catch-up.
Model look/reobserve/defer/approach/support/cut/verify/place, stable fruit identities,
per-fruit state transitions, crate mass/volume/damage exclusions and return/exchange.
Scheduled patrol requires an admitted return path, available charging dock and
energy reserve. Include return-to-charge/dock/charge/undock states, stale SOC,
blocked dock and charger faults; no motion while charging. No connected
hardware. Simulation observations must be explicitly injected or derived by the
observation adapter, never read hidden-fruit truth as a successful detector.

DoD: executable scenario tests, cancellation/replacement tests, deterministic
replay, conservation of picked/held/boxed/dropped fruit and payload; impossible
cuts/paths remain unresolved; actual close-up arm/net/box visual review. Collision
queries must include the tool, carried fruit and moving leaves; no teleporting
through net strands. Physical damage must remain unknown without a calibrated
contact model, regardless of visual overlap.

### M4 - Bench sensing and crop-specific end effectors

Build only after measured dimensions, budget, component selection and separate
hardware authorization. Start with a fixed guarded bench, dummy loads and disabled
blade. Validate camera calibration, lighting, stem discrimination, repeatability,
force/torque and jaw-pressure limits, tool retention, safe power-loss behavior,
food-contact cleaning and crate bruising limits. Use a support-and-cut cucumber
head and a separate small-fruit padded head for individual Yu-Nu tomatoes.
Evaluate picked fruit immediately and after storage for hidden bruising. Do not
infer acceptable force from another cultivar or soft gripper advertising.

### M5 - Ballasted mobile platform, then supervised harvest

Before crops: loaded braking, slope, asymmetric sinkage, traction, recovery,
headland turns, obstacle protection, stop distance, watchdog and emergency stop
on the intended prepared surface. Then greenhouse trials with operators outside
the protected area and mechanical blade guarding. Validate full harvest plus box
exchange with 0%, 50% and 100% permissible payload. Expand one crop/row/condition
at a time; keep precision/recall, damage, lost fruit, false-safe, recovery and
cycle-time measurements with environmental context. Limits must be approved from
measurements, not copied from simulation defaults.

### M6 - Optional separate carrier and controlled fleet operation

Only if M5 logistics data show onboard crate return dominates duty time. Test a
braked docked carrier first at headlands; do not make an unbraked free-following
cart the initial design. Prove coupling, drawbar load, off-tracking, reversing,
jackknife prevention, heartbeat loss and loaded recovery before in-row use.
Independent powered followers need their own localization, obstacle protection,
reservation, stopping envelope and loss-of-contact behavior. Hardware/operation
acceptance remains a separate milestone; app plan completion is not certification.

## Current execution

M1 was closed and merged as PR #191 after all eight current-head CI checks
passed. M2 is implemented in its new worktree: Core-owned robot/mission editing,
history, conservative reports and dimensioned projection, with canonical Blender
review. Local acceptance: 246 app tests, 23 browser regressions, typecheck, lint,
naming and 17 build tasks passed. The final mobile control copy and settled
screenshot check receive a focused repeat. M3-M6 remain planned; no active patrol,
harvested inventory, physical observation or motor connection is delivered by M2.

## Stop and review boundaries

Stop unsafe/unknown operation in the product, rather than fabricating clearance,
soil capacity, visibility or grip success. Stop implementation for a contract
conflict or needed out-of-scope owner/dependency. Replan a bounded owner after
repeated failed iterations. No claim of a working real harvester until physical
acceptance evidence exists. Hardware purchasing, deployment and actuation require
separate authorization. Preserve unrelated servers, worktrees and user changes.

### M1 execution card - A feasibility domain

- Spec: harvest-robot sections A feasibility, crate/load, energy admission and
  hazard policy; Inspector: step A and its complete input/output contract.
- Inputs: validated farm configuration, stowed envelope, lane/survey, mass/CoG,
  battery budgets and explicit hazard flags. Outputs: reports/advisory actions only.
- Allowed: existing layout/plant-row/root-offset owners and deterministic arithmetic.
  No bypass; reject invalid numbers and retain unknown measurements.
- Forbidden: UI/Core writes, crop generation, Three, clocks, network and actuators.
- Files: the four `domain/harvest-*.ts` modules named in A and their formal tests.
  A owns errors. No cache; two bounded layout passes and one row preparation per lane call, never per plant.
- Cases: M1-tagged Gherkin plus invalid numbers, geometry changes, caller isolation,
  growing payload, combined hazards, SOC uncertainty and exact reserve boundaries.
- Gates: focused Vitest, naming, app typecheck/lint, existing app unit regressions
  and filtered build. No visual claim or browser change in this domain-only step.
- Stop: spec conflict, outside owner dependency, failed work-count isolation or
  unsafe inference. M2 starts only after its own schema/flow readiness review.

## M2 execution contract - 2026-09-12

Worktree: `.worktrees/fieldscope-robot-workspace`, based on merged PR #191.
Scope is B then C above, app-only plus direct docs/tests and a software Changeset.
No hardware, M3 execution, Framework changes, dependency additions or deployment.
Discovery is limited to current app/Core APIs and direct consumers. Gates are the
M2 acceptance section; stop for a contract conflict or needed external owner.

Step B card: consume admitted farm and robot edits; produce validated canonical
settings and A reports via a priority-100 exclusive one-shot Feature. Unknown
survey/evidence remains unknown, replay bypasses edit dispatch, invalid input does
not write. Allowed contributors: Core SceneTree/Props/session/transactions and A.
Forbidden: React canonical state, Three, physical commands and crop builders.
Files and failure ownership are Inspector B. Cases: invalid/no-op edits, concurrent
patches, undo/redo, changed farm lane, disposal, zero farm builds for robot edits.
Gates: domain/runtime tests, naming, typecheck. Stop on any B contract mismatch.

Step B review: 11 domain cases and the real-Core runtime sequence passed;
concurrent patches, rejected/no-op writes, history replay, removed route, disposal
and no farm rebuild on robot edits are covered. Naming and typecheck passed.
App lint passed after replacing empty test callbacks. No physical evidence invented.

Step C card: consume B's admitted definition and completed lane report; produce
engine-neutral robot/dock/crate meshes and candidate route through SpatialLayer.
Geometry lifetime follows width/length/height/tool; position changes are transforms.
Camera and locale consume existing outputs. Allowed contributors: TriangleBuilder,
spatial admission, registered layer, existing camera API and canonical Blender export.
Forbidden: clearance recomputation, crop builds, simulation success and motor output.
Boundary/failure owner: Inspector C files and direct UI focus consumer. Cases:
stowed bounds, open crate, distinct tool, missing/blocked route, topology work counts,
bilingual desktop/mobile history and close-up screenshots. Gates: geometry/runtime
unit tests, typecheck/lint/build, browser review. Stop on owner or geometry mismatch.

Step B correction card: the runtime overflow regression proves assessment failure
could occur after the settings transaction. Same B inputs/outputs/boundary; perform
A admission before committing and publish that completed report once. Invalid
arithmetic must leave canonical state and history untouched. No C or hardware
changes in this segment. Gate: failing runtime admission regression then full B test.

B correction review: the overflow case now rejects before mutation; the complete
runtime sequence passes. Resume C's card for viewport fit integration and settled
animation screenshots, plus B's editor consumer for compact assessment disclosure.
Inputs, contributors, boundaries and exclusions remain unchanged. Fit must include
the parked equipment at its authored coordinates without rescanning farm geometry.

C final integration card: a farm-edit regression measured two full frame
submissions. Consume the completed farm and robot report once and submit one
composed frame from bootstrap; no extra model cache or changed output. Same C
allowlist and exclusions. Gate: failing frame-count assertion, then runtime and
configuration browser tests; no other owner expansion.

## M3 software goal and readiness slice - 2026-09-13

PR #194 completed M2 and merged into main at e34b4f6bc after all eight CI checks
passed. Work now continues from that main in `codex/fieldscope-simulation-goal`
at `.worktrees/fieldscope-robot-workspace`, with draft goal PR #196; prior goal
contracts and B correction
were retained. The remaining software goal is M3 deterministic patrol, picking
and crate simulation.
M4-M6 retain their physical-evidence prerequisites and remain planned; this goal
cannot close the full hardware plan. The goal PR must not merge into main under
this task's authorization. The coordinator owns Git and PR operations.

D readiness card: clarify the existing M3 behavior before production edits.
Sources are M3 above, product contract D and Inspector D. Inputs are admitted B
mission/A reports, explicit synthetic observations/confirmations, completed scene
products and a closed clock. Outputs are the session/observation/motion-admission
contracts and executable scenario requirements. No bypass of admission, no
hardware, no hidden-fruit detector or wall-clock scheduler. Only this plan,
Inspector, harvest-robot spec and its BDD cases are edited in this slice. Gates:
naming baseline/final, scoped formatting/diff review and independent contract
review. Stop on a new product decision, contradictory authority or external owner.

C crop source preparation and synthetic working-rig/FK handoff are complete.
Continue with D admission, deterministic scenario proofs and real Core lifecycle
wiring against those completed sources. D schema design can precede C, but an
independent synthetic shape model cannot substitute for the actual scene.
C working-pose/fruit disposition integration and B/UI controls follow separate
owner cards after D passes its focused gates. End-to-end M3 closure requires the
whole M3 DoD, including close-up collision/fruit evidence and a usable normal UI;
headless states alone are not milestone completion.

### B correction card - canonical strip identity

Independent M2 review identified a nonterminal selected-strip deletion redirecting
the mission to the next occupant of its array index. Existing runtime regression
must fail before production correction. Source: configuration canonical strip
identity and harvest-robot B; Inspector B owns the farm/mission handoff. Inputs:
validated strip IDs and mission stripId. Output: unchanged binding resolved to A's
current ordinal, or an explicit absent/invalid lane. Admission rejects missing or
duplicate IDs before mutation. Default/Add producers create IDs; replay preserves
them. Forbidden: inferred identity from order, substitute routes, private caches,
a second canonical model, disk migration or A geometry changes. Only B's listed
schema/runtime/editor consumers and direct formal fixtures/tests may change.
Cases: selected nonterminal deletion, preceding deletion, reorder, undo/redo,
missing/duplicate IDs, defaults and Add. Gates: red regression, focused domain/Core
runtime/editor proofs, naming, app typecheck/lint/unit and relevant browser/build
checks. Stop for a contract conflict or a required out-of-scope owner. This B
correction completes before beginning D production implementation.

### C readiness card - canonical scene handoff before D consumption

Sources: product contract C M3 scene identity/geometry, D observation/collision
and M3 DoD; Inspector C. Inputs: canonical farm/robot definitions, existing
cultivar/planting generation and completed installed scene geometry. Outputs:
immutable scene revision, scene-local plant/fruit identities, exact source-shape
partitions/attributes and transforms. Same source shapes serve rendering and D
adapters. Near/distant geometry shares target identity. Conditions: preparation
belongs to the scene lifetime; no bypass through a new generator, simplified
primitive, hidden layer or private diagnostic mesh. C owns invalid partitions,
identity collisions and stale scene handoffs; D later owns observations/actions.

This readiness slice edits only harvest-robot spec, Inspector, plan and BDD.
No production changes until B identity correction passes its complete gates and
independent C readiness review passes. The next implementation slice stays within
Inspector C's preparation allowlist. D schema design may precede preparation, but
real scene preparation/handoff must precede D adapter integration; independent
headless shapes cannot stand in for the real scene.

Formal oracle: record source-owned vertex/index ranges during the existing single
botanical generation, then reassemble partition buffers by original offsets.
Assert exact equality to the unpartitioned canonical model's near/distant arrays,
including vertex color/UV arrays when present and material association; assert
nonoverlapping complete source triangle coverage. Shared tube boundary vertices
retain original indices and are reconstructed once, not changed to satisfy a
vertex-exclusivity assumption. Reuse the same seeded canonical output,
not copied generator formulas or a second simplified expected mesh. Across plant
instances, prove identity uniqueness, rotated installed placement and identical
near/distant identity; on retirement prove old handles cannot serve a successor.
Add preparation/caller work counts alongside output equality. Keep existing crop
shape/detail/surface/texture and support/net vertex oracles unchanged.

Gates: naming baseline/final, focused source-partition/identity/lifetime/work-count
proofs, existing crop/geometry/runtime regressions, app typecheck/lint/build,
scoped browser baseline plus close-up source-fruit review. Stop on lost botanical
fidelity, missing source owner, a needed dependency/Framework change or a conflict
with D motion/evidence admission. Full M3 still requires the normal UI synthetic
scenario/clock/evidence flow and later D/C integration acceptance.

C implementation card: B is accepted at bc781c7a8. Preserve original near/distant
source geometry with a permanent pre-edit full-variant geometry/material hash
oracle, in addition to exact partition reconstruction. Fruit calyx/star detail
receives hairs after fruit generation; the direct crop-hairs helper may expose
optional source-triangle/generated-range provenance without changing its formula,
iteration order, density or output. The corresponding direct test proves geometry
with/without observation is identical. C assigns those late ranges to their source
fruit. All other C boundaries, gates and exclusions above remain unchanged.

C crop-retention refinement: preserve cucumber fine-spine geometry and tomato
calyx/distal pedicel, including hairs generated from those source triangles.
Tomato's existing final pedicel segment is fruit-owned; its proximal source stays
plant-owned. The boundary is synthetic, not an anatomical AZ or verified Yu-Nu
node. Original near/distant geometry/material hashes remain fixed. Test shared
boundary indices, retained target detail and unmoved proximal/neighbor triangles.
No contact coefficient, spine retention rate, damage proof or new cut cap is
introduced. D later requires explicit action/anatomy evidence; ordinary source
metadata is not successful perception. This direct refinement was independently
reviewed before production edits.

C source preparation completed on the simulation goal branch. Original geometry
and material hashes for all 40 cultivar variants and both detail levels remain
unchanged. Formal tests prove source triangle ownership, late hair provenance,
immutable installed identities, scene retirement and bounded generation; empty
plant populations perform no cultivar generation. Independent code review passed.
Final gates passed: 260 unit tests, typecheck, lint, 11 naming checks, 17 build
tasks and nine ordinary greenhouse/crop browser cases. Author screenshot review
and an independent review of cucumber and young/ripe tomato detail at 10000%
zoom used the live app at http://127.0.0.1:5178. Source geometry retention is
verified; physical contact quality is not. D execution, working-arm articulation
and harvested-fruit projection remain subsequent owner steps.

### C working-rig source card - approved five-DOF concept

User decision: lift +/-0.10 m at 0.02 m/s; shoulder yaw and elbow +/-90 degrees,
shoulder/wrist pitch +/-60 degrees, each at 10 degrees/s. The concept is synthetic
and may reject unreachable targets; it is not a hardware capability claim.
Source: spec C synthetic working-arm and Inspector C working-rig source handoff.
Inputs: original definition/source parts and valid same-revision joint values.
Outputs: exact rest frames, one rigid owner per part, limits/speeds/TCP and pure
candidate FK transforms. Full carriage-stroke admission precedes rig availability.
No new geometry design, D state, live motion UI, IK fallback or inferred physics.
Files: Inspector C working-rig allowlist; no crop owner changes in this segment.
Naming: neutral app-local transient rig/joint identities, no persisted migration.

Test-first: freeze current source hashes (both tools, default/nondefault dimensions)
before any production edit. Add failing joint/frame/ownership/lift/retirement and
work-count cases; implementation must preserve those original hashes. Zero FK
keeps source vertices unchanged and produces identity rigid transforms. Limits
are kinematic input boundaries, not collision admission. D's later clock/action
slice owns rate checks using the approved per-joint speeds, with no new acceleration
assumption. Gates: focused domain/projection/runtime proofs, naming, app unit,
typecheck/lint/build, existing bilingual desktop/mobile robot browser checks and
close-up source review. Stop on an unresolved source frame, new DOF/tool parameter,
necessary out-of-scope owner or changed canonical mesh output. Independent
readiness review precedes production; independent code review precedes advancement.

C working-rig source completed: original geometry/material hashes for both tools
and two nondefault dimensions remain exact. Formal joint/pivot/lift, immutable
source, retirement and work-count proofs pass; 268 app unit tests, typecheck,
lint, naming, 23 build tasks and all five bilingual desktop/mobile robot browser
cases pass. Source and readiness received independent review. Four live images,
including the parked robot close-up at 853% zoom, were inspected at
http://127.0.0.1:5178. FK is candidate-only; D admission, interval motion and normal
harvesting UI remain next, and M3 is not complete.

### B completed-route handoff card

Before D admission, expose B's already resolved positional A route with its
completed design report. B remains the sole stripId-to-ordinal owner; D reads this
result when submitting fresh synthetic survey evidence to A. Spec B workspace and
Inspector B are the authorities. Inputs and canonical state are unchanged; output
is a detached immutable `route` or null alongside the existing lane report. Missing
identity or invalid interval yields null, without substituting another route.
Only domain/robot-configuration.ts and its formal test change in production;
API_SURFACES describes the handoff. No A algorithms, runtime, UI, geometry or D
production changes. Cases: shared route, reorder/preceding deletion, selected
deletion, shortened farm, output immutability and original settings unchanged.
Gates: formal red/green, naming before/after, app unit/typecheck/lint and focused
independent review. Stop if the handoff needs a changed lane rule or another owner.

### D admission contract card

Owner: Inspector D admission, before session clock/actions. Sources: spec D
session/evidence/motion clauses and completed B route/C scene/rig handoffs.
Inputs: a completed canonical mission tuple (revision, B report, farm snapshot,
C scene and robot source handles), explicit simulation time, synthetic dispatch
evidence and a composition-owned movement-query dependency. Outputs: detached
immutable mission/evidence, fresh A lane/load/energy reports and an explicit
accepted/held decision with reasons, never a partial run. A composition-issued canonical receipt and identity/currentness
predicate bind the B report, farm and sources from the same completed update.
C handles retain their
original owner identity; current-source checks cannot use copied/revision-only
lookalikes. No source regeneration, second strip resolver or canonical writes.

Only simulation/contracts.ts and `simulation/__tests__/contracts.test.ts` are
production/test boundaries; API_SURFACES may document implemented contracts. A/B/C
owners, session transitions, runtime Feature wiring and UI stay unchanged here.
The movement provider is a required downstream dependency over actual completed
C geometry; no default clear provider or user-supplied clearance boolean. Unit
fixtures may substitute it explicitly, but cannot close integrated dispatch. Its
real collision owner/card precedes ordinary UI Start enablement. Session clock
follows this admission slice; observation, exact motion and Core lifecycle then
compose against the same sources before C/B motion UI.

Validity is [validFrom, validUntil), with finite nonnegative times and
validFrom <= observedAt <= now < validUntil. Identity/revision/time failures
reject before A or geometry work. A screens run once per admitted dispatch intent,
not on reads. Requests are constructed from canonical dock -> route start -> end
and route end -> dock, with purpose, zero joints, usable rig and explicit bounded
query intervals; caller-selected/empty requests cannot replace that coverage.
Dispatch acceptance requires screened lane, continuing energy/load,
known compatible crate/tare/latch/dock and complete bound movement results; all
other results stay held. Evidence never silently refreshes when a clock advances.
Gates: missing/wrong/expired/future/nonfinite cases, exact validity edges, caller
mutation isolation, fake/retired C handles, invalid B route, fresh A reports while
B remains unknown, blocked/unknown/missing/empty/wrong-purpose/wrong-route movement, stale canonical
receipt with current C handles, unavailable rig/nonstowed evidence, zero preparation work and
deterministic immutable results; formal red/green, naming, app unit/type/lint and
independent review. Stop on an absent owner input, changed canonical policy, or
need to invent physical parameters. This slice cannot claim M3 completion.

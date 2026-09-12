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
zoom used <a href="http://127.0.0.1:5178" target="_blank" rel="noopener noreferrer">the live FieldScope app</a>. Source geometry retention is
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
<a href="http://127.0.0.1:5178" target="_blank" rel="noopener noreferrer">the live FieldScope app</a>. FK is candidate-only; D admission, interval motion and normal
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

D admission source contracts completed with independent code review. Tests use
actual C farm/robot sources and explicit query doubles, preserving B's unknown
design report. Initial five missing-contract cases failed before implementation;
forged prepared identity, discarded blocked reasons and reversed/overlapping
query intervals also have formal red/green evidence. The full app suite passed
278 tests; after adding the real unavailable-rig rejection case, all ten focused
admission cases passed. Typecheck, lint, naming and scoped formatting pass.
No session, real swept provider or ordinary UI Start is wired by this source
slice. Next: D session clock/lifecycle against issued admission products, then
real observation/motion providers and Core composition before motion UI closure.

### D session clock foundation card

Owner: D session transitions, after completed admission contracts. Inputs: an
composition canonical receipt (prepared internally with prepareMission) and
current-source owners, required dispatch query and
resume-admission providers, explicit generation-bound intents and simulation
seconds. Outputs: immutable lifecycle/run/clock/schedule snapshots and ordered
transition evidence, with one run and at most one pending patrol. Start accepts
only dispatch evidence and synchronously invokes/consumes admitDispatch itself;
caller-provided accepted decisions are not an input. Cancel/replace/dispose close
the prior generation before any successor can accept queued work.

Boundary: simulation/session.ts and its formal session test only; API_SURFACES may
document the implemented API. No source, admission-policy, runtime Feature, UI,
observation or collision-production edits. This foundation owns lifecycle/time;
actual route/fruit/tool progress, completion/fault actions and their confirmations
remain later D action work. Its initial pose is the admitted stowed dock pose,
held inventory is empty, and the remaining dispatch request is retained. Clock
advancement records active elapsed time but creates no completed physical movement.

Pause preserves pose, retained transforms, operation and remaining intent. Explicit
paused clock inputs advance scheduling/expiry only. Resume uses a separate required
current-state provider, bound to the immutable paused snapshot, run/generation,
canonical receipt/current C handles, now, pose, retained offsets, remaining intent
and fresh run-bound evidence. It cannot reuse a pre-run dispatch result or invent
a dock pose. Accepted matching results resume the same run without motion/reset;
held results do not unlock it; a provider fault enters faulted state. Acknowledging
a fault returns only to paused, retaining reasons and requiring a new explicit
Resume admission. A pending result becomes stale after another
snapshot/generation/source change. Providers have no default clear implementation;
clock tests use explicit doubles, and UI remains unwired until real providers exist.

First Start anchors patrol deadlines. Crossed busy/paused deadlines coalesce to
one pending flag; no automatic second Start, catch-up burst or evidence renewal.
Cancel/replacement stops the old schedule. All external intents carry the snapshot
generation; old queued intents cannot target a successor. Replacement/disposal
are synchronous internal composition lifecycle calls, not queued external intents.
A successor is validated before retiring the old run; a duplicate current receipt
is a no-op and invalid/stale receipts leave the prior valid state unchanged.
Reads reuse completed
snapshots and transition products; no accumulated-log copying per tick, A work on
read/clock, geometry preparation, wall timers or requestAnimationFrame scheduling.
Gates: formal red/green for forged Start result, repeated Start, invalid/backwards
clock, exact deadline/coalescing, pause active-time isolation, bound/expired/stale
resume, cancellation/replacement/disposal and queued inputs; immutable deterministic
snapshots plus work counts, naming, app unit/type/lint and independent review.
Later action cases must exercise resume with actual working joints/held fruit and
remaining motion, through this same current-state request, before M3 closure.

Clock retirement iteration: the first Resume currentness check was incorrectly
behind a paused-snapshot early return; the formal clock-then-source-retirement
case disproved it. Re-read D session/pause and the exact session Inspector. The
replacement plan is one same-generation settlement rule in Resume's finalization:
retire changed sources even after an intervening clock or provider rejection,
but never touch a cancelled/replaced successor generation. Keep result acceptance
bound to the original paused snapshot. Only session.ts and its formal test change;
focused clock/source/cancel/replace/rejected-provider combinations precede full
gates. This preserves immutable reads, no source rebuilding and the existing
resume provider boundary; no new owner or product behavior is introduced.

D session clock foundation completed with independent review. The full app suite
passed 293 tests; the final finite-clock arithmetic correction and added case
passed all 15 focused session tests, with typecheck/lint/naming and scoped
formatting clean. Formal red/green covers constructor/Start authority, replacement
atomicity/idempotence, ordered pause/deadline behavior and source retirement across
provider settlement. Only active elapsed accounting changes on clock inputs;
no completed robot motion, picking or real clearance provider is claimed. Next
D observation/motion/action owners and Core composition must supply real remaining
movement admission before ordinary UI session controls and complete M3 validation.

### C installed dock source card - prerequisite for real D queries

After the completed D clock foundation, expose the station geometry missing from
its downstream query inputs before implementing D geometry/observation/collision.
Owner and authority: Inspector C installed dock source; matching product section.
Inputs: existing admitted dock parts and authored X/Z. Output: immutable installed
source revision/meshes shared with rendering, distinct from robot definition and
route annotation. Unchanged placement bypasses preparation; changed placement or
clear retires the handle. C owns missing/stale source failure; D owns later contact
and clearance policy. Exact station triangles/materials are unchanged.

Allowlist: render-app/robot-projection.ts, runtime/bootstrap.ts, corresponding
formal render/runtime tests and API_SURFACES. This readiness slice changes only
spec/Inspector/plan/BDD. No domain source generation changes, D production, UI
controls, support exceptions or physics assumptions. Naming: DockSource and
read/currentness methods are app-local transient products, with no saved schema.
Test-first exact source/presentation identity, per-piece geometry, placement,
retirement, unchanged definition/edit/read work counts and copied-handle rejection.
Gates: focused red/green, naming baseline/final, full app unit/typecheck/lint/build,
existing robot browser tests and same-app close-up inspection. Independent
readiness/code review precedes stage closure. Stop for source geometry changes,
missing owner, new product contact policy or an out-of-scope contributor.

C installed dock source completed: exact admitted station shapes are shared with
presentation, and formal identity/placement/retirement/work-count cases pass.
Independent source review passed; 295 app unit tests, typecheck, lint, naming and
build passed. Six headed Metal robot browser cases passed, including a permanent
uniform-canvas rejection oracle. A further permanent negative fixture preserves
the actual observed blank page PNG; its inclusive scene rectangle contains all
overlays and is also rejected by the unchanged guard (two focused negative cases
pass). Original DOM bounds were not recorded, so the fixture rectangle is recovered
from the image rather than presented as recorded runtime metadata.
The visual guard now checks the canvas region
of the exact saved page screenshot, not a second capture. All four bilingual
mobile/desktop close-ups from that run were inspected against
<a href="http://127.0.0.1:5178" target="_blank" rel="noopener noreferrer">the live FieldScope app</a>.
An earlier intermittent blank capture remains unexplained; the current ready
label confirms bootstrap/source readiness, not a presented-frame acknowledgement.
No product rendering fallback was introduced. A bounded SwiftShader attempt was stopped for excessive
GPU-process CPU and supplies no correctness evidence. Station support/contact and
D observation/swept-motion admission remain subsequent steps; M3 is not complete.

### D shared query geometry card - before observation and swept movement

Owner/spec: Inspector D shared query geometry preparation and the matching D
product clause. Consume a composition-issued same-update receipt containing real
C scene, robot and installed station handles; check opaque receipt identity and
all current handles together before preparation/publication/use. Publish one
immutable source product, unique near shapes and original instance/triangle/body
ownership. Same current receipt reuses it; source replacement retires it. Failure
is atomic and cannot publish partial physical coverage.

Only simulation/geometry.ts, `simulation/__tests__/geometry.test.ts` and
API_SURFACES are in the production allowlist. The readiness slice touches these
four product/Inspector/plan/BDD documents first. Existing generators, source owners,
engine, session/admission, runtime and UI remain unchanged. Neutral transient query
identities introduce no saved format. Physical layers remain included regardless
of view visibility/opacity; only dimensions and robot.route are annotations.
Tire support, exact joint contact and carried-fruit/tool contact are later collision
policy, never blanket source filtering. Spines/calyx/distal pedicel provenance and
unknown physical quality remain separate from retention.

Formal tests first: actual C scene/rig/station fixtures, complete near physical
mesh coverage, shared shape/triangle/partition identity, quaternion/instance
placement and same source target mapping; source-tuple clone/mix/stale rejection,
retirement for each source, atomic failed replacement and repeated-read/pose/clock
zero preparation/generation. No acceleration cache before a profiled solver needs
one. Gates: focused red/green, app unit/typecheck/lint/naming and independent
readiness/code review. No presentation change or new browser gate in this pure
source segment. Stop for missing canonical ownership, unsupported source requiring
another owner, altered source geometry or a new product contact/physics decision.

D shared geometry preparation completed: six focused cases cover real C near
source completeness, exact fruit partition/plant identity, descriptor-after-instance
placement, immutable source reuse and atomic receipt/source retirement. The initial
red was a missing-module collection failure before the new owner existed, not six
failing behavior assertions. Independent code review passed; 301 app unit tests,
typecheck, lint and naming pass. No observation, sweep/contact decision or app
presentation changed in this source preparation slice.

### D near-source ray card - geometric evidence before observations

Source/owner: D near-source ray evidence and matching Inspector helper. Inputs:
current issued QueryGeometry source, explicit synthetic time/validity and robot
base/joints, source-pose leaves/all-attached fruit state, bounded rays. Outputs:
batch-bound nearest original source hit/barycentrics/metre distance, finite-range
miss or unknown. No detection, row-empty, optical, quality or swept-clearance claim.
Validate detached batch input and current sources before/after; C FK once per
batch, not per ray. Unsupported disposition/leaf/body evidence remains unknown.

Files: simulation/ray-query.ts and `simulation/__tests__/ray-query.test.ts`,
API_SURFACES; geometry.ts only for a profiling-justified same-owner shape index.
Readiness updates these four docs first. No session, C, engine, runtime or UI
production. Naming: neutral transient ray/batch identities, no persisted schema.
First formal cases freeze exact source triangle/distance/ordering/transform/range
and ambiguity outcomes. Real C hit/miss/net/leaf/cultivar rays record shape scans,
instance/triangle tests, query/FK counts and elapsed time. Only measured repeated source/query
work can authorize a source-lifetime index with identical oracle outcomes;
no speculative cache or product geometry substitution.

Gates: focused red/green and actual-source work profile, app unit/typecheck/lint,
naming and independent readiness/code review. No presentation change/browser gate.
Stop for new optical/hardware/force parameters, missing true source/body ownership,
a needed out-of-scope contributor, or geometric ambiguity that cannot be honestly
reported. Uncertain geometry stays unknown rather than admitting a false result.

Near-ray source profile before optimization: six actual C rays performed 378
shape-bound preparations / 612,096 vertex visits, 15,438 instance tests and 105,702
triangle tests per batch. Repeating the same source repeated all bound scans;
two batches took about 124 ms in the bounded test. Exact controlled cases and
real roof/station hits pass; possible source containment stays unknown. The formal
far-ambiguity regression first failed and now proves uncertainty strictly behind
a known nearer hit cannot erase that hit.

Next owner step after uncached ray closure: QueryGeometry prepares shared local
shape bounds for ray and future collision. The attempted zero-repeat-bounds formal
expectation was recorded red against the current uncached query; no ray-local cache
was implemented. A separate readiness card must bind shared bounds to exact source
identity, retirement/disposal and uncached equivalence. No BVH or ray-result cache.

### Revised ray iteration - source occupancy before unified numerical predicates

The ray candidate is paused. Permanent failures show greenhouse air was treated
as uncertain material by aggregate open-surface winding, and near-parallel, edge
barycentric and distance-end arithmetic can become false misses. Source region
semantics are the first missing owner output; more ray-local layer or EPS patches
cannot repair that boundary. Discovery stays limited to these failed predicates,
their actual source constructors, direct consumers and the fixed formal cases.

Next C Step Card: product/Inspector C source material-region provenance. Consume
unchanged construction operations; emit complete primitive region ranges and
sheet/closed-solid/open-shell declarations with the original admitted products.
Allowlist is the explicit C provenance section, including direct metadata fixtures.
No D production resumes in this segment. Box and any proven closed construction
have material interiors; unverified seams/poles/open tubes remain open-shell, and
thin film/foliage/calyx regions remain surfaces without filled enclosing air.
No source hash, cap, vertex or biological quality assumption changes.

Test-first region coverage/closure declarations and real-source handoff; preserve
all robot/crop source hash oracles, fruit partition/late-hair detail, lifecycle and
work counts. Direct rig admission must isolate caller-owned mutable region arrays
without changing FK or limits; prove mutation isolation in its permanent test.
Gates: focused source tests, app type/lint/naming, existing source,
render and runtime regressions, and same-app source visual checks. The intentionally
paused D numerical tests stay recorded red and are not claimed as passed C evidence.
Independent readiness and code review precede resuming the next D owner.
Stop for a geometry change, missing source owner or a new physical parameter.

C material-region handoff completed: original triangle/material hashes remain
unchanged; permanent complete-range, box edge-pair closure, actual unwelded tire
seam, rig/scene caller-mutation isolation and atomic replacement cases pass.
The app suite passes 308 tests with the paused ray candidate explicitly excluded;
type/build/naming and lint excluding that candidate pass. Independent C review
found no remaining issue. The same
<a href="http://127.0.0.1:5178" target="_blank" rel="noopener noreferrer">live FieldScope app</a>
passed seven headed Metal robot cases and four established headless Metal crop
cases; all four robot and eight crop saved images were inspected. Headed crop
wheel input instead reached 10000% at the 2000% assertion; that failed evidence
is retained separately. The same unchanged test/input passes in headless mode;
the precise mode-dependent input cause is unresolved, and no camera fix is claimed.
No C geometry or test expectation was changed to bypass that failure. D ray
occupancy and numerical regressions remain open for the next owner segment.

Then a separate D revised predicate card will use one conservative arithmetic
policy across normalization, slab rejection, plane/determinant, barycentric and
range tests. Only conclusively outside intervals may become misses; uncertainty
must not be clamped to a fabricated hit. Source-region occupancy is independent
of this numerical policy. Preserve nearest-hit identity and the exact range end;
prove all existing controlled rays plus the three recorded non-axis-aligned
failures before broader gates. Shared local bounds remain a subsequent
QueryGeometry owner step; no ray-local cache is introduced. This revised order
replaces the earlier attempt to close the uncached ray candidate directly.

Next D Step Card: revised near-source ray query. Consume the current issued
GeometrySource, C material regions and detached synthetic batch; emit the existing
nearest source identity/miss/unknown result. Allowlist: ray-query.ts,
query-arithmetic.ts, their permanent simulation tests and API_SURFACES. C,
QueryGeometry production, session, UI, source generation and retained caches are
excluded. Original actual-scene and three numerical regression reds are preserved.

Use one conservative arithmetic representation through scaled normalization,
source transform/inverse operations, broadphase, triangle and nearest-order tests.
Preserve exact cases via generic operation exactness proofs; outward uncertainty
must cover unproved rounding, and nonfinite intermediate bounds remain unknown.
Inverse transforms must correspond to the actual C coefficients, without silently
assuming a rounded quaternion product is exactly unit length. C FK stays once per
batch. Original source regions provide occupancy: sheets never fill air; separate
closed regions use their surfaces; unresolved open-shell candidates return origin
unknown rather than interpreting their bounds as material. No aggregate winding
or per-triangle-box shortcut replaces these semantics.

Formal gates: near-parallel/edge/range endpoint false misses; non-axis interior and
clearly outside controls; edge and range offsets on both sides; extreme finite
directions; installed/instance/body transforms; exact tie and overlapping uncertain
nearest ordering; far versus origin ambiguity; closed box/open crate, film air,
unresolved bent shell and outside-shell cases. Direct arithmetic tests check
enclosure and generic exact cases. Then rerun actual C hit/miss/net/leaf/cultivar
profiles with source work counts, FK once, currentness and no generation; source
shape/region preparation remains query-local and measured for the later shared
bounds card. Focused correctness precedes full app unit/type/lint/naming/build and
independent bounded review. No new visual claim or camera change in this pure D
segment. Stop for a missing upstream owner, unbounded arithmetic or any need to
invent physical material/optical parameters.

D revised ray implementation completed its formal gates: 25 focused cases and
333 full app tests pass, including the original false-miss/film-air regressions,
exact shared-edge ordering, independent rational arithmetic enclosure and a
single detached accessor snapshot validated before FK work. Type/build/naming
pass. Actual C profiling covers eight rays per batch, including misses, net,
both cultivars, foliage, roof, dock and greenhouse air; two batches took about
573 ms. Each batch visits 612096 vertices across 378 shapes and 1719909 region
indices across 36717 regions, performs 161783 triangle tests and 24 exact
predicates, and evaluates FK once with zero source generation. Unresolved
open-shell origin occupancy remains unknown; geometric hits do not establish
detection, optical transmission, quality or swept clearance. These repeated
preparation counts justify the next separate QueryGeometry shared-bounds card,
not a ray-local cache. No visual or camera change is claimed by this pure query
slice.

Next D Step Card: shared QueryGeometry source-local bounds. The shared geometry
Inspector owner consumes the same current receipt and original immutable shapes
and regions, and emits completed local shape/non-sheet-region bounds. Shape
bounds are keyed by original shape identity; region products additionally require
the original region-array identity, so a different mapping cannot borrow bounds
or occupancy declarations merely because positions are shared. Retention is
bounded to one published source. Same current receipt bypasses preparation;
replacement builds before publication, and retirement/clear rejects stale output
and releases owner-held retention. Dynamic ray/base/joint/time changes consume
the same product, with their existing query admission and FK work unchanged.

Allowlist: simulation/geometry.ts and its permanent geometry test; ray-query.ts
only consumes completed bounds and removes its duplicate preparation, with direct
ray tests for result equivalence and normal-path work counts. API_SURFACES records
the handoff. Spec, Inspector and BDD cover the same source-reuse behavior. No C,
UI, session, arithmetic, occupancy/nearest predicate or source geometry change;
no cross-source cache, BVH, world vertices or query-result retention.

Test-first: prove repeated actual queries currently rescan bounds, then require
zero position/region-index preparation visits after the cold source preparation.
Compare each retained bound with a direct original-array min/max oracle; compare
actual ray results against fresh owner preparation for both unchanged and changed
dynamic inputs. Preserve original source/region identities, distinct mappings on
one shape, immutable output and complete coverage. Prove same-receipt no-work,
successor recomputation, failed replacement atomicity, retired read/clear rejection
and no source generators. Run existing ray numerical controls unchanged, focused
geometry/ray tests, then app unit/type/lint/naming/build and independent review.
Record cold and repeated source work counts on the existing eight-ray C profile;
timing is supporting evidence, not a machine-independent budget. Stop if any
result or source ownership changes, a predicate needs repair, or another owner
must regenerate data. No new visual claim belongs to this preparation slice.

Shared bounds completed: 26 focused and 336 full app tests, type/build/naming and
lint (zero errors) pass; independent scoped review has no finding. Actual cold C
preparation visits 612096 vertices and 1719909 region indices once. Both repeated
eight-ray batches perform zero bound-preparation scans while retaining 161783
triangle tests, 24 exact predicates and one FK per batch; two batches took about
475 ms in this run. Direct source bounds, distinct region mappings, dynamic
fresh-owner equivalence and retirement/clear cases pass. The work reduction is
source preparation only; no BVH, changed query result or visual claim is implied.

Next D Step Card: injected target observation admission, under the new exact
Inspector helper and spec Observation/action evidence. Consume a composition-issued
context containing the actual session snapshot, canonical mission and current
GeometrySource, with required context/mission predicates and the real session read
API. Emit one admitted immutable synthetic assumption and original target identity;
no second run/inventory/evidence ledger. Valid earlier evidence remains usable at
now until its explicit expiry, including while paused or faulted without resumption.
Clone once, validate the detached snapshot, and check all owner identities before
and after publication. Source membership is not perception or quality proof.

Allowlist: observations.ts and its permanent simulation test, plus API_SURFACES.
No session/contracts/geometry/ray/C/UI/runtime production changes. Target fields
retain nulls for cultivar/pose/maturity/sample coverage, individual pedicel/cutsite,
approach/extraction and independent spine/calyx/contact-damage assumptions. Reject
confirmation kinds until the later action owner supplies a current expected-action
receipt; do not invent an action instance in this helper. Names are transient,
source/target/run-scoped and introduce no persistence schema or hardware settings.

Formal gates first: missing/copied/stale context, wrong run/generation/revision,
unknown target/cultivar mismatch, future/expired/nonfinite times, getter mutation,
valid earlier input at the current snapshot, same-target repeat identity, null
independence and attempted action-confirmation rejection. Use the actual
HarvestSession lifecycle in the formal fixture, with explicitly labeled dispatch
provider doubles only to enter the existing run foundation. Prove no session
mutation, assessment or geometry generation. Then focused tests, app unit/type/
lint/naming/build, independent bounded review and concise completion evidence.
Stop for a missing owner handoff, changed lifecycle or a new physical assumption.

Next, the real synthetic viewpoint adapter must bind explicit camera projection,
FOV/range and declared source sampling to actual near-ray occlusion. A fruit sample
hit cannot prove stem/cutsite recognition, maturity, full coverage or quality.
Action confirmations, swept movement, conservation and ordinary UI remain required
M3 work; injected assumptions alone cannot close them.

Injected target admission formal gates pass: 10 focused cases and 346 full app
tests, type/build/naming and lint with zero errors. Actual HarvestSession fixtures
cover current/paused/cancelled/disposed contexts, valid earlier evidence and expiry,
target membership, clone-once capture, reentrant context changes and independent
unknown quality. Three sparse position/quaternion/cutsite regressions first failed;
slot-wise finite validation now rejects them. Admission changes no session or
inventory and accepts no action confirmations. This remains injected assumption
admission; the next real viewpoint/sample-ray adapter is still required.

Next D Step Card: real synthetic viewpoint sampling, under the exact new Inspector
helper and spec section. Consume the current ObservationContext, matching request
binding, explicit candidate IDs/sample count, synthetic camera world pose/slopes/
range and leaf-state assumptions. Generate deterministic source triangle-centroid
samples within the 64-ray computation budget; sample references retain original
plant/mesh/instance/partition identity. The computed camera ray is authoritative;
its real first-hit witness may differ from the intended source triangle. Report
four sample states without inferring anatomy, maturity, quality or action readiness.

Use existing conservative frame inversion via minimal ray-query helper exports;
keep one mathematical owner and leave all ray predicates unchanged. Camera
inverse prepares once. Current actual session base/joints supply robot pose; this
foundation is world-aligned/empty-held/all-attached. Newly computed view time must
match current snapshot time, while admission of existing earlier readings remains
valid until expiry. Explicit missing leaf or incompatible dynamic state remains
unknown, not default clear. Eligible rays run as one current-source batch/FK.

Allowlist: observations.ts/direct test, minimal ray-query.ts shared-frame export
and its direct equivalence test, API_SURFACES. No geometry/arithmetic/session/C/UI/
runtime or framework production. Formal tests first: exact deterministic C sample
selection, target hit/occluder/front-back distinction, film/hidden physical layers,
frustum inside/outside/uncertain boundary, empty and over-budget requests, sparse
camera/input rejection, source/run replacement/clock mismatch and unknown states.
Use actual near crop source fixtures plus a bounded full-source scene case; source
truth only selects candidate geometry, never fills maturity or quality. Prove
camera once, one nonempty batch/FK, zero source generation/bound scans and stable
numeric query tests. Then full app unit/type/lint/naming/build and independent
review. Stop for missing source ownership, inability to preserve conservative
frame/query semantics, or unsupported dynamic handoff. Ordinary UI scan/action
wiring remains a later integrated gate, not closure by this pure producer alone.

Direct ray handoff refinement: expose the already selected/refined hit interval
as read-only distanceBounds, preserving the existing distance midpoint. Only a
non-target hit with upper distance strictly below the requested sample-distance
lower bound proves sample occlusion. Behind-sample and overlapping intervals stay
unknown with their witnesses; no midpoint inference or EPS endpoint extension.
Add permanent selected-hit interval and behind/overlap regressions before this
minimal ray output handoff and its observation consumer.

The viewpoint producer is implemented and passes 39 focused cases and all 357 app
unit tests, typecheck/build, lint and naming. Actual full near-source observations
prove film occlusion outside the greenhouse and target/leaf/unknown samples inside;
requested triangles remain separate from actual first-hit witnesses. Permanent
regressions cover behind/overlap provider boundaries, rounded camera inversion,
large-coordinate requested-distance enclosure and foreign context ownership.
The latter two failed before correction. One camera preparation and one eligible
ray batch/FK reuse completed geometry bounds with zero source generation. This
pure producer does not close ordinary UI scan, action or full M3 integration.

Next D Step Card: static source surface-pair evidence, before continuous sweep and
articulated path/contact admission. Consume the issued QueryGeometry and explicitly
selected original triangles with synthetic current pose/time. Publish only surface
relations plus original witnesses; no clear movement, material-free inference or
contact exemption. D collision owns the predicates, existing ray frame arithmetic
owns the minimal shared forward/instance handoff. No new persisted schema or wire
identity; SurfaceQueries and source-pair names are app-local transient helpers.

Allowlist: collision.ts/direct formal test, ray-query.ts/shared-frame direct test,
API_SURFACES and these readiness docs. Reuse interval/exact arithmetic, C FK and
completed source buffers; do not create a second world geometry or bounds cache.
Formal tests first: crossing, separation, coplanar overlap, edge/vertex contact,
numerical uncertainty, nested nonintersecting surfaces without volume clearance,
actual C placement/body pairs, source retirement, clone-once malformed inputs and
work counts. Then full app unit/type/lint/naming/build and independent review.
Stop for missing source/body ownership, a required contact exemption, unsupported
numeric proof or a need to admit motion from this static result. The next owner
will add a continuous fixed-rotation linear sweep, then articulated path/IK and
full-body/intended-contact coverage before session movement can be admitted.

Static source surface-pair evidence is implemented with 17 direct cases and the
unchanged ray predicate suite; all 375 app unit tests, typecheck/build, lint and
naming pass. Independent review found no remaining issue. Formal cases retain
crossing/coplanar/touch, nested boxes, uncertain non-axis contact, source admission
and real robot/dock and both cultivar instance witnesses. Sparse pair/invalid
joint admission regressions failed before correction. The actual cultivar profile
read 12 original vertices for two pairs, prepared six frames, and performed zero
FK, source generation or bounds preparation (about 1.31 ms locally). Robot batches
prove one FK and frame reuse. No visual/runtime path changed. This closes only
selected static surfaces, not volume/contact or continuous movement clearance.

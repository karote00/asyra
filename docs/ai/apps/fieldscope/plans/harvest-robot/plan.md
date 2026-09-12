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

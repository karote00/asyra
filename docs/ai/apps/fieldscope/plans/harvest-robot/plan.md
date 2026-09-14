# Harvest robot and crate logistics

Status: IN PROGRESS - W1/W2/W3/W4 DOMAIN OWNERS IMPLEMENTED; GOAL INTEGRATION PENDING
Started: 2026-09-12 (Asia/Taipei)
Base: origin/main at `4144a25d7`
Current contract worktree: `.worktrees/fieldscope-material-contact`
W4 delivery worktree: `.worktrees/fieldscope-w4-delivery`

## Bounded objective

Replace the historical four-wheel, single-arm concept with a compact multi-legged
walking harvester that has separate support and cutter arms on each side, can
inspect and harvest both sides, and includes upper-fruit reach, whole-robot swept
motion and quasi-static load/stability screening. The first comparison baseline
is a visibly synthetic low-centre-of-mass six-leg base with a bounded vertical
shoulder carriage and four medium-short arms. Simulated clearance or positive
quasi-static margin never proves hardware safety.

Authorized scope: `apps/fieldscope` and its app documentation, tests and existing
build/test tooling. No Framework changes, added dependencies, hardware purchases,
controller connection, automatic deployment, publication or changes to other apps.
Discovery: existing layout/support/crop owners, current Core composition APIs,
primary harvesting research and manufacturer specifications. Later review stays
within this diff and its direct consumers. Do not port Sim's analysis engine.

The existing M1/M2 runtime, historical four-wheel projection, single five-axis
rig and in-progress botanical/query work remain preserved. Old tire, tread,
single-wrist tool, `+Y` approach, four-ring and five-joint material/contact work
does not become acceptance evidence for the new topology. Existing saved robot
definitions retain their legacy identity and historical projection; they are not
silently loaded as walking definitions. W2 now owns the exact versioned schema
and explicit create/compatibility path.

## Active implementation sequence

1. **Complete - contract reset.** Align product, owner flow, plan and hardware
   assumptions. State the walking runtime as pending. Preserve old implementation
   history without leaving its robot topology active.
2. **Complete - W1 scene-demand proof.** From one completed current scene,
   enumerate actual left/right targets, high-target reach demand, supports,
   drains, pipes, plants, leaves and obstacles. Derive free-space regions; never
   equate strip width with usable foot span or `netTop` with fruit height. This is
   the next bounded implementation slice and does not build the robot.
3. **Implemented - W2 versioned solid source and kinematics.** Version 2 owns
   explicit pin/yoke/annular-sleeve/neck material, root housing cavities and
   full-range lift rails. One support rule resolves both core ends with declared
   gaps and final material checks. Version 1 remains identifiable without
   reinterpretation. Four arms, six legs, active working angles, link lengths
   and domains retain their owners.
4. **Implemented - W3 terrain, stance and motion.** Admit complete interval foot placements,
   stance transitions and whole-body/arm/tool/carried-fruit motion on measured or
   labeled synthetic uneven, slightly wet soil and debris. Drains and water
   channels are never support surfaces; missing evidence is `unknown`.
5. **Implemented - W4 quasi-static mechanics.** Bind the same source, pose, stance, mass/load
   and terrain identities. Compare centre-of-mass projection, support polygon,
   arm-root bending and overturning moments for high reach and carried load.
6. **W5 support/cut coordination.** Prove crop-specific same-side support and
   plant-side pedicel cutting for cucumber and Yu-Nu tomato while retaining spine,
   skin, calyx, pedicel and non-target plant boundaries.
   **P5a source identity implemented:** canonical near botanical patches retain
   exact regions, triangle ranges, target association and plant/fruit ownership.
   SiteGeometry admits/freeze-checks these references and binds tomato cut position
   and plant-side direction to its existing shared and adjacent source rings.
   W1 carries the exact installed patches with independent support/cut completeness.
   P5a preserved original near/distant geometry, materials, regions and partitions.
   **P5b cucumber source revision:** the canonical generator adds an actual shared
   ring at the explicit synthetic cut fraction (default 0.5), with plant and
   retained open-shell segments. Source assumptions are validated and immutable.
   Only cucumber pedicel source and directly sampled hairs change; other botanical
   buffers remain exact. Missing boundary or numeric evidence remains unknown.
   This synthetic source prerequisite does not complete W5, grant contact permission,
   or prove retention, physical damage, clearance or harvesting.
   PR #211 replaces the non-portable whole-buffer digest acceptance exposed by
   Ubuntu with an independently frozen pre-P5b source graph. Its manifest pins the
   reviewed commit, tree and source bytes before same-runtime execution compares
   unrounded non-pedicel source, metadata and retained hairs. The former Darwin
   Node 24.13 snapshot payloads remain intact in that manifest as historical
   diagnostics only; received Ubuntu values do not become a golden. The follow-up
   W1 work-owner correction retains partition-derived route admission and prepares
   patch bounds only for included targets. Its exact work oracle binds
   `targetPatches` to the emitted anatomy patches; existing time budgets remain
   unchanged.
   The authorized inserted pedicel hair shifts one revision-local
   fruit-2/fruit-detail ordinal from /5 to /6 while its target, role, owner,
   admitted region, dense topology and unrounded attributes remain exact. Each
   revision still proves unique part-local IDs and exact patch/source references;
   the ordinal itself is not treated as a cross-revision identity.
7. **W6 mission evidence and UI.** Run visible normal left and right inspection/
   harvest cases through the actual W owners. One-side-at-a-time is the initial
   schedule, not a permanent prohibition. Any simultaneous bilateral case uses
   one combined four-arm collision and mechanics result.

The scene-demand proof uses current farm configuration, declared plant-growth
envelopes and actual source obstacles. In the current configuration, about 1.8 m
before plant-growth needs and a rough calculated 1.2 m afterward are user-provided
sanity references, not fixed constraints or usable-width inputs. W1 derives the
offset-capable free-passage geometry. W3 separately derives locomotion swept
demand from robot definition, path/time, stance/contact schedule and evidence,
gait, load, terrain and explicit margin, then compares the completed geometries
without scalar width subtraction. Farm/growth/source, route, margin or survey
edits recompute W1 and the compatibility result while reusing unchanged W2.
Robot/path/time/stance/contact/gait/load/terrain/margin edits recompute W3 and the
compatibility result. It may prove straight travel and reverse exit or travel to
a separately wider turn area. If no complete turn fits, the product reports
`no-turn`/`blocked`; it does not assume an in-place turn or widen the farm.

### Executable product cases for the active route

- The exact current scene yields separate left/right targets and at least one
  upper-fruit reach demand from actual fruit source, not canopy height.
- Farm/strip/growth/source, route, margin or survey changes recompute W1
  free-passage geometry while an unchanged W2 definition is reused. Robot
  definition, path/time, stance/contact schedule or evidence, gait, load, terrain
  or margin changes recompute W3 locomotion demand. Either can change a compatible
  case to `blocked`; the result cannot remain pinned to 1.2 m.
- An irregular/offset passage admits or rejects the complete stance, leg swing,
  stowed arms and body sweep; a static body-width pass is insufficient.
  Straight/reverse and wider-area turn outcomes are distinct.
- A foot candidate on a drain/channel is blocked. Slightly wet uneven soil or
  debris without required friction, bearing, sinkage or height evidence is
  `unknown`, never flattened into a clear result.
- Left and right inspection each use current scene evidence. Left and right
  harvest each require their same-side support/cutter pair, complete approach,
  retreat and placement path.
- A high target compares body height, leg extension, shoulder-carriage travel and
  arm reach together with the exact pose's bending and overturning screen.
- A three-foot or other multi-foot stance without mass/contact/terrain evidence
  remains `unknown`. A positive quasi-static margin is not dynamic safety.
- A simultaneous bilateral candidate, if introduced, cannot combine independent
  single-side receipts; all bodies and loads enter one W3/W4 evaluation.
- Cucumber support preserves fine spines under the declared soft-textile
  assumption. Tomato support preserves skin, calyx and retained pedicel; cutting
  stays in the confirmed plant-side pedicel corridor. Unknown anatomy or damage
  defers the action.
- A saved legacy wheeled definition retains its historical projection and cannot
  enter W2-W6. Explicit creation of a versioned walking definition preserves the
  original saved bytes and history.

### Bounded definition of done

This contract-reset slice is done when the four current documents agree on the
pending target, owners, cases, compatibility boundary and evidence limits, with
formatting, naming, path/link and bounded diff checks passing. It does not claim
walking, four-arm or mechanics runtime exists. Each later numbered slice must add
formal source-space/semantic tests for its owner, fail closed on incomplete
identity/evidence, pass app typecheck/lint/build and relevant UI evidence, and
recheck this Inspector before advancing. Physical actuation, procurement and
safety claims remain blocked until separately measured and authorized.

The bounded W1 and W2 domain slices now provide current-scene demand plus an
explicitly admitted four-arm, six-leg source and pure complete-pose FK. W3 adds
terrain, stance and whole-robot interval motion, with formal validation in progress;
W2 source geometry or a valid preset alone is not passage, collision, contact,
stability or hardware-safety evidence.

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

### Historical M3 - Deterministic patrol, picking and crate simulation (superseded)

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

### Historical M4 - Bench sensing and crop-specific end effectors (superseded route)

Build only after measured dimensions, budget, component selection and separate
hardware authorization. Start with a fixed guarded bench, dummy loads and disabled
blade. Validate camera calibration, lighting, stem discrimination, repeatability,
force/torque and jaw-pressure limits, tool retention, safe power-loss behavior,
food-contact cleaning and crate bruising limits. Use a support-and-cut cucumber
head and a separate small-fruit padded head for individual Yu-Nu tomatoes.
Evaluate picked fruit immediately and after storage for hidden bruising. Do not
infer acceptable force from another cultivar or soft gripper advertising.

### Historical M5 - Ballasted mobile platform, then supervised harvest (superseded)

Before crops: loaded braking, slope, asymmetric sinkage, traction, recovery,
headland turns, obstacle protection, stop distance, watchdog and emergency stop
on the intended prepared surface. Then greenhouse trials with operators outside
the protected area and mechanical blade guarding. Validate full harvest plus box
exchange with 0%, 50% and 100% permissible payload. Expand one crop/row/condition
at a time; keep precision/recall, damage, lost fruit, false-safe, recovery and
cycle-time measurements with environmental context. Limits must be approved from
measurements, not copied from simulation defaults.

### Historical M6 - Optional separate carrier and controlled fleet operation (superseded)

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
screenshot check receive a focused repeat. At that checkpoint M3-M6 were planned;
no active patrol, harvested inventory, physical observation or motor connection
is delivered by M2.

The 2026-09-14 product reset supersedes those historical M3-M6 robot-topology
milestones. W1 now owns current-scene demand, and W2 now owns the explicitly
admitted four-arm, six-leg source plus pure complete-pose kinematics. W3 domain
implementation now covers interval source envelopes, source-bound foot evidence,
crate and carried-fruit geometry, budgets and result currentness. Its focused
tests pass (34 cases), together with 33 W1/W2 regressions, typecheck, scoped lint,
naming and all 17 build tasks. The initial mixed-worktree full-app run retained
23 C/D failures (520 passed); its whole-app lint retained 195 errors and 17
warnings outside this slice. These historical mixed-worktree results are not
W3 clearance evidence.
Unmodeled joint interfaces and unknown crate evidence deliberately
keep the synthetic baseline unknown. W4 now implements gravity-only exact-pose
CoM, support projection, reserve and edge tipping signs, and four-arm root and
shoulder moments. Its 19 focused tests and independent review pass; combined
W1-W4 regression passes all 86 tests. Typecheck, scoped lint, naming and all 17
build tasks pass. The initial mixed-worktree W4 run had 540 passing tests and the
same 23 C/D failures. Clean integration from PR208 commit `10123231f` preserves
its canonical source-patch reader and passes all 553 FieldScope tests across 62
files, all 86 W1-W4 tests, typecheck, naming and 17 build tasks. Whole-app lint
passes with 17 existing warnings and no errors. No legacy failure or source
fixture was modified for this slice. PR208 is now integrated in the goal at
`1cf7e0de`; W4 preserves that goal baseline and adds only its reviewed app slice
and an empty app-only Changeset. W4 sub-PR integration remains pending, and this
validation does not claim a walking runtime.
Walking mission, crop coordination and corresponding UI remain pending W5-W6.
Existing botanical/source-query work stays preserved as a potential upstream
capability and must be rebound through the new W owners before it can support
active acceptance.

## W2 solid articulation source evidence

Final bounded correction: W2 rejects disconnected admitted bearing profiles and
certifies neck-to-sleeve connection from emitted material, preserving the default
profile, geometry, presets and physical gap proof. The two direct W3 test consumers
use the complete region inventory and each region's original triangle range;
their finite functional pair budget derives from that inventory. Production W3
budgets and exhaustion cases remain unchanged. Close this segment with focused
source/definition and direct-consumer tests, independent correction review, then
one full-app gate; any new material conflict returns to the W2 owner.

The three canonical poses pass the independent actual-triangle convex-material
oracle: 46 bodies and 265,925 different-body region pairs per pose, with zero
positive-volume overlaps and zero unproved boundaries. Strict exact gaps handle
broadphase rejection; complete face-normal/edge-cross axes handle the remaining
pairs. Eighteen named interface boundaries retain original-triangle witnesses.
Direct fixed parent/child pairs use original triangles and one authored fixed
frame in common parent-local coordinates; all other pairs use completed FK
coefficients. The fixed-source proof does not claim exact boundary agreement
between independently rounded world parent and child matrices.
The finite endpoint profiles are construction keepouts, not material or contact
exceptions. The original closed-box overlap RED and later rail/adjacent-leg
preset RED are retained as the reasons for this source correction.

All extents below derive from actual source vertices and completed FK, displayed
at binary64 precision. Axes are X/Y/Z and values are metres.

| Pose         | Minimum                              | Maximum                           | Size                                           |
| ------------ | ------------------------------------ | --------------------------------- | ---------------------------------------------- |
| stowed       | (-0.40499999999999997, -0.51, -0.39) | (0.40499999999999997, 1.71, 0.39) | (0.8099999999999999, 2.2199999999999998, 0.78) |
| leftWorking  | (-0.40499999999999997, -0.51, -0.39) | (0.40499999999999997, 2.1, 0.39)  | (0.8099999999999999, 2.61, 0.78)               |
| rightWorking | (-0.40499999999999997, -0.51, -0.39) | (0.40499999999999997, 2.1, 0.39)  | (0.8099999999999999, 2.61, 0.78)               |

Compared on this same version-2 source with the old folded inactive arms and
bent-leg candidate, X does not increase and Z decreases from
1.1379743665046806 m to 0.78 m. Y changes are explicit: the old stowed minimum
was -0.30482329429901717 m and old working maximum was 2.077487129096181 m.
Each of the six named soles has exact common Y, displayed as -0.51 m; the
required geometric base translation is displayed as +0.51 m. This is a sole
datum, not terrain support, stability, clearance, continuous-path or hardware
safety evidence. W3/W4/W5 remain responsible for their separate admissions.

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

## Historical single-arm M3 execution record - superseded 2026-09-14

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

Next D Step Card: continuous fixed-rotation translation of selected source surface
pairs. Same owner/source preparation as the completed static primitive. Inputs
bind original witnesses, start pose and two world displacements to one closed
interval and explicit throughout-interval synthetic leaf/fruit assumptions.
Publish swept surface relation only; no movement, contact or volume clearance.
Complete triangle SAT axis projection inequalities share one normalized time.
Exact singleton rational clipping or conservative possible/guaranteed common
intervals provide the proof; endpoints or per-axis unrelated times cannot clear
or manufacture a sweep. Any contact time is a conservative occurrence enclosure.

Allowlist: collision.ts/direct collision.test.ts, API_SURFACES and these docs.
SurfaceQueries.sweep and transient sweep input/result names belong to D; no new
persistence or wire identity. Reuse original geometry/FK/frame owner output and
existing scalar interval/dyadic arithmetic without a producer change or cache.
Formal tests first: mid-interval crossing despite clear endpoints, brief/edge/
endpoint contact, common/zero-relative displacement, coplanar motion, incompatible
axis windows, uncertainty, validity and stale input. Retain static/ray controls,
original-source identity and zero-generation/bounds/FK reuse gates; run full app
unit/type/lint/naming/build and independent review. Stop for needed rotation,
missing interval assumption or a proof that requires source/body/contact scope
outside this primitive. Full coverage/volume/contact and articulated planning
remain subsequent prerequisites before normal session motion can be admitted.

Continuous fixed-rotation source-pair sweep is implemented: 13 missing-method
regressions failed first; 32 direct cases now pass, including the 17 static
controls and exact mid-interval/brief/endpoint contact, coplanar motion, common
and opposing displacement, incompatible axis windows and nonpoint guaranteed/
separated/unknown cases. Large finite simulation-time bounds remain conservative.
Actual robot/dock sweeps reuse one FK, three frames and 12 selected vertex reads
without bounds/source rebuilding. All 390 app unit tests, typecheck/build, lint
and naming pass; independent code review found no issue. A lint-only Fraction
interface correction changed no runtime behavior. This closes selected continuous
surface evidence, not articulated paths, volume/full-body/contact admission or UI.

Next D Step Card: fixed-joints/base-translation whole-source surface coverage.
Inventory all robot parts×physical environment instances plus all distinct robot
parts (same-body included) before narrow work. Each robot part shares one world
displacement; environment is stationary under declared interval assumptions.
Explicit empty-held is a synthetic prerequisite, later matched to the real session.
Report covered/excluded/tested/unvisited domain and surface relations only;
material containment, open-shell occupancy, precise intended-contact admission
and real retained fruit are not silently solved by this report.

Allowlist: collision.ts/direct test/API and these docs. SurfaceQueries.cover and
transient coverage input/result names belong to D, no persistence/wire change.
Reuse existing continuous predicates, original prepared bounds and per-query
frame/FK output; no new source or index owner. A caller-declared predicate budget
can leave unknown/incomplete, never partial-clear. Inventory counts establish the
Cartesian upper bound before expensive traversal; only later measured evidence
may justify a separate shared derived-index step with lifetime/equivalence gates.
Formal tests first: independent source pair enumeration, small fully admitted
source fixtures and complete middle-crossing/unknown controls; real C part/layer/
instance inventory with a bounded profile; same-body contact, zero/small budget,
retirement/clone-once and work counts. Then existing static/sweep/ray controls and
full app gates/review. Stop for missing source provenance, required contact
permission, inability to preserve conservative bounds, or a needed new index.
Do not claim normal session movement from this report before its remaining
material/contact/retention obligations have concrete owners and proofs.

Whole-source surface coverage is implemented. Five missing-method regressions
failed first; all 37 collision cases and 395 app unit tests pass, alongside
typecheck/build, lint and naming. Independent scoped code review found no issue.
Small admitted source fixtures prove exact-budget completion, zero-budget strict
exclusion, middle contact, same-body contact and complete numerical uncertainty.
The actual C scene contains 107 robot parts and 2,466 environment instances:
269,533 mesh pairs and 43,429,284,640 triangle pairs. A 32-predicate query excludes
43,342,371,584 pairs by strict swept bounds, queries 32 and explicitly leaves
86,913,024 unvisited, with 12 supported surface intersections. It is incomplete
and grants no movement permission. The bounded query took about 62 ms, using one
FK and 20,584 bound corners for 2,573 placements, with no local bounds/source
regeneration. A lint-only status expression rewrite preserved classification.
Material occupancy, intended support/joint/tool contact, retained fruit and
articulated motion remain necessary before session movement and ordinary UI
harvesting; spine/calyx preservation and contact damage are independent outcomes.

Next D Step Card: original-region refinement of whole-source surface coverage.
The permanent passive source profile used the same actual scene/rest pose/linear
displacement and no triangle predicates: 57,773 region pairs reduced the surviving
triangle domain from 86,913,056 to 14,371,872 (about 83.5%), taking about 74 ms
with 22,360 bound corners. All 794 unprepared regions remained candidates through
mesh bounds. This supports reusing existing region output before adding an index.

Allowlist: collision.ts/direct collision.test.ts/API and current contract docs.
Use original complete contiguous region spans and identity-matched prepared bounds;
reuse world swept region products only within one query. Preserve budget accounting,
continuous predicates and all material/contact/quality limitations. Formal tests
first prove production narrows the measured domain, complete small-domain relation
equivalence, mixed sheet/solid coverage, touch conservatism and work reuse. Then
original collision controls, app unit/type/lint/build/naming and scoped review.
Stop if correct source region mapping is missing or new local bounds/index
production becomes necessary; pending robot material decisions do not authorize
C changes here. Transient region work counters belong to D, with no persisted API.

Region refinement is implemented: the measured exclusion mismatch and missing
region work handoff failed first; 40 collision controls and all 398 app unit tests
pass with typecheck/build, lint, naming and independent scoped review. A mixed
prepared-box/unprepared-sheet fixture preserves the complete exhaustive surface
relation counts; exact contact at the closed translation endpoint is not excluded.
Production matches the independent source-bound profile. The actual 32-predicate
query now leaves 14,371,840 unvisited pairs and reports 18 surface intersections,
using 57,773 region comparisons and 222 additional transformed region products
(22,360 total bound corners), about 64 ms with one FK and no local bounds/source
regeneration. Different bounded representatives reflect the declared region
traversal, not a changed continuous predicate or an earliest-contact claim.
This closes measured region exclusion only; partial coverage and the unresolved
material, intended-contact, retention and articulated-motion obligations remain.

Next bounded Step Card is test-only hierarchy profiling, not production indexing.
Permanent collision tests and a private test helper inventory unique shapes,
shape/region mappings, triangles and regions before building leaf-capacity-eight
stable-median local trees per original region. Preserve canonical buffers and
exact triangle/region identity. Two small fixtures/two poses compare every
nonseparated exhaustive sweep relation; actual source queries only count strict
node exclusions, leaf candidates and unvisited domains. Count cold build, payload
estimate, node transforms and two warm pose costs against the same region baseline.
Guards are one million unique/built triangles, 300,000 nodes, 500,000 node visits
per query and the existing ten-second test timeout; no parameter sweep or guard
increase. Over-budget query domains stay unvisited. Runtime/C/material changes
remain excluded; useful results require a later QueryGeometry owner/lifetime card.

The fixed test-owned hierarchy profile preserves both fixtures/two-pose exhaustive
relations and all original triangle/region mappings. The actual source has 378
shapes/mappings, 749,807 triangles and 59,160 regions. Cold build reads 2,249,421
vertices, creates 240,814 nodes and takes about 853 ms; estimated numeric/reference
payload is 21.4 MB, excluding JavaScript object overhead. At yaw zero, candidates
fall from 14,371,872 to 2,810,792 with 171,377 node visits; at yaw 0.4 they fall
from 10,909,616 to 729,408 with 90,023 visits. Both complete the bound-domain
accounting without node-budget exhaustion. Warm bound queries take about 141/171
ms versus the region baseline's 52/55 ms: this is candidate reduction, not measured
end-to-end collision acceleration. Hundreds of thousands to millions of exact
predicates remain, so no production index or real-time movement claim follows.
The test helper now cooperatively checks elapsed time during construction and
traversal, including node-budget exhaustion accounting; three fake-clock failures
preceded those guards, and all 45 collision tests
pass. This is not an operating-system hard timeout. Production lifecycle, memory
limits and an effective full-query budget still need a separate owner decision.

Next D Step Card: admitted synthetic quality-evidence assessment, independent of
pending material and motion clearance. Extend TargetReading with mandatory
quality.pedicel and explicit null unknown; app-local transient callers update,
missing legacy-shaped readings reject, no persistence migration. observations.ts
assessQuality admits once then interprets crop-specific preservation dimensions
and separate contact damage. Unknown cultivar does not consult hidden truth;
synthetic satisfaction never certifies physical integrity or post-harvest retention.
Allowlist: observations.ts/direct observations.test.ts/API and thin current docs.
Formal missing-pedicel and missing-method tests first; independent dimensions,
partial failures/unknowns, context/expiry/clone-once and zero query/source/session
work, followed by observation controls, full app gates and scoped review.
Stop for any required new market/placement/action policy, not for pending material
answers unrelated to this pure assessment. New names are transient observation
owner APIs, with no wire/persisted identity change.

Admitted synthetic quality assessment is implemented. Missing distal-pedicel
evidence and the absent assessment method produced five formal failures first;
25 observation/viewpoint cases and all 408 app unit tests pass, with build/type,
lint and naming. Independent scoped code review found no issue. Final focused controls also verify invalid pedicel values,
clear-corridor non-inference, valid earlier evidence, expiry and cancellation.
Cucumber spines, tomato calyx/distal pedicel and contact damage remain independent;
unknown cultivar never borrows hidden source truth. Assessment admits once,
preserves the foreign context without freezing it, and performs no ray, source
generation or session mutation. Physical integrity remains unverified even when
all declared synthetic requirements are satisfied. This closes evidence
interpretation only, not harvesting, market grading, action/placement permission
or pending material and collision admission.

Next bounded D Step Card: explicit joint-segment candidate admissibility.
New motion.ts and direct motion.test.ts only, plus API/thin docs. Read current
issued C rig limits/speeds, clone one synthetic q0/q1/from/until request, and prove
scalar linear-segment limits/speeds without angle wrapping or FK interpolation.
Use existing exact dyadic arithmetic for boundary comparisons; no new C chain,
trigonometric owner or acceleration policy. Candidate evidence is not motion
clearance and does not depend on the pending material decision.
Formal tests first: absent owner API, all five axes/exact boundaries/just-over,
large finite values, missing/nonfinite/extra keys, nonpositive interval, upstream unavailable-rig rejection, forged/retired source and clone-once isolation with zero FK/query/source work.
Then focused cases, full app unit/type/build/lint/naming and independent review.
Names JointSegments/JointSegmentInput belong to transient D motion evidence, with
no persisted or wire identity. Stop for any required new physical parameter or
source-chain ownership, not for independently pending material decisions.

Explicit joint-segment admissibility is implemented. The permanent test first
failed collection because the new owner module was absent; seven focused cases
now pass, including every approved joint, exact/just-over speeds and limits,
non-wrapping input, subnormal/large times, upstream unavailable-rig rejection and
clone-once source retirement. The lift -0.1 to 0.1 over ten seconds demonstrates
a rounded-product false pass: exact original dyadics exceed the speed budget;
the next larger representable end time passes. Future planners must submit their
chosen intervals to this owner rather than treating a rounded quotient as proof.
Each assessment performs five scalar/exact comparisons, with no FK, collision
query or source generation. All 415 app unit tests, typecheck/build, lint and
naming pass; independent scoped review confirmed exact scaling and ownership.
This is source-bound candidate evidence only, not articulated surface clearance,
TCP reach, material/contact policy or executed movement.

Next bounded C Step Card: canonical FK algebra extraction. Only robot-kinematics.ts,
its direct test/established snapshot, API and thin contract docs. First freeze
pre-edit point Float64 bits across rest/limits/asymmetric/nondefault/±0 inputs and
source/reference oracles. Add missing generic-entry and callback-admission tests,
then one shared chain with the unchanged point adapter and a new numeric-domain
entry. Preserve divide-by-two and all original numeric operation order; no source
formula, material or point numeric authority changes in this segment.
New evaluateRobotDomains/JointDomains/KinematicAlgebra names belong to C transient
kinematics. Validate cloned numeric ranges before adapter callbacks; keep the old
point input acceptance domain. Generic scalar soundness belongs to the next D
adapter and is not asserted here. No expression graph/cache or duplicate D chain.
Run focused bitwise/identity/validation/work cases, existing projection controls,
full app unit/type/build/lint/naming and independent review. Stop for any required
point semantic change or extra owner. A later numerical replan can establish a
proved canonical point-plus-interval trig contract; Math.sin plus EPS and sampled
endpoint envelopes do not close that proof.

Canonical FK algebra extraction is implemented. The pre-edit Float64 snapshot
covers 56 poses across four source definitions, including each joint limit,
asymmetric joints and signed zero; every fingerprint remains unchanged. Three
new entry/validation/ownership cases first failed against the missing API, then
passed with the shared chain. Twelve focused cases now pass, including complete
numeric-domain forwarding once and zero robot generation/preparation. The full
app checkpoint passed 419 tests before that last isolated control; its final
focused run, typecheck/build, lint and naming pass. Independent review confirmed
original arithmetic association, angle division, chain order, source references
and caller-owned scalar isolation. This completes only C chain sharing. It does
not certify an interval adapter, analytic trig bound, trajectory or movement.

Next bounded Step Card: shared scalar arithmetic owner extraction. Move the complete
existing query-arithmetic implementation unchanged to domain/scalar-arithmetic.ts;
retain the simulation path as direct named function/type re-exports. Only those two
files, existing query-arithmetic.test.ts and API/Inspector/plan may change. Freeze
original implementation text hash and export inventory first; add a permanent
shared/facade identity and boundary-result case before the move, then prove original
body equivalence and existing independent arithmetic/ray/collision/motion controls.
One module owns the DataView and all operations; no duplicate scalar engine, wrapper,
consumer migration, cache, trig, point-FK semantic change or material policy.
Run naming before implementation, focused and full app unit/type/build/lint/naming,
format/diff checks and independent review. Stop if the extraction requires an
arithmetic behavior change. A subsequent separate polynomial card will fix S19/C20,
|x| < 1, eight trig calls per pose, exact growth and latency limits before profiling;
this extraction does not approve or implement that numerical model.

Shared scalar owner extraction is complete. The 6321-byte implementation moved
unchanged, with matching pre/post SHA256; the original facade re-exports the same
eight functions and two types with one module state. A permanent missing-shared-
module case first failed, then the facade identity and signed-zero/subnormal/
overflow controls passed. All 81 focused arithmetic/ray/collision/motion cases,
421 app tests, typecheck/build, lint and naming pass. Independent review verified
byte equivalence and compatibility. No numerical behavior, trig model or C point
semantics changed in this segment.

Next bounded Step Card: exact bounded polynomial scalar evidence, before any C
point integration. Fixed S19/C20 and |x|<1; common 20! rational Horner coefficients,
shared roundFraction nearest-even/down/up conversion and monotonic endpoint/zero
extrema. Names evaluatePolynomialTrig/boundPolynomialTrig belong to the new scalar
numerical owner. Only domain/scalar-arithmetic.ts, new kinematic-trigonometry.ts,
their direct tests, the old facade export assertion and API/spec/Inspector/plan.
Do not change old arithmetic/functions/facade exports, C chain or point semantics.
Formal missing-owner/converter tests first, then independent rational direct-sum,
nearest-even tie/normal/subnormal/overflow, interval extrema and analytic remainder
oracles, invalid/clone-once input and resource rejection. Original numeric/consumer
tests remain required. All stored and temporary BigInts have fixed 24000-bit limit;
20!B^20 <=21542 bits, coefficient-sum bound gives about21544-bit Horner intermediates,
with converter shifts/products checked separately. Fixed profile: normal first and
repeated plus subnormal first and repeated; 100 poses/800 trig calls each, 1s per
batch, 10s overall. Record counts/widths and all four costs, no result cache or
parameter search. Cooperative guards stop at checkpoints, not inside BigInt ops.
Exceeding a bound stops for bounded replan, never silent fallback or raised limits.
After focused proofs/profile, run full app unit/type/build/lint/naming and scoped
independent review. Later C integration separately audits RigidTransform, quaternion
normalization, source/rest identity and every chain rounding operation; scalar
success alone cannot close articulated FK/sweep or the pending material decision.

Bounded polynomial scalar evidence is implemented without connecting C point FK.
Three converter cases first failed against the absent API; the polynomial suite
first failed collection against its absent module, and the width-observer case
separately failed before that handoff existed. Eight focused numerical/ownership
cases now pass, using independent direct rational sums and rounding controls.
The fixed normal first/repeated batches took 30.9/29.3ms; subnormal first/repeated
batches took 452.4/444.9ms. Each performed 800 trig evaluations/8400 terms; actual
maximum temporary width was 21595 bits, below the unchanged 24000-bit guard.
All four batches passed the original 1s bound and the whole profile stayed below
10s; these are scalar costs, not a real-time movement guarantee. Full app tests
passed 430 cases, build/typecheck and naming pass; lint passes with 10 console-log
warnings and no errors. Its equivalent extrema branch style correction also passed
the focused extrema case. Independent numerical and work-handoff reviews found no
remaining issue; the original shared scalar body is unchanged. Original C trig,
RigidTransform, normalization and source geometry remain untouched. Their numerical
integration requires a separate canonical-model and consumer review before use.

Next bounded C Step Card: completed-pose affine handoff preparation. Add
evaluateRobotAffinePose in robot-kinematics.ts over exactly one existing point
evaluation, with final raw quaternion/unit-scale Matrix4.compose coefficients.
Keep old point/tool bits and source refs; no polynomial switch, normalized rotation
or per-joint matrix-chain substitution. Return completed pose plus affine parts
and actual per-call unique-transform work count, sharing matching frames.
Only this C file, its direct test/new snapshot evidence and API/spec/Inspector/plan
may change. Formal missing-entry red first; then installed Three per-coefficient
bit oracle across original 56-pose domain, source/translation identity, unique
transform reuse and zero source generation. Preserve historical point fingerprints
unchanged; matrix association may differ from old point multiplication.
Run focused/old consumer controls, full app unit/type/build/lint/naming and scoped
independent review. This is an unused prepared handoff, not downstream authority
adoption: no runtime/engine/D edits. Stop for any required point semantic change or
consumer mismatch rather than broadening this owner. Later C polynomial integration
and D interval/frame adoption remain separately gated numerical work.

Completed-pose affine preparation is implemented. Two missing-entry cases first
failed, then all 15 focused rig cases passed, retaining the original 56-pose
fingerprints. New coefficients match installed Three compose bits; original source
vertices consume them with Three matrix association, while the test explicitly
records differences from the old point helper rather than using EPS equality.
The nonunit algebra counterexample is labeled separately from admitted robot poses.
One point evaluation performs four sine/four cosine calls, with each actual unique
transform converted once and shared among its parts; no source is regenerated.
Conversion work increments at the actual converter entry, not from cache size;
the final counter-only correction passed focused/type/lint/naming and scoped review.
All 433 app tests, build/typecheck, lint (10 console warnings, no errors), naming
and independent scoped review pass. No snapshot was rewritten, and no C trig,
consumer, renderer or D query behavior changed. This closes the prepared affine
handoff only; downstream authority adoption and numerical integration remain open.

Next bounded D Step Card: robot-body completed-affine query adoption. Ray/collision
consume C evaluateRobotAffinePose once per batch and reuse frames by actual affine
identity. C binary64 coefficients become singleton inputs; preserve outward forward
application and true cofactor inverse, with determinant ambiguity unknown. Report
actual C fk/bodyMatrices, no fixed count or duplicate raw-quaternion producer.
Only ray-query/collision, direct tests and API/spec/Inspector/plan may change;
source-hierarchy test helper only if its direct body frame input must adopt the
same C product, never tree/pruning/budget behavior. No C point/poly, base/camera/
farm/instance, scalar, predicate or material edits.
First formal missing-adoption/work red; then actual C/Three source coefficient and
vertex enclosure, independent body ray/surface-pair and witness controls, inverse
ambiguity, frame reuse/currentness/zero-generation cases. Preserve unexpected old
boundary failures and review exact new-authority evidence before any expectation
change; do not mechanically turn unknown into accepted output. Run all original
numeric/other-transform controls, full app unit/type/build/lint/naming and scoped
review. This is a real fixed-pose body consumer adoption, not full-world/GPU or
joint-trajectory clearance. Stop if an extra transform owner change is required.

Robot-body affine adoption is implemented. The initial seven missing-adoption,
entry and work assertions failed while 60 existing controls passed. The final
69 focused cases and all 437 app tests pass, including original source/currentness,
other-frame and numerical controls. Actual articulated tool-guard ray and surface
pair witnesses use independently composed Three source points; forward intervals
enclose original vertices and true inverse controls retain singular uncertainty.
The new ray fixture initially approached an inward-wound face along parallel
faces and remained unknown; its retained failure is a fixture limitation, not a
fixed query bug. Its permanent exterior oblique control changes no predicate.
Each batch uses one C completed affine pose, preserves original affine identity
reuse, and reports the actual C matrix work. Test-only hierarchy and passive
profiles changed only their direct body input; original domain counts remain
unchanged. Build/typecheck, lint (10 existing console warnings, no errors), naming
and diff checks pass. Independent scoped numerical/code review found no remaining
finding. This closes fixed-pose body coefficient adoption only;
C point trig, material/contact decisions and whole joint-trajectory evidence remain
separate work.

Next bounded C Step Card: canonical polynomial point integration. Replace only
the number adapter sin/cos with existing S19/C20 nearest-even results at the actual
rounded half-angle. Preserve chain, other arithmetic, final affine association,
source/rig identities and rest; no new API/model flag/cache or D predicate changes.
Exact boundary is the matching Inspector section and its direct test/snapshot
allowlist. The historical 56 hashes stay unchanged; first freeze pre-switch unique
body transforms, frames/tool Float64 outputs, with independent source mapping and
reference controls. New-model rational/scalar integration and Three source evidence
are separate from the historical Math adapter. Global norm recurrence is exact
mathematical evidence, not a Math.hypot or base-admission guarantee.

Future implementation gates: formal missing-integration red, original source/rest,
all approved limits and half-angle subnormal rounding, actual eight trig calls,
new-model and old/new drift evidence, actual projection/D ray/surface consumers,
then full app/type/build/lint/naming and independent review. Four full affine-entry
batches of 100 poses each, normal/subnormal first and repeated, retain 1 second
per batch, 10 seconds total and 24000-bit guards. Stop for failed numerical/consumer
proof or exceeded guards rather than changing tolerance or scope.

This quota-limited segment executes only thin readiness and the pre-switch formal
baseline, then freezes and waits for root. It does not authorize continuing into
the production switch, another owner, or unrelated broad gates in the same segment.

Pre-switch baseline is frozen from the unchanged real point entry: 56 fixture
outputs preserve unique transform, frame/tool and signed-zero Float64 values, with
part/source/body/order and transform-reference mapping verified independently.
Invariant mapping is stored once per definition; no source buffers are copied.
The new baseline and original 56-hash case both pass. The historical snapshot is
byte-for-byte unchanged; scoped type/lint/naming/format checks pass. Production
has not switched. This bounded segment stops here pending root quota review.

Root released baseline commit 8be82417d for the single C point production
integration and its declared gates. This supersedes the preceding baseline-only
execution restriction, without expanding the owner. Freeze after this slice and
wait for root; the quota stop instruction overrides continued work.

C point polynomial integration is complete. Two formal missing-adoption cases
first failed (four old Math calls and zero shared polynomial calls); 25 focused
cases then passed. The adapter alone changed to shared S19/C20 values; rounded
half-angle, canonical chain and affine association remain unchanged. The two
historical snapshots remain byte-for-byte identical, reproduced by the explicitly
test-only preceding-model adapter through the shared chain. All 56 declared
fixtures showed zero quaternion/tool/source-vertex drift; this measured result is
not a claim of universal bit compatibility.

Permanent exact rational recurrence proves the stated mathematical norm bound,
separate from sampled admission checks. Complete affine-entry batches measured
34.5/33.1 ms for normal first/repeated and 449.2/468.7 ms for subnormal first/repeated:
each contains 100 poses, 800 trig evaluations, 8400 terms and 600 actual matrices;
maximum temporary width was 21595 bits. All original fixed guards passed.
All 442 app tests across 45 files, build/typecheck, naming, format/diff checks and
lint (12 console warnings, no errors) passed, including actual projection, D ray
and articulated surface-pair consumers. Independent scoped numerical/code review
found no remaining finding. This slice is frozen and stops for root quota review;
it does not establish joint-interval motion, material/contact or harvest clearance.

Next bounded readiness card: C joint-domain interval pose preparation. The one
new entry consumes existing numeric domains and uses shared outward arithmetic
plus directed polynomial bounds through the canonical chain. Generalize the
existing final-quaternion affine formula once, preserving current point bits, and
reuse its completed interval output per transform identity. It encloses admitted
binary64 point tuples, not a correlated time trajectory or collision clearance.
Exact allowlist and DoD are in the matching Inspector section; no scalar/poly/D
production or material change is included. Subsequent D domain construction and
articulated surface coverage must consume this source authority in their own cards.

Future formal gates distinguish mathematical enclosure from sampled regression,
retain all historical/current point/source evidence, and prove validation/identity/
immutable ownership plus actual work. Fixed profile uses a full-domain small case
and four 25-box batches with 200 bound-trig calls each, at most 400 polynomial
evaluations, 1 second per batch/10 seconds total and existing 24000-bit guards.
Record complete entry cost and useful finite bounds; do not add a cache or increase
guards. This segment only writes/reviews readiness, then freezes for root quota
review. No tests, implementation or following owner is authorized in this segment.

The Inspector fixes tightness before implementation: DEFAULT_ROBOT rest and named
nonzero singletons both permit widths at most 1e-10 in position/metres
and quaternion/direction/affine coefficients; ±1e-6 joint box at most 1e-3, refined
±1e-7 box at most 2e-4 with nonincreasing maxima. These test gates do not introduce
a collision tolerance or require bit-identical signed zeros from set enclosure.

Root released readiness commit 36ec0a102 for one C interval-pose implementation
and its frozen gates. No D consumer or subsequent owner is included. Complete
this slice, freeze and stop for root quota review; the quota stop takes priority.

C interval-pose preparation is implemented. Six missing-entry cases first failed;
five small correctness cases and then 31 focused cases passed with the original
scalar, polynomial and point/Three evidence. The private interval adapter reuses
the single chain and generalized final-affine formula; no scalar/poly/D producer
changed. Predeclared rest/nonzero/narrow/refined tightness gates pass unchanged.
Actual call-local scalar/trig work and per-transform affine reuse are verified;
caller mutation, clone-once rejection and zero source generation remain explicit.

Four full 25-box batches measured 23.5/21.1/233.7/230.6 ms: each performed 200
bound-trig calls, 400 polynomial evaluations, 4200 terms, 150 matrix conversions
and 20100 binary operations; maximum temporary width was 21595 bits. All fixed
guards passed. All 448 app tests across 46 files passed, including existing D
consumers and historical/current point evidence. Build/typecheck, naming and lint
(13 console warnings, no errors) passed; a test-only readonly cast clarification
required one ownership case plus build/type recheck, without runtime changes or
a repeated full suite. Independent scoped numerical/code review found no remaining
finding. This six-file slice freezes and stops for root quota review; interval
set enclosure is not correlated joint trajectory, material or movement clearance.

Next bounded readiness card: D motion point-time joint-domain preparation, before
source-affine bounds. JointSegments.enclose internally assesses one raw segment
against the current issued source; it never trusts a caller's admissible flag.
The once-detached segment plus once-detached closed window feed one exact rational
point producer with a single nearest-even conversion. Preserve declared segment
endpoint bits; derive domains from endpoint min/max using the monotonicity proof,
not rounded intermediate interpolation or a clamp. Zero-length query windows are
allowed; half-open validity must strictly extend beyond the closed window end.

The matching Inspector fixes inputs, failure/lifetime ownership and direct
motion/test allowlist. Existing ideal speed evidence is separate from rounded
point-time values. No C/FK, source surface, material or contact work enters this
first dependent slice. A later D source-affine owner must supply explicit whole-
window source/dynamic state and cannot treat these domains as clearance.

Future gates retain exact speed/source controls, independent rational extrema/
rounding and invalid/forged/retired/clone-once cases. Each request evaluates at most
two distinct times across five joints, at most ten conversions. The fixed profile
uses 100 normal and 100 extreme/subnormal windows with complete entry costs:
1 second per batch, 10 seconds overall, unchanged 24000-bit guards. No runtime
cache or new scalar producer. This segment writes/reviews readiness only, freezes
and stops for root quota review; no tests or implementation are started.

Root released a06511279 for one D motion enclose implementation and its frozen
gates. Complete only this owner, then freeze and stop; quota stop instructions
take precedence. No source-affine or later consumer work is authorized.

D point-time domain preparation is implemented. Four missing-entry cases first
failed; all 13 focused cases and 454 app tests across 46 files passed. Independent
rational/tie-even oracles cover endpoint bits, monotone domains, subnormal and
extreme times; clone-once, forged input, source retirement during conversion and
zero FK/bounds/source generation controls passed. The fixed profiles used 100
normal and 100 extreme windows: 17.1/15.6 ms, each 200 point evaluations and 995
conversions, with maximum temporary widths 2156/3146 bits. All original guards
remain unchanged. Build/typecheck, naming and lint (14 console warnings, no
errors) passed. Independent scoped code/numerical review found no remaining
finding. This six-file slice freezes and stops for root quota review; the output
is point-time joint-domain evidence, not source-affine or movement clearance.

Next bounded readiness card: D RobotMotionBounds.enclose directly consumes one
internal motion.enclose and one C interval pose for the same current issued source.
The exact Inspector limits this first surface-envelope owner to all original robot
parts/regions under explicit fixed base position/raw quaternion, unchanged shapes and
empty-held assumptions. Environment state is outside its coverage; material and
intended-contact decisions remain pending independent owners. Cached original
bounds and C affine identities supply call-local shared envelopes, without source
triangle scans or a new derived-data cache. Existing query matrix application is
the direct arithmetic owner; no formula is copied or point-C behavior changed.

The Inspector predeclares actual source/Three enclosure, mapping/lifetime/schema
and zero-generation gates, singleton/narrow usefulness thresholds and four fixed
ten-entry complete-cost batches. Unprepared region bounds conservatively retain
the mesh envelope with explicit provenance. A finite envelope is neither a solid
nor a collision decision. This segment writes/reviews only the three existing
readiness documents, then freezes and stops for root quota review. Future API,
formal tests and implementation require the next explicit release.

Root released 6432d959b for one RobotMotionBounds implementation and its fixed
gates. No C/scalar/predicate/session/material changes or subsequent owner are
authorized. Complete this slice, freeze and stop for root quota review.

Robot source point-time bounds are implemented. The initial formal red was a
missing-module collection failure. Seven new cases and 89 focused tests passed;
the complete original vertex/region oracle initially exceeded 10 seconds because
of per-coordinate assertion overhead. Keeping every original vertex/index visit
while using direct comparisons with failure details reduced that oracle below
one second; no test coverage, production behavior or time guard was relaxed.
Independent Three/source, arbitrary fixed near-unit base, original mapping and
mesh-envelope provenance controls pass. A tracked source-buffer fixture proves
zero position/index reads after preparation, including same-shape/different-region
mapping and shared affine/local-bound work. Source retirement and clone-once
schema/mutation checks preserve atomic publication.

Four ten-entry complete-cost batches measured 62.7/43.6/118.2/114.3 ms, each with
80 bound-trig calls, 160 polynomial evaluations and 17120 corner transformations;
maximum temporary width was 21595 bits. All predeclared usefulness and resource
guards passed. All 461 app tests across 47 files, build/typecheck, naming and lint
(15 console warnings, no errors) passed. Independent scoped numerical/code review
found no remaining finding. This seven-file slice freezes and stops for root
quota review. Robot surface envelopes do not provide pair, environment, material,
contact or movement clearance, and no next owner begins automatically.

Next bounded readiness card: SurfaceQueries.coverMotion accounts for the complete
robot/environment and distinct-part self triangle domain using whole-window robot
envelopes and explicitly stationary environment source state. The current collision
owner shares its inventory/traversal and static environment bounds; no new numerical
or source producer is introduced. Finite strict bounds exclude domains, surviving
finite domains remain candidates, nonfinite domains unresolved, and declared
mesh/region budget remainders unvisited. This stage deliberately has no articulated
narrow predicate: endpoints and fixed-translation evidence cannot close that gap.

The Inspector freezes the exact four-way accounting, identity/lifetime and work
reuse gates plus two fixed actual-source profiles. Material/contact decisions are
still pending independent owners and receive no implied approval from these surface
counts. This segment changes only existing spec/Inspector/plan readiness, obtains
independent review, then freezes and stops for root quota review.

Root released 475823c61 for this one coverMotion implementation and its fixed
gates. No narrow solver, material or later owner is authorized. Freeze and stop
after completion for root quota review.

D point-time surface domain exclusion is implemented. The inherited six missing-
entry/API cases first failed and then passed; the completed focused suite now has
53 collision cases, including two joint windows at fixed nonzero base poses, exact
four-way domain accounting, interior-window overlap, strict budget handling,
unknown/expired state, clone/currentness and the single RobotMotionBounds handoff.
All 468 app tests across 47 files, build/typecheck, naming, scoped formatting and
app lint (16 console warnings, no errors) pass.

Both fixed actual-source entries retain the 43,429,284,640-pair inventory and
269,533 mesh comparisons. With the unchanged 10,000 region-comparison budget, the
rest case measured 119.3 ms and left 22,993,872 pairs unvisited; the centre
+/-1e-6 case measured 89.4 ms and left 21,079,856 unvisited. Both remain `unknown`,
perform zero triangle/source-buffer visits, use one interval FK product and stay
within the unchanged 24000-bit guard. This is complete conservative surface-domain
accounting for the bounded owner, not articulated narrow coverage, movement
clearance, material/contact permission or physical evidence. Independent sub-PR
review remains the merge gate.

PR #199 CI correction card: the Ubuntu validation of head `96bec5688` exposed five
test-oracle and scheduling failures outside the changed collision owner. Base and
head domain blobs are identical. The two whole-source snapshots hash binary64 arrays
containing runtime `Math` transcendental outputs, so a different Linux digest does
not identify a source change. Preserve the existing snapshot values as historical
evidence in named runtime fixtures; do not replace them with received Linux
hashes. First obtain bounded
per-value evidence on the unchanged head, recording semantic path, both Float64 bit
patterns, absolute delta and ULP distance. Keep that diagnostic as a formally
runnable test artifact. It does not set acceptance.

Source-oracle owner: the existing C source tests. Inputs are current robot/cultivar
products and their original metadata. Outputs are exact topology/identity/region/
partition/material and repeat-generation checks, exact digests at the existing
Float32 render storage boundary, plus unrounded finite dimensional, geometric,
color and conservative-query relations. Float32 comparison is presentation evidence
and does not alter source buffers or create a D tolerance. D continues to consume
each platform's original binary64 source values as exact singleton inputs; existing
unknown and outward interval behavior remains mandatory. Production generators,
kinematics, scalar owners, collision and existing snapshot values are outside this
correction allowlist. Mutation controls must prove topology and numeric semantic
changes are detected before retiring the nonportable cross-runtime digest assertion.
No rounded Linux hash becomes a new golden.

Profile scheduling owner: FieldScope test configuration/package scripts and the
root CI test sequence. Move the three existing scalar/point/interval elapsed cases
unchanged into a formal profile suite excluded from ordinary FieldScope Vitest.
After `yarn test:ci --concurrency=2` finishes, CI must invoke one FieldScope profile
command with one worker and no file parallelism. A workflow contract test first
fails while this stage is absent. Keep every fixed input, work assertion, 24000-bit
bound, one-second batch limit, ten-second total limit and fail-fast error. Do not
change production, add dependencies, upgrade tools, add caches or infer runtime
performance.

Correction allowlist: the four harvest-robot contract documents; robot/crop source
tests and a direct shared test oracle; the three domain profile tests; FieldScope
Vitest/profile configuration and package scripts; CI workflow and one direct
workflow-contract test. Required gates are focused red/green mutation
controls, workflow sequencing, ordinary FieldScope tests, isolated profiles, root
script tests, app typecheck/lint/naming/build and final PR CI. Stop for a source
semantic mismatch, a profile that still exceeds its unchanged guard while isolated,
or any required production/tool/dependency change.

The isolated Ubuntu run for `ad2ee1536` accepted the exact structure and Float32
render handoff for all 135 semantic source paths while retaining the Float64
diagnostic: 69 of 179390 values differed, by at most 4 ULP and
5.551115123125783e-17. The interval profile passed its subnormal batches in
733/716 ms, but the scalar and point profiles reached their unchanged one-second
batch guard in 1203/1237 ms. Source inspection located the shared cost in exact
BigInt width accounting: every Horner operation repeatedly materialized a binary
digit string solely to measure the same mathematical width. A fixed-size diagnostic
confirmed hexadecimal digit measurement reduced this output-free work without
changing the measured width; it was supporting evidence, not a replacement profile.

The missing shared bit-length helper first failed its independent direct test.
The implemented helper derives the exact mathematical width from hexadecimal
length and its leading nibble, with zero remaining one bit and negative values
measured by magnitude. Its private sibling module leaves the supported scalar
namespace unchanged while both existing scalar width consumers reuse it;
polynomial values, operation order, rounding, observer calls, evaluation/term
counters, maximum-width reporting and 24000-bit rejection remain unchanged.
Direct scalar, point and interval tests pass. The unchanged local fixed profiles
now measure subnormal scalar batches at 137.1/136.9 ms, point batches at
143.6/141.6 ms and interval batches at 79.4/77.3 ms. Exact-head isolated Ubuntu
profiles remain the required portability and merge gate; no timing result supplies
a motion or hardware claim.

Material/contact sub-PR execution card: the user approved only robot-cylinder seam
closure, capped `lift-screw`/`upper-arm`/`forearm`/`camera-bracket`, and near/distant
main-skin pole closure. The source slice preserves all dimensions, generic tubes,
crate pieces and botanical detail and follows the #199 portability contract. The C
metadata slice owns exact region-local patches, complete body assemblies and five
joint interfaces through projection/query currentness. The D slice owns one
full-interval synthetic `admitted`/`blocked`/`unknown` result from internally
admitted motion and exact current support/target identities. No cache, persisted
identity, force model, tolerance, fixture geometry or new degree of freedom is in
scope.

Tests precede each production slice. Source closure and unchanged-detail oracles
precede generator edits; patch/body/interface rejection and interval-invariance
oracles precede C metadata; missing D entry and normal/matched-negative cases
precede contact implementation. The actual tomato case derives only a legal width
from original skin/pad geometry and uses a real five-joint/base path; failure stops
at its first owner rather than changing source or declaring global impossibility.
After all owner slices, run one consolidated FieldScope/default/profile/build/lint/
naming gate and synchronized robot/crop close-ups, then one independent review.
Exact-head CI and goal integration remain later gates; this work never merges main.

D terminal-contact classifier replan: the actual-source regression reached exact
two-pad SurfaceQueries intersections, but the first classifier then treated
strict overlap on the tool closing-axis projection as proof of three-dimensional
pad/fruit interior penetration. That projection is only a candidate bound under
the Inspector contract and cannot publish blocked. Freeze this source-unchanged
candidate as the failing regression; do not require both sampled projection
extrema to be exactly equal or search further headings to evade the classifier.

The corrected owner uses the original closed-solid regions and one common exact
affine coordinate representation. Completed C frame coefficients and original
source vertices are lifted to dyadic scalars before matrix-vector multiplication;
terminal surface loci, material SAT and swept contact never round an intermediate
world point back to binary64. Each queried source region must prove exact indexed
closure, convexity and nonzero signed volume. The corresponding exact transformed
region must also prove nonzero signed volume and convexity before strict overlap
on the complete face-normal and edge-cross-edge SAT axes can publish penetration.
Any exact or conservative-interval strict separating axis is sufficient to prove
separation. Supporting-axis equality can prove no interior overlap only when the
terminal contact locus is proven in the same exact representation. Missing
closure, convexity, dimension, transform or relation remains unknown.

The terminal owner evaluates the complete pad-solid against selected fruit skin
and botanical-detail domain. A terminal locus is allowed only when it is a subset
of the closed inward patch and tomato skin. A shared inward/bottom edge remains
part of the inward patch closure; the neighbouring triangle ordinal alone does not
make that locus forbidden. Any locus extending off that closure blocks. Calyx and
pedicel contact always block, including at a shared skin point, and unresolved
locus attribution remains unknown. Surface witnesses and material classification
therefore consume the same exact affine triangles rather than combining rounded
SurfaceQueries output with a different material model.

Bounded fixture correction after the complete detail domain first ran: centering
the much taller pad on the fruit equator left four degenerate calyx triangles as
unresolved terminal candidates, before the closed-solid relation ran. Placing the
pad top exactly on the first original ring above the equator excluded the calyx
but put one skin witness on the pad's non-inward depth face. The final bounded
fixture iteration freezes three width candidates before any contact query. The
original skin extrema along the fixed source closing axis and the existing
generated-pad aperture formula produce one nominal legal width; its immediately
lower and higher binary64 neighbours complete the bracket. There is no heading,
vertex or iterative width search. Projections only construct and order those
candidates and never decide feasibility.

For each frozen width, the source closing coordinate of every inward patch is
kept from one of its exactly coplanar original vertices. The perpendicular
horizontal component aligns the inward-patch centre to the original fruit centre.
The pure `-Y` lift must place the equatorial contact on the inward patch's leading
bottom closed boundary at terminal time. Putting that point in the inward-face
relative interior would necessarily produce contact during an open interval before
terminal time and is not an admissible fixture. The resulting base translation
and lift enter through the real fixed-heading base/five-joint path and add no
tolerance, source change, actuator or caller tool transform.

Each of the three candidates runs through the same current-source
MaterialContactQueries owner, including the complete pad against skin/detail
surface domain, exact closed-solid relation and approach interval. Only that
owner may admit a candidate. If none is admitted, the formal failure records all
three exact widths and their full status/reason results, then stops without
trying another heading, pose, projection equality or local numeric adjustment.

The first three frozen candidates passed the rounded terminal triangle domain and
then returned the same unresolved closed-solid relation. That result is retained
as regression evidence, but rounded world triangles cannot be combined with an
independent source-exact material proof. Existing canonical boxes are
geometrically closed while their six faces retain duplicate source indices at
equal corners, so source closure welds vertices only by exact source-coordinate
identity before checking opposite edge pairing. Index identity alone is not a
closure requirement. The corrected terminal, locus, material and sweep owners all
use the one exact affine representation described above. If all three fixed
candidates remain blocked or unknown after that owner correction, their exact
production reasons are the final fixture evidence and no extra pose search begins.

The source-detail blocker requires one bounded orientation correction rather than
an angle solver. Three poses are frozen before D runs: A has yaw `pi/10` and wrist
`+pi/3`; B has yaw `pi/10` and wrist `-pi/3`; C has yaw `3pi/10` and chooses one
of those two wrist limits by a single source projection comparison that maximizes
the retained triangle 862 distance from the pad upper half. Shoulder and elbow
remain zero, base heading remains zero and only lift changes during approach.
The yaw bisectors lie midway between the five retained sepal directions, while
the wrist limits maximize tangential displacement of upper pad material. Each
pose independently derives its nominal aperture from the actual skin support
span along that pose's completed closing direction and freezes only the nominal
binary64 value plus its immediate neighbours. Base closing/tangential translation
and terminal lift align the two support-feature midpoint with the two pad leading
boundaries. These nine fixed requests run through D once as one batch; projection
constructs the fixtures and never classifies contact. A failed batch records the
first D reason for each pose/width and proves only that this bounded set did not
produce the normal case.

The single triangle-862 projection comparison selected C wrist `+pi/3`. A and B
derived nominal width `0.36707918559663716` with immediate neighbours
`0.3670791855966371` and `0.3670791855966372`; C derived nominal width
`0.36458853973046085` with neighbours `0.3645885397304608` and
`0.3645885397304609`. The one D batch rejected all nine at the same first owner:
pad `pad--1` triangle 6 had exact terminal contact with retained calyx triangle 860. This is bounded evidence that these three poses do not supply the required
normal case; it is not a claim that the legal five-axis domain is globally
unreachable.

D terminal-contact Step Execution Card: owner is Inspector D
`MaterialContactQueries`. Inputs are the current `GeometrySource`, original C
closed-solid and patch metadata, admitted joint segment/window, fixed-heading base
path and explicit full-window source state. Outputs are immutable categorized
terminal loci, material relations, full-interval approach witnesses and the
existing `admitted`/`blocked`/`unknown` result. Conditions require two inward-pad
skin loci at terminal time, no off-inward or botanical contact, no interior
penetration, and no approach contact before terminal; incomplete proof is unknown
and carry remains on its existing route. Allowed contributors are C metadata,
JointSegments, RobotMotionBounds, QueryGeometry and the minimal exact
triangle/frame arithmetic in collision/ray-query. Forbidden contributors are
rounded-world positive proof, projection-as-penetration, tolerance, source or
fixture reshaping, triangle-tag exemptions, new actuators and physical safety
claims. The implementation boundary is material-contact.ts plus the already
allowed collision/ray-query helpers, direct tests and synchronized spec/Inspector
wording. Formal regressions cover the frozen three candidates, shared-edge locus
attribution, off-edge and botanical controls, actual penetration, missing proof
and work counters. Stop if the common exact representation cannot serve terminal,
material and sweep owners or if any existing source/DOF/API must change.

D joint-envelope replan: before any further normal-case run, the existing moved-
envelope regression must first reach its authored wrist control through every
earlier interface. Its current RED result instead fixes the first lift witness as
`mast--1` triangle 2 against `lift-carriage` triangle 9, with neither triangle in
the issued lift patches. At the A-nominal source dimensions, their exact start and
end loci are nondegenerate line segments while the two closed boxes also have
strictly positive overlap in all three axes throughout that lift segment. This is
not a boundary-only contact that an inside-envelope test may exempt. The next
implementation may add only source ranges that already geometrically constitute
the authored rail/guide interface and must still prove every locus and complete
material overlap inside the full-interval envelope. If the existing unsplit source
triangles cannot express that local interface without relabelling non-interface
solid volume, changing source topology or broadening the envelope, stop at this
specific C metadata/source conflict; do not add a blanket joint exemption or run
the nine frozen tomato candidates again.

The bounded C review found that the lift source already has sufficient triangle
granularity. Across its complete original `[-0.1, 0.1]` domain, the interacting
mast faces are triangles 2 through 7 on each mast, the interacting lift-screw side
is triangles 0 through 31, and the interacting carriage faces are triangles 0, 1
and 8 through 11. These exact existing ranges, rather than a whole part or a name-
based D exception, define the corrected lift patches. The former symmetric
`max(width * 0.2, 0.12)` envelope is an implementation heuristic, not a product
value: C must replace it with the finite outward AABB of the union of each original
fixed-part material intersection with the translated carriage over the full lift
domain. Formal C tests first prove those two patch sets, complete-domain overlap
containment and strict separation outside that derived envelope. D then consumes
the corrected metadata unchanged; no source triangle, joint domain, third-body
rule or material/contact permission changes in this owner correction.

# Harvest robot product contract

## Current milestone: M2

M1 provides pure, deterministic engineering assessments, not actuation, physics,
a trained detector, a scheduling service or a rendered robot. The remaining milestones are defined
in the [plan](/docs/ai/apps/fieldscope/plans/harvest-robot/plan.md). The physical
assumptions and validation obligations are in [hardware concept](/docs/ai/apps/fieldscope/specs/harvest-hardware.md).
No software result may be labeled certified safe or a measured ground property.

## A - Feasibility inputs and results

All dimensions use metres, loads kg, accelerations m/s², angles radians. Numbers
must be finite and physically ordered; unknown observations are explicit `null`
or a declared unknown state, never zero. Reject invalid input rather than clamp.

Lane assessment consumes an existing validated FarmConfiguration, a candidate
lane (soil strip index within one bay, drain strip, or inter-bay passage), stowed
vehicle width/length/height and lateral clearance, plant-envelope reserve,
longitudinal center-path interval, measured entrance width/height and front/rear
headland depths (unknown permitted), and ground survey status. Output records
usable width, required width, travel bounds and blocking/unverified reasons.
It is a necessary straight-line screen, never a full swept-path proof.

- Reuse `configurationSite`/`createLayout` and `createPlantingRows`; do not copy
  strip accumulation, margins or row offsets into a competing farm model.
- Crop-facing soil-strip bounds stop at adjacent root centerlines plus the
  configured canopy reserve. Retain at least that reserve even when crop layers
  are hidden. Plant rows have full longitudinal extent for this screen.
- Shared passages contain center columns; a fixed straight path must use one
  side. Available width is one side margin minus half the post diameter.
- Drains are blocked as bearing surfaces even if a narrower chassis could fit.
- Required width = stowed width + twice lateral clearance. Width equality passes
  this necessary test; site calibration/uncertainty remains separate.
- Center interval must keep half the stowed length within the greenhouse or
  measured usable external headlands. A 0.25 m plant setback alone is not a dock.
- Entrance width/height must clear the stowed envelope; unknown measurements are
  unverified. Stowed height must also fit under the crossbeam.
- Unknown or unverified soil is unverified. Confirmed soft/sinking ground blocks
  admission. A prepared/surveyed surface only passes this ground prerequisite;
  it does not prove full robot/crop collision clearance or physical safety.
- Any blocking reason -> `blocked`; otherwise any missing evidence ->
  `unverified`; otherwise `screened`. Each report explicitly retains unresolved
  full-envelope, braking, stability, dynamic obstacles and physical validation.

No optional cache. One assessment invokes layout and planting-row preparation
once each (the existing row helper also prepares layout, for two bounded layout
passes total); downstream checks consume their results. It must not generate any
crop variants, scene meshes, GPU resources or all per-plant positions. Work is
bounded by bay/strip count rather than planted length. Calls never mutate input.

## A - Crate and load assessment

Inputs: tare-inclusive base mass, payload mass, proposed next-fruit mass, usable
payload limit, measured fill fraction, return fill fraction, latch/scale validity,
contact track, base/payload heights and lateral offsets, roll, lateral acceleration
and a nonnegative lateral reserve for uncertainty. Base mass excludes fruit but
includes arm/tool/crate in the declared stowed pose. Assess load only in that pose;
working-arm configurations need separate mass properties and moment validation.

Total mass = base + payload. Compute weighted lateral CoG and height, then
lateral reserve = half track - abs(CoG x) - CoG height * tan(abs(roll))

- CoG height * abs(lateral acceleration)/9.80665 - uncertainty reserve.
  No positive reserve proves safe motion; this is a quasi-static screen. Roll is
  restricted below pi/2; negative masses/dimensions, fill outside [0,1] and non-finite
  values are invalid. Next fruit must not be admitted when projected mass exceeds
  the limit. At exact capacity or operational fill threshold request exchange.
  Crate latch loss, untrusted scale, current overload or nonpositive current lateral
  reserve -> `stop`; projected overload/nonpositive projected reserve, capacity or
  fill threshold -> `exchange`; otherwise `continue-screening`. Report current and
  projected reserves. No inventory or mass changes occur in assessment.

## A - Energy admission

Inputs are nominal pack Wh, usable aged/temperature capacity fraction in (0,1],
SOC fraction, absolute SOC uncertainty, next-work Wh, verified loaded-return Wh,
contingency Wh and positive reserve Wh; all finite and nonnegative with fractions
in [0,1]. Fresh battery evidence, return-path admission and dock availability are
explicit booleans. Consumption estimates include drive, arm, perception, idle and
bounded waiting, and must be measured separately before hardware use.

Available Wh = nominal Wh * usable fraction * max(0, SOC - SOC uncertainty).
Return requirement = return Wh + contingency Wh + reserve Wh.
Mission requirement = next-work Wh + return requirement.
Missing/stale battery, blocked return, unavailable dock or energy below return
requirement -> `hold`; enough for return but not the next work -> `return-to-charge`;
otherwise `continue-screening`. Equality is admitted only with the declared
positive reserve intact. Report dispatch minimum SOC and whether the mission
would be impossible even at full charge. Do not clamp that minimum to 100% and
hide an undersized battery. No dock control or runtime guarantee is produced.

## A - Hazard policy

Given explicitly supplied observations and completed load/energy actions, return
one prioritized advisory action. A load stop (including untrusted scale or current
overload) always immobilizes before return requests.
Emergency stop/person -> `protect-people`; traction loss/sinkage/tilt/lost crate
retention -> `immobilize`; stale sensing/communication -> `await-observation`;
obstacle -> `wait-or-replan`; contact with leaf/net -> `hold-tool`; insufficient return energy -> `await-observation`; energy return request ->
`return-to-charge`; capacity -> `return-to-dock`; uncertain fruit/peduncle or unseen
fruit -> `observe-or-defer`;
otherwise `continue-screening`. Every action except continue inhibits cutting.
Every hazard stops travel; only `return-to-dock` or `return-to-charge` permits travel after a separate
admitted return route and stowed-tool check. Do not let load logic override
people, instability, contact or sensing faults. No policy output commands a blind
arm retraction, releases the crate, enables leaf manipulation or certifies safety.

## Future user-facing contract (M2/M3)

Users select lane IDs and direction, a bounded longitudinal route, scan sides,
patrol period and exchange station; no route may silently jump between bays.
Route obstacles/headland transitions require explicit valid segments. Start,
pause, resume and fault acknowledgement are distinct actions. Periods are measured
from scheduled starts; unfinished runs block overlap and missed intervals coalesce.
A terminal fault requires explicit acknowledgement and renewed valid observations.
Browser backgrounding/reload must not imply physical autonomy; simulation time and
real timestamps remain distinct. No backend scheduler is delivered by M1.

Per-fruit states: attached -> supported -> detached/held -> boxed, with explicit
failed/deferred/dropped branches. Confirmation of cut and retained fruit is required
before weight/inventory changes. A lost observation does not remove a fruit. Mixed
cultivars cannot enter an incompatible crate. Each state change carries target ID,
run ID, evidence and time. Machine sensor evidence cannot be undone with plan edits.
Geometry can illustrate observed or synthetic states but cannot declare a successful
real harvest. Mark synthetic data, assumptions, stale observations and deferred rows.

## M1 definition of done

Formal tests exercise valid, exact-boundary, unknown, invalid and failure-priority
cases, plus geometry-preparation work counts and configuration changes. Typecheck,
app lint and existing app unit regressions pass. No UI, render, runtime or hardware
consumer is introduced until its subsequent owner step is ready. M1 completion is
not closure of the full harvest-robot plan.

## B - M2 editable design workspace

The robot tab edits a separate Core SceneTree settings entity. SI numeric fields:
width, length, stowed height, lateral clearance, canopy reserve; longitudinal start
and end; patrol period in minutes; crate payload limit and assumed payload in kg;
nominal battery Wh, usable fraction, SOC, SOC uncertainty, next-work/return/
contingency/reserve Wh; dock X/Z. Tool is cucumber support-and-cut or tomato padded
support-and-cut. Scan side is left/right/both. A strip mission stores its bay and
canonical `stripId`; shared-side missions keep their existing bay/side selection.
B resolves `stripId` to the current ordinal for A's positional lane assessment.
The completed report also exposes that detached immutable `route` for D's fresh
survey admission; D never resolves strip identity again. The route is null when
the selected identity or interval is invalid, and is not motion clearance. A missing selected ID produces a null lane report and invalid-route
reason; no neighbor is substituted. Removing a preceding strip or reordering
follows the same selected ID and recomputes its current route. Undo/Redo restores
both canonical strip identity and mission binding through normal state replay.
Ground and entrance/headland survey use A's explicit unknown states. Numeric ranges
are finite, ordered and positive where physically required. Invalid edits preserve
state/history. Farm edits that remove a lane or shorten an interval leave the mission
unchanged and display an invalid-route result, with no substitute route.

All values are design inputs, not live telemetry. Defaults retain unknown survey,
missing battery freshness, unverified return admission and unavailable dock evidence.
Energy screening cannot enable travel. M2 has no simulation run and no Start/Pause/
Resume control; those actions belong to M3's session. The robot remains parked at
its authored dock, independent of lane admission. A patrol interval previews a
straight candidate only, never a proven closed return path.

One settled input or selection is one Core transaction. Undo/Redo reprojects both
farm and robot owners only when their canonical values change. Concurrent patches
merge against the latest state inside the session queue; disposal rejects late writes.
The robot editor subscribes to its design report, independent of camera/locale.
A farm edit recomputes its lane report; robot edits never build farm/crop geometry.
Reports are produced once per relevant document update, not on reads/render frames.

## C - M2 dimensioned concept projection

A low battery chassis with four wheels, mast, folded jointed arm, stereo camera,
guarded crop-specific end effector and mechanically retained open crate is shown
at the dock. A separate dry charging pedestal and manual exchange stand make the
logistics visible. Dimensions follow the canonical stowed envelope. The model is
an engineering concept, not a selected bill of materials or collision proof.
Projection consumes B's completed lane report for the route. It must not recalculate
clearance. Farm geometry remains separately owned. Camera/locale changes build no
robot geometry; route-only edits do not rebuild robot topology; definition changes
replace affected geometry. No harvested inventory is fabricated before M3.

M2 acceptance: formal validation, canonical history/concurrent/disposal tests;
work counts across robot/farm/camera edits; geometry bounds and route visibility
oracles; app typecheck/lint/build/unit gates; bilingual desktop/mobile browser
checks with close-up robot/box/dock inspection. No hardware effects or new packages.

## C - M3 scene identity and geometry handoff (planned)

Before D consumes the live greenhouse, C prepares one immutable, engine-neutral
scene product from the current canonical farm and the existing domain generators.
It supplies scene revision, stable scene-local plant and fruit identities,
cultivar/variant and source fruit metadata, complete source shapes and installed
transforms for fruit, leaves, nets, structures and other collision contributors.
Source metadata is synthetic scene truth, available to D's observation/collision
adapters; it is not itself a successful observation or clearance report.

Fruit identity distinguishes individual plants and individual fruit within a
plant. Repeated cultivar instances and multiple views cannot alias targets.
Near and distant representations share the same fruit identity. Identities remain
stable throughout a scene revision and do not depend on camera, locale, visibility,
clock or pose. A relevant canonical change retires the old revision and its
observations; this slice does not promise fruit identity across regenerated scenes
or introduce persisted IDs. B's canonical strip identity remains separately owned.

Preparation preserves the current botanical source geometry, cultivar assignment,
maturity and distributions. A detachable fruit uses partitions of the same source
geometry produced for its attached form, including source ownership of cucumber
spines, tomato calyx, retained distal pedicel and late-generated surface hairs;
it is not regenerated from length/radius or replaced by a primitive. Source
triangles and material/vertex attributes remain unchanged in both near and distant
geometry. Adjacent tube segments may share source vertices. Ownership is unique
per source triangle; original vertex indices/attributes remain shared references.
Reconstruction recovers original vertex data once by source index. Partitioning
cannot duplicate or lose triangles, leave a second fruit on the plant, or remove
unrelated stem/leaf geometry. For the current tomato source, the final pedicel
segment from the point 9 mm times the canonical botanical scale above the fruit
top to its top belongs to the retained fruit; proximal segments
remain plant-owned. That boundary is explicitly a synthetic source cut site, not
a measured anatomical abscission zone or verified cultivar node. No new cut cap
or changed geometry is introduced by this partition handoff. The
existing shape generator remains authoritative; partition metadata is a handoff,
not a second crop model or another random-generation pass.

C retains admitted source metadata alongside the shapes/plant assignments already
owned by SiteGeometry. Observation/collision consumers receive that completed
product; they do not call crop or farm generators. Render layer visibility only
changes presentation. Hidden nets/leaves/fruit remain in the scene product. Scene
preparation may not discard thin strands or simplify crop surfaces to make motion
queries pass. Current moving-body/leaf transforms or interval envelopes remain
separate D query inputs; static source geometry cannot imply known leaf motion.

After D exists, C consumes only completed dispositions and admitted poses. Attached
and supported targets retain their confirmed plant representation. A confirmed
held/boxed/dropped target changes its owned source-shape placement exactly once;
other fruit and original cultivar geometry remain untouched. Unresolved or absent
confirmation cannot remove a fruit. C does not infer success, visibility, damage,
cutting or collision clearance. Working robot pose follows the same completed-pose
boundary and cannot invent a path between blocked endpoints.

Preparation lifetime follows canonical scene and botanical inputs. Camera, locale,
read subscriptions, session clock, fruit state and robot pose changes must not
regenerate cultivar meshes or planting assignments. Retiring a scene invalidates
its handoff; teardown releases it. Existing dependency-scoped geometry retention
and resource bounds remain authoritative; no additional cache is proposed.

C handoff acceptance: formal source-space tests reconstruct each original near and
distant mesh from its partitions and compare positions, indices, colors/UVs when
present and material ownership without gaps or duplicate triangle ownership;
shared boundary vertices retain their original source indices. Installed transforms
map the same target to its original canonical location, including repeated models
and plant rotations. Identity and source-shape tests cover scene replacement,
empty populations, both cultivars and all supported variants. Preserve the existing
crop shape/detail/texture, support/net geometry and runtime reuse tests. Permanent
work-count tests prove one preparation per relevant change and zero generation
for downstream reads/pose/clock/view-only changes. An ordinary full-scene browser
baseline and close-up source-fruit review precede D state projection. These are
handoff gates; M3 additionally requires the usable synthetic UI and full D/C
simulation acceptance, not merely partition or headless test success.

## C - M3 synthetic working-arm source (planned)

The approved concept has five bounded degrees of freedom: lift translation,
shoulder yaw, shoulder pitch, elbow pitch and wrist pitch. These are synthetic
simulation assumptions, not manufacturer specifications or measured capabilities.
Lift is [-0.10, +0.10] m at at most 0.02 m/s. Shoulder yaw and elbow pitch are
[-pi/2, +pi/2]; shoulder and wrist pitch are [-pi/3, +pi/3]. Each rotary joint is
limited to pi/18 rad/s (10 degrees/s). Exact endpoints are allowed. Acceleration,
physical torque and TCP speed limits are not established by these assumptions.

Rest frames derive from the existing source definition width w, length l and
stowed height h: shoulder S=(0, 0.7h, -0.3l+0.09), elbow E=(0, 0.86h, -0.04l),
wrist W=(0, 0.59h, 0.13l). The lift axis is chassis +Y; yaw is +Y at S; pitch
axes are local +X in the yawed chain. The fixed parent chain is chassis -> lift
-> shoulder yaw -> shoulder pitch -> elbow pitch -> wrist pitch. Link lengths
and the S/E/W offsets come from this original geometry, never arbitrary reach.
Zero joints reproduce every original source vertex/index/material exactly; retain
the chassis-local shape and express rotation about its rest pivot as a rigid
transform instead of repeatedly rebuilding or rounding its vertices.

Each original part has one rigid owner. Chassis, wheels, mast, screw, mast camera,
crate and dock remain fixed to their original owners. The lift carriage follows
lift only; shoulder housing follows lift/yaw; upper arm follows shoulder pitch;
elbow housing and forearm follow elbow pitch; wrist, guard, jaws and pads follow
wrist pitch. The added yaw is a labeled synthetic frame, not extra fabricated
hardware geometry. There is no new jaw/blade DOF or independent camera motion.

The tool contact reference is the original two-pad midpoint (0, 0.515h, 0.14l),
with closing +X, approach -Y and remaining axis +Z at rest. It moves with the
wrist-owned assembly. Confirmed fruit retention records the actual fruit-to-tool
relative transform; it must not snap the fruit center to that reference. C exposes
source frames and forward kinematics; D later owns target selection, inverse
kinematics, action timing and exact motion admission. No solution, out-of-range
joints or collision remains unresolved; do not stretch links or invent free XYZ
poses to reach a target. A's stowed load screen does not prove extended-arm stability.

The entire lift stroke must fit the source mast with the existing 0.12 m carriage:
its center 0.67h plus both stroke limits and half-height must stay between the
existing mast bottom r+0.2 and top h-0.045, where r=min(0.13l, 0.12h). Reject an
incompatible working rig without clamping stroke or changing canonical design;
the existing parked design remains displayable. Validate finite joint inputs,
exact bounds and the definition revision before publishing a pose. Invalid inputs
produce no partial pose. Definition changes retire the old rig; dock/mission,
camera and locale changes preserve source shapes and rig preparation.

A kinematic pose is a candidate, not collision clearance or a harvesting command.
D must query the same rigid body/tool/crate source and carried-fruit transforms
through the full time interval; self-collision and nonadjacent body contact cannot
be discarded. Precisely modeled joint interfaces may later have explicit contact
ownership, but no blanket robot collision exclusion is allowed. The same admitted
joint path must eventually feed queries and presentation. This source slice only
provides immutable rig/body frames, bounds/speeds, tool reference and candidate FK;
it starts no simulation and applies no UI motion.

Acceptance: freeze original robot geometry/material hashes before edits for both
tools and representative nondefault dimensions. Prove zero-rest exact source
reconstruction, unique body ownership, single-axis pivots, chain composition,
constant link lengths, tool-reference orientation, valid/invalid lift envelopes,
exact joint limits and nonfinite rejection. Prove definition retirement and no
robot/crop generation on repeated FK/reads or camera/dock/mission changes. Preserve
M2 runtime/history and ordinary bilingual desktop/mobile robot/browser checks;
inspect the same parked source close-up. Later D and motion UI must separately
prove speed boundaries, retained-fruit transforms and interval collisions.

## D - M3 deterministic simulation contract (planned)

M3 is an explicitly synthetic, in-browser simulation of the authored mission.
It does not introduce a trained detector, calibrated contact physics, hardware
control, backend scheduling or persistence. Existing M2 controls remain design
inputs. A simulation consumes an immutable admitted mission snapshot; it does
not rewrite that snapshot or turn simulated observations into field measurements.

### Session and clock

Start, pause, resume, cancel and fault acknowledgement are separate intents
through the registered app Feature/API boundary. Start admits the mission, route,
return path, crate and battery evidence before creating a run. Failed admission
publishes reasons without a partial run or design/history mutation. One runtime
owns at most one live run and one pending patrol. A replacement first invalidates
the old run; its queued observations and transitions cannot write into its successor.

The read snapshot contains run identity, mission revision, simulation time,
lifecycle (idle, running, paused, completed, cancelled, invalidated or faulted),
current operation, pending-patrol flag, route/checkpoint progress, robot/tool pose,
fruit inventory, crate ledger, energy state and unresolved reasons. Operational
phases distinguish travel, look, reobserve, defer, approach, support, cut, verify,
place, return-to-exchange, exchange, return-to-charge, dock, charge and undock.
A lifecycle fault takes priority over the operation; acknowledgement clears no
missing evidence and does not itself resume motion.

Simulation time advances only by explicit finite, nonnegative clock inputs;
backwards or non-finite time is rejected without state change. Scheduling uses
that clock, not requestAnimationFrame, Date.now or browser timers. Rendering may
interpolate presentation between completed poses but cannot advance the session.
Pause freezes motion and operation progress, while explicit clock inputs may
continue to advance scheduling time and expire evidence. Resuming does not apply
paused elapsed time to motion or operation deadlines; only subsequent active
advancement can progress them. Resume requires current admission. Design edits and
history replay that change farm/robot/mission inputs invalidate the run. Undoing
the edit cannot resurrect its old run. Camera, locale and panel changes do not
invalidate it. Reload and disposal terminate the transient session.

Patrol deadlines are measured from scheduled starts. Deadlines missed during a
busy or paused session coalesce to one pending patrol, never a catch-up burst.
When work can resume, the pending patrol still requires fresh dispatch admission.
Each active clock advance processes crossed finite route/checkpoint events in order;
it may not skip an obstacle, pick confirmation or charging interlock. Identical
admitted inputs and ordered intents produce identical state and event results.

### Session admission and pause boundary

Session Start accepts dispatch evidence, not an accepted-result object. It calls
D admission using its own prepared mission and current clock, and consumes the
result within that intent. A caller cannot replace the current mission, borrow a
receipt or replay an earlier accepted result to create another run. Every queued
intent carries the session generation; cancel, replacement and disposal retire it.

Resume is a distinct current-state admission. The session supplies the exact
paused snapshot identity and revision, run/generation, canonical receipt, current
C sources, time, current base/joints/tool pose, retained-fruit relative transforms,
operation/checkpoint and remaining intent. The required provider combines current
run-bound evidence with the remaining-motion/return assessment. Its decision binds
the original request identity and an explicit finite validity interval. Missing,
expired, wrong-run/generation/snapshot/source or held/fault results cannot resume.
The session rechecks snapshot/generation/currentness after the provider returns;
cancel, replacement or an intervening clock input makes late results stale.

An accepted resume keeps the same run, pose, retained inventory and progress; it
neither resets the robot to its dock nor spends elapsed paused time. Only later
active clock differences count toward operation progress, and every physical
movement still needs its exact live interval query. No short-lived dispatch or
resume result grants indefinite clearance. Fault acknowledgement is separate from
resume and cannot clear missing evidence or auto-restart a faulted action.

The clock foundation can establish this lifecycle with the current rest pose and
an empty held inventory before action execution is implemented. It must keep a
required current-state provider boundary, without an always-clear or permanently
unknown production substitute. Actual working-pose/held-fruit resume and real
provider integration remain action gates before ordinary UI controls can close M3.

### Dispatch admission boundary

D captures the completed B report and farm settings for one canonical mission
revision, with the original owner-issued C scene/robot handles. User/configuration
and synthetic evidence data are detached and frozen; already admitted source
handles retain identity. Same revision numbers on cloned or retired handles are
not current-source evidence. Composition issues a canonical receipt binding the
B report, farm and C handles from the same completed update, with a current-receipt
identity predicate. D rejects a stale or forged receipt even while C sources are
still current; a caller-supplied revision number is insufficient. The B report's completed `route` supplies A's ordinal
input; D never repeats strip-ID resolution or rebuilds C geometry.

Simulation timestamps use seconds. Every dispatch bundle has a nonempty evidence
identity, explicit synthetic source, mission/scene/robot revisions, observed time
and validity interval. Validity is half-open [validFrom, validUntil), with finite
nonnegative values and validFrom <= observedAt <= now < validUntil. There is no
implicit lifetime, future observation, automatic renewal or evidence-time override
of the current clock. Missing/invalid identities and times reject before queries.

Synthetic survey values feed A's lane screen for the captured route. Battery SOC
and uncertainty are observations; configured capacity, usable fraction, work,
return, contingency and reserve budgets remain the mission's declared estimates.
Crate evidence supplies explicit synthetic load/CoG/fill assumptions, identity,
cultivar compatibility and known tare/latch; the mission payload limit remains
binding. A's load result is stowed screening only. Incomplete crate or dock evidence,
unknown survey, held/exchange load, or held/return-to-charge energy cannot dispatch.
A's design report remains unchanged and unknown design evidence is never promoted.

Pre-run posture is stowed (all approved rig joints at zero), and the robot source
must have an admitted working rig. Unsupported rig or unknown posture holds Start.
The admission owner constructs required movement requests from this captured
mission, rather than accepting caller-selected requests: dispatch starts at its
dock, reaches its selected route start and covers that straight lane to its end;
return connects that route end back to the same dock. Each request names its
purpose, exact source revisions, stowed pose, route/dock coordinates and explicit
finite positive query interval within the evidence validity. Each query ends
strictly before evidence expiry, and return begins no earlier than dispatch ends.
The collision owner
must cover these required poses/route, preserving their order and full source
bodies. An empty or zero-motion path cannot satisfy separated required poses.

Movement clearance comes from the composition-owned query provider over the same
C sources, for explicitly identified dispatch and return movement requests. Its
results must bind those exact requests, revisions and time intervals and be fully
clear; missing/empty/blocked/unknown or wrong-purpose/route results hold admission. Caller booleans and A lane
screens cannot stand in for that provider. Admission produces a decision and
reasons; only the later session owner can create a run. Unit test doubles for the
provider do not establish real-scene integration or permit normal UI Start.

### Observation and action evidence

Before a run exists, dispatch evidence binds to the canonical mission and scene
revisions, simulation time and validity interval, not a prospective run ID. It
contains explicitly synthetic route/return/dock, ground/entrance/headland, crate
and battery evidence needed by A and motion admission. D validates that bundle
and calls A with those admitted synthetic inputs before creating the run. B
design reports retain their unknown evidence and are not rewritten as clearance.
Missing, expired or mismatched pre-run evidence holds dispatch without creating
a run. Accepted evidence is bound to the newly created run for later use and
expires normally; it does not become a field survey or bypass motion queries.

An in-run observation names its run, mission revision, target or route segment, source
(synthetic input or synthetic observation adapter), simulation observation time
and explicit validity interval. Target observations include stable fruit identity,
cultivar, pose, maturity, visibility/coverage, stem identity/uncertainty and the
approach/extraction corridor evidence. Unknown values remain explicit unknowns.
Duplicate target observations refine evidence; they do not create another fruit.
Reject malformed, future-dated, wrong-run or wrong-revision evidence. Expired or
missing evidence inhibits the dependent action and leaves an unresolved reason.
No hardcoded sensor timeout or detector confidence is a measured physical limit.

The observation adapter is the sole boundary that can inspect authored synthetic
scene truth. It must evaluate the requested viewpoint and occlusion before
returning observations and mark unknown coverage where occluded. A synthetic
scenario may explicitly inject observations, but must label them as assumptions.
The session never enumerates hidden fruit and treats that enumeration as a
successful scan. Hiding a render layer does not remove the object from sensing
or collision geometry. A row without observed fruit is not known empty.

Action confirmations are separate, run/target/action-bound observations: support,
cut/separation, retention, placement, crate identity/tare/latch, dock alignment,
charging contacts and charger status. A command or elapsed time is not its own
confirmation. Wrong-target, duplicate or late confirmation cannot repeat an
inventory transfer. Stale sensing, uncertain stem, lost retention and contact
faults follow A's priority policy and require renewed evidence before resumption.

### Fruit, crate and energy conservation

Each stable target has one physical simulation disposition: attached, supported,
held, boxed or dropped. Detached/held requires both cut and retention confirmation.
Failed or deferred work records its reason alongside the last confirmed disposition;
it cannot silently erase a target or convert uncertainty into a boxed fruit.
Missing cut/retention evidence leaves the plant's confirmed fruit present.
A confirmed drop after detachment is explicit. Every transition retains run ID,
target ID, evidence and simulation time. Crate and held masses are separate;
transfer to a crate occurs once after placement confirmation. The sum of those
exclusive dispositions conserves all admitted targets across replay and faults.

Crates record identity, cultivar compatibility, valid tare/latch, mass/volume
capacity, measured or explicitly synthetic fill and excluded/damaged/unknown
quality. A's load screen runs before another pick and after changed load evidence;
volume, incompatible crop or unresolved damage can exclude placement even below
mass capacity. Physical damage remains unknown without a calibrated contact model.
Cucumber handling preserves fine spines and uses explicitly modeled soft textile
contact assumptions; no normal action scrapes, wipes or rolls off the spines.
A distant representation lacking fine spines is not evidence of spine loss.
Soft textile contact is a design assumption, not a proven zero-damage guarantee.
Tomato handling preserves the calyx and retained pedicel
with soft support. The initial synthetic action supports the individual fruit,
identifies its pedicel and clear corridor, then cuts on the plant side of its
retained attachment. Plant-side means along the pedicel toward the plant, not
world Y. Never cut the main stem, rachis, neighboring fruit or calyx interface.
Unknown anatomy/corridor defers the action; no fallback pulling or bending is
admitted. Bending at a real abscission zone is not inferred from a geometry joint.
Harvest retention, spine/calyx integrity and contact-damage quality are distinct
results; successful cut/placement cannot prove intact quality.

Source context: Taiwan's <a href="https://www.acri.gov.tw/Uploads/Item/8d07414a-0d58-4587-ba44-f9a7219acd37.pdf" target="_blank" rel="noopener noreferrer">fruit-vegetable health management guidance</a>
identifies cucumber spines as a freshness/marketability attribute. The soft textile
choice remains the user's handling requirement, not a measured retention rate.
<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3600680/" target="_blank" rel="noopener noreferrer">Tomato pedicel abscission research</a>
distinguishes the pedicel abscission zone from the calyx interface. Published
<a href="https://www.mdpi.com/2073-4395/14/10/2274" target="_blank" rel="noopener noreferrer">pedicel mechanics for Syngenta Spectrum</a>
do not establish Yu-Nu force, diameter or cutting-angle limits; those remain
unmeasured here.

Exchange immobilizes the base and inhibits the tool; new crate ID, tare and latch
confirmation are required before explicit resumption. Removed crates retain their
inventory ledger; exchanging cannot erase previously boxed fruit.

Fresh synthetic battery evidence and declared energy estimates feed A before
start, each travel segment and each pick. Return and reserve cannot be spent to
meet a patrol deadline. Return requires an admitted path and stowed tool; absent
return or dock evidence holds the run. Dock/charge/undock require their individual
confirmations. Charging contacts inhibit traction and arm motion. Insufficient
budget retains a pending patrol. Charger, stale SOC, blocked dock or contact
faults remain faults; no automatic energized redocking or restart is allowed.

### Motion and collision admission

A's straight-lane screen is not motion clearance. Every proposed base, arm/tool,
carried-fruit, extraction and placement movement requires a completed swept-motion
query against the authored scene and current dynamic observations. Pre-run queries
bind to mission/scene revisions, start/end poses and simulation interval. Queries
after run creation additionally bind to that run identity; results report
clear, blocked or unknown, affected bodies and reasons. Only complete clear
results admit that exact movement. No endpoint-only clearance, missing-body
clearance, implicit alternative route or arbitrary pass-through is permitted.

The query includes chassis, mast/arm/tool, retained crate and carried fruit against
structure, net strands, crop/leaf envelopes and explicit obstacles. Moving leaves
need their interval envelope; missing motion bounds produce unknown clearance.
Intended support contact must be separately identified and confirmed; it cannot
exempt unrelated leaf/net contact. Unknown contact forces are not a damage model.
Geometrically blocked or unreachable cuts/extractions remain deferred/unresolved;
pose projection cannot teleport or invent a successful trajectory.

### M3 acceptance

The ordinary app UI must let users provide or select clearly labeled synthetic
scenario evidence, advance the simulation clock and inspect/control the session.
Supported admitted scenarios must actually progress through the normal observation,
motion-query and projection path; an always-unknown session, headless-only API or
always-clear adapter does not satisfy M3. Synthetic assumptions remain visible
and never become measured sensor or hardware evidence.

Formal scenarios cover valid, exact-boundary, empty, invalid, stale and interrupted
sessions; finite event traversal; schedule coalescing; deterministic replay;
run replacement/disposal; collision coverage; no hidden-fruit detection; target and
mass conservation; crate exchange; charge interlocks and priority faults. Runtime
tests prove normal Feature admission and document invalidation. Read subscriptions,
camera and locale perform no simulation, assessment or geometry preparation.
Immutable geometry preparation follows scene/definition changes, not simulation
ticks; current pose/contact queries still rerun for changed motion inputs.
Close-up browser review must show the same admitted arm/net/crate and fruit states
in both languages and desktop/mobile layouts. App unit/typecheck/lint/build,
naming and current-head CI must pass. M3 completion leaves M4-M6 planned and does
not certify a real harvesting system.

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

## C - M3 installed dock source handoff

The charging station's existing platform, pedestal, contacts and exchange stand
remain separate source meshes at the authored dock X/Z. C supplies an immutable
installed dock revision and those exact admitted meshes to D, using the same
completed product for presentation. The near source triangles and materials are
unchanged; aggregate focus bounds are not a solid collision shape. The platform
occupies its original local Y interval [-0.03, 0]; its top does not imply permission
to intersect the charger, shelf, legs or other station pieces.

Dock geometry is prepared once per projection lifetime. Moving the authored dock
replaces the installed handle while reusing the same shapes. Robot dimension/tool,
mission and presentation changes preserve a dock handle when its placement is
unchanged. Disposal retires it; copied handles cannot establish currentness.
The robot route annotation is absent from the physical dock source. This handoff
makes no support-contact, charging-contact or motion-clearance decision.

Acceptance: prove exact mesh/shape identities shared with presentation, unchanged
source coordinates/materials, distinct station pieces, installed placement,
retirement on dock movement/disposal and zero extra station/crop generation on
reads or unrelated edits. Preserve existing robot/browser projection checks.

## C - Source material-region provenance

C records material-region identity and original triangle-index ranges during the
same source construction that produces the visible geometry. Each source triangle
belongs to exactly one region; original vertex sharing, index order, attributes,
fruit ownership and materials remain unchanged. Mixed meshes retain distinct
primitive regions rather than receiving one guessed classification for the entire
plant, greenhouse or station. Region identity is local to its source revision.

A sheet supplies a two-sided physical surface but no enclosed material volume:
film, leaf blades and calyx sheets can obstruct a ray without filling the air they
enclose. A closed-solid region explicitly declares material interior supported by
its actual source closure. A box is a closed primitive; a capped cylinder may only
receive that classification when its source closure oracle supports it. An open
shell supplies physical surface geometry with unresolved material interior; uncapped
tubes, unverified fruit-pole/seam closure, fine spine/hair shells and incomplete
mixed terrain regions cannot be silently promoted to watertight solids.

The source producer declares regions from construction operations, not a D layer,
name, opacity or winding heuristic. Raw ranges require an explicit region; missing,
overlapping or incomplete metadata is unavailable, never assumed sheet or solid.
No caps, welded vertices, thickness, force or contact coefficients are added to
make a region pass. Fruit calyx/pedicel/spines retain their original partitions;
separation never creates a new closure claim. Distinct crate walls/floor/rims and
station boxes remain separate material regions, preserving open cavities.

C hands immutable regions alongside the same admitted shape/instance products to
shared query consumers. Regions survive view/clock/pose reads without regeneration
and retire with their source. Later D queries test occupancy per declared region:
sheet interiors do not become material, closed parts do not fill one aggregate
box, and unresolved shell interior remains explicit. All regions still contribute
their original ray/swept surfaces; provenance is not a contact exemption.

Acceptance: permanent complete/disjoint triangle coverage, explicit box/capped or
unverified-cylinder/open-tube/sheet cases and mixed-source region identity. Original
robot and all cultivar near/distant geometry/material hashes remain exact, including
spines, calyx and late hairs. Canonical C scene/rig/station handoffs retain metadata,
original shapes and preparation counts. The paused D room-air and numerical ray
regressions are closed only in the subsequent D predicate segment.

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

The first target-admission slice accepts explicitly injected synthetic assumptions
only. Its composition-issued context binds the actual HarvestSession's current
immutable snapshot, canonical mission and issued current query geometry from the
same update. Context identity, snapshot identity/run/generation, mission and all
geometry handles are checked before and after admission. Running, paused and
faulted runs may receive fresh target evidence; admission neither resumes nor
acknowledges a fault. The composition predicate additionally guarantees this
canonical mission is the actual run's mission: individually current snapshot and
mission objects are insufficient, since SessionSnapshot does not expose that
relationship. Idle, cancelled, invalidated and closed lifetimes reject it.
Earlier observations may remain valid at the current clock; observedAt must be
within its declared interval and no later than now, with validFrom <= now <
validUntil. No implicit expiry extension or guessed sensor limit is introduced.

Clone caller data once, then validate and freeze that same detached reading.
The reading names its run/generation, mission/scene/robot/dock revisions and one
current scene-local target, and carries a nonempty synthetic-assumption label.
Cultivar, pose, maturity, sampled coverage, individual target-pedicel recognition,
synthetic cutsite and approach/extraction corridor assumptions preserve explicit
null unknowns. Coverage describes only the declared sample count, not whole-fruit
visibility. Pedicel recognition is scoped to that individual target, never the
rachis, a neighboring fruit or an anatomical AZ. Sample counts are nonnegative
safe integers with visible <= total; total zero means no sampled coverage, never
complete visibility. A supplied pose has finite coordinates and a valid rigid
rotation. Pedicel and cutsite values remain injected assumptions, not inferred
identifications. Spine integrity, calyx integrity
and observed contact damage are independent synthetic quality fields; no value is
filled from renderer truth or inferred from another field. Source membership
validation may identify the existing fruit, but cannot certify these observations.

This admission helper owns no second run, target inventory or action state.
Repeated readings reference the same existing target; the later session consumer
owns evidence refinement and rejects stale action confirmations. The first slice
rejects action-confirmation input entirely: support/cut/retention/placement require
a later current expected-action receipt from the action owner. No target reading,
including declared clear corridors or intact quality, admits those actions.
The next viewpoint adapter must produce bounded camera/sample-ray evidence over
real near sources; injection alone does not complete observation or M3 UI gates.

### Synthetic viewpoint sampling

The viewpoint adapter consumes the same current observation context and a labeled
synthetic request for explicit candidate target IDs. These candidates are search
assumptions, not prior detections. The adapter alone joins C's original plant,
fruit-partition and near-triangle identities to samples. For each target, traverse
original mesh/partition order and choose evenly spaced triangle ordinals, up to
the requested positive sample count without duplicates; aim at each triangle's
centroid. A request permits at most 64 rays as a computation budget, never a
physical detector rating or sufficient-coverage threshold. Empty candidates yield
zero coverage without invoking an empty ray batch. Invalid or duplicate target
IDs, sample budgets or source mappings are rejected, not silently substituted.

Camera pose is an explicit synthetic world RigidTransform, with local +X right,
+Y up and +Z forward. It is neither the UI orbit camera nor a calibrated robot
mount. Finite positive halfWidthSlope and halfHeightSlope define a rectilinear
frustum; FOV may be displayed as twice atan(slope), but slopes are the decision
authority. Maximum ray distance is finite, positive and measured in metres.
Use the existing conservative inverse of the actual quaternion coefficients;
do not assume a rounded near-unit quaternion's conjugate is its exact inverse.
Camera-local direction requires z > 0 and |x| <= halfWidthSlope*z and
|y| <= halfHeightSlope*z. Conclusive exclusion is outside-view; uncertain
boundaries remain unknown. No near-plane clipping hides an intervening object.

The actual floating-point direction computed from camera origin toward the
authored sample is the authoritative camera ray. It need not pass the exact
authored centroid after rounding. Keep requested sample reference separate from
actual first-hit witness. A first hit belonging to the requested target proves
that ray sees some surface of that target; it does not prove the requested
triangle, back side, pedicel or cutsite is visible. Another first surface proves
sample occlusion only when its conservative distance upper bound is strictly
before the requested point's camera-distance lower bound. Compute that bound
from conservative endpoint subtraction and norm, independently of the rounded
ray direction used for frustum eligibility and ray queries. A ray that
misses the intended point and hits a rear surface, or overlapping distance bounds,
remains unknown with its actual witness. Use the ray owner's completed hit-distance
interval, not its displayed midpoint or an EPS extension. A miss or unresolved ray remains unknown, never proof of
absence. Report visible, occluded, outside-view and unknown separately; sample
counts describe only these declared rays, not whole-fruit visibility or confidence.
Opacity is not an optical model, and one visible target ray does not infer
maturity, stem identification, quality, or harvest readiness.

All eligible rays use one current-source RayQueries batch at the observation
time/validity, with explicit synthetic leaf state. A newly computed view samples
the current snapshot time; it cannot reconstruct an earlier pose from a newer
snapshot. This does not change admission of previously recorded, still-valid
earlier readings. Robot base/joints come from
the actual session snapshot, not caller replacements. This foundation uses its
existing world-aligned chassis frame and empty-held, all-attached source state;
working heading or moved-fruit dispositions require their later owner handoff.
Missing or incompatible state remains unknown. Recheck context/source currentness
before return; no clock, inventory or source generation occurs. Prepare camera
inverse once and C FK once per nonempty eligible batch, reusing completed bounds.

Acceptance: deterministic source selection and exact identity, real near-target
hit and nearer occluder, behind-sample hits remaining unknown, same-target front/back distinction, film/hidden physical
occlusion, inside/outside/ambiguous frustum, empty samples, invalid sparse camera,
stale run/source/expiry and unknown dynamics. Prove full source work counts and
unchanged ray predicates. This sampled viewpoint evidence is a real observation
producer prerequisite; action admission and ordinary UI still require integration.

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

### Shared query geometry source

Observation and motion providers consume one D-owned prepared geometry product
from an opaque composition-issued receipt binding the scene, robot definition and
installed dock from the same completed canonical update. Receipt identity and all
three original C handles must be current together before preparation, before
publication and on use. Individually current products collected across updates,
revision-only lookalikes and cloned issued products are not valid substitutes.

Preparation retains the exact near admitted shape buffers and their original
triangle indices/material association. Installed descriptor transforms and instance
placements follow the renderer's composition order without duplicating world-space
vertices. A unique source shape is registered once; instances reference its completed
record. Repeated reads/queries reuse that result. A changed source receipt retires
the prior product; preparation failure publishes nothing and does not partly replace
it. No crop, station or robot generator runs in D.

Physical source coverage includes hidden net, leaves, film, drains, soil, passages,
barriers and underground base as authored. Only the exact dimensions layer and
robot.route annotation are nonphysical; opacity, visibility, bounds and distant
LOD never substitute for near geometry. Robot parts retain C's rigid-body
ownership in their chassis-local frame;
station parts stay distinct in the installed world frame. Later queries must
consume the session's actual base/joint/retained-fruit transforms; the station
position must never stand in for a working robot pose. Fruit triangle ownership retains cucumber spines and
tomato calyx/distal pedicel, including shared vertices and late hairs. Original
source identity/placement, not string guesses or new botanical truth, joins an
instance to C's plant/fruit metadata. Unsupported or inconsistent source data is
explicitly unavailable, never silently omitted.

This product makes no detection or clearance decision. Tire/support contact needs
an explicit supporting surface and contact policy in the collision owner; being
soil or platform is not blanket permission. Same rigid-body assembly is distinct
from different-body joint interfaces: later precise joint contact eligibility may
not exempt whole adjacent bodies. Retained fruit/tool support does not authorize
contact with unrelated crop/net, nor prove spine/calyx integrity or contact damage.
No force/material threshold or anatomical AZ is inferred from these shapes.

Acceptance: real C source cases prove complete physical coverage, exact source
references/indices/partitions, installed quaternion-plus-instance transforms,
per-instance identity, distinct dock parts and rigid robot ownership. Prove atomic
receipt admission, copied/mixed/stale source rejection, retirement on every source
change and bounded preparation counts independent of reads/pose/clock/view. Real
observation, interval sweep and ordinary UI execution remain separate acceptance.

Shared local bounds are completed geometry preparation, not query results.
The geometry owner prepares each original shape's local vertex bounds and its
non-sheet primitive region bounds once for the current receipt, retaining the
original region identities. Distinct source metadata for the same shape must not
silently reuse another region mapping. Bounds remain conservative candidate
rejection only; neither membership nor retention establishes material or clearance.
Queries consume this immutable product without rescanning positions or region
indices. Changes to rays, time, pose or camera do not rebuild source-local bounds;
source replacement rebuilds them, while retirement or disposal rejects prior
products and releases owner retention. No cross-source cache, world-vertex copy,
spatial hierarchy or ray-result cache is introduced.

Acceptance: cold preparation matches direct original-source bounds; repeated
reads and changing dynamic queries perform zero bound scans and preserve the
uncached nearest-hit/miss/unknown results. Prove exact source/region identities,
immutable outputs, atomic failed replacement, same-receipt reuse, successor
recomputation and retired/cleared rejection. Count actual position/index visits
alongside correctness on the existing representative C scene.

### Near-source ray evidence

A D ray query consumes an issued current shared geometry product and explicit
synthetic scene-state/time input. Rays specify finite origin, nonzero direction
and finite positive maximum distance in metres. The query normalizes direction;
returned distance is in world metres, including for non-unit input directions.
The sampled segment includes its maximum-distance endpoint. It reports nearest
source hit (original mesh, instance, triangle index, barycentric coordinates and
distance), no hit within that range, or unknown with reasons. A stable tie rule
uses source mesh/instance/triangle order; it cannot skip a nearer obstruction.
Results bind the exact admitted batch input and source receipt. No-hit is not an
empty row, detected fruit, movement permission or optical visibility guarantee.

The state supplies simulation time, explicit [validFrom, validUntil) evidence,
current robot base rigid transform and valid joints, and a labelled synthetic leaf
source-pose assumption at that time. Missing/expired/unsupported dynamic state
returns unknown; caller-specified simulation time does not advance the session.
C FK is reused once per admitted batch, then the same completed body transforms
serve every ray. No arbitrary per-body substitute model or initial-dock pose is
allowed. This first ray segment supports the existing all-fruit-attached source;
held/boxed/dropped changes require later D disposition input and cannot silently
reuse attached geometry. Single-time leaf evidence supplies no swept interval bound.

Near triangles are tested two-sided, preserving physical film/net/leaf occlusion
regardless of render opacity. This is synthetic geometric obstruction, not an
optical transmission or real sensor calibration model. There is no implicit FOV,
sensor range rating or use of the UI orbit camera. A later observation adapter
must separately define explicit synthetic camera projection/FOV and sample coverage;
one visible fruit sample cannot establish stem/cut-site visibility or maturity.

Origin on or inside physical material, relevant degeneracy/coplanarity or numerical
ambiguity yields unknown unless exact source tests resolve it. An aggregate box
may reject a nonintersecting candidate, but cannot prove material occupancy, fill
an open crate cavity or turn possible contact into a hit/clear result. No robot,
camera housing, support surface, joint or carried-fruit exemption is introduced.
Only original source geometry can determine the nearest hit. Quality remains
separate: visible spines/calyx or the synthetic cut site do not prove intact
market quality, retention or a true anatomical abscission zone.

Origin occupancy consumes C's individual material regions. Sheet regions obstruct
rays without filling their enclosing air. Closed-solid occupancy uses the original
region surface, never a union box around separate crate walls. For open-shell
regions, conservative local bounds may exclude an origin candidate; otherwise
surface evidence is checked and unresolved closure/interior yields
`unknown-origin-occupancy`, not an inside/material-hit classification. An unresolved
bent-tube gap may remain unknown. Do not subdivide its surface into triangle boxes
to falsely prove the tube's centre free. Origin uncertainty starts at distance zero
and cannot be ignored merely because its first forward surface is beyond a hit.

Numerical decisions carry conservative arithmetic bounds from normalization and
installed/body transforms through slab, determinant, barycentric and distance
predicates. Only a conclusively outside candidate is a miss. Overflow, underflow
or overlapping decision bounds that cannot be resolved produce unknown; near-edge
values are not clamped to a fabricated hit. Generic exact-operation proofs retain
supported exact endpoints and ties. A reported nearest hit must precede every
other possible obstruction: an ambiguous intersection is ignorable only when its
conservative lower distance is strictly beyond that hit's upper distance. Exact
ties retain source order; unresolved overlapping nearest distances remain unknown.
Ordinary non-axis interior hits and clearly outside misses must remain usable.
Geometric unknowns may include bounded representative witnesses: one ambiguous
source triangle or two overlapping nearest candidates, in original source order,
with mesh/instance/triangle identity and conservative distance bounds. These bind
the same batch and current source, remain immutable, and are not exhaustive
coverage or a first-hit claim. Unbounded distance is explicit or omitted; other
unknown reasons need no witness. No global diagnostic state is retained.

Acceptance: exact known triangle/barycentric/distance and near/far ordering cases,
transformed/instanced sources, ties and range endpoints, inside/coplanar/unknown
cases, preserved source ownership and stale/batch mutation rejection. Actual C
farm/robot/station rays cover hit/miss, net/leaves and both cultivars; profile
unique-shape preparation, instance rejection, exact triangle tests, FK/query counts
and elapsed time before adding a retained acceleration index. Optimization must
preserve these exact outcomes and prove source retirement plus bounded preparation;
no per-ray shape reconstruction or world-vertex copy is allowed.

### Static source surface-pair evidence

Before continuous movement admission, D may compare explicitly selected original
source triangle pairs at one synthetic time. The query consumes a current issued
GeometrySource and detached input selecting mesh/instance/triangle ordinals within
that exact product, with the current robot base/joints and declared leaf/fruit
state. It resolves immutable original mesh, region and triangle witnesses; copied
source products, invalid ordinals or malformed state are rejected before work.
Validity is [from, until); expired or unknown dynamic state returns unknown.
Currentness is rechecked before returning the complete batch.

World points enclose the original C instance placement, installed transform, or
robot body FK followed by base transform. Reuse the existing query frame arithmetic
and original trigonometric/quaternion coefficients; rounded world vertices cannot
be promoted to exact input. A static surface result is surface-separated,
surface-intersection or unknown. Strict separating-axis proofs establish surface
separation; supported original-triangle crossings establish intersection. Generic
exact dyadic predicates may resolve singleton inputs, including coplanar overlap,
edge and vertex contact. Unresolved arithmetic or degenerate triangles stay
unknown. No EPS expansion, source-specific exception or invented thickness.

These are surface relations only. Nested closed solids may have separated surfaces
while their material volumes overlap. Open-shell interiors remain unresolved and
sheet intersections remain real surface evidence. The query does not return body
clearance or movement admission. It never exempts tire/support, adjacent joints,
parts of the same robot or tool/fruit contact; later contact admission must name
its intended bounded interface independently. Source spines, calyx and pedicel
remain present without a claim about contact damage or quality.

Acceptance: original transformed/instanced C pairs, crossing/coplanar/touch and
separated controls, nested surfaces without volume-clear inference, conservative
numerical ambiguity, malformed/getter-backed/stale inputs and immutable output.
Selected original vertices only, one FK per robot-containing batch and shared
frame products per batch perform no source generation, bounds preparation or
session mutation. This precedes continuous linear sweep, articulated trajectory,
full-body coverage and exact intended-contact admission; it cannot replace them.

### Continuous fixed-rotation source-pair sweep

D's next geometry primitive moves each selected original triangle by an explicit
start-to-end world displacement while retaining its starting orientation. Both
surfaces use the same normalized fraction t in [0,1]; displacements are neither
velocities nor articulated FK endpoints. The starting source/instance/body points
come from the same admitted geometry and synthetic pose as static queries.
Finite times satisfy 0 <= from < until. The entire closed movement interval,
including both endpoints, must lie in [validFrom,validUntil), so validUntil must
strictly exceed until. Leaves require an explicit synthetic assumption that original source local shape
remains fixed throughout, subject only to the selected pair's declared world
translation. This does not claim that a translated leaf is world-stationary.
Additional unknown leaf movement/deformation stays unknown; an instantaneous pose
is not an interval envelope. This hypothetical selected-pair assumption does not
certify real leaf motion or unselected leaves. Fruit attachment state also covers
the whole interval.
Missing or expired interval state produces unknown.

Complete fixed SAT axes include triangle face normals, all edge cross products
and coplanar in-plane edge normals. For each axis, relative displacement gives
linear projection-overlap inequalities in the common t. Their common possible
time interval must be proved empty before reporting swept-separated. A common
guaranteed time, or generic exact dyadic/rational evidence for singleton original
points, is required for swept-intersection. Each axis being possible at a different
time does not prove contact. Zero axes do not separate; degenerate geometry and
unresolved interval signs remain unknown. No endpoint-only clearance, epsilon
expansion or rounded-point promotion is allowed.

A reported contact fraction/time encloses a supported occurrence, not necessarily
the earliest contact and not a set of admitted movement poses. Rational witness
bounds need not mean every enclosed floating value is a contact; consumers cannot
use their midpoint as a confirmed pose. Conversion to simulation time retains
subtraction/multiplication uncertainty. Common displacement, zero relative motion,
closed endpoint contact and arbitrarily brief supported contact follow the same
continuous predicates, without temporal sampling to prove separation.

This remains selected source surface evidence. It does not authorize rotation,
changing joint angles, swept material-volume clearance, complete robot/scene pair
coverage, or intended-contact exceptions. No support/joint/tool-target exemption
or inferred harvest quality is introduced. Full motion admission must subsequently
prove those separate obligations before the session can move.

Acceptance: separated endpoints with an interior crossing, brief and endpoint
contact, coplanar sweep/edge grazing, common and zero relative motion, incompatible
axis time windows, transformed-source uncertainty, whole-interval expiry and
source/schema admission. Original static cases remain unchanged. Reuse the same
source/forward-frame preparation with one required FK per batch, no geometry or
bounds rebuilding and no persistent query cache.

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

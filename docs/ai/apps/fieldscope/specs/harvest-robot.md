# Harvest robot product contract

## Current milestone: M1

M1 provides pure, deterministic engineering assessments, not actuation, physics,
a trained detector, a scheduling service or a rendered robot. M2-M6 are defined
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
